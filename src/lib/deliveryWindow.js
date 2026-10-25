// Fenêtre de livraison affichée sous les offres (« Chez vous entre 28–29 oct. ») — module pur.
// Elle découle uniquement du délai annoncé (DELIVERY.estimateDays, « sous N jours ouvrables ») :
// du (N−1)e au Ne jour ouvrable après aujourd'hui, à l'heure de Zurich.
// Jours non ouvrables : samedi, dimanche et jours fériés suisses où le courrier n'est en général pas distribué.

const DAY = 86_400_000
const TIME_ZONE = 'Europe/Zurich'

// Date du jour (minuit UTC) telle qu'elle est à Zurich.
function todayIn(now, timeZone) {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now).split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

// Dimanche de Pâques (algorithme de Meeus), en minuit UTC.
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100
  const h = (19 * a + b - Math.floor(b / 4) - Math.floor((b - Math.floor((8 * b + 13) / 25)) / 3) + 15) % 30
  const l = (32 + 2 * (b % 4) + 2 * Math.floor(c / 4) - h - (c % 4)) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return Date.UTC(y, month - 1, day)
}

const holidayCache = new Map()
function holidays(y) {
  if (!holidayCache.has(y)) {
    const e = easter(y)
    holidayCache.set(y, new Set([
      Date.UTC(y, 0, 1), Date.UTC(y, 0, 2), // Nouvel An, Saint-Berthold
      e - 2 * DAY, e + DAY, e + 39 * DAY, e + 50 * DAY, // Vendredi saint, lundi de Pâques, Ascension, lundi de Pentecôte
      Date.UTC(y, 7, 1), // Fête nationale
      Date.UTC(y, 11, 25), Date.UTC(y, 11, 26), // Noël, Saint-Étienne
    ]))
  }
  return holidayCache.get(y)
}

const isWorkingDay = (t) => {
  const d = new Date(t)
  const wd = d.getUTCDay()
  return wd !== 0 && wd !== 6 && !holidays(d.getUTCFullYear()).has(t)
}

function addWorkingDays(t, n) {
  let left = n
  while (left > 0) {
    t += DAY
    if (isWorkingDay(t)) left -= 1
  }
  return t
}

// { from, to } : dates (Date à midi UTC) de la première et de la dernière livraison estimées.
export function deliveryWindow(now = new Date(), days = 3, timeZone = TIME_ZONE) {
  if (!(days > 0)) return null
  const today = todayIn(now, timeZone)
  const from = addWorkingDays(today, Math.max(1, days - 1))
  const to = addWorkingDays(today, days)
  return { from: new Date(from + DAY / 2), to: new Date(to + DAY / 2) }
}

// « 28–29 oct. » / « 30 oct. – 2 nov. » ; sans l'année, même à cheval sur deux années.
export function formatDeliveryWindow(win, locale, { long = false } = {}) {
  const f = new Intl.DateTimeFormat(locale, long
    ? { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }
    : { day: 'numeric', month: 'short', timeZone: 'UTC' })
  if (win.from.getTime() === win.to.getTime()) return f.format(win.from)
  if (win.from.getUTCFullYear() !== win.to.getUTCFullYear()) return `${f.format(win.from)}\u2009–\u2009${f.format(win.to)}`
  return f.formatRange(win.from, win.to)
}
