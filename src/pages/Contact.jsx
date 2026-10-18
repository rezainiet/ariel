import { Mail, Phone, Clock } from 'lucide-react'
import { PageHeader, Prose, TodoNote } from '../components/ui/Prose.jsx'
import { STORE, DELIVERY } from '../config/store.js'

export default function Contact() {
  return (
    <>
      <PageHeader
        eyebrow="Nous écrire"
        title="Contact & suivi de commande"
        intro="Une question sur votre commande, un suivi ou un retour ? Notre service client est là pour vous aider."
      />
      <Prose>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl2 border border-line bg-surface p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/60 text-forest">
              <Mail size={19} />
            </span>
            <h2 className="mt-4 text-base font-semibold text-ink">E-mail</h2>
            {STORE.supportEmail ? (
              <a href={`mailto:${STORE.supportEmail}`} className="mt-1 block text-sm font-medium text-forest hover:underline">
                {STORE.supportEmail}
              </a>
            ) : (
              <p className="mt-1 text-sm text-muted">Adresse à fournir</p>
            )}
          </div>
          <div className="rounded-xl2 border border-line bg-surface p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage/60 text-forest">
              <Phone size={19} />
            </span>
            <h2 className="mt-4 text-base font-semibold text-ink">Téléphone</h2>
            <p className="mt-1 text-sm text-muted">{STORE.supportPhone || 'Numéro à fournir'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-5">
          <Clock size={18} className="mt-0.5 flex-none text-forest" />
          <div>
            <h2 className="text-base font-semibold text-ink">Suivi de commande</h2>
            <p className="mt-1 text-sm text-muted">
              Après votre achat, vous recevez une confirmation de commande puis une
              confirmation d'expédition. Un lien de suivi vous est transmis lorsqu'il est
              disponible (livraison estimée sous {DELIVERY.estimateDays} jours ouvrables).
              Pour toute question, indiquez votre numéro de commande.
            </p>
          </div>
        </div>

        <TodoNote>
          les coordonnées réelles du service client, les horaires de disponibilité et, le
          cas échéant, un formulaire de contact relié à une boîte surveillée.
        </TodoNote>
      </Prose>
    </>
  )
}
