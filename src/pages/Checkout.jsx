import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, ArrowLeft, Truck, ShieldCheck, Info } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { PRODUCT, DELIVERY, formatCHF } from '../config/store.js'
import { IMAGES } from '../config/assets.js'
import ProductImage from '../components/ui/ProductImage.jsx'
import Button from '../components/ui/Button.jsx'
import { trackStartCheckout } from '../lib/pixel.js'

// Champs du formulaire client.
const FIELDS = [
  { name: 'prenom', label: 'Prénom', type: 'text', autoComplete: 'given-name', col: 1 },
  { name: 'nom', label: 'Nom', type: 'text', autoComplete: 'family-name', col: 1 },
  { name: 'adresse', label: 'Adresse', type: 'text', autoComplete: 'street-address', col: 2 },
  { name: 'npa', label: 'Code postal', type: 'text', autoComplete: 'postal-code', col: 1, inputMode: 'numeric' },
  { name: 'ville', label: 'Ville', type: 'text', autoComplete: 'address-level2', col: 1 },
  { name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email', col: 2 },
  { name: 'telephone', label: 'Téléphone', type: 'tel', autoComplete: 'tel', col: 2, optional: true },
]

const PAYMENTS = ['Carte', 'Apple Pay', 'Google Pay', 'TWINT']

function validate(values) {
  const e = {}
  if (!values.prenom?.trim()) e.prenom = 'Requis'
  if (!values.nom?.trim()) e.nom = 'Requis'
  if (!values.adresse?.trim()) e.adresse = 'Requis'
  if (!/^\d{4}$/.test(values.npa?.trim() || '')) e.npa = 'NPA à 4 chiffres'
  if (!values.ville?.trim()) e.ville = 'Requis'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email?.trim() || '')) e.email = 'E-mail invalide'
  return e
}

export default function Checkout() {
  const { offer, hasItems, washes, total } = useCart()
  const navigate = useNavigate()
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  useEffect(() => {
    if (hasItems) {
      trackStartCheckout({
        currency: 'CHF',
        price: total,
        item_ids: [PRODUCT.id],
        number_items: offer?.packs,
      })
    }
  }, [hasItems]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (name, v) => setValues((s) => ({ ...s, [name]: v }))

  const formReady = useMemo(() => Object.keys(validate(values)).length === 0, [values])

  const onSubmit = (e) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    setTouched(Object.fromEntries(FIELDS.map((f) => [f.name, true])))
    if (Object.keys(errs).length > 0) {
      document.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    // ── FRONTIÈRE D'INTÉGRATION PAIEMENT ──
    // Aucun paiement n'est traité ici. Le paiement réel devra passer par un
    // prestataire conforme (PCI-DSS) avec vérification de commande côté serveur.
    // L'événement PURCHASE ne doit être déclenché qu'après confirmation vérifiée.
    alert(
      "DÉMONSTRATION — Aucune commande n'est réellement passée.\n\n" +
        "Le paiement sera traité par un prestataire externe conforme (à connecter). " +
        "Cette interface valide uniquement la structure du tunnel de commande."
    )
  }

  if (!hasItems) {
    return (
      <div className="container-edge flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <h1 className="text-2xl font-extrabold text-ink">Votre panier est vide</h1>
        <p className="mt-2 max-w-sm text-muted">
          Choisissez une offre avant de passer commande.
        </p>
        <Button to="/" variant="primary" className="mt-6">
          Voir les offres
        </Button>
      </div>
    )
  }

  return (
    <div className="container-edge py-8 sm:py-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-forest"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
        Finaliser la commande
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        {/* ── Formulaire ── */}
        <form onSubmit={onSubmit} noValidate className="order-2 lg:order-1">
          <fieldset>
            <legend className="text-sm font-semibold uppercase tracking-[0.12em] text-forest">
              Livraison
            </legend>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {FIELDS.map((f) => {
                const err = touched[f.name] && errors[f.name]
                return (
                  <div key={f.name} className={f.col === 2 ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
                    <label htmlFor={f.name} className="block text-sm font-medium text-ink">
                      {f.label}
                      {f.optional && <span className="ml-1 text-xs text-muted">(facultatif)</span>}
                    </label>
                    <input
                      id={f.name}
                      name={f.name}
                      type={f.type}
                      inputMode={f.inputMode}
                      autoComplete={f.autoComplete}
                      value={values[f.name] || ''}
                      aria-invalid={Boolean(err)}
                      aria-describedby={err ? `${f.name}-err` : undefined}
                      onChange={(e) => set(f.name, e.target.value)}
                      onBlur={() => {
                        setTouched((s) => ({ ...s, [f.name]: true }))
                        setErrors(validate(values))
                      }}
                      className={`mt-1.5 h-12 w-full rounded-xl border bg-surface px-4 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-forest ${
                        err ? 'border-red-400 focus:border-red-500' : 'border-line'
                      }`}
                    />
                    {err && (
                      <p id={`${f.name}-err`} className="mt-1 text-xs text-red-500">
                        {errors[f.name]}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </fieldset>

          {/* Paiement — frontière d'intégration */}
          <fieldset className="mt-10">
            <legend className="text-sm font-semibold uppercase tracking-[0.12em] text-forest">
              Paiement
            </legend>

            <div className="mt-4 flex flex-wrap gap-2">
              {PAYMENTS.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink/70"
                >
                  {p}
                </span>
              ))}
            </div>

            <div className="mt-4 flex gap-3 rounded-xl border border-line bg-sage/30 p-4">
              <Info size={18} className="mt-0.5 flex-none text-forest" />
              <p className="text-xs leading-relaxed text-ink/75">
                <strong className="font-semibold">Intégration à connecter.</strong> Le
                paiement sera traité par un prestataire externe conforme (type Stripe,
                Datatrans ou Wallee) avec vérification de la commande côté serveur. Aucune
                donnée de carte n'est collectée par cette application. Les moyens de
                paiement ne sont pas encore actifs.
              </p>
            </div>
          </fieldset>

          <Button
            type="submit"
            size="lg"
            fullWidth
            className="mt-8"
            disabled={!formReady}
          >
            <Lock size={17} /> PAYER {formatCHF(total)}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            Démonstration — aucun paiement réel n'est effectué.
          </p>
        </form>

        {/* ── Récapitulatif ── */}
        <aside className="order-1 lg:order-2">
          <div className="rounded-xl2 border border-line bg-surface p-6 lg:sticky lg:top-24">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-forest">
              Votre commande
            </h2>

            <div className="mt-5 flex gap-4">
              <ProductImage
                src={offer.image || IMAGES.packshot}
                fit="contain"
                alt="Ariel All-in-1 PODS"
                ratio="1 / 1"
                className="h-20 w-20 flex-none bg-white"
              />
              <div>
                <h3 className="text-[0.95rem] font-semibold text-ink">{PRODUCT.name}</h3>
                <p className="mt-0.5 text-sm text-muted">{offer.label}</p>
                <p className="text-sm text-muted">{washes} lavages</p>
              </div>
            </div>

            <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              <div className="flex justify-between text-muted">
                <dt>Sous-total produit</dt>
                <dd>{formatCHF(offer.price)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>Livraison</dt>
                <dd className="font-semibold text-forest">Offerte</dd>
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
                <dt className="text-base font-bold text-ink">Total</dt>
                <dd className="text-xl font-extrabold text-forest">{formatCHF(total)}</dd>
              </div>
            </dl>

            <ul className="mt-6 space-y-2.5 text-xs text-ink/70">
              <li className="flex items-center gap-2">
                <Truck size={15} className="text-forest" /> Livraison offerte · estimée sous{' '}
                {DELIVERY.estimateDays} jours ouvrables
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-forest" /> Paiement sécurisé (à venir)
              </li>
            </ul>

            <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
              Retour possible sous {DELIVERY.returnWindowDays} jours après réception —{' '}
              <Link to="/retours-remboursements" className="font-medium text-forest hover:underline">
                en savoir plus
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
