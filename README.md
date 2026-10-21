# Matappen

A web app that keeps track of the groceries at home, shows which dishes I can cook, and writes the shopping list for me.

> Version 1: pantry, recipes, "What can I cook?", meal planning, shopping list and "I cooked this". Installable as an app.
>
> **Live:** https://matappen-gamma.vercel.app

## Features
- **Pantry** – everything at home in three groups: Fridge, Pantry and Staples. Each item has a locked unit (g, ml, dl, l, pcs) and an amount; 0 means out of stock
- **Item catalog and smart search** – about 220 common groceries with the right group and unit. Search forgives typos, accents and other names ("tomatpure" finds Tomatpuré) and asks "did you mean …?" before creating a new item
- **Get started** – a quick list of common groceries to fill the pantry in one go
- **Staples** – salt, oil, spices etc. that are always assumed to be at home and have no amount. Every new account gets them automatically
- **Items** – a table of every item: group, unit, which units recipes can use, amount at home, which recipes use it, and whether it's your own or a default. Edit name, group and unit, or remove an item (also from recipes, with undo)
- **Built-in recipes** – a set of recipes everyone starts with, each based on a real recipe with a link to the source (ICA, Arla, Köket …), marked "Från appen". Editing or planning one saves your own copy
- **Recipes** – a recipe page with ingredients linked to the pantry, scaled by servings, plus instructions, link and notes. Recipes can use related units (kg, dl, tbsp…) and the app converts them
- **What can I cook?** – dishes I can make now and how many servings the pantry is enough for, or dishes with only 1–2 items missing
- **Att laga (meal planning)** – pick dishes and servings; a confirmation shows exactly what ends up on the shopping list
- **Har lagat (cooked)** – "I've cooked …": pick a dish (planned or not) and servings, see what is subtracted from the pantry, confirm; recent meals are listed
- **Shopping list** – what the planned dishes miss (once per item), your own items and out-of-stock suggestions. Change the amount to what you bought; "Done shopping" adds checked items to the pantry
- **I cooked this** – pick how many servings you cooked and the ingredients are subtracted from the pantry (staples never are), with a report and undo

## Tech
React, Vite, TypeScript, Tailwind CSS and Supabase (database + email/password login). Hosted on Vercel; every push to `main` is deployed automatically. A GitHub Actions workflow pings Supabase twice a week so the free project isn't paused (needs the repository secrets `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`).

## Running it locally
1. Install [Node.js](https://nodejs.org) (version 20 or newer).
2. Create a project at [supabase.com](https://supabase.com).
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key (Project Settings → API).
4. In Supabase, open the SQL Editor and run the files in `supabase/migrations` in order (001–008).
5. Install and start:
   ```bash
   npm install
   npm run dev
   ```
6. Open http://localhost:5173

## Screenshots
![Login page](docs/screenshots/login.jpg)
