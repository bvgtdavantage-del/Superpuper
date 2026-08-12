import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { PropertyClient } from "./client.js";
import { ScrapeGraphError } from "./client.js";
import type { ServerConfig } from "./config.js";
import { AREA_INSIGHTS_SCHEMA, LISTING_DETAIL_SCHEMA, LISTING_SUMMARY_SCHEMA } from "./extraction.js";
import {
  buildSearchUrl,
  describeFilters,
  PORTAL_IDS,
  portalDomain,
  PROPERTY_TYPES,
  PURPOSES,
  SORT_ORDERS,
  type PortalId,
  type SearchFilters,
} from "./portals.js";

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

function ok(payload: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] };
}

function fail(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

async function guarded(run: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ScrapeGraphError) return fail(error.message);
    return fail(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const priceField = z.number().int().positive();

export function registerTools(
  server: McpServer,
  client: PropertyClient,
  config: ServerConfig,
): void {
  server.registerTool(
    "search_properties",
    {
      title: "Search Dubai property listings",
      description:
        "Search live Dubai sale or rental listings and return them as structured records " +
        "(price, beds, size, location, agency, listing URL). Defaults to the configured portal; " +
        "use portal 'web' for a cross-site search, or pass searchUrl to scrape a portal search " +
        "page you have already composed.",
      inputSchema: {
        purpose: z.enum(PURPOSES).default("sale").describe("Whether to search sale or rental listings"),
        propertyType: z.enum(PROPERTY_TYPES).default("any").describe("Property category to filter by"),
        area: z
          .string()
          .min(2)
          .optional()
          .describe("Dubai community or tower, e.g. 'Dubai Marina', 'Palm Jumeirah', 'Business Bay'"),
        bedrooms: z.number().int().min(0).max(10).optional().describe("Bedroom count; 0 means studio"),
        priceMin: priceField.optional().describe("Minimum price in AED"),
        priceMax: priceField.optional().describe("Maximum price in AED"),
        sort: z.enum(SORT_ORDERS).default("relevance").describe("Result ordering"),
        limit: z.number().int().min(1).max(50).default(20).describe("Maximum listings to return"),
        portal: z
          .enum(PORTAL_IDS)
          .optional()
          .describe(
            `Listing source. Defaults to ${config.defaultPortal}. 'web' searches across sites instead of one portal.`,
          ),
        searchUrl: z
          .string()
          .url()
          .optional()
          .describe("Scrape this exact search-results URL instead of composing one from the filters"),
      },
    },
    async (args): Promise<ToolResult> =>
      guarded(async () => {
        const portal: PortalId = args.portal ?? config.defaultPortal;
        const filters: SearchFilters = {
          purpose: args.purpose,
          propertyType: args.propertyType,
          area: args.area,
          bedrooms: args.bedrooms,
          priceMin: args.priceMin,
          priceMax: args.priceMax,
          sort: args.sort,
        };

        if (
          args.priceMin !== undefined &&
          args.priceMax !== undefined &&
          args.priceMin > args.priceMax
        ) {
          return fail("priceMin must be less than or equal to priceMax.");
        }

        const described = describeFilters(filters);
        const prompt =
          `Extract every property listing shown on this page as a listings array. ` +
          `Return at most ${args.limit} listings. Prices are in AED. ` +
          `Give each listing's URL as an absolute URL. Treat a studio as bedrooms 0. ` +
          `Do not invent listings that are not on the page.`;

        if (args.searchUrl !== undefined) {
          const data = await client.extractStructured({
            url: args.searchUrl,
            prompt,
            schema: LISTING_SUMMARY_SCHEMA,
          });
          return ok({ source: { kind: "url", url: args.searchUrl }, query: described, results: data });
        }

        if (portal === "web") {
          const data = await client.searchStructured({
            query: `${described} site listings`,
            prompt,
            schema: LISTING_SUMMARY_SCHEMA,
            numResults: Math.min(10, args.limit),
          });
          return ok({ source: { kind: "web-search" }, query: described, results: data });
        }

        const url = buildSearchUrl(portal, filters);
        const data = await client.extractStructured({ url, prompt, schema: LISTING_SUMMARY_SCHEMA });
        return ok({ source: { kind: "portal", portal, url }, query: described, results: data });
      }),
  );

  server.registerTool(
    "get_listing_details",
    {
      title: "Get a Dubai listing's full details",
      description:
        "Scrape one property listing page into a structured record: price, size, beds, community, " +
        "developer, completion status, amenities, agent, RERA permit number and description. " +
        "Pass a listing URL returned by search_properties.",
      inputSchema: {
        url: z.string().url().describe("Absolute URL of the listing detail page"),
        includeDescription: z
          .boolean()
          .default(true)
          .describe("Include the listing's full marketing description text"),
        includeImages: z.boolean().default(false).describe("Include image URLs from the gallery"),
      },
    },
    async (args): Promise<ToolResult> =>
      guarded(async () => {
        const omissions: string[] = [];
        if (!args.includeDescription) omissions.push("description");
        if (!args.includeImages) omissions.push("images");
        const omissionClause =
          omissions.length > 0 ? ` Leave these fields empty: ${omissions.join(", ")}.` : "";

        const data = await client.extractStructured({
          url: args.url,
          prompt:
            `Extract the full details of this single property listing. Prices are in AED. ` +
            `Treat a studio as bedrooms 0. Only report fields the page actually states; ` +
            `leave anything absent empty rather than guessing.${omissionClause}`,
          schema: LISTING_DETAIL_SCHEMA,
        });
        return ok({ source: { kind: "listing", url: args.url }, listing: data });
      }),
  );

  server.registerTool(
    "get_area_insights",
    {
      title: "Get Dubai area and community insights",
      description:
        "Research a Dubai community and return structured market intel: average price per sqft, " +
        "average rent, gross rental yield, price trend, transaction volume, key developers, " +
        "amenities, and pros/cons. Useful for advisory and deal-memo work.",
      inputSchema: {
        area: z.string().min(2).describe("Dubai community, e.g. 'Jumeirah Village Circle'"),
        purpose: z
          .enum(PURPOSES)
          .default("sale")
          .describe("Whether to slant the research toward buying or renting"),
        propertyType: z.enum(PROPERTY_TYPES).default("any").describe("Narrow the research to one category"),
        portal: z
          .enum(PORTAL_IDS)
          .optional()
          .describe(
            "Restrict research to one portal's market pages. Defaults to 'web' for a broader view.",
          ),
      },
    },
    async (args): Promise<ToolResult> =>
      guarded(async () => {
        const portal: PortalId = args.portal ?? "web";
        const typeClause = args.propertyType === "any" ? "property" : args.propertyType;
        const purposeClause = args.purpose === "sale" ? "buying" : "renting";
        const siteClause =
          portal === "web" ? "" : ` Prefer sources on ${portalDomain(portal)}.`;

        const prompt =
          `Summarise the ${args.area} market in Dubai for ${typeClause} ${purposeClause}. ` +
          `Report figures in AED and state the period each figure covers. ` +
          `Only report numbers the sources actually give; leave a field empty rather than estimating.`;

        const data = await client.searchStructured({
          query:
            `${args.area} Dubai ${typeClause} market average price per sqft rental yield ` +
            `transactions trends${siteClause}`,
          prompt,
          schema: AREA_INSIGHTS_SCHEMA,
          numResults: 6,
        });
        return ok({ source: { kind: "web-search", portal }, area: args.area, insights: data });
      }),
  );

  server.registerTool(
    "check_credits",
    {
      title: "Check ScrapeGraphAI credits",
      description:
        "Report the remaining ScrapeGraphAI credit balance and plan for the configured API key. " +
        "Use this to confirm the server is authenticated before running a batch of searches.",
      inputSchema: {},
    },
    async (): Promise<ToolResult> =>
      guarded(async () => {
        const data = await client.credits();
        return ok({ credits: data });
      }),
  );
}
