# Deployment Guide for BNI Dashboard

This guide provides detailed instructions for deploying the BNI Dashboard PWA to various platforms.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup](#database-setup)
3. [Deployment Platforms](#deployment-platforms)
4. [Post-Deployment Steps](#post-deployment-steps)
5. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] GitHub repository with the project code
- [ ] PostgreSQL database (local or cloud-hosted)
- [ ] Environment variables ready
- [ ] Tested the application locally
- [ ] Changed default admin password
- [ ] Configured PWA icons (icon-192.png, icon-512.png)

---

## Database Setup

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### Option 2: Cloud PostgreSQL (Recommended)

**Railway**
1. Go to [railway.app](https://railway.app)
2. Create new project → Add PostgreSQL
3. Copy the DATABASE_URL from Railway dashboard

**Render**
1. Go to [render.com](https://render.com)
2. Create new → PostgreSQL
3. Copy the DATABASE_URL from Render dashboard

**Neon**
1. Go to [neon.tech](https://neon.tech)
2. Create new project
3. Copy the DATABASE_URL from Neon dashboard

---

## Deployment Platforms

### Vercel (Recommended)

**Why Vercel?**
- Free tier available
- Automatic HTTPS
- Fast global CDN
- Easy GitHub integration
- Built-in preview deployments

**Steps:**

1. **Prepare your code**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Configure Environment Variables**
   In Vercel Dashboard → Settings → Environment Variables:
   
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-random-secret-key
   OPENAI_API_KEY=sk-...  # Optional
   ```

4. **Run Database Migrations**
   After first deployment, run:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

5. **Access Your App**
   Your app will be at: `https://your-app.vercel.app`

---

### Railway

**Why Railway?**
- Free tier available
- Built-in PostgreSQL
- Simple deployment
- Good for small projects

**Steps:**

1. **Create Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Add Database**
   - In project, click "New Service"
   - Select "PostgreSQL"
   - Railway will provide DATABASE_URL

3. **Configure Environment Variables**
   In Railway Dashboard → Variables:
   
   ```env
   NEXTAUTH_URL=https://your-app.railway.app
   NEXTAUTH_SECRET=your-random-secret-key
   OPENAI_API_KEY=sk-...  # Optional
   ```

4. **Deploy**
   - Railway will automatically build and deploy
   - View logs in Railway dashboard

---

### Render

**Why Render?**
- Free tier available
- Built-in PostgreSQL
- Good documentation
- SSL certificates included

**Steps:**

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```
   Build Command: npm run build
   Start Command: npm start
   ```

3. **Add Database**
   - Create new PostgreSQL database
   - Copy DATABASE_URL

4. **Configure Environment Variables**
   In Render Dashboard → Environment:
   
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   NEXTAUTH_URL=https://your-app.onrender.com
   NEXTAUTH_SECRET=your-random-secret-key
   OPENAI_API_KEY=sk-...  # Optional
   ```

5. **Deploy**
   - Render will automatically build and deploy

---

## Post-Deployment Steps

### 1. Run Database Migrations

```bash
# Connect to your deployment environment
npx prisma db push
```

### 2. Seed Database

```bash
npm run db:seed
```

### 3. Change Default Password

1. Login with default credentials:
   - Email: `admin@bni.com`
   - Password: `admin123`

2. Immediately change the password!

### 4. Test PWA Installation

1. Open your app in Chrome/Edge on mobile
2. Click browser menu → "Add to Home Screen"
3. Verify app installs as PWA
4. Test offline functionality

### 5. Verify All Features

- [ ] Login/logout works
- [ ] Dashboard loads correctly
- [ ] Members can be added/edited
- [ ] Reports can be exported
- [ ] AI insights can be generated
- [ ] App works offline

---

## Troubleshooting

### Database Connection Issues

**Error**: "Can't reach database server"

**Solutions**:
1. Verify DATABASE_URL is correct
2. Check database allows remote connections
3. Ensure SSL is configured properly
4. Test connection locally:
   ```bash
   psql $DATABASE_URL
   ```

### Authentication Issues

**Error**: "Invalid credentials" or auth redirects

**Solutions**:
1. Verify NEXTAUTH_URL matches your domain exactly
2. Ensure NEXTAUTH_SECRET is set and long enough (32+ chars)
3. Clear browser cookies
4. Check browser console for errors

### Build Errors

**Error**: Build fails on deployment

**Solutions**:
1. Ensure all dependencies are in package.json
2. Check Node.js version matches (18+)
3. Try building locally first:
   ```bash
   npm run build
   ```
4. Clear Next.js cache:
   ```bash
   rm -rf .next
   ```

### PWA Not Installing

**Error**: App doesn't show "Add to Home Screen"

**Solutions**:
1. Ensure HTTPS is enabled (required for PWA)
2. Verify manifest.json is accessible
3. Check service worker is registered
4. Test on mobile device (desktop PWA support varies)
5. Verify icons exist in public folder

### Environment Variables Not Working

**Error**: Features not working due to missing env vars

**Solutions**:
1. Verify variable names match exactly
2. Restart deployment after adding variables
3. Check deployment logs for errors
4. Ensure no trailing spaces in values

---

## Security Checklist

Before going to production:

- [ ] Changed default admin password
- [ ] Generated secure NEXTAUTH_SECRET
- [ ] Using HTTPS
- [ ] Database connection uses SSL
- [ ] API keys are not committed to git
- [ ] Environment variables are set in deployment platform
- [ ] Regular database backups are configured
- [ ] Rate limiting is considered for API routes

---

## Monitoring and Maintenance

### Check Logs

- **Vercel**: Dashboard → Logs
- **Railway**: Dashboard → Logs
- **Render**: Dashboard → Logs

### Database Backups

Configure automated backups:
- **Railway**: Automatic (7-day retention)
- **Render**: Automatic (7-day retention)
- **Custom**: Use pg_dump regularly

### Updates

To update your app:

```bash
# Make changes locally
git add .
git commit -m "Update"
git push origin main

# Deployment platform will auto-deploy
```

---

## Support

For issues or questions:
1. Check this deployment guide
2. Review logs in your deployment platform
3. Check the architecture document: `plans/bni-dashboard-architecture.md`
4. Open an issue in your GitHub repository
