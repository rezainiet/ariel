// Traductions des avis — stockées À CÔTÉ des avis (DATA_DIR/review-translations.json), jamais dans
// reviews.json : l'avis publié reste exactement tel que le client l'a écrit.
//
//   { "<id de l'avis>": { "source": "fr", "hash": "<empreinte du titre et du texte originaux>",
//                          "translations": { "de": { "title": "…", "body": "…", "by": "deepl", "at": "…" } } } }
//
// Une traduction n'est servie que si l'empreinte correspond encore au texte original : un avis modifié
// retombe sur sa version originale tant qu'il n'est pas retraduit. Sans traduction : l'original est affiché.
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { LANGS, isLang } from '../src/i18n/detect.js'

export const REVIEW_LANGS = LANGS
// Langue des avis publiés avant que la langue ne soit enregistrée avec l'avis.
export const DEFAULT_REVIEW_LANG = 'fr'
const FILE = 'review-translations.json'
let queue = Promise.resolve()

function withLock(action) {
  const next = queue.then(action)
  queue = next.catch(() => {})
  return next
}

export const reviewHash = (review) =>
  createHash('sha256').update(JSON.stringify([review.title || '', review.body || ''])).digest('hex').slice(0, 16)

export const sourceLang = (review, entry) =>
  (isLang(review.lang) && review.lang) || (isLang(entry?.source) && entry.source) || DEFAULT_REVIEW_LANG

export async function listTranslations(dataDir) {
  try {
    const data = JSON.parse(await readFile(join(dataDir, FILE), 'utf8'))
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  } catch { return {} }
}

async function saveTranslations(dataDir, store) {
  await mkdir(dataDir, { recursive: true })
  const file = join(dataDir, FILE)
  await writeFile(`${file}.tmp`, JSON.stringify(store, null, 2), 'utf8')
  await rename(`${file}.tmp`, file)
}

// Traduction complète et à jour pour cette langue, sinon null.
function validTranslation(review, entry, lang) {
  if (!entry || entry.hash !== reviewHash(review)) return null
  const t = entry.translations?.[lang]
  if (!t || typeof t.body !== 'string' || !t.body.trim()) return null
  if (review.title && (typeof t.title !== 'string' || !t.title.trim())) return null
  return t
}

// Avis + langue d'origine + traductions servables (titre et texte ; `by` en plus pour l'administration).
export function withTranslations(reviews, store, { meta = false } = {}) {
  return reviews.map((review) => {
    const entry = store[review.id]
    const lang = sourceLang(review, entry)
    const translations = {}
    for (const target of REVIEW_LANGS) {
      const t = target !== lang && validTranslation(review, entry, target)
      if (t) translations[target] = { title: review.title ? t.title : '', body: t.body, ...(meta ? { by: t.by || '', at: t.at || '' } : {}) }
    }
    return { ...review, lang, translations }
  })
}

export const missingLangs = (review, store) => {
  const lang = sourceLang(review, store[review.id])
  return REVIEW_LANGS.filter((target) => target !== lang && !validTranslation(review, store[review.id], target))
}

// Enregistre des traductions sans jamais remplacer une traduction valide existante (sauf `replace`).
// `results` : { de: { title, body } } ; `source` : langue d'origine pour un avis qui ne la porte pas.
export function setTranslations(dataDir, review, results, { by, source, replace = false } = {}) {
  return withLock(async () => {
    const store = await listTranslations(dataDir)
    const hash = reviewHash(review)
    const current = store[review.id]
    const entry = current && current.hash === hash
      ? { ...current, translations: { ...current.translations } }
      : { source: sourceLang(review, { source }), hash, translations: {} }
    if (!review.lang && isLang(source)) entry.source = source
    const lang = sourceLang(review, entry)
    const added = []
    for (const [target, t] of Object.entries(results)) {
      if (!REVIEW_LANGS.includes(target) || target === lang || !t?.body?.trim()) continue
      if (review.title && !t.title?.trim()) continue
      if (!replace && validTranslation(review, entry, target)) continue
      entry.translations[target] = { title: review.title ? t.title.trim() : '', body: t.body.trim(), by: by || 'manual', at: new Date().toISOString() }
      added.push(target)
    }
    if (added.length || !current || current.hash !== hash) {
      store[review.id] = entry
      await saveTranslations(dataDir, store)
    }
    return added
  })
}

export function removeTranslations(dataDir, id) {
  return withLock(async () => {
    const store = await listTranslations(dataDir)
    if (!store[id]) return false
    delete store[id]
    await saveTranslations(dataDir, store)
    return true
  })
}

// DeepL (DEEPL_API_KEY ; les clés gratuites se terminent par « :fx »). Sans clé : aucune traduction automatique.
// Seuls le titre et le texte de l'avis sont envoyés (ni nom, ni lieu, ni photo).
export function deeplTranslator(env = process.env, fetchImpl = globalThis.fetch) {
  const key = String(env.DEEPL_API_KEY || '').trim()
  if (!key) return null
  const url = key.endsWith(':fx') ? 'https://api-free.deepl.com/v2/translate' : 'https://api.deepl.com/v2/translate'
  return {
    name: 'deepl',
    async translate(texts, from, to) {
      const res = await fetchImpl(url, {
        method: 'POST',
        headers: { Authorization: `DeepL-Auth-Key ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texts, source_lang: from.toUpperCase(), target_lang: to === 'en' ? 'EN-GB' : to.toUpperCase(), preserve_formatting: true }),
        signal: AbortSignal.timeout(15_000),
      })
      if (!res.ok) throw new Error(`deepl_${res.status}`)
      const out = (await res.json())?.translations?.map((t) => t?.text)
      if (!Array.isArray(out) || out.length !== texts.length || out.some((t) => typeof t !== 'string' || !t.trim())) throw new Error('deepl_bad_response')
      return out
    },
  }
}

// Traduit ce qui manque (avis donnés, langues manquantes) et met en cache. Une erreur n'arrête pas les autres avis.
export async function translateMissing(dataDir, reviews, translator, { log = console } = {}) {
  const result = { translated: 0, failed: 0 }
  if (!translator) return result
  for (const review of reviews) {
    const store = await listTranslations(dataDir)
    const from = sourceLang(review, store[review.id])
    const out = {}
    for (const to of missingLangs(review, store)) {
      try {
        const texts = review.title ? [review.title, review.body] : [review.body]
        const [a, b] = await translator.translate(texts, from, to)
        out[to] = review.title ? { title: a, body: b } : { title: '', body: a }
      } catch (error) {
        result.failed++
        log.error?.(`[reviews] translation ${review.id} ${from}→${to} failed: ${error.message}`)
      }
    }
    if (Object.keys(out).length) result.translated += (await setTranslations(dataDir, review, out, { by: translator.name })).length
  }
  return result
}
