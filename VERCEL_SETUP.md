# Vercel Deployment Setup Guide

## 1. Vercel Environment Variables

### In Vercel Dashboard → Your Project → Settings → Environment Variables:

**Add this variable:**
```
Name: VITE_API_URL
Value: https://your-backend-url.com
Environment: Production
```

## 2. Vercel Project Settings

### Build & Development Settings:
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Advanced Settings:
- **Node.js Version:** 18.x (recommended)

## 3. Backend Deployment (Deploy First!)

You need to deploy your backend BEFORE deploying frontend to Vercel.

### Option A: Railway.app (Recommended)
1. Go to https://railway.app/
2. Connect GitHub repository
3. Select root directory (not frontend)
4. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/helpdesk_mini
   JWT_SECRET=your-super-long-secure-secret-key
   NODE_ENV=production
   ```
4. Deploy → Get URL (e.g., `https://helpdesk-mini-production.up.railway.app`)

### Option B: Render.com
1. Go to https://render.com/
2. Connect GitHub → New Web Service
3. Select repository, root directory: `.` (not frontend)
4. Runtime: Node
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add environment variables (same as Railway)

## 4. Complete Deployment Steps

### Step 1: Deploy Backend
```bash
# Deploy to Railway or Render first
# Get the backend URL (e.g., https://your-backend.railway.app)
```

### Step 2: Update Vercel Environment Variables
```bash
# In Vercel dashboard, add:
VITE_API_URL=https://your-actual-backend-url
```

### Step 3: Deploy Frontend
```bash
# Vercel will auto-deploy from GitHub
# Or manually: vercel --prod
```

### Step 4: Test Everything
- Visit your Vercel URL
- Register new user
- Create tickets
- Verify API calls work

## 5. Common Issues & Solutions

### Issue: "Network Error" or "Failed to fetch"
**Solution:** Check VITE_API_URL is correct and backend is running

### Issue: CORS errors
**Solution:** Your backend already has CORS configured for all origins

### Issue: Build fails on Vercel
**Solution:** 
- Check Root Directory is set to `frontend`
- Verify Build Command is `npm run build`
- Check all dependencies are in frontend/package.json

### Issue: Environment variables not working
**Solution:**
- Ensure variable name is EXACTLY `VITE_API_URL`
- Redeploy after adding environment variables
- Check variable is set for correct environment (Production)

## 6. Environment Variable Values by Platform

### If Backend on Railway:
```
VITE_API_URL=https://helpdesk-mini-production.up.railway.app
```

### If Backend on Render:
```
VITE_API_URL=https://helpdesk-mini.onrender.com
```

### If Backend on Heroku:
```
VITE_API_URL=https://your-app-name.herokuapp.com
```

### Local Development:
```
VITE_API_URL=http://localhost:5000
```

## 7. Verification Commands

### Check if environment variable is loaded:
In your browser console on deployed site:
```javascript
console.log(import.meta.env.VITE_API_URL)
```

Should output your backend URL, not undefined.

---

**⚠️ IMPORTANT:** 
- Deploy backend FIRST, then frontend
- Don't include `/api` in VITE_API_URL (it's added automatically)
- Environment variables must start with `VITE_` in Vite projects
- Redeploy frontend after changing environment variables