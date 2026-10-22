import { mkdir, readFile, readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { writeAtomic } from './orders.mjs'
import { CHANNELS } from '../src/lib/trafficSource.js'

const DIR = 'analytics-sessions'
const ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PAGES = ['home', 'checkout', 'other']
export const SECTIONS = ['hero', 'story', 'quantity', 'product', 'video', 'reviews', 'delivery', 'faq', 'final']
export const FUNNEL = ['addToCart', 'checkoutView', 'buyClick', 'checkoutInvalid', 'checkoutError', 'paymentRedirect', 'verifiedPurchase']
const HOURS = [24, 168, 720]
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000
const locks = new Map()

const count = (value, max = 100000) => Number.isFinite(value) ? Math.max(0, Math.min(max, Math.round(value))) : 0
const seconds = (value) => Number.isFinite(value) ? Math.max(0, Math.min(86400, Math.round(value * 10) / 10)) : 0
const shortText = (value, max = 100) => String(value || '').replace(/[^\p{L}\p{N} ._:/+-]/gu, '').slice(0, max)

export function cleanSnapshot(input) {
  if (!input || !ID_RE.test(input.sessionId || '') || !Number.isSafeInteger(input.sequence) || input.sequence < 1 || input.sequence > 1000000) return null
  const source = input.source && typeof input.source === 'object' ? input.source : {}
  const pages = Object.fromEntries(PAGES.map((key) => {
    const page = input.pages?.[key] || {}
    return [key, { views: count(page.views, 1000), activeSeconds: seconds(page.activeSeconds), maxScroll: count(page.maxScroll, 100) }]
  }))
  const sections = Object.fromEntries(SECTIONS.map((key) => {
    const section = input.sections?.[key] || {}
    return [key, { reached: section.reached === true, activeSeconds: seconds(section.activeSeconds) }]
  }))
  const funnel = Object.fromEntries(FUNNEL.map((key) => [key, count(input.funnel?.[key], 1000)]))
  return {
    sessionId: input.sessionId.toLowerCase(), sequence: input.sequence,
    source: {
      channel: CHANNELS.includes(source.channel) ? source.channel : 'direct',
      utmSource: shortText(source.utmSource, 80),
      utmCampaign: shortText(source.utmCampaign, 120),
      clickIdType: shortText(source.clickIdType, 20),
    },
    pages, sections, funnel,
    activeSeconds: seconds(input.activeSeconds),
    deepestSection: SECTIONS.includes(input.deepestSection) ? input.deepestSection : null,
  }
}

export async function saveAnalytics(dataDir, input) {
  const snapshot = cleanSnapshot(input)
  if (!snapshot) return false
  const dir = join(dataDir, DIR)
  const path = join(dir, `${snapshot.sessionId}.json`)
  const previous = locks.get(snapshot.sessionId) || Promise.resolve()
  const operation = previous.catch(() => {}).then(async () => {
    await mkdir(dir, { recursive: true })
    let existing = null
    try { existing = JSON.parse(await readFile(path, 'utf8')) } catch { /* new session */ }
    if (existing && existing.sequence >= snapshot.sequence) return
    const now = new Date().toISOString()
    await writeAtomic(path, JSON.stringify({
      ...snapshot,
      firstSeenAt: existing?.firstSeenAt || now,
      lastSeenAt: now,
      // The first arrival determines this visit's channel; later client updates cannot rewrite it.
      source: existing?.source || snapshot.source,
    }))
  }).finally(() => { if (locks.get(snapshot.sessionId) === operation) locks.delete(snapshot.sessionId) })
  locks.set(snapshot.sessionId, operation)
  await operation
  return true
}

const avg = (values) => values.length ? Math.round(values.reduce((sum, n) => sum + n, 0) / values.length) : 0
const reached = (session, key) => session.funnel?.[key] > 0

export function summarizeAnalytics(records, hours = 24, now = Date.now()) {
  const windowHours = HOURS.includes(hours) ? hours : 24
  const start = new Date(now - windowHours * 3600000).toISOString()
  const end = new Date(now).toISOString()
  const sessions = records.filter((r) => r && r.firstSeenAt >= start && r.firstSeenAt <= end)
  const home = sessions.filter((r) => r.pages?.home?.views > 0)
  const channels = CHANNELS.map((channel) => {
    const group = sessions.filter((r) => r.source?.channel === channel)
    return {
      channel, sessions: group.length, avgActiveSeconds: avg(group.map((r) => r.activeSeconds || 0)),
      buyClicks: group.reduce((sum, r) => sum + (r.funnel?.buyClick || 0), 0),
      redirects: group.filter((r) => reached(r, 'paymentRedirect')).length,
      verified: group.filter((r) => reached(r, 'verifiedPurchase')).length,
    }
  })
  const sections = SECTIONS.map((key) => {
    const group = home.filter((r) => r.sections?.[key]?.reached)
    const times = group.map((r) => r.sections[key].activeSeconds || 0)
    const minSeconds = times.length ? times.reduce((min, n) => Math.min(min, n), Infinity) : 0
    return {
      key, reached: group.length,
      deepest: home.filter((r) => r.deepestSection === key).length,
      avgSeconds: avg(times), minSeconds,
      maxSeconds: times.reduce((max, n) => Math.max(max, n), 0),
    }
  })
  const funnel = Object.fromEntries(FUNNEL.map((key) => [key, {
    sessions: sessions.filter((r) => reached(r, key)).length,
    events: sessions.reduce((sum, r) => sum + (r.funnel?.[key] || 0), 0),
  }]))
  return {
    start, end, hours: windowHours, sessions: sessions.length,
    homeSessions: home.length,
    avgActiveSeconds: avg(sessions.map((r) => r.activeSeconds || 0)),
    minActiveSeconds: sessions.length ? sessions.reduce((min, r) => Math.min(min, r.activeSeconds || 0), Infinity) : 0,
    maxActiveSeconds: sessions.reduce((max, r) => Math.max(max, r.activeSeconds || 0), 0),
    avgHomeScroll: avg(home.map((r) => r.pages.home.maxScroll || 0)),
    scrollDepth: [25, 50, 75, 90].map((depth) => ({ depth, sessions: home.filter((r) => r.pages.home.maxScroll >= depth).length })),
    channels, sections, funnel,
  }
}

export async function analyticsReport(dataDir, hours = 24) {
  const dir = join(dataDir, DIR)
  let names
  try { names = await readdir(dir) } catch (error) {
    if (error.code === 'ENOENT') return summarizeAnalytics([], hours)
    throw error
  }
  const now = Date.now()
  const records = await Promise.all(names.filter((name) => ID_RE.test(name.replace(/\.json$/, '')) && name.endsWith('.json')).map(async (name) => {
    const path = join(dir, name)
    try {
      const record = JSON.parse(await readFile(path, 'utf8'))
      if (Date.parse(record.lastSeenAt) < now - RETENTION_MS) {
        await unlink(path)
        return null
      }
      return record
    } catch { return null }
  }))
  return summarizeAnalytics(records, hours, now)
}

// Run at startup and daily so retention does not depend on an admin opening the report.
export async function pruneAnalytics(dataDir, now = Date.now()) {
  const dir = join(dataDir, DIR)
  let names
  try { names = await readdir(dir) } catch (error) {
    if (error.code === 'ENOENT') return 0
    throw error
  }
  let removed = 0
  for (const name of names) {
    if (!name.endsWith('.json') || !ID_RE.test(name.slice(0, -5))) continue
    const path = join(dir, name)
    try {
      const record = JSON.parse(await readFile(path, 'utf8'))
      if (Date.parse(record.lastSeenAt) >= now - RETENTION_MS) continue
      await unlink(path)
      removed += 1
    } catch { /* a concurrent update or a damaged file is ignored */ }
  }
  return removed
}
