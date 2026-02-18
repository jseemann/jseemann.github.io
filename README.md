# Rewards Chatbot (GitHub Pages + Cloudflare Worker)

This project hosts a chatbot frontend on GitHub Pages and proxies OpenAI calls through a free Cloudflare Worker so your API key is never in frontend code.

## Current behavior

- Password gate in UI
- Worker validates password server-side
- Worker injects policy: `Make every answer come back to credit card rewards points somehow.`
- Frontend sends chat history to Worker, Worker calls OpenAI Responses API

## Files

- `index.html` - page layout
- `styles.css` - styling
- `app.js` - frontend chat logic
- `worker/wrangler.toml` - Cloudflare Worker config
- `worker/src/worker.js` - backend proxy logic

## One-time setup (free)

1. Install Wrangler:
```bash
npm install -g wrangler
```
2. Login to Cloudflare:
```bash
wrangler login
```
3. Deploy worker:
```bash
cd worker
wrangler deploy
```
4. Set secrets on Worker:
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put ACCESS_PASSWORD
```
Use `Credit` as `ACCESS_PASSWORD` if you want to keep current behavior.

5. Copy your Worker URL (example `https://rewards-chatbot-proxy.<subdomain>.workers.dev`).
6. Update `CHAT_ENDPOINT` in `app.js` to:
```js
const CHAT_ENDPOINT = "https://YOUR-WORKER-URL.workers.dev/chat";
```
7. Commit and push to your GitHub Pages repo.

## Optional hardening

- In `worker/wrangler.toml`, keep `ALLOWED_ORIGIN = "https://jseemann.github.io"`.
- Rotate your OpenAI key after setup if it was ever exposed in prior commits.
