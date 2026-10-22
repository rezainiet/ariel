import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { saveAnalytics, analyticsReport, summarizeAnalytics, pruneAnalytics } from './analytics.mjs'

test('visit snapshots are bounded, deduplicated, and summarized by first arrival', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ariel-analytics-'))
  const sessionId = randomUUID()
  const base = {
    sessionId, sequence: 1,
    source: { channel: 'meta', utmCampaign: 'autumn', clickIdType: 'fbclid' },
    pages: { home: { views: 1, activeSeconds: 3, maxScroll: 30 } },
    sections: { hero: { reached: true, activeSeconds: 3 } },
    funnel: { buyClick: 1 }, activeSeconds: 3, deepestSection: 'hero',
    customer: { email: 'private@example.ch' },
  }
  try {
    assert.equal(await saveAnalytics(dir, { ...base, sessionId: 'invalid' }), false)
    assert.equal(await saveAnalytics(dir, base), true)
    assert.equal(await saveAnalytics(dir, { ...base, sequence: 2, source: { channel: 'snapchat' }, activeSeconds: 12,
      pages: { home: { views: 1, activeSeconds: 12, maxScroll: 82 } },
      sections: { hero: { reached: true, activeSeconds: 4 }, story: { reached: true, activeSeconds: 8 } },
      funnel: { buyClick: 1, paymentRedirect: 1 }, deepestSection: 'story' }), true)
    await saveAnalytics(dir, base) // stale arrival must not overwrite the newer snapshot
    const raw = await readFile(join(dir, 'analytics-sessions', `${sessionId}.json`), 'utf8')
    assert.equal(raw.includes('private@example.ch'), false)
    const stored = JSON.parse(raw)
    assert.equal(stored.sequence, 2)
    assert.equal(stored.source.channel, 'meta')
    const report = await analyticsReport(dir, 24)
    assert.equal(report.sessions, 1)
    assert.equal(report.channels.find((c) => c.channel === 'meta').sessions, 1)
    assert.equal(report.channels.find((c) => c.channel === 'snapchat').sessions, 0)
    assert.equal(report.funnel.buyClick.events, 1)
    assert.equal(report.funnel.paymentRedirect.sessions, 1)
    assert.equal(report.sections.find((s) => s.key === 'story').avgSeconds, 8)
    assert.equal(report.sections.find((s) => s.key === 'story').deepest, 1)
    assert.equal(report.scrollDepth.find((s) => s.depth === 75).sessions, 1)
    await writeFile(join(dir, 'analytics-sessions', `${sessionId}.json`), JSON.stringify({ ...stored, lastSeenAt: new Date(0).toISOString() }))
    assert.equal(await pruneAnalytics(dir), 1)
    assert.equal((await analyticsReport(dir, 24)).sessions, 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('section dwell reports average, minimum and maximum among reached sessions', () => {
  const now = Date.now()
  const make = (activeSeconds, channel) => ({
    firstSeenAt: new Date(now - 1000).toISOString(), source: { channel }, activeSeconds,
    pages: { home: { views: 1, maxScroll: 50 } }, sections: { hero: { reached: true, activeSeconds } },
    funnel: {}, deepestSection: 'hero',
  })
  const report = summarizeAnalytics([make(5, 'direct'), make(15, 'snapchat')], 24, now)
  assert.equal(report.sections[0].avgSeconds, 10)
  assert.equal(report.sections[0].minSeconds, 5)
  assert.equal(report.sections[0].maxSeconds, 15)
  assert.equal(report.channels.find((c) => c.channel === 'direct').sessions, 1)
})
