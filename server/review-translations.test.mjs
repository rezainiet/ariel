import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { addReview, listReviews, validateReview } from './reviews.mjs'
import { deeplTranslator, listTranslations, missingLangs, removeTranslations, reviewHash, setTranslations, translateMissing, withTranslations, REVIEW_LANGS } from './review-translations.mjs'
import { reviewText } from '../src/lib/reviewText.js'

const others = (lang) => REVIEW_LANGS.filter((l) => l !== lang)
const tempDir = () => mkdtemp(join(tmpdir(), 'ariel-review-tr-'))
const fakeTranslator = (calls = []) => ({
  name: 'fake',
  async translate(texts, from, to) { calls.push(`${from}>${to}`); return texts.map((t) => `[${to}] ${t}`) },
})

test('translations live beside the review: originals are never rewritten', async () => {
  const dir = await tempDir()
  try {
    const { review } = await addReview(dir, { author: 'Nadia P.', rating: 4, title: 'Livraison rapide', body: 'Reçu jeudi, tout est conforme.', photos: [] })
    const before = await readFile(join(dir, 'reviews.json'), 'utf8')
    const target = others('fr')[0]
    assert.deepEqual(await setTranslations(dir, review, { [target]: { title: 'T', body: 'B' }, fr: { title: 'x', body: 'y' } }, { by: 'reviewed', source: 'fr' }), [target])
    // une traduction valide n'est jamais remplacée (sauf demande explicite)
    assert.deepEqual(await setTranslations(dir, review, { [target]: { title: 'T2', body: 'B2' } }, { by: 'deepl' }), [])
    assert.equal(await readFile(join(dir, 'reviews.json'), 'utf8'), before)
    const [served] = withTranslations(await listReviews(dir), await listTranslations(dir))
    assert.equal(served.lang, 'fr')
    assert.equal(served.title, 'Livraison rapide')
    assert.equal(served.body, 'Reçu jeudi, tout est conforme.')
    assert.equal(served.rating, 4)
    assert.equal(served.author, 'Nadia P.')
    assert.deepEqual(served.translations[target], { title: 'T', body: 'B' })
    assert.equal(served.translations.fr, undefined)
    // admin : la provenance est visible
    assert.equal(withTranslations([review], await listTranslations(dir), { meta: true })[0].translations[target].by, 'reviewed')
    assert.equal(await removeTranslations(dir, review.id), true)
    assert.deepEqual(await listTranslations(dir), {})
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('a translation of an older text is never shown for an edited review', async () => {
  const review = { id: 'a', author: 'A', rating: 5, title: 'Titre', body: 'Texte', date: '2026-10-23' }
  const target = others('fr')[0]
  const store = { a: { source: 'fr', hash: reviewHash(review), translations: { [target]: { title: 'T', body: 'B' } } } }
  assert.ok(withTranslations([review], store)[0].translations[target])
  const edited = { ...review, body: 'Texte modifié' }
  assert.deepEqual(withTranslations([edited], store)[0].translations, {})
  assert.deepEqual(missingLangs(edited, store), others('fr'))
  // titre original sans titre traduit : traduction incomplète, donc ignorée
  const partial = { a: { ...store.a, translations: { [target]: { title: '', body: 'B' } } } }
  assert.deepEqual(withTranslations([review], partial)[0].translations, {})
})

test('new reviews keep their language; translations are cached and failures fall back to the original', async () => {
  const dir = await tempDir()
  try {
    assert.equal(validateReview({ author: 'A', rating: 5, body: 'B', lang: 'xx' }).ok, false)
    const target = others('fr')[0]
    const { review } = await addReview(dir, { author: 'Lena', rating: 5, body: 'Sehr gut.', lang: target, photos: [] })
    assert.equal(review.lang, target)
    const calls = []
    const first = await translateMissing(dir, [review], fakeTranslator(calls))
    assert.equal(first.translated, others(target).length)
    assert.ok(calls.every((c) => c.startsWith(`${target}>`)))
    const again = await translateMissing(dir, [review], fakeTranslator(calls))
    assert.equal(again.translated, 0)
    assert.equal(calls.length, others(target).length) // rien n'est retraduit
    const broken = { name: 'broken', async translate() { throw new Error('down') } }
    const { review: other } = await addReview(dir, { author: 'Marc', rating: 3, body: 'Correct.', photos: [] })
    const result = await translateMissing(dir, [other], broken, { log: { error() {} } })
    assert.equal(result.failed, others('fr').length)
    assert.deepEqual(withTranslations([other], await listTranslations(dir))[0].translations, {})
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('DeepL client: off without a key, free endpoint for :fx keys, strict response check', async () => {
  assert.equal(deeplTranslator({}), null)
  const seen = []
  const fetchOk = async (url, init) => {
    seen.push({ url, body: JSON.parse(init.body), auth: init.headers.Authorization })
    return { ok: true, json: async () => ({ translations: JSON.parse(init.body).text.map((t) => ({ text: `de:${t}` })) }) }
  }
  const t = deeplTranslator({ DEEPL_API_KEY: 'abc:fx' }, fetchOk)
  assert.deepEqual(await t.translate(['Titre', 'Texte'], 'fr', 'de'), ['de:Titre', 'de:Texte'])
  await t.translate(['Texte'], 'fr', 'en')
  assert.equal(seen[0].url, 'https://api-free.deepl.com/v2/translate')
  assert.equal(seen[0].auth, 'DeepL-Auth-Key abc:fx')
  assert.deepEqual([seen[0].body.source_lang, seen[0].body.target_lang, seen[1].body.target_lang], ['FR', 'DE', 'EN-GB'])
  assert.equal(deeplTranslator({ DEEPL_API_KEY: 'pro' }, fetchOk).name, 'deepl')
  const bad = deeplTranslator({ DEEPL_API_KEY: 'k' }, async () => ({ ok: true, json: async () => ({ translations: [{ text: '' }] }) }))
  await assert.rejects(bad.translate(['x'], 'fr', 'de'), /bad_response/)
  const down = deeplTranslator({ DEEPL_API_KEY: 'k' }, async () => ({ ok: false, status: 456 }))
  await assert.rejects(down.translate(['x'], 'fr', 'de'), /deepl_456/)
})

test('migration: adds reviewed translations once, skips changed texts, leaves reviews.json untouched', async () => {
  const dir = await tempDir()
  try {
    const legacy = [
      { id: '11111111-1111-4111-8111-111111111111', author: 'Léa M.', title: 'Parfait', body: 'Rien à redire.', location: '', rating: 5, photos: [], date: '2026-10-22', verified: false },
      { id: '22222222-2222-4222-8222-222222222222', author: 'Hugo P.', title: '', body: 'Sérieux.', location: '', rating: 4, photos: [], date: '2026-10-23', verified: false },
    ]
    const raw = JSON.stringify(legacy, null, 2)
    await writeFile(join(dir, 'reviews.json'), raw)
    const target = others('fr')[0]
    const file = join(dir, 'reviewed.json')
    await writeFile(file, JSON.stringify({
      [legacy[0].id]: { source: 'fr', hash: reviewHash(legacy[0]), by: 'claude', translations: { [target]: { title: 'Perfekt', body: 'Nichts auszusetzen.' } } },
      [legacy[1].id]: { source: 'fr', hash: 'stale', by: 'claude', translations: { [target]: { title: '', body: 'Seriös.' } } },
      'unknown-id': { source: 'fr', hash: 'x', translations: {} },
    }))
    const run = (...extra) => execFileSync(process.execPath, ['server/translate-reviews.mjs', '--from', file, ...extra], { env: { ...process.env, DATA_DIR: dir, DEEPL_API_KEY: '' }, encoding: 'utf8' })
    const dry = run('--dry-run')
    assert.match(dry, /Dry run: 0 translation/)
    assert.deepEqual(await listTranslations(dir), {})
    const out = run()
    assert.match(out, /1 translation\(s\) added/)
    assert.match(out, /2 entries skipped/)
    assert.match(out, /reviews.json unchanged/)
    assert.equal(await readFile(join(dir, 'reviews.json'), 'utf8'), raw)
    const served = withTranslations(await listReviews(dir), await listTranslations(dir), { meta: true })
    assert.equal(served[0].translations[target].body, 'Nichts auszusetzen.')
    assert.equal(served[0].translations[target].by, 'claude')
    assert.deepEqual(served[1].translations, {})
    // second passage : rien n'est remplacé, une copie de sauvegarde est faite
    assert.match(run(), /0 translation\(s\) added/)
    assert.ok((await readdir(dir)).some((f) => f.startsWith('review-translations.json.bak-')))
  } finally { await rm(dir, { recursive: true, force: true }) }
})

test('storefront picks the visitor language, shows the original otherwise', () => {
  const target = others('fr')[0]
  const review = { title: 'Parfait', body: 'Rien à redire.', lang: 'fr', translations: { [target]: { title: 'T', body: 'B' } } }
  assert.deepEqual(reviewText(review, 'fr'), { title: 'Parfait', body: 'Rien à redire.', lang: 'fr', source: 'fr', translated: false, canToggle: false })
  assert.deepEqual(reviewText(review, target), { title: 'T', body: 'B', lang: target, source: 'fr', translated: true, canToggle: true })
  assert.equal(reviewText(review, target, { original: true }).body, 'Rien à redire.')
  assert.equal(reviewText(review, target, { original: true }).canToggle, true)
  const untranslated = { title: 'Parfait', body: 'Rien à redire.', translations: {} }
  assert.equal(reviewText(untranslated, target).body, 'Rien à redire.')
  assert.equal(reviewText(untranslated, target).lang, 'fr')
  assert.equal(reviewText(untranslated, target).canToggle, false)
})
