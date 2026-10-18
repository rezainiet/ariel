import { Mail, Phone, MapPin, PackageSearch } from 'lucide-react'
import { PageHeader, Prose } from '../components/ui/Prose.jsx'
import { STORE, MERCHANT, DELIVERY } from '../config/store.js'
import { IconTile } from '../concepts/frais/Icons.jsx'

// Contact : uniquement les canaux réellement configurés.
export default function Contact() {
  const address = [MERCHANT.legalName, MERCHANT.street, [MERCHANT.zip, MERCHANT.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const cards = [
    STORE.supportEmail && [
      Mail,
      'E-mail',
      <a key="e" href={`mailto:${STORE.supportEmail}`} className="font-semibold text-fr-green underline">
        {STORE.supportEmail}
      </a>,
    ],
    STORE.supportPhone && [Phone, 'Téléphone', STORE.supportPhone],
    address && [MapPin, 'Adresse postale', address],
  ].filter(Boolean)
  return (
    <>
      <PageHeader
        eyebrow="Service client"
        title="Contact & suivi de commande"
        intro="Une question sur une commande, un suivi ou un retour ? Indiquez votre numéro de commande dans votre message."
      />
      <Prose>
        {cards.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {cards.map(([Icon, title, value]) => (
              <div key={title} className="rounded-[1.4rem] bg-white p-5 ring-1 ring-fr-line">
                <IconTile icon={Icon} size="sm" />
                <h2 className="mt-3 text-sm font-bold text-fr-ink">{title}</h2>
                <div className="mt-1 text-sm text-fr-muted">{value}</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-4 rounded-[1.4rem] bg-white p-5 ring-1 ring-fr-line">
          <IconTile icon={PackageSearch} size="md" />
          <div>
            <h2 className="text-base font-bold text-fr-ink">Suivi de commande</h2>
            <p className="mt-1 text-sm text-fr-muted">
              Après l’achat, vous recevez une confirmation de commande, puis une confirmation d’expédition avec un lien de suivi
              lorsqu’il est disponible.
              {DELIVERY.estimateDays ? ` Livraison estimée sous ${DELIVERY.estimateDays} jours ouvrables.` : ''}
            </p>
          </div>
        </div>
      </Prose>
    </>
  )
}
