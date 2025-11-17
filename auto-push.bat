@echo off
echo === AUTO PUSH ACTIVADO ===
echo Cancelar con CTRL + C

:loop
git add .
git commit -m "Auto-update"
git push
timeout /t 5 >nul
goto loop
