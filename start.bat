@echo off
chcp 65001 >nul
echo.
echo ====================================
echo   帮帮鸭 后端服务 v2.0
echo ====================================
echo.

cd /d "%~dp0"

if not exist node_modules (
  echo [1/2] 正在安装依赖包，请稍候...
  echo       Installing dependencies, please wait...
  npm install
  if errorlevel 1 (
    echo.
    echo ERROR: npm install failed.
    echo Make sure Node.js is installed: https://nodejs.org
    pause
    exit /b 1
  )
  echo [1/2] 依赖安装完成!
  echo.
) else (
  echo [1/2] 依赖已存在，跳过安装
)

echo [2/2] 启动服务...
echo.
echo ====================================
echo  服务地址:  http://localhost:3000
echo  管理后台:  http://localhost:3000/admin
echo ====================================
echo.
echo 按 Ctrl+C 停止服务
echo.
node index.js
pause
