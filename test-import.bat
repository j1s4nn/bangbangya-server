@echo off
chcp 65001 >nul
copy "C:\Users\Administrator\Downloads\【企查查】企业搜索"歌舞"20260320(0320_141357455).xlsx" "d:\bby\server\imports\test.xlsx"
cd d:\bby\server
node import.js
