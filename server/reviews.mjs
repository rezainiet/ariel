import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'

const IMAGE_RE = /^\/review-images\/([0-9a-f-]{36})\.(png|jpg|webp)$/
const MAX_IMAGE = 2 * 1024 * 1024
let queue = Promise.resolve()

function withLock(action) {
  const next = queue.then(action)
  queue = next.catch(() => {})
  return next
}

export async function listReviews(dataDir) {
  try {
    const records = JSON.parse(await readFile(join(dataDir, 'reviews.json'), 'utf8'))
    return Array.isArray(records) ? records : []
  } catch { return [] }
}

async function saveReviews(dataDir, reviews) {
  await mkdir(dataDir, { recursive: true })
  const file = join(dataDir, 'reviews.json')
  const temp = `${file}.tmp`
  await writeFile(temp, JSON.stringify(reviews, null, 2), 'utf8')
  await rename(temp, file)
}

export function validateReview(input) {
  const errors = {}
  const author = String(input?.author || '').trim()
  const title = String(input?.title || '').trim()
  const body = String(input?.body || '').trim()
  const location = String(input?.location || '').trim()
  const rating = Number(input?.rating)
  const photos = input?.photos ?? []
  const source = input?.source ?? null
  if (!author || author.length > 80) errors.author = 'Nom requis (80 caractères maximum).'
  if (!body || body.length > 1200) errors.body = 'Avis requis (1 200 caractères maximum).'
  if (title.length > 100) errors.title = 'Titre trop long.'
  if (location.length > 80) errors.location = 'Localité trop longue.'
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = 'Choisissez une note de 1 à 5.'
  if (!Array.isArray(photos) || photos.length > 3 || photos.some((photo) => typeof photo !== 'string' || !IMAGE_RE.test(photo))) errors.photos = 'Trois images téléversées au maximum.'
  if (source !== null && (!source || typeof source !== 'object' || typeof source.label !== 'string' || source.label.length > 80 || !source.label.trim() || typeof source.variant !== 'string' || source.variant.length > 120 || !source.variant.trim() || typeof source.originalDate !== 'string' || source.originalDate.length > 40 || !source.originalDate.trim() || typeof source.url !== 'string' || !/^https:\/\/[^\s]+$/i.test(source.url))) errors.source = 'Source externe invalide.'
  if (Object.keys(errors).length) return { ok: false, errors }
  return { ok: true, review: { id: randomUUID(), author, title, body, location, rating,
    photos, date: new Date().toISOString().slice(0, 10), verified: false,
    ...(source ? { source: { label: source.label.trim(), url: source.url, variant: source.variant.trim(), originalDate: source.originalDate.trim() } } : {}) } }
}

export async function addReview(dataDir, input) {
  const checked = validateReview(input)
  if (!checked.ok) return checked
  return withLock(async () => {
    const reviews = await listReviews(dataDir)
    reviews.unshift(checked.review)
    await saveReviews(dataDir, reviews)
    return { ok: true, review: checked.review }
  })
}

export async function deleteReview(dataDir, id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return false
  return withLock(async () => {
    const reviews = await listReviews(dataDir)
    const review = reviews.find((item) => item.id === id)
    if (!review) return false
    const remaining = reviews.filter((item) => item.id !== id)
    await saveReviews(dataDir, remaining)
    for (const photo of review.photos) {
      if (remaining.some((item) => item.photos.includes(photo))) continue
      const match = IMAGE_RE.exec(photo)
      if (match) await unlink(join(dataDir, 'review-images', `${match[1]}.${match[2]}`)).catch(() => {})
    }
    return true
  })
}

export async function saveReviewImage(dataDir, dataUrl) {
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''))
  if (!match) return { ok: false, error: 'invalid_image' }
  const bytes = Buffer.from(match[2], 'base64')
  if (!bytes.length || bytes.length > MAX_IMAGE) return { ok: false, error: 'invalid_image' }
  const type = match[1]
  const valid = type === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : type === 'jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP'
  if (!valid) return { ok: false, error: 'invalid_image' }
  const ext = type === 'jpeg' ? 'jpg' : type
  const id = randomUUID()
  await mkdir(join(dataDir, 'review-images'), { recursive: true })
  await writeFile(join(dataDir, 'review-images', `${id}.${ext}`), bytes, { flag: 'wx', mode: 0o600 })
  return { ok: true, url: `/review-images/${id}.${ext}` }
}

export function reviewImageFile(dataDir, path) {
  const match = IMAGE_RE.exec(path)
  return match ? { file: join(dataDir, 'review-images', `${match[1]}.${match[2]}`), type: match[2] === 'jpg' ? 'image/jpeg' : `image/${match[2]}` } : null
}
