# 🛡️ Security Posture & Hardening Guide

Security in a self-hosted environment is not a single setting—it is a continuous layered defense across physical access, network firewalling, container isolation, secret management, and automated patch discipline.

This document outlines the strict security practices enforced by our repository architecture and provides actionable guidance on keeping your homelab resilient against internal and external threats.

---

## 1. Zero Hardcoded Secrets (`.env` Architecture)

A foundational security rule of this showcase is **Zero Hardcoded Secrets**. Whether reviewing our shell scripts (`proxy-setup.sh`, `configure-stack.sh`, `03-backup.sh`) or our Docker Compose definitions (`media-stack/docker-compose.yml`), you will never find hardcoded passwords, personal email addresses, API tokens, or real LAN IP addresses.

### How Secret Injection Works:
1. **Centralized `.env.example` Template:** All configurable parameters (`DB_PASSWORD`, `NPM_ADMIN_PASSWORD`, `DUCKDNS_TOKEN`, `PAPERLESS_SECRET_KEY`, `BACKUP_ENCRYPTION_PASSWORD`, `TAILSCALE_AUTH_KEY`) are defined as blank or generic placeholder variables inside `.env.example`.
2. **Ignition Distribution:** When you run `scripts/05-ignition.sh`, the script automatically copies your populated root `.env` file directly into each stack directory (`/media-stack/.env`, `/nextcloud-stack/.env`, `/proxy-stack/.env`) right before launching containers.
3. **Strict `.gitignore` Protection:** Our `.gitignore` is engineered to reject any accidental commits containing environment files, private SSH keys, SSL certificates, runtime databases, or backup archives:
```gitignore
# --- Secrets & State ---
.env
*.env
*.key
*.pem
data/
config/
letsencrypt/
*.tar.gz.enc
```

---

## 2. UFW Firewall & Edge Access Rules

By default, an exposed Ubuntu server without a host-level firewall accepts inbound connections on every port where a service is listening. Our bootstrap script (`scripts/01-bootstrap.sh`) automatically configures **Uncomplicated Firewall (UFW)** with a strict default-deny policy:

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp     # HTTP (Required for Let's Encrypt DNS challenges & web redirects)
ufw allow 443/tcp    # HTTPS (Terminated exclusively by Nginx Proxy Manager)
ufw allow 81/tcp     # NPM Admin GUI (Should be restricted to local LAN in production)
ufw --force enable
```

### Why This Matters:
Even though internal containers like `Jellyfin` (port `8096`), `Navidrome` (port `4533`), or `Portainer` (port `9000`) bind to the host network adapter, **UFW blocks all remote internet traffic from accessing those ports directly.** External users across the public web can only enter the server via ports `80` and `443`, where Nginx Proxy Manager inspects subdomains, terminates SSL certificates, and routes clean traffic internally.

---

## 3. Network Isolation & Sealed Database Vaults (`infra_net`)

Rather than placing all containers on a single flat bridge network where any compromised web service could scan and probe internal databases, our compose architecture divides traffic across isolated virtual networks:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Public / Edge Tier (proxy-net)                                         │
│ Only Nginx Proxy Manager connects here to receive ports 80/443.        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS Proxied Routing
┌───────────────────────────────────▼────────────────────────────────────┐
│ Application Tier (media_net & download_net)                            │
│ Web apps (Jellyfin, Paperless, Radarr) communicate with each other.    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Internal Database Queries Only
┌───────────────────────────────────▼────────────────────────────────────┐
│ Backend Vault Tier (infra_net — internal: true)                        │
│ Redis Cache, PostgreSQL (pgvector), AudioMuse Worker                   │
└────────────────────────────────────────────────────────────────────────┘
```

### The `internal: true` Security Seal:
In `media-stack/docker-compose.yml`, our backend network explicitly declares:
```yaml
networks:
  infra_net:
    driver: bridge
    internal: true
```
When `internal: true` is enabled, Docker strips the default network gateway. **Containers inside `infra_net` physically cannot initiate outbound connections to the internet, and external internet packets cannot route into `infra_net`.** If a malicious document uploaded to `Paperless-ngx` triggered an exploit inside the front-end application container, the attacker is entirely trapped within the container bridge and cannot reach or exfiltrate data from your internal `redis` or `audiomuse-db` instances.

---

## 4. Let's Encrypt SSL & Reverse Proxy Hardening

Exposing web dashboards over plain HTTP transmits session cookies, login credentials, and personal data in cleartext across the internet. Our `proxy-stack` automates enterprise-grade HTTPS encryption for every external service using **Nginx Proxy Manager** and **DuckDNS**:

- **Automated SSL Certificate Provisioning:** `proxy-setup.sh` communicates with NPM's REST API (`/api/nginx/certificates`) to request valid 90-day **Let's Encrypt** certificates for your custom domain (`*.your-subdomain.duckdns.org`).
- **Forced HTTPS Redirection:** Every created proxy host sets `ssl_forced: true`, ensuring any accidental HTTP (`port 80`) request instantly upgrades to secure HTTPS (`port 443`).
- **Exploit & WebSocket Protections:** NPM hosts are configured with `block_exploits: true` and `websockets_support: true`, filtering out common SQL injection/XSS attempts while allowing real-time WebSocket communication for `Nextcloud` and `Home Assistant`.

---

## 5. Military-Grade Backup Encryption (`AES-256-CBC`)

When backing up stateful server configurations (`/proxy-stack/data/npm`, `/nextcloud-stack/config`, Let's Encrypt private keys), leaving unencrypted tar archives on local storage or uploading them to external cloud storage (AWS S3, WebDAV) exposes sensitive system state.

Our automated backup script (`scripts/03-backup.sh`) encrypts every archive **locally in memory right before writing to disk or uploading over the network** using OpenSSL:

```bash
openssl enc -aes-256-cbc -pbkdf2 -iter 600000 \
    -in  "$STAGING_DIR/$ARCHIVE_NAME" \
    -out "$STAGING_DIR/$ENCRYPTED_NAME" \
    -pass "pass:$BACKUP_ENCRYPTION_PASSWORD"
```

### Security Specifications of the Backup Pipeline:
- **Cipher Standard:** `AES-256-CBC` (Advanced Encryption Standard with 256-bit keys in Cipher Block Chaining mode).
- **Key Derivation Function:** `PBKDF2` (Password-Based Key Derivation Function 2).
- **Iteration Count:** **600,000 iterations** (defends against brute-force and dictionary attacks using modern GPU clusters).
- **Decryption Requirement:** Restoring state via `scripts/02-restore.sh` requires entering the exact `BACKUP_ENCRYPTION_PASSWORD` from your password vault before extraction can begin.

---

## 6. Tailscale Zero-Trust VPN Access

For remote administration (SSH access, Portainer management, direct database debugging), **we strongly advise against forwarding port 22 (SSH) or port 9000 (Portainer) to the public internet on your router.**

Our bootstrap script installs and connects **[Tailscale](https://tailscale.com/)** (`tailscale up --authkey="$TAILSCALE_AUTH_KEY"`). Tailscale builds a zero-trust, end-to-end encrypted WireGuard mesh network connecting your server directly to your laptop, tablet, or smartphone wherever you are in the world. When traveling, you simply toggle on your Tailscale app and access `http://YOUR_SERVER_IP:9000` securely as if you were sitting right inside your home living room.
