@echo off
REM Top View Public School - Complete Setup Script
REM Run this batch file to setup the entire project

echo.
echo ========================================
echo Top View Public School - Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo ✓ Node.js is installed
echo ✓ npm is installed
echo.

REM Navigate to backend and install
echo [1/5] Installing Backend Dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend installation failed!
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

REM Navigate to frontend and install
echo [2/5] Installing Frontend Dependencies...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend installation failed!
    pause
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

REM Create directories
echo [3/5] Creating required directories...
cd ..\backend
if not exist logs mkdir logs
if not exist uploads mkdir uploads
echo ✓ Directories created
echo.

REM Check .env files
echo [4/5] Checking configuration files...
if not exist backend\.env (
    echo WARNING: backend\.env not found - creating template
)
if not exist frontend\.env (
    echo WARNING: frontend\.env not found - creating template
)
echo.

REM Final message
echo [5/5] Setup Complete!
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Ensure PostgreSQL is running
echo 2. Create database:
echo    CREATE DATABASE top_view_school;
echo.
echo 3. Configure backend\.env file with your credentials:
echo    - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
echo    - JWT_SECRET, RAZORPAY credentials
echo    - EMAIL credentials
echo.
echo 4. Configure frontend\.env:
echo    - REACT_APP_API_URL=http://localhost:5000/api
echo.
echo 5. Run BACKEND_START.bat to start backend server
echo 6. Run FRONTEND_START.bat to start frontend (new terminal)
echo.
echo ========================================
echo.
pause
