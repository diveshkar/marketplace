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

where docker >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Docker not found on PATH.
  echo.
  echo Local options ^(no AWS deployment needed^):
  echo   1^) run-local-jar.bat     — DynamoDB Local via Java ^(set DYNAMODB_LOCAL_HOME^)
  echo   2^) run-local-lite.bat    — API + web only ^(start DynamoDB yourself first^)
  echo.
  exit /b 1
)

echo Starting DynamoDB Local ^(Docker^) + db init/seed + API + web ...
echo Stop API/web: Ctrl+C   Stop DynamoDB: pnpm docker:down
echo.
call pnpm local:docker
endlocal
