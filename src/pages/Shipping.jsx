import { Link } from 'react-router-dom'
import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import { DELIVERY, MERCHANT } from '../config/store.js'

// Conditions de livraison : uniquement des informations confirmées.
// Délai, lieu d'expédition et transporteur n'apparaissent que s'ils sont configurés.
export default function Shipping() {
  const from = MERCHANT.dispatchCity ? `${MERCHANT.dispatchCity} (Suisse)` : DELIVERY.dispatchLocation
  return (
    <>
      <PageHeader eyebrow="Service client" title="Livraison" intro="La livraison est offerte partout en Suisse, sur les trois offres." />
      <Prose>
        <Block title="Frais de livraison">
          <p>
            La livraison est <strong className="text-fr-ink">offerte</strong> en Suisse : le montant affiché avant l’achat est le
            montant total à payer, en CHF.
          </p>
        </Block>
        <Block title="Zone de livraison">
          <p>Nous livrons uniquement à des adresses en Suisse.</p>
        </Block>
        {(DELIVERY.estimateDays || from || MERCHANT.carrier) && (
          <Block title="Expédition">
            {DELIVERY.estimateDays && <p>Délai de livraison estimé : {DELIVERY.estimateDays} jours ouvrables. Les délais sont indicatifs.</p>}
            {from && <p>Expédition depuis {from}.</p>}
            {MERCHANT.carrier && <p>Transporteur : {MERCHANT.carrier}.</p>}
          </Block>
        )}
        <Block title="Suivi de votre commande">
          <p>
            Vous recevez un e-mail de confirmation après votre commande, puis un e-mail lors de l’expédition, avec un lien de suivi
            lorsqu’il est disponible.
          </p>
        </Block>
        <Block title="Colis endommagé ou incomplet">
          <p>
            Contactez-nous dès réception avec votre numéro de commande. Voir aussi{' '}
            <Link to="/retours-remboursements" className="font-semibold text-fr-green underline">
              Retours &amp; remboursements
            </Link>
            .
          </p>
        </Block>
      </Prose>
    </>
  )
}
