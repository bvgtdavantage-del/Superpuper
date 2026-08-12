// Portal search-URL construction.
//
// These URL shapes are the one part of this server that depends on third-party
// site structure rather than on a documented API, so they are all kept here.
// When a portal changes its routing, this file is the only thing that needs to
// move. Callers that hit a stale pattern can bypass it entirely by passing an
// explicit `searchUrl` to search_properties, or by using the `web` portal,
// which goes through ScrapeGraphAI's search service and builds no URL at all.

export const PORTAL_IDS = ["bayut", "propertyfinder", "dubizzle", "web"] as const;
export type PortalId = (typeof PORTAL_IDS)[number];

export const PURPOSES = ["sale", "rent"] as const;
export type Purpose = (typeof PURPOSES)[number];

export const PROPERTY_TYPES = [
  "any",
  "apartment",
  "villa",
  "townhouse",
  "penthouse",
  "plot",
  "office",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const SORT_ORDERS = ["relevance", "price_asc", "price_desc", "newest"] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export interface SearchFilters {
  purpose: Purpose;
  propertyType: PropertyType;
  area?: string | undefined;
  bedrooms?: number | undefined;
  priceMin?: number | undefined;
  priceMax?: number | undefined;
  sort: SortOrder;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BAYUT_TYPE_SEGMENT: Record<PropertyType, string> = {
  any: "property",
  apartment: "apartments",
  villa: "villas",
  townhouse: "townhouses",
  penthouse: "penthouse",
  plot: "plots",
  office: "offices",
};

const BAYUT_SORT: Record<SortOrder, string | undefined> = {
  relevance: undefined,
  price_asc: "price_asc",
  price_desc: "price_desc",
  newest: "date_desc",
};

function buildBayutUrl(filters: SearchFilters): string {
  const purposeSegment = filters.purpose === "sale" ? "for-sale" : "to-rent";
  const segments = [purposeSegment, BAYUT_TYPE_SEGMENT[filters.propertyType], "dubai"];
  if (filters.area) segments.push(slugify(filters.area));

  const url = new URL(`https://www.bayut.com/${segments.join("/")}/`);
  if (filters.priceMin !== undefined) url.searchParams.set("price_min", String(filters.priceMin));
  if (filters.priceMax !== undefined) url.searchParams.set("price_max", String(filters.priceMax));
  if (filters.bedrooms !== undefined) url.searchParams.set("beds_in", String(filters.bedrooms));
  const sort = BAYUT_SORT[filters.sort];
  if (sort) url.searchParams.set("sort", sort);
  return url.toString();
}

const PROPERTY_FINDER_TYPE: Record<PropertyType, string | undefined> = {
  any: undefined,
  apartment: "1",
  villa: "35",
  townhouse: "22",
  penthouse: "24",
  plot: "5",
  office: "4",
};

const PROPERTY_FINDER_SORT: Record<SortOrder, string | undefined> = {
  relevance: undefined,
  price_asc: "pa",
  price_desc: "pd",
  newest: "mr",
};

function buildPropertyFinderUrl(filters: SearchFilters): string {
  const url = new URL("https://www.propertyfinder.ae/en/search");
  url.searchParams.set("c", filters.purpose === "sale" ? "1" : "2");
  const type = PROPERTY_FINDER_TYPE[filters.propertyType];
  if (type) url.searchParams.set("t", type);
  if (filters.area) url.searchParams.set("q", filters.area);
  if (filters.priceMin !== undefined) url.searchParams.set("pf", String(filters.priceMin));
  if (filters.priceMax !== undefined) url.searchParams.set("pt", String(filters.priceMax));
  if (filters.bedrooms !== undefined) url.searchParams.set("bdr[]", String(filters.bedrooms));
  const sort = PROPERTY_FINDER_SORT[filters.sort];
  if (sort) url.searchParams.set("ob", sort);
  return url.toString();
}

const DUBIZZLE_TYPE_SEGMENT: Record<PropertyType, string> = {
  any: "",
  apartment: "apartmentflat/",
  villa: "villahouse/",
  townhouse: "townhouse/",
  penthouse: "penthouse/",
  plot: "land/",
  office: "commercial-for-rent/offices/",
};

function buildDubizzleUrl(filters: SearchFilters): string {
  const purposeSegment =
    filters.purpose === "sale" ? "property-for-sale" : "property-for-rent";
  const url = new URL(
    `https://dubai.dubizzle.com/${purposeSegment}/residential/${DUBIZZLE_TYPE_SEGMENT[filters.propertyType]}`,
  );
  if (filters.priceMin !== undefined) url.searchParams.set("price__gte", String(filters.priceMin));
  if (filters.priceMax !== undefined) url.searchParams.set("price__lte", String(filters.priceMax));
  if (filters.bedrooms !== undefined) url.searchParams.set("bedrooms", String(filters.bedrooms));
  if (filters.area) url.searchParams.set("keywords", filters.area);
  return url.toString();
}

export function buildSearchUrl(portal: Exclude<PortalId, "web">, filters: SearchFilters): string {
  switch (portal) {
    case "bayut":
      return buildBayutUrl(filters);
    case "propertyfinder":
      return buildPropertyFinderUrl(filters);
    case "dubizzle":
      return buildDubizzleUrl(filters);
  }
}

const PORTAL_DOMAIN: Record<Exclude<PortalId, "web">, string> = {
  bayut: "bayut.com",
  propertyfinder: "propertyfinder.ae",
  dubizzle: "dubizzle.com",
};

export function portalDomain(portal: Exclude<PortalId, "web">): string {
  return PORTAL_DOMAIN[portal];
}

export function describeFilters(filters: SearchFilters): string {
  const parts: string[] = [];
  parts.push(filters.propertyType === "any" ? "property" : filters.propertyType);
  parts.push(filters.purpose === "sale" ? "for sale" : "for rent");
  parts.push(`in ${filters.area ? `${filters.area}, Dubai` : "Dubai"}`);
  if (filters.bedrooms !== undefined) {
    parts.push(filters.bedrooms === 0 ? "(studio)" : `(${filters.bedrooms} bed)`);
  }
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const min = filters.priceMin !== undefined ? `AED ${filters.priceMin.toLocaleString("en-US")}` : "any";
    const max = filters.priceMax !== undefined ? `AED ${filters.priceMax.toLocaleString("en-US")}` : "any";
    parts.push(`priced ${min} to ${max}`);
  }
  return parts.join(" ");
}
