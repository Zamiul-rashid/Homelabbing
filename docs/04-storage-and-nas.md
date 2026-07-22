# 04. Storage, Disks & NAS Concepts

When you begin self-hosting media streaming, photo backups, and cloud document sync, your primary boot SSD (usually 256 GB or 512 GB) will fill up quickly. To build a true home server capable of storing terabytes of files, you need to attach physical hard disk drives (HDDs) and manage them effectively.

In this guide, we will demystify Linux disk management. Instead of running blind automated scripts that partition disks without your oversight, you will learn what **mount points** are, how to format drives safely with `mkfs.ext4`, how to make mounts permanent using `/etc/fstab`, and how to pool multiple independent drives into a unified `/data` directory using **mergerfs**.

---

## 🎯 What You'll Learn

- How Linux represents physical hard disk drives (`/dev/sda`, `/dev/sdb`) compared to Windows drive letters (`C:\`, `D:\`).
- What a **mount point** is and why directories act as gateways to hardware devices.
- How to inspect attached disks using `lsblk` and format them cleanly using `fdisk` and `mkfs.ext4`.
- How to write safe, persistent mount configurations inside `/etc/fstab` so your drives automatically mount after every reboot.
- Why we use **mergerfs** to combine different sized hard drives into a single unified `/data` pool.

---

## 💡 How Linux Handles Hard Drives vs. Windows

If you come from Windows, you are used to each hard disk receiving a dedicated drive letter (`C:\` for boot, `D:\` for games, `E:\` for backups).

In Linux, **everything is a file inside a single unified directory tree.** There are no drive letters. When you plug a physical hard drive into your computer, Linux detects the hardware device and assigns it a device file inside the `/dev/` (devices) directory:
- `/dev/sda` — First physical disk attached (`a`)
- `/dev/sdb` — Second physical disk attached (`b`)
- `/dev/sdc` — Third physical disk attached (`c`)
- `/dev/nvme0n1` — High-speed NVMe M.2 Solid State Drive

If a physical disk is divided into partitions, each partition receives a number:
- `/dev/sdb1` — First partition on the second disk

```
┌────────────────────────────────────────────────────────────────────────┐
│ The Linux Directory Tree & Mount Points                                │
│                                                                        │
│  / (Root Directory on NVMe SSD /dev/nvme0n1)                           │
│  ├── /home                                                             │
│  ├── /opt/homelab                                                      │
│  └── /mnt                                                              │
│       ├── /mnt/disk1  <── [Mounted Physical HDD 1: /dev/sdb1]          │
│       └── /mnt/disk2  <── [Mounted Physical HDD 2: /dev/sdc1]          │
└────────────────────────────────────────────────────────────────────────┘
```

To access the files stored inside `/dev/sdb1`, you must **mount** that partition to an empty folder on your system (called a **mount point**). Once mounted, any file you read or write inside that folder (`/mnt/disk1`) is read or written directly to that physical hard disk!

> [!NOTE]
> **💡 Why This Matters**
> Understanding mount points is essential for Docker. When you map a container volume (`- /data/media:/movies`), Docker simply follows your Linux mount point directly down to the physical hard disk where your media files reside.

---

## 🔍 Step 1: Inspecting Your Attached Drives (`lsblk`)

Let's see what physical drives are currently connected to your machine right now. Open your terminal and run:

```bash
lsblk -o NAME,SIZE,FSTYPE,TYPE,MOUNTPOINT
```

### Example Output:
```
NAME        SIZE FSTYPE TYPE MOUNTPOINT
nvme0n1     256G        disk 
├─nvme0n1p1 512M vfat   part /boot/efi
└─nvme0n1p2 255.5G ext4 part /
sdb           8T        disk 
sdc           8T        disk 
```

Notice `nvme0n1` is our 256 GB boot SSD where Ubuntu (`/`) is installed. Notice we also have two brand new 8 Terabyte hard drives connected (`sdb` and `sdc`), but they have no filesystem (`FSTYPE`) and no mount point yet (`MOUNTPOINT`). Let's prepare them manually!

---

## 🛠️ Step 2: Partitioning & Formatting Drives (`mkfs.ext4`)

Before Linux can store files on a raw disk like `/dev/sdb`, we need to create a partition and format it using the robust **ext4** filesystem—the industry standard for Linux reliability.

> [!CAUTION]
> **Double Check Your Drive Letter!**
> Formatting wipes all data on the target drive immediately. Make absolutely certain you are formatting the blank data drive (`/dev/sdb` or `/dev/sdc`) and **NEVER** format your boot drive (`/dev/nvme0n1` or `/dev/sda` if Ubuntu boots from it). Check `lsblk` first!

### 1. Create a Clean Partition on `/dev/sdb`
We use `fdisk` to create a single large partition spanning the entire hard drive:

```bash
sudo fdisk /dev/sdb
```
Inside the `fdisk` prompt, type the following single-letter commands one by one:
1. Type `g` and press Enter to create a modern GPT disk label.
2. Type `n` and press Enter to create a new partition. Press Enter three times to accept default partition numbers and use 100% of the drive space.
3. Type `w` and press Enter to write the new partition table to disk and exit.

Run `lsblk` again—you will now see `/dev/sdb1` nested directly under `sdb`!

### 2. Format the Partition (`mkfs.ext4`)
Let's format `/dev/sdb1` with the `ext4` filesystem and give it a helpful label (`disk1`):

```bash
sudo mkfs.ext4 -L disk1 /dev/sdb1
```

*(If you have a second drive `/dev/sdc`, repeat the `fdisk` steps for `/dev/sdc` and format `/dev/sdc1` using `sudo mkfs.ext4 -L disk2 /dev/sdc1`.)*

---

## 📂 Step 3: Creating Mount Points & Making Them Permanent (`/etc/fstab`)

Now that `/dev/sdb1` is cleanly formatted, let's create the folder where it will live inside `/mnt` (`mounts`):

```bash
sudo mkdir -p /mnt/disk1
sudo mkdir -p /mnt/disk2
```

We could mount our disk temporarily right now by typing `sudo mount /dev/sdb1 /mnt/disk1`. However, if your server reboots, temporary mounts disappear! To make your disks mount automatically every single time your computer turns on, we register them inside the Linux filesystem table: `/etc/fstab`.

### Why Use UUIDs Instead of `/dev/sdb1`?
If you unplug hard drives or add new ones, the Linux kernel might re-number your drives on next reboot (turning `/dev/sdb` into `/dev/sdc`). To prevent drive confusion, we mount disks using their **UUID** (Universally Unique Identifier)—a permanent digital fingerprint assigned during formatting.

Let's find the exact UUIDs of your newly formatted partitions:

```bash
sudo blkid
```

Look for lines resembling:
```
/dev/sdb1: LABEL="disk1" UUID="e4a1b2c3-1111-2222-3333-abcdef123456" TYPE="ext4"
/dev/sdc1: LABEL="disk2" UUID="f5b2c3d4-4444-5555-6666-9876543210ab" TYPE="ext4"
```

Copy those UUID strings (`e4a1b2c3...`). Now, open `/etc/fstab` in your terminal text editor:

```bash
sudo nano /etc/fstab
```

Scroll to the very bottom of the file and append your permanent mount entries:

```fstab
# [UUID]                                  [Mount Point]   [Filesystem] [Mount Options] [Dump] [Pass]
UUID=e4a1b2c3-1111-2222-3333-abcdef123456 /mnt/disk1      ext4         defaults        0      2
UUID=f5b2c3d4-4444-5555-6666-9876543210ab /mnt/disk2      ext4         defaults        0      2
```
Save and exit (`Ctrl+O`, Enter, `Ctrl+X`).

To test and activate your new `/etc/fstab` entries right now without rebooting, run:

```bash
sudo mount -a
```
If `sudo mount -a` returns cleanly with zero errors, your drives are mounted permanently! Verify by typing `df -h` to see your massive available storage.

---

## 🧩 Step 4: Pooling Disks with `mergerfs` (The `/data` Unified Pool)

If you have two 8 TB hard drives (`/mnt/disk1` and `/mnt/disk2`), pointing half of your media containers to `disk1` and the other half to `disk2` quickly becomes tedious. What happens when `disk1` fills up?

To solve this cleanly without the complexity and risk of traditional RAID stripping, our **Homelabbing** architecture uses **`mergerfs`**.

`mergerfs` is a **union filesystem**. It takes multiple separate disk mount points (`/mnt/disk1` and `/mnt/disk2`) and transparently merges them together into a single unified master folder: `/data`.

```
┌────────────────────────────────────────────────────────────────────────┐
│ How mergerfs Unifies Your Hard Drives                                  │
│                                                                        │
│  /mnt/disk1 (8 TB HDD) ─┐                                              │
│                         ├─(mergerfs Union)─> /data (16 TB Unified Pool)│
│  /mnt/disk2 (8 TB HDD) ─┘                    ├── /data/media           │
│                                              ├── /data/torrents        │
│                                              └── /data/backups         │
└────────────────────────────────────────────────────────────────────────┘
```

### Why is `mergerfs` Better for Beginners Than Traditional RAID?
- **Mixed Drive Sizes:** You can combine an 8 TB drive, a 4 TB drive, and an old 2 TB drive together seamlessly.
- **Zero Striping Risk:** Unlike RAID 0 where losing one drive destroys every single file across all disks, `mergerfs` writes whole files cleanly to standard hard disks. If one hard drive physically fails, you only lose the specific files sitting on that exact disk—every file on the surviving disks remains 100% intact and readable on any computer!

### Setting Up Your `/data` Pool with `mergerfs`
Let's install `mergerfs` (if not already installed during system updates) and create our unified `/data` directory:

```bash
sudo apt install -y mergerfs
sudo mkdir -p /data
```

Now let's add the `mergerfs` pool definition to the very bottom of `/etc/fstab`:

```bash
sudo nano /etc/fstab
```

Append this exact pooling line at the bottom:

```fstab
# Combine /mnt/disk1 through /mnt/disk* into a single unified /data directory
/mnt/disk* /data mergerfs defaults,nonempty,allow_other,use_ino,cache.files=off,moveonenospc=true,dropcacheonclose=true,minfreespace=50G,fsname=mergerfsPool 0 0
```

Save and exit, then activate the union pool:

```bash
sudo mount -a
```

Run `df -h /data` — you will see a massive combined pool representing the sum of all your attached hard disks!

---

## 🏗️ Step 5: Creating Our Standard Directory Tree

To keep your self-hosted applications organized, let's create the standardized folder structure inside our unified `/data` pool right now. These exact folders will be referenced across our modular Docker Compose stacks:

```bash
sudo mkdir -p /data/media/movies
sudo mkdir -p /data/media/tv
sudo mkdir -p /data/media/music
sudo mkdir -p /data/media/books
sudo mkdir -p /data/media/comics
sudo mkdir -p /data/media/photos
sudo mkdir -p /data/downloads/complete
sudo mkdir -p /data/downloads/incomplete

# Set ownership to your current user ID so containers can read/write cleanly
sudo chown -R $USER:$USER /data
```

---

## 🔍 What Just Happened?

By completing these steps manually:
1. You inspected your raw physical hardware directly using `lsblk` and created clean partition tables using `fdisk`.
2. You formatted raw drives using `mkfs.ext4` and bound them permanently to `/mnt/disk1` and `/mnt/disk2` using secure UUID entries in `/etc/fstab`.
3. You configured `mergerfs` to pool your independent disks together, creating a unified `/data` folder that scales seamlessly whenever you plug in a new hard drive!

---

## 🧩 What's Next?

With your storage pool formatted, mounted, and organized, it's time to understand how networking, ports, DNS, and reverse proxies route traffic cleanly so you can access your services securely across the web!

👉 **Proceed to [05. Networking, DNS & Reverse Proxies](05-networking-concepts.md)**
