import React, { useState } from 'react';
import CopyButton from './CopyButton';

export default function NetworkingWizard() {
  const [remoteAccess, setRemoteAccess] = useState<string | null>(null);
  const [publicWeb, setPublicWeb] = useState<string | null>(null);
  const [hasDomain, setHasDomain] = useState<string | null>(null);

  const reset = () => {
    setRemoteAccess(null);
    setPublicWeb(null);
    setHasDomain(null);
  };

  const renderRecommendation = () => {
    if (remoteAccess === 'no') {
      return (
        <div className="p-6 rounded-xl bg-bg-surface border border-border space-y-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏠</span>
            <div>
              <h3 className="text-xl font-bold text-text">Local LAN Only (No Remote Access Needed)</h3>
              <p className="text-xs text-text-muted">You can stop right here! Your setup is simpler and more secure.</p>
            </div>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            Since you only plan to access Jellyfin or Navidrome when connected to your home Wi-Fi or Ethernet network, you do not need to configure any domain names or reverse proxies.
          </p>
          <div className="p-4 rounded-lg bg-bg border border-border font-mono text-xs text-text flex items-center justify-between">
            <span>http://YOUR_SERVER_LOCAL_IP:PORT (e.g. http://192.168.1.100:8096)</span>
            <span className="text-success font-semibold">Ready to Use</span>
          </div>
        </div>
      );
    }

    if (publicWeb === 'no') {
      return (
        <div className="p-6 rounded-xl bg-bg-surface border border-accent space-y-4 animate-fade-in shadow-[0_0_30px_rgba(99,102,241,0.15)]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔒</span>
            <div>
              <h3 className="text-xl font-bold text-text">Recommended: Option D (Tailscale Mesh VPN)</h3>
              <p className="text-xs text-accent">Maximum Privacy &bull; Zero Open Ports &bull; 100% Free</p>
            </div>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            Because you only need access on your own personal devices (phone, laptop, tablet), **Tailscale** creates an encrypted WireGuard mesh between them. Bots on the public internet cannot see or ping your home server at all!
          </p>
          <div className="p-4 rounded-lg bg-terminal-bg border border-border space-y-2">
            <div className="flex items-center justify-between text-xs text-text-faint font-mono pb-2 border-b border-border/50">
              <span>stacks/.env snippet</span>
              <CopyButton code="TAILSCALE_AUTH_KEY=tskey-auth-xxxxxx-xxxxxxxxxxxxxxxx" />
            </div>
            <pre className="text-xs font-mono text-terminal-text overflow-x-auto m-0">TAILSCALE_AUTH_KEY=tskey-auth-xxxxxx-xxxxxxxxxxxxxxxx</pre>
          </div>
          <div className="flex justify-end pt-2">
            <a href="/Homelabbing/networking#option-d-tailscale" className="btn-primary text-xs py-2 px-4">
              View Complete Tailscale Guide →
            </a>
          </div>
        </div>
      );
    }

    if (hasDomain === 'no') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          <div className="p-6 rounded-xl bg-bg-surface border border-border flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🦆</span>
                <h3 className="font-bold text-text text-lg">Option A: DuckDNS + NPM</h3>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Get a completely free dynamic subdomain like <code className="text-accent">https://myhomelab.duckdns.org</code> with automated Let's Encrypt SSL certificates.
              </p>
            </div>
            <a href="/Homelabbing/networking#option-a-duckdns" className="btn-secondary text-xs py-2 block text-center mt-2">
              DuckDNS Setup Guide →
            </a>
          </div>

          <div className="p-6 rounded-xl bg-bg-surface border border-accent flex flex-col justify-between gap-4 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <h3 className="font-bold text-text text-lg">Option B: Cloudflare + NPM</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-semibold">Recommended</span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Uses Cloudflare DNS Challenge so you never have to open Port 80 on your router! Includes DDoS protection and global CDN proxying. Note: requires buying a domain (~$10/yr).
              </p>
            </div>
            <a href="/Homelabbing/networking#option-b-cloudflare" className="btn-primary text-xs py-2 block text-center mt-2">
              Cloudflare Setup Guide →
            </a>
          </div>
        </div>
      );
    }

    if (hasDomain === 'yes') {
      return (
        <div className="p-6 rounded-xl bg-bg-surface border border-accent space-y-4 animate-fade-in shadow-[0_0_30px_rgba(99,102,241,0.15)]">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌟</span>
            <div>
              <h3 className="text-xl font-bold text-text">Recommended: Option C (Custom Domain + Cloudflare)</h3>
              <p className="text-xs text-accent">Cleanest Presentation &bull; Wildcard SSL &bull; Enterprise Protection</p>
            </div>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            Since you already own a custom domain, you can set up clean, memorable subdomains like <code className="text-accent">https://jellyfin.yourdomain.com</code> and <code className="text-accent">https://cloud.yourdomain.com</code> with automated wildcard Let's Encrypt certificates via DNS challenge.
          </p>
          <div className="flex justify-end pt-2 gap-3">
            <a href="/Homelabbing/networking#option-c-custom-domain" className="btn-secondary text-xs py-2 px-4">
              Domain Best Practices →
            </a>
            <a href="/Homelabbing/networking#option-b-cloudflare" className="btn-primary text-xs py-2 px-4">
              Configure Cloudflare SSL →
            </a>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="glass p-6 md:p-8 my-8 border border-border">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text flex items-center gap-2">
            <span>🧙‍♂️</span>
            <span>Interactive Networking Decision Wizard</span>
          </h2>
          <p className="text-xs text-text-muted mt-1">Answer 1 to 3 quick questions to find your exact setup path.</p>
        </div>
        {(remoteAccess !== null || publicWeb !== null || hasDomain !== null) && (
          <button
            onClick={reset}
            className="text-xs text-text-muted hover:text-accent font-mono underline transition-colors"
          >
            Reset Wizard
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Question 1 */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-text block">
            1. Will you need to access your server when you are away from home (outside your home Wi-Fi)?
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setRemoteAccess('yes'); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                remoteAccess === 'yes'
                  ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                  : 'bg-bg-elevated text-text-muted border-border hover:border-accent'
              }`}
            >
              Yes, I want remote access
            </button>
            <button
              onClick={() => { setRemoteAccess('no'); setPublicWeb(null); setHasDomain(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                remoteAccess === 'no'
                  ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                  : 'bg-bg-elevated text-text-muted border-border hover:border-accent'
              }`}
            >
              No, local Wi-Fi / Ethernet only
            </button>
          </div>
        </div>

        {/* Question 2 */}
        {remoteAccess === 'yes' && (
          <div className="space-y-3 animate-fade-in pt-4 border-t border-border/50">
            <label className="text-sm font-semibold text-text block">
              2. Do you want the public internet to be able to reach your server (e.g. sharing public links with friends)?
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setPublicWeb('yes'); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  publicWeb === 'yes'
                    ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-bg-elevated text-text-muted border-border hover:border-accent'
                }`}
              >
                Yes, public web reachable (with valid HTTPS SSL)
              </button>
              <button
                onClick={() => { setPublicWeb('no'); setHasDomain(null); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  publicWeb === 'no'
                    ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-bg-elevated text-text-muted border-border hover:border-accent'
                }`}
              >
                No, only my personal enrolled devices (Tailscale Mesh VPN)
              </button>
            </div>
          </div>
        )}

        {/* Question 3 */}
        {remoteAccess === 'yes' && publicWeb === 'yes' && (
          <div className="space-y-3 animate-fade-in pt-4 border-t border-border/50">
            <label className="text-sm font-semibold text-text block">
              3. Do you currently own a custom domain name (e.g. <code className="text-accent font-mono">yourdomain.com</code>)?
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setHasDomain('yes')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  hasDomain === 'yes'
                    ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-bg-elevated text-text-muted border-border hover:border-accent'
                }`}
              >
                Yes, I own a custom domain
              </button>
              <button
                onClick={() => setHasDomain('no')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  hasDomain === 'no'
                    ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-bg-elevated text-text-muted border-border hover:border-accent'
                }`}
              >
                No, I don't own one yet
              </button>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="pt-6 border-t border-border">
          {renderRecommendation()}
        </div>
      </div>
    </div>
  );
}
