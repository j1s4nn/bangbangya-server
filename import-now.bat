@echo off
chcp 65001 >nul
echo.
echo ====================================
echo  帮帮鸭 - 立即执行数据导入
echo ====================================
echo.
echo 请将风鸟导出的xlsx文件放入:
echo   d:\bby\server\imports\
echo.
echo 按任意键开始导入...
pause >nul
echo.
node d:\bby\server\import.js
echo.
echo 导入完成！按任意键查看日志...
pause >nul
type d:\bby\server\db\import-log.json
echo.
pause
