import React, { useState } from 'react';

interface Props {
  code: string;
  className?: string;
}

export default function CopyButton({ code, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all duration-200 border flex items-center gap-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
        copied
          ? 'bg-success/20 border-success text-success'
          : 'bg-bg-elevated hover:bg-bg border-border text-text-muted hover:text-text'
      } ${className}`}
      aria-label="Copy code to clipboard"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          <span>Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy</span>
        </>
      )}
    </button>
  );
}
