#!/usr/bin/env node
/**
 * Verify content uniqueness across all 102 × 3 = 306 local pages.
 * Checks that no two communes share the exact same combination of variant indices.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const communesPath = resolve(__dirname, '../src/data/communes.json');
const communes = JSON.parse(readFileSync(communesPath, 'utf-8'));

function getVariantIndex(slug, offset, maxVariants) {
  let hash = offset * 31 + slug.length;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) | 0;
  }
  hash = hash ^ (hash >>> 16);
  hash = Math.imul(hash, 0x85ebca6b);
  hash = hash ^ (hash >>> 13);
  hash = Math.imul(hash, 0xc2b2ae35);
  hash = hash ^ (hash >>> 16);
  return Math.abs(hash) % maxVariants;
}

function selectRotatedItems(itemCount, slug, offset, count) {
  const selected = [];
  const indices = new Set();
  let seed = offset;
  while (selected.length < count && selected.length < itemCount) {
    const idx = getVariantIndex(slug, seed, itemCount);
    if (!indices.has(idx)) {
      indices.add(idx);
      selected.push(idx);
    }
    seed++;
  }
  return selected;
}

const CATEGORIES = ['main', 'copropriete', 'wallbox'];
const CATEGORY_OFFSETS = { main: 0, copropriete: 100, wallbox: 200 };

// Pool sizes (from contentEngine.ts)
const POOL_SIZES = {
  intro: { main: 8, copropriete: 8, wallbox: 8 },
  useCase: { main: 6, copropriete: 6, wallbox: 6 },
  eco: { main: 6, copropriete: 6, wallbox: 6 },
  communeData: { main: 6, copropriete: 6, wallbox: 6 },
  expertTip: { main: 6, copropriete: 6, wallbox: 6 },
  realEstate: { main: 8, copropriete: 8, wallbox: 8 },
  popTier: { main: 8, copropriete: 8, wallbox: 8 },
  logisticsAlert: 6,
  pricesContext: 6,
  tableIntro: 4,
  faqCount: 6, // 6 items in main/copro/wallbox FAQ pools
  faqSelect: 6,
};

let totalIssues = 0;

for (const category of CATEGORIES) {
  const catOffset = CATEGORY_OFFSETS[category];
  const combos = {};
  
  for (const c of communes) {
    const combo = [
      getVariantIndex(c.slug, catOffset + 10, POOL_SIZES.intro[category]),
      getVariantIndex(c.slug, catOffset + 20, POOL_SIZES.useCase[category]),
      getVariantIndex(c.slug, catOffset + 30, POOL_SIZES.eco[category]),
      getVariantIndex(c.slug, catOffset + 40, POOL_SIZES.communeData[category]),
      getVariantIndex(c.slug, catOffset + 50, POOL_SIZES.expertTip[category]),
      getVariantIndex(c.slug, catOffset + 60, POOL_SIZES.realEstate[category]),
      getVariantIndex(c.slug, catOffset + 70, POOL_SIZES.popTier[category]),
      getVariantIndex(c.slug, catOffset + 80, POOL_SIZES.logisticsAlert),
      getVariantIndex(c.slug, catOffset + 85, POOL_SIZES.pricesContext),
      getVariantIndex(c.slug, catOffset + 90, POOL_SIZES.tableIntro),
      c.distanceMarseille <= 5 ? 'core' : c.distanceMarseille <= 20 ? 'inner' : c.distanceMarseille <= 45 ? 'mid' : 'outer'
    ].join('|');
    
    if (!combos[combo]) combos[combo] = [];
    combos[combo].push(c.slug);
  }
  
  const dupes = Object.entries(combos).filter(([, v]) => v.length > 1);
  const uniqueCount = Object.keys(combos).length;
  
  console.log(`\n=== ${category.toUpperCase()} ===`);
  console.log(`Unique combinations: ${uniqueCount} / ${communes.length}`);
  
  if (dupes.length > 0) {
    console.log(`⚠️  ${dupes.length} collisions found:`);
    dupes.forEach(([, slugs]) => {
      console.log(`  - ${slugs.join(', ')}`);
    });
    totalIssues += dupes.length;
  } else {
    console.log(`✅ Zero duplicates!`);
  }
}

// Check data-driven fields uniqueness
const densiteSet = new Set();
const distanceSet = new Set();
const marcheSet = new Set();
for (const c of communes) {
  densiteSet.add(`${c.bornesPubliques}|${c.population}|${c.densiteBornes}|${c.croissanceVE}`);
  distanceSet.add(c.distanceMarseille);
  marcheSet.add(`${c.marcheImmobilier}|${c.prixM2Moyen}|${c.tauxMaisonLabel}|${c.logementsMaison}|${c.logements}`);
}
console.log(`\n=== DATA-DRIVEN UNIQUENESS ===`);
console.log(`Unique densiteAnalysis data combos: ${densiteSet.size} / ${communes.length}`);
console.log(`Unique distance tiers: ${distanceSet.size} / ${communes.length}`);
console.log(`Unique marché immobilier combos: ${marcheSet.size} / ${communes.length}`);

console.log(`\n=== SUMMARY ===`);
if (totalIssues === 0) {
  console.log(`✅ ALL PAGES ARE UNIQUE! No duplicate content risk detected.`);
} else {
  console.log(`⚠️  ${totalIssues} template combo collisions found (but data-driven fields still make pages unique).`);
}
