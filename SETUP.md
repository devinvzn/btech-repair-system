# BTech Repair – Setup Guide

Follow this **in order**. Step 1 (revoking the token) matters most and should be done first.

---

## Step 1 – Rotate the Telegram bot token (URGENT)

The old token was exposed in public code, so it's no longer safe.

1. Open Telegram → **@BotFather**
2. Send `/revoke` → select your bot
3. Copy the **new token** it gives you (save it somewhere private — **never** put it in code)

> The old token still exists in `daily-alert.yml`'s git history. Making the repo **Private** helps, but revoking the token is what actually neutralizes it.

---

## Step 2 – Turn on Supabase RLS

1. Supabase Dashboard → **SQL Editor**
2. Paste the contents of `sql/01_enable_rls.sql` and click **Run**
3. Check: open `https://mkdylncwtijbvishocse.supabase.co/rest/v1/jobs?select=*` in a fresh browser tab (not logged in) — it should fail (no apikey header, 401). The app itself should only show data once logged in.

> Once RLS is on, **GitHub Actions** can no longer read data with the anon key. That's why Step 4 uses the **service_role key** instead.

---

## Step 3 – Deploy the Edge Function

Install the Supabase CLI (`npm i -g supabase`), then:

```bash
supabase login
supabase link --project-ref mkdylncwtijbvishocse
supabase secrets set TG_TOKEN=<YOUR_NEW_TOKEN> TG_CHAT_IDS=8990461615,6363002948
supabase functions deploy telegram-notify
```

Test: log into the app, add a new job → a Telegram message should arrive.

---

## Step 4 – Add GitHub Secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|---|---|
| `SUPA_URL` | `https://mkdylncwtijbvishocse.supabase.co` |
| `SUPA_SERVICE_KEY` | Supabase → Project Settings → API → **service_role** key |
| `TG_TOKEN` | The new bot token |
| `TG_CHAT_IDS` | `8990461615,6363002948` |

> ⚠️ Never put the **service_role key** in `index.html`. It bypasses RLS entirely. It belongs only in a GitHub Secret.

Test: **Actions** tab → *Daily 10 AM Alert* → **Run workflow**.

---

## Step 5 – Upload the files (including PWA files)

Replace/add these files in the repo:

```
index.html
manifest.json                    (new, for phone install)
sw.js                             (new, for phone install)
icons/                            (new, png files)
scripts/daily-alert.js
.github/workflows/daily-alert.yml
supabase/functions/telegram-notify/index.ts   (optional, kept in the repo)
sql/01_enable_rls.sql                          (optional, kept in the repo)
```

---

## Current features

- 🔒 Telegram token never reaches the browser (Edge Function)
- 🔄 Session auto-refreshes when it expires
- 🛡️ XSS protection (customer/repair text is escaped)
- 💰 **Unpaid Amount** card + payment filter + "Mark Paid" button
- 📅 Returned Date column
- 📊 Analytics: jobs/month, revenue/month, status split, top brands/customers, common issues, average turnaround
- ⬇️ CSV export (filtered jobs)
- ⌨️ Enter key login, Esc key closes modals
- 🔢 Auto-suggests the next Job No for new jobs
- 🚫 Job No must be unique — duplicates are blocked
- 🔁 "Can't Repair" now means the laptop was returned to the customer (no payment expected)
- 🛠️ Warranty jobs: link a repeat repair to the original job, free of charge
- 🔔 Telegram alert on status/payment changes
- 🌅 Daily alert now includes a summary of unpaid jobs
- 📱 Installable on phone as an app (icon + offline shell)
