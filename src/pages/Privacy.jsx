import { PageHeader, Prose, Block, TodoNote } from '../components/ui/Prose.jsx'
import { STORE } from '../config/store.js'

export default function Privacy() {
  return (
    <>
      <PageHeader
        eyebrow="Confidentialité"
        title="Politique de confidentialité"
        intro="Nous accordons de l'importance à la protection de vos données personnelles. Cette page décrit, à titre de modèle, les traitements prévus."
      />
      <Prose>
        <Block title="Données collectées">
          <p>
            Dans le cadre d'une commande, nous collectons les informations nécessaires à
            son traitement&nbsp;: nom, prénom, adresse de livraison, e-mail et, le cas
            échéant, numéro de téléphone.
          </p>
        </Block>
        <Block title="Finalité">
          <p>
            Ces données servent à préparer, expédier et suivre votre commande, ainsi qu'à
            la relation client (confirmations, retours, support).
          </p>
        </Block>
        <Block title="Mesure d'audience">
          <p>
            Un pixel de mesure (Snapchat) peut être utilisé pour évaluer la performance de
            nos campagnes publicitaires, dans le respect des exigences de consentement
            applicables.
          </p>
        </Block>
        <Block title="Vos droits">
          <p>
            Vous disposez d'un droit d'accès, de rectification et de suppression de vos
            données. Pour l'exercer, contactez-nous.
          </p>
        </Block>
        <TodoNote>
          le responsable du traitement, la base légale, les sous-traitants (paiement,
          logistique, analytics), les durées de conservation, les modalités de consentement
          et le contact du délégué le cas échéant — conformément à la nLPD suisse (et au
          RGPD si des clients de l'UE sont concernés).
        </TodoNote>
        {STORE.supportEmail && <p className="text-sm text-muted">Contact&nbsp;: {STORE.supportEmail}</p>}
      </Prose>
    </>
  )
}
