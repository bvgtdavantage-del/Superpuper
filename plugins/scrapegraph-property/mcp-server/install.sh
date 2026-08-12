#!/usr/bin/env bash
# Install and build the scrapegraph-property MCP server.
#
#   ./install.sh sgai-yourkey
#
# The key may also come from the environment instead of the command line, which
# keeps it out of your shell history:
#
#   SGAI_API_KEY=sgai-yourkey ./install.sh

set -euo pipefail

readonly MIN_NODE_MAJOR=22
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

die() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

api_key="${1:-${SGAI_API_KEY:-}}"
if [ -z "$api_key" ]; then
  die "no API key given. Usage: ./install.sh sgai-yourkey  (or set SGAI_API_KEY)"
fi
if [ "$api_key" = "sgai-YOURKEY" ] || [ "$api_key" = "your-key-here" ]; then
  die "that is the placeholder from the docs, not a real key. Get one at https://scrapegraphai.com"
fi

command -v node >/dev/null 2>&1 || die "node is not installed. Node ${MIN_NODE_MAJOR}+ is required."
command -v npm >/dev/null 2>&1 || die "npm is not installed."

node_major="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$node_major" -lt "$MIN_NODE_MAJOR" ]; then
  die "Node ${MIN_NODE_MAJOR}+ is required, found $(node --version)."
fi

cd "$SCRIPT_DIR"

printf 'Installing dependencies...\n'
npm install --no-audit --no-fund

printf 'Building...\n'
npm run build

# Written with restrictive permissions before the key goes in, so the secret is
# never briefly world-readable.
env_file="$SCRIPT_DIR/.env"
umask 077
: > "$env_file"
printf 'SGAI_API_KEY=%s\n' "$api_key" >> "$env_file"
printf 'SGAI_PROPERTY_DEFAULT_PORTAL=bayut\n' >> "$env_file"
printf 'SGAI_PROPERTY_TIMEOUT_MS=60000\n' >> "$env_file"

version="$(node dist/index.js --version)"

cat <<EOF

Installed scrapegraph-property ${version}

Wrote ${env_file} (mode 600). It is gitignored — keep it that way.

Add this to your MCP client config:

  {
    "mcpServers": {
      "scrapegraph-property": {
        "command": "node",
        "args": ["${SCRIPT_DIR}/dist/index.js"],
        "env": { "SGAI_API_KEY": "<your key>" }
      }
    }
  }

Verify by hand:

  node ${SCRIPT_DIR}/dist/index.js --help

EOF

if [ -n "${1:-}" ]; then
  cat <<'EOF'
Note: the key was passed as an argument, so it is now in your shell history.
To drop the last entry -- bash: history -d -1 && history -w
                          zsh:  exec zsh, then remove the line from ~/.zsh_history

EOF
fi
