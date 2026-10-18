import { FlaskConical, MessageSquareText } from 'lucide-react'

// Bandeau obligatoire quand des avis d'EXEMPLE sont affichés (dev uniquement).
export function SampleBanner({ dark = false }) {
  return (
    <p
      className={`inline-flex items-start gap-2 rounded-lg border border-dashed px-3 py-2 text-xs leading-snug ${
        dark ? 'border-white/25 text-white/70' : 'border-amber-600/40 bg-amber-50 text-amber-900'
      }`}
    >
      <FlaskConical size={14} className="mt-px flex-none" />
      <span>
        <strong className="font-semibold">Aperçu de développement — avis d’exemple.</strong> Ces avis sont
        fictifs et ne sont jamais affichés en production. Ils seront remplacés par des avis clients vérifiés.
      </span>
    </p>
  )
}

// État vide honnête en production tant qu'aucune source vérifiée n'est branchée.
export function EmptyReviews({ dark = false }) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border px-6 py-10 text-center ${
        dark ? 'border-white/15 text-white/75' : 'border-line bg-surface text-muted'
      }`}
    >
      <MessageSquareText size={26} className={dark ? 'text-white/60' : 'text-forest'} />
      <p className={`font-semibold ${dark ? 'text-white' : 'text-ink'}`}>Pas encore d’avis publiés</p>
      <p className="max-w-sm text-sm">
        Les avis de clients ayant réellement commandé apparaîtront ici, collectés via une plateforme d’avis
        vérifiés.
      </p>
    </div>
  )
}
