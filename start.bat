@echo off
chcp 65001 >nul
title Get Jobs - 启动中...

echo ========================================
echo   Get Jobs 一键启动
echo ========================================
echo.

:: 获取脚本所在目录
cd /d "%~dp0"

:: 释放端口
echo [1/4] 释放端口...
powershell -Command "$ports=@(6866,8888); foreach($p in $ports){$c=Get-NetTCPConnection -LocalPort $p -EA SilentlyContinue; if($c){$c|%%{Stop-Process -Id $_.OwningProcess -Force -EA SilentlyContinue}; Write-Host '  已释放端口' $p}}"
echo.

:: 环境变量
set "PLAYWRIGHT_BROWSERS_PATH=%LOCALAPPDATA%\ms-playwright"

:: 启动前端（独立窗口，后台运行）
echo [2/4] 启动前端服务 (端口 6866)...
start "GetJobs-Frontend" /MIN cmd /c "cd /d "%~dp0front" && set PLAYWRIGHT_BROWSERS_PATH=%LOCALAPPDATA%\ms-playwright && pnpm dev"
echo   等待前端就绪...

:: 轮询等待前端
:wait_front
timeout /t 3 /nobreak >nul
powershell -Command "try{$r=Invoke-WebRequest -Uri 'http://127.0.0.1:6866' -TimeoutSec 2 -UseBasicParsing; exit 0}catch{exit 1}" && goto front_ok
goto wait_front
:front_ok
echo   前端已就绪 ✓

:: 启动后端（独立窗口，后台运行）
echo.
echo [3/4] 启动后端服务 (端口 8888)...
start "GetJobs-Backend" /MIN cmd /c "cd /d "%~dp0" && set PLAYWRIGHT_BROWSERS_PATH=%LOCALAPPDATA%\ms-playwright && gradlew.bat bootRun"
echo   等待后端就绪（首次约需 30 秒）...

:: 轮询等待后端
:wait_back
timeout /t 5 /nobreak >nul
powershell -Command "try{$r=Invoke-WebRequest -Uri 'http://127.0.0.1:8888' -TimeoutSec 3 -UseBasicParsing; exit 0}catch{exit 1}" && goto back_ok
goto wait_back
:back_ok
echo   后端已就绪 ✓

:: 打开浏览器
echo.
echo [4/4] 打开管理界面...
start http://localhost:6866

echo.
echo ========================================
echo   全部启动完成！
echo   管理界面: http://localhost:6866
echo   后端 API:  http://localhost:8888
echo ========================================
echo.
echo 可以关闭此窗口，服务在后台继续运行。
pause
