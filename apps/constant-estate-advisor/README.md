# Constant Estate — AI Property Advisor

A single-screen React chat app for Constant Estate (Dubai brokerage, Constant
Private family office). Navy / gold / ivory look, EN/RU interface, five desk
functions, each backed by its own Claude system prompt:

| Mode | Purpose |
|---|---|
| Advisor | Dubai market questions, buyer/seller guidance, area intel |
| Listing Writer | Raw property details → institutional-grade listing copy |
| Lead Qualifier | Inquiry text → verdict, profile, risk line, reply draft |
| Deal Memo | Asset details → one-screen investment memo for a principal |
| Negotiation | Standoff description → two labeled message drafts |

## Run locally

```bash
npm install
cp .env.example .env   # add VITE_ANTHROPIC_API_KEY
npm run dev
```

## API access

The component calls `POST https://api.anthropic.com/v1/messages` with model
`claude-sonnet-4-6` directly from the browser.

- **Inside a claude.ai artifact** no key is needed — the artifact runtime
  proxies the request.
- **Standalone** the request needs `x-api-key`, `anthropic-version`, and
  `anthropic-dangerous-direct-browser-access: true`; these are added
  automatically when `VITE_ANTHROPIC_API_KEY` is set.

A key bundled into client-side JavaScript is visible to anyone who opens the
page. That is fine for personal/local use; for any public deployment, route
the call through a small backend proxy instead.
