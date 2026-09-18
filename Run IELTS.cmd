@echo off
title IELTS 7.5 Lab
cd /d "%~dp0"
where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js is missing. Install Node.js 22.12 or newer, then try again.
  pause
  exit /b 1
)
node.exe scripts\run-local.mjs
if errorlevel 1 pause
