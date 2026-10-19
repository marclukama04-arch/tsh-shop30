@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=3001
set /p ADMIN_PASSWORD=Choisissez votre mot de passe admin puis appuyez sur Entree : 
echo.
echo Site client : http://localhost:3001
echo Admin       : http://localhost:3001/admin
echo Ne fermez pas cette fenetre tant que vous utilisez le site.
echo.
node server.js
pause
