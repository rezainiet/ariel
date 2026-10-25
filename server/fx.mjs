// ─────────────────────────────────────────────────────────────
// Taux de change pour l'AFFICHAGE des prix estimés (jamais pour l'encaissement).
// Source : taux de référence quotidiens de la BCE (publication officielle, sans clé d'accès).
// Cache serveur : DATA_DIR/fx-rates.json, rafraîchi toutes les 6 h ; la BCE publie une fois par jour ouvrable.
// Un taux de plus de FX_MAX_AGE_DAYS (7 par défaut) n'est plus utilisé : le visiteur voit alors le
// montant débité (CHF) sans estimation, plutôt qu'une estimation périmée.
// ─────────────────────────────────────────────────────────────
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { ECB_CURRENCIES, localCurrencyFor } from '../src/config/currencies.js'

export const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml'

// <Cube time='2026-10-23'> … <Cube currency='USD' rate='1.1193'/> → { date, rates: { EUR: 1, USD: 1.1193, … } }
export function parseEcb(xml) {
  const date = /<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]/.exec(xml)?.[1]
  const rates = { EUR: 1 }
  for (const [, currency, rate] of xml.matchAll(/<Cube\s+currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) {
    const value = Number(rate)
    if (ECB_CURRENCIES.includes(currency) && Number.isFinite(value) && value > 0) rates[currency] = value
  }
  if (!date || !rates.CHF || Object.keys(rates).length < 10) throw new Error('ecb_unexpected_format')
  return { date, rates }
}

// Taux « 1 unité de `from` = x unités de `to` », arrondi à 6 chiffres significatifs.
export function crossRate(table, from, to) {
  const a = table?.rates?.[from]
  const b = table?.rates?.[to]
  if (!a || !b) return null
  return Number((b / a).toPrecision(6))
}

export function isFresh(table, now = Date.now(), maxDays = 7) {
  if (!table?.date) return false
  return now - Date.parse(`${table.date}T16:00:00Z`) <= maxDays * 24 * 60 * 60 * 1000
}

// Devise affichée pour un pays et une devise d'encaissement donnés.
// → { currency, rate, date, estimated } ; sans taux frais ou devise non publiée : la devise encaissée.
export function displayFor(country, charge, table, now = Date.now(), maxDays = 7) {
  const local = localCurrencyFor(country)
  if (!local || local === charge || !isFresh(table, now, maxDays)) return { currency: charge, rate: 1, date: null, estimated: false }
  const rate = crossRate(table, charge, local)
  if (!rate) return { currency: charge, rate: 1, date: null, estimated: false }
  return { currency: local, rate, date: table.date, estimated: true }
}

export function createFx(dataDir, { env = process.env, log = console, fetcher = fetch, intervalMs = 6 * 60 * 60 * 1000 } = {}) {
  const file = join(dataDir, 'fx-rates.json')
  const maxDays = Number(env.FX_MAX_AGE_DAYS) > 0 ? Number(env.FX_MAX_AGE_DAYS) : 7
  let table = null
  const refresh = async () => {
    try {
      const res = await fetcher(ECB_URL, { signal: AbortSignal.timeout(15000) })
      if (!res.ok) throw new Error(`ecb_${res.status}`)
      const next = { ...parseEcb(await res.text()), fetchedAt: new Date().toISOString(), source: 'ECB' }
      await mkdir(dataDir, { recursive: true })
      await writeFile(`${file}.tmp`, JSON.stringify(next))
      await rename(`${file}.tmp`, file)
      if (next.date !== table?.date) log.info(`[fx] taux BCE du ${next.date} (${Object.keys(next.rates).length} devises)`)
      table = next
    } catch (error) {
      log.warn('[fx] mise à jour impossible, dernier taux conservé :', error.message)
    }
  }
  const ready = (async () => {
    try { table = JSON.parse(await readFile(file, 'utf8')) } catch { /* premier démarrage */ }
    if (env.FX_DISABLED !== 'true') await refresh()
  })()
  if (env.FX_DISABLED !== 'true') setInterval(refresh, intervalMs).unref()
  return {
    ready,
    display: (country, charge) => displayFor(country, charge, table, Date.now(), maxDays),
    get table() { return table },
  }
}
