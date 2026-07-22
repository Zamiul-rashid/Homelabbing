import React, { useState, useEffect } from 'react';
import CopyButton from './CopyButton';

const commandText = 'git clone https://github.com/Zamiul-rashid/Homelabbing.git && cd Homelabbing/stacks/media-server && docker compose up -d';

export default function TerminalAnimation() {
  const [typed, setTyped] = useState('');
  const [step, setStep] = useState<'typing' | 'running' | 'done'>('typing');
  const [replaying, setReplaying] = useState(false);

  useEffect(() => {
    let index = 0;
    setTyped('');
    setStep('typing');
    const timer = setInterval(() => {
      if (index < commandText.length) {
        setTyped(commandText.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setStep('running');
        setTimeout(() => setStep('done'), 1200);
      }
    }, 22);
    return () => clearInterval(timer);
  }, [replaying]);

  return (
    <div className="terminal-window my-8 border border-border/80 shadow-2xl max-w-4xl mx-auto text-left">
      <div className="terminal-titlebar justify-between bg-bg-surface px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="terminal-dot bg-red-500"></span>
          <span className="terminal-dot bg-yellow-500"></span>
          <span className="terminal-dot bg-green-500"></span>
          <span className="text-xs text-text-muted font-mono ml-2">homelab@ubuntu:~</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReplaying(!replaying)}
            className="text-[11px] text-text-muted hover:text-accent font-mono px-2.5 py-1 rounded bg-bg border border-border/60 hover:border-accent flex items-center gap-1 transition-colors"
            title="Replay animation"
          >
            <span>🔄 Replay</span>
          </button>
          <CopyButton code={commandText} />
        </div>
      </div>

      <div className="p-6 bg-terminal-bg font-mono text-xs md:text-sm leading-relaxed space-y-3 min-h-[240px]">
        <div className="flex items-start gap-2 text-terminal-text">
          <span className="text-accent font-bold select-none">$</span>
          <span className="break-all">
            {typed}
            {step === 'typing' && <span className="inline-block w-2 h-4 bg-accent animate-blink-caret ml-1 align-middle"></span>}
          </span>
        </div>

        {step === 'running' && (
          <div className="text-text-muted space-y-1 pl-4 border-l-2 border-accent/40 animate-fade-in">
            <p>--&gt; Cloning repository from https://github.com/Zamiul-rashid/Homelabbing.git...</p>
            <p>--&gt; Navigating into stacks/media-server and loading compose definition...</p>
            <p>--&gt; Pulling image lscr.io/linuxserver/jellyfin:latest...</p>
            <p>--&gt; Creating container jellyfin and binding network bridge...</p>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-2 animate-fade-in">
            <div className="text-text-muted space-y-1 pl-4 border-l-2 border-accent/40">
              <p>--&gt; Cloning repository from https://github.com/Zamiul-rashid/Homelabbing.git... <span className="text-success">[OK]</span></p>
              <p>--&gt; Navigating into stacks/media-server and loading compose definition... <span className="text-success">[OK]</span></p>
              <p>--&gt; Pulling image lscr.io/linuxserver/jellyfin:latest... <span className="text-success">[OK]</span></p>
              <p>--&gt; Creating container jellyfin and binding network bridge... <span className="text-success">[OK]</span></p>
            </div>
            <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success text-xs mt-3">
              <p className="font-bold">✨ Stack Live! Open your web browser right now:</p>
              <p className="font-mono mt-1 text-text">http://YOUR_SERVER_IP:8096 (Jellyfin Welcome Wizard)</p>
            </div>
            <div className="flex items-center gap-2 text-terminal-text pt-2">
              <span className="text-accent font-bold select-none">$</span>
              <span className="inline-block w-2 h-4 bg-accent animate-blink-caret"></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
