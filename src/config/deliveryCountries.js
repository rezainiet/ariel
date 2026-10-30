// European destinations served in French, German, or English on this shop.
// Keep the checkout selector and server validation on the same allowlist.
export const DELIVERY_COUNTRIES = Object.freeze(['CH', 'FR', 'DE', 'AT', 'BE', 'LU', 'LI', 'MC', 'GB', 'IE', 'MT'])

export const isDeliveryCountry = (country) => DELIVERY_COUNTRIES.includes(country)

const POSTAL_PATTERNS = {
  CH: /^[1-9]\d{3}$/,
  FR: /^\d{5}$/,
  DE: /^\d{5}$/,
  AT: /^\d{4}$/,
  BE: /^\d{4}$/,
  LU: /^\d{4}$/,
  LI: /^\d{4}$/,
  MC: /^\d{5}$/,
  GB: /^(?:GIR\s?0AA|(?:[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}))$/i,
  IE: /^(?:[A-Z\d]{3}\s?[A-Z\d]{4})$/i,
  MT: /^[A-Z]{3}\s?\d{4}$/i,
}

export const validPostalCode = (country, value) => Boolean(POSTAL_PATTERNS[country]?.test(String(value || '').trim()))
export const postalIsNumeric = (country) => !['GB', 'IE', 'MT'].includes(country)
