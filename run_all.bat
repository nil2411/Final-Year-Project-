@echo off
title KrishiSaathi Launcher
color 0A

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%Frontend"

echo.
echo  ============================================
echo   KrishiSaathi - Project Launcher
echo  ============================================
echo.

:: ─────────────────────────────────────────────
:: CHECK PYTHON
:: ─────────────────────────────────────────────
echo  Checking Python...
python --version
if errorlevel 1 (
    echo.
    echo  [ERROR] Python not found in PATH.
    echo  Fix: Install from https://www.python.org
    echo  During install, tick "Add Python to PATH"
    echo.
    pause
    exit /b
)
echo  [OK] Python found.
echo.

:: ─────────────────────────────────────────────
:: CHECK NODE
:: ─────────────────────────────────────────────
echo  Checking Node.js...
node --version
if errorlevel 1 (
    echo.
    echo  [ERROR] Node.js not found in PATH.
    echo  Fix: Install from https://nodejs.org
    echo  After install, RESTART this bat file.
    echo.
    pause
    exit /b
)
echo  [OK] Node.js found.
echo.

:: ─────────────────────────────────────────────
:: CHECK BACKEND FOLDER EXISTS
:: ─────────────────────────────────────────────
echo  Checking folders...
if not exist "%BACKEND%" (
    echo  [ERROR] backend folder not found at:
    echo  %BACKEND%
    echo  Make sure run_all.bat is inside the project root folder.
    echo.
    pause
    exit /b
)
if not exist "%FRONTEND%" (
    echo  [ERROR] Frontend folder not found at:
    echo  %FRONTEND%
    echo  Make sure run_all.bat is inside the project root folder.
    echo.
    pause
    exit /b
)
echo  [OK] Folders found.
echo.

:: ─────────────────────────────────────────────
:: CREATE VENV IF MISSING
:: ─────────────────────────────────────────────
if not exist "%BACKEND%\venv\Scripts\activate.bat" (
    echo  [SETUP] Creating Python virtual environment...
    cd /d "%BACKEND%"
    python -m venv venv
    if errorlevel 1 (
        echo  [ERROR] Failed to create venv. See above.
        pause
        exit /b
    )
    echo  [OK] venv created.
    echo.
)

:: ─────────────────────────────────────────────
:: INSTALL PYTHON DEPS IF MISSING
:: ─────────────────────────────────────────────
call "%BACKEND%\venv\Scripts\activate.bat"
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo  [SETUP] Installing Python packages...
    echo  This may take several minutes on first run.
    echo.
    cd /d "%BACKEND%"
    pip install -r requirements.txt
    if errorlevel 1 (
        echo  [WARN] Some packages failed. Check errors above.
        pause
    )
    echo  [OK] Python packages done.
    echo.
) else (
    echo  [OK] Python packages already installed.
    echo.
)

:: ─────────────────────────────────────────────
:: CREATE .env IF MISSING
:: ─────────────────────────────────────────────
if not exist "%BACKEND%\.env" (
    echo  [SETUP] Creating .env template...
    (
        echo GROQ_API_KEY=your_groq_api_key_here
        echo GROQ_MODEL=llama-3.1-8b-instant
        echo EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
        echo VECTOR_DB=faiss
        echo TTS_ENGINE=gTTS
        echo STT_ENGINE=whisper
        echo HOST=0.0.0.0
        echo PORT=8000
        echo DEBUG=true
        echo DEFAULT_LANGUAGE=en
        echo TOP_K=5
        echo CHUNK_SIZE=1000
        echo CHUNK_OVERLAP=200
    ) > "%BACKEND%\.env"
    echo.
    echo  -----------------------------------------------
    echo   ACTION REQUIRED:
    echo   Open  backend\.env  and replace
    echo   "your_groq_api_key_here" with your real key.
    echo   Get free key: https://console.groq.com/keys
    echo  -----------------------------------------------
    echo.
    pause
)
echo  [OK] .env file found.
echo.

:: ─────────────────────────────────────────────
:: NPM INSTALL IF MISSING
:: ─────────────────────────────────────────────
if not exist "%FRONTEND%\node_modules" (
    echo  [SETUP] Running npm install in Frontend...
    cd /d "%FRONTEND%"
    npm install
    if errorlevel 1 (
        echo  [ERROR] npm install failed. See above.
        pause
        exit /b
    )
    echo  [OK] npm packages installed.
    echo.
) else (
    echo  [OK] npm packages already installed.
    echo.
)

:: ─────────────────────────────────────────────
:: LAUNCH ALL SERVICES
:: ─────────────────────────────────────────────
echo  ============================================
echo   Launching all 4 services...
echo  ============================================
echo.

echo  [1/4] Starting Main Backend  (port 8000)...
start "Main Backend" cmd /k "cd /d "%BACKEND%" && call venv\Scripts\activate.bat && echo Starting main.py... && python main.py && pause"
timeout /t 3 /nobreak >nul

echo  [2/4] Starting Fertilizer    (port 5000)...
start "Fertilizer" cmd /k "cd /d "%BACKEND%" && call venv\Scripts\activate.bat && echo Starting fertilizer_app.py... && python fertilizer_app.py && pause"
timeout /t 2 /nobreak >nul

echo  [3/4] Starting Crop Disease  (port 5001)...
start "Crop Disease" cmd /k "cd /d "%BACKEND%" && call venv\Scripts\activate.bat && echo Starting crop_app.py... && python crop_app.py && pause"
timeout /t 2 /nobreak >nul

echo  [4/4] Starting Frontend      (port 5173)...
start "Frontend" cmd /k "cd /d "%FRONTEND%" && npm run dev && pause"
echo.

:: ─────────────────────────────────────────────
:: WAIT FOR FRONTEND THEN OPEN BROWSER
:: ─────────────────────────────────────────────
echo  Waiting for frontend to be ready...
echo  (Watch the "Frontend" window - open browser when you see "Local: http://localhost:5173")
echo.

:WAIT_LOOP
timeout /t 2 /nobreak >nul
curl -s --max-time 1 http://localhost:5173 >nul 2>&1
if errorlevel 1 goto WAIT_LOOP

echo  [OK] Frontend is ready! Opening browser...
start http://localhost:5173

echo.
echo  ============================================
echo   All services running!
echo   Frontend  : http://localhost:5173
echo   Backend   : http://localhost:8000
echo   API Docs  : http://localhost:8000/docs
echo  ============================================
echo.
echo  To stop: close each of the 4 service windows.
echo  Press any key to close this launcher window.
pause
