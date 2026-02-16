# BotCheck

See which AI crawlers are allowed or blocked on your site based on your current configuration.

**Live at [botcheck.app](https://botcheck.app)**

## What it does

BotCheck scans a URL and runs 7 checks against it:

- **robots.txt** rules for 30+ AI crawlers (GPTBot, ClaudeBot, Google-Extended, etc.)
- **Meta directives** like `noai`, `noimageai`, and `noindex`
- **HTTP headers** such as `X-Robots-Tag`
- **AI discovery files** like `llms.txt`, `ai.txt`, and `ai-plugin.json`
- **Response speed** and availability
- **Paywall and login wall** detection
- **HTML content structure** quality

Each check gets a score from 0-100 and they are combined using weighted averages. Weights change based on the selected mode ("Be Found by AI" vs "Block AI").

## No tracking

BotCheck is completely stateless. No database, no user accounts, no logging. Scan history is stored in your browser's localStorage and never leaves your device.

## Tech stack

- [Next.js](https://nextjs.org) 16 with App Router
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) 4
- [cheerio](https://cheerio.js.org) for HTML parsing
- [robots-parser](https://github.com/nicenumbers/robots-parser) for robots.txt analysis

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/
    page.tsx            # Main scanner page
    api/scan/route.ts   # Scan API endpoint
    how-it-works/       # FAQ page
    layout.tsx          # Root layout
    globals.css         # Theme and styles
  components/
    ScoreRing.tsx       # Animated score ring
    CheckCard.tsx       # Expandable check result card
    BotList.tsx         # Bot-by-bot results list
    ShareBar.tsx        # Social sharing buttons
  data/
    bots.yaml           # AI crawler database
```

## License

MIT
