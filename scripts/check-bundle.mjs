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
console.log(`✓ Bundle vérifié (${files.length} fichiers) : aucun avis d’exemple ni marqueur « à fournir ».`)
