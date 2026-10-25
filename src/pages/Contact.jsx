import { Mail, Phone, MapPin, PackageSearch } from 'lucide-react'
import { PageHeader, Prose } from '../components/ui/Prose.jsx'
import MissingInfo from '../components/ui/MissingInfo.jsx'
import { STORE, MERCHANT, DELIVERY } from '../config/store.js'
import { useI18n } from '../i18n/index.jsx'
import { IconTile } from '../concepts/frais/Icons.jsx'

// Contact : uniquement les canaux réellement configurés.
export default function Contact() {
  const { t } = useI18n()
  const p = t.pages.contact
  const address = [MERCHANT.legalName, MERCHANT.street, MERCHANT.zip, MERCHANT.city].every(Boolean)
    ? `${MERCHANT.legalName}, ${MERCHANT.street}, ${MERCHANT.zip} ${MERCHANT.city}, ${t.common.country}` : null
  const cards = [
    [
      Mail,
      p.email,
      STORE.supportEmail
        ? <a key="e" href={`mailto:${STORE.supportEmail}`} className="font-semibold text-fr-green underline">{STORE.supportEmail}</a>
        : <MissingInfo key="missing-email" />,
    ],
    STORE.supportPhone && [Phone, p.phone, STORE.supportPhone],
    [MapPin, p.address, address || <MissingInfo key="missing-address" />],
  ].filter(Boolean)
  return (
    <>
      <PageHeader eyebrow={t.pages.service} title={p.title} intro={p.intro} />
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
            <h2 className="text-base font-bold text-fr-ink">{p.tracking}</h2>
            <p className="mt-1 text-sm text-fr-muted">
              {p.trackingText}
              {DELIVERY.estimateDays ? p.eta(DELIVERY.estimateDays) : ''}
            </p>
          </div>
        </div>
      </Prose>
    </>
  )
}
