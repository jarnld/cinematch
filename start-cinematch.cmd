@echo off
setlocal

rem Always run from the folder containing this file, even if Windows opened
rem Command Prompt in C:\Windows\System32.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo CineMatch needs Node.js 20 or newer.
  echo Install the LTS version from https://nodejs.org/ and then reopen this file.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo CineMatch could not find npm. Reinstall the Node.js LTS release.
  pause
  exit /b 1
)

echo Starting CineMatch...
call npm run dev

if errorlevel 1 (
  echo.
  echo CineMatch stopped because of the error shown above.
  pause
)
