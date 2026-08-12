import { ScrapeGraphAI, type ScrapeGraphAIClient } from "scrapegraph-js";
import type { ServerConfig } from "./config.js";

export class ScrapeGraphError extends Error {
  constructor(operation: string, detail: string) {
    super(`ScrapeGraphAI ${operation} failed: ${detail}`);
    this.name = "ScrapeGraphError";
  }
}

export interface PropertyClient {
  extractStructured(params: {
    url: string;
    prompt: string;
    schema: Record<string, unknown>;
  }): Promise<unknown>;
  searchStructured(params: {
    query: string;
    prompt: string;
    schema: Record<string, unknown>;
    numResults: number;
  }): Promise<unknown>;
  credits(): Promise<unknown>;
}

export function createPropertyClient(config: ServerConfig): PropertyClient {
  const sgai: ScrapeGraphAIClient = ScrapeGraphAI({ apiKey: config.apiKey });

  const fetchConfig = {
    mode: "js",
    stealth: true,
    timeout: config.timeoutMs,
    country: "ae",
  } as const;

  function unwrap<T>(operation: string, result: { status: string; data: T | null; error?: string }): T {
    if (result.status !== "success" || result.data === null) {
      throw new ScrapeGraphError(operation, result.error ?? "no data returned");
    }
    return result.data;
  }

  return {
    async extractStructured({ url, prompt, schema }) {
      const result = await sgai.extract({ url, prompt, schema, fetchConfig });
      return unwrap("extract", result);
    },

    async searchStructured({ query, prompt, schema, numResults }) {
      const result = await sgai.search({ query, prompt, schema, numResults, fetchConfig });
      return unwrap("search", result);
    },

    async credits() {
      const result = await sgai.credits();
      return unwrap("credits", result);
    },
  };
}
