import { PageHeader, Prose, Block, TodoNote } from '../components/ui/Prose.jsx'
import { STORE, MERCHANT } from '../config/store.js'
import { Fact } from '../concepts/c/Pending.jsx'

export default function Legal() {
  const address = [MERCHANT.street, [MERCHANT.zip, MERCHANT.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  return (
    <>
      <PageHeader
        eyebrow="Informations légales"
        title="Mentions légales"
        intro="Identité de l’exploitant de la boutique (art. 3 al. 1 let. s LCD)."
      />
      <Prose>
        <Block title="Exploitant">
          <dl className="grid grid-cols-[9rem_1fr] gap-y-2 text-ink/80">
            <dt className="font-semibold text-ink">Boutique</dt>
            <dd>{STORE.name}</dd>
            <dt className="font-semibold text-ink">Raison sociale</dt>
            <dd><Fact value={MERCHANT.legalName} missing="raison sociale (registre du commerce)" /></dd>
            <dt className="font-semibold text-ink">Adresse</dt>
            <dd><Fact value={address} missing="adresse postale" /></dd>
            <dt className="font-semibold text-ink">N° IDE</dt>
            <dd><Fact value={MERCHANT.uid} missing="numéro IDE (CHE-…)" /></dd>
            <dt className="font-semibold text-ink">E-mail</dt>
            <dd><Fact value={STORE.supportEmail} missing="e-mail" /></dd>
            {STORE.supportPhone && (
              <>
                <dt className="font-semibold text-ink">Téléphone</dt>
                <dd>{STORE.supportPhone}</dd>
              </>
            )}
          </dl>
          <p className="text-sm">Un simple formulaire de contact ne suffit pas : l’adresse postale et l’e-mail doivent figurer ici.</p>
        </Block>
        <Block title="Hébergement">
          <TodoNote>le nom et l’adresse de l’hébergeur du site.</TodoNote>
        </Block>
        <Block title="Marques">
          <p>
            Ariel est une marque de The Procter &amp; Gamble Company. Elle est citée uniquement pour désigner le produit vendu.
            {` ${STORE.name}`} n’est pas le site officiel de la marque.
          </p>
        </Block>
      </Prose>
    </>
  )
}
