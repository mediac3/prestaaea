@echo off
echo ==========================================
echo   Iniciando Prestaaea - Servidor Local
echo ==========================================
echo.

if not exist "node_modules" (
    echo [ERROR] Dependencias no instaladas. Ejecuta install.bat primero.
    pause
    exit /b 1
)

echo [INFO] Iniciando servidor de desarrollo...
echo Abre tu navegador en: http://localhost:3000
echo Presiona Ctrl+C para detener el servidor.
echo.

call npm run dev

pause
