#!/usr/bin/env bash
# =============================================================================
#  scripts/05-ignition.sh — Homelab Showcase: Stack Ignition
#
#  Run this after:
#    ✅ 01-bootstrap.sh  (OS + Docker installed)
#    ✅ setup.bash        (storage disks mounted)
#    ✅ 02-restore.sh     (state data restored, optional on first boot)
#    ✅ .env filled out
#
#  What it does:
#    1. Creates the shared proxy-net Docker network
#    2. Copies .env into each stack subfolder (compose files need it local)
#    3. Starts proxy-stack (NPM + DuckDNS)
#    4. Waits for NPM to init, then starts media-stack + nextcloud-stack
#    5. Prints final status table
#
#  Usage:
#    bash scripts/05-ignition.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}    $*"; }
section() { echo -e "\n${CYAN}══ $* ══${NC}"; }

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
HOMELAB_DIR="$(realpath "$SCRIPT_DIR/..")"

# ── Load .env ─────────────────────────────────────────────────────────────────
ENV_FILE="$HOMELAB_DIR/.env"
[[ -f "$ENV_FILE" ]] || {
    echo -e "${RED}[ERROR]${NC} .env not found at $ENV_FILE"
    echo "  Run: cp $HOMELAB_DIR/.env.example $HOMELAB_DIR/.env"
    echo "  Then fill in all values before running ignition."
    exit 1
}
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a
info "Loaded .env"

# ── Step 1: Docker network ────────────────────────────────────────────────────
section "Creating shared Docker network"
docker network create proxy-net 2>/dev/null && info "Created proxy-net" || info "proxy-net already exists"

# ── Step 2: Copy .env into each stack directory ───────────────────────────────
section "Distributing .env to stack directories"
for stack in proxy-stack media-stack nextcloud-stack; do
    cp "$ENV_FILE" "$HOMELAB_DIR/$stack/.env"
    info "Copied .env → $stack/.env"
done

# ── Step 3: Start proxy-stack first ──────────────────────────────────────────
section "Starting proxy-stack (NPM + DuckDNS)"
mkdir -p "$HOMELAB_DIR/proxy-stack"/{config/duckdns,data/npm,letsencrypt}
(cd "$HOMELAB_DIR/proxy-stack" && docker compose up -d)
info "proxy-stack started"

# ── Step 4: Wait for NPM ──────────────────────────────────────────────────────
section "Waiting for Nginx Proxy Manager to initialize"
SERVER_IP="${SERVER_IP:?SERVER_IP not set in .env}"
WAIT=0
MAX_WAIT=90
until curl -s "http://localhost:81/api/" >/dev/null 2>&1; do
    echo "  NPM not ready yet... (${WAIT}s)"
    sleep 5
    WAIT=$((WAIT + 5))
    if [[ $WAIT -ge $MAX_WAIT ]]; then
        warn "NPM did not respond after ${MAX_WAIT}s — continuing anyway"
        break
    fi
done
info "NPM ready (or timed out, check: http://$SERVER_IP:81)"

# ── Step 5: Start media-stack ─────────────────────────────────────────────────
section "Starting media-stack (all media + automation services)"
mkdir -p "$HOMELAB_DIR/media-stack/config"
(cd "$HOMELAB_DIR/media-stack" && docker compose up -d)
info "media-stack started"

# ── Step 6: Start nextcloud-stack ─────────────────────────────────────────────
section "Starting nextcloud-stack (Nextcloud + MariaDB)"
mkdir -p "$HOMELAB_DIR/nextcloud-stack/config"
(cd "$HOMELAB_DIR/nextcloud-stack" && docker compose up -d)
info "nextcloud-stack started"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  Ignition complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo "  Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}" 2>/dev/null || true
echo ""
echo "  Next steps:"
echo "  1. Wait ~2 min for all containers to fully initialize"
echo "  2. Wire the *arr stack:     bash configure-stack.sh"
echo "  3. Sync Recyclarr:          docker exec -it recyclarr recyclarr sync"
echo "  4. Set up SSL + domain:     bash proxy-setup.sh"
echo "  5. Add indexers manually in Prowlarr → http://$SERVER_IP:9696"
echo ""
echo "  Dashboard:    http://$SERVER_IP:3002  (Homepage)"
echo "  Portainer:    http://$SERVER_IP:9000"
echo "  Uptime Kuma:  http://$SERVER_IP:3001"
echo ""
