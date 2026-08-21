---
name: scrapegraph-property
description: Research Dubai property with live listing data. Use for any task that needs real listings, real prices, or real community market figures — comparables for a valuation, a shortlist for a buyer, listing copy grounded in actual specs, a deal memo, or a rent-versus-buy or area-versus-area comparison. Backed by the scrapegraph-property MCP server.
---

# Dubai Property Research

Four MCP tools sit behind this skill: `search_properties`, `get_listing_details`,
`get_area_insights`, and `check_credits`. Every call spends ScrapeGraphAI
credits, so plan the sequence before firing.

## Pick the right tool

| The user wants | Call |
|---|---|
| A shortlist, a price range, or comparables | `search_properties` |
| Everything about one property they linked | `get_listing_details` |
| Whether an area is worth buying into | `get_area_insights` |
| To know why calls are failing | `check_credits` |

Search first, then expand. `search_properties` returns listing URLs; feed the
two or three that matter into `get_listing_details` rather than expanding all
twenty. A shortlist of twenty summaries plus three deep dives answers almost
every question at a fraction of the cost of twenty deep dives.

## Searching well

Filters map to portal filters, so narrow them there rather than pulling a wide
result set and filtering yourself:

```
search_properties(purpose="sale", propertyType="apartment",
                  area="Dubai Marina", bedrooms=2,
                  priceMin=1500000, priceMax=3000000,
                  sort="price_asc", limit=20)
```

- `bedrooms: 0` means studio, not "unspecified" — omit the field for unspecified.
- Prices are AED. For rentals, the result's `pricePeriod` tells you whether a
  figure is yearly or monthly; do not assume yearly.
- `sort: "newest"` matters for a market-temperature read; `price_asc` matters
  for a value hunt.

If results look wrong for the filters — an empty list, or listings that ignore
the price band — the portal has probably changed its URL shape. Do not retry the
same call. Either pass a `searchUrl` you composed by hand, or switch to
`portal: "web"`, which builds no URL at all.

## Reading the data honestly

The extraction schemas mark almost every field optional, and the prompts tell
the extractor to leave a field empty rather than guess. So an absent field means
the page did not state it. Report it as unknown; do not fill the gap with a
typical value for the area.

Two fields carry more weight than the rest when advising a buyer:

- `reraPermitNumber` — a Dubai listing without a RERA/DLD permit number is worth
  flagging, not just noting.
- `completionStatus` and `handoverDate` — off-plan changes the risk profile,
  the payment plan, and the yield maths entirely. Never present an off-plan
  listing's price alongside ready-property comparables without saying so.

`get_area_insights` returns figures that come with a period attached. Quote the
period with the number. "AED 1,450/sqft" is not a fact on its own; "AED
1,450/sqft over the last twelve months" is.

## Cost discipline

- `check_credits` before a batch, not after it fails.
- One `search_properties` with `limit=20` costs far less than four searches with
  `limit=5`.
- `get_listing_details` with `includeImages=false` (the default) is cheaper and
  is what you want unless the user asked for the gallery.

## What this cannot tell you

Listing prices are asking prices. They are not transaction prices, and in Dubai
the gap between the two is real and varies by community and by cycle. When the
user's question turns on what something actually sold for, say that these tools
show asking prices and point them at DLD transaction data for the rest.
