#!/usr/bin/env node
/**
 * Generate sitemap.xml for SpellyCraft
 * Run as part of the build process: npm run build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.spellycraft.com';
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'sitemap.xml');

const routes = [
  { path: '/', changefreq: 'weekly', priority: 1.0 },
  { path: '/about', changefreq: 'monthly', priority: 0.8 },
  { path: '/resources', changefreq: 'weekly', priority: 0.8 },
  { path: '/support-us', changefreq: 'monthly', priority: 0.7 },
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];
  
  const urlEntries = routes.map(({ path: routePath, changefreq, priority }) => {
    const url = `${BASE_URL}${routePath}`;
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf8');
  console.log(`✅ Sitemap generated at ${OUTPUT_PATH}`);
  console.log(`📄 Indexed ${routes.length} URLs:`);
  routes.forEach(r => console.log(`   ${BASE_URL}${r.path}`));
}

generateSitemap();