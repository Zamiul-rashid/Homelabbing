# 🌐 Remote Access & Networking Guide (`stacks/networking/`)

Accessing your homelab from your couch via `http://192.168.x.x:8096` is great when you're at home. But what if you want to stream your music from Navidrome while commuting, or share Jellyfin with friends and family?

This directory gives you **4 distinct networking paths** depending on your needs, privacy preferences, and whether you own a domain name.

---

## 🧭 Decision Flowchart

```
Are you accessing your server from outside your home?
├── NO  ──→ Stop here! Just use http://YOUR_SERVER_IP:PORT on your local Wi-Fi.
└── YES ──→ Do you want the internet (public web) to be able to reach your server?
    ├── NO  ──→ Option D: Tailscale (Most Private / Secure VPN Mesh)
    └── YES ──→ Do you own a custom domain name (like yourname.com)?
        ├── NO  ──→ Choose a free option:
        │           ├── Option A: DuckDNS (Free dynamic DNS + Nginx Proxy Manager)
        │           └── Option B: Cloudflare + NPM (Free DNS challenge + DDoS protection)
        └── YES ──→ Option C: Custom Domain + Cloudflare (Best presentation & security)
```

---

## 📋 Summary Table of Options

| Option | Cost | Publicly Reachable? | Port Forwarding Needed? | Best For |
| :--- | :--- | :---: | :---: | :--- |
| **[Option A: DuckDNS](./option-a-duckdns/GUIDE.md)** | **Free** forever | Yes | Yes (Ports 80 & 443) | Quickest free public URL (`https://you.duckdns.org`) |
| **[Option B: Cloudflare](./option-b-cloudflare/GUIDE.md)** | **Free** (needs domain) | Yes | Optional (for web traffic only) | Automated SSL via DNS challenge & DDoS masking |
| **[Option C: Custom Domain](./option-c-custom-domain/GUIDE.md)** | ~$10/yr | Yes | Optional | Clean professional URLs (`https://media.yourdomain.com`) |
| **[Option D: Tailscale](./option-d-tailscale/GUIDE.md)** | **Free** | No (Mesh VPN) | **No** (Zero ports open) | Maximum privacy & security; private devices only |

---

## 🔒 Security Best Practices

1. **Never expose database containers** (PostgreSQL, MariaDB, Redis) to the public internet. Only expose your web reverse proxy (`nginx-proxy-manager`) on ports 80/443.
2. **Use strong passwords** for all web interfaces before making them accessible remotely.
3. **Check health status regularly** using our diagnostic checker from the repository root:
   ```bash
   ./helpers/check-health.sh
   ```
