@echo off
echo ==========================================
echo   Instalacion Local - Prestaaea (Windows)
echo ==========================================
echo.

:: Verificar si Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado.
    echo Por favor descarga e instala Node.js LTS desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js detectado: 
node -v
echo.

:: Verificar si ya existe node_modules
if not exist "node_modules" (
    echo [INFO] Instalando dependencias (esto puede tardar unos minutos)...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Fallo la instalacion de dependencias.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas correctamente.
) else (
    echo [INFO] Las dependencias ya estan instaladas.
)

echo.
echo [INFO] Inicializando base de datos local (SQLite)...
call npx prisma generate
call npx prisma db push

if %ERRORLEVEL% NEQ 0 (
    echo [ADVERTENCIA] Hubo un problema configurando la BD, pero puedes intentar iniciar igual.
)

echo.
echo ==========================================
echo   Instalacion Completada Exitosamente!
echo ==========================================
echo.
echo Para iniciar la aplicacion, ejecuta: start.bat
echo.
pause
