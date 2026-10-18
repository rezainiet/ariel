import { PageHeader, Prose, Block, TodoNote } from '../components/ui/Prose.jsx'
import { DELIVERY, STORE, MERCHANT } from '../config/store.js'
import { Fact } from '../concepts/c/Pending.jsx'

export default function Returns() {
  const contact = STORE.supportEmail ? (
    <a href={`mailto:${STORE.supportEmail}`} className="font-semibold text-forest underline">{STORE.supportEmail}</a>
  ) : (
    <Fact value="" missing="e-mail du service client" />
  )
  return (
    <>
      <PageHeader
        eyebrow="Service client"
        title="Retours & remboursements"
        intro={`Vous disposez de ${DELIVERY.returnWindowDays} jours après réception pour demander un retour. Voici comment cela fonctionne, simplement.`}
      />
      <Prose>
        <Block title={`Un engagement de ${DELIVERY.returnWindowDays} jours`}>
          <p>
            Vous pouvez demander un retour dans les {DELIVERY.returnWindowDays} jours qui suivent la réception de votre colis.
            Il s’agit d’un engagement volontaire de notre boutique : en Suisse, la loi ne prévoit pas de droit de rétractation
            pour les achats en ligne.
          </p>
        </Block>

        <Block title="Comment faire">
          <ol className="list-decimal space-y-1 pl-5">
            <li>Écrivez-nous à {contact} en indiquant votre <strong>numéro de commande</strong>.</li>
            <li>Nous vous envoyons les instructions de retour (adresse et modalités d’envoi).</li>
            <li>Dès réception et contrôle du colis, nous procédons au remboursement.</li>
          </ol>
          <TodoNote>l’adresse de retour physique.</TodoNote>
        </Block>

        <Block title="État des produits">
          <TodoNote>
            si les sachets ouverts ou entamés sont acceptés, et à quelles conditions (le label « Swiss Online Garantie », par
            exemple, admet l’exclusion des marchandises utilisées).
          </TodoNote>
        </Block>

        <Block title="Frais de retour">
          <TodoNote>qui prend en charge les frais de retour (boutique ou client).</TodoNote>
        </Block>

        <Block title="Délai et mode de remboursement">
          <TodoNote>le délai de remboursement après réception du retour et le moyen utilisé (en principe le moyen de paiement d’origine).</TodoNote>
        </Block>

        <Block title="Produit endommagé, défectueux ou erroné">
          <p>
            Contactez-nous dès réception, avec votre numéro de commande et si possible une photo. Indépendamment du délai de retour
            volontaire, la garantie légale pour les défauts s’applique (deux ans en droit suisse).
          </p>
        </Block>

        <Block title="Contact">
          <p>{contact}</p>
          {STORE.supportPhone && <p>Téléphone : {STORE.supportPhone}</p>}
          <p className="text-sm">
            <Fact value={MERCHANT.legalName} missing="raison sociale" />
          </p>
        </Block>

        <p className="rounded-xl border border-line bg-surface p-4 text-xs text-muted">
          Texte à faire valider par un juriste au regard du droit suisse et des conditions réelles du marchand avant la mise en
          ligne.
        </p>
      </Prose>
    </>
  )
}
