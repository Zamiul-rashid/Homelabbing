# 🛡️ Author's Personal Bare-Metal Recovery Workflows (`reference/recovery/`)

> [!NOTE]
> **This folder contains the author's personal automated recovery scripts.**
> These scripts are provided as reference and inspiration so you can see how an experienced system administrator automates full server restoration. You do not need to run these scripts to build or use your homelab!

---

## 📋 What Are These Scripts?

To ensure that a physical hard drive failure never results in permanent data loss or weeks of manual reconfiguration (`Bus Factor: 0`), the author uses a 5-stage automated recovery workflow:

1. **`01-bootstrap.sh`** — Prepares a clean bare-metal Ubuntu Server by updating `apt`, installing Docker Engine, setting up UFW firewalls, and preparing system directories (`/opt/homelab`).
2. **`02-restore.sh`** — Prompts for the `AES-256-CBC` decryption password, downloads the encrypted backup archive from local storage or S3/WebDAV cloud buckets, decrypts the snapshot, and extracts Nginx Proxy Manager, Nextcloud, and Home Assistant state cleanly to `/opt/homelab/`.
3. **`03-backup.sh`** — The automated daily cron job that pauses `nginx-proxy-manager` momentarily, bundles state directories (`data/`, `config/`, `letsencrypt/`), encrypts them using OpenSSL with PBKDF2 (600,000 iterations), uploads them to target buckets, and prunes old local archives after 7 days.
4. **`04-recyclarr.yml`** — The TRaSH Guides profile configuration used by `Recyclarr` to synchronize custom quality formats (`1080p Bluray`, `TrueHD Atmos`, `Garbage Release Penalties`) to `Radarr` and `Sonarr`.
5. **`05-ignition.sh`** — The final trigger script that copies the populated `.env` file into each stack folder, launches the core edge routing (`proxy-stack`), and boots up `media-stack` and `nextcloud-stack` sequentially.

---

## 💡 How You Should Use This

When planning your own server backup and recovery routine (see **[`docs/06-backups-and-redundancy.md`](../../docs/06-backups-and-redundancy.md)**), study these scripts to learn:
- How `openssl enc -aes-256-cbc` protects private keys before cloud upload.
- How pausing SQLite database containers briefly guarantees zero corruption during tarball archiving.
- How TRaSH Guides profiles can be codified into clean YAML configs (`04-recyclarr.yml`).
