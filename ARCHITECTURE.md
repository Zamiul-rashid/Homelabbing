# 🏗️ Technical Architecture & System Engineering

This document details the architectural decisions, storage pooling mechanics, network security topology, and resource management strategies that keep our 25+ service homelab running at rock-solid stability.

---

## 1. Multi-Stack Partitioning (`proxy-stack`, `media-stack`, `nextcloud-stack`)

A critical design principle of this repository is **Stack Decoupling**. Instead of cramming all 25+ services into a single monolithic 1,500-line `docker-compose.yml` file, the infrastructure is partitioned into three independent compose projects:

```
/opt/homelab/
├── proxy-stack/docker-compose.yml      (Nginx Proxy Manager + DuckDNS)
├── media-stack/docker-compose.yml      (21 containers: Media, *arr, AI, Utilities)
└── nextcloud-stack/docker-compose.yml  (Nextcloud + MariaDB)
```

### Why Decouple?
1. **Zero-Impact Upgrades & Restarts:** Restarting Nextcloud or running database migrations on MariaDB should never interrupt someone watching a 4K movie on Jellyfin or break an automated Radarr download.
2. **Clean Dependency Ordering:** `proxy-stack` initializes first to establish the external `proxy-net` network. Once ready, `media-stack` and `nextcloud-stack` attach clean proxy endpoints without race conditions.
3. **Isolated Blast Radiuses:** If a misconfigured custom plugin crashes Nextcloud or an experimental AI worker exhausts container memory, the fault remains isolated to that specific stack and network.

---

## 2. Network Topology & Isolation Strategy

Our container networks are strictly segmented to follow **Zero-Trust Security Principles**. Services are only granted network access to the specific tiers required for their functionality.

```
                  [ Internet / Tailscale Wireguard VPN ]
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ nginx-proxy-manager │  ← Port 80 / 443 (SSL Termination)
                         └──────────┬──────────┘
                                    │  Attached to: proxy-net (External Bridge)
         ┌──────────────────────────┴──────────────────────────┐
         │                                                     │
┌────────▼─────────────────────┐              ┌────────────────▼───────────────┐
│ media_net (Bridge)           │              │ download_net (Bridge)          │
│                              │              │                                │
│ • jellyfin      • kavita     │              │ • qbittorrent    • radarr      │
│ • navidrome     • paperless  │              │ • sonarr         • prowlarr    │
│ • homepage      • kuma       │              │ • jellyseerr                   │
└────────┬─────────────────────┘              └────────────────┬───────────────┘
         │                                                     │
         │       No Internet Routing / Sealed Internal Gateway │
┌────────▼─────────────────────────────────────────────────────▼───────────────┐
│ infra_net (internal: true — Isolated Backend Network)                        │
│                                                                              │
│ • redis (Cache for Paperless & AudioMuse)                                    │
│ • audiomuse-db (PostgreSQL + pgvector embeddings)                            │
│ • audiomuse-ai-worker (Background audio embedding processing)                │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Network Breakdown
- **`media_net` (Standard Bridge):** Connects user-facing web applications to the reverse proxy and internal monitoring dashboards (`uptime-kuma`, `homepage`). Containers on this network can communicate outbound to fetch metadata (e.g., TMDB movie covers, Navidrome lyrics) and serve local HTTP traffic.
- **`download_net` (Standard Bridge):** Dedicated automation loop where Prowlarr pushes indexer feeds to Radarr/Sonarr, and where Radarr/Sonarr instruct qBittorrent to fetch payloads. Isolating these tools prevents internal indexer APIs from being exposed to general web services.
- **`infra_net` (`internal: true` Bridge):** Our sealed backend vault. Setting `internal: true` in Docker removes the default external network gateway entirely. **Containers inside `infra_net` cannot reach the external internet, and external packets cannot route into `infra_net`.** Even if an attacker somehow compromised a front-end web service, they cannot exfiltrate data directly from `redis` or `audiomuse-db`.
- **`host` Network Mode (`homeassistant`):** Home Assistant runs in `network_mode: host` directly on the bare-metal network adapter. This is mandatory for smart home hubs to broadcast and receive local multicast discovery protocols (mDNS, SSDP, UPnP, HomeKit, and local Matter/Zigbee broadcasts) across your physical home Wi-Fi and LAN.

---

## 3. Storage Architecture: Unified Pooling (`mergerfs`)

Managing multiple multi-terabyte hard drives (`/dev/sda`, `/dev/sdb`, `/dev/sdc`, `/dev/sdd`) without a complex RAID controller or brittle LVM setups requires a flexible union filesystem. We utilize **[mergerfs](https://github.com/trapexit/mergerfs)** configured via `setup.bash` to pool individual physical disk mounts into a single, seamless `/data` tree.

### Physical to Logical Mapping
```
Physical Disks (Mounted at /mnt/disk1..4)           Logical Pool (mergerfs at /data)
┌──────────────────────────────────────┐            ┌────────────────────────────────┐
│ /mnt/disk1/media/movies/Inception... │ ──┐        │                                │
├──────────────────────────────────────┤   │        │ /data/media/movies/...         │
│ /mnt/disk2/media/tv/Breaking Bad/... │ ──┼───────►│ /data/media/tv/...             │
├──────────────────────────────────────┤   │        │ /data/media/music/...          │
│ /mnt/disk3/torrents/radarr/...       │ ──┤        │ /data/torrents/radarr/...      │
├──────────────────────────────────────┤   │        │ /data/nextcloud/...            │
│ /mnt/disk4/nextcloud_data/...        │ ──┘        └────────────────────────────────┘
└──────────────────────────────────────┘
```

### Why `mergerfs` over RAID / LVM / ZFS?
1. **Non-Destructive & Mix-and-Match:** You can combine drives of completely different sizes, brands, and speeds (e.g., an old 4 TB drive with a brand new 12 TB drive).
2. **Absolute Data Survivability:** Unlike striped RAID0 or LVM arrays where losing one drive corrupts the entire filesystem across all disks, each disk in a `mergerfs` pool remains a standard, readable `ext4` filesystem. If `/dev/sdc` fails, `/dev/sda`, `/sdb`, and `/sdd` remain 100% intact and readable on any Linux computer.
3. **Zero-Copy Hardlinking (*Arr Pipeline):** Because our `docker-compose.yml` mounts the entire `/data` pool as a unified volume bind (`/mnt/disk1/media:/data/media` and `/mnt/disk1/torrents:/data/torrents`), when qBittorrent finishes downloading a 50 GB 4K movie into `/data/torrents/radarr`, Radarr can instantly **hardlink** the file into `/data/media/movies` in less than 1 millisecond without duplicating physical disk space or degrading drive endurance!

---

## 4. Container Hardening: Resource Limits & Healthchecks

To prevent any single container from triggering an out-of-memory (OOM) kernel crash or starving other services of CPU time during heavy transcoding or vector indexing, all heavy containers enforce explicit resource ceilings using Docker Compose `deploy.resources` blocks:

```yaml
  jellyfin:
    deploy:
      resources:
        limits:
          memory: 6g         # Hard maximum memory ceiling
          cpus: '8.0'        # Maximum CPU cores available during 4K transcoding
        reservations:
          memory: 512m       # Guaranteed baseline memory allocation

  paperless-ngx:
    deploy:
      resources:
        limits:
          memory: 2g         # Prevents massive PDF OCR scans from eating host RAM
          cpus: '2.0'
```

### Automatic Self-Healing (`healthcheck`)
Critical services define robust Docker healthchecks (`test`, `interval`, `timeout`, `retries`) that continuously ping API endpoints (`/health` or `/ping`). If a service freezes or deadlocks, `Watchtower` or `Uptime Kuma` immediately flags the unhealthy container state, allowing automatic or quick manual interventions before users notice downtime.

---

## 5. Watchtower Opt-In Strategy (`enable=false` vs `enable=true`)

Automating container updates across 25+ services carries an inherent risk: if a stateful application (like `Nextcloud`, `Paperless-ngx`, or `PostgreSQL`) pushes a breaking database schema migration or major release bump overnight, an unattended auto-update could corrupt your database or break API compatibility.

Our `watchtower` service runs strictly in **opt-in mode**:
```yaml
    environment:
      - WATCHTOWER_LABEL_ENABLE=true
```

### How Containers Are Classified:
- **`enable=true` (Automatic Nightly Updates):** Stateless, low-risk utilities and download clients where updates fix minor bugs and never break persistent databases: `qbittorrent`, `uptime-kuma`, `feishin`, `homarr`, `stirling-pdf`, `adguardhome`, and `navidrome`.
- **`enable=false` / Omitted (Manual Review Required):** Stateful database engines, media servers with complex metadata indices, and critical automation hubs where major version bumps require reading release notes first: `jellyfin`, `radarr`, `sonarr`, `prowlarr`, `paperless-ngx`, `audiomuse-ai`, `audiomuse-db`, `redis`, `homeassistant`, and `nextcloud`.
