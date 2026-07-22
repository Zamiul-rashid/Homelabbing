#!/usr/bin/env bash
# =============================================================================
#  configure-stack.sh — Homelab Showcase: *arr Stack Wiring
#
#  Run ONCE after the stack has been started for the first time.
#  Reads API keys directly from the generated config.xml files — not from .env.
#  (The keys are auto-generated on first container boot, not known beforehand.)
#
#  What it does:
#    1. Extracts Radarr/Sonarr/Prowlarr API keys from their config XML files
#    2. Gets qBittorrent temporary password from Docker logs
#    3. Configures qBittorrent save paths + creates radarr/sonarr categories
#    4. Sets Radarr root folder (/data/media/movies) + qBit download client
#    5. Sets Sonarr root folder (/data/media/tv) + qBit download client
#    6. Connects Prowlarr → Radarr (fullSync) + Prowlarr → Sonarr (fullSync)
#
#  Manual step remaining after this script:
#    Add indexers in Prowlarr UI (http://SERVER_IP:9696)
#    These are account-specific and cannot be automated safely.
#
#  Usage:
#    bash configure-stack.sh
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

IP="${SERVER_IP:?SERVER_IP not set in .env}"
STACK="$SCRIPT_DIR/media-stack"

info "Waiting 10s for containers to settle..."
sleep 10

# ── Extract API keys from config XMLs ─────────────────────────────────────────
info "Extracting API keys from config files..."
RADARR_KEY=$(grep -oP '(?<=<ApiKey>)[^<]+' "$STACK/config/radarr/config.xml" 2>/dev/null || true)
SONARR_KEY=$(grep -oP '(?<=<ApiKey>)[^<]+' "$STACK/config/sonarr/config.xml" 2>/dev/null || true)
PROWLARR_KEY=$(grep -oP '(?<=<ApiKey>)[^<]+' "$STACK/config/prowlarr/config.xml" 2>/dev/null || true)

[[ -n "$RADARR_KEY" ]]   || error "Radarr API key not found. Is the container running? Wait a bit longer."
[[ -n "$SONARR_KEY" ]]   || error "Sonarr API key not found."
[[ -n "$PROWLARR_KEY" ]] || error "Prowlarr API key not found."

echo "  Radarr:   ${RADARR_KEY:0:8}..."
echo "  Sonarr:   ${SONARR_KEY:0:8}..."
echo "  Prowlarr: ${PROWLARR_KEY:0:8}..."

# Optionally write API keys to .env for future use (Recyclarr, etc.)
if grep -q "^RADARR_API_KEY=$" "$ENV_FILE" 2>/dev/null || grep -q "^RADARR_API_KEY=\s*$" "$ENV_FILE" 2>/dev/null; then
    info "Writing API keys to .env..."
    sed -i "s|^RADARR_API_KEY=.*|RADARR_API_KEY=$RADARR_KEY|" "$ENV_FILE"
    sed -i "s|^SONARR_API_KEY=.*|SONARR_API_KEY=$SONARR_KEY|" "$ENV_FILE"
    sed -i "s|^PROWLARR_API_KEY=.*|PROWLARR_API_KEY=$PROWLARR_KEY|" "$ENV_FILE"
    info "API keys saved to .env (for Recyclarr)"
fi

# ── qBittorrent ───────────────────────────────────────────────────────────────
info "Configuring qBittorrent..."
QB_PASS="${QB_PASSWORD:-}"
if [[ -z "$QB_PASS" ]]; then
    QB_PASS=$(docker logs qbittorrent 2>&1 | grep -oP 'temporary password.*?:\s*\K\S+' | tail -1 || true)
fi
[[ -z "$QB_PASS" ]] && QB_PASS="adminadmin"
info "qBit password: ${QB_PASS:0:4}***"

QB_COOKIE=$(curl -s -c /tmp/qb.txt -X POST "http://$IP:8080/api/v2/auth/login" \
  -d "username=admin&password=$QB_PASS")
[[ "$QB_COOKIE" == "Ok." ]] || warn "qBit login response: $QB_COOKIE (may be ok if already logged in)"

curl -s -b /tmp/qb.txt -X POST "http://$IP:8080/api/v2/app/setPreferences" \
  -d 'json={"save_path":"/data/torrents","temp_path_enabled":true,"temp_path":"/data/torrents/incomplete"}' >/dev/null
curl -s -b /tmp/qb.txt -X POST "http://$IP:8080/api/v2/torrents/createCategory" \
  -d "category=radarr&savePath=/data/torrents/radarr" >/dev/null
curl -s -b /tmp/qb.txt -X POST "http://$IP:8080/api/v2/torrents/createCategory" \
  -d "category=sonarr&savePath=/data/torrents/sonarr" >/dev/null
info "✓ qBittorrent configured"

# ── Radarr ────────────────────────────────────────────────────────────────────
info "Configuring Radarr..."
curl -s -X POST "http://$IP:7878/api/v3/rootfolder" \
  -H "X-Api-Key: $RADARR_KEY" -H "Content-Type: application/json" \
  -d '{"path":"/data/media/movies"}' >/dev/null

curl -s -X POST "http://$IP:7878/api/v3/downloadclient" \
  -H "X-Api-Key: $RADARR_KEY" -H "Content-Type: application/json" \
  -d "{\"name\":\"qBittorrent\",\"enable\":true,\"protocol\":\"torrent\",\"priority\":1,
       \"implementation\":\"QBittorrent\",\"configContract\":\"QBittorrentSettings\",
       \"fields\":[{\"name\":\"host\",\"value\":\"qbittorrent\"},{\"name\":\"port\",\"value\":8080},
       {\"name\":\"username\",\"value\":\"admin\"},{\"name\":\"password\",\"value\":\"$QB_PASS\"},
       {\"name\":\"movieCategory\",\"value\":\"radarr\"}]}" >/dev/null
info "✓ Radarr configured"

# ── Sonarr ────────────────────────────────────────────────────────────────────
info "Configuring Sonarr..."
curl -s -X POST "http://$IP:8989/api/v3/rootfolder" \
  -H "X-Api-Key: $SONARR_KEY" -H "Content-Type: application/json" \
  -d '{"path":"/data/media/tv"}' >/dev/null

curl -s -X POST "http://$IP:8989/api/v3/downloadclient" \
  -H "X-Api-Key: $SONARR_KEY" -H "Content-Type: application/json" \
  -d "{\"name\":\"qBittorrent\",\"enable\":true,\"protocol\":\"torrent\",\"priority\":1,
       \"implementation\":\"QBittorrent\",\"configContract\":\"QBittorrentSettings\",
       \"fields\":[{\"name\":\"host\",\"value\":\"qbittorrent\"},{\"name\":\"port\",\"value\":8080},
       {\"name\":\"username\",\"value\":\"admin\"},{\"name\":\"password\",\"value\":\"$QB_PASS\"},
       {\"name\":\"tvCategory\",\"value\":\"sonarr\"}]}" >/dev/null
info "✓ Sonarr configured"

# ── Prowlarr → Radarr + Sonarr ────────────────────────────────────────────────
info "Connecting Prowlarr → Radarr + Sonarr..."
curl -s -X POST "http://$IP:9696/api/v1/applications" \
  -H "X-Api-Key: $PROWLARR_KEY" -H "Content-Type: application/json" \
  -d "{\"name\":\"Radarr\",\"syncLevel\":\"fullSync\",\"implementation\":\"Radarr\",
       \"configContract\":\"RadarrSettings\",
       \"fields\":[{\"name\":\"prowlarrUrl\",\"value\":\"http://prowlarr:9696\"},
       {\"name\":\"baseUrl\",\"value\":\"http://radarr:7878\"},
       {\"name\":\"apiKey\",\"value\":\"$RADARR_KEY\"},
       {\"name\":\"syncCategories\",\"value\":[2000,2010,2020,2030,2040,2050,2060,2070,2080]}]}" >/dev/null

curl -s -X POST "http://$IP:9696/api/v1/applications" \
  -H "X-Api-Key: $PROWLARR_KEY" -H "Content-Type: application/json" \
  -d "{\"name\":\"Sonarr\",\"syncLevel\":\"fullSync\",\"implementation\":\"Sonarr\",
       \"configContract\":\"SonarrSettings\",
       \"fields\":[{\"name\":\"prowlarrUrl\",\"value\":\"http://prowlarr:9696\"},
       {\"name\":\"baseUrl\",\"value\":\"http://sonarr:8989\"},
       {\"name\":\"apiKey\",\"value\":\"$SONARR_KEY\"},
       {\"name\":\"syncCategories\",\"value\":[5000,5010,5020,5030,5040,5050,5060,5070,5080]}]}" >/dev/null
info "✓ Prowlarr connected to Radarr + Sonarr"

echo ""
echo "════════════════════════════════════════════════════"
echo -e "  ${GREEN}✅  Stack configured!${NC}"
echo "════════════════════════════════════════════════════"
echo ""
echo "  Extracted keys (also saved to .env if they were blank):"
echo "    RADARR_API_KEY=${RADARR_KEY}"
echo "    SONARR_API_KEY=${SONARR_KEY}"
echo "    PROWLARR_API_KEY=${PROWLARR_KEY}"
echo ""
echo "  ⚠  Manual step remaining:"
echo "     Add indexers in Prowlarr UI → http://$IP:9696"
echo ""
echo "  Next: docker exec -it recyclarr recyclarr sync"
echo ""
