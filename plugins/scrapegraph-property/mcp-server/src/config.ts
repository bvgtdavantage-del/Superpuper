import { PORTAL_IDS, type PortalId } from "./portals.js";

export interface ServerConfig {
  apiKey: string;
  defaultPortal: PortalId;
  timeoutMs: number;
}

const DEFAULT_TIMEOUT_MS = 60_000;
const MIN_TIMEOUT_MS = 5_000;
const MAX_TIMEOUT_MS = 300_000;

function parseTimeout(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return DEFAULT_TIMEOUT_MS;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`SGAI_PROPERTY_TIMEOUT_MS must be a number, got ${JSON.stringify(raw)}`);
  }
  if (parsed < MIN_TIMEOUT_MS || parsed > MAX_TIMEOUT_MS) {
    throw new Error(
      `SGAI_PROPERTY_TIMEOUT_MS must be between ${MIN_TIMEOUT_MS} and ${MAX_TIMEOUT_MS}, got ${parsed}`,
    );
  }
  return parsed;
}

function parsePortal(raw: string | undefined): PortalId {
  if (raw === undefined || raw.trim() === "") return "bayut";
  const candidate = raw.trim().toLowerCase();
  if ((PORTAL_IDS as readonly string[]).includes(candidate)) {
    return candidate as PortalId;
  }
  throw new Error(
    `SGAI_PROPERTY_DEFAULT_PORTAL must be one of ${PORTAL_IDS.join(", ")}, got ${JSON.stringify(raw)}`,
  );
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const apiKey = env.SGAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "SGAI_API_KEY is not set. Create a key at https://scrapegraphai.com and expose it to this server's environment.",
    );
  }
  return {
    apiKey,
    defaultPortal: parsePortal(env.SGAI_PROPERTY_DEFAULT_PORTAL),
    timeoutMs: parseTimeout(env.SGAI_PROPERTY_TIMEOUT_MS),
  };
}
