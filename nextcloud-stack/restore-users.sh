#!/usr/bin/env bash
# =============================================================================
#  nextcloud-stack/restore-users.sh — Nextcloud User Restore Helper
#
#  Creates pre-configured user accounts and promotes admin users using occ.
#  All user lists and default passwords come from environment variables.
#
#  Usage:
#    bash nextcloud-stack/restore-users.sh
# =============================================================================

set -euo pipefail

DEFAULT_PASS="${NC_DEFAULT_PASS:-ChangeMe123!}"
OCC="docker exec -u abc nextcloud php /app/www/public/occ"
DATA_DIR="/mnt/disk2/nextcloud_data"
# Define users via environment space-separated list or use generic defaults
USERS_STR="${NC_USERS:-alice bob charlie}"
read -ra USERS <<< "$USERS_STR"
ADMIN_USER="${NC_ADMIN_USER:-admin}"

for USER in "${USERS[@]}"; do
    echo "→ Creating $USER..."

    # Step 1: hide existing data folder
    [ -d "$DATA_DIR/$USER" ] && sudo mv "$DATA_DIR/$USER" "$DATA_DIR/${USER}_bak"

    # Step 2: create user (now no folder conflict)
    docker exec -u abc -e OC_PASS="$DEFAULT_PASS" nextcloud \
        php /app/www/public/occ user:add --password-from-env "$USER"

    # Step 3: remove empty folder NC just made, restore real data
    sudo rm -rf "$DATA_DIR/$USER"
    [ -d "$DATA_DIR/${USER}_bak" ] && sudo mv "$DATA_DIR/${USER}_bak" "$DATA_DIR/$USER"

    echo "  ✓ $USER done"
done

echo "Promoting $ADMIN_USER to admin..."
$OCC group:adduser admin "$ADMIN_USER"

echo "Scanning all files..."
$OCC files:scan --all

echo ""
echo "Done! Initial password for users: $DEFAULT_PASS"
