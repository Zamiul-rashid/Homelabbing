#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Homelab Quickstart Interactive Launcher
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QUICKSTART_DIR="$(dirname "$SCRIPT_DIR")"

# 1. Check Docker is installed
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Error: Docker and Docker Compose V2 plugin are required."
  echo "Please run 'sudo bash scripts/bootstrap.sh' first."
  exit 1
fi

# 2. Check .env exists in quickstart/
if [ ! -f "$QUICKSTART_DIR/.env" ]; then
  echo "--> No .env file found in quickstart/. Copying from .env.example..."
  cp "$QUICKSTART_DIR/.env.example" "$QUICKSTART_DIR/.env"
  echo "--> Opening .env for configuration..."
  if [ -t 0 ] && command -v nano >/dev/null 2>&1; then
    nano "$QUICKSTART_DIR/.env"
  else
    echo "Please edit $QUICKSTART_DIR/.env with your preferred editor, then run launch.sh again."
    exit 0
  fi
fi

# Source .env if readable
if [ -f "$QUICKSTART_DIR/.env" ]; then
  set +u
  # shellcheck disable=SC1091
  source "$QUICKSTART_DIR/.env"
  set -u
fi

# 3. Present numbered menu
echo ""
echo "=========================================================================="
echo "  Pick a starting point to launch:"
echo "=========================================================================="
echo "  1) Jellyfin (simplest start — just a media player)"
echo "  2) + Download automation (*arr stack)"
echo "  3) + Music server (Navidrome)"
echo "  4) + Photo backup (Immich)"
echo "  5) + Cloud storage (Nextcloud)"
echo "  6) Everything (full stack)"
echo "=========================================================================="

if [ -t 0 ]; then
  read -r -p "Enter choice [1-6]: " choice
else
  choice="${1:-1}"
fi

case "$choice" in
  1) TARGET_DIR="01-media-server" ;;
  2) TARGET_DIR="02-arr-stack" ;;
  3) TARGET_DIR="03-music-server" ;;
  4) TARGET_DIR="04-photo-server" ;;
  5) TARGET_DIR="05-cloud-storage" ;;
  6) TARGET_DIR="06-full-stack" ;;
  *) echo "Invalid option ($choice). Exiting." ; exit 1 ;;
esac

echo "--> Launching $TARGET_DIR stack..."
cd "$QUICKSTART_DIR/$TARGET_DIR"
docker compose --env-file "$QUICKSTART_DIR/.env" up -d

echo "--> Waiting 10s for containers to initialize..."
sleep 10

# 5. Call check-health.sh
bash "$SCRIPT_DIR/check-health.sh"

# 6. Print final guidance
SERVER_IP="${SERVER_IP:-$(hostname -I 2>/dev/null | awk '{print $1}' || echo '127.0.0.1')}"
echo ""
echo "=========================================================================="
echo "Your services are running! Access them at http://${SERVER_IP}:PORT"
echo "To check ongoing health, run: bash scripts/check-health.sh"
echo "=========================================================================="
