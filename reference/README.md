# The author's reference setup (`reference/`)

> [!IMPORTANT]
> **The files in this folder are a July 2026 snapshot, kept for reading, not for deploying.**
> The lab has grown and been reorganised since then. The [My lab](https://Zamiul-rashid.github.io/Homelabbing/my-lab) page on the website describes how it fits together today, in general terms.

Start with the modular stacks in [`stacks/`](../stacks/README.md) for your first server. Each one is small, commented line by line, and runs on its own. This folder is where you look later, when you want to see how the pieces fit together in a lab that has grown.

![The lab in general terms: router zones, an app server with grouped stacks, a Proxmox host with the media and backup disks, monitoring and alerts](../docs/lab-architecture.png)

The HTML sources for both diagrams are in [`diagrams/`](../diagrams/). Open one in a browser and use its export menu to make a new PNG.

---

## What is in this folder

| Path | What it is |
| :--- | :--- |
| [`media-stack/`](media-stack/README.md) | One large Compose file from July: media, downloads, documents, smart home and dashboards in a single stack. It is a good example of why a lab later gets split into smaller stacks. |
| [`nextcloud-stack/`](nextcloud-stack/) | Nextcloud and its MariaDB database as a stack of their own. |
| [`proxy-stack/`](proxy-stack/) | Nginx Proxy Manager and a dynamic DNS updater: the one way in from the internet. |
| [`recovery/`](recovery/README.md) | Bootstrap, restore, backup and start-up scripts. |

---

## Patterns worth taking from it

### Split networks by job

Instead of one flat Docker network, the snapshot puts the apps people use, the download side and the databases on separate networks. Trouble on the download side (hundreds of peer connections, bursts of tracker requests) stays there, and the apps people use never share a network with the download client.

### Seal databases off with `internal: true`

A Docker network with `internal: true` has no route to the outside world. Containers on it cannot reach the internet, and nothing outside can reach them through it. Put a database on an internal network, give it no published ports, and the only way to talk to it is from another container you deliberately attached to the same network.

### Give shared networks their own owner

If a network is defined inside an app's Compose file, `docker compose down` on that app deletes the network, even when other stacks still use it. The lab now keeps shared networks in a tiny stack of their own, and every app stack joins them as `external: true`, so taking one app down can no longer break the others.

### One `/data` filesystem for downloads and media

Downloads and the media library live under one `/data` folder, mounted into every container that needs it as a single volume. Because both sides sit on the same filesystem inside the container, Sonarr and Radarr import with hardlinks: instant, and no second copy on disk. [`docs/arr-stack-flow.md`](../docs/arr-stack-flow.md) walks through it.

### Keep the configuration in Git, never the secrets

The lab's Compose files, scripts and secret-free configs live in a private Git repository. An allow-list `.gitignore` decides what may be tracked, `.env` files never are, and every change is scanned for secrets before it is committed. If one is found, nothing is committed.

---

## Why keep this folder?

The beginner stacks in `stacks/` teach one service at a time. A grown lab shows things the beginner stacks cannot:

1. **How many services share networks and storage.** Read [`media-stack/docker-compose.yml`](media-stack/docker-compose.yml) to see the networks and the `/data` layout in one file.
2. **Database isolation.** Look for `internal: true` in its `networks:` block.
3. **Encrypted backups.** [`recovery/03-backup.sh`](recovery/03-backup.sh) pauses the proxy while it archives, then encrypts the tarball with OpenSSL (AES-256-CBC with PBKDF2).

Take the patterns that fit your own lab and leave the rest.
