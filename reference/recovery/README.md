# Recovery scripts (`reference/recovery/`)

> [!IMPORTANT]
> **The scripts in this folder are a July 2026 snapshot.** Read them for ideas. Treat them as examples, not as a tested disaster plan for your own server.

You do not need any of this to build your first homelab. It is here to show one way to script the boring parts of a rebuild.

---

## What the scripts do

1. **`01-bootstrap.sh`** prepares a fresh Ubuntu Server: updates packages, installs Docker Engine, sets up a default-deny firewall and creates the folder layout.
2. **`02-restore.sh`** asks for the decryption password, fetches the latest encrypted archive, decrypts it and puts the Nginx Proxy Manager, Nextcloud and Home Assistant state back in place, then fixes file ownership.
3. **`03-backup.sh`** pauses Nginx Proxy Manager for a moment, archives its data and certificates together with the Nextcloud and Home Assistant config, and encrypts the tarball with OpenSSL (AES-256-CBC with PBKDF2).
4. **`04-recyclarr.yml`** is the Recyclarr config that syncs TRaSH Guides quality profiles and custom formats into Radarr and Sonarr.
5. **`05-ignition.sh`** copies the filled-in `.env` into each stack folder and starts the stacks in order: proxy first, then the rest.

---

## How the lab thinks about backups

These are the ideas behind the lab's backups. The details (what, when, how long) are left out on purpose.

- **Copy to a second machine.** Data that would be hard to replace goes to a disk in a different machine, not just a different folder.
- **Batch the disk work.** Jobs that touch hard disks run together in one short window at night, so the disks can spin down the rest of the day.
- **Encrypt what is slow to rebuild.** The state that would take longest to recreate by hand also goes into an encrypted archive.
- **Keep configuration in Git, secrets out of it.** Compose files and scripts are versioned; `.env` files never are, and every change is scanned for secrets first.
- **Watch the backups.** A backup that silently stops is worse than none, so a stale backup raises an alert like any other failure.

[`docs/06-backups-and-redundancy.md`](../../docs/06-backups-and-redundancy.md) covers the 3-2-1 rule and how to plan backups for your own server.

---

## What is worth learning from the scripts

- How `openssl enc -aes-256-cbc -pbkdf2` encrypts an archive with a passphrase.
- Why pausing a container for a few seconds gives you a consistent copy of its files.
- How TRaSH Guides profiles can live in a plain YAML file (`04-recyclarr.yml`) instead of being clicked together by hand.
