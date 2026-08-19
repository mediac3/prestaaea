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
echo Abre tu navegador en: http://localhost:3000/login
echo Presiona Ctrl+C para detener el servidor.
echo.

:: Iniciar el servidor en segundo plano
start "" cmd /c "npm run dev"

:: Esperar unos segundos para que el servidor inicie
timeout /t 5 /nobreak >nul

:: Abrir el navegador en la pagina de login
echo [INFO] Abriendo navegador en la pagina de login...
start http://localhost:3000/login

echo.
echo [OK] Aplicacion iniciada correctamente.
echo La ventana del servidor se mantendra abierta.
echo Para detener el servidor, cierra la ventana de comandos o presiona Ctrl+C.
echo.
