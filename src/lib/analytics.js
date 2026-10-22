import { classify } from './trafficSource.js'

// First-party visit measurements. Started only after marketing consent; no
// customer fields, raw referrer URLs, click IDs, or browser fingerprint leave the page.
const KEY = 'analytics.session.v1'
const SESSION_IDLE_MS = 30 * 60 * 1000
const ACTIVE_IDLE_MS = 2 * 60 * 1000
const SECTION_KEYS = ['hero', 'story', 'quantity', 'product', 'video', 'reviews', 'delivery', 'faq', 'final']
const FUNNEL_KEYS = ['addToCart', 'checkoutView', 'buyClick', 'checkoutInvalid', 'checkoutError', 'paymentRedirect', 'verifiedPurchase']
const arrival = typeof window === 'undefined' ? null : classify(new URLSearchParams(window.location.search), document.referrer, window.location.hostname)

let visit = null
let currentPage = null
let lastPath = ''
let lastTick = 0
let lastInteraction = 0
let lastFlush = 0

const pageKey = (path) => path === '/' ? 'home' : path === '/checkout' ? 'checkout' : path.startsWith('/admin') ? null : 'other'
const pageDefault = () => ({ views: 0, activeSeconds: 0, maxScroll: 0 })
const sectionDefault = () => ({ reached: false, activeSeconds: 0 })

function newVisit(source = arrival) {
  return {
    sessionId: crypto.randomUUID(), sequence: 0,
    source: {
      channel: source?.channel || 'direct', utmSource: source?.utmSource || '',
      utmCampaign: source?.utmCampaign || '', clickIdType: source?.clickIdType || '',
    },
    pages: { home: pageDefault(), checkout: pageDefault(), other: pageDefault() },
    sections: Object.fromEntries(SECTION_KEYS.map((key) => [key, sectionDefault()])),
    funnel: Object.fromEntries(FUNNEL_KEYS.map((key) => [key, 0])),
    activeSeconds: 0, deepestSection: null, lastActiveAt: Date.now(),
  }
}

function persist() {
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...visit, savedAt: Date.now() })) } catch { /* memory-only visit */ }
}

function flush(beacon = false) {
  if (!visit) return
  visit.sequence += 1
  lastFlush = performance.now()
  persist()
  const body = JSON.stringify(visit)
  if (beacon && navigator.sendBeacon) {
    if (navigator.sendBeacon('/api/analytics', new Blob([body], { type: 'application/json' }))) return
  }
  fetch('/api/analytics', { method: 'POST', credentials: 'same-origin', keepalive: true,
    headers: { 'Content-Type': 'application/json' }, body }).catch(() => {})
}

function sectionsOnScreen() {
  if (currentPage !== 'home') return
  const elements = [...document.querySelectorAll('[data-analytics-section]')]
  let deepest = -1
  for (const element of elements) {
    const key = element.dataset.analyticsSection
    const index = SECTION_KEYS.indexOf(key)
    if (index < 0) continue
    const rect = element.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
      visit.sections[key].reached = true
      deepest = Math.max(deepest, index)
    }
  }
  if (deepest >= 0 && deepest > SECTION_KEYS.indexOf(visit.deepestSection)) visit.deepestSection = SECTION_KEYS[deepest]
  const height = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  visit.pages.home.maxScroll = Math.max(visit.pages.home.maxScroll, height ? Math.min(100, Math.round(window.scrollY / height * 100)) : 100)
}

function centeredSection() {
  const center = window.innerHeight * 0.5
  return [...document.querySelectorAll('[data-analytics-section]')].find((element) => {
    const rect = element.getBoundingClientRect()
    return rect.top <= center && rect.bottom >= center
  })?.dataset.analyticsSection || null
}

function tick() {
  if (!visit) return
  const now = performance.now()
  const delta = Math.max(0, Math.min(2, (now - lastTick) / 1000))
  lastTick = now
  sectionsOnScreen()
  if (document.visibilityState === 'visible' && document.hasFocus() && now - lastInteraction < ACTIVE_IDLE_MS) {
    visit.activeSeconds += delta
    if (currentPage) visit.pages[currentPage].activeSeconds += delta
    if (currentPage === 'home') {
      const key = centeredSection()
      if (key && visit.sections[key]) visit.sections[key].activeSeconds += delta
    }
  }
  if (now - lastFlush >= 10000 && now - lastInteraction < ACTIVE_IDLE_MS) flush()
}

function onInteraction() {
  if (!visit) return
  const now = performance.now()
  if (now - lastInteraction >= SESSION_IDLE_MS) {
    flush()
    visit = newVisit({ channel: 'direct' })
    currentPage = null
    lastPath = ''
    lastTick = lastFlush = now
    lastInteraction = now
    trackAnalyticsPage(window.location.pathname)
  } else {
    lastInteraction = now
    visit.lastActiveAt = Date.now()
  }
}

export function trackAnalyticsPage(path = window.location.pathname) {
  if (!visit || path === lastPath) return
  lastPath = path
  currentPage = pageKey(path)
  if (!currentPage) return
  visit.pages[currentPage].views += 1
  if (currentPage === 'checkout') visit.funnel.checkoutView += 1
  sectionsOnScreen()
  flush()
}

export function trackAnalyticsEvent(name) {
  if (!visit || !FUNNEL_KEYS.includes(name)) return
  visit.funnel[name] += 1
  flush()
}

export function initAnalytics() {
  if (visit || typeof window === 'undefined' || window.location.pathname.startsWith('/admin')) return
  try { if (localStorage.getItem('consent.marketing.v1') !== 'granted') return } catch { return }
  let saved = null
  try { saved = JSON.parse(sessionStorage.getItem(KEY) || 'null') } catch { /* new visit */ }
  const newAdChannel = arrival && arrival.channel !== 'direct' && saved?.source?.channel !== arrival.channel
  const usable = saved && Date.now() - saved.lastActiveAt < SESSION_IDLE_MS &&
    !newAdChannel &&
    saved.sessionId && saved.pages?.home && saved.pages?.checkout && saved.pages?.other &&
    SECTION_KEYS.every((key) => saved.sections?.[key]) && FUNNEL_KEYS.every((key) => Number.isFinite(saved.funnel?.[key]))
  visit = usable ? saved : newVisit()
  lastTick = lastInteraction = performance.now()
  lastFlush = lastTick
  trackAnalyticsPage()
  window.addEventListener('scroll', sectionsOnScreen, { passive: true })
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) {
    window.addEventListener(type, onInteraction, { passive: true })
  }
  document.addEventListener('visibilitychange', () => {
    tick()
    if (document.visibilityState === 'hidden') flush(true)
    else onInteraction()
  })
  window.addEventListener('pagehide', () => { tick(); flush(true) })
  setInterval(tick, 1000)
}
