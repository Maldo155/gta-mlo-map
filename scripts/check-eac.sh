#!/usr/bin/env bash
# Checks whether Easy Anti-Cheat (EAC) is present on this Linux system.
# Exits 0 if EAC is found, 1 if not.

set -euo pipefail

found=0

echo "=== Easy Anti-Cheat Presence Check ==="
echo ""

# 1. Installed packages
if dpkg -l 2>/dev/null | grep -qi "easyanticheat"; then
  echo "[FOUND] EAC package installed (dpkg)"
  found=1
else
  echo "[  OK ] No EAC package detected via dpkg"
fi

# 2. /opt directory
if ls /opt/EasyAntiCheat* &>/dev/null || ls /opt/easyanticheat* &>/dev/null; then
  echo "[FOUND] EAC directory exists in /opt"
  found=1
else
  echo "[  OK ] No EAC directory in /opt"
fi

# 3. Running processes
if pgrep -fi "easyanticheat|easy_anti_cheat" &>/dev/null; then
  echo "[FOUND] EAC process currently running"
  found=1
else
  echo "[  OK ] No EAC process running"
fi

# 4. Systemd service
if systemctl list-units --all 2>/dev/null | grep -qi "easyanticheat\|eac"; then
  echo "[FOUND] EAC systemd service registered"
  found=1
else
  echo "[  OK ] No EAC systemd service"
fi

# 5. Kernel module
if lsmod 2>/dev/null | grep -qi "eac\|easyanticheat"; then
  echo "[FOUND] EAC kernel module loaded"
  found=1
else
  echo "[  OK ] No EAC kernel module loaded"
fi

# 6. Steam directories
steam_dirs=(
  "$HOME/.steam/steam/steamapps/common"
  "$HOME/.local/share/Steam/steamapps/common"
)
steam_found=false
for dir in "${steam_dirs[@]}"; do
  if ls "$dir"/*/EasyAntiCheat* &>/dev/null 2>&1; then
    echo "[FOUND] EAC bundled with a Steam game in $dir"
    steam_found=true
    found=1
  fi
done
if [ "$steam_found" = false ]; then
  echo "[  OK ] No EAC in Steam game directories"
fi

echo ""
if [ "$found" -eq 1 ]; then
  echo "Result: Easy Anti-Cheat IS present on this system."
  exit 0
else
  echo "Result: Easy Anti-Cheat is NOT present on this system."
  exit 1
fi
