// Finds Arabic-speaking gaming creators on X through the official API v2 recent search.
// Usage: X_BEARER_TOKEN=... node finder.mjs --games "cs2,valorant" --lang ar --min 1000 --max 200000 --out leads.csv
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const API = 'https://api.x.com/2/tweets/search/recent';
const CONTACT = /[\w.+-]+@[\w-]+\.[\w.-]+|discord\.gg\/\w+/gi;

export function buildQuery(games, lang) {
  // Original posts only, in the target language, about any of the games.
  return `(${games.map((g) => (g.includes(' ') ? `"${g}"` : g)).join(' OR ')}) lang:${lang} -is:retweet -is:reply`;
}

export function collect(pages, { min, max }) {
  const users = new Map();
  for (const page of pages) {
    const byId = new Map((page.includes?.users || []).map((u) => [u.id, u]));
    for (const t of page.data || []) {
      const u = byId.get(t.author_id);
      if (!u) continue;
      const followers = u.public_metrics?.followers_count ?? 0;
      if (followers < min || followers > max) continue;
      const prev = users.get(u.id);
      users.set(u.id, {
        handle: u.username, name: u.name, url: `https://x.com/${u.username}`, followers,
        location: u.location || '', bio: (u.description || '').replace(/\s+/g, ' '),
        contacts: [...new Set((u.description || '').match(CONTACT) || [])].join(' '),
        matching_posts: (prev?.matching_posts || 0) + 1,
        sample_post: prev?.sample_post || `https://x.com/${u.username}/status/${t.id}`,
      });
    }
  }
  return [...users.values()].sort((a, b) => b.matching_posts - a.matching_posts || b.followers - a.followers);
}

export function toCsv(rows) {
  if (!rows.length) return 'handle\n';
  const cols = Object.keys(rows[0]);
  const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n';
}

async function search(query, token, maxPages) {
  const pages = []; let next;
  for (let i = 0; i < maxPages; i++) {
    const p = new URLSearchParams({ query, max_results: '100', expansions: 'author_id',
      'user.fields': 'public_metrics,description,location', 'tweet.fields': 'created_at' });
    if (next) p.set('next_token', next);
    const res = await fetch(`${API}?${p}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 429) { // wait for the rate-limit window, then retry this page
      const reset = Number(res.headers.get('x-rate-limit-reset')) * 1000;
      await new Promise((r) => setTimeout(r, Math.max(1000, reset - Date.now())));
      i--; continue;
    }
    if (!res.ok) throw new Error(`X API ${res.status}: ${await res.text()}`);
    const page = await res.json();
    pages.push(page);
    next = page.meta?.next_token;
    if (!next) break;
  }
  return pages;
}

async function main() {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) { console.error('Set X_BEARER_TOKEN (see .env.example).'); process.exit(1); }
  const games = arg('--games', 'cs2,valorant').split(',').map((s) => s.trim()).filter(Boolean);
  const query = buildQuery(games, arg('--lang', 'ar'));
  const pages = await search(query, token, Number(arg('--pages', 5)));
  const rows = collect(pages, { min: Number(arg('--min', 1000)), max: Number(arg('--max', 200000)) });
  const out = arg('--out', 'x_leads.csv');
  fs.writeFileSync(out, toCsv(rows));
  console.log(`query: ${query}\n${rows.length} creators saved to ${out}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
