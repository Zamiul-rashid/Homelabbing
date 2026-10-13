# The July 2026 media stack (`reference/media-stack/`)

> [!IMPORTANT]
> **[`docker-compose.yml`](docker-compose.yml) is a July 2026 snapshot. The text below describes the setup as it runs in October 2026.**
> In July, 25 containers lived in this one file. By October the same services, and many more, run as 55 containers in 16 smaller stacks. Read the file to learn from it; do not deploy it as your first server. Start with [`../../stacks/`](../../stacks/README.md).

---

## What the snapshot file contains

All 25 services in one Compose file, on three networks (`media_net`, `download_net`, `infra_net`). Here is each one, and where it is today.

### Media

| Service | What it does | October 2026 |
| :--- | :--- | :--- |
| `jellyfin` | Media server: indexes movies and TV, fetches artwork and streams to TVs, phones and browsers. | `media` stack. Transcodes on the Ryzen's Vega iGPU. |
| `navidrome` | Music server with the Subsonic API, so any Subsonic app can stream from it. | `media` stack. |
| `kavita` | Reader for ebooks, comics and manga, with progress sync. | `media` stack. |
| `feishin` | A desktop and web player for Navidrome and Jellyfin music. | `media` stack. |

### Requests and downloads

| Service | What it does | October 2026 |
| :--- | :--- | :--- |
| `jellyseerr` | The request page: people pick a film or show and press Request. | Replaced by **Seerr**, its successor, in the `media` stack. |
| `radarr` | Watches for movies, picks releases by quality profile, imports and renames them. | `download` stack. |
| `sonarr` | The same for TV series, episode by episode. | `download` stack. |
| `prowlarr` | Manages indexers in one place and syncs them to Radarr and Sonarr. | `download` stack. |
| `qbittorrent` | The download client. | `download` stack, **pinned to a version** after an auto-update broke it. |

The `download` stack has since gained **qbit-manage** (pinned), **Recyclarr** (keeps TRaSH Guides quality profiles in sync) and **Maintainerr** (library cleanup). A host script, the **download guard**, checks finished downloads every 2 minutes; see [`docs/arr-stack-flow.md`](../../docs/arr-stack-flow.md).

### Documents, tools and AI

| Service | What it does | October 2026 |
| :--- | :--- | :--- |
| `paperless-ngx` | Document archive: OCR, full-text search and automatic tags for scanned letters and invoices. | `tools` stack. |
| `redis` | Task queue for Paperless-ngx. | `tools` stack, on the internal `infra_net`. |
| `stirling-pdf` | Merge, split, compress, OCR and redact PDFs locally. | `tools` stack. |
| `filebrowser` | A web file manager for the data disks. | `tools` stack. |
| `audiomuse-ai` | Analyses the music library to build mood tags and "sounds like" playlists. | `tools` stack. |
| `audiomuse-ai-worker` | Does the heavy audio analysis in the background. | `tools` stack. |
| `audiomuse-db` | Postgres with the `pgvector` extension for AudioMuse. | `tools` stack, on the internal `infra_net`. |
| `actual-budget` | Personal budgeting app. | **Removed.** |

### Smart home and DNS

| Service | What it does | October 2026 |
| :--- | :--- | :--- |
| `homeassistant` | Smart home hub and automations. | `smarthome` stack. |
| `mosquitto` | MQTT broker for sensors and devices talking to Home Assistant. | `smarthome` stack. |
| `adguardhome` | DNS resolver for the LAN that blocks ads and trackers. | `smarthome` stack. DHCP hands it out first and the router second, so DNS keeps working if the app server is down. |

### Dashboards and management

| Service | What it does | October 2026 |
| :--- | :--- | :--- |
| `homepage` | Dashboard with links and live stats. | **Removed.** A hand-written dashboard in the `infra` stack replaced it. |
| `homarr` | Another dashboard. | **Removed.** |
| `uptime-kuma` | Checks that services answer and shows uptime history. | `infra` stack, 38 monitors. It does not send the alerts: those come from Grafana. |
| `portainer` | Web UI for containers, volumes and logs. | `infra` stack. |
| `watchtower` | Updates containers when new images appear. | `infra` stack. Runs daily and only touches containers that opt in; pinned images are excluded. It does not use Redis. |

---

## The networks

The snapshot has three networks:

```yaml
networks:
  media_net:
    driver: bridge
  download_net:
    driver: bridge
  infra_net:
    driver: bridge
    internal: true  # no route in or out
```

- **`media_net`** holds the apps people open: Jellyfin, Navidrome, Kavita, the request page, Paperless and so on.
- **`download_net`** holds qBittorrent, Prowlarr, Radarr and Sonarr, apart from the apps people use.
- **`infra_net`** is `internal: true`. Redis and the AudioMuse database have no route to the internet and no published ports. Only the apps that are on `infra_net` **and** on `media_net` (Paperless-ngx, AudioMuse) can reach them.

In October there are five networks: these three plus `nextcloud_net` and `qr_net`. A separate `networks` stack owns all of them, so `docker compose down` on one app stack can no longer delete a network that other stacks still use. [`../README.md`](../README.md#why-the-networks-are-split) explains the layout.

The snapshot file does **not** contain a VPN container. Earlier versions of this README talked about routing downloads through `gluetun`; that was never deployed.

---

## Storage paths

In the snapshot, qBittorrent writes to `/data/torrents`, and Radarr and Sonarr import into `/data/media/movies` and `/data/media/tv`. The folder names still hold in October, with two changes:

- qBittorrent downloads into `/data/torrents/incomplete` and moves finished files into `/data/torrents/radarr` or `/data/torrents/sonarr`.
- `/data` for movies, TV and torrents is now an **NFS 4.2 share from the Proxmox host**. Because torrents and media sit on the same filesystem, imports are still hardlinks: instant, and no extra space used.

Music, books and photos stay on the app server's own disks.
