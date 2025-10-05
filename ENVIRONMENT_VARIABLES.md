# Environment Variables Setup Guide for HelpDesk Mini

## 1. FRONTEND (Vercel) Environment Variables

### In Vercel Dashboard → Settings → Environment Variables:

| Variable Name    | Value                                    | Environment |
|-----------------|------------------------------------------|-------------|
| `VITE_API_URL`  | `https://your-backend-url.com`          | Production  |

### Example Backend URLs:
- Railway: `https://helpdesk-mini-production.up.railway.app`
- Render: `https://helpdesk-mini.onrender.com`  
- Heroku: `https://your-app-name.herokuapp.com`

---

## 2. BACKEND Environment Variables

### For Railway.app:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/helpdesk_mini?retryWrites=true&w=majority
JWT_SECRET=super-secure-jwt-secret-key-min-32-chars-long-change-this-now
NODE_ENV=production
```

### For Render.com:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/helpdesk_mini?retryWrites=true&w=majority
JWT_SECRET=super-secure-jwt-secret-key-min-32-chars-long-change-this-now
NODE_ENV=production
PORT=5000
```

### For Heroku:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/helpdesk_mini?retryWrites=true&w=majority
JWT_SECRET=super-secure-jwt-secret-key-min-32-chars-long-change-this-now
NODE_ENV=production
```

---

## 3. MONGODB ATLAS Setup

### Step 1: Create MongoDB Atlas Account
1. Go to https://cloud.mongodb.com/
2. Sign up for free account
3. Create new project: "HelpDesk Mini"

### Step 2: Create Cluster
1. Choose "Build a Database" → "Free" (M0 Sandbox)
2. Select region closest to your backend deployment
3. Name cluster: "HelpDesk-Cluster"

### Step 3: Create Database User
1. Go to "Database Access"
2. Add new database user
3. Username: `helpdesk_admin`
4. Password: Generate secure password
5. Database User Privileges: "Read and write to any database"

### Step 4: Set Network Access
1. Go to "Network Access"
2. Add IP Address: `0.0.0.0/0` (Allow access from anywhere)
3. Comment: "Allow all IPs for deployment"

### Step 5: Get Connection String
1. Go to "Database" → "Connect" → "Connect your application"
2. Copy connection string
3. Replace `<username>`, `<password>`, and `<dbname>` with your values

Example connection string:
```
mongodb+srv://helpdesk_admin:your_password@helpdesk-cluster.xxxxx.mongodb.net/helpdesk_mini?retryWrites=true&w=majority
```

---

## 4. JWT SECRET Generation

### Generate Strong JWT Secret:

#### Option 1: Online Generator
- Use: https://generate-secret.vercel.app/32
- Copy the generated secret

#### Option 2: Node.js Command
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Option 3: Manual
Create a random string with at least 32 characters:
```
JWT_SECRET=f8a7b2c9d4e6f1a3b8c5d7e9f2a4b6c8d1e3f5a7b9c2d4e6f8a1b3c5d7e9f2a4
```

---

## 5. DEPLOYMENT ORDER

### Step 1: Setup MongoDB Atlas
- Create cluster and get connection string

### Step 2: Deploy Backend First
- Add all backend environment variables
- Test API endpoints work

### Step 3: Deploy Frontend
- Add `VITE_API_URL` pointing to deployed backend
- Test full application

### Step 4: Test Everything
- Register new user
- Create tickets  
- Test all functionality

---

## 6. SECURITY NOTES

⚠️ **IMPORTANT:**
- Never commit real `.env` files to Git
- Use strong, unique JWT secrets for production
- Restrict MongoDB network access in production
- Use different database names for dev/staging/prod
- Regularly rotate secrets

✅ **SAFE:**
- Environment variables in deployment platforms
- `.env.example` files in Git (with placeholder values)
- Documentation with variable names (not values)