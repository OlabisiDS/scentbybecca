# ScentbyBecca store

Next.js storefront and admin, with Supabase (database, admin login, photo storage). Hosting target: Railway.

## 1. Supabase setup (once)
1. Create a free project at supabase.com. Pick the region nearest your customers.
2. Open **SQL Editor > New query**, paste all of `supabase/schema.sql`, press **Run**.
3. Optional sample products and your five reviews: paste `supabase/seed.sql` and Run. Delete the sample products from the admin later.
4. **Authentication > Users > Add user**: create Becca's admin account (her email and a strong password). Tick auto-confirm.
5. **Project Settings > API**: copy the Project URL, the anon key, and the service_role key.

## 2. Local setup
1. Copy `.env.example` to `.env.local` and fill every value. `ADMIN_EMAIL` must be exactly the email from step 4. Never commit `.env.local` or share the service_role key.
2. `npm install` then `npm run dev`, open http://localhost:3000
3. Admin: http://localhost:3000/admin

## 3. Deploy on Railway
1. Push the project to GitHub (`.env.local` is ignored by git).
2. In Railway: New Project > Deploy from GitHub repo.
3. Add the same variables from `.env.local` in the service's Variables tab (set `NEXT_PUBLIC_SITE_URL` to your live address). Railway builds with `npm run build` and starts with `npm start`.
4. Domain: buy it on Namecheap, then add it under Railway > Settings > Networking > Custom Domain and add the DNS records Railway shows you at Namecheap. Update `NEXT_PUBLIC_SITE_URL` and redeploy.

## What lives where
- Products, sizes, photos, reviews, orders, delivery locations, bank accounts: Supabase.
- Cart and favourites: each visitor's own device.
- Edit in code: WhatsApp number, social links, story text, categories (`lib/config.ts`); policy text (`components/Policy.tsx`).
- Logo and hero video are files in `public/` (not editable in the admin).

## How ordering works
Customers choose a delivery location and place an order, then pay by bank transfer. Locations the admin has switched on add their fee to the total. Other locations pay for the items now and the fee is confirmed on WhatsApp. "I have paid" only notifies the admin. The admin marks an order Paid only after seeing the money in her bank app. Card payment is shown as temporarily unavailable.

## Not included yet
Online card payment, customer accounts, email or SMS alerts.
