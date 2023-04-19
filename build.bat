@echo off

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

echo -------------------------
echo Delete build folder
rmdir /s /q build
echo -------------------------

ren binding.gyp data