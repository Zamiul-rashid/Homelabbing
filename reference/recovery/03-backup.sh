#!/usr/bin/env bash
# =============================================================================
#  03-backup.sh — Homelab Showcase: Daily Encrypted Backup
#
#  Run this via cron or systemd timer. Backs up stateful NPM/NC/HA config
#  into a single encrypted archive and pushes to your chosen destination.
#
#  Cron example (daily at 3 AM):
#    0 3 * * * /home/YOUR_USERNAME/homelab/scripts/03-backup.sh >> /var/log/homelab-backup.log 2>&1
#
#  Requires in .env:
#    BACKUP_ENCRYPTION_PASSWORD   — passphrase for AES-256 encryption
#    BACKUP_ARCHIVE_URL           — destination (local path, S3 URL, etc.)
#    PUID / PGID
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "$(date '+%F %T') ${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "$(date '+%F %T') ${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "$(date '+%F %T') ${RED}[ERROR]${NC} $*"; exit 1; }

SCRIPT_DIR="$(dirname "$(realpath "$0")")"
HOMELAB_DIR="$(realpath "$SCRIPT_DIR/..")"
ENV_FILE="$HOMELAB_DIR/.env"
[[ -f "$ENV_FILE" ]] || error ".env not found at $ENV_FILE"
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
BACKUP_TMP="/tmp/homelab-backup-$TIMESTAMP"
ARCHIVE_NAME="homelab-backup-$TIMESTAMP.tar.gz"
ENCRYPTED_NAME="${ARCHIVE_NAME}.enc"

mkdir -p "$BACKUP_TMP/npm" "$BACKUP_TMP/letsencrypt" \
         "$BACKUP_TMP/nextcloud-config" "$BACKUP_TMP/homeassistant"

info "Starting backup run ($TIMESTAMP)"

# ── Pause NPM briefly for consistent copy ────────────────────────────────────
info "Pausing nginx-proxy-manager for consistent snapshot..."
docker pause nginx-proxy-manager 2>/dev/null || warn "Could not pause NPM (may not be running)"

# ── Copy NPM state ────────────────────────────────────────────────────────────
cp -a "$HOMELAB_DIR/proxy-stack/data/npm/." "$BACKUP_TMP/npm/" 2>/dev/null || warn "NPM data not found"
cp -a "$HOMELAB_DIR/proxy-stack/letsencrypt/." "$BACKUP_TMP/letsencrypt/" 2>/dev/null || warn "LetsEncrypt dir not found"

docker unpause nginx-proxy-manager 2>/dev/null || true
info "NPM resumed"

# ── Copy app configs (no large data volumes) ──────────────────────────────────
cp -a "$HOMELAB_DIR/nextcloud-stack/config/." "$BACKUP_TMP/nextcloud-config/" 2>/dev/null || warn "Nextcloud config not found"
cp -a "$HOMELAB_DIR/media-stack/config/homeassistant/." "$BACKUP_TMP/homeassistant/" 2>/dev/null || warn "HA config not found"

# ── Archive ───────────────────────────────────────────────────────────────────
STAGING_DIR="/tmp/homelab-staging-$TIMESTAMP"
mkdir -p "$STAGING_DIR"
tar -czf "$STAGING_DIR/$ARCHIVE_NAME" -C "$BACKUP_TMP" .
info "Archive created: $STAGING_DIR/$ARCHIVE_NAME ($(du -sh "$STAGING_DIR/$ARCHIVE_NAME" | cut -f1))"

# ── Encrypt (AES-256-CBC, PBKDF2) ─────────────────────────────────────────────
[[ -n "${BACKUP_ENCRYPTION_PASSWORD:-}" ]] || error "BACKUP_ENCRYPTION_PASSWORD not set in .env"
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 \
    -in  "$STAGING_DIR/$ARCHIVE_NAME" \
    -out "$STAGING_DIR/$ENCRYPTED_NAME" \
    -pass "pass:$BACKUP_ENCRYPTION_PASSWORD"
info "Encrypted: $STAGING_DIR/$ENCRYPTED_NAME"

# ── Upload / copy to destination ──────────────────────────────────────────────
DEST="${BACKUP_ARCHIVE_URL:-}"
if [[ -z "$DEST" ]]; then
    warn "BACKUP_ARCHIVE_URL not set — backup saved locally at $STAGING_DIR/$ENCRYPTED_NAME"
elif [[ "$DEST" =~ ^s3:// ]]; then
    aws s3 cp "$STAGING_DIR/$ENCRYPTED_NAME" "$DEST/$ENCRYPTED_NAME"
    info "Uploaded to S3: $DEST/$ENCRYPTED_NAME"
elif [[ "$DEST" =~ ^https?:// ]]; then
    # WebDAV (Nextcloud)
    curl -fsSL -T "$STAGING_DIR/$ENCRYPTED_NAME" \
        -u "${NC_BACKUP_USER}:${NC_BACKUP_PASSWORD}" \
        "$DEST/$ENCRYPTED_NAME"
    info "Uploaded via WebDAV"
else
    # Local path
    mkdir -p "$DEST"
    cp "$STAGING_DIR/$ENCRYPTED_NAME" "$DEST/"
    # Keep only last 7 backups
    ls -t "$DEST"/homelab-backup-*.tar.gz.enc 2>/dev/null | tail -n +8 | xargs rm -f
    info "Saved to: $DEST/$ENCRYPTED_NAME (old backups pruned)"
fi

# ── Cleanup ───────────────────────────────────────────────────────────────────
rm -rf "$BACKUP_TMP" "$STAGING_DIR"
info "Backup run complete ✅"
