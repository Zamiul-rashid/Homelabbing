export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg:       { DEFAULT: '#08090A', surface: '#1C1E22', elevated: '#2A2D32' },
        primary:  { DEFAULT: '#121417' },
        accent:   { DEFAULT: '#FF5C00', hover: '#FF7A2F', muted: '#662500' },
        success:  { DEFAULT: '#00E559', muted: '#005C23' },
        warning:  { DEFAULT: '#FFB800' },
        text:     { DEFAULT: '#F0F2F5', muted: '#8A919E', faint: '#565E6D' },
        border:   { DEFAULT: '#2D313A', accent: '#FF5C00' },
        terminal: { bg: '#08090A', green: '#00E559', text: '#F0F2F5' },
      },
      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        sans: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'module': 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 6px -1px rgba(0, 0, 0, 0.5)',
        'module-active': 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px #FF5C00, 0 8px 24px -4px rgba(255, 92, 0, 0.2)',
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
