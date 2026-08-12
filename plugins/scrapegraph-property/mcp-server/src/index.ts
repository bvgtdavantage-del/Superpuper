#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createPropertyClient } from "./client.js";
import { loadConfig } from "./config.js";
import { registerTools } from "./tools.js";
import { SERVER_NAME, SERVER_VERSION } from "./version.js";

const USAGE = `${SERVER_NAME} ${SERVER_VERSION}

An MCP server exposing Dubai property listing search, listing detail, and area
insights, backed by the ScrapeGraphAI managed API. It speaks MCP over stdio and
is normally launched by an MCP client rather than run by hand.

Usage:
  scrapegraph-property-mcp-server [--version] [--help]

Environment:
  SGAI_API_KEY                  Required. ScrapeGraphAI API key.
  SGAI_PROPERTY_DEFAULT_PORTAL  Optional. bayut | propertyfinder | dubizzle | web. Default: bayut.
  SGAI_PROPERTY_TIMEOUT_MS      Optional. Per-request timeout, 5000-300000. Default: 60000.
`;

async function main(argv: string[]): Promise<number> {
  if (argv.includes("--version") || argv.includes("-v")) {
    process.stdout.write(`${SERVER_VERSION}\n`);
    return 0;
  }
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(USAGE);
    return 0;
  }

  const config = loadConfig();
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  registerTools(server, createPropertyClient(config), config);

  await server.connect(new StdioServerTransport());
  return 0;
}

main(process.argv.slice(2))
  .then((code) => {
    if (code !== 0) process.exit(code);
  })
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
