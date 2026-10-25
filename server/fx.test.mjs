import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseEcb, crossRate, displayFor, isFresh, createFx } from './fx.mjs'
import { localeOf, injectLocale } from './geo.mjs'
import { localCurrencyFor, convert, currencyDigits } from '../src/config/currencies.js'
import { OFFERS, formatMoney } from '../src/config/offers.js'
import { validateOrder } from '../src/lib/orderValidation.js'

// Extrait réel du fichier BCE (23 octobre 2026).
const XML = `<?xml version="1.0" encoding="UTF-8"?><gesmes:Envelope><Cube><Cube time='2026-10-23'>
<Cube currency='USD' rate='1.1193'/><Cube currency='JPY' rate='175.51'/><Cube currency='CZK' rate='24.327'/>
<Cube currency='DKK' rate='7.4748'/><Cube currency='GBP' rate='0.83728'/><Cube currency='HUF' rate='366.73'/>
<Cube currency='PLN' rate='4.3945'/><Cube currency='SEK' rate='11.1310'/><Cube currency='CHF' rate='0.9227'/>
<Cube currency='CAD' rate='1.5665'/><Cube currency='IDR' rate='20268.06'/><Cube currency='XXX' rate='9'/>
</Cube></Cube></gesmes:Envelope>`
const NOW = Date.parse('2026-10-25T12:00:00Z')
const table = parseEcb(XML)

test('ECB rates are parsed and crossed through the euro', () => {
  assert.equal(table.date, '2026-10-23')
  assert.equal(table.rates.EUR, 1)
  assert.equal(table.rates.XXX, undefined)
  assert.equal(crossRate(table, 'CHF', 'EUR'), Number((1 / 0.9227).toPrecision(6)))
  assert.equal(crossRate(table, 'CHF', 'USD'), Number((1.1193 / 0.9227).toPrecision(6)))
  assert.equal(crossRate(table, 'CHF', 'BDT'), null)
  assert.throws(() => parseEcb('<html>maintenance</html>'), /ecb_unexpected_format/)
})

test('display currency follows the visitor country, never the language', () => {
  const show = (country) => displayFor(country, 'CHF', table, NOW)
  assert.deepEqual(show('CH'), { currency: 'CHF', rate: 1, date: null, estimated: false })
  assert.deepEqual(show('LI'), { currency: 'CHF', rate: 1, date: null, estimated: false })
  for (const country of ['DE', 'FR', 'AT', 'IT', 'ES', 'NL', 'BE', 'IE', 'BG']) assert.equal(show(country).currency, 'EUR', country)
  assert.equal(show('GB').currency, 'GBP')
  assert.equal(show('US').currency, 'USD')
  assert.equal(show('CA').currency, 'CAD')
  assert.equal(show('JP').currency, 'JPY')
  assert.ok(show('DE').estimated && show('DE').date === '2026-10-23')
  // Monnaie non publiée par la BCE, pays inconnu : le montant débité, sans estimation.
  assert.equal(show('BD').currency, 'CHF')
  assert.equal(show('').currency, 'CHF')
  // Taux périmés (plus de 7 jours) : pas d'estimation.
  assert.equal(isFresh(table, Date.parse('2026-11-05T12:00:00Z')), false)
  assert.deepEqual(displayFor('DE', 'CHF', table, Date.parse('2026-11-05T12:00:00Z')), { currency: 'CHF', rate: 1, date: null, estimated: false })
  assert.equal(localCurrencyFor('ZZ'), null)
  // Changer de langue ne change pas la devise.
  const req = (cookie) => ({ headers: { cookie }, url: '/' })
  const display = (country, charge) => displayFor(country, charge, table, NOW)
  const fr = localeOf(req('lang=fr'), { env: {}, lookup: () => 'DE', display })
  const de = localeOf(req('lang=de'), { env: {}, lookup: () => 'DE', display })
  assert.equal(fr.lang, 'fr')
  assert.equal(de.lang, 'de')
  assert.deepEqual(fr.display, de.display)
  assert.equal(fr.currency, 'CHF')
})

test('every bundle converts consistently, and the charged CHF amount never changes', () => {
  for (const [country, expected] of [['DE', ['4,34 €', '7,59 €', '10,84 €']], ['GB', ['3,63 £', '6,35 £', '9,07 £']], ['US', ['4,85 $', '8,49 $', '12,13 $']], ['CA', ['6,79 CA$', '11,88 CA$', '16,98 CA$']]]) {
    const d = displayFor(country, 'CHF', table, NOW)
    const shown = OFFERS.map((o) => formatMoney(convert(o.price, d.rate, d.currency), d.currency, 'de').replace(/\s/g, ' '))
    assert.deepEqual(shown, expected, country)
    for (const o of OFFERS) {
      // Old price is converted at the same rate: the discount ratio stays the same to within rounding.
      const ratio = convert(o.price, d.rate, d.currency) / convert(o.compareAt, d.rate, d.currency)
      assert.ok(Math.abs(ratio - o.price / o.compareAt) < 0.005, `${country} ${o.id} discount`)
    }
  }
  assert.equal(currencyDigits('JPY'), 0)
  assert.equal(currencyDigits('IDR'), 0)
  assert.equal(convert(4, crossRate(table, 'CHF', 'JPY'), 'JPY'), 761)
  // Server-side order validation is unaffected by the display currency: CHF, recomputed from the offer.
  const order = validateOrder({ offerId: 'pack-2', termsAccepted: true, currency: 'EUR', total: 7.59, customer: { prenom: 'A', nom: 'B', email: 'a@b.ch', tel: '079 123 45 67', adresse: 'Rue 1', npa: '1003', ville: 'Lausanne' } }).order
  assert.deepEqual([order.total, order.currency], [7, 'CHF'])
})

test('the page carries the display currency so prices are right on first paint', () => {
  const html = '<html lang="fr-CH"><head><title>x</title></head><body></body></html>'
  const display = displayFor('GB', 'CHF', table, NOW)
  const out = injectLocale(html, { country: 'GB', currency: 'CHF', lang: 'fr', display })
  assert.match(out, /"display":\{"currency":"GBP","rate":0\.907424,"date":"2026-10-23","estimated":true\}/)
  assert.match(out, /"currency":"CHF"/)
})

test('rates are cached on disk and survive a failed refresh', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-fx-'))
  const log = { info() {}, warn() {} }
  try {
    const ok = createFx(dir, { env: {}, log, fetcher: async () => ({ ok: true, text: async () => XML }), intervalMs: 1e9 })
    await ok.ready
    assert.equal(JSON.parse(await readFile(join(dir, 'fx-rates.json'), 'utf8')).date, '2026-10-23')
    const down = createFx(dir, { env: {}, log, fetcher: async () => { throw new Error('offline') }, intervalMs: 1e9 })
    await down.ready
    assert.equal(down.table.date, '2026-10-23')
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
