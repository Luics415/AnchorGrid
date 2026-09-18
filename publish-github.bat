@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==========================================
echo   AnchorGrid v0.5.0 - Publicar en GitHub
echo ==========================================
echo.
where git >nul 2>nul || (
  echo Git no esta disponible en PATH.
  pause
  exit /b 1
)

if not exist .git (
  git init || goto :error
)

git branch -M main || goto :error

git remote get-url origin >nul 2>nul
if errorlevel 1 (
  git remote add origin https://github.com/Luics415/AnchorGrid.git || goto :error
) else (
  git remote set-url origin https://github.com/Luics415/AnchorGrid.git || goto :error
)

git add . || goto :error
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "feat: AnchorGrid v0.5.0" || goto :error
) else (
  echo No hay cambios nuevos para commit.
)

git push -u origin main || goto :error

echo.
echo Listo. GitHub Actions iniciara el despliegue de Pages.
echo https://luics415.github.io/AnchorGrid/
pause
exit /b 0

:error
echo.
echo Ocurrio un error. Revisa el mensaje de Git mostrado arriba.
pause
exit /b 1
