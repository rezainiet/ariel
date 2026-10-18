import { Mail, Phone, MapPin, PackageSearch } from 'lucide-react'
import { PageHeader, Prose } from '../components/ui/Prose.jsx'
import { STORE, MERCHANT, DELIVERY } from '../config/store.js'
import { Fact } from '../concepts/c/Pending.jsx'

export default function Contact() {
  const address = [MERCHANT.legalName, MERCHANT.street, [MERCHANT.zip, MERCHANT.city].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')
  const cards = [
    [Mail, 'E-mail', STORE.supportEmail ? <a href={`mailto:${STORE.supportEmail}`} className="font-semibold text-forest underline">{STORE.supportEmail}</a> : <Fact value="" missing="e-mail" />],
    [Phone, 'Téléphone', STORE.supportPhone || <Fact value="" missing="téléphone (recommandé)" />],
    [MapPin, 'Adresse postale', <Fact key="a" value={address} missing="adresse postale" />],
  ]
  return (
    <>
      <PageHeader
        eyebrow="Service client"
        title="Contact & suivi de commande"
        intro="Une question sur une commande, un suivi ou un retour ? Indiquez votre numéro de commande, nous vous répondons par e-mail."
      />
      <Prose>
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map(([Icon, title, value]) => (
            <div key={title} className="rounded-2xl border border-hair bg-white p-5">
              <Icon size={19} className="text-forest" />
              <h2 className="mt-3 text-sm font-bold text-ink">{title}</h2>
              <div className="mt-1 text-sm text-ink/75">{value}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-3 rounded-2xl border border-hair bg-white p-5">
          <PackageSearch size={20} className="mt-0.5 flex-none text-forest" />
          <div>
            <h2 className="text-base font-bold text-ink">Suivi de commande</h2>
            <p className="mt-1 text-sm text-ink/75">
              Après l’achat, vous recevez une confirmation de commande, puis une confirmation d’expédition avec un lien de suivi
              lorsqu’il est disponible. Livraison estimée sous {DELIVERY.estimateDays} jours ouvrables.
            </p>
          </div>
        </div>
      </Prose>
    </>
  )
}
