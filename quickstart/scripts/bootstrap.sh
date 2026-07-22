#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Homelab Quickstart Bootstrap Script (Ubuntu / Debian)
# Installs official Docker Engine, docker-compose-plugin, and sets up directories.
# ==============================================================================

if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run bootstrap.sh with sudo: sudo bash scripts/bootstrap.sh"
  exit 1
fi

# 1. Detect Ubuntu/Debian
if [ -f /etc/os-release ]; then
  . /etc/os-release
  if [[ "$ID" != "ubuntu" && "$ID" != "debian" && "$ID_LIKE" != *"ubuntu"* && "$ID_LIKE" != *"debian"* ]]; then
    echo "Error: This script only supports Ubuntu or Debian derivatives. Detected OS: $ID"
    exit 1
  fi
else
  echo "Error: Cannot detect OS release (/etc/os-release not found)."
  exit 1
fi

echo "--> Installing prerequisites..."
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg

# 2. Install official Docker apt repo
echo "--> Setting up Docker repository..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$ID $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -qq

# 3. Install Docker Engine and Compose V2 plugin
echo "--> Installing Docker Engine and Compose V2 plugin..."
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Add $SUDO_USER to the docker group
if [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ]; then
  echo "--> Adding user '$SUDO_USER' to docker group..."
  usermod -aG docker "$SUDO_USER"
  TARGET_USER="$SUDO_USER"
else
  TARGET_USER="$(id -un)"
fi

# 5. Create storage directories with correct ownership
echo "--> Creating host storage directories under /srv..."
mkdir -p /srv/media /srv/downloads /srv/music /srv/photos /srv/nextcloud
if [ -n "${TARGET_USER:-}" ]; then
  chown -R "$TARGET_USER:$TARGET_USER" /srv/media /srv/downloads /srv/music /srv/photos /srv/nextcloud
fi

# 6. Print completion message
echo ""
echo "=========================================================================="
echo "Done! Log out and log back in, then run: bash scripts/launch.sh"
echo "=========================================================================="
