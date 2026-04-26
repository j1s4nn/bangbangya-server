@echo off
chcp 65001 >nul
echo.
echo ====================================
echo  帮帮鸭 - 注册每日定时导入任务
echo ====================================
echo.

set TASK_NAME=帮帮鸭每日数据导入
set NODE_PATH=node
set SCRIPT_PATH=d:\bby\server\import.js
set IMPORTS_DIR=d:\bby\server\imports

REM 创建 imports 目录（如果不存在）
if not exist "%IMPORTS_DIR%" mkdir "%IMPORTS_DIR%"

REM 注册定时任务：每天 02:00 执行导入
schtasks /create /tn "%TASK_NAME%" /tr "%NODE_PATH% %SCRIPT_PATH%" /sc daily /st 02:00 /f /ru SYSTEM

if %errorlevel% equ 0 (
  echo.
  echo ✅ 定时任务注册成功！
  echo.
  echo 任务名称: %TASK_NAME%
  echo 执行时间: 每天 02:00
  echo 导入目录: %IMPORTS_DIR%
  echo.
  echo 使用说明：
  echo   1. 每天将风鸟导出的xlsx放入: %IMPORTS_DIR%
  echo   2. 定时任务会在凌晨2点自动导入
  echo   3. 导入完成后xlsx自动归档到 imports\imported\
  echo.
  echo 手动执行（立即导入）：
  echo   node d:\bby\server\import.js
  echo   或双击: d:\bby\server\import-now.bat
) else (
  echo.
  echo ❌ 注册失败，可能需要管理员权限
  echo    请右键选择"以管理员身份运行"此脚本
)
echo.
pause
