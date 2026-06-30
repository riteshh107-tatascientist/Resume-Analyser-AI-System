# ResumeAI Pro — AI Resume Analyzer & Builder

A complete Vite + React app: AI resume analysis (ATS score, grammar, keywords,
skills gap) and an AI resume builder with multiple templates.

## 🚨 Why your previous Vercel deployment was failing

The original single-file component made a direct browser `fetch` call to:

```
https://api.anthropic.com/v1/messages
```

This **cannot work in a deployed app**, for two reasons:

1. **CORS** — Anthropic's API blocks direct browser requests for security;
   only server-to-server calls are allowed.
2. **No API key** — even if CORS were allowed, the code had no key, and an
   API key must *never* be shipped in frontend JS (anyone could steal it
   from your bundle).

That fetch call was throwing on every request once deployed (it likely
"worked" only inside the Claude.ai sandbox you built it in, which proxies
that request specially — a real browser/Vercel can't).

### The fix in this project

- All AI calls now go through `callBackendAI()` in `src/App.jsx`, which is
  **disabled by default** (`VITE_USE_BACKEND=false`). When disabled, the app
  uses realistic local fallback logic — so it builds, deploys, and works
  perfectly with zero backend setup.
- Included `/api/analyze.js`, `/api/bullets.js`, `/api/summary.js` —
  ready-made Vercel Serverless Functions that proxy securely to Claude using
  a server-side `ANTHROPIC_API_KEY` (see **Enabling real AI** below).

---

## 📦 Project Structure

```
resume-ai-pro/
├── api/                  # Optional Vercel serverless functions (real AI)
│   ├── analyze.js
│   ├── bullets.js
│   └── summary.js
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx           # Main application (all logic + UI)
│   ├── main.jsx           # React entry point
│   └── index.css          # Base resets
├── .env.example
├── .eslintrc.cjs
├── .gitignore
├── index.html
├── package.json
├── vercel.json            # SPA routing rewrite rule
└── vite.config.js
```

## 🚀 Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
```

## 🏗️ Build for production

```bash
npm run build       # outputs to /dist
npm run preview      # preview the production build locally
```

## ☁️ Deploying to Vercel

1. Push this project to a GitHub repo.
2. Import the repo in Vercel — it auto-detects Vite (Framework Preset:
   **Vite**, Build Command: `npm run build`, Output Directory: `dist`).
3. Deploy. That's it — no environment variables required for the app to
   work (it uses local fallback analysis automatically).

### Enabling real AI (optional)

1. The `/api` folder is already in this repo, so Vercel will deploy those
   serverless functions automatically alongside your frontend.
2. In your Vercel project → **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = your real Anthropic API key (keep this secret —
     server-side only, never add `VITE_` prefix to this one)
   - `VITE_USE_BACKEND` = `true`
3. Redeploy (Vercel → Deployments → ⋯ → Redeploy).

Once enabled, the analyzer, bullet generator, and summary generator will
call your `/api/*` functions, which call Claude securely server-side.

---

## 🧰 Tech Stack

- React 18 + Vite 5
- Zero external CSS frameworks — all styling is custom CSS-in-JS injected
  at runtime (see `getStyles()` in `App.jsx`)
- Optional Vercel Serverless Functions for real AI calls

## ✅ Features

- 🎯 ATS Score (0–100) with animated ring
- 🤖 AI-style improvement suggestions
- 🔑 Job description vs resume match score
- 📊 Skills gap analysis (found / missing / partial)
- ✨ AI bullet point generator
- 🌍 4 resume templates (Modern, Minimal, Creative, Executive)
- 📥 PDF/DOCX download placeholders (wire up your preferred export library,
  e.g. `jspdf` + `html2canvas`, or `docx`, in the `Download` button
  handlers in `App.jsx`)
- 🔐 Demo authentication flow
- 📁 Resume history tracking (in-memory — wire up a real DB for persistence)
- 🌙 Dark/Light mode
- 📱 Fully responsive with mobile bottom nav

## 📝 Notes on Persistence

This demo keeps history and user state in React state only (resets on
reload). For production you'd want to wire up a real database (Postgres via
Vercel Postgres/Neon, Supabase, Firebase, etc.) and real authentication
(NextAuth, Clerk, Supabase Auth, etc.).
