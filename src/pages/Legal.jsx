import { PageHeader, Prose, Block, TodoNote } from '../components/ui/Prose.jsx'
import { STORE } from '../config/store.js'

export default function Legal() {
  return (
    <>
      <PageHeader
        eyebrow="Informations légales"
        title="Mentions légales"
        intro="Informations relatives à l'éditeur du site et à l'exploitant de la boutique."
      />
      <Prose>
        <Block title="Éditeur du site">
          <p>Boutique&nbsp;: {STORE.name}</p>
          <TodoNote>
            la raison sociale exacte, la forme juridique, l'adresse du siège en Suisse, le
            numéro IDE/CHE, le numéro TVA le cas échéant et le nom du responsable.
          </TodoNote>
        </Block>
        <Block title="Contact">
          {STORE.supportEmail ? (
            <p>E-mail&nbsp;: {STORE.supportEmail}</p>
          ) : (
            <TodoNote>l'adresse e-mail de contact.</TodoNote>
          )}
          {STORE.supportPhone && <p>Téléphone&nbsp;: {STORE.supportPhone}</p>}
        </Block>
        <Block title="Hébergement">
          <TodoNote>le nom et les coordonnées de l'hébergeur du site.</TodoNote>
        </Block>
        <Block title="Propriété intellectuelle">
          <p>
            Les marques et visuels de produits appartiennent à leurs titulaires respectifs.
            Ariel est une marque de son propriétaire&nbsp;; elle est mentionnée à des fins
            d'identification du produit vendu.
          </p>
        </Block>
      </Prose>
    </>
  )
}
