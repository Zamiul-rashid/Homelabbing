# Home Automation & Ad Blocking (`stacks/home-automation/`)

## 🎯 What You'll Have When You're Done
When you complete this guide, you will have two cornerstone privacy and automation systems running side-by-side on your home server:
1. **Home Assistant:** A local-first smart home hub running on host networking (`port 8123`) that automatically discovers and controls every smart bulb, switch, thermostat, and camera in your house without relying on cloud servers.
2. **AdGuard Home:** A network-wide DNS resolver (`port 53` & `port 8083`) that intercepts and neutralizes intrusive ads, tracking domains, and malware before they ever reach your phones, laptops, and smart TVs.

---

## 💡 What Are Home Assistant and AdGuard Home?

### Home Assistant — Your Local Smart Home Brain
If you own smart gadgets from multiple brands (e.g., Philips Hue, TP-Link, Tuya, Apple HomeKit, Google Nest), you know the pain of juggling five different manufacturer apps on your phone. Worse, most devices require constant cloud connections—meaning your wall switches stop working when the internet goes down.
**[Home Assistant](https://www.home-assistant.io/)** brings your devices home:
- **100% Local Execution:** Automations run directly within your home network with zero cloud delay.
- **Universal Bridge (3,000+ Integrations):** Connects incompatible smart ecosystems into a single unified dashboard and automation engine.
- **HACS Ecosystem:** Access thousands of custom community dashboards, themes, and hardware controllers via the Home Assistant Community Store.

### AdGuard Home — Network-Wide DNS Filtering
Most people install ad-blocking extensions like uBlock Origin inside their PC web browser. But what about ads inside smart TVs, mobile apps, streaming devices, and tablets?
**[AdGuard Home](https://adguard.com/en/adguard-home/overview.html)** protects your entire house at the **DNS (Domain Name System)** level:
- **Universal Device Coverage:** Intercepts domain lookups across every device on your Wi-Fi instantly before ads or tracking scripts can download.
- **Zero Client Software Needed:** By pointing your home router's DHCP primary DNS setting to your server's IP address (`port 53`), all household devices are shielded automatically without installing extra apps.
- **Speed & Privacy:** Eliminating tracking scripts speeds up web browsing and protects your household's behavioral privacy.

---

## 📋 Prerequisites

Before setting up this stack, make sure you have:
1. Completed **[02. Understanding Docker & Containers](../../docs/02-understanding-docker.md)** and understand how `docker compose` works.
2. Read **[08. Home Automation & Ad Blocking](../../docs/08-home-automation-and-ad-blocking.md)** for detailed conceptual background on DNS filtering and local IoT sovereignty.
3. Copied the local environment template (`cp .env.example .env`) inside this directory and configured your timezone (`TZ`).

---

## 🔧 Understanding the Compose File

Let's examine how our `docker-compose.yml` blueprint works under the hood:

```yaml
services:
  homeassistant:
    image: ghcr.io/home-assistant/home-assistant:stable
    container_name: homeassistant
    network_mode: host
    environment:
      - TZ=${TZ:-America/New_York}
    volumes:
      - ./config/homeassistant:/config
      - /etc/localtime:/etc/localtime:ro
    restart: unless-stopped

  adguardhome:
    image: adguard/adguardhome:latest
    container_name: adguardhome
    environment:
      - TZ=${TZ:-America/New_York}
    volumes:
      - ./config/adguardhome/work:/opt/adguardhome/work
      - ./config/adguardhome/conf:/opt/adguardhome/conf
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "3000:3000/tcp"
      - "8083:80/tcp"
    restart: unless-stopped
```

- **`network_mode: host` (Home Assistant):** Unlike standard containers that use bridge networks and `ports:` mappings, Home Assistant needs direct access to your physical host's network adapter (`host` mode). This allows Home Assistant to listen to local mDNS, UPnP, and Apple HomeKit broadcast packets so it can auto-discover smart devices across your home network instantly!
- **`ports: 53:53` (AdGuard Home):** Port 53 is the universal protocol port used for DNS queries. We map both `TCP` and `UDP` to ensure total compatibility across all operating systems.
- **`ports: 8083:80` (AdGuard Home Admin):** AdGuard listens internally on port `80` after setup. We map it to host port `8083` so you can access the admin dashboard at `http://YOUR_SERVER_IP:8083` without conflicting with Nginx or other web servers on port `80`.

---

## 🚀 Setting It Up Step by Step

### Step 1: Navigate to the Stack Folder
Open your SSH terminal and move into the `home-automation` stack directory:
```bash
cd /opt/homelab/stacks/home-automation
```

### Step 2: Copy the Environment Template
Create your local `.env` configuration file from our example template:
```bash
cp .env.example .env
```

### Step 3: Launch the Stack
Start both Home Assistant and AdGuard Home in detached mode so they run quietly in the background:
```bash
docker compose up -d
```

### 🔍 What Just Happened?
When you ran `docker compose up -d`:
1. Docker pulled the official `home-assistant:stable` and `adguardhome:latest` container blueprints.
2. It created `./config/homeassistant` and `./config/adguardhome` on your physical disk to store your configurations safely.
3. It attached Home Assistant to your host network (`port 8123`) and bound AdGuard Home to ports `53`, `3000`, and `8083`.

---

## ✅ Verifying It Works

Let's make sure both services booted up cleanly and are ready for configuration:

### 1. Home Assistant Onboarding
Open a browser on your computer or tablet and navigate to:
```
http://YOUR_SERVER_IP:8123
```
*(Replace `YOUR_SERVER_IP` with your server's actual local IP address, e.g., `192.168.1.100`. Allow 1–2 minutes for initial boot.)*
Follow the on-screen wizard to create your local admin user account, set your location, and review auto-discovered smart devices!

### 2. AdGuard Home Setup Wizard & Router Configuration
On first launch, open AdGuard Home's initial Setup Wizard at:
```
http://YOUR_SERVER_IP:3000
```
- Under **Admin Web Interface**, set the listen port to `80` (mapped to `8083` externally).
- Under **DNS Server**, ensure it listens on All Interfaces (`0.0.0.0`) on Port `53`.
- Create your admin username and password. Once completed, the wizard closes and your permanent admin dashboard becomes accessible at:
```
http://YOUR_SERVER_IP:8083
```

#### Protecting Your Entire Home Network via Router DHCP
To route all household DNS requests through AdGuard Home:
1. Log into your home router's admin panel (usually `192.168.1.1`).
2. Go to **LAN / DHCP Server Settings**.
3. Change the **Primary DNS Server** to your home server's IP (`YOUR_SERVER_IP`).
4. Save settings and reconnect your devices to Wi-Fi. Every device is now protected by AdGuard Home!

---

## 🧩 What's Next?
Now that your smart home is running locally and your DNS is filtered, check out our diagnostic tools and reference documentation:
- **[Helpers & Diagnostics (`helpers/`)](../../helpers/README.md):** Learn how to run automated health checks on your containers.
- **[07. Security & Hardening Basics](../../docs/07-security-basics.md):** Review UFW firewall rules to keep your ports locked down tightly.
