@echo off
setlocal
node "%~dp0scripts\build.js" %*
exit /b %errorlevel%
