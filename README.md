# Simple GitHub Pages Chatbot

This is a minimal static chatbot UI you can host on GitHub Pages (`github.io`).

## What it does

- Single-page chat interface
- Calls OpenAI from the browser using your API key
- Saves API key + model in local browser storage

## Important security note

This version is intentionally simple. It runs fully client-side, so your key lives in the browser.
For real production use, route requests through your own backend and keep API keys server-side.

## Run locally

Open `index.html` in a browser.

## Publish to GitHub Pages

## Option A: User site (`<username>.github.io`)

1. Create a repo named exactly `<username>.github.io`.
2. Add these files to the repo root.
3. Push to `main`.
4. Site will publish at `https://<username>.github.io/`.

## Option B: Project site

1. Create any repo name (example: `chatbot`).
2. Push these files to `main`.
3. In GitHub repo settings, go to Pages.
4. Set source to `Deploy from a branch`.
5. Select branch `main` and folder `/ (root)`.
6. Site will publish at `https://<username>.github.io/<repo>/`.

## Files

- `index.html` - layout
- `styles.css` - styling
- `app.js` - chat logic and API requests
