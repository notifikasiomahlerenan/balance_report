#!/usr/bin/env bash
# Start Expo so the phone uses Windows Wi-Fi IP (LAN).
# Requires WSL2 mirrored networking + one-time firewall setup — see scripts/EXPO_LAN_SETUP.md
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PS="/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"
PS1_WIN="$(wslpath -w "$ROOT/scripts/Get-WindowsWifiIP.ps1")"

if [ ! -x "$PS" ]; then
  echo "PowerShell not found at $PS"
  exit 1
fi

WIN_IP="$("$PS" -ExecutionPolicy Bypass -NoProfile -File "$PS1_WIN" 2>/dev/null | tail -n1 | tr -d '\r\n[:space:]')"

if [ -z "$WIN_IP" ]; then
  echo "Could not read Windows Wi-Fi IPv4. Open scripts/EXPO_LAN_SETUP.md (fallback section)."
  exit 1
fi

export REACT_NATIVE_PACKAGER_HOSTNAME="$WIN_IP"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Expo LAN (WSL — mirrored networking)"
echo "  REACT_NATIVE_PACKAGER_HOSTNAME=$WIN_IP"
echo "  Fallback if load fails:  npx expo start --tunnel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$ROOT"
exec npx expo start "$@"
