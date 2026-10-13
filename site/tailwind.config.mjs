import typography from '@tailwindcss/typography';

/*
 * One palette, one accent, one radius.
 * - Dark ground with a single orange accent (a slightly softened #FF3E00).
 * - Every text colour passes WCAG AA on bg, surface and elevated.
 * - Radius: 6px (rounded-md) on every container and control, 4px on inline code.
 */
const colors = {
  bg:      { DEFAULT: '#05060A', surface: '#0B0E14', elevated: '#131821' },
  accent:  { DEFAULT: '#F65A26', hover: '#FF7040', ink: '#0A0B0F' },
  warning: { DEFAULT: '#F2B33D' },
  text:    { DEFAULT: '#E6E8EC', muted: '#9BA3AF', faint: '#7D8590' },
  border:  { DEFAULT: '#232936', strong: '#323A4A' },
};

const proseColors = (prefix) => ({
  [`--tw-prose-${prefix}body`]: colors.text.DEFAULT,
  [`--tw-prose-${prefix}headings`]: colors.text.DEFAULT,
  [`--tw-prose-${prefix}lead`]: colors.text.muted,
  [`--tw-prose-${prefix}links`]: colors.accent.DEFAULT,
  [`--tw-prose-${prefix}bold`]: colors.text.DEFAULT,
  [`--tw-prose-${prefix}counters`]: colors.text.muted,
  [`--tw-prose-${prefix}bullets`]: colors.accent.DEFAULT,
  [`--tw-prose-${prefix}hr`]: colors.border.DEFAULT,
  [`--tw-prose-${prefix}quotes`]: colors.text.DEFAULT,
  [`--tw-prose-${prefix}quote-borders`]: colors.border.strong,
  [`--tw-prose-${prefix}captions`]: colors.text.muted,
  [`--tw-prose-${prefix}code`]: colors.text.DEFAULT,
  [`--tw-prose-${prefix}pre-code`]: colors.text.DEFAULT,
  [`--tw-prose-${prefix}pre-bg`]: colors.bg.surface,
  [`--tw-prose-${prefix}th-borders`]: colors.border.strong,
  [`--tw-prose-${prefix}td-borders`]: colors.border.DEFAULT,
});

export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors,
      fontFamily: {
        sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        measure: '70ch',
      },
      typography: {
        DEFAULT: {
          css: {
            ...proseColors(''),
            ...proseColors('invert-'),
            maxWidth: '70ch',
            lineHeight: '1.7',
            a: {
              fontWeight: '500',
              textDecorationThickness: '1px',
              textUnderlineOffset: '3px',
            },
            'a:hover': { color: colors.accent.hover },
            h2: {
              fontWeight: '600',
              letterSpacing: '-0.02em',
              marginTop: '2.2em',
              marginBottom: '0.7em',
              scrollMarginTop: '6rem',
            },
            h3: {
              fontWeight: '600',
              letterSpacing: '-0.01em',
              marginTop: '1.8em',
              scrollMarginTop: '6rem',
            },
            'h2 + h3': { marginTop: '1em' },
            code: {
              fontWeight: '400',
              fontSize: '0.875em',
              backgroundColor: colors.bg.elevated,
              border: `1px solid ${colors.border.DEFAULT}`,
              borderRadius: '4px',
              padding: '0.1em 0.35em',
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            pre: {
              border: `1px solid ${colors.border.DEFAULT}`,
              borderRadius: '6px',
            },
            'pre code': {
              backgroundColor: 'transparent',
              border: '0',
              padding: '0',
            },
            hr: { marginTop: '2.5em', marginBottom: '2.5em' },
          },
        },
        lg: {
          css: {
            h2: { fontSize: '1.55em', marginTop: '2em', marginBottom: '0.7em' },
            h3: { fontSize: '1.2em' },
          },
        },
      },
    },
  },
  plugins: [typography],
};
