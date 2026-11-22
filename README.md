# DRIPZY (@weardripzy)
Next.js + Tailwind + Supabase (Postgres, Auth, Storage) + Razorpay.

## Done in this step
- `supabase/schema.sql`: full database, RLS, admin role system, draft/publish/restore for homepage, storage buckets
- `app/api/razorpay/webhook/route.ts`: verified payment finalisation
- `public/dripzy-logo.png`: your original logo, unmodified

## Setup
1. Create a Supabase project and run `supabase/schema.sql`.
2. Auth > Providers: enable Google, Email, Phone (needs an SMS provider, e.g. Twilio/MSG91).
3. Sign up once in the app, then run the `update profiles set role='admin'` line at the bottom of the schema.
4. Razorpay dashboard: add webhook `https://YOURDOMAIN/api/razorpay/webhook` for payment.captured, order.paid, payment.failed.
5. Copy `.env.example` to `.env.local` and fill it in.

## Build order (next steps)
1. Storefront shell: navbar, drawer (reads `categories`), hero (reads `live_sections`), product grids
2. Auth modal + browse-without-login gating
3. Product page, cart, checkout (server route creates the order + Razorpay order, recomputes prices server-side)
4. Customer account area
5. Admin: products, categories, orders, then Website Appearance (upload, drag-reorder, preview, publish, restore)

## Run locally (Windows)
1. Install Node.js 20 LTS from nodejs.org.
2. In the project folder: `copy .env.example .env.local`, then fill in the Supabase URL and anon key.
3. `npm install` then `npm run dev`, open http://localhost:3000

## Built so far
Storefront (homepage from live sections, drawer, listing with size/price filters + sort, search with suggestions, product page, bag, checkout, order page), login popup, customer account (profile, orders + tracking, wishlist, addresses), policy pages (placeholder text), admin (dashboard, add/manage products, categories, Website Appearance with drafts/preview/publish/restore/schedule/drag-reorder, orders, customers, coupons, shipping settings).
## Not built
Phone OTP login, order confirmation emails, refunds, final policy text, automated tests. Not yet run against a live Supabase/Razorpay project: test each flow before launch.
