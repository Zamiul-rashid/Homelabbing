# 🏛️ Author's Personal Reference Setup (`reference/`)

> [!IMPORTANT]
> **This directory is provided for advanced reference and inspiration only.**
> You are **NOT** expected or advised to deploy these configurations directly on your first home server!

When building your first home server, we strongly recommend starting with the modular, self-contained stacks inside our [`stacks/`](../stacks/README.md) directory. Each stack there is isolated, heavily commented, and designed to teach you how the underlying services work.

---

## 🧐 What is Inside This Folder?

This directory contains the exact, unmodified Docker Compose blueprints and recovery scripts that the repository author personally uses to run their 25+ service production ecosystem at home:

- **[`media-stack/`](media-stack/)** — A comprehensive, single-network 21-container compose stack combining Jellyfin, Navidrome, Kavita, the complete `*arr` download automation pipeline (`Radarr`, `Sonarr`, `Prowlarr`, `qBittorrent`), artificial intelligence audio vector indexing (`AudioMuse AI` + `PostgreSQL pgvector`), `Paperless-ngx`, `Stirling PDF`, `Actual Budget`, `Home Assistant`, `Mosquitto MQTT`, `AdGuard Home`, `Redis`, `Portainer`, `Watchtower`, and `Homepage`.
- **[`nextcloud-stack/`](nextcloud-stack/)** — A standalone production Nextcloud + MariaDB stack wired to dedicated cloud storage pools.
- **[`proxy-stack/`](proxy-stack/)** — The primary Nginx Proxy Manager + DuckDNS edge routing gateway.
- **[`recovery/`](recovery/)** — The author's personal bare-metal recovery scripts (`01-bootstrap.sh`, `02-restore.sh`, `03-backup.sh`, `04-recyclarr.yml`, `05-ignition.sh`) used to resurrect the entire 25+ service lab from a cold backup in under 30 minutes (`Bus Factor: 0`).

---

## 🛠️ Why Keep This Here?

While our beginner-friendly `stacks/` teach you how to build service by service, reading real-world production configurations provides immense learning value:
1. **Seeing the Big Picture:** You can inspect `media-stack/docker-compose.yml` to see how 21 containers share network definitions (`media_net`, `download_net`, `infra_net`) and zero-copy hardlink volumes (`/data/torrents` ↔ `/data/media`).
2. **Studying Advanced Security:** Notice how the `infra_net` bridge uses `internal: true` to completely seal off Redis and PostgreSQL from the public internet.
3. **Automated Recovery Inspiration:** Reviewing `recovery/03-backup.sh` shows how to pause live SQLite databases before archiving and encrypt tarballs in memory using `AES-256-CBC` and `PBKDF2`.

Feel free to explore, learn from the patterns, and adopt what fits your own personal homelab architecture!
