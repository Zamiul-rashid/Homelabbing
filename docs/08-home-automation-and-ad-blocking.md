# 08. Home Automation & Ad Blocking (`stacks/home-automation/`)

Welcome to the **8th and final guide** of the Homelabbing curriculum! In our previous guides, you learned how to deploy media servers, protect data with backups, and lock down your network with firewalls. Now, we turn our attention to the physical space you live in and the network traffic flowing across every phone, computer, and smart device in your house.

In this guide, you will learn how to unify disparate smart home gadgets under one private, local roof using **Home Assistant**, and how to wipe out intrusive advertisements, tracking domains, and malware network-wide using **AdGuard Home**.

---

## 🎯 What You'll Learn

- What **Home Assistant** is, why self-hosting it beats commercial cloud hubs, and how its integration & HACS ecosystem works.
- What **AdGuard Home** is, and why network-level DNS filtering surpasses traditional browser ad extensions.
- How to configure essential ports (`8123` for Home Assistant, `53` and `3000` for AdGuard Home) safely using Docker Compose.
- How to point your home router's DHCP configuration to AdGuard Home to protect every Wi-Fi device instantly.
- How local automation and DNS filtering tie directly into your overall home server security strategy.

---

## 🏠 Home Assistant: The Local-First Smart Home Brain

### The Commercial Cloud Problem
If you own smart bulbs, plugs, thermostats, or cameras, you probably have half a dozen different manufacturer apps on your phone (e.g., Tuya, Philips Hue, TP-Link, Ecobee). Worse, most commercial smart devices rely entirely on external cloud servers: when you press a smart switch on your wall, the signal travels across the internet to a corporate data center thousands of miles away just to turn on the light right above your head. If your internet connection goes down—or if the manufacturer shuts off their cloud servers—your smart home becomes dumb overnight.

### The Home Assistant Solution
**Home Assistant** is the world's leading open-source smart home automation platform. By running Home Assistant locally on your home server inside Docker (`stacks/home-automation/`), you gain absolute sovereignty over your smart devices:

```
┌────────────────────────────────────────────────────────────────────────┐
│ The Local Home Assistant Model                                         │
│ [Smart Switch] ──(Local Wi-Fi/Zigbee)──> [Home Assistant] ──> [Light]  │
│ (Zero Cloud Delay • 100% Privacy • Works During Internet Outages)      │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Unconditional Local Control:** Automations run entirely within your home network. Lights turn on instantly with zero cloud latency, and your devices keep working even when your internet connection drops.
2. **Universal Compatibility (3,000+ Integrations):** Home Assistant bridges incompatible ecosystems. You can create automations that combine Apple HomeKit, Google Nest, Zigbee sensors, MQTT devices, and local Wi-Fi plugs in a single dashboard.
3. **The HACS (Home Assistant Community Store) Ecosystem:** Beyond official integrations, HACS lets you install thousands of community-built custom UI cards, themes, and niche hardware controllers from GitHub in just a few clicks.
4. **Zero Surveillance:** Your daily routines, occupancy schedules, and camera feeds never leave your physical house.

---

## 🛡️ AdGuard Home: Network-Wide DNS Ad Blocking

### Why Browser Extensions Are Not Enough
Most web users install browser extensions like uBlock Origin on their personal laptop. While effective inside Chrome or Firefox, browser extensions leave your other devices completely unprotected. You cannot easily install ad-blocking plugins inside smart TVs, iPhones, iPads, streaming boxes, or IoT gadgets.

### How Network-Wide DNS Blocking Works
**AdGuard Home** operates as your home server's local **DNS (Domain Name System) Resolver**. Whenever any device on your Wi-Fi attempts to open a website or load an app, it sends a DNS query (`"What is the IP address of tracking-domain.com?"`) to AdGuard Home before making the connection.

```
┌────────────────────────────────────────────────────────────────────────┐
│ How AdGuard Home Blocks Ads Across Your Entire House                   │
│                                                                        │
│ [Smart TV / Phone / PC] ────(1. DNS Query: ad.doubleclick.net)────┐    │
│                                                                   ▼    │
│ [AdGuard Home DNS Server] ──(2. Checks Blocklists) ──> [Blocked! 0.0.0.0]│
│                                                                        │
│ [Smart TV / Phone / PC] ────(3. Safe Query: jellyfin.org)─────────┐    │
│                                                                   ▼    │
│ [AdGuard Home DNS Server] ──(4. Returns Real IP) ────> [Website Loads] │
└────────────────────────────────────────────────────────────────────────┘
```

- **Universal Coverage:** By stripping out ads, spyware, and tracking telemetry at the DNS request stage (`Port 53`), AdGuard Home blocks ads before they even download—protecting every iPhone, smart TV, tablet, and PC on your network simultaneously without installing a single client app.
- **Speed & Bandwidth Savings:** Blocking unwanted ads and tracker scripts before they load makes websites open noticeably faster while conserving monthly internet bandwidth.
- **Parental Controls & Custom Filtering:** Easily toggle safe search, enforce adult content blocking, or set custom access schedules for specific family devices right from the web interface.

> [!NOTE]
> **💡 Security Synergy**
> As discussed in **[07. Security & Hardening Basics](07-security-basics.md)**, DNS filtering acts as an essential proactive defense layer. If a family member accidentally clicks a phishing link or malware domain, AdGuard Home intercepts and neutralizes the DNS lookup instantly.

---

## 🛠️ Setup Basics & First-Run Configuration

Our modular stack located in [`stacks/home-automation/`](../stacks/home-automation/README.md) deploys both containers side-by-side using Docker Compose.

### Key Port Reference
When your containers boot up, they expose the following standard ports on your server's Local Area Network (`SERVER_IP`):

| Service | Default Port | Purpose | Local URL |
| :--- | :--- | :--- | :--- |
| **Home Assistant** | `8123` (`TCP`) | Main Web Dashboard & API | `http://YOUR_SERVER_IP:8123` |
| **AdGuard Home (UI)** | `3000` (`TCP`) | First-Time Setup Wizard | `http://YOUR_SERVER_IP:3000` |
| **AdGuard Home (Admin)**| `80` (`TCP`) | Admin Web Dashboard (Post-Setup)| `http://YOUR_SERVER_IP:80` |
| **AdGuard Home (DNS)** | `53` (`TCP`/`UDP`) | Network DNS Query Port | `YOUR_SERVER_IP:53` |

### Step 1: Launching the Stack
Navigate to the stack directory and start the containers using `docker compose`:

```bash
cd /opt/homelab/stacks/home-automation
docker compose up -d
```

### Step 2: Home Assistant First-Run Onboarding
1. Open `http://YOUR_SERVER_IP:8123` in your browser (allow 1–2 minutes for initial setup on first boot).
2. Create your local admin user account, password, and home location (used for sunrise/sunset automations).
3. Home Assistant will automatically scan your local network and present discovered smart devices (such as Apple TV, Sonos, Philips Hue, or Google Cast) ready for one-click pairing!

### Step 3: AdGuard Home First-Run Setup & Router Configuration
1. Open `http://YOUR_SERVER_IP:3000` in your browser to enter the AdGuard Home Setup Wizard.
2. Under **Admin Web Interface**, set the listen port to `80` (or `8083` if port `80` is occupied by a reverse proxy). Under **DNS Server**, ensure it listens on All Interfaces (`0.0.0.0`) on Port `53`.
3. Create your administrative username and secure password, then finish the setup.

#### Pointing Your Router's DHCP to AdGuard Home
To protect your entire household automatically, you need to tell your home router to assign your server's IP address (`YOUR_SERVER_IP`) as the primary DNS server for all connected Wi-Fi devices:
1. Log into your home router's admin console (typically `192.168.1.1` or `192.168.0.1`).
2. Navigate to **LAN Settings** or **DHCP Server Configuration**.
3. Find the field labeled **Primary DNS Server** (or **DNS 1**) and replace your ISP's default DNS with your home server's static IP (`YOUR_SERVER_IP`).
4. Save settings and reboot your router (or reconnect your devices to Wi-Fi). Every device in your house is now automatically shielded by AdGuard Home!

---

## 🧩 Summary & Next Steps

With Home Assistant and AdGuard Home running, your homelab is now a comprehensive digital fortress that manages media, documents, backups, smart devices, and network filtering locally under one roof.

👉 **Ready to boot the stack? Head to [`stacks/home-automation/README.md`](../stacks/home-automation/README.md) for full compose instructions!**
👉 **Review foundational security best practices in [07. Security & Hardening Basics](07-security-basics.md).**
