import { Link } from 'react-router-dom'
import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import MissingInfo from '../components/ui/MissingInfo.jsx'
import { DELIVERY, STORE, MERCHANT, POLICIES } from '../config/store.js'

// Politique de retour : uniquement les engagements confirmés + les rubriques renseignées par le marchand.
export default function Returns() {
  const contact = STORE.supportEmail ? (
    <a href={`mailto:${STORE.supportEmail}`} className="font-semibold text-fr-green underline">
      {STORE.supportEmail}
    </a>
  ) : (
    <Link to="/contact" className="font-semibold text-fr-green underline">
      notre service client
    </Link>
  )
  return (
    <>
      <PageHeader
        eyebrow="Service client"
        title="Retours & remboursements"
        intro={`Vous disposez de ${DELIVERY.returnWindowDays} jours après réception pour demander un retour.`}
      />
      <Prose>
        <Block title={`Un engagement de ${DELIVERY.returnWindowDays} jours`}>
          <p>
            Vous pouvez demander un retour dans les {DELIVERY.returnWindowDays} jours qui suivent la réception de votre colis. Il
            s’agit d’un engagement volontaire de notre boutique : en Suisse, la loi ne prévoit pas de droit de rétractation pour
            les achats en ligne.
          </p>
          <p>État des produits acceptés : {POLICIES.returnCondition || <MissingInfo />}</p>
        </Block>

        <Block title="Comment faire">
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Contactez {contact} en indiquant votre <strong className="text-fr-ink">numéro de commande</strong>.
            </li>
            <li>Nous vous transmettons les instructions de retour.</li>
            <li>Dès réception et contrôle du colis, nous procédons au remboursement.</li>
          </ol>
          <p>Adresse de retour : <span className="text-fr-ink">{POLICIES.returnAddress || <MissingInfo />}</span></p>
        </Block>

        <Block title="Frais de retour">
          <p>{POLICIES.returnCosts || <MissingInfo />}</p>
        </Block>

        <Block title="Remboursement">
          <p>{POLICIES.refundTerms || <MissingInfo />}</p>
        </Block>

        <Block title="Produit endommagé, défectueux ou erroné">
          <p>
            Contactez-nous dès réception, avec votre numéro de commande et si possible une photo. Indépendamment du délai de retour,
            la garantie légale pour les défauts s’applique (deux ans en droit suisse).
          </p>
        </Block>

        {(STORE.supportEmail || STORE.supportPhone || MERCHANT.legalName) && (
          <Block title="Contact">
            {STORE.supportEmail && <p>{contact}</p>}
            {STORE.supportPhone && <p>Téléphone : {STORE.supportPhone}</p>}
            {MERCHANT.legalName && <p>{MERCHANT.legalName}</p>}
          </Block>
        )}
      </Prose>
    </>
  )
}
