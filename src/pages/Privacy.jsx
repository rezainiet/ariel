import { useEffect, useState } from 'react'
import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import MissingInfo from '../components/ui/MissingInfo.jsx'
import { STORE, MERCHANT } from '../config/store.js'
import { isPixelEnabled } from '../lib/pixel.js'
import { getRedirectPayment } from '../lib/payment.js'
import { useI18n } from '../i18n/index.jsx'

// Politique de confidentialité : description des traitements réellement prévus par la boutique.
export default function Privacy() {
  const { t } = useI18n()
  const p = t.pages.privacy
  const [redirect, setRedirect] = useState({ enabled: false, domain: '' })
  const [everflowAttribution, setEverflowAttribution] = useState(false)
  useEffect(() => {
    getRedirectPayment().then(setRedirect)
    fetch('/api/payment/config').then((r) => r.ok ? r.json() : null).then((data) => {
      setEverflowAttribution(data?.everflow?.attributionAvailable === true)
    }).catch(() => {})
  }, [])
  return (
    <>
      <PageHeader eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      <Prose>
        <Block title={p.controllerTitle}>
          <p>{p.legalName}{MERCHANT.legalName || <MissingInfo />}</p>
          <p>{p.address}{[MERCHANT.street, MERCHANT.zip, MERCHANT.city].every(Boolean)
            ? `${MERCHANT.street}, ${MERCHANT.zip} ${MERCHANT.city}, ${t.common.country}` : <MissingInfo />}</p>
          <p>{p.email}{STORE.supportEmail || <MissingInfo />}</p>
        </Block>
        <Block title={p.dataTitle}>
          {p.data.map((text) => <p key={text}>{text}</p>)}
        </Block>
        <Block title={p.purposeTitle}>
          <p>{p.purpose}</p>
        </Block>
        <Block title={p.recipientsTitle}>
          <p>{p.recipients}</p>
          {redirect.enabled && redirect.domain && <p>{p.redirect(redirect.domain)}</p>}
        </Block>
        <Block title={p.audienceTitle}>
          <p>{isPixelEnabled() || everflowAttribution ? p.audience : p.noAudience}</p>
        </Block>
        <Block title={p.rightsTitle}>
          <p>{p.rights(STORE.supportEmail)}</p>
        </Block>
      </Prose>
    </>
  )
}
