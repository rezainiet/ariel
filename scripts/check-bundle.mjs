// Garde-fou de build : échoue si des données d'exemple ou des routes internes
// se retrouvent dans le bundle de production.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const FORBIDDEN = [
  // avis d'exemple (src/data/reviews.js, bloc DEV)
  'Camille R.',
  'Pratique au quotidien',
  'Yverdon-les-Bains',
  // marqueurs « à fournir » (Pending.jsx, dev uniquement)
  'À fournir :',
  // aperçu d'urgence (src/lib/storeStatus.js, bloc DEV) : jamais de stock ou de compte à rebours d'exemple
  'Aperçu — exemple',
  'VITE_URGENCY_PREVIEW',
  // aucun texte de développement côté client
  'VITE_',
  'Aperçu de développement',
  'avis d’exemple',
  'À confirmer avant',
  'NOM DE LA BOUTIQUE',
  'Nom de la boutique',
  'Lorem',
  'Intégration prestataire',
]

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

const files = walk(DIST).filter((f) => /\.(js|html|css)$/.test(f))
const hits = []
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  for (const needle of FORBIDDEN) if (text.includes(needle)) hits.push(`${f} → « ${needle} »`)
}

if (hits.length) {
  console.error('✗ Contenu de développement détecté dans le build de production :\n  ' + hits.join('\n  '))
  process.exit(1)
}
// Les archives de conception (concepts A/B/C, v1, comparaison) ne doivent pas être publiées.
const archives = files.filter((f) => /(ConceptA|ConceptB|ConceptC|DesignCompare|Home)-[\w-]+\.js$/.test(f))
if (archives.length) {
  console.error('✗ Archives de conception présentes dans le build public : ' + archives.join(', '))
  process.exit(1)
}
console.log(`✓ Bundle vérifié (${files.length} fichiers) : aucun texte de développement, avis d’exemple ni archive de conception.`)
