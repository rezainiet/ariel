// Ajoute les traductions manquantes des avis publiés — reviews.json n'est jamais modifié.
//
//   DATA_DIR=/var/lib/ariel node server/translate-reviews.mjs --from server/migrations/<fichier>.json [--dry-run]
//   DATA_DIR=/var/lib/ariel DEEPL_API_KEY=… node server/translate-reviews.mjs --auto [--dry-run]
//
// --from : traductions relues, au format { "<id>": { "source": "fr", "hash": "…", "by": "…",
//          "translations": { "de": { "title": "…", "body": "…" } } } }.
//          Une entrée n'est appliquée que si l'avis existe et que son empreinte (titre + texte originaux)
//          correspond : la traduction porte donc exactement sur le texte publié.
// --auto : traduit par DeepL ce qui manque encore.
// Une traduction existante n'est jamais remplacée. review-translations.json est copié avant toute écriture,
// et l'empreinte de reviews.json est vérifiée avant et après.
import { createHash } from 'node:crypto'
import { copyFile, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { listReviews } from './reviews.mjs'
import { deeplTranslator, listTranslations, missingLangs, reviewHash, setTranslations, translateMissing } from './review-translations.mjs'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const from = args.includes('--from') ? args[args.indexOf('--from') + 1] : null
const auto = args.includes('--auto')
if (!process.env.DATA_DIR) throw new Error('Set DATA_DIR explicitly.')
if (!from && !auto) throw new Error('Use --from <file> and/or --auto.')
const dataDir = resolve(process.env.DATA_DIR)

const fileHash = async (file) => {
  try { return createHash('sha256').update(await readFile(file)).digest('hex') } catch { return null }
}
const reviewsFile = join(dataDir, 'reviews.json')
const before = await fileHash(reviewsFile)
const reviews = await listReviews(dataDir)
const byId = new Map(reviews.map((review) => [review.id, review]))
console.log(`${reviews.length} published reviews in ${dataDir}`)

if (!dryRun && await fileHash(join(dataDir, 'review-translations.json'))) {
  const backup = join(dataDir, `review-translations.json.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`)
  await copyFile(join(dataDir, 'review-translations.json'), backup)
  console.log(`Backup: ${backup}`)
}

if (from) {
  const entries = JSON.parse(await readFile(resolve(from), 'utf8'))
  let applied = 0, skipped = 0
  for (const [id, entry] of Object.entries(entries)) {
    const review = byId.get(id)
    if (!review) { console.log(`skip ${id}: no published review with this id`); skipped++; continue }
    if (entry.hash !== reviewHash(review)) { console.log(`skip ${id}: original text differs from the reviewed translation`); skipped++; continue }
    if (dryRun) { console.log(`would add ${Object.keys(entry.translations || {}).join(', ')} for ${id}`); continue }
    const added = await setTranslations(dataDir, review, entry.translations || {}, { by: entry.by || 'reviewed', source: entry.source })
    applied += added.length
  }
  console.log(`${dryRun ? 'Dry run: ' : ''}${applied} translation(s) added from ${from}; ${skipped} entr${skipped === 1 ? 'y' : 'ies'} skipped.`)
}

if (auto) {
  const translator = deeplTranslator(process.env)
  const store = await listTranslations(dataDir)
  const todo = reviews.filter((review) => missingLangs(review, store).length)
  if (!translator) console.log(`DEEPL_API_KEY not set: ${todo.length} review(s) stay in their original language.`)
  else if (dryRun) console.log(`Dry run: ${todo.length} review(s) would be sent to ${translator.name}.`)
  else {
    const result = await translateMissing(dataDir, todo, translator)
    console.log(`${result.translated} translation(s) added by ${translator.name}; ${result.failed} failed.`)
  }
}

const store = await listTranslations(dataDir)
const missing = reviews.reduce((n, review) => n + missingLangs(review, store).length, 0)
console.log(`Missing translations now: ${missing}`)
if ((await fileHash(reviewsFile)) !== before) throw new Error('reviews.json changed during the migration')
console.log('reviews.json unchanged.')
