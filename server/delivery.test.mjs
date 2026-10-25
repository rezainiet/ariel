import test from 'node:test'
import assert from 'node:assert/strict'
import { deliveryWindow, formatDeliveryWindow } from '../src/lib/deliveryWindow.js'

const iso = (d) => d.toISOString().slice(0, 10)
const win = (at, days = 3) => { const w = deliveryWindow(new Date(at), days); return [iso(w.from), iso(w.to)] }

test('delivery window: 2nd to 3rd working day after today (3-day estimate)', () => {
  assert.deepEqual(win('2026-10-26T09:00:00Z'), ['2026-10-28', '2026-10-29']) // lundi → mer.–jeu.
  assert.deepEqual(win('2026-10-30T09:00:00Z'), ['2026-11-03', '2026-11-04']) // vendredi → mar.–mer.
  assert.deepEqual(win('2026-10-31T09:00:00Z'), ['2026-11-03', '2026-11-04']) // samedi
  assert.deepEqual(win('2026-11-01T09:00:00Z'), ['2026-11-03', '2026-11-04']) // dimanche
  assert.deepEqual(win('2026-10-26T09:00:00Z', 5), ['2026-10-30', '2026-11-02'])
  assert.equal(deliveryWindow(new Date(), 0), null)
})

test('delivery window: "today" is the date in Zurich, not UTC', () => {
  // dimanche 23:30 UTC = lundi 00:30 à Zurich
  assert.deepEqual(win('2026-10-25T23:30:00Z'), ['2026-10-28', '2026-10-29'])
  // lundi 23:30 à Zurich (22:30 UTC) : encore lundi
  assert.deepEqual(win('2026-10-26T22:30:00Z'), ['2026-10-28', '2026-10-29'])
})

test('delivery window: Swiss public holidays are skipped', () => {
  assert.deepEqual(win('2026-12-24T09:00:00Z'), ['2026-12-29', '2026-12-30']) // Noël, Saint-Étienne, week-end
  assert.deepEqual(win('2026-12-29T09:00:00Z'), ['2026-12-31', '2027-01-04']) // Nouvel An, Saint-Berthold, week-end
  assert.deepEqual(win('2027-03-25T09:00:00Z'), ['2027-03-31', '2027-04-01']) // Vendredi saint, lundi de Pâques
  assert.deepEqual(win('2027-05-05T09:00:00Z'), ['2027-05-10', '2027-05-11']) // Ascension (jeudi 6 mai)
  assert.deepEqual(win('2028-07-28T09:00:00Z'), ['2028-08-02', '2028-08-03']) // Fête nationale (mardi 1er août)
})

test('delivery window: short labels in French and German, no year', () => {
  const sp = (s) => s.replace(/ – /g, '\u2009–\u2009')
  const w = (a, b) => ({ from: new Date(`${a}T12:00:00Z`), to: new Date(`${b}T12:00:00Z`) })
  assert.equal(formatDeliveryWindow(w('2026-10-28', '2026-10-29'), 'fr-CH'), '28–29 oct.')
  assert.equal(formatDeliveryWindow(w('2026-10-28', '2026-10-29'), 'de-CH'), '28.–29. Okt.')
  assert.equal(formatDeliveryWindow(w('2026-10-30', '2026-11-02'), 'fr-CH'), sp('30 oct. – 2 nov.'))
  assert.equal(formatDeliveryWindow(w('2026-12-31', '2027-01-04'), 'fr-CH'), sp('31 déc. – 4 janv.'))
  assert.equal(formatDeliveryWindow(w('2026-12-31', '2027-01-04'), 'de-CH'), sp('31. Dez. – 4. Jan.'))
  assert.match(formatDeliveryWindow(w('2026-10-28', '2026-10-29'), 'fr-CH', { long: true }), /^mercredi 28\s–\sjeudi 29 octobre$/)
})
