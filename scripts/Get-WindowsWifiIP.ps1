# First connected Wi-Fi adapter IPv4 (excludes APIPA). For WSL + Expo LAN.
$cfg = Get-NetIPConfiguration | Where-Object {
  $_.NetAdapter.Status -eq 'Up' -and $_.InterfaceAlias -match 'Wi-Fi'
} | Select-Object -First 1
if ($cfg -and $cfg.IPv4Address) {
  $ip = $cfg.IPv4Address.IPAddress
  if ($ip -notmatch '^169\.254\.') { Write-Output $ip }
}
