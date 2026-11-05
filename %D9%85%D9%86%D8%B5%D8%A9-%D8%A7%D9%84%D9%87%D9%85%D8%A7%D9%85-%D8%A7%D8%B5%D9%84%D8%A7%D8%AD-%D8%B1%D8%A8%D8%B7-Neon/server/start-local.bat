@echo off
setlocal
cd /d "%~dp0"
title Al-Hamam Platform - local server
where node >nul 2>nul
if errorlevel 1 goto nonode
if exist data\db.json goto run
echo === First run: create the System Owner account ===
set /p OWNER_USER=Owner username (english letters, 3+):
set /p OWNER_PASS=Owner password (6+ characters):
:run
set PORT=3000
start "" /b cmd /c "timeout /t 3 >nul & start http://localhost:3000"
echo Server running on http://localhost:3000  (keep this window open)
node server.js
pause
exit /b 0
:nonode
echo Node.js is not installed. Download version 20 or newer from https://nodejs.org then run this file again.
pause
exit /b 1
