$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PLAYWRIGHT_BROWSERS_PATH = "$env:LOCALAPPDATA\ms-playwright"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Get Jobs - Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Freeing ports..." -ForegroundColor Yellow
@(6866, 8888) | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Write-Host "  Freed port $_" -ForegroundColor Green
    }
}
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "[2/4] Starting frontend (port 6866)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/c cd /d `"$root\front`" && pnpm dev" -WindowStyle Minimized

Write-Host "  Waiting for frontend..." -ForegroundColor Gray
do {
    Start-Sleep -Seconds 2
    $ready = Test-NetConnection -ComputerName 127.0.0.1 -Port 6866 -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
} until ($ready)
Write-Host "  Frontend ready." -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] Starting backend (port 8888)..." -ForegroundColor Yellow
Start-Process cmd.exe -ArgumentList "/c cd /d `"$root`" && gradlew.bat bootRun" -WindowStyle Minimized

Write-Host "  Waiting for backend (first run may take ~30s)..." -ForegroundColor Gray
do {
    Start-Sleep -Seconds 3
    $ready = Test-NetConnection -ComputerName 127.0.0.1 -Port 8888 -InformationLevel Quiet -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
} until ($ready)
Write-Host "  Backend ready." -ForegroundColor Green

Write-Host ""
Write-Host "[4/4] Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:6866"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "  UI:  http://localhost:6866" -ForegroundColor White
Write-Host "  API: http://localhost:8888" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Close this window anytime. Services keep running." -ForegroundColor Gray
