# Script PowerShell pour générer les icônes PNG depuis SVG
$ErrorActionPreference = "Stop"

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$publicPath = Join-Path $scriptPath "..\public"

Write-Host "Pour générer les icônes, ouvrez le fichier generate-icons.html dans votre navigateur" -ForegroundColor Cyan
Write-Host "Chemin: $scriptPath\..\generate-icons.html" -ForegroundColor Yellow
Write-Host "Ensuite, téléchargez les fichiers et copiez-les dans: $publicPath" -ForegroundColor Yellow
