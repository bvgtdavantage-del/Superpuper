import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SERVER_NAME = "scrapegraph-property";

function readPackageVersion(): string {
  // dist/version.js -> package.json sits one level up from the build output.
  const here = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(here, "..", "package.json"), "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "version" in parsed &&
    typeof (parsed as { version: unknown }).version === "string"
  ) {
    return (parsed as { version: string }).version;
  }
  throw new Error("package.json is missing a string `version` field");
}

export const SERVER_VERSION = readPackageVersion();
