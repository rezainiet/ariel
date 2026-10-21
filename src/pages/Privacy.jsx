import { useEffect, useState } from 'react'
import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import { STORE, MERCHANT } from '../config/store.js'
import { isPixelEnabled } from '../lib/pixel.js'
import { getRedirectPayment } from '../lib/payment.js'

// Politique de confidentialité : description des traitements réellement prévus par la boutique.
export default function Privacy() {
  const [redirect, setRedirect] = useState({ enabled: false, domain: '' })
  const [everflowAttribution, setEverflowAttribution] = useState(false)
  useEffect(() => {
    getRedirectPayment().then(setRedirect)
    fetch('/api/payment/config').then((r) => r.ok ? r.json() : null).then((data) => {
      setEverflowAttribution(data?.everflow?.attributionAvailable === true)
    }).catch(() => {})
  }, [])
  const address = [MERCHANT.street, [MERCHANT.zip, MERCHANT.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return (
    <>
      <PageHeader
        eyebrow="Confidentialité"
        title="Politique de confidentialité"
        intro="Comment nous traitons vos données personnelles, conformément à la loi suisse sur la protection des données (nLPD)."
      />
      <Prose>
        {MERCHANT.legalName && (
          <Block title="Responsable du traitement">
            <p>
              {MERCHANT.legalName}
              {address ? `, ${address}` : ''}
              {STORE.supportEmail ? ` · ${STORE.supportEmail}` : ''}
            </p>
          </Block>
        )}
        <Block title="Données collectées">
          <p>
            Pour traiter une commande, nous collectons votre prénom, votre nom, votre adresse de livraison, votre adresse e-mail
            et votre numéro de téléphone lorsque le paiement hébergé le requiert. Les données de paiement sont saisies directement chez notre
            prestataire de paiement : nous n’y avons pas accès.
          </p>
        </Block>
        <Block title="Finalités">
          <p>Ces données servent à préparer, expédier et suivre votre commande, et à vous répondre (confirmations, retours, service client).</p>
        </Block>
        <Block title="Destinataires">
          <p>
            Vos données sont transmises uniquement aux prestataires nécessaires à votre commande : le prestataire de paiement et
            le transporteur.
          </p>
          {redirect.enabled && redirect.domain && (
            <p>
              Paiement : en cliquant sur « Acheter », vous êtes redirigé vers la page de paiement de {redirect.domain}. Votre prénom,
              votre nom, votre adresse de livraison, votre e-mail, votre téléphone et l’offre choisie lui sont transmis dans le lien
              de redirection afin de finaliser la commande.
            </p>
          )}
        </Block>
        <Block title="Mesure d’audience">
          {isPixelEnabled() || everflowAttribution ? (
            <p>
              Avec votre accord seulement, des identifiants publicitaires approuvés peuvent servir à mesurer l’efficacité de nos annonces. Vous pouvez
              refuser ce suivi dans la bannière de consentement.
            </p>
          ) : (
            <p>Aucun outil de mesure publicitaire n’est utilisé sur ce site.</p>
          )}
        </Block>
        <Block title="Vos droits">
          <p>
            Vous pouvez demander l’accès à vos données, leur rectification ou leur suppression
            {STORE.supportEmail ? ` en écrivant à ${STORE.supportEmail}` : ' en contactant notre service client'}.
          </p>
        </Block>
      </Prose>
    </>
  )
}
