#!/usr/bin/env node
/**
 * Enriches communes.json with calculated SEO-unique fields:
 * - distanceMarseille (km to Marseille center)
 * - densiteBornes (public chargers per 1000 inhabitants)
 * - profilCommune (textual profile)
 * - marcheImmobilier (real estate market tier)
 * - tauxMaisonLabel (housing type description)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const communesPath = resolve(__dirname, '../src/data/communes.json');
const communes = JSON.parse(readFileSync(communesPath, 'utf-8'));

// Marseille center coordinates
const MARSEILLE_LAT = 43.2964;
const MARSEILLE_LON = 5.3698;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getProfilCommune(pop) {
  if (pop >= 500000) return 'grande métropole';
  if (pop >= 100000) return 'grande métropole régionale';
  if (pop >= 30000) return 'grande ville';
  if (pop >= 15000) return 'ville moyenne';
  if (pop >= 7500) return 'commune périurbaine';
  if (pop >= 3000) return 'bourg provençal';
  return 'village provençal';
}

function getMarcheImmobilier(prixM2) {
  if (!prixM2) return 'non renseigné';
  if (prixM2 >= 5500) return 'très premium';
  if (prixM2 >= 4200) return 'haut de gamme';
  if (prixM2 >= 3200) return 'intermédiaire';
  if (prixM2 >= 2400) return 'accessible';
  return 'très accessible';
}

function getTauxMaisonLabel(pct) {
  if (pct === undefined || pct === null) return 'mixte';
  if (pct >= 80) return 'très pavillonnaire';
  if (pct >= 60) return 'majoritairement résidentiel';
  if (pct >= 40) return 'mixte pavillonnaire-collectif';
  if (pct >= 20) return 'majoritairement collectif';
  return 'très dense (collectif)';
}

let enriched = 0;
for (const c of communes) {
  // Distance to Marseille
  if (c.latitude && c.longitude) {
    c.distanceMarseille = Math.round(haversineKm(c.latitude, c.longitude, MARSEILLE_LAT, MARSEILLE_LON) * 10) / 10;
  } else {
    c.distanceMarseille = null;
  }

  // Density of public chargers per 1000 inhabitants
  if (c.bornesPubliques && c.population) {
    c.densiteBornes = Math.round((c.bornesPubliques / c.population) * 10000) / 10;
  } else {
    c.densiteBornes = null;
  }

  // Commune profile label
  c.profilCommune = getProfilCommune(c.population);

  // Real estate market tier
  c.marcheImmobilier = getMarcheImmobilier(c.prixM2Moyen);

  // Housing type label
  c.tauxMaisonLabel = getTauxMaisonLabel(c.logementsMaison);

  enriched++;
}

writeFileSync(communesPath, JSON.stringify(communes, null, 2) + '\n', 'utf-8');
console.log(`✅ Enriched ${enriched} communes with Bouches-du-Rhône SEO data fields.`);

// Print sample
const sample = communes[0];
console.log('\nSample (Marseille):');
console.log(`  distanceMarseille: ${sample.distanceMarseille} km`);
console.log(`  densiteBornes: ${sample.densiteBornes} pour 1000 hab`);
console.log(`  profilCommune: ${sample.profilCommune}`);
console.log(`  marcheImmobilier: ${sample.marcheImmobilier}`);
console.log(`  tauxMaisonLabel: ${sample.tauxMaisonLabel}`);
