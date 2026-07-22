#!/usr/bin/env bash
# =============================================================================
#  01-bootstrap.sh — Homelab Showcase: OS Bootstrap
#
#  Run this ONCE on a fresh Ubuntu Server install.
#  What it does:
#    1. Updates the OS
#    2. Installs Docker Engine + Docker Compose plugin
#    3. Installs Tailscale (requires TAILSCALE_AUTH_KEY in .env)
#    4. Installs mergerfs for the storage pool
#    5. Creates the required directory skeleton
#    6. Adds your user to the docker group
#
#  Usage:
#    sudo chmod +x scripts/01-bootstrap.sh
#    sudo ./scripts/01-bootstrap.sh
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Root check ────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Run as root: sudo ./scripts/01-bootstrap.sh"

# ── Load .env ─────────────────────────────────────────────────────────────────
ENV_FILE="$(dirname "$(realpath "$0")")/../.env"
if [[ -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a; source "$ENV_FILE"; set +a
    info "Loaded secrets from .env"
else
    warn ".env not found — Tailscale auth key will be skipped"
fi

REAL_USER="${SUDO_USER:-$USER}"
info "Bootstrapping for user: $REAL_USER"

# ── 1. System update ──────────────────────────────────────────────────────────
info "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl wget git jq parted mergerfs \
    ca-certificates gnupg lsb-release

# ── 2. Docker Engine ──────────────────────────────────────────────────────────
if command -v docker &>/dev/null; then
    info "Docker already installed: $(docker --version)"
else
    info "Installing Docker Engine..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        > /etc/apt/sources.list.d/docker.list

    apt-get update -qq
    apt-get install -y docker-ce docker-ce-cli containerd.io \
        docker-buildx-plugin docker-compose-plugin
    info "Docker installed: $(docker --version)"
fi

# ── 3. Add user to docker group ───────────────────────────────────────────────
if ! groups "$REAL_USER" | grep -q docker; then
    usermod -aG docker "$REAL_USER"
    info "Added $REAL_USER to docker group (re-login to activate)"
else
    info "$REAL_USER already in docker group"
fi

# ── 4. Tailscale ─────────────────────────────────────────────────────────────
if command -v tailscale &>/dev/null; then
    info "Tailscale already installed: $(tailscale version | head -1)"
else
    info "Installing Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
fi

if [[ -n "${TAILSCALE_AUTH_KEY:-}" ]]; then
    info "Bringing Tailscale up with auth key..."
    tailscale up --authkey="$TAILSCALE_AUTH_KEY" --accept-routes || warn "Tailscale up failed — check your auth key"
else
    warn "TAILSCALE_AUTH_KEY not set — run 'tailscale up' manually after setting .env"
fi

# ── 5. UFW Firewall ───────────────────────────────────────────────────────────
info "Configuring UFW firewall..."
apt-get install -y -qq ufw
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp     # NPM HTTP
ufw allow 443/tcp    # NPM HTTPS
ufw allow 81/tcp     # NPM admin (restrict to LAN in production)
ufw --force enable
info "UFW active. Status:"
ufw status verbose

# ── 6. Directory skeleton ─────────────────────────────────────────────────────
info "Creating homelab directory structure..."
HOMELAB_ROOT="/opt/homelab"
mkdir -p \
    "$HOMELAB_ROOT/media-stack/config" \
    "$HOMELAB_ROOT/nextcloud-stack/config" \
    "$HOMELAB_ROOT/proxy-stack/config" \
    "$HOMELAB_ROOT/proxy-stack/data/npm" \
    "$HOMELAB_ROOT/proxy-stack/letsencrypt" \
    /mnt/disk1 /mnt/disk2 /mnt/disk3 /mnt/disk4 \
    /data/media/movies /data/media/tv /data/media/music \
    /data/torrents/radarr /data/torrents/sonarr /data/torrents/incomplete

PUID="${PUID:-1000}"; PGID="${PGID:-1000}"
chown -R "${PUID}:${PGID}" "$HOMELAB_ROOT" /data 2>/dev/null || true
info "Directories created"

# ── 7. Enable Docker on boot ──────────────────────────────────────────────────
systemctl enable docker
info "Docker set to start on boot"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  Bootstrap complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo "  Next steps:"
echo "  1. Ensure .env is filled out:  nano .env"
echo "  2. Run storage setup if needed: sudo bash setup.bash"
echo "  3. Restore state data:          sudo bash scripts/02-restore.sh"
echo ""
[[ "$(groups "$REAL_USER")" == *docker* ]] || \
    warn "Log out and back in (or run 'newgrp docker') to use Docker without sudo"
