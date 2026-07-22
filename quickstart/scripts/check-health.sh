#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Homelab Quickstart Health Checker
# Checks container status and formats a color-coded table of all 9 service ports.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QUICKSTART_DIR="$(dirname "$SCRIPT_DIR")"

# Source .env if available for SERVER_IP override
if [ -f "$QUICKSTART_DIR/.env" ]; then
  set +u
  # shellcheck disable=SC1091
  source "$QUICKSTART_DIR/.env"
  set -u
fi

SERVER_IP="${SERVER_IP:-$(hostname -I 2>/dev/null | awk '{print $1}' || echo '127.0.0.1')}"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "=================================================================================="
printf "%-24s | %-20s | %s\n" "Container / Service" "Status" "URL"
echo "----------------------------------------------------------------------------------"

check_service() {
  local name="$1"
  local port="$2"
  local protocol="${3:-http}"

  local status="missing"
  local color="$RED"

  if docker ps --format '{{.Names}}' | grep -Eq "^${name}\$"; then
    local health
    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}running{{end}}' "$name" 2>/dev/null || echo "unknown")"
    if [ "$health" = "healthy" ] || [ "$health" = "running" ]; then
      status="healthy ($health)"
      color="$GREEN"
    elif [ "$health" = "starting" ]; then
      status="starting..."
      color="$YELLOW"
    else
      status="unhealthy ($health)"
      color="$RED"
    fi
  else
    status="not running"
    color="$RED"
  fi

  printf "%-24s | ${color}%-20s${NC} | %s://%s:%s\n" "$name" "$status" "$protocol" "$SERVER_IP" "$port"
}

# Check all 9 service ports specified in the prompt
check_service "jellyfin"         "8096" "http"
check_service "qbittorrent"      "8080" "http"
check_service "prowlarr"         "9696" "http"
check_service "radarr"           "7878" "http"
check_service "sonarr"           "8989" "http"
check_service "jellyseerr"       "5055" "http"
check_service "navidrome"        "4533" "http"
check_service "immich_server"    "2283" "http"
check_service "nextcloud"        "4443" "https"

echo "=================================================================================="
echo ""
