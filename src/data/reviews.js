import { useMemo, useState } from 'react'

// ─────────────────────────────────────────────────────────────
// Avis clients — architecture prête pour une source vérifiée.
//
// PRODUCTION : aucun avis fictif n'est affiché. Tant qu'aucune source
// vérifiée (VITE_REVIEWS_ENDPOINT, ex. plateforme d'avis certifiée) n'est
// branchée, les composants affichent un état vide honnête.
//
// DÉVELOPPEMENT : des données d'EXEMPLE (clairement libellées) permettent
// de prévisualiser le design. Elles ne sont jamais incluses en production
// car le bloc est conditionné par import.meta.env.DEV.
//
// Toutes les statistiques (moyenne, total, répartition) sont CALCULÉES à
// partir des avis chargés — jamais saisies à la main.
// ─────────────────────────────────────────────────────────────

const SAMPLE_REVIEWS = import.meta.env.DEV
  ? [
      {
        id: 's1',
        author: 'Camille R.',
        location: 'Lausanne',
        rating: 5,
        date: '2026-09-28',
        verified: true,
        title: 'Pratique au quotidien',
        body: 'Une capsule par machine, rien à doser. Le pack de 60 dure longtemps pour notre famille.',
        photos: [],
      },
      {
        id: 's2',
        author: 'Julien M.',
        location: 'Genève',
        rating: 4,
        date: '2026-09-21',
        verified: true,
        title: 'Bon rapport prix',
        body: 'Livraison reçue en trois jours ouvrables. Le sachet se referme bien.',
        photos: ['/images/packshot.webp'],
      },
      {
        id: 's3',
        author: 'Sophie B.',
        location: 'Fribourg',
        rating: 5,
        date: '2026-09-14',
        verified: true,
        title: 'Commande simple',
        body: 'J’ai pris l’offre 3 packs. Tout était conforme à la description.',
        photos: [],
      },
      {
        id: 's4',
        author: 'Marc D.',
        location: 'Neuchâtel',
        rating: 3,
        date: '2026-09-02',
        verified: false,
        title: 'Correct',
        body: 'Fait le travail. J’aurais aimé un suivi de colis plus détaillé.',
        photos: [],
      },
      {
        id: 's5',
        author: 'Léa P.',
        location: 'Sion',
        rating: 5,
        date: '2026-08-25',
        verified: true,
        title: 'Format très pratique',
        body: 'Les capsules se dissolvent bien, même sur programme court. Je recommande.',
        photos: ['/images/stacked.webp'],
      },
      {
        id: 's6',
        author: 'Nicolas G.',
        location: 'Yverdon-les-Bains',
        rating: 4,
        date: '2026-08-17',
        verified: true,
        title: 'Satisfait',
        body: 'Bon produit, emballage soigné. Le service client a répondu rapidement.',
        photos: [],
      },
      {
        id: 's7',
        author: 'Aurélie T.',
        location: 'Montreux',
        rating: 5,
        date: '2026-08-09',
        verified: true,
        title: 'Je recommande',
        body: 'Prix intéressant pour du Ariel. La livraison offerte fait la différence.',
        photos: [],
      },
      {
        id: 's8',
        author: 'Thomas K.',
        location: 'Bienne',
        rating: 2,
        date: '2026-07-30',
        verified: false,
        title: 'Livraison un peu longue',
        body: 'Colis arrivé un jour plus tard que prévu, mais produit en bon état.',
        photos: [],
      },
    ]
  : []

export const REVIEWS_ENDPOINT = import.meta.env.VITE_REVIEWS_ENDPOINT || '/api/reviews'

// Aperçu explicite des avis d'exemple pour la boutique (Concept C) : uniquement en dev,
// uniquement si VITE_REVIEWS_PREVIEW=sample. Par défaut, la boutique n'affiche rien.
export const STORE_REVIEWS_PREVIEW = import.meta.env.DEV && import.meta.env.VITE_REVIEWS_PREVIEW === 'sample'

// Statut de la source : 'sample' (dev), 'live' (source branchée), 'empty'.
export function getReviewSource({ allowSample = true } = {}) {
  if (allowSample && SAMPLE_REVIEWS.length) return { status: 'sample', reviews: SAMPLE_REVIEWS }
  // Point d'intégration : charger les avis vérifiés depuis REVIEWS_ENDPOINT.
  return { status: 'empty', reviews: [] }
}

export function summarize(reviews) {
  const count = reviews.length
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const n = reviews.filter((r) => r.rating === stars).length
    return { stars, n, pct: count ? Math.round((n / count) * 100) : 0 }
  })
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
  return { count, average: Math.round(average * 10) / 10, distribution }
}

export const SORTS = [
  { id: 'recent', label: 'Plus récents' },
  { id: 'high', label: 'Meilleures notes' },
  { id: 'low', label: 'Notes les plus basses' },
  { id: 'photos', label: 'Avec photos' },
]

function sortReviews(list, mode) {
  const arr = [...list]
  if (mode === 'high') return arr.sort((a, b) => b.rating - a.rating || b.date.localeCompare(a.date))
  if (mode === 'low') return arr.sort((a, b) => a.rating - b.rating || b.date.localeCompare(a.date))
  if (mode === 'photos') return arr.filter((r) => r.photos.length).sort((a, b) => b.date.localeCompare(a.date))
  return arr.sort((a, b) => b.date.localeCompare(a.date))
}

// Hook partagé : tri, filtre par note, pagination « Voir plus ».
export function useReviews({ pageSize = 3, allowSample = true } = {}) {
  const source = useMemo(() => getReviewSource({ allowSample }), [allowSample])
  const summary = useMemo(() => summarize(source.reviews), [source])
  const [sort, setSort] = useState('recent')
  const [stars, setStars] = useState(null)
  const [visible, setVisible] = useState(pageSize)

  const filtered = useMemo(() => {
    const base = stars ? source.reviews.filter((r) => r.rating === stars) : source.reviews
    return sortReviews(base, sort)
  }, [source, sort, stars])

  return {
    status: source.status,
    isSample: source.status === 'sample',
    summary,
    items: filtered.slice(0, visible),
    total: filtered.length,
    hasMore: visible < filtered.length,
    showMore: () => setVisible((v) => v + pageSize),
    sort,
    setSort: (s) => {
      setSort(s)
      setVisible(pageSize)
    },
    stars,
    setStars: (s) => {
      setStars((cur) => (cur === s ? null : s))
      setVisible(pageSize)
    },
  }
}

export function formatReviewDate(iso) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
