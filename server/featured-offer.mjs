import { mkdir, readFile, writeFile, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { OFFERS } from '../src/config/offers.js'

const MINUTES_MIN = 20
const MINUTES_SPAN = 21
let inflight = null

export function nextFeaturedOffer(previous, now = Date.now(), random = Math.random) {
  const choices = OFFERS.map((offer) => offer.id).filter((id) => id !== previous?.offerId)
  const offerId = choices[Math.floor(random() * choices.length)] || OFFERS[0].id
  const minutes = MINUTES_MIN + Math.floor(random() * MINUTES_SPAN)
  return { offerId, endsAt: new Date(now + minutes * 60_000).toISOString() }
}

export async function getFeaturedOffer(dataDir, now = Date.now(), random = Math.random) {
  if (inflight) return inflight
  inflight = (async () => {
    const file = join(dataDir, 'featured-offer.json')
    let previous = null
    try { previous = JSON.parse(await readFile(file, 'utf8')) } catch { /* first run */ }
    if (OFFERS.some((offer) => offer.id === previous?.offerId) && Date.parse(previous.endsAt) > now) return previous
    const next = nextFeaturedOffer(previous, now, random)
    await mkdir(dataDir, { recursive: true })
    const temp = `${file}.tmp`
    await writeFile(temp, JSON.stringify(next), 'utf8')
    await rename(temp, file)
    return next
  })()
  try { return await inflight } finally { inflight = null }
}
