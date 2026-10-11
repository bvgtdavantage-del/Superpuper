#!/usr/bin/env python3
"""Generate .claude-plugin/marketplace.json from the Codex plugin manifests."""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLUGINS = ROOT / "plugins"
CODEX_MARKETPLACE = ROOT / ".agents" / "plugins" / "marketplace.json"
OUTPUT = ROOT / ".claude-plugin" / "marketplace.json"

# Codex expands ${CODEX_PLUGIN_ROOT} in .mcp.json; Claude Code does not, so these
# servers are redefined with ${CLAUDE_PLUGIN_ROOT}. An inline mcpServers block in
# the marketplace entry replaces the plugin's own .mcp.json.
MCP_OVERRIDES = {
    "scrapegraph-property": {
        "scrapegraph-property": {
            "command": "node",
            "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-server/dist/index.js"],
        }
    }
}


def claude_components(plugin_dir):
    found = []
    if any((plugin_dir / "skills").glob("*/SKILL.md")):
        found.append("skills")
    if any((plugin_dir / "agents").glob("*.md")):
        found.append("agents")
    if any((plugin_dir / "commands").glob("*.md")):
        found.append("commands")
    if (plugin_dir / ".mcp.json").is_file():
        found.append("mcp")
    return found


def plugin_order():
    codex = json.loads(CODEX_MARKETPLACE.read_text())
    listed = [p["name"] for p in codex["plugins"]]
    unlisted = sorted(p.name for p in PLUGINS.iterdir() if p.is_dir() and p.name not in listed)
    return listed + unlisted


def entry(name):
    plugin_dir = PLUGINS / name
    manifest = json.loads((plugin_dir / ".codex-plugin" / "plugin.json").read_text())
    if manifest["name"] != name:
        raise SystemExit(f"{name}: plugin.json name {manifest['name']!r} does not match its directory")
    item = {
        "name": name,
        "description": manifest["description"],
        "source": f"./plugins/{name}",
        "strict": False,
    }
    for key in ("author", "homepage", "repository", "license", "keywords"):
        if key in manifest:
            item[key] = manifest[key]
    category = manifest.get("interface", {}).get("category")
    if category:
        item["category"] = category.lower()
    if name in MCP_OVERRIDES:
        item["mcpServers"] = MCP_OVERRIDES[name]
    return item


def build():
    plugins = [entry(name) for name in plugin_order() if claude_components(PLUGINS / name)]
    marketplace = {
        "name": "superpuper",
        "owner": {"name": "bvgtdavantage-del"},
        "metadata": {
            "description": "Claude Code builds of the Superpuper plugin collection: every plugin that ships skills, agents, commands or MCP servers",
        },
        "plugins": plugins,
    }
    return json.dumps(marketplace, indent=2, ensure_ascii=False) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="exit 1 if the committed file is out of date")
    args = parser.parse_args()
    content = build()
    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_text() != content:
            sys.stderr.write(f"{OUTPUT.relative_to(ROOT)} is stale; run {Path(__file__).relative_to(ROOT)}\n")
            return 1
        return 0
    OUTPUT.parent.mkdir(exist_ok=True)
    OUTPUT.write_text(content)
    return 0


if __name__ == "__main__":
    sys.exit(main())
