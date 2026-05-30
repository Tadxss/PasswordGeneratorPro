# Copilot Instructions — Password Generator Pro

A cryptographically secure password generator built with React 19, Vite, and Tailwind CSS 3.4.
Live at: https://dt-passwordgeneratorpro.netlify.app/
GitHub: https://github.com/Tadxss/PasswordGeneratorPro

## Project Structure

```
src/
  components/
    PasswordGenerator.jsx  ← main app component (all logic + UI)
    ContactModal.jsx       ← contact form modal (Web3Forms)
    BuyMeACoffee.jsx       ← support banner
  main.jsx
index.html                 ← SEO meta, OG tags, GA4, JSON-LD
netlify.toml               ← SPA redirect rule + build config
public/
  sitemap.xml
  robots.txt
```

## Build and Dev

```
npm install       # install dependencies
npm run dev       # start Vite dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

Deploys automatically from GitHub via Netlify on push to main.

## Design System

- Background: `bg-slate-900`, Cards: `bg-slate-800`, Header/Footer: `bg-slate-950`
- Accent: purple — `text-purple-400`, `border-purple-500`, `bg-purple-600 hover:bg-purple-700`
- Text: white headings, `text-slate-300` body, `text-slate-400` muted
- Icons: Lucide React
- Page layout: `flex flex-col min-h-screen` root + `flex-1` on `<main>` to pin footer

## ContactModal Conventions

- Title: "Contact the Developer" (with `<Mail>` icon)
- Form labels use inline Lucide icons — `<User>`, `<Mail>`, `<MessageSquare>` (w-3.5 h-3.5 inline mr-1.5)
- Body wrapper must have `text-left` class: `<div className="px-6 py-5 text-left">`
- Web3Forms `access_key`: `9d2f6699-80d4-4345-bbe9-b78ece5a9513`
- Subject line: `Password Generator Pro — Message from ${formData.name}`

## Password Generation

Uses the Web Crypto API (`window.crypto.getRandomValues`) — never `Math.random()`.
All generation is 100% client-side; no data is ever sent to a server.

## Shared Identity

- Footer "Daryl John Tadeo" links to `https://daryltadeo.netlify.app/`
- Buy Me a Coffee copy: `"Found this useful? Support the work —"`
- GA4 ID: `G-P1898N6HT7`

For the full cross-project design system reference, see `COPILOT.md` in the DarylJohnTadeo portfolio repo.
