# MongoDB Setup Guide

## Option 1: Install MongoDB Locally (Recommended for Development)

### Windows Installation:
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will start automatically as a Windows Service

### Start MongoDB Service (if not running):
```bash
# Open Command Prompt as Administrator
net start MongoDB
```

## Option 2: Use MongoDB Atlas (Cloud - Free Tier)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (free tier M0)
4. Get connection string
5. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/helpdesk_mini?retryWrites=true&w=majority
   ```

## Option 3: Use MongoDB Docker (if you have Docker)

```bash
docker run --name helpdesk-mongo -p 27017:27017 -d mongo:7
```

## Verify MongoDB Connection

After starting MongoDB, you can verify it's running by:

### Method 1: Using MongoDB Compass (GUI)
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect to: `mongodb://localhost:27017`

### Method 2: Using Command Line
```bash
# If MongoDB shell is installed
mongosh
# or older versions
mongo
```

### Method 3: Check from our application
Just run the backend server - it will show "Connected to MongoDB" if successful.

## Quick Setup Commands

```bash
# 1. Setup and build (run once)
.\deploy-local.bat

# 2. Start application (run every time)
.\start.bat
```

## Troubleshooting

### MongoDB Connection Error:
- Ensure MongoDB service is running
- Check if port 27017 is available
- For Atlas: Check connection string and network access settings

### Frontend Build Issues:
- Delete `node_modules` and run `npm install`
- Check Node.js version (should be 16+)

### Port Already in Use:
- Backend (5000): Change PORT in `.env`
- Frontend (3000): Use different port with `serve -s dist -l 3001`