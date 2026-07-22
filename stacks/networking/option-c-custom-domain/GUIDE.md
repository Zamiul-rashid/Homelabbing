# Option C: Buying and Managing a Custom Domain

> **End Result:** You own a professional domain name like `yourdomain.com` or `yourname.dev`, giving your homelab clean, memorable URLs and complete ownership of your online identity.

---

## 🛒 Where to Buy Your Domain

Not all domain registrars are created equal. Many charge low introductory prices ($1–$2) for the first year and then jack up renewals to $20–$40/year. Here is an honest comparison of the best registrars with transparent pricing:

| Registrar | Recommended For | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **[Porkbun](https://porkbun.com)** | **Best Overall Value** | Consistently lowest renewal prices (`.com` ~$10.37/yr), free WHOIS privacy, no dark patterns. | Quaint retro/pig-themed user interface. |
| **[Cloudflare Registrar](https://www.cloudflare.com/products/registrar/)** | **At-Cost Pricing** | Charges exact wholesale cost with zero markup (`.com` ~$9.77/yr), native Cloudflare DNS integration. | Requires using Cloudflare nameservers (which aligns perfectly with Option B anyway). |
| **[Namecheap](https://www.namecheap.com)** | **Reliability & Support** | Established reputation, excellent customer support, solid beginner tutorials. | Renewal rates slightly higher than Porkbun/Cloudflare after year one. |

---

## 💡 Tips When Buying a Domain

1. **Watch Out for Renewal Traps:** Check the *Renewal Price* alongside the *First Year Price* before adding to cart.
2. **Always Enable WHOIS Privacy:** All recommended registrars above include WHOIS/Domain Privacy for free. Never pay extra for this, and never register a domain without it (otherwise your personal home address and phone number will be listed in public domain directories).
3. **Choose the Right TLD (Top-Level Domain):**
   - `.com` — The universal standard (~$10/yr).
   - `.org` / `.net` — Great alternatives if your `.com` is taken (~$11/yr).
   - `.dev` / `.app` — Modern, secure (HSTS preloaded by default) (~$14/yr).
   - Avoid `.xyz`, `.top`, or `.work` if you care about deliverability/spam filtering, as they are often flagged by enterprise networks.

---

## ⏭️ Next Steps

Once you have purchased your domain:
1. Follow **[Option B: Cloudflare DNS Challenge & CDN Protection](../option-b-cloudflare/GUIDE.md)** to connect your new domain to Cloudflare's free DNS and protect your home server!
