import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Smartphone, Monitor, Lock } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// PAGE INTERNE — comparaison des trois concepts.
// Route active uniquement en développement (ou VITE_DESIGN_PREVIEW=true).
// Les aperçus sont les vraies pages, chargées dans des iframes.
// ─────────────────────────────────────────────────────────────

const CONCEPTS = [
  {
    id: 'a',
    path: '/concept-a',
    name: 'A — Swiss Luxury Commerce',
    tag: 'Éditorial · ivoire · serif',
    summary:
      'Fiche produit premium dès l’arrivée : galerie à vignettes, sélecteur en lignes radio, sections numérotées, typographie serif.',
  },
  {
    id: 'b',
    path: '/concept-b',
    name: 'B — Modern Product Experience',
    tag: 'Immersif · sombre · grotesque',
    summary:
      'Narration produit : héros annoté sur l’emballage réel, onglets interactifs, chiffres clés, configurateur à pile de packs.',
  },
  {
    id: 'c',
    path: '/concept-c',
    name: 'C — Premium Conversion Commerce',
    tag: 'Compact · DTC · barre collante',
    summary:
      'Tout le parcours d’achat dans le premier écran : offres en une rangée, « Commander » express, barre d’achat collante.',
  },
]

// Évaluation d'expert (jugement de design) — PAS des mesures de conversion.
const CRITERIA = [
  ['Sophistication visuelle', 9, 9, 7],
  ['Crédibilité du marchand', 9, 7, 8],
  ['Utilisabilité mobile', 7, 7, 9],
  ['Présentation produit', 8, 9, 7],
  ['Clarté du choix d’offre', 8, 8, 9],
  ['Qualité des interactions', 8, 9, 8],
  ['Performance', 8, 7, 9],
  ['Parcours de commande', 7, 7, 9],
]

const MODES = {
  mobile: { w: 390, h: 844, label: 'Mobile 390', Icon: Smartphone },
  desktop: { w: 1440, h: 900, label: 'Desktop 1440', Icon: Monitor },
}

function Frame({ path, mode }) {
  const wrap = useRef(null)
  const [scale, setScale] = useState(0.5)
  const { w, h } = MODES[mode]

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setScale(Math.min(1, e.contentRect.width / w)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [w])

  return (
    <div ref={wrap} className="w-full overflow-hidden rounded-xl border border-line bg-cloud" style={{ height: h * scale }}>
      <iframe
        key={`${path}-${mode}`}
        src={path}
        title={`Aperçu ${path}`}
        loading="lazy"
        style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: '0 0' }}
        className="mx-auto block border-0 bg-white"
      />
    </div>
  )
}

export default function DesignCompare() {
  const [mode, setMode] = useState('mobile')
  const totals = [1, 2, 3].map((c) => CRITERIA.reduce((s, row) => s + row[c], 0))

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-amber-700">
              <Lock size={12} /> Page interne · non publiée
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">Comparaison des concepts</h1>
            <p className="text-sm text-muted">
              Aperçus réels des pages. Logique panier, prix et intégrations partagées.{' '}
              <Link to="/" className="font-semibold text-forest underline">Version actuelle (v1)</Link>
            </p>
          </div>
          <div role="radiogroup" aria-label="Taille d’aperçu" className="flex rounded-full bg-cloud p-1">
            {Object.entries(MODES).map(([k, m]) => (
              <button
                key={k}
                role="radio"
                aria-checked={mode === k}
                onClick={() => setMode(k)}
                className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
                  mode === k ? 'bg-forest text-white' : 'text-ink/70 hover:text-forest'
                }`}
              >
                <m.Icon size={16} /> {m.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-5 py-8 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {CONCEPTS.map((c) => (
            <section key={c.id} aria-labelledby={`h-${c.id}`} className="flex flex-col">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 id={`h-${c.id}`} className="text-base font-extrabold text-ink">{c.name}</h2>
                  <p className="text-xs font-semibold text-forest">{c.tag}</p>
                </div>
                <Link
                  to={c.path}
                  className="flex h-9 flex-none items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-bold text-forest hover:border-forest/40"
                >
                  Ouvrir <ExternalLink size={13} />
                </Link>
              </div>
              <p className="mb-4 min-h-[3.5rem] text-sm leading-relaxed text-muted">{c.summary}</p>
              <Frame path={c.path} mode={mode} />
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-2xl border border-line bg-white p-5 lg:p-8">
          <h2 className="text-xl font-extrabold tracking-tight text-ink">Évaluation d’expert (sur 10)</h2>
          <p className="mt-1 text-sm text-muted">
            Jugement de design, pas une mesure. Aucun taux de conversion n’est mesuré ni supposé.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-[0.08em] text-muted">
                  <th className="py-2 font-semibold">Critère</th>
                  <th className="py-2 text-center font-semibold">A</th>
                  <th className="py-2 text-center font-semibold">B</th>
                  <th className="py-2 text-center font-semibold">C</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {CRITERIA.map(([label, ...scores]) => {
                  const best = Math.max(...scores)
                  return (
                    <tr key={label}>
                      <td className="py-2.5 text-ink">{label}</td>
                      {scores.map((s, k) => (
                        <td key={k} className={`py-2.5 text-center tabular-nums ${s === best ? 'font-extrabold text-forest' : 'text-muted'}`}>
                          {s}
                        </td>
                      ))}
                    </tr>
                  )
                })}
                <tr className="border-t-2 border-ink/10">
                  <td className="py-3 font-extrabold text-ink">Total / 80</td>
                  {totals.map((t, k) => (
                    <td key={k} className="py-3 text-center font-extrabold tabular-nums text-ink">{t}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
