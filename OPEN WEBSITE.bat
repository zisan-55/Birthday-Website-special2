@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is needed to open this website.
  echo Install Node.js, then double-click this file again.
  echo Download it from https://nodejs.org/
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please install Node.js from https://nodejs.org/ and try again.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Preparing the website for first use. Please wait...
  call npm install
  if errorlevel 1 (
    echo Setup did not finish. Check your internet connection and try again.
    pause
    exit /b 1
  )
)
start "" cmd /c "timeout /t 3 /nobreak >nul ^& start http://localhost:5173/"
call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
pause