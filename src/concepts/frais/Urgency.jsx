import { Hourglass, PackageCheck, Timer, Eye } from 'lucide-react'
import { useCountdown } from '../../lib/storeStatus.js'

const two = (n) => String(n).padStart(2, '0')

const endFormat = new Intl.DateTimeFormat('fr-CH', {
  timeZone: 'Europe/Zurich',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

// Compte à rebours de campagne : n'existe que si le serveur fournit une date de fin réelle.
// Calculé sur l'heure serveur ; disparaît de lui-même à l'échéance.
export function Countdown({ campaign, t }) {
  if (!t) return null
  const parts = [
    [t.days, 'jours'],
    [t.hours, 'heures'],
    [t.minutes, 'min'],
    [t.seconds, 's'],
  ]
  return (
    <div className="px-4 py-3">
      <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[0.82rem] text-fr-ink">
        <Timer size={17} strokeWidth={1.75} className="flex-none text-fr-green" aria-hidden="true" />
        <span className="font-semibold">{campaign.label || 'Fin de l’opération'}</span>
        <span className="ml-auto text-[0.72rem] text-fr-muted">jusqu’au {endFormat.format(new Date(campaign.endsAt))}</span>
      </p>
      <p className="mt-2.5 grid grid-cols-4 gap-1.5 font-jakarta tabular-nums" aria-label="Temps restant" role="timer">
        {parts.map(([v, u]) => (
          <span key={u} className="flex flex-col items-center rounded-xl bg-fr-soft py-1.5 ring-1 ring-fr-line">
            <span className="text-[1.15rem] font-extrabold leading-tight text-fr-deep">{two(v)}</span>
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-fr-muted">{u}</span>
          </span>
        ))}
      </p>
    </div>
  )
}

function StockLine({ stock }) {
  if (!stock || stock.available <= 0) return null
  const low = stock.lowThreshold != null && stock.available <= stock.lowThreshold
  return (
    <p className="flex items-center gap-2.5 px-4 py-3 text-[0.82rem] text-fr-ink">
      <span className="relative flex h-[17px] w-[17px] flex-none items-center justify-center" aria-hidden="true">
        <span className={`absolute h-2.5 w-2.5 rounded-full ${low ? 'bg-amber-500' : 'bg-fr-leaf'} animate-pulse-soft`} />
      </span>
      {low ? (
        <span>
          <strong className="font-semibold">Plus que {stock.available} sachets</strong> disponibles
        </span>
      ) : (
        <span>
          <strong className="font-semibold">En stock</strong> · {stock.available} sachets disponibles
        </span>
      )}
      <PackageCheck size={15} strokeWidth={1.75} className="ml-auto flex-none text-fr-muted" aria-hidden="true" />
    </p>
  )
}

// Bloc de motivation d'achat sous le bouton : uniquement des informations vérifiées.
export default function UrgencyPanel({ status }) {
  const { limited, stock, campaign, offset, isSample } = status
  const t = useCountdown(campaign?.endsAt, offset)
  const hasCountdown = Boolean(t)
  const hasStock = Boolean(stock && stock.available > 0)
  if (!limited && !hasCountdown && !hasStock) return null
  return (
    <div className="mt-4">
      {import.meta.env.DEV && isSample && (
        <p className="mb-1.5 inline-flex items-center gap-1.5 rounded-md border border-dashed border-amber-500/60 bg-amber-50 px-2 py-0.5 text-[0.68rem] font-semibold text-amber-900">
          <Eye size={12} aria-hidden="true" /> Aperçu — exemple de données (développement uniquement)
        </p>
      )}
      <div className="divide-y divide-fr-line overflow-hidden rounded-2xl border border-fr-line bg-white">
        {limited && (
          <p className="flex items-center gap-2.5 px-4 py-3 text-[0.82rem] text-fr-ink">
            <Hourglass size={17} strokeWidth={1.75} className="flex-none text-fr-green" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Quantités limitées</strong> · offre valable jusqu’à épuisement du stock
            </span>
          </p>
        )}
        <StockLine stock={stock} />
        <Countdown campaign={campaign} t={t} />
      </div>
    </div>
  )
}
