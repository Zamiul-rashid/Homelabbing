export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:       { DEFAULT: '#0a0e1a', surface: '#111827', elevated: '#1f2937' },
        accent:   { DEFAULT: '#6366f1', hover: '#4f46e5', muted: '#312e81' },
        success:  { DEFAULT: '#10b981', muted: '#064e3b' },
        warning:  { DEFAULT: '#f59e0b' },
        text:     { DEFAULT: '#f1f5f9', muted: '#94a3b8', faint: '#475569' },
        border:   { DEFAULT: '#1f2937', accent: '#6366f1' },
        terminal: { bg: '#0d1117', green: '#39d353', text: '#e6edf3' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-up':      'fadeUp 0.6s ease-out forwards',
        'fade-in':      'fadeIn 0.4s ease-out forwards',
        'typewriter':   'typewriter 0.05s steps(1) forwards',
        'blink-caret':  'blinkCaret 0.75s step-end infinite',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.5s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.2)' },
          '50%':      { boxShadow: '0 0 40px rgba(99,102,241,0.4)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        'hero-grid': `
          linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
          linear-gradient(to right, rgba(99,102,241,0.03) 1px, transparent 1px)
        `,
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
};
