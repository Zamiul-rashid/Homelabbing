# 07. Security & Hardening Basics

Security on a home server is not a single toggle switch—it is a continuous habit built on simple, layered defenses across firewalls, container isolation, secret management, and update discipline.

In this guide, we will reframe advanced security hardening into accessible concepts. You will learn why you must never hardcode passwords inside configuration files, master **UFW (Uncomplicated Firewall)** edge rules, understand how Docker **network isolation (`internal: true`)** traps attackers, and discover why auto-updating database containers blindly is dangerous!

---

## 🎯 What You'll Learn

- Why never hardcode secrets and how environment variable templates (`.env.example`) keep your passwords out of git repositories.
- What **UFW** is, how default-deny policies work, and why edge firewalls block remote attacks before they reach containers.
- How Docker network segmentation (`internal: true`) creates sealed database vaults that cannot reach the public internet.
- Why blind auto-updates (`Watchtower`) can corrupt stateful databases, and how to practice deliberate, opt-in patch discipline.

---

## 🛑 1. Zero Hardcoded Secrets & `.env` Architecture

When configuring Docker stacks, you will constantly pass usernames, passwords, API keys, and database credentials to your services. A common beginner mistake is typing those passwords directly inside `docker-compose.yml` or shell scripts:

```yaml
# ❌ DANGEROUS HARDCODED PASSWORD inside docker-compose.yml
environment:
  - DB_PASSWORD=MySuperSecretPassword123!
```

If you ever commit your code to a public GitHub repository or share your compose file on a forum for troubleshooting, anyone reading your code sees your actual password instantly.

### The Clean Solution: `.env` Variables
Instead of writing secrets directly inside configuration files, we use **environment variables** loaded from a hidden local file named `.env`:

```yaml
# ✅ SECURE ENVIRONMENT VARIABLE REFERENCE inside docker-compose.yml
environment:
  - DB_PASSWORD=${DB_PASSWORD:-changeme}
```

When you type `docker compose up -d`, Docker looks for a hidden `.env` file right inside your directory, reads `DB_PASSWORD=YourActualSecretPass!`, and injects it into the container automatically!

> [!NOTE]
> **💡 Why This Matters**
> **Real-World Example:** In 2021, automated scanning bots scraped over 100,000 exposed database credentials and AWS secret keys committed accidentally to public GitHub repositories within seconds of upload. By keeping all sensitive credentials inside local `.env` files—and registering `.env` inside your `.gitignore`—your passwords never leave your physical computer.

---

## 🛡️ 2. UFW Firewall & Edge Access Rules

By default, an exposed Ubuntu server without a host-level firewall accepts incoming network connections on every single port where a software application is listening (`8096`, `4533`, `8080`, `5432`).

We use **UFW (Uncomplicated Firewall)** to lock down your server so only specific authorized ports can enter from the outside world.

### Setting Up Our Standard UFW Ruleset:
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp     # HTTP (Required for Let's Encrypt DNS challenges & redirection)
sudo ufw allow 443/tcp    # HTTPS (Terminated exclusively by Nginx Proxy Manager)
sudo ufw --force enable
```

```
┌────────────────────────────────────────────────────────────────────────┐
│ How UFW Protects Your Home Server at the Edge                          │
│                                                                        │
│  [Public Internet] ──(Port 80 / 443)──> [ALLOWED] Nginx Proxy Manager  │
│  [Public Internet] ──(Port 22 SSH)    ──> [ALLOWED] Remote SSH Terminal│
│  [Public Internet] ──(Port 8096 / 5432)──> [BLOCKED!] UFW Drops Packet │
└────────────────────────────────────────────────────────────────────────┘
```

> [!NOTE]
> **💡 Why This Matters**
> **Real-World Example:** If a zero-day vulnerability is discovered inside your media server web dashboard (`port 8096`), external hackers sweeping the internet for open ports will be stopped dead at your UFW firewall edge because raw port `8096` is completely blocked to the outside world. External users can only enter via secure HTTPS (`port 443`), where Nginx Proxy Manager inspects and filters the traffic.

---

## 🔒 3. Network Isolation & Sealed Database Vaults (`infra_net`)

Rather than placing all containers on a single flat Docker network where any compromised web service could scan and probe internal databases, our **Homelabbing** compose files divide traffic across isolated virtual bridge networks:

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
│ PostgreSQL, MariaDB, Redis Cache (Sealed off from the Internet)        │
└────────────────────────────────────────────────────────────────────────┘
```

### The `internal: true` Security Seal
In many of our database compose configurations, you will see our backend virtual network explicitly declare:

```yaml
networks:
  infra_net:
    driver: bridge
    internal: true
```

When `internal: true` is enabled on a Docker bridge network, Docker strips away the default network gateway. **Containers placed inside `infra_net` physically cannot initiate outbound connections to the internet, and external internet packets cannot route inside `infra_net`.**

> [!NOTE]
> **💡 Why This Matters**
> **Real-World Example:** Suppose an attacker tricks you into uploading a malicious PDF file with an embedded Remote Code Execution exploit into `Paperless-ngx`. Even if the attacker manages to run malicious code inside the `Paperless-ngx` container, when they try to exfiltrate your private PostgreSQL database across the internet to their command-and-control server, the connection drops instantly. The database lives inside `infra_net` and physically lacks a gateway to the outside world!

---

## ⚠️ 4. Why Blind Auto-Updates (`Watchtower`) Are Dangerous

Many beginner tutorials suggest running **Watchtower**—a background Docker container configured to automatically check for new container images every night, shut down running containers, and replace them with the newest `latest` tags while you sleep.

While automatic updates sound convenient, **blindly auto-updating stateful databases and complex media pipelines is extremely dangerous.**

### Why You Should Avoid Blind Auto-Updates:
1. **Breaking Database Migrations:** When a database like PostgreSQL upgrades from major version `15` to `16`, the internal data files must be migrated manually. If Watchtower pulls a new major database image overnight, the database container will crash on boot and refuse to read your old data files.
2. **API Incompatibilities:** If your `Radarr` container updates to a new major release overnight while your `qBittorrent` or `Jellyfin` containers stay on older versions, API changes can instantly break your automation pipeline.

### The Clean Solution: Deliberate, Opt-In Patch Discipline
Instead of blind automation, check your services periodically and update manually when you are ready to review logs:

```bash
# 1. Pull the newest container images cleanly
docker compose pull

# 2. Recreate containers using the fresh images
docker compose up -d

# 3. Clean up dangling old images to free up disk space
docker image prune -f
```

> [!NOTE]
> **💡 Why This Matters**
> **Real-World Example:** In 2023, an automated Watchtower update pulled a new release of a popular cloud storage application that included a breaking change to its configuration schema. Thousands of users woke up on Monday morning to corrupted cloud storage instances and broken login screens. Users who performed manual updates caught the warning in the release notes and updated cleanly without a single minute of downtime.

---

## 🔍 What Just Happened?

By understanding and applying these security fundamentals:
1. You eliminated hardcoded passwords by storing sensitive credentials securely inside local `.env` files.
2. You enabled **UFW** default-deny firewall policies so outside traffic can only enter via encrypted web ports (`80` and `443`).
3. You understood how `internal: true` Docker bridges seal off databases from the internet, and why deliberate manual updates keep your data corruption-free!

---

## 🚀 Congratulations! You Are Ready to Build

You have completed the entire **Homelabbing** core curriculum! You now understand the philosophy of self-hosting, how containers work, how to manage Linux disks and mount points, how DNS and reverse proxies route traffic cleanly, how to back up configuration state safely, and how to defend your server against threats.

It is time to put your concepts into action. Jump into our modular stacks directory and start booting up your favorite services right now!

👉 **Explore the Modular Stacks in [`stacks/`](../stacks/README.md)**
