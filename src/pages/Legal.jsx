import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import MissingInfo from '../components/ui/MissingInfo.jsx'
import { STORE, MERCHANT, POLICIES } from '../config/store.js'
import { useI18n } from '../i18n/index.jsx'

export default function Legal() {
  const { t } = useI18n()
  const p = t.pages.legal
  const r = p.rows
  const rows = [
    [r.store, STORE.name || `${t.logo.top} ${t.logo.bottom}`],
    [r.legalName, MERCHANT.legalName || <MissingInfo key="legal" />],
    [r.street, MERCHANT.street || <MissingInfo key="street" />],
    [r.zip, MERCHANT.zip || <MissingInfo key="zip" />],
    [r.city, MERCHANT.city || <MissingInfo key="city" />],
    [r.country, t.common.country],
    [r.uid, MERCHANT.uid || <MissingInfo key="uid" />],
    [r.register, MERCHANT.registerNumber],
    [r.manager, MERCHANT.manager],
    [r.email, STORE.supportEmail || <MissingInfo key="email" />],
    ...(STORE.supportPhone ? [[r.phone, STORE.supportPhone]] : []),
  ]
  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <Prose>
        <Block title={p.operator}>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2">
            {rows.map(([dt, dd]) => (
              <div key={dt} className="contents">
                <dt className="font-semibold text-fr-ink">{dt}</dt>
                <dd>{dd}</dd>
              </div>
            ))}
          </dl>
        </Block>
        {POLICIES.hosting && (
          <Block title={p.hosting}>
            <p>{POLICIES.hosting}</p>
          </Block>
        )}
        <Block title={p.brandsTitle}>
          <p>{p.brands}</p>
        </Block>
      </Prose>
    </>
  )
}
