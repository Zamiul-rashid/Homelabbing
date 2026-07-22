# 03. Your First Home Server

Ready to get your hands on real hardware? Setting up a home server does not require buying a noisy, rack-mounted enterprise server that drives up your electricity bill. In fact, some of the best home servers are compact, silent office PCs sitting right on a bookshelf.

In this guide, we will walk you through picking practical hardware on any budget, installing **Ubuntu Server**, connecting via **SSH**, keeping your system updated, and installing **Docker Engine** manually so you understand every single component.

---

## 🎯 What You'll Learn

- How to choose affordable, power-efficient hardware across three practical budget tiers.
- How to install a clean, headless **Ubuntu Server LTS** operating system.
- What **SSH** is and how to securely connect to your server remotely without a monitor or keyboard attached.
- What every initial system update command (`apt update`, `apt upgrade`) actually does.
- How to install official **Docker Engine** step-by-step with clear explanations for every package.

---

## 🖥️ Choosing Your Hardware: The Budget Guide

One of the biggest myths in self-hosting is that you need expensive enterprise hardware or custom-built gaming rigs. Because our **Homelabbing** stack runs on efficient Linux containers, a refurbished office desktop will easily outperform commercial cloud tiers!

Here are three tested hardware tiers tailored for beginners:

| Budget Tier | Hardware Recommendation | Approx. Upfront Cost | Power Consumption | Ideal Workload |
| :--- | :--- | :--- | :--- | :--- |
| **🟢 Starter / Eco Tier** | Refurbished Mini/Tiny/Micro PC (HP EliteDesk 800 G4, Dell OptiPlex 3060 Micro with Intel Core i5 8th Gen, 16 GB RAM, 256 GB NVMe SSD) | **$120 – $180** | ~15 – 25 Watts | Nextcloud, Kavita, Immich, Navidrome, Paperless, and 4K media streaming (Intel QuickSync transcode) |
| **🟡 Balanced Storage Tier** | Small Form Factor (SFF) PC or Mid-Tower (Intel Core i5/i7 10th/11th Gen, 16–32 GB RAM, 2x 8 TB hard drives) | **$300 – $450** | ~25 – 45 Watts | Full media stack (`*arr` pipeline), large NAS disk pools, and multiple simultaneous 4K streams |
| **🟣 Enthusiast Pro Tier** | Custom Mini-ITX build or Multi-Bay NAS rig (Intel Core i5 13th Gen, 32–64 GB RAM, 4x 12 TB hard drives, 2.5 GbE network card) | **$600 – $900+** | ~45 – 80 Watts | Heavy multi-user cloud storage, massive media libraries, AI vector embeddings, and local virtualization |

> [!TIP]
> **Why Intel 8th Gen or Newer?**
> If you plan to stream video with **Jellyfin**, look for Intel Core processors from the 8th Generation or newer (like `i5-8500`). These chips include **Intel QuickSync Video**, an ultra-efficient hardware media encoder that lets you transcode 4K movies smoothly while barely using any CPU power!

---

## 💿 Step 1: Installing Ubuntu Server LTS

We strongly recommend installing **Ubuntu Server 22.04 LTS** or **24.04 LTS** (Long Term Support). Unlike desktop operating systems, Ubuntu Server comes without a graphical desktop interface (GUI), which saves system memory and runs faster.

### Installation Walkthrough:
1. **Create a Bootable USB Drive:** Download the official [Ubuntu Server LTS ISO image](https://ubuntu.com/download/server) and use a free utility like [Rufus](https://rufus.ie/) or [BalenaEtcher](https://www.balena.io/etcher/) to write it to a USB flash drive.
2. **Boot Your Hardware:** Plug the USB drive into your server PC, power it on, and tap the boot menu key (usually `F12`, `F11`, or `DEL`) to select the USB drive.
3. **Select Language & Keyboard:** Follow the simple on-screen text installer.
4. **Network Configuration:** Ensure your server is connected to your home router with an **Ethernet cable** (Wi-Fi is not recommended for stable servers). The installer will automatically obtain a local IP address via DHCP. Note this IP address down (e.g., `192.168.1.100`)!
5. **Storage Layout:** Select **"Use an entire disk"** for your primary boot SSD. Leave any extra high-capacity data hard drives untouched for now—we will mount and pool them together in the next guide!
6. **Profile Setup:** Create your user account (e.g., username `ubuntu` or your first name) and choose a secure password.
7. **Enable OpenSSH Server:** When prompted, **check the box to install OpenSSH Server**. This is critical—it allows you to manage your machine remotely from your main computer.
8. **Reboot:** When installation finishes, remove the USB flash drive and reboot!

---

## 🔌 Step 2: Connecting via SSH (Secure Shell)

Once Ubuntu boots up, you can unplug the monitor and keyboard from your server! From now on, you will manage everything remotely using **SSH**.

Open your terminal application on your personal computer (macOS/Linux Terminal, or Windows PowerShell / Windows Terminal) and type:

```bash
# Replace 'ubuntu' with the username you created during installation,
# and replace '192.168.1.100' with your server's actual local IP address.
ssh ubuntu@192.168.1.100
```

When connecting for the first time, your terminal will ask if you trust the host fingerprint. Type `yes` and press Enter, then enter your user password. You are now logged directly into your home server command line!

> [!NOTE]
> **💡 Why This Matters**
> Running a **headless** server (without a monitor or graphical interface) means 100% of your machine's memory and processor power goes directly into running your applications, resulting in blazing fast speed and rock-solid stability.

---

## 📦 Step 3: Initial System Updates & Essential Packages

Before installing software, always make sure your server's package index and existing libraries are fully up to date. Run the following commands:

```bash
sudo apt update && sudo apt upgrade -y
```

### What Do These Commands Actually Do?
- `sudo` runs the command with administrative (`root`) privileges.
- `apt update` contacts official Ubuntu package repositories across the internet and downloads a fresh catalog of available software versions.
- `apt upgrade -y` compares the software currently installed on your computer against the fresh catalog and safely upgrades any outdated packages to their newest secure releases (`-y` automatically answers "yes" to confirm the updates).

Next, let's install a few foundational utility packages that we will use throughout our setup:

```bash
sudo apt install -y curl git ca-certificates gnupg lsb-release
```

### Why Do We Need Each Package?
- `curl`: A command-line tool used to securely download web files and API keys directly over HTTP/HTTPS.
- `git`: The industry-standard version control system, allowing you to clone this repository and track configuration changes cleanly.
- `ca-certificates`: Security certificates that allow your system to verify and trust encrypted SSL/TLS connections when downloading software.
- `gnupg`: Encryption tools required to securely verify the cryptographic digital signatures of software packages before installing them.
- `lsb-release`: A utility that helps software installers detect exactly which version of Linux you are running.

---

## 🐳 Step 4: Installing Official Docker Engine Step-by-Step

While many tutorials tell you to run a quick one-line script from the web to install Docker, understanding the official installation process teaches you how Linux repository management works and guarantees you get the cleanest, most secure build.

Let's install official **Docker Engine** step by step:

### 1. Add Docker's Official Cryptographic GPG Key
To ensure every Docker package you download is authentic and has not been tampered with, we create a secure directory and download Docker's official GPG verification key:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

### 2. Add the Official Docker Repository to Apt
Next, we tell your Ubuntu system where to find the official Docker software packages on the internet:

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

### 3. Update Your Catalog & Install Docker Engine
Now that Ubuntu knows about the official Docker repository, refresh your package index and install Docker Engine along with the **Docker Compose plugin**:

```bash
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### What Does Each Docker Package Do?
- `docker-ce`: **Docker Community Edition** — the core background service (daemon) that creates, runs, and monitors containers.
- `docker-ce-cli`: The command-line utility you type inside your terminal (`docker ps`, `docker logs`) to talk to the daemon.
- `containerd.io`: The industry-standard container runtime engine that manages the physical lifecycle and isolation of your containers.
- `docker-compose-plugin`: The official plugin that allows you to run `docker compose up -d` using clean YAML configuration files (`docker-compose.yml`).

### 4. Enable Docker for Your Non-Root User
By default, running Docker commands requires typing `sudo` every single time. To allow your regular user to manage containers directly without entering a root password, add your user account to the `docker` system group:

```bash
sudo usermod -aG docker $USER
```

To activate this permission immediately without rebooting, run:
```bash
newgrp docker
```

---

## ✅ Step 5: Verifying Your Installation

Let's confirm that Docker Engine is installed, healthy, and running correctly on your system:

```bash
docker version
docker compose version
```

You should see output displaying your Docker Engine version (e.g., `24.0+` or `26.0+`) and your Docker Compose plugin version (`v2.20+`).

Let's run a quick diagnostic test container to verify everything works end to end:

```bash
docker run --rm hello-world
```

---

## 🔍 What Just Happened?

When you ran `docker run --rm hello-world`:
1. Your Docker CLI contacted the local Docker daemon.
2. The daemon checked your local system and saw you didn't have the `hello-world` test image.
3. The daemon reached out across the internet to Docker Hub, verified the cryptographic signatures using your installed GPG keys, and securely downloaded the test blueprint.
4. It created a temporary container from that blueprint, ran the internal program to print a welcome message to your screen, and cleaned up (`--rm`) immediately!

---

## 🧩 What's Next?

Now that your server operating system is running smoothly with Docker Engine installed, it's time to prepare your physical storage disks so you have plenty of room for media files, backups, and cloud storage!

👉 **Proceed to [04. Storage, Disks & NAS Concepts](04-storage-and-nas.md)**
