# Expo Go over LAN from WSL2

## The Problem

Metro bundler in WSL2 cannot be reached by Expo Go on a phone, even with
WSL2 mirrored networking active and Windows Firewall rules in place.

## Root Cause

Windows 11 (22H2+) ships a **Hyper-V firewall** that is separate from the
regular Windows Firewall. It silently drops inbound traffic to WSL2 VMs.
Standard `New-NetFirewallRule` commands do not cover it.

## Fix (one-time, Admin PowerShell)

```powershell
# Allow inbound to WSL2 on Expo/Metro ports
New-NetFirewallHyperVRule -Name "ExpoPorts" -Direction Inbound `
  -VMCreatorId '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' `
  -Protocol TCP -LocalPorts @(8081,19000,19001) -Action Allow
```

Or to allow all inbound to WSL2:

```powershell
Set-NetFirewallHyperVVMSetting -Name '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -DefaultInboundAction Allow
```

## Prerequisites (already configured)

| Item | Detail |
|------|--------|
| `.wslconfig` | `networkingMode=mirrored` under `[wsl2]` |
| Windows Firewall | Inbound allow on TCP 8081, 19000, 19001 |
| `npm run start:lan` | Sets `REACT_NATIVE_PACKAGER_HOSTNAME` to Windows WiFi IP via `expo-lan.sh` |

## Quick Diagnostic

From the phone browser, hit `http://<windows-wifi-ip>:8081` while Metro runs.
Timeout = firewall. Response = networking is fine, check Expo Go URL.
