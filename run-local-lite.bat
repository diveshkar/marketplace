@echo off
setlocal
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

echo.
echo === run-local-lite ===
echo Skipping Docker, db:init, and db:seed.
echo /health will fail until DynamoDB Local is running, then:
echo   pnpm db:init
echo   pnpm db:seed
echo.
echo DynamoDB Local options:
echo   - Docker: pnpm docker:up   or   run-local.bat
echo   - No Docker: scripts\start-dynamodb-local.bat ^(set DYNAMODB_LOCAL_HOME^)
echo   - All-in-one ^(no Docker^): run-local-jar.bat
echo Full steps: see DEV-LOCAL.txt
echo.

call pnpm install
if errorlevel 1 exit /b 1

call pnpm dev:lite
endlocal
