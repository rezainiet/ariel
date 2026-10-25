import { Link } from 'react-router-dom'
import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import { DELIVERY, MERCHANT } from '../config/store.js'
import { useI18n } from '../i18n/index.jsx'

// Conditions de livraison : uniquement des informations confirmées.
// Délai, lieu d'expédition et transporteur n'apparaissent que s'ils sont configurés.
export default function Shipping() {
  const { t, currency } = useI18n()
  const p = t.pages.shipping
  const from = MERCHANT.dispatchCity ? t.common.inSwitzerland(MERCHANT.dispatchCity) : DELIVERY.dispatchLocation
  const strong = (text) => <strong key="s" className="text-fr-ink">{text}</strong>
  const link = (text) => (
    <Link key="l" to="/retours-remboursements" className="font-semibold text-fr-green underline">
      {text}
    </Link>
  )
  return (
    <>
      <PageHeader eyebrow={t.pages.service} title={p.title} intro={p.intro} />
      <Prose>
        <Block title={p.costTitle}>
          <p>{p.cost(strong, currency)}</p>
        </Block>
        <Block title={p.zoneTitle}>
          <p>{p.zone}</p>
        </Block>
        {(DELIVERY.estimateDays || from || MERCHANT.carrier) && (
          <Block title={p.dispatchTitle}>
            {DELIVERY.estimateDays && <p>{p.eta(DELIVERY.estimateDays)}</p>}
            {from && <p>{p.from(from)}</p>}
            {MERCHANT.carrier && <p>{p.carrier(MERCHANT.carrier)}</p>}
          </Block>
        )}
        <Block title={p.trackingTitle}>
          <p>{p.tracking}</p>
        </Block>
        <Block title={p.damagedTitle}>
          <p>{p.damaged(link)}</p>
        </Block>
      </Prose>
    </>
  )
}
