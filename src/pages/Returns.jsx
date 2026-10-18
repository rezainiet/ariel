import { PageHeader, Prose, Block, TodoNote } from '../components/ui/Prose.jsx'
import { DELIVERY, STORE } from '../config/store.js'

export default function Returns() {
  const email = STORE.supportEmail || '[adresse e-mail du service client à fournir]'
  return (
    <>
      <PageHeader
        eyebrow="Service client"
        title="Retours & remboursements"
        intro={`Notre objectif est que vous soyez pleinement satisfait de votre commande. Vous disposez de ${DELIVERY.returnWindowDays} jours après réception pour demander un retour.`}
      />
      <Prose>
        <Block title="Délai de demande de retour">
          <p>
            Vous pouvez demander un retour dans un délai de {DELIVERY.returnWindowDays} jours
            à compter de la réception de votre commande.
          </p>
        </Block>

        <Block title="Comment contacter le service client">
          <p>
            Pour initier un retour, contactez notre service client en indiquant votre{' '}
            <strong>numéro de commande</strong>. Nous vous communiquerons ensuite les
            instructions de retour détaillées.
          </p>
          <p>Contact&nbsp;: {email}</p>
          <TodoNote>
            l'adresse e-mail (et éventuel formulaire) du service client, ainsi que l'adresse
            de retour physique.
          </TodoNote>
        </Block>

        <Block title="État du produit">
          <p>
            Les produits doivent être retournés dans un état permettant leur traitement.
            S'agissant d'un produit détergent, certaines conditions peuvent s'appliquer
            aux articles ouverts ou utilisés.
          </p>
          <TodoNote>
            si les produits ouverts ou entamés sont éligibles au retour, et dans quelles
            conditions (ces règles dépendent de la politique du marchand et du droit suisse).
          </TodoNote>
        </Block>

        <Block title="Frais de retour">
          <TodoNote>
            qui prend en charge les frais de retour (marchand ou client) et selon quelles
            modalités.
          </TodoNote>
        </Block>

        <Block title="Délai de remboursement">
          <TodoNote>
            le délai de traitement du remboursement après réception et vérification du
            retour.
          </TodoNote>
        </Block>

        <Block title="Articles endommagés ou erronés">
          <p>
            Si vous recevez un article endommagé ou ne correspondant pas à votre commande,
            contactez le service client dès réception avec votre numéro de commande et, si
            possible, une photo. Nous trouverons une solution adaptée.
          </p>
          <TodoNote>
            la procédure exacte et les compensations proposées pour les articles endommagés
            ou erronés.
          </TodoNote>
        </Block>

        <Block title="Mode de remboursement">
          <TodoNote>
            le mode de remboursement (moyen de paiement d'origine, avoir, etc.).
          </TodoNote>
        </Block>

        <Block title="Contact">
          <p>Service client&nbsp;: {email}</p>
          {STORE.supportPhone && <p>Téléphone&nbsp;: {STORE.supportPhone}</p>}
        </Block>

        <p className="rounded-xl border border-line bg-surface p-4 text-xs text-muted">
          Cette politique doit être revue au regard du droit suisse de la consommation
          applicable et des obligations réelles du marchand avant toute mise en ligne.
        </p>
      </Prose>
    </>
  )
}
