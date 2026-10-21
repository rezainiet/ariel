import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { getFeaturedOffer, nextFeaturedOffer } from './featured-offer.mjs'

test('a featured bundle persists through reloads and rotates after its deadline', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-featured-'))
  try {
    const now = Date.UTC(2026, 9, 20, 12)
    const first = await getFeaturedOffer(dir, now, () => 0)
    assert.equal(Date.parse(first.endsAt) - now, 20 * 60_000)
    assert.deepEqual(await getFeaturedOffer(dir, now + 10 * 60_000, () => 0.9), first)
    const second = await getFeaturedOffer(dir, now + 20 * 60_000, () => 0.9)
    assert.notEqual(second.offerId, first.offerId)
    assert.equal(Date.parse(second.endsAt) - (now + 20 * 60_000), 38 * 60_000)
    assert.deepEqual(await getFeaturedOffer(dir, now + 21 * 60_000, () => 0), second)
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('each selection is one of the actual bundles', () => {
  for (const random of [0, 0.4, 0.999]) {
    const result = nextFeaturedOffer({ offerId: 'pack-2' }, 0, () => random)
    assert.ok(['pack-1', 'pack-3'].includes(result.offerId))
    assert.ok(Date.parse(result.endsAt) >= 20 * 60_000)
    assert.ok(Date.parse(result.endsAt) <= 40 * 60_000)
  }
})
