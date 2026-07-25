# Get Jobs 一键启动脚本
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Get Jobs 一键启动" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 释放端口
Write-Host "[1/4] 释放端口..." -ForegroundColor Yellow
@(6866, 8888) | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($conn) {
        $conn | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
        Write-Host "  已释放 $_ 端口" -ForegroundColor Green
    }
}

# 2. 环境变量
$env:PLAYWRIGHT_BROWSERS_PATH = "$env:LOCALAPPDATA\ms-playwright"

# 3. 启动前端（独立进程，窗口关闭后继续运行）
Write-Host ""
Write-Host "[2/4] 启动前端服务 (端口 6866)..." -ForegroundColor Yellow
$frontProcess = Start-Process -FilePath "pnpm" -ArgumentList "dev" -WorkingDirectory "$root\front" -WindowStyle Minimized -PassThru
Write-Host "  等待前端就绪..." -ForegroundColor Gray
do {
    Start-Sleep -Seconds 2
    try { $null = Invoke-WebRequest -Uri "http://127.0.0.1:6866" -TimeoutSec 2 -UseBasicParsing; $ready = $true } catch { $ready = $false }
} until ($ready)
Write-Host "  前端已就绪 ✓" -ForegroundColor Green

# 4. 启动后端（独立进程，窗口关闭后继续运行）
Write-Host ""
Write-Host "[3/4] 启动后端服务 (端口 8888)..." -ForegroundColor Yellow
$backProcess = Start-Process -FilePath "$root\gradlew.bat" -ArgumentList "bootRun" -WorkingDirectory $root -WindowStyle Minimized -PassThru
Write-Host "  等待后端就绪（首次约需 15-30 秒）..." -ForegroundColor Gray
do {
    Start-Sleep -Seconds 3
    try { $null = Invoke-WebRequest -Uri "http://127.0.0.1:8888" -TimeoutSec 3 -UseBasicParsing; $ready = $true } catch { $ready = $false }
} until ($ready)
Write-Host "  后端已就绪 ✓" -ForegroundColor Green

# 5. 打开界面
Write-Host ""
Write-Host "[4/4] 打开管理界面..." -ForegroundColor Yellow
Start-Process "http://localhost:6866"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  全部启动完成！" -ForegroundColor Green
Write-Host "  管理界面: http://localhost:6866" -ForegroundColor White
Write-Host "  后端 API:  http://localhost:8888" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键关闭此窗口（服务在后台继续运行）" -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
