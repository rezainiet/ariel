import { Link } from 'react-router-dom'
import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import MissingInfo from '../components/ui/MissingInfo.jsx'
import { MERCHANT } from '../config/store.js'
import { useI18n } from '../i18n/index.jsx'

// Conditions générales : engagements confirmés ; identité du vendeur et for juridique (valeur du marchand
// ou texte par défaut, voir pages.policies).
// Prix listés dans la devise du visiteur, celle qui sera encaissée.
export default function Terms() {
  const { t, currency, offers, money } = useI18n()
  const p = t.pages.terms
  const link = (to) => (text) => (
    <Link key={to} to={to} className="font-semibold text-fr-green underline">
      {text}
    </Link>
  )
  const list = offers.map((o) => p.offerItem(o.packs, money(o.price))).join(' · ')
  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <Prose>
        <Block title={p.sellerTitle}>
          <p>{p.seller(MERCHANT.legalName || <MissingInfo key="legal" />, MERCHANT.uid || <MissingInfo key="uid" />, link('/mentions-legales'))}</p>
        </Block>
        <Block title={p.productsTitle}>
          <p>{p.products(p.currencyNames[currency] || currency, list)}</p>
        </Block>
        <Block title={p.orderTitle}>
          <p>{p.order}</p>
        </Block>
        <Block title={p.paymentTitle}>
          <p>{p.payment}</p>
        </Block>
        <Block title={p.deliveryTitle}>
          <p>{p.delivery(link('/livraison'))}</p>
        </Block>
        <Block title={p.returnsTitle}>
          <p>{p.returns(link('/retours-remboursements'))}</p>
        </Block>
        <Block title={p.lawTitle}>
          <p>{p.law}{t.pages.policies.jurisdiction || <MissingInfo />}</p>
        </Block>
      </Prose>
    </>
  )
}
