// JSON Schemas handed to ScrapeGraphAI so extraction returns a stable shape
// regardless of which portal the page came from.

export const LISTING_SUMMARY_SCHEMA = {
  type: "object",
  properties: {
    listings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "Listing headline as shown on the card" },
          url: { type: "string", description: "Absolute URL to the listing detail page" },
          price: { type: "number", description: "Numeric price with no currency symbol or separators" },
          currency: { type: "string", description: "Currency code, normally AED" },
          pricePeriod: {
            type: "string",
            description: "For rentals: yearly, monthly, weekly or daily. Empty for sales.",
          },
          bedrooms: { type: "number", description: "Bedroom count; 0 for a studio" },
          bathrooms: { type: "number" },
          areaSqft: { type: "number", description: "Built-up area in square feet" },
          propertyType: { type: "string", description: "Apartment, Villa, Townhouse, Penthouse, Plot or Office" },
          location: { type: "string", description: "Tower / community / sub-community as displayed" },
          agency: { type: "string" },
          isVerified: { type: "boolean", description: "Whether the portal marks the listing as verified" },
        },
        required: ["title", "url"],
      },
    },
    totalResultsText: {
      type: "string",
      description: "The portal's own result-count text, verbatim, if the page shows one",
    },
  },
  required: ["listings"],
} as const;

export const LISTING_DETAIL_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    referenceId: { type: "string", description: "Portal or broker reference number" },
    price: { type: "number" },
    currency: { type: "string" },
    pricePeriod: { type: "string", description: "For rentals: yearly, monthly, weekly or daily" },
    purpose: { type: "string", description: "sale or rent" },
    propertyType: { type: "string" },
    bedrooms: { type: "number", description: "0 for a studio" },
    bathrooms: { type: "number" },
    areaSqft: { type: "number", description: "Built-up area in square feet" },
    plotAreaSqft: { type: "number" },
    location: { type: "string", description: "Full location string, most specific first" },
    community: { type: "string" },
    developer: { type: "string" },
    completionStatus: { type: "string", description: "Ready or Off-Plan" },
    handoverDate: { type: "string" },
    furnishing: { type: "string", description: "Furnished, Unfurnished or Partly Furnished" },
    amenities: { type: "array", items: { type: "string" } },
    description: { type: "string", description: "The listing's own description text" },
    images: { type: "array", items: { type: "string" }, description: "Absolute image URLs" },
    agentName: { type: "string" },
    agency: { type: "string" },
    reraPermitNumber: { type: "string", description: "RERA / DLD permit or trakheesi number if shown" },
    listedDate: { type: "string" },
    serviceCharge: { type: "string" },
  },
  required: ["title"],
} as const;

export const AREA_INSIGHTS_SCHEMA = {
  type: "object",
  properties: {
    area: { type: "string" },
    summary: { type: "string", description: "Two or three sentences on the area's character and buyer profile" },
    averageSalePricePerSqft: { type: "number", description: "In AED" },
    averageRentYearly: { type: "number", description: "In AED" },
    grossRentalYieldPercent: { type: "number" },
    priceTrend: { type: "string", description: "Recent direction of prices with the period it covers" },
    transactionVolume: { type: "string", description: "Recent transaction counts with the period they cover" },
    popularPropertyTypes: { type: "array", items: { type: "string" } },
    keyDevelopers: { type: "array", items: { type: "string" } },
    amenities: { type: "array", items: { type: "string" }, description: "Schools, malls, metro, beach access" },
    pros: { type: "array", items: { type: "string" } },
    cons: { type: "array", items: { type: "string" } },
  },
  required: ["area", "summary"],
} as const;
