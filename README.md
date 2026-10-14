# Matappen

A web app that keeps track of the groceries at home, shows which dishes I can cook, and writes the shopping list for me.

> Work in progress. Steps 1–4 (login, pantry, recipes and "What can I cook?") are done, plus "I cooked this" on the recipe page.

## Features (planned for version 1)
- **Pantry** – everything at home in three groups: Fridge, Pantry and Staples. Each item has a locked unit (g, ml, dl, l, pcs) and an amount; 0 means out of stock
- **Staples** – salt, oil, spices etc. that are always assumed to be at home and have no amount
- **Recipes** – a recipe page with ingredients linked to the pantry, scaled by servings, plus instructions, link and notes. Recipes can use related units (kg, dl, tbsp…) and the app converts them
- **What can I cook?** – dishes I can make now and how many servings the pantry is enough for, or dishes with only 1–2 items missing
- **Meal planning** – pick dishes and the shopping list is created automatically
- **Shopping list** – automatic and manual items; "Done shopping" moves them to the pantry
- **I cooked this** – pick how many servings you cooked and the ingredients are subtracted from the pantry (staples never are), with a report and undo

## Tech
React, Vite, TypeScript, Tailwind CSS and Supabase (database + email/password login).

## Running it locally
1. Install [Node.js](https://nodejs.org) (version 20 or newer).
2. Create a project at [supabase.com](https://supabase.com).
3. Copy `.env.example` to `.env.local` and fill in the Supabase URL and publishable key (Project Settings → API).
4. In Supabase, open the SQL Editor and run the files in `supabase/migrations` in order (001–005).
5. Install and start:
   ```bash
   npm install
   npm run dev
   ```
6. Open http://localhost:5173

## Screenshots
![Login page](docs/screenshots/login.jpg)
