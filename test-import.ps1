# PowerShell script to copy and import
$files = Get-ChildItem 'C:\Users\Administrator\Downloads' -Filter '*.xlsx'
$qccFile = $files | Where-Object { $_.Name -like '*企查查*' -and $_.Name -like '*歌舞*' } | Select-Object -First 1

if ($qccFile) {
  Write-Host "复制文件: $($qccFile.FullName)"
  Copy-Item $qccFile.FullName -Destination 'd:\bby\server\imports\test.xlsx'
  Write-Host "复制完成，开始导入..."
  cd d:\bby\server
  node import.js
} else {
  Write-Host "未找到企查查文件"
}
