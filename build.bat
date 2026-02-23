@echo off

REM =========================
REM ANSI colors
REM =========================
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"

set C_RESET=%ESC%[0m
set C_TITLE=%ESC%[96m
set C_INFO=%ESC%[94m
set C_OK=%ESC%[92m
set C_WARN=%ESC%[93m
set C_ERR=%ESC%[91m
set C_LINE=%ESC%[90m

set INCLUDE_ARM64=true

REM -------------------------
REM Parse arguments
REM -------------------------
for %%i in (%*) do (
    if "%%i"=="--include-arm64" (
        set INCLUDE_ARM64=true
    )
)

echo %C_LINE%-------------------------%C_RESET%
echo %C_TITLE%MicaElectron Builder v1.1%C_RESET%
echo %C_LINE%-------------------------%C_RESET%
echo.

REM -------------------------
REM Safety checks
REM -------------------------
where node >nul 2>&1 || (
    echo %C_ERR%[ERROR]%C_RESET% Node.js not found in PATH
    exit /b 1
)

where node-gyp >nul 2>&1 || (
    echo %C_ERR%[ERROR]%C_RESET% node-gyp not found in PATH
    exit /b 1
)

if exist data (
    ren data binding.gyp || (
        echo %C_ERR%[ERROR]%C_RESET% Failed to rename data to binding.gyp
        exit /b 1
    )
)

if not exist binding.gyp (
    echo %C_ERR%[ERROR]%C_RESET% binding.gyp not found
    exit /b 1
)

REM -------------------------
REM Reset src folder
REM -------------------------
echo %C_LINE%-------------------------%C_RESET%
echo %C_INFO%Resetting src folder...%C_RESET%

if exist src (
    rmdir /s /q src || (
        echo %C_ERR%[ERROR]%C_RESET% Failed to remove src folder
        goto restore_gyp
    )
)

mkdir src || (
    echo %C_ERR%[ERROR]%C_RESET% Failed to create src folder
    goto restore_gyp
)

REM -------------------------
REM Build x64
REM -------------------------
echo %C_LINE%-------------------------%C_RESET%

node-gyp rebuild >nul 2>&1 | echo %C_INFO%Building x64...%C_RESET%
if errorlevel 1 (
    echo %C_ERR%[ERROR]%C_RESET% x64 build failed
    goto restore_gyp
)

if not exist build\Release\micaElectron.node (
    echo %C_ERR%[ERROR]%C_RESET% x64 output file not found
    goto restore_gyp
)

move build\Release\micaElectron.node src\micaElectron_x64.node >nul || (
    echo %C_ERR%[ERROR]%C_RESET% Failed to move x64 binary
    goto restore_gyp
)

echo %C_OK%[OK]%C_RESET% x64 build completed
echo.

REM -------------------------
REM Build ia32
REM -------------------------
echo %C_LINE%-------------------------%C_RESET%

node-gyp rebuild --arch=ia32 >nul 2>&1 | echo %C_INFO%Building ia32...%C_RESET%
if errorlevel 1 (
    echo %C_ERR%[ERROR]%C_RESET% ia32 build failed
    goto restore_gyp
)

if not exist build\Release\micaElectron.node (
    echo %C_ERR%[ERROR]%C_RESET% ia32 output file not found
    goto restore_gyp
)

move build\Release\micaElectron.node src\micaElectron_ia32.node >nul || (
    echo %C_ERR%[ERROR]%C_RESET% Failed to move ia32 binary
    goto restore_gyp
)

echo %C_OK%[OK]%C_RESET% ia32 build completed
echo.

REM -------------------------
REM Build ARM64 (optional)
REM -------------------------
if "%INCLUDE_ARM64%"=="true" (
    echo %C_LINE%-------------------------%C_RESET%

    node-gyp rebuild --arch=arm64 >nul 2>&1 | echo %C_INFO%Building arm64...%C_RESET%
    if errorlevel 1 (
        echo %C_ERR%[ERROR]%C_RESET% arm64 build failed
        goto restore_gyp
    )

    if not exist build\Release\micaElectron.node (
        echo %C_ERR%[ERROR]%C_RESET% arm64 output file not found
        goto restore_gyp
    )

    move build\Release\micaElectron.node src\micaElectron_arm64.node >nul || (
        echo %C_ERR%[ERROR]%C_RESET% Failed to move arm64 binary
        goto restore_gyp
    )

    echo %C_OK%[OK]%C_RESET% arm64 build completed
    echo.
)

REM -------------------------
REM Cleanup
REM -------------------------
echo %C_LINE%-------------------------%C_RESET%
echo %C_INFO%Cleaning build artifacts...%C_RESET%

if exist build (
    rmdir /s /q build || (
        echo %C_ERR%[ERROR]%C_RESET% Failed to remove build folder
        goto restore_gyp
    )
)

REM -------------------------
REM Restore binding.gyp
REM -------------------------
:restore_gyp
if exist binding.gyp (
    ren binding.gyp data
)

echo %C_LINE%-------------------------%C_RESET%
echo %C_OK%Build finished successfully%C_RESET%
echo %C_LINE%-------------------------%C_RESET%

exit /b 0