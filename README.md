# ClientFinder AI

A freelancer SaaS for finding **permitted / public** client requirements, ranking them with an AI match score, generating proposals, and tracking leads in a built-in CRM.

## What it does

1. Search a skill (`n8n automation`, `AI chatbot`, or `n8n + WhatsApp + AI + Google Sheets`)
2. Expand the query semantically (AI Smart Search)
3. Fetch public job/freelance feeds from the local API
4. Deduplicate, score, qualify, and rank
5. Save leads → generate a proposal → move through CRM → Won

## Public sources (no login bypass)

The Node API only calls documented public endpoints:

- [RemoteOK](https://remoteok.com/api)
- [Remotive](https://remotive.com/api/remote-jobs)
- [Arbeitnow](https://www.arbeitnow.com/api/job-board-api)
- [Jobicy](https://jobicy.com/api/v2/remote-jobs)
- [Himalayas](https://himalayas.app/jobs/api)
- [Hacker News via Algolia](https://hn.algolia.com/api)

If those feeds are down or blocked, the UI shows:

> Live opportunity sources are not connected yet.

Optional examples are always labeled **DEMO DATA**.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Zustand (local CRM / profile / alerts)
- Express aggregator on `:3001`
- Recharts dashboard

## Develop

```bash
npm install
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:3001/api/health`

## Notes

- Matching and proposals run on-device so the product works without an LLM key.
- Settings can store an optional API key for a future model backend.
- CRM, saved searches, and profile persist in `localStorage`.
