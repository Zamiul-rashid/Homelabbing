#!/usr/bin/env bash
# =============================================================================
#  02-restore.sh — Homelab Showcase: State Restore
#
#  Run this AFTER 01-bootstrap.sh and AFTER filling in .env.
#  What it does:
#    1. Prompts for backup decryption password (or reads from .env)
#    2. Downloads the latest encrypted backup archive
#    3. Decrypts + extracts NPM config, LetsEncrypt certs, Nextcloud config,
#       and Home Assistant config into the correct locations
#    4. Fixes file ownership
#
#  Requirements:
#    - openssl (for decryption)
#    - .env must have BACKUP_ARCHIVE_URL and BACKUP_ENCRYPTION_PASSWORD
#
#  Usage:
#    sudo chmod +x scripts/02-restore.sh
#    sudo ./scripts/02-restore.sh
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${GREEN}[INFO]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}    $*"; }
error()   { echo -e "${RED}[ERROR]${NC}   $*"; exit 1; }
section() { echo -e "\n${CYAN}══ $* ══${NC}"; }

# ── Root check ────────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Run as root: sudo ./scripts/02-restore.sh"

# ── Load .env ─────────────────────────────────────────────────────────────────
ENV_FILE="$(dirname "$(realpath "$0")")/../.env"
[[ -f "$ENV_FILE" ]] || error ".env file not found at $ENV_FILE — run cp .env.example .env first"
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a
info "Loaded .env"

PUID="${PUID:-1000}"; PGID="${PGID:-1000}"
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
HOMELAB_DIR="$(realpath "$SCRIPT_DIR/..")"
RESTORE_TMP="/tmp/homelab-restore-$$"
mkdir -p "$RESTORE_TMP"
trap 'rm -rf "$RESTORE_TMP"' EXIT

# ── Resolve backup source ─────────────────────────────────────────────────────
section "Backup Source"
ARCHIVE_URL="${BACKUP_ARCHIVE_URL:-}"
if [[ -z "$ARCHIVE_URL" ]]; then
    read -rp "  Enter path or URL to backup archive (.tar.gz.enc): " ARCHIVE_URL
fi
info "Archive: $ARCHIVE_URL"

# ── Decryption password ───────────────────────────────────────────────────────
section "Decryption"
DECRYPT_PASS="${BACKUP_ENCRYPTION_PASSWORD:-}"
if [[ -z "$DECRYPT_PASS" ]]; then
    read -rsp "  Decryption password (from password vault): " DECRYPT_PASS
    echo ""
fi

# ── Download (if remote) ──────────────────────────────────────────────────────
ENCRYPTED_FILE="$RESTORE_TMP/backup.tar.gz.enc"
if [[ "$ARCHIVE_URL" =~ ^https?:// || "$ARCHIVE_URL" =~ ^s3:// ]]; then
    info "Downloading backup archive..."
    if command -v aws &>/dev/null && [[ "$ARCHIVE_URL" =~ ^s3:// ]]; then
        aws s3 cp "$ARCHIVE_URL" "$ENCRYPTED_FILE"
    else
        curl -fL --progress-bar "$ARCHIVE_URL" -o "$ENCRYPTED_FILE"
    fi
elif [[ "$ARCHIVE_URL" =~ ^nextcloud:// ]]; then
    # nextcloud://user:pass@host/remote.php/dav/files/user/path/to/file
    NC_URL="${ARCHIVE_URL#nextcloud://}"
    info "Downloading from Nextcloud WebDAV..."
    curl -fL --progress-bar "https://$NC_URL" -o "$ENCRYPTED_FILE"
elif [[ -f "$ARCHIVE_URL" ]]; then
    cp "$ARCHIVE_URL" "$ENCRYPTED_FILE"
else
    error "Cannot locate backup archive: $ARCHIVE_URL"
fi

# ── Decrypt ───────────────────────────────────────────────────────────────────
section "Decrypting Archive"
DECRYPTED_FILE="$RESTORE_TMP/backup.tar.gz"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 \
    -in  "$ENCRYPTED_FILE" \
    -out "$DECRYPTED_FILE" \
    -pass "pass:$DECRYPT_PASS" \
    || error "Decryption failed — wrong password or corrupted archive"
info "Decryption successful"

# ── Extract ───────────────────────────────────────────────────────────────────
section "Extracting Archive"
EXTRACT_DIR="$RESTORE_TMP/extracted"
mkdir -p "$EXTRACT_DIR"
tar -xzf "$DECRYPTED_FILE" -C "$EXTRACT_DIR" --strip-components=1
info "Extraction complete. Contents:"
ls -lah "$EXTRACT_DIR/"

# ── Restore: Nginx Proxy Manager ──────────────────────────────────────────────
section "Restoring Nginx Proxy Manager"
NPM_DATA_DEST="$HOMELAB_DIR/proxy-stack/data/npm"
LE_DEST="$HOMELAB_DIR/proxy-stack/letsencrypt"
mkdir -p "$NPM_DATA_DEST" "$LE_DEST"

if [[ -d "$EXTRACT_DIR/npm" ]]; then
    cp -a "$EXTRACT_DIR/npm/." "$NPM_DATA_DEST/"
    info "NPM data restored → $NPM_DATA_DEST"
else
    warn "No npm/ directory in backup — NPM will start fresh"
fi

if [[ -d "$EXTRACT_DIR/letsencrypt" ]]; then
    cp -a "$EXTRACT_DIR/letsencrypt/." "$LE_DEST/"
    info "LetsEncrypt certs restored → $LE_DEST"
else
    warn "No letsencrypt/ directory in backup"
fi

# ── Restore: Nextcloud config ─────────────────────────────────────────────────
section "Restoring Nextcloud Config"
NC_CONFIG_DEST="$HOMELAB_DIR/nextcloud-stack/config"
mkdir -p "$NC_CONFIG_DEST"
if [[ -d "$EXTRACT_DIR/nextcloud-config" ]]; then
    cp -a "$EXTRACT_DIR/nextcloud-config/." "$NC_CONFIG_DEST/"
    info "Nextcloud config restored → $NC_CONFIG_DEST"
else
    warn "No nextcloud-config/ in backup — Nextcloud will run setup wizard"
fi

# ── Restore: Home Assistant ────────────────────────────────────────────────────
section "Restoring Home Assistant Config"
HA_CONFIG_DEST="$HOMELAB_DIR/media-stack/config/homeassistant"
mkdir -p "$HA_CONFIG_DEST"
if [[ -d "$EXTRACT_DIR/homeassistant" ]]; then
    cp -a "$EXTRACT_DIR/homeassistant/." "$HA_CONFIG_DEST/"
    info "Home Assistant config restored → $HA_CONFIG_DEST"
else
    warn "No homeassistant/ in backup — HA will run onboarding"
fi

# ── Fix ownership ─────────────────────────────────────────────────────────────
section "Fixing Ownership"
chown -R "${PUID}:${PGID}" \
    "$HOMELAB_DIR/proxy-stack" \
    "$HOMELAB_DIR/nextcloud-stack" \
    "$HOMELAB_DIR/media-stack" 2>/dev/null || true
info "Ownership set to ${PUID}:${PGID}"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  State restore complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo "  Next steps:"
echo "  1. Ensure .env is fully populated"
echo "  2. docker network create proxy-net 2>/dev/null || true"
echo "  3. cd proxy-stack  && docker compose up -d"
echo "  4. cd media-stack  && docker compose up -d"
echo "  5. cd nextcloud-stack && docker compose up -d"
echo "  6. Run:  docker exec -it recyclarr recyclarr sync"
echo ""
