// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://borne-recharge-bouches-du-rhone.fr',
  output: 'static',
  adapter: cloudflare(),
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/mentions-legales') &&
        !page.includes('/politique-confidentialite') &&
        !page.includes('/confirmation'),
      changefreq: 'weekly',
      lastmod: new Date(),
      priority: 0.7,
      serialize(item) {
        // Homepage gets highest priority
        if (item.url === 'https://borne-recharge-bouches-du-rhone.fr/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        }
        // Pillar content pages (guides, tarifs, aides, solaire)
        else if (
          item.url.includes('/tarifs') ||
          item.url.includes('/aides-advenir') ||
          item.url.includes('/guide-installation') ||
          item.url.includes('/solaire-et-wallbox') ||
          item.url.includes('/zfe-marseille') ||
          item.url.includes('/devis')
        ) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // Guides hub and individual guides
        else if (item.url.includes('/guides')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        // Communes hub
        else if (item.url.includes('/communes')) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        }
        // City pages (main installateur = 0.8, copro/wallbox = 0.7)
        else if (item.url.includes('/installateur-borne-recharge-')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        }
        else if (item.url.includes('/borne-recharge-copropriete-') || item.url.includes('/wallbox-')) {
          item.priority = 0.7;
          item.changefreq = 'monthly';
        }
        return item;
      },
    }),
  ],
});
