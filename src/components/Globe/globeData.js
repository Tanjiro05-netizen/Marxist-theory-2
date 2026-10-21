// Historical geo-data for the globe: Marx's life journey, the ideological
// lineage, and the revolutionary wave of 1917–1959. Coordinates are
// real-world lat/lng. Connections reference event ids.

export const CATEGORIES = {
  marx: { label: "Marx's Journey", color: '#e8b84b' },
  lineage: { label: 'Ideological Lineage', color: '#6f9bff' },
  revolution: { label: 'Revolutionary Wave', color: '#e04a3a' },
  timeline: { label: 'Timeline Events', color: '#b07ce8' },
};

export const GLOBE_EVENTS = [
  /* ── Marx's life journey ── */
  { id: 'trier', name: 'Trier', lat: 49.7596, lng: 6.6439, year: 1818, category: 'marx', description: 'Karl Marx is born on 5 May 1818 in Trier, in the Prussian Rhineland.' },
  { id: 'bonn', name: 'Bonn', lat: 50.7374, lng: 7.0982, year: 1835, category: 'marx', description: 'Marx enrols at the University of Bonn to study law; joins the radical Poets\u2019 Club.' },
  { id: 'berlin-uni', name: 'Berlin', lat: 52.52, lng: 13.405, year: 1836, category: 'marx', description: 'Transfers to the University of Berlin; falls in with the Young Hegelians.' },
  { id: 'jena', name: 'Jena', lat: 50.9271, lng: 11.5892, year: 1841, category: 'marx', description: 'Receives his doctorate in philosophy from the University of Jena, in absentia.' },
  { id: 'cologne-1842', name: 'Cologne', lat: 50.9375, lng: 6.9603, year: 1842, category: 'marx', description: 'Becomes editor of the liberal Rheinische Zeitung, suppressed by the Prussian censor in 1843.' },
  { id: 'paris-1843', name: 'Paris', lat: 48.8566, lng: 2.3522, year: 1843, category: 'marx', description: 'Moves to Paris; publishes the Deutsch-Franz\u00f6sische Jahrb\u00fccher and meets Friedrich Engels (1844). Expelled from France in 1845.' },
  { id: 'brussels', name: 'Brussels', lat: 50.8503, lng: 4.3517, year: 1845, category: 'marx', description: 'Exile in Brussels. With Engels writes The German Ideology and the Communist Manifesto (published February 1848).' },
  { id: 'cologne-1848', name: 'Cologne (1848)', lat: 50.9375, lng: 6.9603, year: 1848, category: 'marx', description: 'Returns during the 1848 revolutions to edit the Neue Rheinische Zeitung; expelled after the counter-revolution.' },
  { id: 'london', name: 'London', lat: 51.5074, lng: -0.1278, year: 1849, category: 'marx', description: 'Final exile in London. Writes Das Kapital (Vol. I, 1867). Dies 14 March 1883; buried at Highgate Cemetery.' },

  /* ── Ideological lineage ── */
  { id: 'london-iwma', name: 'London \u2014 First International', lat: 51.5074, lng: -0.1278, year: 1864, category: 'lineage', description: 'The International Workingmen\u2019s Association (First International) is founded at St Martin\u2019s Hall, London, with Marx on its General Council.' },
  { id: 'paris-commune', name: 'Paris Commune', lat: 48.8566, lng: 2.3522, year: 1871, category: 'lineage', description: 'The Paris Commune \u2014 the first working-class seizure of power \u2014 holds the city for 72 days before being crushed in the Semaine Sanglante.' },
  { id: 'zurich', name: 'Zurich', lat: 47.3769, lng: 8.5417, year: 1916, category: 'lineage', description: 'Lenin\u2019s wartime exile in Zurich. In April 1917 he crosses Germany in the sealed train back to Russia.' },
  { id: 'petrograd', name: 'Petrograd', lat: 59.9311, lng: 30.3609, year: 1917, category: 'lineage', description: 'The October Revolution: Bolshevik-led workers, soldiers and sailors overthrow the Provisional Government on 7 November 1917.' },

  /* ── Revolutionary wave ── */
  { id: 'moscow', name: 'Moscow', lat: 55.7558, lng: 37.6173, year: 1918, category: 'revolution', description: 'The Soviet capital moves to Moscow (1918). The Communist International (Comintern) is founded here in March 1919 to spread the world revolution.' },
  { id: 'helsinki', name: 'Helsinki', lat: 60.1699, lng: 24.9384, year: 1918, category: 'revolution', description: 'Finnish Civil War (January\u2013May 1918): the Red Guards fight for a Finnish workers\u2019 republic and are defeated by the Whites.' },
  { id: 'berlin-1918', name: 'Berlin \u2014 November Revolution', lat: 52.52, lng: 13.405, year: 1918, category: 'revolution', description: 'The German Revolution topples the Kaiser. The Spartacist uprising of January 1919 is crushed; Rosa Luxemburg and Karl Liebknecht are murdered.' },
  { id: 'bremen', name: 'Bremen', lat: 53.0793, lng: 8.8017, year: 1919, category: 'revolution', description: 'The Bremen Soviet Republic (January\u2013February 1919), overthrown by government and Freikorps troops.' },
  { id: 'munich', name: 'Munich', lat: 48.1351, lng: 11.582, year: 1919, category: 'revolution', description: 'The Bavarian Soviet Republic (April\u2013May 1919), suppressed by the Reichswehr and Freikorps with some 600 dead.' },
  { id: 'budapest', name: 'Budapest', lat: 47.4979, lng: 19.0402, year: 1919, category: 'revolution', description: 'The Hungarian Soviet Republic under B\u00e9la Kun (March\u2013August 1919), defeated in the Hungarian\u2013Romanian War.' },
  { id: 'turin', name: 'Turin', lat: 45.0703, lng: 7.6869, year: 1919, category: 'revolution', description: 'The Biennio Rosso (1919\u201320): mass strikes and factory occupations across northern Italy, centred on Turin\u2019s metalworkers.' },
  { id: 'hamburg', name: 'Hamburg', lat: 53.5511, lng: 9.9937, year: 1923, category: 'revolution', description: 'The Hamburg Uprising of October 1923 \u2014 the last armed rising of the German October.' },
  { id: 'ulaanbaatar', name: 'Ulaanbaatar', lat: 47.8864, lng: 106.9057, year: 1921, category: 'revolution', description: 'The Mongolian Revolution of 1921 establishes the Mongolian People\u2019s Republic \u2014 the second socialist state in history (1924).' },
  { id: 'shanghai', name: 'Shanghai', lat: 31.2304, lng: 121.4737, year: 1921, category: 'revolution', description: 'The Communist Party of China holds its founding congress in the French Concession of Shanghai, July 1921.' },
  { id: 'beijing', name: 'Beijing', lat: 39.9042, lng: 116.4074, year: 1949, category: 'revolution', description: 'Mao Zedong proclaims the People\u2019s Republic of China from Tiananmen, 1 October 1949, after 22 years of revolutionary war.' },
  { id: 'hanoi', name: 'Hanoi', lat: 21.0285, lng: 105.8542, year: 1945, category: 'revolution', description: 'The August Revolution: Ho Chi Minh declares the Democratic Republic of Vietnam, 2 September 1945.' },
  { id: 'pyongyang', name: 'Pyongyang', lat: 39.0392, lng: 125.7625, year: 1948, category: 'revolution', description: 'The Democratic People\u2019s Republic of Korea is founded, September 1948.' },
  { id: 'belgrade', name: 'Belgrade', lat: 44.7866, lng: 20.4489, year: 1945, category: 'revolution', description: 'Tito\u2019s Partisans complete the Yugoslav socialist revolution \u2014 the only fully home-grown revolution in wartime Europe.' },
  { id: 'havana', name: 'Havana', lat: 23.1136, lng: -82.3666, year: 1959, category: 'revolution', description: 'The Cuban Revolution: Fidel Castro\u2019s July 26 Movement enters Havana, January 1959.' },
];

export const GLOBE_CONNECTIONS = [
  /* Marx's journey (chronological chain) */
  { from: 'trier', to: 'bonn', category: 'marx' },
  { from: 'bonn', to: 'berlin-uni', category: 'marx' },
  { from: 'berlin-uni', to: 'jena', category: 'marx' },
  { from: 'jena', to: 'cologne-1842', category: 'marx' },
  { from: 'cologne-1842', to: 'paris-1843', category: 'marx' },
  { from: 'paris-1843', to: 'brussels', category: 'marx' },
  { from: 'brussels', to: 'cologne-1848', category: 'marx' },
  { from: 'cologne-1848', to: 'london', category: 'marx' },

  /* Ideological lineage */
  { from: 'london', to: 'london-iwma', category: 'lineage' },
  { from: 'london-iwma', to: 'paris-commune', category: 'lineage' },
  { from: 'paris-commune', to: 'petrograd', category: 'lineage' },
  { from: 'zurich', to: 'petrograd', category: 'lineage' },

  /* Revolutionary wave: European risings radiate from Petrograd */
  { from: 'petrograd', to: 'moscow', category: 'revolution' },
  { from: 'petrograd', to: 'helsinki', category: 'revolution' },
  { from: 'petrograd', to: 'berlin-1918', category: 'revolution' },
  { from: 'berlin-1918', to: 'bremen', category: 'revolution' },
  { from: 'berlin-1918', to: 'munich', category: 'revolution' },
  { from: 'berlin-1918', to: 'hamburg', category: 'revolution' },
  { from: 'petrograd', to: 'budapest', category: 'revolution' },
  { from: 'petrograd', to: 'turin', category: 'revolution' },

  /* Comintern-era spread radiates from Moscow */
  { from: 'moscow', to: 'ulaanbaatar', category: 'revolution' },
  { from: 'moscow', to: 'shanghai', category: 'revolution' },
  { from: 'shanghai', to: 'beijing', category: 'revolution' },
  { from: 'moscow', to: 'hanoi', category: 'revolution' },
  { from: 'moscow', to: 'pyongyang', category: 'revolution' },
  { from: 'moscow', to: 'belgrade', category: 'revolution' },
  { from: 'moscow', to: 'havana', category: 'revolution' },
];

/* Gazetteer used to place Supabase timeline_events on the globe by their
   free-text `location` field (matched case-insensitively as substrings). */
export const LOCATION_COORDS = {
  trier: [49.7596, 6.6439],
  bonn: [50.7374, 7.0982],
  berlin: [52.52, 13.405],
  jena: [50.9271, 11.5892],
  cologne: [50.9375, 6.9603],
  paris: [48.8566, 2.3522],
  brussels: [50.8503, 4.3517],
  london: [51.5074, -0.1278],
  manchester: [53.4808, -2.2426],
  amsterdam: [52.3676, 4.9041],
  vienna: [48.2082, 16.3738],
  zurich: [47.3769, 8.5417],
  geneva: [46.2044, 6.1432],
  'the hague': [52.0705, 4.3007],
  petrograd: [59.9311, 30.3609],
  'st. petersburg': [59.9311, 30.3609],
  'saint petersburg': [59.9311, 30.3609],
  moscow: [55.7558, 37.6173],
  helsinki: [60.1699, 24.9384],
  munich: [48.1351, 11.582],
  bremen: [53.0793, 8.8017],
  hamburg: [53.5511, 9.9937],
  budapest: [47.4979, 19.0402],
  turin: [45.0703, 7.6869],
  milan: [45.4642, 9.19],
  rome: [41.9028, 12.4964],
  madrid: [40.4168, -3.7038],
  barcelona: [41.3874, 2.1686],
  lisbon: [38.7223, -9.1393],
  warsaw: [52.2297, 21.0122],
  prague: [50.0755, 14.4378],
  belgrade: [44.7866, 20.4489],
  athens: [37.9838, 23.7275],
  istanbul: [41.0082, 28.9784],
  shanghai: [31.2304, 121.4737],
  beijing: [39.9042, 116.4074],
  peking: [39.9042, 116.4074],
  'yan\u2019an': [36.585, 109.4897],
  yanan: [36.585, 109.4897],
  hanoi: [21.0285, 105.8542],
  saigon: [10.8231, 106.6297],
  'ho chi minh': [10.8231, 106.6297],
  pyongyang: [39.0392, 125.7625],
  seoul: [37.5665, 126.978],
  tokyo: [35.6762, 139.6503],
  ulaanbaatar: [47.8864, 106.9057],
  havana: [23.1136, -82.3666],
  'mexico city': [19.4326, -99.1332],
  'new york': [40.7128, -74.006],
  chicago: [41.8781, -87.6298],
  'buenos aires': [-34.6037, -58.3816],
  santiago: [-33.4489, -70.6693],
  caracas: [10.4806, -66.9036],
  managua: [12.1364, -86.2514],
  algiers: [36.7538, 3.0588],
  cairo: [30.0444, 31.2357],
  johannesburg: [-26.2041, 28.0473],
  'cape town': [-33.9249, 18.4241],
  addis: [9.03, 38.74],
  luanda: [-8.8368, 13.2343],
  maputo: [-25.9692, 32.5732],
  delhi: [28.6139, 77.209],
  calcutta: [22.5726, 88.3639],
  kolkata: [22.5726, 88.3639],
  jakarta: [-6.2088, 106.8456],
  manila: [14.5995, 120.9842],
  russia: [55.7558, 37.6173],
  germany: [52.52, 13.405],
  france: [48.8566, 2.3522],
  england: [51.5074, -0.1278],
  china: [39.9042, 116.4074],
  cuba: [23.1136, -82.3666],
  vietnam: [21.0285, 105.8542],
  hungary: [47.4979, 19.0402],
};

/* Match a free-text location string to coordinates. Returns [lat, lng] or null. */
export function matchLocation(location) {
  return resolveLocation(location)?.coords || null;
}

/* Gazetteer keys → ISO 3166-1 alpha-2 country codes (for World Bank lookups) */
export const LOCATION_COUNTRIES = {
  trier: 'DE', bonn: 'DE', berlin: 'DE', jena: 'DE', cologne: 'DE', munich: 'DE', bremen: 'DE', hamburg: 'DE', germany: 'DE',
  paris: 'FR', france: 'FR',
  brussels: 'BE',
  london: 'GB', manchester: 'GB', england: 'GB',
  amsterdam: 'NL', 'the hague': 'NL',
  vienna: 'AT',
  zurich: 'CH', geneva: 'CH',
  petrograd: 'RU', 'st. petersburg': 'RU', 'saint petersburg': 'RU', moscow: 'RU', russia: 'RU',
  helsinki: 'FI',
  budapest: 'HU', hungary: 'HU',
  turin: 'IT', milan: 'IT', rome: 'IT',
  madrid: 'ES', barcelona: 'ES', lisbon: 'PT',
  warsaw: 'PL', prague: 'CZ', belgrade: 'RS', athens: 'GR', istanbul: 'TR',
  shanghai: 'CN', beijing: 'CN', peking: 'CN', 'yan\u2019an': 'CN', yanan: 'CN', china: 'CN',
  hanoi: 'VN', saigon: 'VN', 'ho chi minh': 'VN', vietnam: 'VN',
  pyongyang: 'KP', seoul: 'KR', tokyo: 'JP', ulaanbaatar: 'MN',
  havana: 'CU', cuba: 'CU', 'mexico city': 'MX',
  'new york': 'US', chicago: 'US',
  'buenos aires': 'AR', santiago: 'CL', caracas: 'VE', managua: 'NI',
  algiers: 'DZ', cairo: 'EG', johannesburg: 'ZA', 'cape town': 'ZA', addis: 'ET', luanda: 'AO', maputo: 'MZ',
  delhi: 'IN', calcutta: 'IN', kolkata: 'IN',
  jakarta: 'ID', manila: 'PH',
};

/* Resolve a free-text location to coordinates AND its gazetteer key.
   Returns { coords: [lat, lng], key } or null. */
export function resolveLocation(location) {
  if (!location) return null;
  const lower = location.toLowerCase();
  const keys = Object.keys(LOCATION_COORDS).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower.includes(key)) {
      return { coords: LOCATION_COORDS[key], key };
    }
  }
  return null;
}
