import { useEffect, useState } from 'react'
import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import MissingInfo from '../components/ui/MissingInfo.jsx'
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
  return (
    <>
      <PageHeader
        eyebrow="Confidentialité"
        title="Politique de confidentialité"
        intro="Comment nous traitons vos données personnelles, conformément à la loi suisse sur la protection des données (nLPD)."
      />
      <Prose>
        <Block title="Responsable du traitement">
          <p>Raison sociale : {MERCHANT.legalName || <MissingInfo />}</p>
          <p>Adresse : {[MERCHANT.street, MERCHANT.zip, MERCHANT.city].every(Boolean)
            ? `${MERCHANT.street}, ${MERCHANT.zip} ${MERCHANT.city}` : <MissingInfo />}</p>
          <p>E-mail : {STORE.supportEmail || <MissingInfo />}</p>
        </Block>
        <Block title="Données collectées">
          <p>
            Pour traiter une commande, nous collectons votre prénom, votre nom, votre adresse de livraison, votre adresse e-mail
            et votre numéro de téléphone. Ces coordonnées sont enregistrées dès que vous cliquez sur « Acheter ». Les données de paiement sont
            saisies directement chez notre prestataire de paiement : nous n’y avons pas accès.
          </p>
          <p>
            Nous notons aussi la provenance de votre visite (par exemple une annonce Meta, Snapchat ou Google, ou le nom de la campagne),
            conservée 30 jours dans votre navigateur puis jointe à votre commande. Avec votre accord, nous enregistrons également
            sur notre serveur le canal d’arrivée, les pages et sections consultées, la profondeur de défilement, le temps actif
            et les étapes de commande franchies. Ces statistiques sont conservées environ 90 jours. Nous n’y enregistrons ni
            vos coordonnées, ni l’identifiant brut d’un clic publicitaire, ni votre adresse IP.
          </p>
        </Block>
        <Block title="Finalités">
          <p>Ces données servent à préparer, expédier et suivre votre commande, à vous répondre, et, pour les statistiques facultatives, à comprendre le parcours des visiteurs et améliorer la boutique.</p>
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
              Avec votre accord seulement, les outils publicitaires de Meta, Snapchat et, s’il est activé, Google mesurent l’efficacité de nos annonces
              (pages vues, vue du produit et début du paiement), sans votre nom ni vos coordonnées. Avec votre accord, les identifiants de clic publicitaire Meta et Snapchat présents dans l'adresse d'arrivée sont conservés localement pendant 30 jours et transmis au prestataire de paiement lors de la commande pour attribuer un paiement réussi. Le site n'envoie aucun signal « Purchase » à Meta ou Snapchat ; le prestataire gère Meta Purchase après confirmation du paiement et Snapchat Purchase n'est pas encore activé. Le signal d’achat Google, s’il est activé, n’est envoyé qu’après vérification du paiement. Vous pouvez refuser ce suivi dans la bannière de consentement.
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
