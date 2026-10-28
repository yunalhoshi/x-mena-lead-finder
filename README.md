# X MENA Lead Finder

Finds **Arabic-speaking gaming creators on X** who are actively posting about the games you target, and saves them as a ranked lead list. Built for creator and coach partnership outreach in the MENA region.

> **About this repository:** the original MENA lead scraper (Node.js + Playwright) was built inside a company outreach system and is not published. This is a short rewrite that uses the **official X API v2** instead of browser scraping, which keeps it within X's rules.

## What it does

- Builds a recent-search query: any of the target games, in the target language, original posts only (`lang:ar -is:retweet -is:reply`).
- Pages through results with author expansion, so each post comes with its author's profile.
- Keeps creators inside a follower range, counts how many matching posts each one made, and keeps a sample post link.
- Extracts **publicly listed** business emails and Discord invites from bios.
- Waits out rate limits using the API's reset header.
- Ranks by matching posts, then followers, and writes a CSV.

Works for any language X supports (`--lang tr`, `--lang es`, ...).

## Run

```bash
export X_BEARER_TOKEN=...      # X developer portal, app with recent search access
node finder.mjs --games "cs2,valorant,pubg mobile" --lang ar --min 1000 --max 200000 --out leads.csv
npm test                       # offline tests for query building, filtering and CSV output
```

Use contacts in line with X's developer terms and local email rules (opt-out, no bulk spam).

## Tech stack

Node.js 20 (no dependencies) · X API v2 · node:test

---

© 2026 yunalhoshi. All rights reserved. See [NOTICE](NOTICE).
