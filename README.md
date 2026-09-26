# StockSense

Inventory management where every stock change is a line in a ledger. Receive goods, deliver them, move them between locations and fix counts, and the numbers on screen always add up to the history behind them.

Built for the Odoo x GCET Hyderabad Hackathon 2026 (virtual round).

**Live app:** https://stocksense-six-taupe.vercel.app

> Try it: sign up with any Login ID. The demo runs on a Clerk development instance, so an email like `yourname+clerk_test@example.com` verifies with the code `424242`.

## Walk through it (about 5 minutes)

The live app starts with a warehouse `WH`, three furniture products and a few receipts and deliveries in every state. This path follows the problem statement's own example: 100 kg of steel in, some moved, some delivered, a few kilos damaged.

1. **Sign up.** Try a weak password first to see the rules, then land on the dashboard.
2. **Products → New:** "Steel Rods", SKU `STEEL001`, category Raw Material, unit kg, reorder min 20. It shows as out of stock with a suggested order.
3. **Operations → Receipts → New:** receive 100 kg from "Azure Interior", press **To Do**, then **Validate**. Stock goes up and the receipt can be printed.
4. **Operations → Internal Transfers → New:** move 40 kg from `WH/Stock1` to `WH/Stock2`. The total stays 100 kg.
5. **Operations → Deliveries → New:** deliver 120 kg. Only 60 kg are free in Stock1, so the line turns red and the delivery waits. Change it to 20 kg, save, and validate.
6. **The bell** lists Chair as low. "Create receipt for 40" opens a receipt with Chair and 40 already on it. Add the vendor ("Wood Corner"), press **To Do** and **Validate**, and the waiting Chair delivery `WH/OUT/0002` moves to Ready on its own.
7. **Operations → Adjustments → New:** Steel Rods at `WH/Stock1`, counted 37. The 3 kg difference is logged as damaged.
8. **Move History:** every step above as ledger lines, incoming green, outgoing red. Steel Rods adds up to 77 kg, and the dashboard counts match.

## The one idea

```
Operation (a document)  --validate-->  StockMove (ledger line)  --updates-->  StockQuant (qty per product per location)

Receipt   WH/IN/0001     Partners/Vendors -> WH/Stock1   +50      Desk @ WH/Stock1 = 50
Delivery  WH/OUT/0001    WH/Stock1 -> Partners/Customers -10      Desk @ WH/Stock1 = 40
Transfer  WH/INT/0001    WH/Stock1 -> WH/Stock2            5      Desk @ WH/Stock2 = 5, total unchanged
Adjust    WH/ADJ/0001    Virtual/Adjustment <-> WH/Stock1 +-diff  counted quantity becomes on hand
```

Only the inventory service writes stock, and it always writes the ledger line in the same database transaction. If a number ever disagrees with the ledger, the ledger wins.

## Features

| Area | What you can do |
|---|---|
| Sign up / Sign in | Login ID (6 to 12 characters, unique), unique email, strong password (lowercase, uppercase, special character, more than 8 characters). Any failed sign in shows "Invalid Login Id or Password". |
| Password reset | Login ID or email, then a 6 digit code by email, then a new password. |
| Dashboard | Receipt and Delivery cards (to receive, late, waiting, upcoming), KPIs for products in stock, low and out of stock, pending receipts, pending deliveries and scheduled transfers. Filters by document type, status, warehouse and category. |
| Products | Name, SKU, category, unit of measure, unit cost, reorder rules and optional opening stock. Search by name or SKU, stock per location. |
| Stock | On hand and free to use per product. Editing on hand creates an adjustment instead of overwriting the number. |
| Receipts | Draft, Ready, Done. Validating adds stock. Print once done. |
| Deliveries | Draft, Waiting, Ready, Done. Lines without enough stock turn red and the delivery waits. Validating removes stock. |
| Internal transfers | Move stock between locations or warehouses. Totals stay the same, every move is logged. |
| Adjustments | Enter the counted quantity; the difference is logged against a virtual adjustment location. |
| Move History | Every ledger line, incoming in green and outgoing in red, searchable by reference and contact, list or kanban. |
| Settings | Warehouses (name, short code, address) and locations inside them (`WH/Stock1`). The short code prefixes every reference. |
| Alerts | Low and out of stock bell in the top bar. |
| Everywhere | References like `WH/IN/0001` from an atomic counter, list and kanban views, validation on the client and the server, works from 375px phones to desktops. |

## How it is built

```
page (React)  ->  SWR hook  ->  /api route (auth + zod + one service call)  ->  lib/services/*  ->  Mongoose models  ->  MongoDB Atlas
```

- **Next.js 16** App Router with TypeScript, one repo for UI and API.
- **Clerk** for accounts, with our own sign in, sign up and reset pages. A `User` document mirrors each Clerk user in MongoDB so operations and moves can point at a responsible person.
- **MongoDB Atlas + Mongoose**. Validating an operation runs in a transaction: ledger lines, stock quantities and the document status change together or not at all.
- **zod** schemas in `lib/validators.ts` are shared by the forms and the API routes, so both reject the same input with the same message.
- **Tailwind CSS v4** with **Align UI** components, **motion** and **dotLottie** for small state animations.
- **Vitest** for the stock rules, **Playwright** end to end tests signed in through Clerk's testing helpers.

```
app/
  (auth)/            sign in, sign up, forgot password
  (app)/             signed in pages inside the top bar: dashboard, operations, products, stock, moves, settings, profile
  (print)/           printable operation
  api/               route handlers, each one checks the session and validates input
components/          ui (Align UI), shell, auth, lists, operations, products, settings, alerts, motion
lib/
  services/          inventory (the only writer of stock), operations, references, catalog, dashboard, rules
  auth.ts db.ts api.ts types.ts validators.ts
models/              User Warehouse Location Category Product StockQuant Operation StockMove Counter
scripts/seed.ts      demo data created through the same services the app uses
tests/               unit (Vitest) and e2e (Playwright)
```

## Run it locally

Needs Node 20 or newer, a MongoDB Atlas cluster (transactions need a replica set, which every Atlas cluster is) and a Clerk application with **Username**, **Email address** and **Password** enabled.

```bash
npm install
cp .env.example .env.local      # fill in the values below
npm run seed                    # demo warehouse, products and operations in MONGODB_DB
npm run dev                     # http://localhost:3000
```

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk dashboard, API keys |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-in`, `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/` |
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB` | database name, for example `stocksense_dev` |
| `E2E_CLERK_USER_USERNAME`, `E2E_CLERK_USER_PASSWORD` | a Clerk user used only by the end to end tests |

| Script | Does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run check` | type check and lint |
| `npm test` | unit tests |
| `npm run e2e` | end to end tests (`npx playwright install chromium` once). Set `E2E_BASE_URL` to test a deployed URL. |
| `npm run seed` | resets the inventory data in `MONGODB_DB` and fills it with demo data. Refuses the shared `stocksense` database unless you pass `-- --demo`. |

## Team

| | Member | Built |
|---|---|---|
| M1 | Aman Shaikh | project setup, data model, auth pages, app shell, profile, seed, deploy, e2e setup |
| M2 | Yash Mahajan | inventory engine, references, operation forms and print view |
| M3 | Om072005 | lists and kanban, move history, dashboard, motion |
| M4 | Dhruv Mistry | products, stock, warehouses and locations, low stock alerts |
