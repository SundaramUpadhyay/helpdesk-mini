@echo off
REM HelpDesk Mini Local Deployment Script (No Docker Required)

echo 🚀 Starting HelpDesk Mini Local Deployment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if MongoDB is running
echo 📊 Checking MongoDB connection...
mongo --eval "db.adminCommand('ismaster')" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB is not running. Please start MongoDB or use MongoDB Atlas.
    echo    - Local: Start MongoDB service
    echo    - Cloud: Update .env with MongoDB Atlas connection string
    pause
)

echo ✅ Node.js is available

REM Install backend dependencies
echo 📦 Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Build frontend
echo 🏗️ Building frontend for production...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build frontend
    pause
    exit /b 1
)

REM Go back to root
cd ..

REM Install serve globally if not present
echo 📦 Installing static file server...
call npm install -g serve

REM Create production environment
echo 📝 Creating production environment...
(
echo NODE_ENV=production
echo MONGODB_URI=mongodb://localhost:27017/helpdesk_mini_prod
echo JWT_SECRET=prod-jwt-secret-key-change-this-in-real-production
echo PORT=5000
) > .env.production

echo ✅ Setup complete!
echo.
echo 🎉 HelpDesk Mini is ready for deployment!
echo.
echo 📋 To start the application:
echo    1. Backend: npm run prod
echo    2. Frontend: cd frontend ^&^& serve -s dist -l 3000
echo.
echo 🌐 URLs:
echo    Frontend: http://localhost:3000
echo    Backend: http://localhost:5000
echo.
echo 🔧 Quick start commands:
echo    Start backend: npm run prod
echo    Start frontend: cd frontend ^&^& serve -s dist -l 3000
echo.

pause