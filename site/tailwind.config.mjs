export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:       { DEFAULT: '#04050A', surface: '#0B0E14', elevated: '#131821' },
        primary:  { DEFAULT: '#E5E7EB' },
        accent:   { DEFAULT: '#FF3E00', hover: '#FF5A26', muted: '#801F00' },
        success:  { DEFAULT: '#00E559', muted: '#005C23' },
        warning:  { DEFAULT: '#FFB800' },
        text:     { DEFAULT: '#E5E7EB', muted: '#8B949E', faint: '#4B5563' },
        border:   { DEFAULT: '#1E232E', accent: '#FF3E00' },
        terminal: { bg: '#04050A', green: '#00E559', text: '#E5E7EB' },
      },
      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        sans: ['"JetBrains Mono"', 'monospace'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'module': '0 0 0 1px #1E232E, 0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'module-active': '0 0 0 1px #FF3E00, 0 8px 24px -4px rgba(255, 62, 0, 0.3)',
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
