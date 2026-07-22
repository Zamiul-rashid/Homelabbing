#!/usr/bin/env bash
#
# setup.bash — Storage disk mount + mergerfs pool
#
# Mounts sda/sdb/sdc/sdd and pools them into /data for the media-server
# docker-compose stack (jellyfin, arr apps, qbittorrent, nextcloud all
# expect a unified /data tree).
#
# SAFE BY DESIGN:
#   - A disk that already has a filesystem is only MOUNTED, never reformatted.
#   - Only a disk with no filesystem at all gets partitioned + formatted.
#   - Prints its full plan and requires a typed confirmation before any
#     disk is touched. Installing packages happens before that prompt
#     since it isn't destructive; nothing disk-related runs before you type YES.
#
# Usage: sudo bash setup.bash   (run from the homelab directory)

set -euo pipefail

DISKS=(sda sdb sdc sdd)      # adjust if your disk identifiers differ
MOUNT_BASE="/mnt"
POOL_DIR="/data"
FSTYPE="ext4"

# Reuse PUID/PGID from .env if present
ENV_FILE="$(dirname "$(realpath "$0")")/.env"
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a; source "$ENV_FILE"; set +a
fi
PUID="${PUID:-1000}"
PGID="${PGID:-1000}"

echo "== Checking dependencies ========================================"
NEED_UPDATE=0
command -v parted   >/dev/null 2>&1 || { echo "  will install: parted";   NEED_UPDATE=1; }
command -v mergerfs >/dev/null 2>&1 || { echo "  will install: mergerfs"; NEED_UPDATE=1; }
if [ "$NEED_UPDATE" -eq 1 ]; then
  sudo apt-get update -qq
  command -v parted   >/dev/null 2>&1 || sudo apt-get install -y parted
  command -v mergerfs >/dev/null 2>&1 || sudo apt-get install -y mergerfs
fi

echo ""
echo "== Scanning disks ==============================================="
declare -A ACTION
for d in "${DISKS[@]}"; do
  dev="/dev/${d}"
  part="${dev}1"
  if [ -b "$part" ] && sudo blkid "$part" >/dev/null 2>&1; then
    ACTION[$d]="mount-existing"
    fstype=$(sudo blkid -o value -s TYPE "$part")
    echo "  $dev : $part already has filesystem '$fstype' -> mount only, no format"
  elif sudo blkid "$dev" >/dev/null 2>&1; then
    ACTION[$d]="mount-raw"
    fstype=$(sudo blkid -o value -s TYPE "$dev")
    echo "  $dev : filesystem '$fstype' directly on the disk -> mount only, no format"
  else
    ACTION[$d]="format"
    echo "  $dev : no filesystem found -> PARTITION + FORMAT as $FSTYPE (destructive)"
  fi
done

echo ""
echo "This pools all 4 disks into a single ${POOL_DIR} via mergerfs, matching"
echo "the paths your compose file already expects (/data/media, /data/torrents,"
echo "/data/nextcloud). Disks marked 'mount only' above keep whatever is on them."
echo ""
read -rp "Type YES to continue: " CONFIRM
[ "$CONFIRM" = "YES" ] || { echo "Aborted, nothing changed."; exit 1; }

BRANCHES=()
FSTAB_LINES=()
i=1
for d in "${DISKS[@]}"; do
  dev="/dev/${d}"
  mnt="${MOUNT_BASE}/disk${i}"
  sudo mkdir -p "$mnt"

  case "${ACTION[$d]}" in
    format)
      sudo parted -s "$dev" mklabel gpt mkpart primary "$FSTYPE" 0% 100%
      sudo partprobe "$dev"
      sleep 2
      sudo mkfs."$FSTYPE" -F "${dev}1"
      target="${dev}1"
      ;;
    mount-existing) target="${dev}1" ;;
    mount-raw)      target="$dev" ;;
  esac

  uuid=$(sudo blkid -o value -s UUID "$target")
  sudo mount "$target" "$mnt"
  BRANCHES+=("$mnt")
  FSTAB_LINES+=("UUID=$uuid  $mnt  auto  defaults,nofail  0  2")
  echo "  mounted $target -> $mnt"
  i=$((i+1))
done

# ---- pool the 4 mounts into /data with mergerfs --------------------
if ! grep -q "^user_allow_other" /etc/fuse.conf 2>/dev/null; then
  echo "user_allow_other" | sudo tee -a /etc/fuse.conf >/dev/null
fi

sudo mkdir -p "$POOL_DIR"
BRANCH_STR=$(IFS=:; echo "${BRANCHES[*]}")
MERGERFS_OPTS="defaults,allow_other,use_ino,cache.files=partial,dropcacheonclose=true,category.create=mfs"
sudo mergerfs "$BRANCH_STR" "$POOL_DIR" -o "$MERGERFS_OPTS"
FSTAB_LINES+=("${BRANCH_STR} ${POOL_DIR} fuse.mergerfs ${MERGERFS_OPTS},nofail 0 0")

# recreate the subfolders your compose file expects
sudo mkdir -p "${POOL_DIR}"/{media/movies,media/tv,media/music,torrents/radarr,torrents/sonarr,torrents/incomplete}
sudo chown -R "${PUID}:${PGID}" "$POOL_DIR"

# ---- persist across reboots -----------------------------------------
sudo cp /etc/fstab "/etc/fstab.bak.$(date +%s)"
{
  echo ""
  echo "# --- added by homelab setup.bash $(date) ---"
  printf '%s\n' "${FSTAB_LINES[@]}"
} | sudo tee -a /etc/fstab >/dev/null

echo ""
echo "Verifying fstab..."
sudo mount -a && echo "fstab OK" || echo "WARNING: review /etc/fstab, something didn't match"

echo ""
echo "== Done =========================================================="
echo "Individual disks : ${BRANCHES[*]}"
echo "Pooled at        : $POOL_DIR"
df -h "$POOL_DIR" "${BRANCHES[@]}"
