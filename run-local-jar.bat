@echo off
setlocal EnableExtensions
cd /d "%~dp0"

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] pnpm not found. Install with: npm install -g pnpm
  exit /b 1
)

if not exist .env (
  echo Creating .env from .env.example ...
  copy /Y .env.example .env >nul
)

echo Installing dependencies...
call pnpm install
if errorlevel 1 exit /b 1

echo.
echo Starting DynamoDB Local in a new window ^(scripts\start-dynamodb-local.bat^).
echo Configure DYNAMODB_LOCAL_HOME or edit that script first if you have not already.
echo.
start "DynamoDB Local" cmd /k "%~dp0scripts\start-dynamodb-local.bat"

echo Waiting a few seconds for DynamoDB Local on port 8000...
timeout /t 5 /nobreak >nul

echo.
echo db:init, db:seed, then API + web ^(Ctrl+C stops API/web; close DynamoDB window separately^)...
call pnpm local:up:jar
if errorlevel 1 (
  echo [ERROR] local:up:jar failed. Is DynamoDB on port 8000? Check DYNAMODB_LOCAL_HOME and scripts\start-dynamodb-local.bat.
  exit /b 1
)
endlocal
