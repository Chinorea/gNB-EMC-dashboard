@echo off
REM gNB EMC Dashboard API Documentation Launcher
REM Run this script to start the local Swagger documentation server

echo ========================================================
echo gNB EMC Dashboard API Documentation Server
echo ========================================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.7+ and try again
    pause
    exit /b 1
)

REM Check if required packages are installed
python -c "import flask, flasgger" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Required packages not installed
    echo Installing flask and flasgger...
    pip install flask flasgger
    if errorlevel 1 (
        echo ERROR: Failed to install packages
        pause
        exit /b 1
    )
)

echo Starting documentation server...
echo.
echo Default configuration:
echo - Backend IP: 192.168.2.28
echo - Backend Port: 5000  
echo - Local Documentation Port: 8080
echo.
echo You can customize by running:
echo   python swagger_docs.py [backend_ip] [backend_port] [local_port]
echo.
echo Examples:
echo   python swagger_docs.py 192.168.1.50
echo   python swagger_docs.py 192.168.1.50 5000 9000
echo.
echo Starting with default settings...
echo.

REM Start the documentation server with your specific backend IP
python swagger_docs.py 192.168.2.28 5000

echo.
echo Documentation server stopped.
pause