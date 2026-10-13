@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 24 o posterior desde https://nodejs.org
  pause
  exit /b 1
)
node node_modules/vite/bin/vite.js build
if errorlevel 1 (
  echo No se pudo compilar. Consulta README.md para instalar las dependencias.
  pause
  exit /b 1
)
echo Abre http://127.0.0.1:3001 en tu navegador.
node --env-file-if-exists=.env server/index.mjs
pause
