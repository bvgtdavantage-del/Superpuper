# ScrapeGraph Property

Dubai property research for Codex, backed by a bundled MCP server that calls the
[ScrapeGraphAI managed API](https://scrapegraphai.com). The API handles JS
rendering, stealth fetching and proxies, so the tools here return structured
records rather than raw HTML.

Pairs with `apps/constant-estate-advisor` in this repo: the advisor's Listing
Writer, Deal Memo and Negotiation modes all want live comparables, and these
tools supply them.

## Tools

| Tool | What it does |
|---|---|
| `search_properties` | Search live sale or rental listings and return structured records — price, beds, size, location, agency, listing URL |
| `get_listing_details` | Expand one listing URL into full detail — developer, completion status, handover, amenities, agent, RERA permit, description |
| `get_area_insights` | Community-level market intel — price per sqft, average rent, gross yield, price trend, transaction volume, pros/cons |
| `check_credits` | Report the remaining ScrapeGraphAI credit balance and plan for the configured key |

`search_properties` and `get_area_insights` accept a `portal` of `bayut`,
`propertyfinder`, `dubizzle`, or `web`. The `web` portal goes through
ScrapeGraphAI's search service and queries across sites instead of one portal.

## Setup

The server is bundled as source; `dist/` is not committed, so build it once.
`install.sh` does the whole setup — Node version check, install, build, a
`600`-mode `.env`, and a printed client config block:

```bash
cd plugins/scrapegraph-property/mcp-server
./install.sh sgai-yourkey
```

Pass the key through the environment instead to keep it out of your shell
history:

```bash
SGAI_API_KEY=sgai-yourkey ./install.sh
```

Or do it by hand:

```bash
cd plugins/scrapegraph-property/mcp-server
npm install
npm run build
node dist/index.js --version
export SGAI_API_KEY=your-key-here
```

Get a key from the [ScrapeGraphAI dashboard](https://scrapegraphai.com).

`.mcp.json` launches the built entry point at
`${CODEX_PLUGIN_ROOT}/mcp-server/dist/index.js`. If your MCP client does not
expand `${CODEX_PLUGIN_ROOT}`, replace that argument with an absolute path.

### Environment

| Variable | Required | Default | Notes |
|---|---|---|---|
| `SGAI_API_KEY` | yes | — | Server refuses to start without it |
| `SGAI_PROPERTY_DEFAULT_PORTAL` | no | `bayut` | `bayut`, `propertyfinder`, `dubizzle` or `web` |
| `SGAI_PROPERTY_TIMEOUT_MS` | no | `60000` | Per-request fetch timeout, 5000–300000 |

The server reads `.env` from `mcp-server/` when present. Real environment
variables take precedence, so the `env` block in `.mcp.json` always wins.

## A note on portal URLs

Everything except the search-URL construction runs against a documented API. The
portal URL patterns in `mcp-server/src/portals.ts` depend on third-party site
routing, which changes without notice, and they could not be verified against
the live portals from the sandbox this was written in. They are all isolated in
that one file for that reason.

Two escape hatches exist when a pattern goes stale:

- pass `searchUrl` to `search_properties` to scrape a search page you composed
  yourself, bypassing the builder entirely;
- use `portal: "web"`, which builds no URL and goes through ScrapeGraphAI's
  search service.

## Costs and terms

ScrapeGraphAI bills per credit, so each tool call costs money — `check_credits`
before a large batch. Scraping listing portals is also subject to those portals'
terms of service; check what your account and jurisdiction permit before running
volume against them.
