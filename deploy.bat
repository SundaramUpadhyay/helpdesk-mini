@echo off
REM HelpDesk Mini Deployment Script for Windows

echo 🚀 Starting HelpDesk Mini Deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are installed

REM Create production environment file
echo 📝 Creating production environment...
(
echo NODE_ENV=production
echo MONGODB_URI=mongodb://mongodb:27017/helpdesk_mini
echo JWT_SECRET=your-super-secure-production-jwt-secret-key-change-this-now
echo PORT=5000
) > .env.production

echo ✅ Production environment created

REM Build and start services
echo 🏗️ Building and starting services...
docker-compose up --build -d

echo ⏳ Waiting for services to start...
timeout /t 15 /nobreak >nul

echo ✅ Services started!
echo.
echo 🎉 HelpDesk Mini is now deployed!
echo.
echo 📋 Service URLs:
echo    Frontend: http://localhost
echo    Backend API: http://localhost:5000
echo    MongoDB: mongodb://localhost:27017
echo.
echo 🔧 Management Commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart: docker-compose restart
echo.

pause