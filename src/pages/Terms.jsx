import { PageHeader, Prose, Block, TodoNote } from '../components/ui/Prose.jsx'
import { DELIVERY, formatCHF } from '../config/store.js'

export default function Terms() {
  return (
    <>
      <PageHeader
        eyebrow="CGV"
        title="Conditions générales de vente"
        intro="Les présentes conditions encadrent la vente des produits proposés sur la boutique. Modèle à compléter et valider juridiquement."
      />
      <Prose>
        <Block title="Produits et prix">
          <p>
            Les produits sont proposés dans la limite des stocks disponibles. Les prix sont
            indiqués en francs suisses (CHF), livraison offerte. Offres de déstockage&nbsp;:
            1 pack {formatCHF(4)}, 2 packs {formatCHF(7)}, 3 packs {formatCHF(10)}.
          </p>
        </Block>
        <Block title="Commande">
          <p>
            La commande est confirmée par e-mail après validation. Nous nous réservons le
            droit d'annuler toute commande en cas d'erreur manifeste de prix ou de rupture
            de stock.
          </p>
        </Block>
        <Block title="Paiement">
          <p>
            Le paiement s'effectue via un prestataire externe sécurisé. Aucune donnée de
            carte n'est conservée par la boutique.
          </p>
          <TodoNote>le prestataire de paiement retenu et ses conditions.</TodoNote>
        </Block>
        <Block title="Livraison">
          <p>
            Expédition depuis la {DELIVERY.dispatchLocation}, livraison estimée sous{' '}
            {DELIVERY.estimateDays} jours ouvrables. Les délais sont indicatifs.
          </p>
        </Block>
        <Block title="Rétractation et retours">
          <p>
            Les conditions de retour figurent sur la page Retours & remboursements (délai
            de {DELIVERY.returnWindowDays} jours après réception).
          </p>
        </Block>
        <Block title="Responsabilité et droit applicable">
          <TodoNote>
            la raison sociale du vendeur, le siège, le droit applicable et le for juridique,
            ainsi que les clauses obligatoires au regard du droit suisse.
          </TodoNote>
        </Block>
      </Prose>
    </>
  )
}
