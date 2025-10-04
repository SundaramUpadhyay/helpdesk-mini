@echo off
echo 🚀 Starting HelpDesk Mini...

REM Start backend in background
echo 🔧 Starting backend server...
start "HelpDesk Backend" cmd /k "npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🎨 Starting frontend server...
cd frontend
start "HelpDesk Frontend" cmd /k "serve -s dist -l 3000"

echo ✅ Both services are starting...
echo.
echo 🌐 Application URLs:
echo    Frontend: http://localhost:3000
echo    Backend: http://localhost:5000
echo.
echo 📝 Note: Two command windows will open for backend and frontend
echo    Close those windows to stop the services
echo.

pause