@echo off
setlocal EnableDelayedExpansion

:: Navigate to project root directory
cd /d "%~dp0"
set "ROOT_DIR=%~dp0"

:: ---------------------------------------------------------
:: Command Dispatcher
:: Default (no argument) = start
:: Supported: start, stop, restart, status, help
:: ---------------------------------------------------------
set "ACTION=%~1"
if /i "%ACTION%"=="stop" goto :do_stop
if /i "%ACTION%"=="restart" goto :do_restart
if /i "%ACTION%"=="status" goto :do_status
if /i "%ACTION%"=="help" goto :do_help
if /i "%ACTION%"=="-h" goto :do_help
if /i "%ACTION%"=="/?" goto :do_help
if /i "%ACTION%"=="start" goto :do_start
if "%ACTION%"=="" goto :do_start

echo [ERROR] Unknown action "%ACTION%".
echo Usage: %~nx0 [start^|stop^|restart^|status^|help]
exit /b 1

:: =========================================================
:: STOP ROUTINE
:: =========================================================
:do_stop
title ScholarTrack Shutdown
echo ======================================================================
echo    ScholarTrack — Stopping Services (Ports 8000 and 5173)
echo ======================================================================
echo.
call :stop_internal
echo.
if "!STOPPED_ANY!"=="1" (
    echo [*] ScholarTrack services have been stopped.
) else (
    echo [*] No running ScholarTrack services found on ports 8000 or 5173.
)
echo.
timeout /t 2 /nobreak >nul 2>nul || ping -n 3 127.0.0.1 >nul
exit /b 0

:stop_internal
set "STOPPED_ANY=0"

echo [*] Checking Port 8000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":8000 .*LISTENING"') do (
    set "PID=%%a"
    if defined PID (
        echo      Stopping Backend process PID: !PID!
        taskkill /F /T /PID !PID! >nul 2>nul
        set "STOPPED_ANY=1"
    )
)

echo [*] Checking Port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":5173 .*LISTENING"') do (
    set "PID=%%a"
    if defined PID (
        echo      Stopping Frontend process PID: !PID!
        taskkill /F /T /PID !PID! >nul 2>nul
        set "STOPPED_ANY=1"
    )
)
exit /b 0

:: =========================================================
:: RESTART ROUTINE
:: =========================================================
:do_restart
title ScholarTrack Restart
echo ======================================================================
echo    ScholarTrack — Restarting Services
echo ======================================================================
echo.
call :stop_internal
echo [*] Waiting for ports to release...
timeout /t 2 /nobreak >nul 2>nul || ping -n 3 127.0.0.1 >nul
echo.
goto :do_start

:: =========================================================
:: STATUS ROUTINE
:: =========================================================
:do_status
title ScholarTrack Status
echo ======================================================================
echo    ScholarTrack — Service Status
echo ======================================================================
echo.
set "BACKEND_PID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":8000 .*LISTENING"') do (
    set "BACKEND_PID=%%a"
)
set "FRONTEND_PID="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr /r ":5173 .*LISTENING"') do (
    set "FRONTEND_PID=%%a"
)

if defined BACKEND_PID (
    echo   [+] Backend  [Port 8000]: RUNNING [PID: !BACKEND_PID!]
) else (
    echo   [-] Backend  [Port 8000]: STOPPED
)

if defined FRONTEND_PID (
    echo   [+] Frontend [Port 5173]: RUNNING [PID: !FRONTEND_PID!]
) else (
    echo   [-] Frontend [Port 5173]: STOPPED
)
echo.
exit /b 0

:: =========================================================
:: HELP ROUTINE
:: =========================================================
:do_help
echo ======================================================================
echo   ScholarTrack Service Manager
echo ======================================================================
echo.
echo Usage:
echo   start.bat            - Start all services (default on double-click)
echo   start.bat start      - Start all services
echo   start.bat stop       - Stop all running ScholarTrack services
echo   start.bat restart    - Stop and restart all services
echo   start.bat status     - Check running status of backend and frontend
echo   start.bat help       - Show this command reference
echo.
exit /b 0

:: =========================================================
:: START ROUTINE (Default)
:: =========================================================
:do_start
title ScholarTrack Launcher

echo ======================================================================
echo   ScholarTrack (WEB-02) - Precision Deadline Observatory Launcher
echo ======================================================================
echo.

:: 1. Verify Python Installation
echo [*] Checking system environment...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in your PATH!
    echo Please install Python 3.10 or higher and ensure Add Python to PATH is checked.
    echo Download: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

:: 2. Verify Node.js and npm Installation
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js or npm was not found in your PATH!
    echo Please install Node.js v18 or higher from https://nodejs.org/ and restart this script.
    echo.
    pause
    exit /b 1
)

:: 3. Detect Python Virtual Environment if present
set "VENV_ACTIVATE="
if exist "%ROOT_DIR%backend\venv\Scripts\activate.bat" (
    set "VENV_ACTIVATE=call "%ROOT_DIR%backend\venv\Scripts\activate.bat" && "
) else if exist "%ROOT_DIR%backend\.venv\Scripts\activate.bat" (
    set "VENV_ACTIVATE=call "%ROOT_DIR%backend\.venv\Scripts\activate.bat" && "
) else if exist "%ROOT_DIR%venv\Scripts\activate.bat" (
    set "VENV_ACTIVATE=call "%ROOT_DIR%venv\Scripts\activate.bat" && "
) else if exist "%ROOT_DIR%.venv\Scripts\activate.bat" (
    set "VENV_ACTIVATE=call "%ROOT_DIR%.venv\Scripts\activate.bat" && "
)

:: 4. Verify / Install Backend Dependencies
echo.
echo [1/4] Checking Python backend dependencies...
cd /d "%ROOT_DIR%backend"
if defined VENV_ACTIVATE (
    call %VENV_ACTIVATE%
)

python -c "import fastapi, uvicorn, bs4, httpx" >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] Installing required Python packages from requirements.txt...
    python -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Python dependencies.
        pause
        exit /b 1
    )
) else (
    echo [*] Backend dependencies verified.
)

:: 5. Run Database Migrations
echo.
echo [2/4] Applying SQLite schema migrations...
cd /d "%ROOT_DIR%backend"
python migrations\run_migrations.py
if %errorlevel% neq 0 (
    echo [ERROR] Database migration failed.
    pause
    exit /b 1
)

:: 6. Verify / Install Frontend Dependencies
echo.
echo [3/4] Checking Frontend dependencies...
cd /d "%ROOT_DIR%frontend"
if not exist "node_modules\" (
    echo [*] node_modules not detected. Installing npm dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
) else (
    echo [*] Frontend dependencies verified.
)

:: 7. Launch Backend and Frontend
echo.
echo [4/4] Starting ScholarTrack services...

:: Launch FastAPI Backend on 127.0.0.1:8000 in a new window
if defined VENV_ACTIVATE (
    start "ScholarTrack Backend (FastAPI :8000)" /D "%ROOT_DIR%backend" cmd /k "title ScholarTrack Backend :8000 && %VENV_ACTIVATE%python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
) else (
    start "ScholarTrack Backend (FastAPI :8000)" /D "%ROOT_DIR%backend" cmd /k "title ScholarTrack Backend :8000 && python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
)

:: Launch Vite Frontend on 127.0.0.1:5173 in a new window
start "ScholarTrack Frontend (Vite :5173)" /D "%ROOT_DIR%frontend" cmd /k "title ScholarTrack Frontend :5173 && npm run dev -- --host 127.0.0.1 --port 5173"

echo [*] Initializing servers...
timeout /t 3 /nobreak >nul 2>nul || ping -n 4 127.0.0.1 >nul

:: Launch browser
echo [*] Opening ScholarTrack UI in default browser...
start http://127.0.0.1:5173

echo.
echo ======================================================================
echo   ScholarTrack is now running!
echo.
echo   - Web Application:  http://127.0.0.1:5173/
echo   - Backend REST API: http://127.0.0.1:8000/
echo   - Swagger Docs:     http://127.0.0.1:8000/docs
echo.
echo   Dedicated terminal windows have opened for the backend and frontend.
echo   - Inspect live API requests and HMR logs in those windows.
echo   - To stop ScholarTrack, run: start.bat stop
echo ======================================================================
echo.
pause
exit /b 0
