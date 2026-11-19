// Where a music event is, to the IANA timezone its times are in. An ra.co page names
// the venue's city and country but not the timezone, so the app looks them up here.
// The table covers the cities and countries with the most events, and anything else
// is left for the user to choose.

/**
 * Cities, and districts written in their place: those with the most events, for an
 * address that doesn't name its country, and those in countries with several zones.
 */
const CITIES: Record<string, string> = {
  berlin: 'Europe/Berlin',
  hamburg: 'Europe/Berlin',
  munich: 'Europe/Berlin',
  cologne: 'Europe/Berlin',
  frankfurt: 'Europe/Berlin',
  leipzig: 'Europe/Berlin',
  london: 'Europe/London',
  manchester: 'Europe/London',
  bristol: 'Europe/London',
  leeds: 'Europe/London',
  glasgow: 'Europe/London',
  edinburgh: 'Europe/London',
  dublin: 'Europe/Dublin',
  paris: 'Europe/Paris',
  lyon: 'Europe/Paris',
  marseille: 'Europe/Paris',
  amsterdam: 'Europe/Amsterdam',
  rotterdam: 'Europe/Amsterdam',
  brussels: 'Europe/Brussels',
  antwerp: 'Europe/Brussels',
  ghent: 'Europe/Brussels',
  barcelona: 'Europe/Madrid',
  madrid: 'Europe/Madrid',
  ibiza: 'Europe/Madrid',
  valencia: 'Europe/Madrid',
  lisbon: 'Europe/Lisbon',
  porto: 'Europe/Lisbon',
  milan: 'Europe/Rome',
  rome: 'Europe/Rome',
  naples: 'Europe/Rome',
  turin: 'Europe/Rome',
  zurich: 'Europe/Zurich',
  geneva: 'Europe/Zurich',
  basel: 'Europe/Zurich',
  vienna: 'Europe/Vienna',
  copenhagen: 'Europe/Copenhagen',
  stockholm: 'Europe/Stockholm',
  oslo: 'Europe/Oslo',
  helsinki: 'Europe/Helsinki',
  warsaw: 'Europe/Warsaw',
  krakow: 'Europe/Warsaw',
  prague: 'Europe/Prague',
  budapest: 'Europe/Budapest',
  bucharest: 'Europe/Bucharest',
  sofia: 'Europe/Sofia',
  athens: 'Europe/Athens',
  tbilisi: 'Asia/Tbilisi',
  istanbul: 'Europe/Istanbul',
  'tel aviv': 'Asia/Jerusalem',
  beirut: 'Asia/Beirut',
  dubai: 'Asia/Dubai',
  cairo: 'Africa/Cairo',
  johannesburg: 'Africa/Johannesburg',
  'cape town': 'Africa/Johannesburg',
  tokyo: 'Asia/Tokyo',
  osaka: 'Asia/Tokyo',
  seoul: 'Asia/Seoul',
  shanghai: 'Asia/Shanghai',
  beijing: 'Asia/Shanghai',
  taipei: 'Asia/Taipei',
  bangkok: 'Asia/Bangkok',
  mumbai: 'Asia/Kolkata',
  delhi: 'Asia/Kolkata',
  'new delhi': 'Asia/Kolkata',
  bangalore: 'Asia/Kolkata',
  goa: 'Asia/Kolkata',
  'buenos aires': 'America/Argentina/Buenos_Aires',
  bogota: 'America/Bogota',
  medellin: 'America/Bogota',
  lima: 'America/Lima',
  montevideo: 'America/Montevideo',
  auckland: 'Pacific/Auckland',
  wellington: 'Pacific/Auckland',
  // Indonesia and Chile
  bali: 'Asia/Makassar',
  jakarta: 'Asia/Jakarta',
  santiago: 'America/Santiago',
  // United States
  'new york': 'America/New_York',
  brooklyn: 'America/New_York',
  queens: 'America/New_York',
  manhattan: 'America/New_York',
  boston: 'America/New_York',
  philadelphia: 'America/New_York',
  washington: 'America/New_York',
  miami: 'America/New_York',
  atlanta: 'America/New_York',
  detroit: 'America/Detroit',
  chicago: 'America/Chicago',
  austin: 'America/Chicago',
  houston: 'America/Chicago',
  dallas: 'America/Chicago',
  'new orleans': 'America/Chicago',
  minneapolis: 'America/Chicago',
  denver: 'America/Denver',
  phoenix: 'America/Phoenix',
  'las vegas': 'America/Los_Angeles',
  'los angeles': 'America/Los_Angeles',
  'san francisco': 'America/Los_Angeles',
  oakland: 'America/Los_Angeles',
  'san diego': 'America/Los_Angeles',
  seattle: 'America/Los_Angeles',
  portland: 'America/Los_Angeles',
  // Canada
  toronto: 'America/Toronto',
  montreal: 'America/Toronto',
  ottawa: 'America/Toronto',
  vancouver: 'America/Vancouver',
  calgary: 'America/Edmonton',
  // Australia
  sydney: 'Australia/Sydney',
  melbourne: 'Australia/Melbourne',
  brisbane: 'Australia/Brisbane',
  perth: 'Australia/Perth',
  adelaide: 'Australia/Adelaide',
  // Brazil
  'sao paulo': 'America/Sao_Paulo',
  'rio de janeiro': 'America/Sao_Paulo',
  // Mexico
  'mexico city': 'America/Mexico_City',
  'ciudad de mexico': 'America/Mexico_City',
  guadalajara: 'America/Mexico_City',
  tulum: 'America/Cancun',
  cancun: 'America/Cancun',
  // Russia
  moscow: 'Europe/Moscow',
  'st petersburg': 'Europe/Moscow',
  'saint petersburg': 'Europe/Moscow',
  // Spain's and Portugal's islands, which differ from the mainland
  tenerife: 'Atlantic/Canary',
  'gran canaria': 'Atlantic/Canary',
  'las palmas': 'Atlantic/Canary',
  'ponta delgada': 'Atlantic/Azores',
};

/** Countries with one zone, as ra.co writes them, and a few other spellings. */
const COUNTRIES: Record<string, string> = {
  germany: 'Europe/Berlin',
  'united kingdom': 'Europe/London',
  uk: 'Europe/London',
  england: 'Europe/London',
  scotland: 'Europe/London',
  wales: 'Europe/London',
  'northern ireland': 'Europe/London',
  ireland: 'Europe/Dublin',
  france: 'Europe/Paris',
  netherlands: 'Europe/Amsterdam',
  'the netherlands': 'Europe/Amsterdam',
  belgium: 'Europe/Brussels',
  luxembourg: 'Europe/Luxembourg',
  spain: 'Europe/Madrid',
  portugal: 'Europe/Lisbon',
  italy: 'Europe/Rome',
  switzerland: 'Europe/Zurich',
  austria: 'Europe/Vienna',
  denmark: 'Europe/Copenhagen',
  sweden: 'Europe/Stockholm',
  norway: 'Europe/Oslo',
  finland: 'Europe/Helsinki',
  iceland: 'Atlantic/Reykjavik',
  poland: 'Europe/Warsaw',
  'czech republic': 'Europe/Prague',
  czechia: 'Europe/Prague',
  slovakia: 'Europe/Bratislava',
  hungary: 'Europe/Budapest',
  slovenia: 'Europe/Ljubljana',
  croatia: 'Europe/Zagreb',
  serbia: 'Europe/Belgrade',
  'bosnia and herzegovina': 'Europe/Sarajevo',
  montenegro: 'Europe/Podgorica',
  romania: 'Europe/Bucharest',
  bulgaria: 'Europe/Sofia',
  greece: 'Europe/Athens',
  cyprus: 'Asia/Nicosia',
  malta: 'Europe/Malta',
  estonia: 'Europe/Tallinn',
  latvia: 'Europe/Riga',
  lithuania: 'Europe/Vilnius',
  ukraine: 'Europe/Kyiv',
  georgia: 'Asia/Tbilisi',
  turkey: 'Europe/Istanbul',
  turkiye: 'Europe/Istanbul',
  israel: 'Asia/Jerusalem',
  lebanon: 'Asia/Beirut',
  'united arab emirates': 'Asia/Dubai',
  egypt: 'Africa/Cairo',
  morocco: 'Africa/Casablanca',
  'south africa': 'Africa/Johannesburg',
  kenya: 'Africa/Nairobi',
  nigeria: 'Africa/Lagos',
  ghana: 'Africa/Accra',
  india: 'Asia/Kolkata',
  thailand: 'Asia/Bangkok',
  vietnam: 'Asia/Ho_Chi_Minh',
  singapore: 'Asia/Singapore',
  philippines: 'Asia/Manila',
  china: 'Asia/Shanghai',
  'hong kong': 'Asia/Hong_Kong',
  taiwan: 'Asia/Taipei',
  'south korea': 'Asia/Seoul',
  korea: 'Asia/Seoul',
  japan: 'Asia/Tokyo',
  'new zealand': 'Pacific/Auckland',
  argentina: 'America/Argentina/Buenos_Aires',
  colombia: 'America/Bogota',
  peru: 'America/Lima',
  uruguay: 'America/Montevideo',
};

/** Countries with more than one zone, where only the city says which. */
const SEVERAL_ZONES = new Set([
  'united states',
  'usa',
  'canada',
  'australia',
  'brazil',
  'mexico',
  'russia',
  'indonesia',
  'chile',
]);

/** Lowercase, without accents or punctuation, with single spaces. */
export function placeKey(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function containsPlace(haystack: string, place: string): boolean {
  return ` ${haystack} `.includes(` ${place} `);
}

export type ZoneMatch =
  | { kind: 'found'; timeZone: string; place: string }
  | { kind: 'several'; country: string }
  | { kind: 'none' };

/**
 * The zone of the first text, in order, that names a known city or country. Within a
 * text, a city wins over a country. A country with several zones and no known city is
 * reported, so the user can choose, and it is checked before the countries with one, so
 * that "Savannah, Georgia, United States" isn't read as the country Georgia.
 */
export function zoneForPlace(texts: readonly string[]): ZoneMatch {
  // Once a country with several zones is found, only a city in a later text can settle it.
  let several: string | null = null;
  for (const text of texts) {
    const key = placeKey(text);
    if (key === '') continue;
    for (const [city, timeZone] of Object.entries(CITIES)) {
      if (containsPlace(key, city)) return { kind: 'found', timeZone, place: city };
    }
    if (several !== null) continue;
    for (const country of SEVERAL_ZONES) {
      if (containsPlace(key, country)) several = country;
    }
    if (several !== null) continue;
    for (const [country, timeZone] of Object.entries(COUNTRIES)) {
      if (containsPlace(key, country)) return { kind: 'found', timeZone, place: country };
    }
  }
  return several === null ? { kind: 'none' } : { kind: 'several', country: several };
}

/** True if the line is only a city or a country the table knows, as a breadcrumb is. */
export function isPlaceName(line: string): boolean {
  const key = placeKey(line);
  return key in CITIES || key in COUNTRIES || SEVERAL_ZONES.has(key);
}
