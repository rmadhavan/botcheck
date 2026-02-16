# BotCheck

**Check if AI can see your website — or if your blocks are actually working.**

Free, open source, no login, no account, no tracking. Paste a URL, get a straight answer.

---

## The Problem

AI crawlers are everywhere. GPTBot, ClaudeBot, PerplexityBot, CCBot, Bytespider — dozens of bots are hitting websites right now, scraping content for training data, search indexing, and AI-generated answers. Most website owners have no idea whether they're blocking these bots, accidentally invisible to them, or wide open.

The few tools that exist are closed source, require signups, and don't explain their scoring. You get a number and no real way to trust it.

---

## What BotCheck Does

You paste a URL. You pick your goal. You get a clear, scored report in seconds.

**Two modes:**

- **Block AI** — you want your content protected from AI training. BotCheck checks whether your defenses are actually working and flags what's slipping through.
- **Be Found by AI** — you want AI systems to index and cite your content. BotCheck checks whether you're accidentally invisible or blocking the wrong bots.

**Seven checks, every scan:**

| Check | What it looks for |
|---|---|
| robots.txt | 30+ known AI crawlers — allowed or blocked |
| Meta directives | noai, noimageai, noindex tags in page head |
| HTTP headers | X-Robots-Tag, Content-Type, Cache-Control, CORS |
| llms.txt | Presence and validity of the emerging llms.txt standard |
| Response stability | Latency and reliability — slow sites silently fail crawlers |
| Paywall detection | Login walls, 401s, redirects that block content access |
| Content structure | Semantic HTML quality for AI readability |

Results are scored 0–100. The scoring weights are fully public. No black box.

---

## What Makes This Different

Most tools check robots.txt and stop there. BotCheck goes deeper, serves both audiences (block and allow), and is honest about what can and can't be guaranteed — robots.txt is advisory, not enforcement. Reputable crawlers respect it. Others don't. BotCheck tells you what's configured, not what's certain.

Everything is open source. The bot list is a community-maintained data file. Anyone can contribute new bot signatures, fix detection logic, or self-host the whole thing.

---

## Principles

- **No login, no account.** Ever. Just a URL and a result.
- **No data stored.** URLs are not logged or retained.
- **Transparent scoring.** Every weight in the algorithm is documented and public.
- **Community maintained.** No company behind this. No VC. No roadmap driven by monetization.
- **Always free.** If ads ever appear, they will be minimal and non-intrusive. The core tool stays free forever.

---

## Tech Stack

- **Frontend + API:** Next.js (TypeScript) — single repo, serverless API routes
- **Hosting:** Cloudflare Pages — free tier, no commercial use restrictions, global edge network
- **Bot list:** Community-maintained YAML file, open to pull requests
- **No database.** No user accounts. No session storage. Stateless by design.

---

## Status

This project is in active development. Contributions welcome — especially new bot signatures, improved detection logic, and translations.

**GitHub:** `github.com/botcheck-dev/botcheck`
**Live:** `botcheck.app`

---

*A community project. No company, no login, no tracking.*