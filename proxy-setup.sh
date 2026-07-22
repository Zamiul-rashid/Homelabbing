#!/usr/bin/env bash
# =============================================================================
#  proxy-setup.sh — Homelab Showcase: NPM + DuckDNS + SSL Setup
#
#  Run ONCE after first boot (or after a fresh restore that skipped NPM).
#  All secrets are read from .env — nothing is hardcoded here.
#
#  What it does:
#    1. Installs jq
#    2. Frees port 443 from Nextcloud (changes 443:443 → 4443:443 in compose)
#    3. Writes + starts the proxy-stack
#    4. Waits for NPM to be ready
#    5. Sets NPM admin credentials (email + password)
#    6. Requests Let's Encrypt certificate for your domain
#    7. Creates NPM proxy host (HTTPS → Nextcloud on port 4443)
#    8. Updates Nextcloud trusted_domains + overwriteprotocol via occ
#
#  If SSL fails (port not yet forwarded):
#    A finish.sh is saved to proxy-stack/finish.sh — run it after configuring
#    your router to forward ports 80 + 443 to this server.
#
#  Usage:
#    bash proxy-setup.sh
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Load .env ─────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
ENV_FILE="$SCRIPT_DIR/.env"
[[ -f "$ENV_FILE" ]] || error ".env not found at $ENV_FILE — run cp .env.example .env first"
# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

# ── Validate required variables ───────────────────────────────────────────────
: "${DUCKDNS_SUBDOMAIN:?DUCKDNS_SUBDOMAIN not set in .env}"
: "${DUCKDNS_TOKEN:?DUCKDNS_TOKEN not set in .env}"
: "${NPM_ADMIN_EMAIL:?NPM_ADMIN_EMAIL not set in .env}"
: "${NPM_ADMIN_PASSWORD:?NPM_ADMIN_PASSWORD not set in .env}"
: "${SERVER_IP:?SERVER_IP not set in .env}"

DOMAIN="${DUCKDNS_SUBDOMAIN}.duckdns.org"
PROXY_DIR="$SCRIPT_DIR/proxy-stack"
NC_DIR="$SCRIPT_DIR/nextcloud-stack"

# ── Step 1: Install jq ────────────────────────────────────────────────────────
info "Step 1: Ensuring jq is installed..."
command -v jq &>/dev/null || sudo apt-get install -y jq -qq
info "jq OK"

# ── Step 2: Free port 443 from Nextcloud ─────────────────────────────────────
info "Step 2: Checking Nextcloud port 443..."
if grep -q '"443:443"' "$NC_DIR/docker-compose.yml" 2>/dev/null || \
   grep -q '- 443:443' "$NC_DIR/docker-compose.yml" 2>/dev/null; then
    info "Freeing port 443 from Nextcloud (changing to 4443:443)..."
    sed -i 's/- 443:443/- 4443:443/' "$NC_DIR/docker-compose.yml"
    sed -i 's/"443:443"/"4443:443"/' "$NC_DIR/docker-compose.yml"
    (cd "$NC_DIR" && docker compose up -d) || warn "Could not restart Nextcloud"
fi
info "Port 443 is free"

# ── Step 3: Start proxy stack ─────────────────────────────────────────────────
info "Step 3: Starting proxy stack..."
mkdir -p "$PROXY_DIR"/{config/duckdns,data/npm,letsencrypt}
cd "$PROXY_DIR" && docker compose up -d
cd "$SCRIPT_DIR"
info "Proxy stack started"

# ── Step 4: Wait for NPM ──────────────────────────────────────────────────────
info "Step 4: Waiting for NPM to be ready (up to 90s)..."
for i in $(seq 1 30); do
    if curl -s "http://localhost:81/api/" >/dev/null 2>&1; then
        info "NPM ready!"
        break
    fi
    echo "  waiting... ${i}0s"
    sleep 3
done
sleep 5

# ── Step 5: Configure NPM credentials ────────────────────────────────────────
info "Step 5: Configuring NPM admin credentials..."
NPM_TOKEN=$(curl -s -X POST http://localhost:81/api/tokens \
  -H "Content-Type: application/json" \
  -d '{"identity":"admin@example.com","secret":"changeme"}' | jq -r '.token // empty')

if [[ -z "$NPM_TOKEN" ]]; then
    error "NPM not ready yet — wait 30s and re-run: bash proxy-setup.sh"
fi

# Update email
curl -s -X PUT http://localhost:81/api/users/1 \
  -H "Authorization: Bearer $NPM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$NPM_ADMIN_EMAIL\",\"nickname\":\"Admin\",\"name\":\"Admin\"}" >/dev/null

# Update password
curl -s -X PUT http://localhost:81/api/users/1/auth \
  -H "Authorization: Bearer $NPM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"password\",\"current\":\"changeme\",\"secret\":\"$NPM_ADMIN_PASSWORD\"}" >/dev/null

info "✓ NPM credentials set"

# ── Step 6: Request SSL certificate ──────────────────────────────────────────
info "Step 6: Requesting Let's Encrypt certificate for $DOMAIN..."
CERT=$(curl -s -X POST http://localhost:81/api/nginx/certificates \
  -H "Authorization: Bearer $NPM_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"provider\":\"letsencrypt\",
    \"domain_names\":[\"$DOMAIN\"],
    \"meta\":{\"letsencrypt_email\":\"$NPM_ADMIN_EMAIL\",\"letsencrypt_agree\":true,\"dns_challenge\":false}
  }")

CERT_ID=$(echo "$CERT" | jq -r '.id // empty')

if [[ -z "$CERT_ID" ]]; then
    warn ""
    warn "SSL cert request failed — port 80/443 probably not forwarded yet."
    warn "Forward ports 80 + 443 → $SERVER_IP on your router, then run:"
    warn "  bash $PROXY_DIR/finish.sh"

    # Save finish script for after port forwarding is configured
    cat > "$PROXY_DIR/finish.sh" << FINISH
#!/usr/bin/env bash
# Run this after forwarding ports 80+443 on your router
set -e
source "$(realpath "$SCRIPT_DIR")/.env"
DOMAIN="${DUCKDNS_SUBDOMAIN}.duckdns.org"
NPM_TOKEN=\$(curl -s -X POST http://localhost:81/api/tokens \\
  -H "Content-Type: application/json" \\
  -d '{"identity":"'"$NPM_ADMIN_EMAIL"'","secret":"'"$NPM_ADMIN_PASSWORD"'"}' | jq -r '.token')

CERT=\$(curl -s -X POST http://localhost:81/api/nginx/certificates \\
  -H "Authorization: Bearer \$NPM_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"provider":"letsencrypt","domain_names":["'"$DOMAIN"'"],"meta":{"letsencrypt_email":"'"$NPM_ADMIN_EMAIL"'","letsencrypt_agree":true,"dns_challenge":false}}')
CERT_ID=\$(echo "\$CERT" | jq -r '.id')
echo "Cert ID: \$CERT_ID"

curl -s -X POST http://localhost:81/api/nginx/proxy-hosts \\
  -H "Authorization: Bearer \$NPM_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"domain_names":["'"$DOMAIN"'"],"forward_scheme":"https","forward_host":"'"$SERVER_IP"'","forward_port":4443,"ssl_forced":true,"certificate_id":'\$CERT_ID',"websockets_support":true,"block_exploits":true,"advanced_config":"proxy_ssl_verify off;"}' >/dev/null

echo "✅ Done! https://$DOMAIN"
FINISH
    chmod +x "$PROXY_DIR/finish.sh"
    info "finish.sh saved to $PROXY_DIR/finish.sh"
else
    info "✓ Certificate issued (ID: $CERT_ID)"

    # ── Step 7: Create proxy host ─────────────────────────────────────────────
    info "Step 7: Creating NPM proxy host for Nextcloud..."
    curl -s -X POST http://localhost:81/api/nginx/proxy-hosts \
      -H "Authorization: Bearer $NPM_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"domain_names\":[\"$DOMAIN\"],\"forward_scheme\":\"https\",\"forward_host\":\"$SERVER_IP\",\"forward_port\":4443,\"ssl_forced\":true,\"certificate_id\":$CERT_ID,\"websockets_support\":true,\"block_exploits\":true,\"advanced_config\":\"proxy_ssl_verify off;\"}" >/dev/null
    info "✓ Proxy host created"
fi

# ── Step 8: Update Nextcloud ──────────────────────────────────────────────────
info "Step 8: Updating Nextcloud trusted domains + protocol..."
OCC="docker exec -u abc nextcloud php /app/www/public/occ"
$OCC config:system:set trusted_domains 2 --value="$DOMAIN" || warn "occ trusted_domains failed"
$OCC config:system:set overwriteprotocol --value="https" || warn "occ overwriteprotocol failed"
$OCC config:system:set overwrite.cli.url --value="https://$DOMAIN" || warn "occ overwrite.cli.url failed"
info "✓ Nextcloud updated"

echo ""
echo "══════════════════════════════════════════════════════"
echo -e "  ${GREEN}✅  Proxy setup complete!${NC}"
echo "══════════════════════════════════════════════════════"
echo "  Nextcloud LAN:  https://$SERVER_IP:4443"
echo "  Nextcloud WAN:  https://$DOMAIN"
echo "  NPM Admin:      http://$SERVER_IP:81"
echo "  NPM Login:      $NPM_ADMIN_EMAIL / [your password]"
echo "══════════════════════════════════════════════════════"
