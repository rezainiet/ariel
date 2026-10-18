import { Link } from 'react-router-dom'
import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import { DELIVERY, MERCHANT, POLICIES, OFFERS, formatCHF } from '../config/store.js'

// Conditions générales : uniquement des engagements confirmés ; les clauses propres au vendeur
// (identité, for juridique) n'apparaissent qu'une fois renseignées.
export default function Terms() {
  return (
    <>
      <PageHeader
        eyebrow="Conditions générales"
        title="Conditions générales de vente"
        intro="Les présentes conditions encadrent la vente des produits proposés sur la boutique."
      />
      <Prose>
        {MERCHANT.legalName && (
          <Block title="Vendeur">
            <p>
              {MERCHANT.legalName}
              {MERCHANT.uid ? `, IDE ${MERCHANT.uid}` : ''}. Coordonnées complètes dans les{' '}
              <Link to="/mentions-legales" className="font-semibold text-fr-green underline">
                mentions légales
              </Link>
              .
            </p>
          </Block>
        )}
        <Block title="Produits et prix">
          <p>
            Ariel All-in-1 PODS, sachets de 60 capsules, proposés dans la limite des stocks disponibles. Prix en francs suisses
            (CHF), livraison en Suisse incluse : {OFFERS.map((o) => `${o.packs} sachet${o.packs > 1 ? 's' : ''} ${formatCHF(o.price)}`).join(' · ')}.
          </p>
        </Block>
        <Block title="Commande">
          <p>
            La commande est conclue par un clic sur « Acheter », qui engage à payer le montant affiché. Une confirmation est envoyée
            par e-mail. Nous pouvons annuler une commande en cas d’erreur manifeste de prix ou de rupture de stock ; tout montant
            déjà payé est alors remboursé.
          </p>
        </Block>
        <Block title="Paiement">
          <p>
            Le paiement s’effectue sur la page sécurisée d’un prestataire spécialisé. Aucune donnée de carte n’est saisie ni
            conservée par la boutique. La commande n’est confirmée qu’après vérification du paiement.
          </p>
        </Block>
        <Block title="Livraison">
          <p>
            Livraison offerte, uniquement en Suisse. Détails sur la page{' '}
            <Link to="/livraison" className="font-semibold text-fr-green underline">
              Livraison
            </Link>
            .
          </p>
        </Block>
        <Block title="Retours">
          <p>
            Retour possible sous {DELIVERY.returnWindowDays} jours après réception, selon la page{' '}
            <Link to="/retours-remboursements" className="font-semibold text-fr-green underline">
              Retours &amp; remboursements
            </Link>
            . La garantie légale pour les défauts s’applique.
          </p>
        </Block>
        <Block title="Droit applicable">
          <p>Les présentes conditions sont soumises au droit suisse.{POLICIES.jurisdiction ? ` For juridique : ${POLICIES.jurisdiction}.` : ''}</p>
        </Block>
      </Prose>
    </>
  )
}
