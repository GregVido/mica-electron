@echo off
set INCLUDE_ARM64=false

REM Check for --include-arm64 argument
for %%i in (%*) do (
    if "%%i"=="--include-arm64" (
        set INCLUDE_ARM64=true
    )
)

echo -------------------------
echo MicaElectron builder v1.0
echo -------------------------
echo.

ren data binding.gyp

echo -------------------------
echo Reset src folders
rmdir /s /q src
mkdir src

echo -------------------------
echo.

echo -------------------------

node-gyp rebuild >nul 2>&1 | echo Build for x64
echo move build\Release\micaElectron.node to src\micaElectron_x64.node
move build\Release\micaElectron.node src\micaElectron_x64.node >nul 2>&1

echo -------------------------
echo.

echo -------------------------

node-gyp rebuild --arch=ia32 >nul 2>&1 | echo Build for ia32
echo move build\Release\micaElectron.node to src\micaElectron_ia32.node
move build\Release\micaElectron.node src\micaElectron_ia32.node >nul 2>&1

echo -------------------------
echo.

if "%INCLUDE_ARM64%"=="true" (
    echo -------------------------

    node-gyp rebuild --arch=arm64 >nul 2>&1 | echo Build for arm64
    echo move build\Release\micaElectron.node to src\micaElectron_arm64.node
    move build\Release\micaElectron.node src\micaElectron_arm64.node >nul 2>&1

    echo -------------------------
    echo.
)

echo -------------------------
echo Delete build folder
rmdir /s /q build
echo -------------------------

ren binding.gyp data