# JD → Resume Customiser — Deploy Guide (GUI only, no terminal)

The smartest tailoring engine you have: it analyzes the JD into a structured signal map, then does a **truthful surgical rewrite** of your saved resume, and gives you a match score, keyword map, and honest gap analysis. Output is an **ATS-safe PDF**.

---

## What you'll set up (3 services, all free tiers)
1. **GitHub** — holds the code
2. **Supabase** — login + saves your resume & history
3. **Vercel** — hosts the live app
4. **Groq** — the AI brain (free tier, console.groq.com)

---

## STEP 1 — Put code on GitHub (web UI)
1. Go to github.com → **New repository** → name it `jd-resume-customiser` → Create.
2. On the empty repo page → **uploading an existing file**.
3. Drag in **all the files from this project folder** (keep the folder structure — drag the whole set).
4. Commit directly to `main`.

> Do NOT upload `.env.local`, `node_modules`, or `.next`. (The included `.gitignore` already excludes them if you use git, but if dragging manually, just skip those.)

---

## STEP 2 — Supabase (database + auth)
1. Go to supabase.com → **New project**. Pick a name + strong DB password → wait ~2 min.
2. Left sidebar → **SQL Editor** → **New query**.
3. Open `supabase/schema.sql` from this project, paste the whole thing, click **Run**. (Creates tables + security rules.)
4. Left sidebar → **Authentication** → **Providers** → make sure **Email** is enabled (it is by default). Magic-link login works out of the box.
5. Left sidebar → **Project Settings** → **API**. Copy these two — you'll need them next:
   - **Project URL**
   - **anon public** key

> Auth redirect: Authentication → **URL Configuration** → set **Site URL** to your Vercel URL once you have it (Step 4). Until then `http://localhost:3000` is fine.

---

## STEP 3 — Deploy on Vercel
1. Go to vercel.com → **Add New… → Project** → **Import** your GitHub repo.
2. Framework auto-detects **Next.js**. Leave build settings default.
3. Expand **Environment Variables** and add these three:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon key |
   | `GROQ_API_KEY` | your `gsk_…` key |

4. Click **Deploy**. ~1–2 min → you get a live URL.

---

## STEP 4 — Wire the redirect
1. Copy your live Vercel URL (e.g. `https://jd-resume-customiser.vercel.app`).
2. Supabase → Authentication → **URL Configuration** → set **Site URL** to that URL → Save.
3. Also add it under **Redirect URLs** if prompted.

---

## STEP 5 — Use it
1. Open your live URL → enter email → click the magic link in your inbox.
2. Paste your resume once → **Save**.
3. Paste any job description (+ optional title) → **Customise resume**.
4. Review match score, keyword map, gaps → **Download PDF**.

---

## How the intelligence works (why it's "smartest")
- **Pass 1 — JD analysis:** the model extracts hard skills, exact ATS keywords (with original casing), seniority, domain, implicit signals, and disqualifiers into structured JSON.
- **Pass 2 — surgical rewrite:** the model re-orders and re-emphasizes your *real* experience against that map, mirrors keywords *only where you genuinely have them*, rewrites bullets in XYZ impact form, and **flags honest gaps instead of lying**.
- **Truth lock:** It never invents employers, dates, degrees, or metrics. Missing keywords show up in the keyword map as "missing" and in the gaps list — so you know what to fix, not fake.
- **ATS-safe PDF:** single column, standard fonts, real selectable text, no tables/graphics that break parsers.

## Cost
- Supabase / Vercel: free tier is plenty for personal use.
- Groq: free tier covers ~2 calls per customise. No card needed for normal personal use.

## Tuning later
- Prompts live in `lib/prompts.ts` — edit there to change rewrite style or scoring strictness.
- PDF look lives in `components/ResumePDF.tsx`.
- Model is set via the `GROQ_MODEL` env var (defaults to `llama-3.3-70b-versatile`); logic lives in `lib/llm.ts`.
