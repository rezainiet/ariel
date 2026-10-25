// ─────────────────────────────────────────────────────────────
// Devise d'AFFICHAGE selon le pays du visiteur — module pur, partagé par le serveur et le navigateur.
// Le montant ENCAISSÉ ne change pas : il reste celui des liens de paiement approuvés (CHF, voir offers.js).
// Les montants affichés dans une autre devise sont des estimations au taux de référence de la BCE
// (server/fx.mjs), toujours accompagnées du montant réellement débité.
// Seules les devises publiées par la BCE sont proposées ; sinon le visiteur voit le montant débité.
// ─────────────────────────────────────────────────────────────

// Devises publiées chaque jour ouvrable par la BCE (taux de référence contre l'euro) + l'euro lui-même.
export const ECB_CURRENCIES = [
  'EUR', 'USD', 'JPY', 'CZK', 'DKK', 'GBP', 'HUF', 'PLN', 'RON', 'SEK', 'CHF', 'ISK', 'NOK', 'TRY', 'AUD',
  'BRL', 'CAD', 'CNY', 'HKD', 'IDR', 'ILS', 'INR', 'KRW', 'MXN', 'MYR', 'NZD', 'PHP', 'SGD', 'THB', 'ZAR',
]

// Monnaie officielle par pays (ISO 3166 → ISO 4217), limitée aux devises ci-dessus.
// Zone euro, y compris la Bulgarie (euro depuis le 1er janvier 2026) et les pays qui utilisent l'euro.
const EURO = ['AT', 'BE', 'BG', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
  'AD', 'MC', 'SM', 'VA', 'ME', 'XK', 'GP', 'MQ', 'GF', 'RE', 'YT', 'PM', 'BL', 'MF', 'AX']
const OTHERS = {
  CH: 'CHF', LI: 'CHF',
  GB: 'GBP', IM: 'GBP', JE: 'GBP', GG: 'GBP',
  US: 'USD', PR: 'USD', GU: 'USD', VI: 'USD', AS: 'USD', MP: 'USD', EC: 'USD', SV: 'USD', PA: 'USD', TL: 'USD', FM: 'USD', MH: 'USD', PW: 'USD', BQ: 'USD', TC: 'USD', VG: 'USD',
  CA: 'CAD',
  JP: 'JPY', CZ: 'CZK', DK: 'DKK', GL: 'DKK', FO: 'DKK', HU: 'HUF', PL: 'PLN', RO: 'RON', SE: 'SEK', IS: 'ISK',
  NO: 'NOK', SJ: 'NOK', TR: 'TRY', AU: 'AUD', NR: 'AUD', KI: 'AUD', TV: 'AUD', BR: 'BRL', CN: 'CNY', HK: 'HKD',
  ID: 'IDR', IL: 'ILS', IN: 'INR', KR: 'KRW', MX: 'MXN', MY: 'MYR', NZ: 'NZD', CK: 'NZD', NU: 'NZD', PH: 'PHP',
  SG: 'SGD', TH: 'THB', ZA: 'ZAR',
}
const COUNTRY_CURRENCY = { ...Object.fromEntries(EURO.map((c) => [c, 'EUR'])), ...OTHERS }

export const localCurrencyFor = (country) => COUNTRY_CURRENCY[country] || null

// Nombre de décimales affichées (JPY, KRW, ISK : 0 selon ISO ; IDR et HUF : 0 par usage, les centimes n'ayant pas cours).
const WHOLE = ['IDR', 'HUF']
export const currencyDigits = (currency) =>
  WHOLE.includes(currency) ? 0 : new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits

// Montant converti puis arrondi aux décimales de la devise : la base de tout affichage local.
export function convert(amount, rate, currency) {
  const f = 10 ** currencyDigits(currency)
  return Math.round(amount * rate * f) / f
}
