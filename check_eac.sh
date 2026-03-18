#!/usr/bin/env bash
# Check for Easy Anti-Cheat (EAC) presence on a Linux system.
# Covers processes, services, common file paths, packages, kernel modules, and Steam directories.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

found=0

section() { printf "\n${YELLOW}[*] %s${NC}\n" "$1"; }
not_found() { printf "  ${GREEN}✓ Not found${NC}\n"; }
found_msg() { printf "  ${RED}✗ Found: %s${NC}\n" "$1"; found=1; }

section "Checking running processes"
if pgrep -fia "easyanticheat|eac_" 2>/dev/null; then
    found_msg "EAC process running"
else
    not_found
fi

section "Checking systemd services"
if systemctl list-units --all 2>/dev/null | grep -qi "easyanticheat\|eac"; then
    found_msg "EAC systemd unit detected"
else
    not_found
fi

section "Checking common installation directories"
eac_dirs=(
    /opt/EasyAntiCheat
    /usr/lib/easyanticheat
    /usr/lib64/easyanticheat
    /usr/share/EasyAntiCheat
    "$HOME/.local/share/EasyAntiCheat"
)
dir_found=0
for d in "${eac_dirs[@]}"; do
    if [ -e "$d" ]; then
        found_msg "$d"
        dir_found=1
    fi
done
[ "$dir_found" -eq 0 ] && not_found

section "Checking installed packages"
pkg_found=0
if command -v dpkg &>/dev/null && dpkg -l 2>/dev/null | grep -qi "easyanticheat"; then
    found_msg "dpkg package"; pkg_found=1
fi
if command -v rpm &>/dev/null && rpm -qa 2>/dev/null | grep -qi "easyanticheat"; then
    found_msg "rpm package"; pkg_found=1
fi
if command -v snap &>/dev/null && snap list 2>/dev/null | grep -qi "easyanticheat"; then
    found_msg "snap package"; pkg_found=1
fi
if command -v flatpak &>/dev/null && flatpak list 2>/dev/null | grep -qi "easyanticheat"; then
    found_msg "flatpak package"; pkg_found=1
fi
[ "$pkg_found" -eq 0 ] && not_found

section "Checking kernel modules"
if lsmod 2>/dev/null | grep -qi "eac\|anticheat"; then
    found_msg "EAC kernel module loaded"
else
    not_found
fi

section "Checking Steam directories"
steam_dirs=(
    "$HOME/.steam/steam/steamapps/common"
    "$HOME/.local/share/Steam/steamapps/common"
)
steam_found=0
for sd in "${steam_dirs[@]}"; do
    if [ -d "$sd" ]; then
        if find "$sd" -maxdepth 3 -iname "*EasyAntiCheat*" 2>/dev/null | grep -q .; then
            found_msg "EAC files in $sd"
            steam_found=1
        fi
    fi
done
[ "$steam_found" -eq 0 ] && not_found

section "Searching filesystem for EAC binaries (may take a moment)"
if find / -maxdepth 5 \( -iname "*EasyAntiCheat*" -o -iname "eac_server" -o -iname "eac_launcher" \) 2>/dev/null | head -1 | grep -q .; then
    find / -maxdepth 5 \( -iname "*EasyAntiCheat*" -o -iname "eac_server" -o -iname "eac_launcher" \) 2>/dev/null | while read -r f; do
        found_msg "$f"
    done
else
    not_found
fi

echo ""
if [ "$found" -eq 0 ]; then
    printf "${GREEN}=== Easy Anti-Cheat is NOT installed on this system ===${NC}\n"
else
    printf "${RED}=== Easy Anti-Cheat WAS detected on this system ===${NC}\n"
fi
