# Flocc Studio Setup Guide

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

### Required Variables

- `DATABASE_URL` — PostgreSQL connection string (Neon, Vercel Postgres, or Supabase)
- `NEXTAUTH_URL` — Your app URL (http://localhost:3000 for local dev)
- `NEXTAUTH_SECRET` — Random secret for session encryption (generate with `openssl rand -base64 32`)
- `GITHUB_ID` / `GITHUB_SECRET` — GitHub OAuth credentials

### Optional Variables

- `GOOGLE_ID` / `GOOGLE_SECRET` — Google OAuth credentials

---

## OAuth Setup

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name:** Flocc Studio (or your preferred name)
   - **Homepage URL:** http://localhost:3000 (or your production URL)
   - **Authorization callback URL:** http://localhost:3000/api/auth/callback/github
4. Click "Register application"
5. Copy the **Client ID** to `GITHUB_ID`
6. Generate a **Client Secret** and copy to `GITHUB_SECRET`

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the **OAuth consent screen**:
   - User Type: External
   - App name: Flocc Studio
   - User support email: your email
   - Developer contact: your email
6. Back in Credentials, create OAuth client ID:
   - Application type: **Web application**
   - Name: Flocc Studio
   - Authorized JavaScript origins: http://localhost:3000
   - Authorized redirect URIs: http://localhost:3000/api/auth/callback/google
7. Copy the **Client ID** to `GOOGLE_ID`
8. Copy the **Client Secret** to `GOOGLE_SECRET`
9. Uncomment the Google provider in `src/lib/auth.ts`

---

## Database Setup

### Using Neon

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`
4. Run migrations:

```bash
npx drizzle-kit push
```

### Schema

The database schema is defined in `src/lib/db/schema.ts`. To update:

```bash
# Generate migration
npx drizzle-kit generate

# Apply to database
npx drizzle-kit push
```

---

## Running Locally

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:3000

---

## Production Deployment

For Vercel deployment:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Update `NEXTAUTH_URL` to your production URL
5. Update OAuth callback URLs in GitHub/Google to match production

Remember to generate a secure `NEXTAUTH_SECRET` for production:

```bash
openssl rand -base64 32
```
