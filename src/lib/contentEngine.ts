// Programmatic Content Engine - Bouches-du-Rhône (13) - Borne de Recharge
// Generates highly unique, localized, helpful content for each commune in the 13 department.
// Uses a multi-dimensional sentence-level spintax matrix to avoid duplicate content penalties.

import { getNearbyCommunes } from './geoLinks';
import communes from '../data/communes.json';

export function spin(text: string, seed: string): string {
  let result = text;
  const spintaxTest = /{([^{}|]+\|[^{}]+)}/;
  const spintaxReplace = /{([^{}|]+\|[^{}]+)}/g;
  
  while (spintaxTest.test(result)) {
    result = result.replace(spintaxReplace, (match, choicesStr) => {
      if (['VILLE', 'CODE_POSTAL', 'PRIX_MIN', 'PRIX_MAX', 'VARIANTE_INTRO'].includes(choicesStr)) {
        return match;
      }
      const choices = choicesStr.split('|');
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
      }
      hash = hash + choicesStr.length;
      const index = Math.abs(hash) % choices.length;
      return choices[index];
    });
  }
  return result;
}

export interface Commune {
  nom: string;
  slug: string;
  codeInsee: string;
  codePostal: string;
  population: number;
  altitude?: number;
  prixM2Moyen?: number;
  logements?: number;
  logementsMaison?: number;
  vehiculesElectriques?: number;
  croissanceVE?: number;
  bornesPubliques?: number;
  intercommunalite?: string;
  canton?: string;
  latitude?: number;
  longitude?: number;
  distanceMarseille?: number;
  densiteBornes?: number;
  profilCommune?: string;
  marcheImmobilier?: string;
  tauxMaisonLabel?: string;
}

export interface ExternalLink {
  label: string;
  url: string;
  description: string;
}

export interface GuideLink {
  href: string;
  label: string;
  desc: string;
}

export interface PillarLink {
  href: string;
  label: string;
  desc: string;
}

export interface LocalContent {
  introParagraph: string;
  logisticsAlert: string;
  useCaseText: string;
  pricesContext: string;
  faqItems: { question: string; answer: string }[];
  ecoText: string;
  localContext: string;
  climateZoneLabel: string;
  localAgencyName: string;
  externalLinks: ExternalLink[];
  communeDataInsight: string;
  expertTip: string;
  tableIntro: string;
  guideLinks: GuideLink[];
  pillarLinks: PillarLink[];
  savingsEstimate: string;
  lastUpdated: string;
  realEstateInsight: string;
  populationTierContent: string;
  densiteAnalysis: string;
  marcheImmobilierInsight: string;
  distanceMarseilleContext: string;
  localRegulation: string;
  sourcesCitation: string;
}

export type ClimateZone = 'littoral-calanques' | 'interieur-provence' | 'crau-camargue';

const CATEGORY_OFFSETS: Record<string, number> = {
  main: 0,
  copropriete: 100,
  wallbox: 200
};

export function getClimateZone(codePostal: string, slug: string): ClimateZone {
  const cp = codePostal.trim();
  
  // Camargue & Crau
  if (cp.startsWith('13200') || cp.startsWith('13310') || cp.startsWith('13104') || slug === 'arles' || slug === 'saint-martin-de-crau') {
    return 'crau-camargue';
  }
  
  // Coastal calanques / marine embruns
  const coastalSlugs = new Set([
    'marseille', 'cassis', 'la-ciotat', 'carry-le-rouet', 'sausset-les-pins', 
    'martigues', 'fos-sur-mer', 'port-de-bouc', 'chateauneuf-les-martigues'
  ]);
  
  if (coastalSlugs.has(slug) || cp.startsWith('1300') || cp.startsWith('13260') || cp.startsWith('13600') || cp.startsWith('13500') || cp.startsWith('13110')) {
    return 'littoral-calanques';
  }
  
  return 'interieur-provence';
}

export function getLocalAgency(codePostal: string, slug: string): { name: string; detail: string; website: string } {
  const zone = getClimateZone(codePostal, slug);
  if (zone === 'littoral-calanques' || slug === 'aix-en-provence' || slug === 'aubagne') {
    return {
      name: "l'ALEC Métropole Aix-Marseille-Provence (Agence Locale de l'Énergie et du Climat)",
      detail: "le service d'information de la Métropole AMP pour la transition énergétique",
      website: "alec-amp.fr"
    };
  }
  return {
    name: "l'Espace Conseil France Rénov' des Bouches-du-Rhône (animé par l'ADIL 13)",
    detail: "l'Espace Conseil Info Énergie du département des Bouches-du-Rhône",
    website: "adil13.org"
  };
}

export function getVariantIndex(slug: string, offset: number, maxVariants: number): number {
  // FNV-1a inspired hash with proper offset mixing
  let hash = 2166136261; // FNV offset basis
  hash = Math.imul(hash ^ offset, 16777619);
  hash = Math.imul(hash ^ (offset >>> 16), 2654435761);
  for (let i = 0; i < slug.length; i++) {
    hash = Math.imul(hash ^ slug.charCodeAt(i), 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  return (hash >>> 0) % maxVariants;
}

export function getDynamicPrices(commune: Commune) {
  const priceFactor = commune.population > 100000 || ['cassis', 'saint-remy-de-provence', 'carry-le-rouet'].includes(commune.slug) ? 1.05 : commune.population > 30000 ? 1.01 : 0.97;
  return {
    greenUp: { min: Math.round(420 * priceFactor), max: Math.round(730 * priceFactor) },
    wallbox7kW: { min: Math.round(1280 * priceFactor), max: Math.round(1880 * priceFactor) },
    wallbox11kW: { min: Math.round(1580 * priceFactor), max: Math.round(2380 * priceFactor) },
    wallbox22kW: { min: Math.round(2150 * priceFactor), max: Math.round(3750 * priceFactor) },
    copro: { min: Math.round(2750 * priceFactor), max: Math.round(4950 * priceFactor) },
    triUpgrade: { min: Math.round(480 * priceFactor), max: Math.round(1280 * priceFactor) },
    priceFactor
  };
}

function getExternalLinks(category: string, codePostal: string, slug: string): ExternalLink[] {
  const agency = getLocalAgency(codePostal, slug);
  const agencyUrl = agency.website.startsWith('http') ? agency.website : `https://www.${agency.website}`;
  const zone = getClimateZone(codePostal, slug);
  
  const base: ExternalLink[] = [
    {
      label: "Programme ADVENIR — Subventions Bornes de Recharge",
      url: "https://advenir.mobi",
      description: "Site officiel du programme ADVENIR détaillant les primes pour les particuliers, les syndics et les entreprises."
    },
    {
      label: `${agency.name} — Service Public de Provence`,
      url: agencyUrl,
      description: "Accompagnement de proximité gratuit pour votre transition énergétique et aides financières dans le 13."
    },
    {
      label: "Annuaire des Électriciens qualifiés IRVE",
      url: "https://www.qualifelec.fr",
      description: "Vérifiez la qualification IRVE (Infrastructure de Recharge pour Véhicules Électriques) de votre électricien."
    }
  ];

  // Zone-specific institutional links
  const zoneLinks: ExternalLink[] = [];
  if (zone === 'littoral-calanques') {
    zoneLinks.push({
      label: "DREAL PACA — Réglementation environnementale Provence",
      url: "https://www.paca.developpement-durable.gouv.fr",
      description: "Direction régionale de l'environnement : normes de construction et réglementation du littoral méditerranéen."
    });
  } else if (zone === 'crau-camargue') {
    zoneLinks.push({
      label: "Parc Naturel Régional de Camargue",
      url: "https://www.parc-camargue.fr",
      description: "Informations sur la mobilité douce et la protection environnementale en zone Camargue."
    });
  } else {
    zoneLinks.push({
      label: "Conseil Départemental des Bouches-du-Rhône — Aides énergie",
      url: "https://www.departement13.fr",
      description: "Dispositifs d'aide départementaux pour la transition énergétique et les équipements résidentiels durables."
    });
  }

  // ZFE-specific link for concerned communes
  const zfeSlugs = new Set(['marseille', 'aix-en-provence', 'aubagne', 'vitrolles', 'martigues', 'la-ciotat', 'salon-de-provence', 'istres', 'gardanne', 'allauch']);
  if (zfeSlugs.has(slug)) {
    zoneLinks.push({
      label: "ZFE-m Métropole Aix-Marseille-Provence — Restrictions 2026",
      url: "https://www.zfe-m.fr",
      description: "Calendrier officiel des restrictions Crit'Air et carte du périmètre de la Zone à Faibles Émissions."
    });
  }

  if (category === 'copropriete') {
    return [
      ...base,
      {
        label: "Légifrance — Décret n° 2020-1720 (Droit à la prise)",
        url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000042740927",
        description: "Texte de loi officiel régissant le droit à la prise pour la recharge des véhicules électriques en copropriété."
      },
      {
        label: "Métropole AMP — Aides aux copropriétés",
        url: "https://ampmetropole.fr",
        description: "Dispositifs locaux de subventions pour la rénovation et l'équipement des parkings de copropriété provençaux."
      },
      ...zoneLinks
    ];
  } else if (category === 'wallbox') {
    return [
      ...base,
      {
        label: "Automobile Propre — Guide de la recharge à domicile",
        url: "https://www.automobile-propre.com",
        description: "Comparatifs indépendants, temps de charge et explications détaillées sur le fonctionnement des wallbox."
      },
      {
        label: "Data.gouv.fr — Carte des bornes publiques",
        url: "https://www.data.gouv.fr/fr/datasets/fichier-national-consolide-des-bornes-de-recharge-pour-vehicules-electriques-irve/",
        description: "Base de données nationale officielle recensant l'ensemble des points de recharge IRVE publics en France."
      },
      ...zoneLinks
    ];
  } else {
    return [
      ...base,
      {
        label: "Service-Public.fr — Crédit d'impôt Borne de recharge",
        url: "https://www.service-public.fr/particuliers/vosdroits/F35535",
        description: "Fiche officielle décrivant les conditions pour bénéficier du crédit d'impôt de 500 € en 2026."
      },
      {
        label: "Enedis — Raccordement borne de recharge",
        url: "https://www.enedis.fr/raccorder-une-borne-de-recharge-de-vehicule-electrique",
        description: "Guide du gestionnaire de réseau électrique sur les étapes de raccordement et d'augmentation de puissance."
      },
      ...zoneLinks
    ];
  }
}

// All 8 guide links pool for slug-based rotation
const ALL_GUIDE_LINKS: GuideLink[] = [
  { href: '/guides/prix-borne-recharge-bouches-du-rhone-2026/', label: 'Prix Borne Bouches-du-Rhône 2026', desc: 'Budget complet pour équiper votre maison dans le 13.' },
  { href: '/guides/wallbox-panneaux-solaires-autoconsommation-provence/', label: 'Panneaux Solaires + Wallbox', desc: 'Recharger son véhicule électrique gratuitement en autoconsommation.' },
  { href: '/guides/installateur-irve-certifie-bouches-du-rhone-qualification/', label: 'Vérifier la Qualification IRVE', desc: 'Pourquoi et comment vérifier le label de votre installateur.' },
  { href: '/guides/borne-recharge-copropriete-marseille-droit-prise/', label: 'Droit à la Prise Copro', desc: 'Comment installer votre borne en résidence collective à Marseille.' },
  { href: '/guides/aides-advenir-2026-bouches-du-rhone/', label: 'Aides Financières 13', desc: "Cumuler ADVENIR, crédit d'impôt et aides locales de la métropole AMP." },
  { href: '/guides/recharge-ve-heures-creuses-edf-provence/', label: 'Heures Creuses EDF Provence', desc: 'Différences et temps de charge selon votre contrat Enedis.' },
  { href: '/guides/comparatif-wallbox-exterieure-ip54-corrosion-soleil/', label: 'Comparatif Wallbox IP54', desc: 'Le match des meilleures marques de bornes extérieures robustes.' },
  { href: '/guides/wallbox-chaleur-provencale-protection-batterie/', label: 'Chaleur et Wallbox', desc: 'Comment protéger sa borne et sa batterie contre la chaleur provençale.' }
];

// Pillar page links pool
const PILLAR_LINKS: Record<string, PillarLink[]> = {
  main: [
    { href: '/tarifs/', label: '🧮 Tarifs Installation Borne 2026', desc: 'Consultez nos grilles tarifaires complètes par puissance et type de pose.' },
    { href: '/aides-advenir/', label: '💰 Aides ADVENIR & Crédit d\'Impôt', desc: 'Toutes les aides financières cumulables pour réduire votre facture.' },
    { href: '/guide-installation/', label: '🔧 Guide Technique d\'Installation', desc: 'Normes NF C 15-100, câblage et protections obligatoires expliqués.' },
    { href: '/solaire-et-wallbox/', label: '☀️ Solaire + Borne = Autoconsommation', desc: 'Combinez panneaux photovoltaïques et wallbox pour rouler gratuitement.' },
    { href: '/zfe-marseille/', label: '🚨 ZFE Métropole Marseille 2026', desc: 'Restrictions Crit\'Air, calendrier et aides pour les résidents du 13.' },
  ],
  copropriete: [
    { href: '/tarifs/', label: '🧮 Tarifs Copropriété & Collectif', desc: 'Coûts d\'infrastructure collective et prix par place de parking.' },
    { href: '/aides-advenir/', label: '💰 Prime ADVENIR Copropriété (50%)', desc: 'Jusqu\'à 960 € de prise en charge par le programme ADVENIR.' },
    { href: '/guide-installation/', label: '🔧 Guide Technique TGBT & Câblage', desc: 'Raccordement collectif, sous-compteur MID et normes incendie.' },
    { href: '/zfe-marseille/', label: '🚨 ZFE : Pourquoi Équiper sa Résidence', desc: 'La ZFE rend indispensable l\'infrastructure de recharge en résidence.' },
    { href: '/solaire-et-wallbox/', label: '☀️ Solaire en Copropriété', desc: 'L\'autoconsommation collective appliquée à la recharge de VE.' },
  ],
  wallbox: [
    { href: '/tarifs/', label: '🧮 Comparatif Prix Wallbox 2026', desc: 'Toutes les puissances et marques comparées, prix TTC posé.' },
    { href: '/guide-installation/', label: '🔧 Installation Wallbox : Le Guide', desc: 'Section de câble, disjoncteur, différentiel : tout savoir avant de poser.' },
    { href: '/solaire-et-wallbox/', label: '☀️ Wallbox + Panneaux Solaires', desc: 'SolarEdge, Easee : les bornes compatibles autoconsommation solaire.' },
    { href: '/aides-advenir/', label: '💰 Aides Financières Wallbox 2026', desc: 'Crédit d\'impôt 500 €, TVA 5,5% et subventions locales cumulables.' },
    { href: '/zfe-marseille/', label: '🚨 ZFE Marseille & Wallbox', desc: 'Comment la ZFE métropolitaine accélère l\'adoption de la wallbox.' },
  ]
};

// Spintax pools definition (direct, sun-drenched Provençal expert tone)
const INTRO_POOLS: Record<string, string[]> = {
  main: [
    "Pour {l'installation|la pose} de votre borne de recharge à {VILLE}, {profitez|bénéficiez} d'une pose clés en main par nos techniciens certifiés IRVE. Nous réalisons un audit de votre tableau électrique pour garantir une charge {sûre|sécurisée} avec protection solaire et délestage Linky.",
    "Besoin d'installer une borne pour votre véhicule électrique à {VILLE} ? Nos installateurs locaux des Bouches-du-Rhône vous accompagnent dans le choix d'une wallbox IP54 {adaptée|performante} et gèrent votre dossier d'aides financières ADVENIR.",
    "Sécurisez la charge de votre véhicule électrique à {VILLE} grâce à une wallbox {7.4 kW|11 kW} installée par un électricien IRVE qualifié du 13. Devis gratuit et visite technique sous {48h|deux jours} dans toute la Provence.",
    "Avec le développement de la ZFE de Marseille dans le département, équiper votre maison de {VILLE} d'une borne de recharge rapide à domicile est la solution {idéale|optimale} pour recharger à moindre coût et préserver votre batterie de la chaleur estivale.",
    "Vous habitez à {VILLE} et souhaitez passer à la vitesse supérieure pour votre voiture électrique ? Nos électriciens certifiés Qualifelec IRVE installent votre borne de recharge {à domicile|chez vous} en conformité stricte avec la norme NF C 15-100.",
    "Recharger sa voiture sur une prise domestique standard à {VILLE} est {trop lent|inefficace} et risqué. Optez pour une installation de borne murale intelligente avec Smart Charging et protocole de déconnexion automatique.",
    "Nos experts en solutions de recharge interviennent à {VILLE} pour dimensionner et poser votre wallbox. Bénéficiez des aides de l'État (TVA à 5,5% et crédit d'impôt de 500 €) avec nos {pros|artisans certifiés IRVE}.",
    "Profitez de l'expertise d'un installateur IRVE à {VILLE} pour raccorder votre wallbox intelligente. Nous configurons le délestage dynamique pour protéger l'installation de votre {villa|maison} lors des pics de consommation provençaux."
  ],
  copropriete: [
    "Vous habitez en copropriété à {VILLE} et souhaitez installer une borne de recharge ? Le droit à la prise vous garantit la possibilité d'équiper votre place de parking à vos frais, avec le soutien des aides de la Métropole d'Aix-Marseille-Provence.",
    "Installez votre borne de recharge en copropriété à {VILLE} en toute simplicité. Nos techniciens certifiés IRVE vous aident à formaliser votre demande auprès du syndic de votre résidence et à obtenir jusqu'à 960 € de subvention ADVENIR.",
    "Le droit à la prise (décret 2020) permet à tout locataire ou propriétaire d'un appartement à {VILLE} d'installer un point de recharge sur son emplacement de stationnement. Découvrez nos infrastructures collectives prêtes pour le 13.",
    "Sécurisez la recharge de votre voiture électrique dans votre résidence à {VILLE}. Nous concevons des installations individuelles ou collectives conformes aux exigences IRVE et éligibles aux primes ADVENIR 2026.",
    "Rendre votre copropriété à {VILLE} compatible avec la recharge électrique valorise l'ensemble des lots. Nos experts IRVE interviennent pour installer des bornes individuelles raccordées au TGBT des parties communes.",
    "Le raccordement d'une borne en parking partagé ou sous-sol à {VILLE} requiert une expertise spécifique. Nous réalisons l'étude technique nécessaire pour présenter un dossier solide à votre syndic de copropriété.",
    "Faites installer votre wallbox dans votre résidence de {VILLE} en bénéficiant de la prime ADVENIR copropriété qui finance jusqu'à 50% du projet d'installation électrique individuelle.",
    "Nos électriciens certifiés IRVE dans le 13 accompagnent les syndics et les copropriétaires de {VILLE} de l'étude de faisabilité technique jusqu'à la mise en service finale de la borne."
  ],
  wallbox: [
    "Optimisez la recharge de votre voiture électrique à {VILLE} en faisant installer une borne murale rapide (Wallbox) de 7.4 kW à 22 kW par nos électriciens certifiés IRVE des Bouches-du-Rhône.",
    "Besoin d'une recharge rapide et intelligente à domicile à {VILLE} ? Découvrez nos modèles de Wallbox connectées avec gestion des heures creuses et délestage de puissance en temps réel.",
    "Installez une borne de recharge performante (Wallbox) dans votre maison à {VILLE}. Nous sélectionnons les meilleures marques du marché pour vous garantir une charge sécurisée, rapide et compatible avec le climat de Provence.",
    "La Wallbox est la solution de recharge résidentielle par excellence à {VILLE}. Elle permet de recharger votre véhicule électrique jusqu'à 8 fois plus vite qu'une prise de courant standard.",
    "Faites poser votre borne Wallbox à {VILLE} par un électricien agréé IRVE pour sécuriser votre installation électrique et bénéficier des aides financières de l'État en 2026.",
    "Vous cherchez à réduire le temps de charge de votre voiture électrique à {VILLE} ? Nos installateurs partenaires vous proposent des solutions Wallbox adaptées à votre abonnement monophasé ou triphasé.",
    "Équipez votre garage de {VILLE} d'une wallbox connectée de dernière génération. Pilotez votre consommation depuis votre smartphone et programmez vos charges en fonction des heures creuses d'EDF en Provence.",
    "Profitez d'une installation soignée de votre borne Wallbox à {VILLE} par des spécialistes de la recharge électrique IRVE intervenant dans tout le département des Bouches-du-Rhône."
  ]
};

const USE_CASE_POOLS: Record<string, string[]> = {
  main: [
    "La pose d'une borne de 7.4 kW à domicile permet de recharger n'importe quel véhicule (Tesla Model Y, Peugeot e-208, Megane E-Tech, BMW i4) en récupérant environ 40 à 50 km d'autonomie par heure de charge.",
    "Pour les foyers disposant d'un abonnement électrique triphasé, l'installation d'une borne de 11 kW ou 22 kW permet de diviser par trois le temps de charge de votre batterie sans risquer de surcharger le réseau grâce au Smart Charging.",
    "Une wallbox installée dans votre garage ou sur votre place de parking à {VILLE} sécurise la charge de votre véhicule en évitant toute surchauffe des câbles grâce à des protections électriques dédiées (interrupteur différentiel de type A-EV et disjoncteur adapté).",
    "Nos techniciens IRVE recommandent l'installation de bornes de grandes marques (Schneider EVlink, Legrand Green'Up Premium, Wallbox Pulsar Plus) équipées d'un câble de type 2 pour s'adapter à l'ensemble des véhicules électriques du marché européen.",
    "Que ce soit pour une recharge quotidienne rapide après vos trajets dans la métropole provençale ou pour des recharges ponctuelles le week-end, une borne murale de 7.4 kW assure une flexibilité totale et préserve la durée de vie de votre batterie.",
    "L'installation d'une prise renforcée Green'Up (3.7 kW) peut suffire pour les véhicules hybrides rechargeables, mais pour un véhicule 100% électrique, seule une borne wallbox garantit une recharge complète en une nuit."
  ],
  copropriete: [
    "Pour faire valoir votre droit à la prise, vous devez envoyer un dossier technique détaillé au syndic de copropriété par lettre recommandée. Celui-ci dispose de 3 mois pour inscrire le point à l'ordre du jour de la prochaine AG.",
    "La solution classique consiste à raccorder votre borne de recharge individuelle au tableau général des parties communes (TGBT) de la résidence provençale, avec la pose d'un sous-compteur individuel certifié MID pour la facturation des consommations.",
    "Pour les résidences de {VILLE} comptant de nombreuses demandes, nous recommandons une infrastructure collective avec une colonne horizontale Enedis, permettant à chaque résident d'ouvrir un abonnement Linky indépendant.",
    "L'installation d'une borne en sous-sol à {VILLE} exige de respecter des normes de sécurité incendie strictes et d'utiliser du matériel robuste avec un indice de protection IK10 contre les chocs dans les espaces de manœuvre.",
    "Que vous soyez propriétaire occupant ou locataire à {VILLE}, le syndic ne peut s'opposer aux travaux d'installation d'une borne individuelle que pour un motif sérieux et légitime, comme l'existence d'un projet collectif.",
    "La mise en place d'une solution de recharge partagée ou individuelle en copropriété permet de répartir équitablement les coûts de consommation d'électricité grâce à des relevés de télé-relève automatisés ou des badges RFID."
  ],
  wallbox: [
    "Une Wallbox de 7.4 kW en monophasé est idéale pour la majorité des villas provençales à {VILLE}. Elle permet de recharger complètement une batterie de 60 kWh (type Megane E-Tech ou Tesla Model 3) en une seule nuit.",
    "Pour les propriétaires disposant d'une installation en triphasé à {VILLE}, les bornes de 11 kW ou 22 kW offrent une vitesse supérieure, chargeant votre véhicule compatible en seulement 3 à 5 heures pour une autonomie maximale.",
    "Les bornes murales sélectionnées par nos électriciens partenaires intègrent un protocole OCPP et une connectivité Bluetooth ou Wi-Fi pour planifier facilement vos sessions de charge depuis une application mobile dédiée.",
    "La pose d'une Wallbox nécessite des protections électriques obligatoires dans votre tableau de {VILLE} : un disjoncteur adapté et un interrupteur différentiel de type A-EV capable de détecter les fuites de courant continu.",
    "Certaines wallbox intelligentes comme la Wallbox Pulsar Plus ou la Legrand Green'Up intègrent un lecteur de carte RFID pour sécuriser l'accès et empêcher les personnes non autorisées de recharger leur véhicule chez vous.",
    "Une borne de recharge rapide est particulièrement recommandée si vous roulez beaucoup dans le 13 et avez besoin de récupérer rapidement de l'autonomie entre deux trajets professionnels ou personnels."
  ]
};

const ECO_POOLS: Record<string, string[]> = {
  main: [
    "En programmant la charge de votre véhicule électrique pendant les heures creuses d'Enedis dans le 13 (souvent entre 22h et 6h), vous réduisez votre facture d'électricité et divisez par 5 vos dépenses de carburant.",
    "Avec un tarif de recharge à domicile à {VILLE} estimé à moins de 2 € pour 100 km, l'amortissement de votre investissement dans une borne IRVE s'effectue en moins de 18 mois par rapport à un véhicule thermique.",
    "Le crédit d'impôt de 500 € disponible en 2026, combiné à la TVA réduite à 5,5% sur le matériel et la main d'œuvre, rend l'installation d'une borne de recharge particulièrement accessible pour les particuliers.",
    "Grâce aux fonctionnalités intelligentes des wallbox modernes, vous pouvez suivre en temps réel vos consommations et optimiser vos charges pour profiter pleinement des tarifs d'électricité les plus avantageux.",
    "Le pilotage de la charge permet également d'intégrer des panneaux solaires si vous en êtes équipé à {VILLE}, vous permettant de rouler avec une énergie 100% provençale, verte et gratuite produite directement sur votre toit.",
    "Éviter les recharges régulières sur les bornes publiques rapides (qui appliquent des tarifs élevés) en rechargeant principalement chez soi à {VILLE} permet de réaliser plus de 1 200 € d'économies annuelles."
  ],
  copropriete: [
    "Grâce au programme ADVENIR spécifique pour la copropriété, vous bénéficiez d'une aide financière couvrant 50% du montant des travaux, avec un plafond de 960 € TTC par point de recharge installé à {VILLE}.",
    "En plus de la prime ADVENIR, l'installation d'une borne en copropriété est éligible au crédit d'impôt de 500 € et à un taux de TVA réduit à 5,5%, ce qui réduit considérablement le coût restant à votre charge.",
    "Raccorder votre borne au compteur des parties communes avec un système de sous-comptage vous permet de ne payer que l'électricité que vous consommez réellement, au tarif négocié par la copropriété.",
    "La recharge en heures creuses au sein de votre résidence à {VILLE} reste de loin la solution la plus économique pour alimenter votre véhicule électrique, préservant ainsi votre budget énergie mensuel.",
    "Le financement de l'infrastructure collective de recharge peut être pris en charge par des opérateurs tiers sans frais pour la copropriété, les utilisateurs payant ensuite un abonnement individuel.",
    "Investir dans une borne en copropriété à {VILLE} permet de réaliser des économies substantielles à long terme en évitant les tarifs excessifs pratiqués sur les réseaux de recharge publics extérieurs."
  ],
  wallbox: [
    "Grâce au pilotage énergétique de votre Wallbox à {VILLE}, la charge s'active automatiquement pendant les heures creuses, vous permettant de rouler pour environ 2 € par recharge complète de votre batterie.",
    "Le crédit d'impôt national pour la pose d'une borne de recharge a été fixé à 500 € par contribuable en 2026, cumulable avec la TVA à 5,5% appliquée par votre installateur IRVE qualifié.",
    "L'installation d'une borne de recharge rapide vous évite d'utiliser régulièrement les chargeurs publics rapides de type DC, dont le coût au kWh est 3 à 4 fois plus élevé que l'électricité domestique à {VILLE}.",
    "Les bornes équipées de capteurs de puissance modulable adaptent leur vitesse de recharge en fonction des autres équipements de votre maison de {VILLE}, vous évitant de payer un abonnement Enedis plus cher.",
    "Si vous possédez une installation photovoltaïque à {VILLE}, certaines wallbox de marque SolarEdge ou Easee peuvent canaliser le surplus de production solaire directement dans la batterie de votre voiture.",
    "Investir dans une wallbox performante à domicile à {VILLE} est rapidement rentabilisé en profitant des tarifs d'électricité régulés d'Enedis et en limitant les recharges d'urgence sur autoroute."
  ]
};

const COMMUNE_DATA_POOLS: Record<string, string[]> = {
  main: [
    "Nos électriciens partenaires analysent la capacité de votre tableau de répartition principal. Souvent, dans le bâti ancien ou les mas provençaux des Bouches-du-Rhône, une mise aux normes mineure ou l'ajout d'un interrupteur différentiel adapté est requis.",
    "À {VILLE}, nous vérifions systématiquement la qualité de la prise de terre avant toute pose de borne. Une résistance de terre supérieure à 100 Ohms empêcherait le véhicule électrique de démarrer sa charge par sécurité.",
    "Le réseau électrique Enedis à {VILLE} délivre une tension stable, mais la pose d'un module de délestage est indispensable pour les abonnements de 6 kVA afin de ne pas couper le courant lors du démarrage d'appareils gourmands.",
    "L'installation électrique de votre maison doit être auditée par un professionnel IRVE. Dans le 13, de nombreux tableaux nécessitent un simple réagencement pour accueillir le disjoncteur et le différentiel dédiés à la wallbox.",
    "Nos installateurs se chargent de vérifier la puissance souscrite auprès de votre fournisseur. Si un passage de 6 à 9 kVA est nécessaire, nous vous guidons dans les démarches auprès d'Enedis Provence.",
    "Chaque installation de borne à {VILLE} respecte scrupuleusement le cahier des charges de la norme NF C 15-100, garantissant une protection optimale contre les surcharges et les courts-circuits accidentels."
  ],
  copropriete: [
    "L'installation dans les parkings collectifs du 13 nécessite l'intervention d'un électricien qualifié IRVE pour garantir la conformité avec le guide technique de l'association Promotelec et les décrets en vigueur.",
    "À {VILLE}, nous analysons le tableau général basse tension (TGBT) de votre copropriété pour déterminer la puissance disponible. Parfois, l'installation d'un gestionnaire d'énergie collectif est requise pour éviter de saturer le réseau.",
    "Le câblage dans un parking souterrain à {VILLE} doit emprunter des chemins de câbles coupe-feu spécifiques pour se conformer à la réglementation sur la sécurité incendie dans les bâtiments d'habitation.",
    "Nos installateurs coordonnent leur travail avec le syndic de votre résidence à {VILLE}. Nous fournissons un schéma d'implantation technique clair pour valider la faisabilité du raccordement électrique.",
    "Dans les résidences du 13, l'accès à la borne est sécurisé par un lecteur de badge ou une clé physique. Cela empêche toute utilisation frauduleuse de votre électricité par un autre résident.",
    "Chaque projet en copropriété à {VILLE} respecte les normes d'accessibilité PMR (Personnes à Mobilité Réduite) pour l'emplacement de la borne et la maniabilité du câble de recharge."
  ],
  wallbox: [
    "L'installation d'une wallbox à {VILLE} doit impérativement être validée par un diagnostic de votre réseau électrique intérieur afin de s'assurer de la bonne section de câble et de la présence d'une prise de terre conforme.",
    "À {VILLE}, de nombreuses installations électriques résidentielles nécessitent la pose d'un module de délestage Linky TIC pour éviter la coupure du disjoncteur général lorsque la borne fonctionne en même temps que le chauffage.",
    "Les techniciens IRVE intervenant à {VILLE} vérifient la conformité de votre tableau électrique principal. Si nécessaire, un tableau secondaire dédié à la borne de recharge sera mis en place pour garantir la sécurité.",
    "Le choix de la puissance de votre borne dépend directement de votre abonnement électrique à {VILLE}. Une borne de 7.4 kW requiert un abonnement minimum de 9 kVA (45 Ampères) pour fonctionner confortablement.",
    "Dans les zones rurales ou les collines des Bouches-du-Rhône, nos installateurs veillent à équiper les wallbox extérieures de protections renforcées contre la foudre et les surtensions électriques du réseau.",
    "Toutes les wallbox installées par nos artisans certifiés à {VILLE} respectent les directives européennes et françaises avec des connecteurs de type 2S équipés d'obturateurs de sécurité enfants."
  ]
};

const EXPERT_TIP_POOLS: Record<string, string[]> = {
  main: [
    "Conseil de pro : Privilégiez une borne équipée d'un capteur de courant qui ajuste dynamiquement la charge. C'est l'assurance d'éviter les disjonctions générales sans avoir à augmenter votre abonnement Enedis.",
    "Astuce technique : Si votre borne est installée en extérieur à {VILLE}, exigez une pose sous abri ou une borne certifiée IP55 avec obturateurs de sécurité (prises T2S) pour résister aux intempéries et à la chaleur estivale.",
    "Recommandation IRVE : Ne sous-estimez pas la section du câble d'alimentation de la borne. Pour une borne de 7.4 kW située à 15 mètres du tableau, un câble en cuivre de 10 mm² est indispensable pour éviter les pertes d'énergie.",
    "Avis de l'électricien : Optez pour une borne évolutive compatible OCPP. Cela vous permettra de la connecter facilement à des applications de recharge intelligente ou à un futur système de gestion énergétique domestique.",
    "Conseil sécurité : L'utilisation d'une prise classique pour recharger un VE présente un risque d'échauffement important. La wallbox intègre des circuits de détection de fuite de courant continu pour une protection totale.",
    "Le conseil provençal : En été dans le 13, programmez la recharge de votre VE aux heures les plus fraîches de la nuit. Cela limite la température de la batterie lors de la charge et évite un bridage de puissance automatique."
  ],
  copropriete: [
    "Conseil d'expert : N'attendez pas la tenue de l'AG pour envoyer votre dossier en recommandé. Plus vite le syndic reçoit votre demande technique rédigée par nos soins, plus vite la convention de travaux sera signée.",
    "Astuce copro : Proposez au syndic une solution de recharge collective évolutive. Même si vous êtes le premier demandeur à {VILLE}, d'autres voisins suivront et une infrastructure commune évitera de multiplier les câbles individuels.",
    "Recommandation technique : Pour les parkings extérieurs à {VILLE}, optez pour une borne sur pied robuste dotée d'un indice IK10 et d'une trappe verrouillable pour protéger la prise contre le vandalisme.",
    "Le conseil juridique : Rappelez à votre syndic que le droit à la prise est garanti par la loi. Si aucune décision n'est prise dans les 3 mois suivant la réception de votre demande, vous pouvez lancer les travaux individuellement.",
    "Avis de l'électricien : Dans le cas d'une recharge raccordée aux parties communes, assurez-vous que le sous-compteur installé est certifié MID (Mesure Instruments Directive) pour que la facturation soit juridiquement incontestable.",
    "Conseil pratique : Choisissez une borne équipée d'une connectivité Wi-Fi ou 4G pour permettre le suivi de consommation et la mise à jour à distance du micrologiciel de votre équipement de recharge."
  ],
  wallbox: [
    "Le conseil de l'artisan : Pour une borne installée à {VILLE}, choisissez un modèle doté d'une application de contrôle robuste. Cela vous permettra de suivre précisément votre historique de consommation pour votre comptabilité.",
    "Astuce technique : Si vous prévoyez d'acheter un second véhicule électrique à l'avenir, optez dès maintenant pour une borne capable de gérer la charge partagée intelligente entre deux points de charge.",
    "Recommandation IRVE : Évitez les câbles de recharge trop courts. Un câble de 5 ou 7 mètres offre un confort d'utilisation optimal, quelle que soit la position de la trappe de recharge de votre véhicule dans votre allée à {VILLE}.",
    "Conseil d'expert : Pensez à vérifier la garantie constructeur de votre wallbox. Les fabricants leaders (Hager, Schneider, Easee) proposent des extensions de garantie jusqu'à 5 ans qui sécurisent votre investissement.",
    "Avis de l'électricien : Si votre maison à {VILLE} dispose d'une installation en triphasé, préférez une borne de 22 kW bridable à 11 kW. Cela vous donne une flexibilité totale selon les capacités de charge de vos futurs véhicules.",
    "Le conseil technique : Protégez toujours votre investissement. Enroulez soigneusement le câble de charge sur un support mural dédié à {VILLE} après chaque utilisation pour éviter de l'endommager avec le temps."
  ]
};

const REAL_ESTATE_POOLS: Record<string, string[]> = {
  main: [
    "Les agences immobilières du 13 confirment qu'une maison équipée d'une borne de recharge rapide se vend plus rapidement et gagne une valeur verte immédiate estimée entre 2% et 4% sur le marché immobilier de {VILLE}.",
    "À {VILLE}, la présence d'une wallbox opérationnelle dans le garage est un argument de poids lors des visites d'acquéreurs potentiels, de plus en plus nombreux à posséder ou projeter l'achat d'un véhicule électrique.",
    "Valoriser son patrimoine immobilier passe aujourd'hui par la transition énergétique. Installer une borne IRVE de qualité valorise votre bien tout en le démarquant des autres annonces du secteur de {VILLE}.",
    "Avec l'interdiction progressive des véhicules thermiques, une place de stationnement déjà câblée pour la recharge de véhicules électriques est un équipement standard recherché par les acheteurs à {VILLE}.",
    "Selon les notaires des Bouches-du-Rhône, les biens équipés d'une borne de recharge rapide dans le secteur de {VILLE} se négocient avec une décote moindre en période de marché baissier, la valeur verte agissant comme un amortisseur de prix.",
    "Les diagnostiqueurs immobiliers à {VILLE} intègrent désormais la présence d'une borne IRVE dans l'audit énergétique du logement. C'est un critère de différenciation qui séduit une clientèle d'acheteurs CSP+ sensibilisés à la mobilité décarbonée.",
    "À {VILLE}, les programmes de lotissements neufs livrés depuis 2024 intègrent systématiquement un pré-câblage borne de recharge dans le garage. Ne pas équiper une maison existante, c'est prendre du retard sur le standard du marché local.",
    "Le marché de la location meublée à {VILLE} récompense les propriétaires-bailleurs qui proposent un point de charge privé : les loyers peuvent être majorés de 30 à 50 € par mois grâce à ce service supplémentaire, très demandé."
  ],
  copropriete: [
    "Un appartement avec place de parking câblée ou équipée d'une borne à {VILLE} voit sa valeur immobilière augmenter de façon significative. C'est un argument de vente majeur pour les acheteurs urbains des Bouches-du-Rhône.",
    "Dans les copropriétés de {VILLE}, disposer d'un équipement IRVE individuel permet de louer ou vendre sa place de parking beaucoup plus facilement et avec une plus-value estimée à plus de 2 000 €.",
    "La valeur verte des logements collectifs à {VILLE} devient un critère de choix pour les locataires et acquéreurs équipés de VE, qui écartent désormais les résidences dépourvues de solution de recharge.",
    "Équiper sa copropriété d'une infrastructure de recharge collective est un investissement qui modernise l'immeuble et préserve l'attractivité immobilière de la copropriété à {VILLE} face aux constructions neuves.",
    "Les résidences collectives de {VILLE} qui anticipent l'équipement IRVE attirent un vivier de locataires actifs roulant en VE. La demande pour des appartements avec parking équipé explose dans tout le 13.",
    "D'après les agences immobilières de {VILLE}, un lot de copropriété sans solution de recharge met en moyenne 25% de temps de plus à se vendre qu'un lot équipé ou dans un immeuble pré-câblé.",
    "Les syndics professionnels des Bouches-du-Rhône recommandent aux copropriétés de {VILLE} de voter un plan de pré-câblage global pour éviter une dépréciation collective du patrimoine immobilier face aux immeubles neufs conformes aux nouvelles réglementations.",
    "L'installation d'une borne en parking souterrain à {VILLE} est perçue par les banques comme un investissement valorisant : certaines offres de prêt immobilier vert intègrent le financement de la borne dans le prêt principal."
  ],
  wallbox: [
    "L'installation d'une wallbox de marque reconnue valorise immédiatement votre maison à {VILLE} en augmentant sa valeur verte de 3% à 5% auprès des acquéreurs de plus en plus attentifs aux équipements de recharge à domicile.",
    "Avoir une borne de recharge rapide pré-équipée dans son garage est un critère de confort haut de gamme très recherché lors des transactions immobilières dans le secteur de {VILLE}.",
    "Un logement prêt pour la mobilité électrique à {VILLE} se vend en moyenne 15 jours plus vite sur le marché local, les acheteurs appréciant de ne pas avoir à réaliser ces travaux complexes eux-mêmes.",
    "Dans le 13, les maisons disposant d'un carport ou d'un garage équipé d'une wallbox 7.4 kW se positionnent en tête des recherches immobilières des jeunes couples actifs roulant en électrique.",
    "Les diagnostiqueurs DPE du secteur de {VILLE} signalent que les acquéreurs demandent de plus en plus souvent si la maison est pré-équipée pour la recharge d'un véhicule électrique avant même de visiter le bien.",
    "Une maison avec wallbox 11 kW et abonnement triphasé à {VILLE} représente un argument décisif face à la concurrence des constructions neuves, qui intègrent systématiquement le pré-câblage IRVE.",
    "Le retour sur investissement d'une wallbox à {VILLE} ne se mesure pas uniquement en économies de carburant : la plus-value immobilière générée peut atteindre 8 000 à 12 000 € lors de la revente du bien.",
    "Les mandataires immobiliers spécialisés en biens de standing à {VILLE} incluent désormais la wallbox dans les critères de recherche premium au même titre que la piscine ou la domotique."
  ]
};

const POPULATION_TIER_POOLS: Record<string, string[]> = {
  main: [
    "Avec une population locale active et un tissu urbain en pleine mutation, {VILLE} encourage le développement des mobilités douces et de l'électromobilité. Installer sa borne privée est le moyen idéal de devancer les futures réglementations.",
    "Dans cette commune dynamique du 13, le nombre d'utilisateurs de véhicules propres augmente rapidement. Pouvoir recharger chez soi reste le moyen le plus confortable et le plus économique pour vos trajets quotidiens.",
    "Les infrastructures publiques de recharge se développent à {VILLE}, mais elles ne remplaceront jamais la sérénité et le tarif avantageux d'une recharge nocturne effectuée directement dans votre allée ou garage.",
    "En tant que commune accueillante du département des Bouches-du-Rhône, {VILLE} voit sa part de voitures électriques grandir. Nos électriciens locaux contribuent activement à cette transition en équipant les foyers de bornes fiables.",
    "Les trajets domicile-travail depuis {VILLE} vers Marseille ou Aix-en-Provence sont idéalement couverts par une recharge nocturne à domicile. Un plein électrique chaque matin sans passer par une station-service, c'est le nouveau standard.",
    "La qualité de vie à {VILLE} passe aussi par la maîtrise de ses coûts de déplacement. Une borne de recharge IRVE à domicile permet de diviser par 5 le budget carburant mensuel des foyers qui parcourent 30 à 60 km par jour.",
    "Le réseau de transports en commun provençal complète l'offre de mobilité à {VILLE}, mais pour les trajets péri-urbains et les courses du quotidien, la voiture électrique rechargée à domicile reste imbattable en souplesse et en coût.",
    "L'évolution rapide du parc automobile à {VILLE} montre que les véhicules 100% électriques dépassent désormais les hybrides dans les nouvelles immatriculations. Cette tendance confirme le besoin d'équiper les domiciles en bornes de recharge rapide."
  ],
  copropriete: [
    "Dans les zones denses de {VILLE}, où le logement collectif représente une part importante du parc immobilier, l'adaptation des copropriétés à la recharge électrique est un enjeu écologique et économique majeur.",
    "Le nombre croissant de résidents roulant en électrique à {VILLE} pousse les syndics de copropriété à moderniser les installations de stationnement pour offrir des solutions de charge partagées ou individuelles.",
    "À {VILLE}, de nombreuses résidences collectives se tournent vers nos électriciens IRVE pour déployer des infrastructures prêtes à l'emploi, anticipant ainsi la généralisation des véhicules électriques.",
    "Installer une borne dans son immeuble à {VILLE} permet de s'affranchir de la recherche quotidienne d'une borne publique disponible dans le quartier, tout en profitant du confort d'une recharge à domicile.",
    "La densité de population à {VILLE} rend les bornes publiques souvent saturées aux heures de pointe. Les copropriétaires avisés préfèrent investir dans un point de charge privatif dans leur parking pour s'assurer une disponibilité garantie.",
    "Les bailleurs sociaux du 13 commencent à équiper leurs résidences à {VILLE} en bornes de recharge partagées. Cette tendance témoigne d'un besoin massif, y compris dans les logements collectifs.",
    "Le programme local de rénovation urbaine à {VILLE} intègre désormais systématiquement le pré-câblage des parkings pour la recharge électrique, preuve que la mobilité décarbonée est au cœur de la planification urbaine.",
    "Les conseils syndicaux de {VILLE} sont de plus en plus sollicités par les copropriétaires souhaitant installer une borne. L'anticipation collective évite des travaux individuels coûteux et garantit une infrastructure cohérente et pérenne."
  ],
  wallbox: [
    "À {VILLE}, la transition vers la voiture électrique est en marche. Disposer d'une wallbox rapide à domicile est la solution la plus pratique pour recharger chaque soir et démarrer la journée avec une batterie pleine.",
    "Le développement urbain de {VILLE} s'accompagne d'une demande croissante pour des solutions de charge résidentielles rapides, portées par des électriciens locaux certifiés IRVE.",
    "Même si la ville de {VILLE} déploie de nouvelles bornes publiques, la wallbox privée reste l'équipement indispensable pour recharger au meilleur tarif sans contrainte de temps ni d'attente.",
    "En choisissant d'installer une borne rapide chez vous à {VILLE}, vous rejoignez les nombreux foyers du 13 qui ont fait le choix d'une mobilité simplifiée et économique au quotidien.",
    "Les résidents de {VILLE} qui optent pour une wallbox témoignent d'un gain de confort majeur : finies les files d'attente sur les superchargeurs en zone commerciale pour quelques dizaines de kilomètres d'autonomie.",
    "L'engouement pour les véhicules électriques à {VILLE} dépasse la simple tendance écologique. C'est un choix économique rationnel quand on dispose d'une wallbox 7.4 kW alimentée en heures creuses à tarif régulé.",
    "Les familles de {VILLE} avec deux véhicules constatent qu'une seule wallbox 7.4 kW suffit pour couvrir les besoins de recharge de deux voitures, à condition de programmer les charges en alternance via l'application mobile.",
    "La généralisation du télétravail à {VILLE} renforce l'intérêt de la wallbox domestique : le véhicule est garé plus longtemps à domicile, ce qui permet une recharge complète même en heures creuses de 6 heures."
  ]
};

// FAQ Pools
const FAQ_POOLS: Record<string, { question: string; answer: string }[]> = {
  main: [
    {
      question: "Faut-il modifier mon compteur Enedis pour une installation de borne à {VILLE} ?",
      answer: "Si vous optez pour une borne de 7.4 kW en monophasé, un abonnement de 9 kVA (45 A) est généralement recommandé. Pour une borne de 11 kW ou 22 kW en triphasé, il est nécessaire de demander à Enedis Provence de modifier votre raccordement pour passer en triphasé."
    },
    {
      question: "Quel est le tarif moyen d'un électricien IRVE pour poser une borne à {VILLE} ?",
      answer: "Le coût moyen oscille entre 1 300 € et 1 900 € TTC avant déduction des aides financières. Ce tarif comprend la fourniture de la wallbox, le disjoncteur différentiel adapté, le câblage et la mise en service réglementaire."
    },
    {
      question: "Existe-t-il des subventions locales ou métropolitaines dans les Bouches-du-Rhône ?",
      answer: "En plus du crédit d'impôt national de 500 € et de la TVA réduite à 5,5%, la Métropole d'Aix-Marseille-Provence propose des aides complémentaires pour la transition énergétique en copropriété ou pour les résidents de la ZFE de Marseille."
    },
    {
      question: "Combien de temps durent les travaux de pose d'une borne à {VILLE} ?",
      answer: "Dans la grande majorité des cas, l'installation d'une borne de recharge dans une maison individuelle à {VILLE} prend entre une demi-journée et une journée complète, selon la distance entre le tableau électrique et l'emplacement de la borne."
    },
    {
      question: "Quelle est la différence entre une prise Green'Up et une borne Wallbox ?",
      answer: "La prise Green'Up charge à 3.7 kW (environ 15-20 km d'autonomie par heure), tandis qu'une wallbox classique charge à 7.4 kW ou plus (jusqu'à 50 km par heure). La wallbox est donc deux fois plus rapide et intègre des fonctions de pilotage intelligent."
    },
    {
      question: "Puis-je installer ma borne moi-même pour économiser sur la main d'œuvre ?",
      answer: "Non, la loi française impose que toute borne d'une puissance supérieure à 3.7 kW soit installée par un professionnel certifié IRVE. C'est également une condition sine qua non pour bénéficier du crédit d'impôt et des assurances en cas de sinistre."
    }
  ],
  copropriete: [
    {
      question: "Qu'est-ce que le droit à la prise en copropriété à {VILLE} ?",
      answer: "Le droit à la prise est un cadre juridique qui permet à tout propriétaire, locataire ou occupant d'un parking en copropriété d'installer une borne de recharge à ses propres frais. Le syndic ne peut pas s'y opposer sans motif sérieux et légitime (décision de travaux collectifs dans les 3 mois, etc.)."
    },
    {
      question: "Quel est le montant des aides ADVENIR en copropriété à {VILLE} ?",
      answer: "La prime ADVENIR finance 50% du coût de fourniture et de pose de la borne individuelle raccordée au réseau collectif de la copropriété, avec un plafond maximal fixé à 960 € TTC par place équipée en 2026."
    },
    {
      question: "Comment facturer l'électricité consommée par ma borne en copropriété ?",
      answer: "Soit la borne est raccordée à un compteur Linky individuel lié à votre propre contrat, soit elle est connectée au tableau des parties communes avec un sous-compteur MID. Dans ce dernier cas, un opérateur ou un syndic facture les kWh réels d'après des relevés automatisés."
    },
    {
      question: "Combien de temps faut-il pour instruire un projet en copropriété à {VILLE} ?",
      answer: "Entre la réalisation de notre étude technique, l'envoi de la demande en recommandé au syndic, la signature de la convention de travaux (qui ne requiert pas de vote en AG pour les installations individuelles) et la pose effective, le délai moyen est de 3 à 6 mois."
    }
  ],
  wallbox: [
    {
      question: "Quelle puissance de Wallbox choisir pour ma villa à {VILLE} ?",
      answer: "Pour une villa standard avec abonnement monophasé, la wallbox 7.4 kW (32A) est le choix optimal. Elle permet de récupérer 300 km d'autonomie en 6-8 heures de nuit. Les puissances de 11 et 22 kW nécessitent un compteur triphasé et sont idéales pour les grands rouleurs."
    },
    {
      question: "Une Wallbox extérieure peut-elle résister au soleil de Provence et au Mistral ?",
      answer: "Oui, à condition de choisir une borne certifiée IP54 ou IP65 et IK08 (résistance aux chocs). Il est également fortement conseillé d'installer un petit auvent de protection pour éviter que la borne ne surchauffe en plein après-midi d'été."
    },
    {
      question: "La Wallbox est-elle compatible avec toutes les voitures électriques à {VILLE} ?",
      answer: "Toutes les wallbox installées par nos techniciens qualifiés sont équipées d'une prise normalisée de Type 2S, qui est le standard européen obligatoire. Elles sont donc compatibles avec 100% des véhicules rechargeables (Tesla, Renault, Peugeot, Hyundai, etc.)."
    },
    {
      question: "Peut-on bloquer l'accès à une Wallbox installée en extérieur à {VILLE} ?",
      answer: "Oui, la plupart des modèles récents intègrent des lecteurs de badge RFID (la charge ne démarre que si vous passez votre badge) ou un verrouillage via smartphone (Bluetooth/Wi-Fi) pour empêcher tout vol d'électricité par des tiers."
    }
  ]
};

// Rotated item selection helper
function selectRotatedItems<T>(items: T[], slug: string, offset: number, count: number): T[] {
  const selected: T[] = [];
  const indices = new Set<number>();
  let seed = offset;
  while (selected.length < count && selected.length < items.length) {
    const idx = getVariantIndex(slug, seed, items.length);
    if (!indices.has(idx)) {
      indices.add(idx);
      selected.push(items[idx]);
    }
    seed++;
  }
  return selected;
}

export function generateCommuneContent(
  commune: Commune,
  category: 'main' | 'copropriete' | 'wallbox'
): LocalContent {
  const resolvedCategory = category;
  const climateZone = getClimateZone(commune.codePostal, commune.slug);
  const agency = getLocalAgency(commune.codePostal, commune.slug);
  const catOffset = CATEGORY_OFFSETS[category] || 0;
  
  const zoneLabels = {
    'littoral-calanques': "Zone Littorale & Calanques (Humidité/Salinité)",
    'interieur-provence': "Provence Intérieure (Chaleur estivale 40°C+)",
    'crau-camargue': "Plaine de la Crau & Camargue (Mistral/Poussière)"
  };

  const patrimoineAnecdotes = {
    'littoral-calanques': [
      `Le saviez-vous ? Dans le secteur de ${commune.nom}, à proximité immédiate du Vieux-Port ou des falaises de Cassis, l'air marin chargé de sel accélère l'oxydation des métaux. Il est crucial d'opter pour une borne de recharge extérieure certifiée IP54 avec un boîtier traité anti-UV pour résister aux embruns de la mer Méditerranée.`,
      `De la Corniche Kennedy de Marseille aux calanques de La Ciotat, ${commune.nom} vit au rythme de la mer. C'est dans ce cadre exceptionnel que la transition vers les véhicules électriques s'accélère, encouragée par les aides locales de la métropole AMP et par la volonté de préserver nos espaces naturels protégés.`,
      `La Métropole Aix-Marseille-Provence investit massivement dans les solutions de mobilité propre autour de ${commune.nom}. Installer une borne de recharge individuelle s'inscrit pleinement dans le cadre du plan métropolitain d'équipement en infrastructures de recharge pour véhicules électriques.`,
      `${commune.nom} offre une proximité immédiate avec les plages et les calanques, mais pour les trajets quotidiens, disposer d'une borne de recharge privée à domicile est la solution de confort absolue pour éviter l'attente sur les chargeurs publics souvent occupés pendant la saison touristique.`
    ],
    'interieur-provence': [
      `Le climat de ${commune.nom}, typique de l'arrière-pays provençal au pied de la Sainte-Victoire ou du Luberon, est marqué par des étés très chauds dépassant régulièrement les 40°C. Pour installer votre wallbox en extérieur, nos techniciens préconisent une ombrière de protection ou une borne équipée d'une sonde de température interne pour éviter le bridage thermique de charge.`,
      `À ${commune.nom}, les mas et bastides traditionnels provençaux marient le charme de la pierre de Rognes aux technologies modernes. Raccorder une wallbox au tableau d'une bâtisse ancienne exige un savoir-faire spécifique pour faire passer les câbles discrètement tout en respectant les normes NF C 15-100.`,
      `Le pays d'Aix et les collines de l'Étoile entourant ${commune.nom} offrent des routes splendides mais sinueuses. C'est un terrain de jeu idéal pour les voitures électriques, dont la récupération d'énergie au freinage dans les descentes prolonge l'autonomie, complétant parfaitement la recharge nocturne effectuée sur votre borne privée.`,
      `Pour les déplacements quotidiens depuis ${commune.nom} vers les zones d'activités des Milles à Aix ou d'Aubagne, recharger son véhicule chaque soir à domicile représente la solution la plus économique et la plus fiable pour les navetteurs du département 13.`
    ],
    'crau-camargue': [
      `Le Mistral souffle fort sur la plaine de la Crau et la Camargue à proximité de ${commune.nom}. Ce vent violent transporte de la poussière fine et du sable qui s'infiltrent partout : seule l'installation d'une borne étanche avec clapets de protection (indice IP54 minimum et prise T2S obturée) garantit la pérennité du système.`,
      `À ${commune.nom}, dans ce paysage sauvage bordé de rizières et de manades, les distances routières sont souvent importantes. Disposer de sa propre borne rapide à domicile est indispensable pour recharger rapidement entre deux allers-retours vers Arles, Nîmes ou Marseille sans redouter la panne d'autonomie.`,
      `Les communes de Camargue comme ${commune.nom} bénéficient d'un excellent ensoleillement propice à l'autoconsommation. Associer une borne de recharge intelligente à des panneaux solaires permet aux propriétaires du secteur de recharger leur voiture avec une énergie 100% gratuite et locale.`,
      `Le réseau de bornes de recharge publiques restant limité en Camargue, la pose d'une borne à domicile à ${commune.nom} est le choix logique des propriétaires de voitures électriques pour sécuriser leurs déplacements quotidiens.`
    ]
  };

  const localIntroPools = [
    `Pour les propriétaires de ${commune.nom} (${commune.codePostal}), disposer d'un point de recharge rapide à domicile est devenu indispensable. Avec une population de ${commune.population?.toLocaleString('fr-FR')} habitants et un parc immobilier composé à ${commune.logementsMaison}% de maisons individuelles, la configuration locale est idéale pour la pose d'une wallbox 7.4 kW ou 22 kW dans un garage ou une allée de villa.`,
    `Faire installer une borne de recharge de voiture électrique à ${commune.nom} par un électricien agréé IRVE permet de bénéficier de garanties uniques. Dans les Bouches-du-Rhône, où la ZFE de Marseille pousse à l'électrification rapide, la recharge rapide protège la longévité de votre batterie.`,
    `${commune.nom} est une ${commune.profilCommune || 'commune'} du 13 où le marché immobilier est qualifié de ${commune.marcheImmobilier || 'intermédiaire'}. Les ${commune.logements?.toLocaleString('fr-FR') || 'nombreux'} logements du parc local, dont ${commune.logementsMaison}% de maisons individuelles, offrent un potentiel considérable pour l'installation de bornes de recharge privées.`,
    `Avec ${commune.vehiculesElectriques?.toLocaleString('fr-FR') || 'un nombre croissant de'} véhicules électriques estimés en circulation à ${commune.nom} et une croissance annuelle de ${commune.croissanceVE || 25}%, la demande d'installation de bornes de recharge résidentielles ne cesse d'augmenter dans cette commune provençale.`,
    `Située à ${commune.distanceMarseille || 'proximité de'} km de Marseille, ${commune.nom} offre un cadre de vie ${commune.tauxMaisonLabel || 'résidentiel'} avec un prix immobilier moyen de ${commune.prixM2Moyen?.toLocaleString('fr-FR') || '3 500'} €/m². Équiper sa résidence d'une borne de recharge IRVE est un investissement qui renforce la valeur de votre bien.`,
    `La commune de ${commune.nom}, rattachée à ${commune.intercommunalite || 'la Métropole AMP'}, compte environ ${commune.bornesPubliques || 'quelques'} bornes publiques de recharge pour une densité de ${commune.densiteBornes || 'quelques'} points de charge pour 1 000 habitants. L'installation d'une borne privée est essentielle pour compléter cette offre toujours sous tension.`,
    `Dans un secteur immobilier ${commune.marcheImmobilier || 'dynamique'} comme ${commune.nom}, où le prix moyen au m² atteint ${commune.prixM2Moyen?.toLocaleString('fr-FR') || '3 500'} €, investir dans une borne de recharge certifiée IRVE est un choix de valorisation patrimoniale autant qu'un geste pour la transition énergétique en Provence.`,
    `${commune.nom} compte parmi les communes des Bouches-du-Rhône qui affichent une croissance de ${commune.croissanceVE || 25}% des immatriculations de véhicules électriques. Nos installateurs certifiés IRVE accompagnent les ${commune.population?.toLocaleString('fr-FR') || 'nombreux'} habitants de cette ${commune.profilCommune || 'commune'} dans l'équipement de leur domicile.`
  ];

  const agencyClosingPools = [
    `L'Espace Conseil de ${agency.name} (que vous pouvez joindre pour vos aides locales) recommande l'installation de bornes équipées du protocole de communication OCPP pour piloter précisément la charge en fonction de la production solaire ou du tarif d'électricité Enedis local.`,
    `Pour tout renseignement sur les subventions disponibles dans le 13, ${agency.name} est l'interlocuteur public de référence. Nos techniciens IRVE travaillent en coordination avec cet organisme pour maximiser les aides financières dont vous bénéficiez à ${commune.nom}.`,
    `${agency.name} (${agency.detail}) accompagne gratuitement les particuliers de ${commune.nom} dans leurs projets de transition énergétique. N'hésitez pas à les contacter pour un bilan personnalisé avant de lancer votre installation de borne.`,
    `L'expertise locale de ${agency.name} combinée au savoir-faire de nos électriciens IRVE garantit aux résidents de ${commune.nom} une installation conforme aux dernières normes et éligible à l'ensemble des aides financières disponibles en 2026.`
  ];

  // FIX #1: Use catOffset in seeds to differentiate localContext across templates
  const localContextText = [
    localIntroPools[getVariantIndex(commune.slug, catOffset + 1, localIntroPools.length)],
    patrimoineAnecdotes[climateZone][getVariantIndex(commune.slug, catOffset + 2, patrimoineAnecdotes[climateZone].length)],
    agencyClosingPools[getVariantIndex(commune.slug, catOffset + 3, agencyClosingPools.length)]
  ].join(' ');

  const pricing = getDynamicPrices(commune);

  // FIX #3: Dynamic savings calculation with distanceMarseille granularity
  const distKm = commune.distanceMarseille || 20;
  const dailyCommuteKm = Math.round(distKm * 2);
  let baseSavings = 1450;
  if (commune.population > 100000) {
    baseSavings = 1300;
  } else if (commune.population < 10000) {
    baseSavings = 1600;
  }
  // Factor in commute distance: longer commutes = bigger savings
  if (distKm > 40) baseSavings += 250;
  else if (distKm > 20) baseSavings += 120;
  // Factor in real estate tier: higher-end areas tend to have higher electricity costs
  if (commune.prixM2Moyen && commune.prixM2Moyen > 4500) baseSavings -= 80;
  const savingsEstimate = `environ ${baseSavings.toLocaleString('fr-FR')} € à ${(baseSavings + 350).toLocaleString('fr-FR')} € d'économie de carburant par an pour les trajets dans le secteur de {VILLE} (estimation basée sur un trajet quotidien d'environ ${dailyCommuteKm} km aller-retour et un tarif heure creuse Enedis de 0,15 €/kWh).`;

  // Select and spin content from pools using unique seeds per field
  const rawIntro = INTRO_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 10, INTRO_POOLS[resolvedCategory].length)];
  const introParagraph = spin(rawIntro, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawUseCase = USE_CASE_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 20, USE_CASE_POOLS[resolvedCategory].length)];
  const useCaseText = spin(rawUseCase, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawEco = ECO_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 30, ECO_POOLS[resolvedCategory].length)];
  const ecoText = spin(rawEco, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawCommuneData = COMMUNE_DATA_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 40, COMMUNE_DATA_POOLS[resolvedCategory].length)];
  const communeDataInsight = spin(rawCommuneData, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawExpertTip = EXPERT_TIP_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 50, EXPERT_TIP_POOLS[resolvedCategory].length)];
  const expertTip = spin(rawExpertTip, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawRealEstate = REAL_ESTATE_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 60, REAL_ESTATE_POOLS[resolvedCategory].length)];
  const realEstateInsight = spin(rawRealEstate, commune.slug).replaceAll('{VILLE}', commune.nom);

  const rawPopTier = POPULATION_TIER_POOLS[resolvedCategory][getVariantIndex(commune.slug, catOffset + 70, POPULATION_TIER_POOLS[resolvedCategory].length)];
  const populationTierContent = spin(rawPopTier, commune.slug).replaceAll('{VILLE}', commune.nom);

  // FAQ generation with rotation
  const rawFaqList = FAQ_POOLS[resolvedCategory];
  const selectedFaqs = selectRotatedItems(rawFaqList, commune.slug, catOffset, 6);
  const faqItems = selectedFaqs.map(faq => ({
    question: spin(faq.question, commune.slug).replaceAll('{VILLE}', commune.nom),
    answer: spin(faq.answer, commune.slug).replaceAll('{VILLE}', commune.nom)
  }));

  // Dynamic logisticsAlert pool
  const logisticsAlertPools = [
    `⚠️ **Certification obligatoire** : L'installation d'une borne de puissance supérieure à 3.7 kW à ${commune.nom} doit obligatoirement être réalisée par un professionnel qualifié IRVE. Sans cette qualification, vos assurances sont nulles en cas de sinistre électrique.`,
    `⚠️ **Obligation légale (${commune.codePostal})** : L'article L. 221-7 du Code de l'énergie impose le recours à un installateur certifié IRVE pour toute borne dépassant 3.7 kW. À ${commune.nom}, nos partenaires possèdent cette qualification et assurent une conformité NF C 15-100.`,
    `⚠️ **Exigence réglementaire** : À ${commune.nom}, comme dans toutes les Bouches-du-Rhône, poser soi-même une borne de plus de 3.7 kW sans qualification IRVE invalide la garantie constructeur de votre véhicule électrique et votre couverture d'assurance habitation.`,
    `⚠️ **Rappel normatif** : La pose d'une wallbox à ${commune.nom} nécessite un professionnel titulaire de la mention IRVE (P1/P2). Cette certification garantit la conformité de l'installation aux normes en vigueur et l'éligibilité au crédit d'impôt de 500 €.`,
    `⚠️ **Sécurité & Conformité** : Dans le département 13, seuls les électriciens qualifiés IRVE peuvent raccorder une borne de recharge au tableau principal. À ${commune.nom}, cette exigence s'applique aux puissances supérieures à 3.7 kW, sous peine d'exclusion des aides financières.`,
    `⚠️ **Information essentielle** : Le Consuel (Comité national pour la sécurité des usagers de l'électricité) peut exiger un contrôle de conformité de votre installation de borne à ${commune.nom}. Seul un installateur certifié IRVE garantit la validation de ce contrôle.`
  ];
  const logisticsAlert = logisticsAlertPools[getVariantIndex(commune.slug, catOffset + 80, logisticsAlertPools.length)];

  // Dynamic pricesContext pool
  const pricesContextPools = [
    `Les tarifs indiqués correspondent à une pose standard (câble ≤ 10 m entre tableau et borne) à ${commune.nom}. Les prix peuvent varier selon la mise aux normes du tableau électrique, les travaux de terrassement ou les spécificités du bâti local.`,
    `Ces prix incluent la fourniture de la wallbox, le câblage et les protections électriques obligatoires pour une installation à ${commune.nom}. Un surcoût peut s'appliquer en cas de distance importante entre le tableau et le point de charge (au-delà de 15 mètres).`,
    `Tarifs constatés par nos installateurs partenaires dans le secteur de ${commune.nom} en 2026. Le prix final dépend de la configuration de votre logement (distance tableau-borne, accessibilité, nécessité d'un passage en triphasé auprès d'Enedis Provence).`,
    `Prix moyens TTC relevés pour les installations réalisées dans les Bouches-du-Rhône, ajustés pour le secteur de ${commune.nom}. La visite technique gratuite de nos partenaires IRVE permet d'affiner ce devis en fonction de votre installation existante.`,
    `Ces estimations budgétaires pour ${commune.nom} sont données à titre indicatif et incluent main-d'œuvre, matériel et protections électriques réglementaires. Un chiffrage personnalisé est remis gratuitement après visite technique de votre domicile.`,
    `Barème indicatif 2026 pour le secteur de ${commune.nom} (${commune.codePostal}). Les coûts peuvent être réduits de 500 € à 1 460 € grâce au cumul du crédit d'impôt et de la prime ADVENIR, selon votre situation.`
  ];
  const pricesContext = pricesContextPools[getVariantIndex(commune.slug, catOffset + 85, pricesContextPools.length)];

  // Dynamic tableIntro pool
  const tableIntroPools = {
    main: [
      `Voici un récapitulatif des coûts moyens constatés pour l'installation d'équipements de charge à ${commune.nom} en 2026 :`,
      `Nos installateurs certifiés IRVE communiquent les barèmes de prix suivants pour la pose d'une borne de recharge dans le secteur de ${commune.nom} :`,
      `Budget à prévoir pour s'équiper d'une solution de recharge à domicile à ${commune.nom} — tarifs TTC avant déduction des aides financières :`,
      `Grille tarifaire indicative pour une installation de borne de recharge résidentielle dans la commune de ${commune.nom} (${commune.codePostal}) :`
    ],
    copropriete: [
      `Voici un récapitulatif des coûts indicatifs pour équiper vos stationnements en copropriété à ${commune.nom} :`,
      `Budget prévisionnel pour l'installation d'une borne de recharge en résidence collective à ${commune.nom} — tarifs TTC par point de charge :`,
      `Estimation des coûts d'installation de bornes de recharge en copropriété dans le secteur de ${commune.nom}, avant déduction des aides ADVENIR :`,
      `Tarifs moyens constatés pour les installations en parking collectif et en pied d'immeuble à ${commune.nom} :`
    ],
    wallbox: [
      `Voici un comparatif des coûts moyens et des performances constatées pour l'installation d'une borne wallbox à ${commune.nom} :`,
      `Tableau comparatif des puissances et des tarifs d'installation de wallbox résidentielles disponibles dans le secteur de ${commune.nom} :`,
      `Budget complet (fourniture + pose) pour une wallbox à domicile à ${commune.nom} — prix TTC constatés par nos installateurs certifiés :`,
      `Grille de prix et performances des bornes wallbox installées par nos partenaires IRVE dans la commune de ${commune.nom} :`
    ]
  };
  const tableIntro = tableIntroPools[resolvedCategory][getVariantIndex(commune.slug, catOffset + 90, tableIntroPools[resolvedCategory].length)];

  // ===== DYNAMIC SEO FIELDS (FIX #2: category-specific angles) =====
  
  // 1. Infrastructure density analysis — differentiated by category
  const densiteBornesVal = commune.densiteBornes || 0;
  const densiteQualif = densiteBornesVal >= 1.0 ? 'bien desservie' : densiteBornesVal >= 0.5 ? 'moyennement équipée' : 'sous-équipée';
  const densiteBase = `${commune.nom} dispose actuellement de ${commune.bornesPubliques || 0} bornes de recharge publiques pour ${commune.population?.toLocaleString('fr-FR')} habitants, soit une densité de ${densiteBornesVal} points de charge pour 1 000 habitants. Cette commune est donc ${densiteQualif} en infrastructure IRVE publique.`;
  const densiteSuffixes: Record<string, string> = {
    main: `Avec une croissance de ${commune.croissanceVE || 25}% des immatriculations de véhicules électriques par an, l'installation de bornes de recharge privées à domicile est essentielle pour absorber la demande croissante et éviter la saturation des stations publiques de la Métropole AMP.`,
    copropriete: `Les ${Math.round((100 - commune.logementsMaison) / 100 * (commune.logements || 1000)).toLocaleString('fr-FR')} logements collectifs estimés à ${commune.nom} représentent un potentiel considérable d'équipement en bornes de recharge individuelles sur parking. L'infrastructure collective permet de mutualiser les coûts de raccordement et de réduire l'investissement par copropriétaire.`,
    wallbox: `Avec seulement ${densiteBornesVal} points de charge publics pour 1 000 habitants, disposer de sa propre wallbox à ${commune.nom} est le moyen le plus fiable de recharger quotidiennement. Les ${commune.vehiculesElectriques?.toLocaleString('fr-FR') || 'nombreux'} véhicules électriques en circulation locale se disputent un réseau public limité.`
  };
  const densiteAnalysis = `${densiteBase} ${densiteSuffixes[resolvedCategory]}`;

  // 2. Real estate market insight — differentiated by category
  const marcheBase = `Le marché immobilier de ${commune.nom} est classé « ${commune.marcheImmobilier || 'intermédiaire'} » avec un prix moyen au m² de ${commune.prixM2Moyen?.toLocaleString('fr-FR') || 'N/A'} €.`;
  const marcheSuffixes: Record<string, string> = {
    main: `Dans ce contexte de marché ${commune.marcheImmobilier || 'intermédiaire'}, l'habitat ${commune.tauxMaisonLabel || 'résidentiel'} (${commune.logementsMaison}% de maisons individuelles sur ${commune.logements?.toLocaleString('fr-FR')} logements) rend l'installation d'une borne de recharge techniquement simple dans la majorité des cas, avec un accès direct au tableau électrique principal.`,
    copropriete: `Avec ${100 - commune.logementsMaison}% de logements en habitat collectif parmi les ${commune.logements?.toLocaleString('fr-FR')} résidences de ${commune.nom}, la demande d'équipement en bornes de recharge en copropriété est particulièrement forte. Les syndics et les conseils syndicaux doivent anticiper cette transition pour préserver l'attractivité de leur résidence sur le marché.`,
    wallbox: `Dans un secteur immobilier ${commune.marcheImmobilier || 'intermédiaire'} où ${commune.logementsMaison}% des logements sont des maisons individuelles, la wallbox résidentielle est l'équipement standard de recharge à ${commune.nom}. L'investissement dans une borne murale rapide (7.4 à 22 kW) se valorise lors de la revente du bien, les acquéreurs étant de plus en plus sensibles à la présence d'un point de charge.`
  };
  const marcheImmobilierInsight = `${marcheBase} ${marcheSuffixes[resolvedCategory]}`;

  // 3. Distance to Marseille context — differentiated by category
  const distVal = commune.distanceMarseille || 0;
  let distanceMarseilleContext: string;
  const catAngle = resolvedCategory === 'copropriete' ? 'copro' : resolvedCategory === 'wallbox' ? 'wallbox' : 'main';
  if (distVal <= 5) {
    const angles: Record<string, string> = {
      main: `${commune.nom} est situé au cœur ou à proximité immédiate de la métropole marseillaise. Le projet de ZFE (Zone à Faibles Émissions) de Marseille impose des restrictions et renforce l'urgence de passer à un véhicule électrique Crit'Air 0. Disposer d'une borne de recharge à domicile est ici un confort indispensable pour circuler librement dans l'hypercentre marseillais (Vieux-Port, Prado, Joliette).`,
      copro: `${commune.nom} fait partie du noyau urbain de la métropole marseillaise, où la majorité des logements sont collectifs. Les copropriétés situées en plein cœur de la ZFE (Zone à Faibles Émissions) doivent impérativement s'équiper d'infrastructures de recharge pour permettre à leurs résidents de circuler en véhicule Crit'Air 0 sans restriction.`,
      wallbox: `Située au cœur de Marseille, ${commune.nom} vit l'impact direct de la ZFE métropolitaine. Pour les propriétaires disposant d'un garage ou d'un box privatif, la wallbox 7.4 kW monophasée offre la solution de recharge la plus rapide et la plus économique en centre-ville, loin des files d'attente des chargeurs publics saturés.`
    };
    distanceMarseilleContext = angles[catAngle];
  } else if (distVal <= 20) {
    const angles: Record<string, string> = {
      main: `À seulement ${distVal} km du centre de Marseille, ${commune.nom} est directement concernée par le développement des transports électriques métropolitains. Les résidents qui effectuent des trajets quotidiens vers le centre-ville de Marseille, le pôle d'Aubagne ou d'Aix-en-Provence ont tout intérêt à s'équiper d'une borne de recharge à domicile pour des recharges nocturnes économiques.`,
      copro: `À ${distVal} km de Marseille, les résidences collectives de ${commune.nom} accueillent de nombreux navetteurs métropolitains. L'installation de bornes individuelles en parking de copropriété permet à ces résidents de recharger chaque soir sans détour par les stations publiques sur leur trajet domicile-travail.`,
      wallbox: `${commune.nom} n'est qu'à ${distVal} km du centre de Marseille. Les trajets domicile-bureau dans la métropole AMP se couvrent aisément avec une seule charge nocturne sur wallbox 7.4 kW, ce qui permet de récupérer environ ${Math.round(distVal * 2 * 1.3)} km d'autonomie en 6 heures de charge pendant les heures creuses.`
    };
    distanceMarseilleContext = angles[catAngle];
  } else if (distVal <= 45) {
    const angles: Record<string, string> = {
      main: `${commune.nom} se situe à ${distVal} km de Marseille. Les navetteurs provençaux qui rejoignent chaque jour les grands pôles économiques marseillais effectuent un trajet quotidien significatif de ${Math.round(distVal * 2)} km aller-retour. L'investissement dans une wallbox 7.4 kW à domicile se rentabilise ainsi très rapidement grâce aux économies substantielles de carburant.`,
      copro: `Située à ${distVal} km de Marseille, ${commune.nom} héberge des pendulaires parcourant ${Math.round(distVal * 2)} km aller-retour par jour. En copropriété, l'installation d'une borne individuelle sur son emplacement de parking permet d'économiser à la fois le coût du carburant et le temps perdu en station publique.`,
      wallbox: `Les ${Math.round(distVal * 2)} km aller-retour quotidiens entre ${commune.nom} et Marseille sont idéalement couverts par une wallbox 7.4 kW (6 à 8 h de charge nocturne en heures creuses), voire une 11 kW triphasée pour une recharge express en 3 heures. Aucune dépendance aux bornes publiques d'autoroute.`
    };
    distanceMarseilleContext = angles[catAngle];
  } else {
    const angles: Record<string, string> = {
      main: `Située à ${distVal} km de Marseille, ${commune.nom} est une commune des Bouches-du-Rhône où les distances routières imposent l'usage quotidien du véhicule. L'éloignement des grands centres urbains rend la wallbox domestique incontournable pour ne pas dépendre des stations de recharge rapides d'autoroute et charger votre véhicule au meilleur tarif réglementé d'Enedis.`,
      copro: `À ${distVal} km de Marseille, les résidents de ${commune.nom} parcourent de longues distances pour rejoindre les pôles d'emploi. Dans les résidences collectives éloignées des grandes zones urbaines, la borne individuelle sur parking est d'autant plus indispensable que le réseau de bornes publiques y est plus clairsemé.`,
      wallbox: `L'éloignement de ${commune.nom} (${distVal} km de Marseille) rend l'investissement dans une wallbox domestique particulièrement rentable : avec ${Math.round(distVal * 2)} km de trajet quotidien, les économies de carburant dépassent 150 € par mois par rapport à un véhicule thermique équivalent.`
    };
    distanceMarseilleContext = angles[catAngle];
  }

  // 4. Local regulation text
  const localRegulationPools = {
    'littoral-calanques': [
      `La ZFE de la Métropole de Marseille, mise en place progressivement, restreint les véhicules les plus polluants. Les motorisations 100% électriques sont les seules garanties de circuler sans limite. Installer une borne de recharge à domicile à ${commune.nom} permet de charger sereinement chaque soir.`,
      `Le Plan de Mobilité de la Métropole Aix-Marseille-Provence soutient l'essor de la recharge électrique à ${commune.nom}. Les aides financières disponibles (TVA 5,5%, ADVENIR en copropriété, crédit d'impôt de 500 €) permettent d'équiper son logement à moindre frais.`
    ],
    'interieur-provence': [
      `Bien que ${commune.nom} soit située dans l'arrière-pays provençal, les navettes fréquentes vers Aix ou Marseille incitent les conducteurs à anticiper les restrictions environnementales métropolitaines en passant à l'électrique. La borne de recharge résidentielle est la clé de voûte de cette transition dans le 13.`,
      `Les communes de l'intérieur des Bouches-du-Rhône comme ${commune.nom} intègrent dans leurs Plans Locaux d'Urbanisme (PLU) des obligations de pré-équipement pour faciliter l'installation ultérieure de bornes IRVE.`
    ],
    'crau-camargue': [
      `La Communauté d'Agglomération ACCM encourage activement le déploiement de solutions de recharge sur le territoire d'Arles et de ${commune.nom}. Installer une borne privée permet de recharger à coût minimal et d'utiliser une énergie verte en Provence.`,
      `Le Schéma de Cohérence Territoriale (SCoT) du pays d'Arles encourage la réduction des émissions de CO₂. La borne de recharge domestique est plébiscitée à ${commune.nom} en raison de l'importance des distances de navette quotidiennes.`
    ]
  };
  const localRegulation = localRegulationPools[climateZone][getVariantIndex(commune.slug, catOffset + 95, localRegulationPools[climateZone].length)];

  // 5. Sources citation
  const sourcesCitationPools = [
    `Sources : données INSEE ${commune.codeInsee}, barème Enedis Provence 2026, programme ADVENIR (advenir.mobi), Service-Public.fr (crédit d'impôt borne), réglementation IRVE Qualifelec.`,
    `Données : recensement INSEE (commune ${commune.codeInsee}), grille tarifaire Enedis 2026, arrêté du 13 janvier 2021 relatif aux installations de recharge, base data.gouv.fr des points de charge publics.`,
    `Références : fichier national IRVE (data.gouv.fr), statistiques d'immatriculation VE des Bouches-du-Rhône (AVERE-France), guide Promotelec recharge résidentielle, décret 2020-1720 droit à la prise.`,
    `Méthodologie : prix constatés par nos partenaires installateurs qualifiés IRVE dans les Bouches-du-Rhône (13), données de population INSEE 2024 (code commune ${commune.codeInsee}), statistiques de mobilité de la Métropole AMP.`
  ];
  const sourcesCitation = sourcesCitationPools[getVariantIndex(commune.slug, catOffset + 100, sourcesCitationPools.length)];

  // FIX #4: Rotate guide links based on commune slug (3 from 8)
  const rotatedGuides = selectRotatedItems(ALL_GUIDE_LINKS, commune.slug, catOffset + 110, 3);
  
  // FIX #5: Select 3 pillar links from 5 with rotation
  const pillarPool = PILLAR_LINKS[resolvedCategory];
  const rotatedPillars = selectRotatedItems(pillarPool, commune.slug, catOffset + 120, 3);

  return {
    introParagraph,
    logisticsAlert,
    useCaseText,
    pricesContext,
    faqItems,
    ecoText,
    localContext: localContextText,
    climateZoneLabel: zoneLabels[climateZone],
    localAgencyName: agency.name,
    externalLinks: getExternalLinks(resolvedCategory, commune.codePostal, commune.slug),
    communeDataInsight,
    expertTip,
    tableIntro,
    guideLinks: rotatedGuides,
    pillarLinks: rotatedPillars,
    savingsEstimate: savingsEstimate.replaceAll('{VILLE}', commune.nom),
    lastUpdated: `Juin 2026`,
    realEstateInsight,
    populationTierContent,
    densiteAnalysis,
    marcheImmobilierInsight,
    distanceMarseilleContext,
    localRegulation,
    sourcesCitation
  };
}
