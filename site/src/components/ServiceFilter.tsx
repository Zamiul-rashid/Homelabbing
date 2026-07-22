import React, { useState } from 'react';
import type { Service } from '../data/services';

interface Props {
  services: Service[];
}

export default function ServiceFilter({ services }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'easy' | 'medium' | 'media' | 'cloud' | 'automation'>('all');

  const filteredServices = services.filter((s) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'easy') return s.difficulty === 1;
    if (activeTab === 'medium') return s.difficulty === 2;
    if (activeTab === 'media') return ['jellyfin', 'arr-stack', 'navidrome', 'kavita'].includes(s.slug);
    if (activeTab === 'cloud') return ['immich', 'nextcloud'].includes(s.slug);
    if (activeTab === 'automation') return ['home-assistant', 'adguard-home'].includes(s.slug);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-bg-surface border border-border max-w-fit shadow-md">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            activeTab === 'all'
              ? 'bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
              : 'text-text-muted hover:text-text hover:bg-bg-elevated/50'
          }`}
        >
          All Stacks ({services.length})
        </button>
        <button
          onClick={() => setActiveTab('easy')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            activeTab === 'easy'
              ? 'bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
              : 'text-text-muted hover:text-text hover:bg-bg-elevated/50'
          }`}
        >
          <span>🟢</span>
          <span>Beginner Easy</span>
        </button>
        <button
          onClick={() => setActiveTab('medium')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            activeTab === 'medium'
              ? 'bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
              : 'text-text-muted hover:text-text hover:bg-bg-elevated/50'
          }`}
        >
          <span>🟡</span>
          <span>Medium</span>
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            activeTab === 'media'
              ? 'bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
              : 'text-text-muted hover:text-text hover:bg-bg-elevated/50'
          }`}
        >
          <span>🎬</span>
          <span>Media & Books</span>
        </button>
        <button
          onClick={() => setActiveTab('cloud')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            activeTab === 'cloud'
              ? 'bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
              : 'text-text-muted hover:text-text hover:bg-bg-elevated/50'
          }`}
        >
          <span>☁️</span>
          <span>Photos & Cloud Storage</span>
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            activeTab === 'automation'
              ? 'bg-accent text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
              : 'text-text-muted hover:text-text hover:bg-bg-elevated/50'
          }`}
        >
          <span>🏠</span>
          <span>Smart Home & DNS</span>
        </button>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
        {filteredServices.map((s) => {
          const badgeClass =
            s.difficulty === 1
              ? 'badge-easy'
              : s.difficulty === 2
              ? 'badge-medium'
              : 'badge-hard';
          const diffLabel =
            s.difficulty === 1 ? '🟢 Easy' : s.difficulty === 2 ? '🟡 Medium' : '🔴 Advanced';

          return (
            <a
              key={s.slug}
              href={`/Homelabbing/services/${s.slug}`}
              className="service-card group no-underline block text-text focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-2xl"
              style={{ '--hover-accent': s.accentColor } as React.CSSProperties}
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-bg-elevated border border-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-md">
                  {s.icon}
                </div>
                <span className={badgeClass}>{diffLabel}</span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-text group-hover:text-accent transition-colors">
                  {s.name}
                </h3>
                <p className="text-xs text-text-faint font-mono mt-1">Replaces: {s.replaces}</p>
              </div>

              <p className="text-sm text-text-muted flex-grow leading-relaxed">
                {s.tagline}
              </p>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs font-mono">
                <span className="text-text-faint">Port: <strong className="text-text">{s.port}</strong></span>
                <span className="text-accent font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Setup Guide →
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
