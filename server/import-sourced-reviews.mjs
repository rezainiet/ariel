// One-time import of attributed, translated summaries of public product reviews.
// Run with DATA_DIR set to the same directory as the server. Existing matches are skipped.
import { resolve } from 'node:path'
import { addReview, listReviews } from './reviews.mjs'

if (!process.env.DATA_DIR) throw new Error('Set DATA_DIR explicitly before importing reviews.')
const dataDir = resolve(process.env.DATA_DIR)
const testbericht = {
  label: 'Testbericht.de',
  url: 'https://www.testbericht.de/serien/waschmittel/736549-ariel-allin1-pods-universalwaschmittel',
  variant: 'Universal+ (contenances diverses)',
}
const rewe = {
  label: 'REWE Produkttests',
  url: 'https://produkttests.rewe.de/test/ariel/all-in-one-pods',
  variant: 'All-in-1 PODS (contenance non précisée)',
}

const reviews = [
  { author: 'Luke', rating: 5, body: 'Satisfait du nettoyage des taches tenaces et du parfum du linge ; il en a recommandé en quantité.', source: { ...testbericht, originalDate: 'Décembre 2025' } },
  { author: 'Fischetti A', rating: 5, body: 'Apprécie la simplicité du dosage et les résultats à basse température, tout en trouvant le prix élevé.', source: { ...testbericht, originalDate: 'Décembre 2025' } },
  { author: 'Dustin', rating: 5, body: 'Se dit satisfait des résultats réguliers et du rapport qualité-prix de son grand paquet.', source: { ...testbericht, originalDate: 'Novembre 2025' } },
  { author: 'Tobias', rating: 5, body: 'Trouve les capsules simples à utiliser, efficaces et rapides à dissoudre.', source: { ...testbericht, originalDate: 'Juin 2025' } },
  { author: 'ZooneinrappermusikZooneinrappermusik', rating: 5, body: 'Rapporte une bonne élimination des taches et une dissolution rapide dans l’eau froide.', source: { ...testbericht, originalDate: 'Mai 2025' } },
  { author: 'A.A.', rating: 4, body: 'Préfère le dosage des capsules à la poudre et apprécie le résultat, sans résidus dans le tiroir.', source: { ...testbericht, originalDate: 'Septembre 2025' } },
  { author: 'Richard', rating: 4, body: 'Juge le nettoyage convaincant, mais trouve l’odeur chimique trop forte.', source: { ...testbericht, originalDate: 'Mai 2025' } },
  { author: 'MuKa14', rating: 5, body: 'Apprécie le lavage à basse température et le dosage pratique, mais trouve le prix élevé.', source: { ...rewe, originalDate: '15 octobre 2023' } },
  { author: 'Lisa', rating: 5, body: 'Indique que le linge ressort propre et que les capsules se dissolvent entièrement.', source: { ...rewe, originalDate: '15 octobre 2023' } },
  { author: 'Lora84', rating: 5, body: 'Satisfaite dans l’ensemble, elle note toutefois que certaines taches, comme le sang, résistent.', source: { ...rewe, originalDate: '10 octobre 2023' } },
]

const existing = await listReviews(dataDir)
let added = 0
for (const review of reviews) {
  if (existing.some((item) => item.author === review.author && item.source?.url === review.source.url)) continue
  const result = await addReview(dataDir, { ...review, photos: [] })
  if (!result.ok) throw new Error(`Invalid sourced review: ${JSON.stringify(result.errors)}`)
  added++
}
console.log(`Imported ${added} sourced reviews; ${reviews.length - added} already present.`)
