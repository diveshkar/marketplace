@echo off
setlocal EnableExtensions

REM ---------------------------------------------------------------------------
REM DynamoDB Local (no Docker). Requires Java on PATH.
REM Set DYNAMODB_LOCAL_HOME to the folder that contains DynamoDBLocal.jar
REM and DynamoDBLocal_lib (from the official AWS zip).
REM Example (new terminal after setx):
REM   setx DYNAMODB_LOCAL_HOME "C:\full\path\to\that\folder"
REM Or uncomment and edit the next line:
REM set "DYNAMODB_LOCAL_HOME=C:\tools\dynamodb-local"
REM ---------------------------------------------------------------------------

if not defined DYNAMODB_LOCAL_HOME (
  echo [ERROR] DYNAMODB_LOCAL_HOME is not set.
  echo It must point to the folder that contains DynamoDBLocal.jar and DynamoDBLocal_lib.
  echo Example: setx DYNAMODB_LOCAL_HOME "C:\Users\Efito\Desktop\newProject\dynamoDbLocal"
  echo Or edit scripts\start-dynamodb-local.bat and uncomment the set line in the header.
  exit /b 1
)

if not exist "%DYNAMODB_LOCAL_HOME%\DynamoDBLocal.jar" (
  echo [ERROR] DynamoDBLocal.jar not found in:
  echo   %DYNAMODB_LOCAL_HOME%
  exit /b 1
)

if not exist "%DYNAMODB_LOCAL_HOME%\DynamoDBLocal_lib\" (
  echo [WARN] DynamoDBLocal_lib folder not found under %DYNAMODB_LOCAL_HOME%
  echo If startup fails, check -Djava.library.path matches your install layout.
)

where java >nul 2>&1
if errorlevel 1 (
  echo [ERROR] java not on PATH. Install a JDK or JRE ^(8+^).
  exit /b 1
)

cd /d "%DYNAMODB_LOCAL_HOME%"
echo.
echo DynamoDB Local  http://localhost:8000
echo Flags: -inMemory -sharedDb ^(matches docker compose in this repo^)
echo Stop: Ctrl+C or close this window
echo.
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -inMemory -sharedDb -port 8000

endlocal
