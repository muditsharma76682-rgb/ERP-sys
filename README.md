# Angel Public International School — Fee Management

React + Vite frontend connected to your Supabase project (`ERP of school`).

## 1. Install & run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

The `.env` file already contains your project's URL and public anon key —
these are safe to expose in a browser app because every table is protected
by Row Level Security (RLS) on the database side.

## 2. Create your first login (admin account)

There's no public sign-up screen on purpose — accounts are created by an
admin. To create the very first admin account:

1. Go to your Supabase dashboard → **Authentication → Users → Add user**.
   Create a user with an email + password (this becomes the login).
2. Go to **Table Editor → profiles → Insert row** and add:
   - `id`: paste the user's UUID from the Authentication page
   - `full_name`: e.g. "Admin Name"
   - `role`: `admin`
3. Log in to the app with that email/password.

Once logged in as admin, create `accountant` / `teacher` profiles the same
way (create the auth user, then the matching profiles row). For **parent**
accounts, also set `students.parent_id` to that parent's user id so they
only see their own child's fees (RLS handles this automatically).

## 3. Typical setup order

1. Log in as admin → **Fee Structure** → add classes, fee heads, and the
   amount due per class/term.
2. **Students** → add students, assign to a class.
3. **Record Payment** → search a student, log a payment (auto-generates a
   receipt number).
4. **Dues Register** → see who's paid and who's outstanding.

## 4. Deploying

This is a static Vite app — build it and host anywhere (Netlify, Vercel,
Cloudflare Pages, or even Supabase's own static hosting):

```bash
npm run build
```

This produces a `dist/` folder ready to deploy. Remember to add the same
two environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
in your hosting provider's dashboard if you don't commit the `.env` file.

## Roles at a glance

| Role       | Can do |
|------------|--------|
| admin      | everything — manage classes, fee heads, amounts, students, payments |
| accountant | manage students, record payments, view dues |
| teacher    | view students and dues (read-only) |
| parent     | view only their own child's fee summary and dues |
