$files = Get-ChildItem 'C:\Users\Administrator\Downloads' -Filter '*.xlsx'
$files | ForEach-Object {
  $name = $_.Name
  $qccMatch = $name -match '企查查'
  $geMatch = $name -match '歌舞'
  Write-Host "Name: $name"
  Write-Host "HasQCC: $qccMatch"
  Write-Host "HasGE: $geMatch"
  Write-Host ""
}
