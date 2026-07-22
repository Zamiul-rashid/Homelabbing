import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://zamiul-rashid.github.io',
  base: '/Homelabbing',
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
    sitemap(),
    mdx(),
  ],
  output: 'static',
  build: {
    assets: '_assets',
  },
});
