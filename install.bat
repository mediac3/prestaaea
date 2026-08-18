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
echo [INFO] Creando acceso directo en el escritorio...
call :CreateDesktopShortcut

echo.
echo =========================================
echo   Instalacion Completada Exitosamente!
echo =========================================
echo.
echo Se ha creado un icono en tu escritorio llamado "Prestaaea"
echo Para iniciar la aplicacion, haz doble click en el icono o ejecuta: start.bat
echo.
pause
exit /b 0

:CreateDesktopShortcut
:: Obtener la ruta completa del directorio actual
for %%I in (.) do set "APP_DIR=%%~fI"

:: Crear script VBScript para crear el acceso directo
echo Set WshShell = CreateObject("WScript.Shell") > "%TEMP%\create_shortcut.vbs"
echo Set oLink = WshShell.CreateShortcut("%USERPROFILE%\Desktop\Prestaaea.lnk") >> "%TEMP%\create_shortcut.vbs"
echo oLink.TargetPath = "%APP_DIR%\start_with_browser.bat" >> "%TEMP%\create_shortcut.vbs"
echo oLink.WorkingDirectory = "%APP_DIR%" >> "%TEMP%\create_shortcut.vbs"
echo oLink.IconLocation = "%SystemRoot%\System32\shell32.dll,13" >> "%TEMP%\create_shortcut.vbs"
echo oLink.Description = "Prestaaea - Sistema de Gestion de Prestamos" >> "%TEMP%\create_shortcut.vbs"
echo oLink.Save >> "%TEMP%\create_shortcut.vbs"

:: Ejecutar el script VBScript
cscript //nologo "%TEMP%\create_shortcut.vbs"

:: Eliminar archivo temporal
del "%TEMP%\create_shortcut.vbs"

echo [OK] Acceso directo creado en el escritorio.
goto :EOF
