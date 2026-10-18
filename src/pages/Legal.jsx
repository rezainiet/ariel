import { PageHeader, Prose, Block } from '../components/ui/Prose.jsx'
import { STORE, MERCHANT, POLICIES, storeRef } from '../config/store.js'

// Mentions légales : seules les informations configurées sont affichées (aucune donnée inventée).
export default function Legal() {
  const address = [MERCHANT.street, [MERCHANT.zip, MERCHANT.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const rows = [
    ['Boutique', STORE.name],
    ['Raison sociale', MERCHANT.legalName],
    ['Adresse', address],
    ['N° IDE', MERCHANT.uid],
    ['E-mail', STORE.supportEmail],
    ['Téléphone', STORE.supportPhone],
  ].filter(([, v]) => v)
  return (
    <>
      <PageHeader eyebrow="Informations légales" title="Mentions légales" intro="Identité de l’exploitant de la boutique." />
      <Prose>
        {rows.length > 0 && (
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
        )}
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
