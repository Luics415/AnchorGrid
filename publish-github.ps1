$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host "AnchorGrid v0.5.0 - Publicar en GitHub" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw 'Git no esta disponible en PATH.'
}

if (-not (Test-Path '.git')) { git init }
git branch -M main

$origin = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
  git remote add origin 'https://github.com/Luics415/AnchorGrid.git'
} else {
  git remote set-url origin 'https://github.com/Luics415/AnchorGrid.git'
}

git add .
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m 'feat: AnchorGrid v0.5.0'
}

git push -u origin main
Write-Host 'GitHub Actions iniciará el despliegue de Pages.' -ForegroundColor Green
Write-Host 'https://luics415.github.io/AnchorGrid/'
