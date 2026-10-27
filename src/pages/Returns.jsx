import { Link } from 'react-router-dom'
import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import MissingInfo from '../components/ui/MissingInfo.jsx'
import { STORE, MERCHANT } from '../config/store.js'
import { useI18n } from '../i18n/index.jsx'

// Politique de retour : engagement de 15 jours + conditions (valeurs du marchand ou textes par défaut, voir pages.policies).
export default function Returns() {
  const { t } = useI18n()
  const p = t.pages.returns
  const policy = t.pages.policies
  const contact = STORE.supportEmail ? (
    <a key="c" href={`mailto:${STORE.supportEmail}`} className="font-semibold text-fr-green underline">
      {STORE.supportEmail}
    </a>
  ) : (
    <Link key="c" to="/contact" className="font-semibold text-fr-green underline">
      {p.contactLink}
    </Link>
  )
  const strong = (text) => <strong key="s" className="text-fr-ink">{text}</strong>
  return (
    <>
      <PageHeader eyebrow={t.pages.service} title={p.title} intro={p.intro} />
      <Prose>
        <Block title={p.commitmentTitle}>
          <p>{p.commitment}</p>
          <p>{p.condition}{policy.returnCondition || <MissingInfo />}</p>
        </Block>

        <Block title={p.howTitle}>
          <ol className="list-decimal space-y-1 pl-5">
            {p.how(contact, strong).map((parts, k) => (
              <li key={k}>{parts}</li>
            ))}
          </ol>
          <p>{p.address}<span className="text-fr-ink">{policy.returnAddress || <MissingInfo />}</span></p>
        </Block>

        <Block title={p.costsTitle}>
          <p>{policy.returnCosts || <MissingInfo />}</p>
        </Block>

        <Block title={p.refundTitle}>
          <p>{policy.refundTerms || <MissingInfo />}</p>
        </Block>

        <Block title={p.damagedTitle}>
          <p>{p.damaged}</p>
        </Block>

        {(STORE.supportEmail || STORE.supportPhone || MERCHANT.legalName) && (
          <Block title={p.contactTitle}>
            {STORE.supportEmail && <p>{contact}</p>}
            {STORE.supportPhone && <p>{p.phone(STORE.supportPhone)}</p>}
            {MERCHANT.legalName && <p>{MERCHANT.legalName}</p>}
          </Block>
        )}
      </Prose>
    </>
  )
}
