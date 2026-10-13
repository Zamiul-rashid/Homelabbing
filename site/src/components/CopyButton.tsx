import { useState } from 'react';

interface Props {
  code: string;
  className?: string;
}

type State = 'idle' | 'copied' | 'failed';

export default function CopyButton({ code, className = '' }: Props) {
  const [state, setState] = useState<State>('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setState('copied');
    } catch {
      setState('failed');
    }
    setTimeout(() => setState('idle'), 2500);
  };

  const label = state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed, select the text instead' : 'Copy';

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
        state === 'failed'
          ? 'border-warning/50 text-warning'
          : state === 'copied'
          ? 'border-accent/60 text-accent'
          : 'border-border-strong text-text-muted hover:border-text-muted hover:text-text'
      } ${className}`}
    >
      <span aria-live="polite">{label}</span>
      <span className="sr-only">{state === 'idle' ? ' code to clipboard' : ''}</span>
    </button>
  );
}
