# Vercel Environment Variables

Add these environment variables to your Vercel project:

## Required Variables

### Database Connection
```
DATABASE_URL
postgres://postgres:xxlqd1988110611@db.oxpxlphrdczjvuowbvoe.supabase.co:6543/postgres
```

```
DATABASE_URL_DIRECT
postgres://postgres:xxlqd1988110611@db.oxpxlphrdczjvuowbvoe.supabase.co:6543/postgres
```

### NextAuth Configuration
```
NEXTAUTH_SECRET
9dWyF6tcDciSnTh2tQheji2hXmmnthq97YLNPmiK4Qw=
```

```
NEXTAUTH_URL
https://your-deployment-url.vercel.app
```
(Replace with your actual Vercel deployment URL)

### Optional: OpenAI API (for AI features)
```
OPENAI_API_KEY
your-openai-api-key-here
```

## How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** tab
3. Click **Environment Variables** in the left sidebar
4. For each variable:
   - Enter the **Key** (e.g., DATABASE_URL)
   - Enter the **Value** (e.g., the connection string)
   - Select environments: **Production**, **Preview**, **Development** (check all)
   - Click **Save**
5. After adding all variables, go to **Deployments** tab
6. Click the **...** menu on the latest deployment
7. Click **Redeploy** to rebuild with the new environment variables

## Next Steps After Adding Environment Variables

1. Redeploy the application
2. Run database migrations to create tables in Supabase
3. Create the first admin user
4. Test the application
