# ScentbyBecca store

Next.js storefront and admin, with Supabase (database, admin login, photo and video storage). Hosting: Railway.

## 1. Supabase setup (new project)
1. Run `supabase/schema.sql` in **SQL Editor**, then `supabase/migrations/002_improvements.sql`.
2. Optional sample content: `supabase/seed.sql`.
3. **Authentication > Users > Add user**: Becca's admin email and a strong password, tick auto-confirm.
4. **Project Settings > API**: copy the Project URL (just `https://xxxx.supabase.co`), the anon key and the service_role key.

## Updating an EXISTING project (what you do for this release)
1. Run `supabase/migrations/002_improvements.sql` once in the SQL Editor. It only adds things; no products, orders or photos are touched.
2. Redeploy the code. Your data lives in Supabase, not in the code, so a redeploy never removes it.

## 2. Environment variables (`.env.local`, and the same in Railway > Variables)
See `.env.example`. `ADMIN_EMAIL` must equal the admin user's email. `NEXT_PUBLIC_SITE_URL` is your live address.

## 3. Password recovery (admin)
- "Forgot password?" on the admin sign-in page emails a reset link that opens `/reset-password` on the live site.
- In Supabase **Authentication > URL Configuration**: set **Site URL** to your live address, and add `https://YOUR-DOMAIN/reset-password` under **Redirect URLs**. If Site URL stays `http://localhost:3000`, reset links point to localhost.
- Supabase's built-in email sender is only meant for testing and is heavily limited. For reliable reset emails, set a custom SMTP provider under **Authentication > Emails > SMTP Settings** (Resend, Brevo and others have free plans).
- Locked out right now? In the SQL Editor run (change the email and password):
  `update auth.users set encrypted_password = crypt('NewStrongPassword1', gen_salt('bf')), email_confirmed_at = coalesce(email_confirmed_at, now()) where email = 'her@email.com';`

## 4. Email (order notifications)
Uses Resend over plain HTTPS. Create an account at resend.com, verify your sending domain, create an API key, then set `RESEND_API_KEY` and `EMAIL_FROM`. Without them the store works normally and the admin home shows a notice that order emails are off.
Emails sent: order received (customer, if they gave an email; and admin), payment reported (both), and customer updates when the admin marks an order paid, dispatched, delivered or cancelled. Each email is sent once per order and event.

## 5. Homepage video, promotions, delivery areas
- Admin > Homepage video: upload an MP4/WebM (under 40 MB; under 10 MB is best), preview, publish. Videos go to Supabase Storage. Supabase's free plan caps single files at 50 MB.
- Admin > Promotions: banner, strip or pop-up, dates, on/off, optional discount percentage that is applied at checkout by the server.
- Admin > Delivery and orders: locations, optional areas with fees, pause orders.

## 6. Deploy on Railway
Push to GitHub, create a Railway project from the repo, add the variables, then connect your Namecheap domain under Settings > Networking.

## What lives where
Products, photos, videos, reviews, orders, promotions, delivery data: Supabase. Cart and favourites: the visitor's own device. Edit in code: WhatsApp number, social links, story, categories (`lib/config.ts`), policy text (`components/Policy.tsx`).

## Redesign release (003)
1. Run `supabase/migrations/003_redesign.sql` once (after 002). Your five existing reviews are pinned to the top in their current order; reorder them in Admin > Reviews > Display order.
2. New admin pages: Hero slides (replaces the old rectangle banner for campaigns), Page headers (a photo for each page), Announcements (rotating strip), Video library.
3. Fonts: Cormorant Garamond (headings), EB Garamond (text), Inter (forms and admin), Instrument Serif italic (tagline).
