# Quick Render.com Deployment Guide

## 🚀 Step-by-Step Deployment

### Step 1: Go to Render.com
1. Visit: https://render.com/
2. Sign up with GitHub account
3. Click **"New +"** → **"Web Service"**

### Step 2: Connect Repository
1. Click **"Connect account"** (GitHub)
2. Search for: `helpdesk-mini` or `SundaramUpadhyay/helpdesk-mini`
3. Click **"Connect"**

### Step 3: Configure Service
**Basic Settings:**
- **Name:** `helpdesk-mini-backend`
- **Root Directory:** (leave empty)
- **Environment:** `Node`
- **Region:** Choose closest to you
- **Branch:** `main`

**Build & Deploy:**
- **Build Command:** `npm install`
- **Start Command:** `npm start`

### Step 4: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

**Required Variables:**
```
NODE_ENV = production
JWT_SECRET = helpdesk-mini-super-secret-jwt-key-2025-production-secure-change-this
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/helpdesk_mini
```

**MongoDB URI Setup:**
1. Go to https://cloud.mongodb.com/
2. Create free cluster
3. Create database user
4. Get connection string
5. Replace username, password, and database name

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. Get your backend URL (like: `https://helpdesk-mini-backend.onrender.com`)

### Step 6: Update Vercel
1. Go to Vercel dashboard
2. Your project → Settings → Environment Variables
3. Update `VITE_API_URL` to: `https://your-render-backend-url.onrender.com`
4. Redeploy frontend

## ✅ Verification
- Visit your Render backend URL + `/health`
- Should show: `{"status":"OK","timestamp":"..."}`
- Test login/register on your Vercel frontend

## 🔧 Common Issues

**Issue:** Build fails
**Fix:** Check package.json has correct dependencies

**Issue:** Can't connect to MongoDB  
**Fix:** Verify MONGODB_URI format and network access in Atlas

**Issue:** CORS errors
**Fix:** Your backend already handles CORS - check frontend API URL

**Note:** Render free tier may sleep after 15min inactivity. First request might take 30 seconds.