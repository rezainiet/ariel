import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import MissingInfo from '../components/ui/MissingInfo.jsx'
import { STORE, MERCHANT, POLICIES, storeRef } from '../config/store.js'

export default function Legal() {
  const rows = [
    ['Boutique', STORE.name || <MissingInfo key="store" />],
    ['Raison sociale', MERCHANT.legalName || <MissingInfo key="legal" />],
    ['Rue et numéro', MERCHANT.street || <MissingInfo key="street" />],
    ['NPA', MERCHANT.zip || <MissingInfo key="zip" />],
    ['Localité', MERCHANT.city || <MissingInfo key="city" />],
    ['N° IDE', MERCHANT.uid || <MissingInfo key="uid" />],
    ['E-mail', STORE.supportEmail || <MissingInfo key="email" />],
    ...(STORE.supportPhone ? [['Téléphone', STORE.supportPhone]] : []),
  ]
  return (
    <>
      <PageHeader eyebrow="Informations légales" title="Mentions légales" intro="Identité de l’exploitant de la boutique." />
      <Prose>
        <Block title="Exploitant">
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2">
            {rows.map(([dt, dd]) => (
              <div key={dt} className="contents">
                <dt className="font-semibold text-fr-ink">{dt}</dt>
                <dd>{dd}</dd>
              </div>
            ))}
          </dl>
        </Block>
        {POLICIES.hosting && (
          <Block title="Hébergement">
            <p>{POLICIES.hosting}</p>
          </Block>
        )}
        <Block title="Marques">
          <p>
            Ariel est une marque de The Procter &amp; Gamble Company. Elle est citée uniquement pour désigner le produit vendu.{' '}
            {storeRef(true)} n’est pas le site officiel de la marque.
          </p>
        </Block>
      </Prose>
    </>
  )
}
