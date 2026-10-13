# Recovery scripts (`reference/recovery/`)

> [!IMPORTANT]
> **The scripts in this folder are a July 2026 snapshot. The text below describes how backups work in October 2026.**
> The backup has changed a lot since July, and a full restore has never been tested end to end. Read the scripts for ideas; do not trust them as a working disaster plan.

You do not need any of this to build your first homelab. It is here to show one way to script the boring parts of a rebuild.

---

## What the July scripts do

1. **`01-bootstrap.sh`** prepares a fresh Ubuntu Server: updates packages, installs Docker Engine, sets up the UFW firewall and creates the folder layout. The snapshot uses `/opt/homelab`; the live lab uses `~/homelab`.
2. **`02-restore.sh`** asks for the decryption password, fetches the latest encrypted archive, decrypts it and puts the Nginx Proxy Manager, Nextcloud and Home Assistant state back in place, then fixes file ownership.
3. **`03-backup.sh`** pauses Nginx Proxy Manager for a moment, archives its data and certificates together with the Nextcloud and Home Assistant config, and encrypts the tarball with OpenSSL (AES-256-CBC, PBKDF2 with 600,000 iterations). The script can also copy the archive to an S3 bucket, but the live lab does not use it.
4. **`04-recyclarr.yml`** is the Recyclarr config that syncs TRaSH Guides quality profiles and custom formats into Radarr and Sonarr.
5. **`05-ignition.sh`** copies the filled-in `.env` into each stack folder and starts the stacks in order: proxy first, then the rest.

---

## How backups work in October 2026

### The archive

The encrypted "doomsday" archive from `03-backup.sh` still exists, with three differences from what the July text claimed:

- It runs **weekly** (Sunday 03:30), not daily.
- It **stays local**. Nothing is uploaded to S3 or WebDAV.
- It keeps the **last 4** archives, not 7 days' worth.

### The nightly window

Every job that touches a hard disk starts between 03:00 and 03:45 on both servers, so the disks can spin down for the rest of the day.

| When | Job |
| :--- | :--- |
| Nightly 03:00 | Music, rsync to the backup disk on the Proxmox host |
| Nightly 03:05 | All app configs and databases, 4 days of history; the Proxmox host config |
| Nightly 03:10 | Gitea data |
| Nightly 03:20 | Paperless export, 30 daily hardlinked snapshots |
| Saturday 03:35 | Proxmox container dumps, last 2 kept |
| Sunday 03:30 | The encrypted archive: proxy, certificates, Nextcloud and Home Assistant state, last 4 kept |

### Config as code

The whole `~/homelab` folder on the app server is a Git repository. Every 15 minutes a timer checks for changes and, only if something changed, commits and pushes to a private GitHub repository.

- An allow-list `.gitignore` tracks Compose files, scripts, docs and configs without secrets. `.env` files, keys, databases and app state are never tracked.
- Before each commit, a custom secret scanner checks the change for keywords, private keys, tokens, `user:pass@` URLs, high-entropy strings and every real value from the stacks' `.env` files. Then gitleaks runs. One hit and nothing is committed.
- It never force-pushes.

This is the only copy that leaves the house, and it holds configuration only.

---

## Honest limitations

- Backups land on one disk, in the same building as the servers.
- Nextcloud user data (about 350 GB) has a single copy.
- Databases are copied live with rsync rather than dumped, so a copy taken mid-write may not restore cleanly.
- **No restore has been tested end to end.** Until one has, there is no honest recovery time to quote.
- Media is not backed up on purpose. It can be downloaded again.
- There is no UPS yet.

If you are planning your own backups, [`docs/06-backups-and-redundancy.md`](../../docs/06-backups-and-redundancy.md) covers the 3-2-1 rule this setup does not yet meet.

---

## What is still worth learning from the scripts

- How `openssl enc -aes-256-cbc -pbkdf2` encrypts an archive with a passphrase.
- Why pausing a container for a few seconds gives you a consistent copy of its files.
- How TRaSH Guides profiles can live in a plain YAML file (`04-recyclarr.yml`) instead of being clicked together by hand.
