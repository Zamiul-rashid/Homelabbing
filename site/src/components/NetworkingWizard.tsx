import { useState, type ReactNode } from 'react';
import CopyButton from './CopyButton';

type Answer = 'yes' | 'no' | null;

interface ChoiceProps {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}

function Choice({ selected, onClick, children }: ChoiceProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-md border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
        selected
          ? 'border-accent bg-accent text-accent-ink'
          : 'border-border-strong bg-bg-elevated text-text hover:border-accent'
      }`}
    >
      {children}
    </button>
  );
}

interface QuestionProps {
  n: number;
  text: ReactNode;
  children: ReactNode;
}

function Question({ n, text, children }: QuestionProps) {
  return (
    <fieldset className={n > 1 ? 'border-t border-border pt-6' : ''}>
      <legend className="mb-3 text-[15px] font-medium leading-relaxed text-text">
        <span className="mr-2 font-mono text-text-faint">{n}.</span>
        {text}
      </legend>
      <div className="flex flex-wrap gap-3">{children}</div>
    </fieldset>
  );
}

function Result({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="rounded-md border border-accent/60 bg-bg-elevated p-5 sm:p-6">
      <p className="text-sm text-text-muted">Recommended</p>
      <h3 className="mt-1 text-xl font-semibold tracking-[-0.01em] text-text">{title}</h3>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-text-muted">{children}</div>
      {actions && <div className="mt-5 flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

const link = (href: string, label: string, primary = false) => (
  <a href={href} className={`${primary ? 'btn-primary' : 'btn-secondary'} px-4 py-2.5`}>
    {label}
  </a>
);

export default function NetworkingWizard() {
  const [remoteAccess, setRemoteAccess] = useState<Answer>(null);
  const [publicWeb, setPublicWeb] = useState<Answer>(null);
  const [hasDomain, setHasDomain] = useState<Answer>(null);

  const reset = () => {
    setRemoteAccess(null);
    setPublicWeb(null);
    setHasDomain(null);
  };

  const started = remoteAccess !== null || publicWeb !== null || hasDomain !== null;

  const renderRecommendation = () => {
    if (remoteAccess === 'no') {
      return (
        <Result title="Stay on your home network">
          <p>
            If you only watch and listen at home, you need no domain, no reverse proxy and no open ports. Open each app
            by its local address:
          </p>
          <p className="font-mono text-sm text-text">http://YOUR_SERVER_IP:PORT</p>
          <p>You can add remote access later without changing anything you set up now.</p>
        </Result>
      );
    }

    if (publicWeb === 'no') {
      const key = 'TAILSCALE_AUTH_KEY=tskey-auth-xxxxxx-xxxxxxxxxxxxxxxx';
      return (
        <Result
          title="Option D: Tailscale"
          actions={link('/Homelabbing/networking#option-d-tailscale', 'Read the Tailscale steps', true)}
        >
          <p>
            Tailscale builds an encrypted WireGuard network between your own devices. Nothing is exposed to the public
            internet and you open no ports on your router. It is free for personal use.
          </p>
          <div className="overflow-hidden rounded-md border border-border bg-bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 text-sm text-text-muted">
              <span>Add to stacks/.env</span>
              <CopyButton code={key} />
            </div>
            <pre className="m-0 overflow-x-auto p-3 font-mono text-[13px] text-text">{key}</pre>
          </div>
        </Result>
      );
    }

    if (hasDomain === 'no') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Result title="Option A: DuckDNS" actions={link('/Homelabbing/networking#option-a-duckdns', 'DuckDNS steps')}>
            <p>
              A free subdomain such as <code className="font-mono text-text">yourname.duckdns.org</code> with automatic
              Let's Encrypt certificates. It needs ports 80 and 443 forwarded on your router.
            </p>
          </Result>
          <Result
            title="Option B: Cloudflare"
            actions={link('/Homelabbing/networking#option-b-cloudflare', 'Cloudflare steps', true)}
          >
            <p>
              Certificates come from a DNS challenge, so port 80 stays closed. You need your own domain (about $10 a
              year), which also gives you nicer addresses.
            </p>
          </Result>
        </div>
      );
    }

    if (hasDomain === 'yes') {
      return (
        <Result
          title="Option C: your domain, with Cloudflare DNS"
          actions={
            <>
              {link('/Homelabbing/networking#option-b-cloudflare', 'Set up certificates', true)}
              {link('/Homelabbing/networking#option-c-custom-domain', 'Domain tips')}
            </>
          }
        >
          <p>
            Point your domain at Cloudflare DNS and use a wildcard certificate, so every app gets a clean address such as{' '}
            <code className="font-mono text-text">jellyfin.yourdomain.com</code> without opening port 80.
          </p>
        </Result>
      );
    }

    return null;
  };

  const recommendation = renderRecommendation();

  return (
    <section className="not-prose my-8 rounded-md border border-border bg-bg-surface p-5 sm:p-7" aria-labelledby="wizard-title">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 id="wizard-title" className="text-xl font-semibold tracking-[-0.01em] text-text">
            Which remote access option fits you?
          </h2>
          <p className="mt-1 text-sm text-text-muted">One to three questions. Each answer narrows the choice.</p>
        </div>
        {started && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-text-muted hover:border-text-muted hover:text-text"
          >
            Start over
          </button>
        )}
      </div>

      <div className="space-y-6">
        <Question n={1} text="Do you need your apps when you are away from home?">
          <Choice selected={remoteAccess === 'yes'} onClick={() => setRemoteAccess('yes')}>
            Yes, from anywhere
          </Choice>
          <Choice
            selected={remoteAccess === 'no'}
            onClick={() => {
              setRemoteAccess('no');
              setPublicWeb(null);
              setHasDomain(null);
            }}
          >
            No, only at home
          </Choice>
        </Question>

        {remoteAccess === 'yes' && (
          <Question n={2} text="Should people outside your own devices reach it, for example through a shared link?">
            <Choice selected={publicWeb === 'yes'} onClick={() => setPublicWeb('yes')}>
              Yes, public links over HTTPS
            </Choice>
            <Choice
              selected={publicWeb === 'no'}
              onClick={() => {
                setPublicWeb('no');
                setHasDomain(null);
              }}
            >
              No, just my own devices
            </Choice>
          </Question>
        )}

        {remoteAccess === 'yes' && publicWeb === 'yes' && (
          <Question n={3} text="Do you already own a domain name?">
            <Choice selected={hasDomain === 'yes'} onClick={() => setHasDomain('yes')}>
              Yes
            </Choice>
            <Choice selected={hasDomain === 'no'} onClick={() => setHasDomain('no')}>
              Not yet
            </Choice>
          </Question>
        )}

        <div aria-live="polite">
          {recommendation && <div className="border-t border-border pt-6">{recommendation}</div>}
        </div>
      </div>
    </section>
  );
}
