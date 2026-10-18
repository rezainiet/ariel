import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Lock, Truck, RotateCcw, AlertCircle, Loader2, Minus, Plus, ChevronDown } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import {
  OFFERS,
  PRODUCT,
  DELIVERY,
  MERCHANT,
  STORE,
  PAYMENT_METHODS,
  PAYMENT_LABELS,
  formatCHF,
  savingsFor,
  pricePerCapsule,
} from '../config/store.js'
import { trackStartCheckout } from '../lib/pixel.js'
import { startPayment } from '../lib/payment.js'
import { Logo } from '../concepts/frais/ChromeF.jsx'
import { Packs } from '../concepts/frais/HeroF.jsx'
import { Fact, Pending } from '../concepts/c/Pending.jsx'

// Champs — adresse suisse, clavier mobile adapté, autocomplétion standard.
const CONTACT = [
  { name: 'email', label: 'E-mail', type: 'email', autoComplete: 'email', inputMode: 'email', hint: 'Pour la confirmation de commande.' },
  { name: 'tel', label: 'Téléphone', type: 'tel', autoComplete: 'tel', inputMode: 'tel', optional: true, hint: 'Facultatif — utile au transporteur.' },
]
const ADDRESS = [
  { name: 'prenom', label: 'Prénom', autoComplete: 'given-name', half: true },
  { name: 'nom', label: 'Nom', autoComplete: 'family-name', half: true },
  { name: 'rue', label: 'Rue et numéro', autoComplete: 'address-line1' },
  { name: 'complement', label: 'Complément d’adresse', autoComplete: 'address-line2', optional: true },
  { name: 'npa', label: 'NPA', autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 4, npa: true },
  { name: 'ville', label: 'Localité', autoComplete: 'address-level2', city: true },
]
const ALL = [...CONTACT, ...ADDRESS]

function validate(v) {
  const e = {}
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test((v.email || '').trim())) e.email = 'Saisissez une adresse e-mail valide.'
  const tel = (v.tel || '').replace(/[\s.\-()]/g, '')
  if (tel && !/^(\+41|0041|0)[1-9]\d{8}$/.test(tel)) e.tel = 'Numéro suisse attendu, ex. 079 123 45 67.'
  if (!(v.prenom || '').trim()) e.prenom = 'Indiquez votre prénom.'
  if (!(v.nom || '').trim()) e.nom = 'Indiquez votre nom.'
  if (!(v.rue || '').trim()) e.rue = 'Indiquez la rue et le numéro.'
  if (!/^[1-9]\d{3}$/.test((v.npa || '').trim())) e.npa = 'NPA suisse à 4 chiffres.'
  if (!(v.ville || '').trim()) e.ville = 'Indiquez la localité.'
  return e
}

function Field({ f, value, error, onChange, onBlur }) {
  const id = `f-${f.name}`
  return (
    <div className={f.half ? 'col-span-1' : f.npa ? 'col-span-1 sm:col-span-1' : f.city ? 'col-span-1' : 'col-span-2'}>
      <label htmlFor={id} className="block text-sm font-semibold text-fr-ink">
        {f.label}
        {f.optional && <span className="ml-1 font-normal text-fr-muted">(facultatif)</span>}
      </label>
      <input
        id={id}
        name={f.name}
        type={f.type || 'text'}
        inputMode={f.inputMode}
        autoComplete={f.autoComplete}
        maxLength={f.maxLength}
        value={value || ''}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-err` : f.hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange(f.name, e.target.value)}
        onBlur={() => onBlur(f.name)}
        className={`mt-1.5 h-12 w-full rounded-xl border bg-white px-4 text-base text-fr-ink outline-none transition-colors focus:border-fr-green focus:ring-2 focus:ring-fr-green/15 ${
          error ? 'border-red-500' : 'border-fr-line'
        }`}
      />
      {error ? (
        <p id={`${id}-err`} className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle size={13} /> {error}
        </p>
      ) : (
        f.hint && <p id={`${id}-hint`} className="mt-1 text-xs text-fr-muted">{f.hint}</p>
      )}
    </div>
  )
}

function Steps({ current }) {
  const steps = ['Panier', 'Coordonnées', 'Paiement']
  return (
    <ol className="flex items-center gap-2 text-xs font-semibold" aria-label="Étapes de la commande">
      {steps.map((s, k) => (
        <li key={s} className="flex items-center gap-2" aria-current={k === current ? 'step' : undefined}>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem] ${
              k < current ? 'bg-fr-green text-white' : k === current ? 'bg-fr-green text-white ring-4 ring-fr-mint' : 'bg-fr-line text-fr-muted'
            }`}
          >
            {k + 1}
          </span>
          <span className={k === current ? 'text-fr-ink' : 'text-fr-muted'}>{s}</span>
          {k < steps.length - 1 && <span className="h-px w-5 bg-fr-line sm:w-8" />}
        </li>
      ))}
    </ol>
  )
}

function Summary({ offer, changeOffer }) {
  const idx = OFFERS.findIndex((o) => o.id === offer.id)
  const save = savingsFor(offer)
  return (
    <div className="rounded-[1.5rem] border border-fr-line bg-white p-5 lg:p-6">
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-fr-green">Votre commande</h2>
      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-16 w-20 flex-none items-end justify-center rounded-xl bg-fr-mint pb-1">
          <Packs n={offer.packs} size="sm" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-tight text-fr-ink">{PRODUCT.name}</p>
          <p className="text-sm text-fr-muted">
            {offer.packs} sachet{offer.packs > 1 ? 's' : ''} · {offer.washes} capsules · {offer.washes} lavages
          </p>
        </div>
      </div>
      {/* Correction possible avant l'achat (LCD art. 3 let. s) */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-fr-soft px-3 py-2">
        <span className="text-sm font-semibold text-fr-ink">Nombre de sachets</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => OFFERS[idx - 1] && changeOffer(OFFERS[idx - 1].id)}
            disabled={idx <= 0}
            aria-label="Un sachet de moins"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-fr-green disabled:opacity-30"
          >
            <Minus size={15} />
          </button>
          <span className="w-7 text-center font-bold tabular-nums" aria-live="polite">{offer.packs}</span>
          <button
            type="button"
            onClick={() => OFFERS[idx + 1] && changeOffer(OFFERS[idx + 1].id)}
            disabled={idx >= OFFERS.length - 1}
            aria-label="Un sachet de plus"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-fr-green disabled:opacity-30"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
      <dl className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-fr-ink/75"><dt>Prix de l’offre</dt><dd className="tabular-nums">{formatCHF(offer.price)}</dd></div>
        <div className="flex justify-between text-fr-ink/75"><dt>Prix par capsule</dt><dd className="tabular-nums">≈ {formatCHF(pricePerCapsule(offer))}</dd></div>
        <div className="flex justify-between text-fr-ink/75"><dt>Livraison (Suisse)</dt><dd className="font-semibold text-fr-green">Offerte</dd></div>
        {save > 0 && (
          <div className="flex justify-between text-fr-ink/75"><dt>Économie vs sachets à l’unité</dt><dd className="tabular-nums text-fr-green">− {formatCHF(save)}</dd></div>
        )}
        <div className="mt-2 flex items-baseline justify-between border-t border-fr-line pt-3">
          <dt className="text-base font-bold text-fr-ink">Total à payer</dt>
          <dd className="font-extrabold tracking-[-0.03em] text-2xl font-medium tabular-nums text-fr-green">{formatCHF(offer.price)}</dd>
        </div>
        <p className="text-right text-xs text-fr-muted">
          <Fact value={MERCHANT.vatNote} missing="mention TVA (ex. « TVA incluse »)" />
        </p>
      </dl>
      <ul className="mt-4 space-y-1.5 border-t border-fr-line pt-4 text-xs text-fr-ink/75">
        <li className="flex gap-2"><Truck size={14} className="flex-none text-fr-green" /> Livraison estimée sous {DELIVERY.estimateDays} jours ouvrables</li>
        <li className="flex gap-2"><RotateCcw size={14} className="flex-none text-fr-green" /> Retour possible sous {DELIVERY.returnWindowDays} jours après réception</li>
      </ul>
      <p className="mt-4 border-t border-fr-line pt-4 text-xs text-fr-muted">
        Vendeur : <Fact value={MERCHANT.legalName} missing="raison sociale" /> ·{' '}
        <Link to="/mentions-legales" className="font-semibold text-fr-green underline">mentions légales</Link>
      </p>
    </div>
  )
}

export default function Checkout() {
  const { offer, hasItems, total, changeOffer } = useCart()
  const [values, setValues] = useState({})
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | not_configured | error
  const summaryRef = useRef(null)
  const [method, setMethod] = useState(PAYMENT_METHODS[0] || '')
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    if (hasItems) trackStartCheckout({ currency: 'CHF', price: total, item_ids: [PRODUCT.id], number_items: offer?.packs })
  }, [hasItems]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (name, v) => {
    const next = { ...values, [name]: v }
    setValues(next)
    if (touched[name] || submitted) setErrors(validate(next))
  }
  const blur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }))
    setErrors(validate(values))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(values)
    setErrors(errs)
    setSubmitted(true)
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => summaryRef.current?.focus())
      return
    }
    setStatus('loading')
    const res = await startPayment({
      offerId: offer.id,
      packs: offer.packs,
      total: offer.price,
      currency: 'CHF',
      method,
      customer: values,
    })
    if (res.status !== 'redirecting') setStatus(res.status)
  }

  const shownErrors = Object.fromEntries(Object.entries(errors).filter(([k]) => touched[k] || submitted))
  const errorList = ALL.filter((f) => shownErrors[f.name])

  if (!hasItems) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-fr-soft px-6 text-center font-jakarta">
        <Logo />
        <h1 className="mt-8 font-extrabold tracking-[-0.03em] text-3xl text-fr-ink">Votre panier est vide</h1>
        <p className="mt-2 max-w-sm text-fr-muted">Choisissez une offre avant de passer commande.</p>
        <Link to="/#offres" className="mt-6 flex h-12 items-center rounded-full bg-fr-green px-6 font-bold text-white">
          Voir les offres
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-fr-soft font-jakarta">
      <header className="border-b border-fr-line bg-white">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-4 lg:h-16 lg:px-8">
          <Logo />
          <span className="hidden items-center gap-1.5 text-xs font-semibold text-fr-ink/70 sm:flex">
            <Lock size={14} className="text-fr-green" /> Commande en CHF
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1120px] px-4 py-6 lg:px-8 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-fr-muted hover:text-fr-green">
            <ArrowLeft size={16} /> Continuer mes achats
          </Link>
          <Steps current={submitted && !errorList.length ? 2 : 1} />
        </div>

        <h1 className="mt-5 font-extrabold text-[2rem] tracking-[-0.025em] text-fr-ink lg:text-[2.6rem]">Finaliser la commande</h1>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:gap-10">
          <aside className="lg:order-2">
            {/* Mobile : récapitulatif repliable (le formulaire reste visible) ; desktop : toujours déplié */}
            <button
              type="button"
              onClick={() => setShowSummary((v) => !v)}
              aria-expanded={showSummary}
              aria-controls="recapitulatif"
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-fr-line bg-white px-4 py-3 text-left lg:hidden"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-sm font-bold text-fr-green">
                  {showSummary ? 'Masquer' : 'Afficher'} le récapitulatif
                  <ChevronDown size={16} className={`transition-transform ${showSummary ? 'rotate-180' : ''}`} />
                </span>
                <span className="block truncate text-xs text-fr-muted">
                  {offer.packs} sachet{offer.packs > 1 ? 's' : ''} · {offer.washes} lavages · livraison offerte
                </span>
              </span>
              <span className="font-extrabold tracking-[-0.03em] text-xl tabular-nums text-fr-green">{formatCHF(offer.price)}</span>
            </button>
            <div id="recapitulatif" className={`${showSummary ? 'mt-3 block' : 'hidden'} lg:sticky lg:top-6 lg:mt-0 lg:block`}>
              <Summary offer={offer} changeOffer={changeOffer} />
            </div>
          </aside>

          <form onSubmit={onSubmit} noValidate className="lg:order-1">
            {errorList.length > 0 && (
              <div ref={summaryRef} tabIndex={-1} role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4 outline-none">
                <p className="flex items-center gap-2 text-sm font-bold text-red-700">
                  <AlertCircle size={16} /> Veuillez corriger {errorList.length > 1 ? `${errorList.length} champs` : 'un champ'} :
                </p>
                <ul className="mt-2 list-disc space-y-0.5 pl-6 text-sm text-red-700">
                  {errorList.map((f) => (
                    <li key={f.name}>
                      <a href={`#f-${f.name}`} className="underline">{f.label}</a> — {shownErrors[f.name]}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <fieldset className="rounded-[1.5rem] border border-fr-line bg-white p-5 lg:p-6">
              <legend className="px-1 text-sm font-bold uppercase tracking-[0.14em] text-fr-green">1 · Vos coordonnées</legend>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {CONTACT.map((f) => (
                  <Field key={f.name} f={f} value={values[f.name]} error={shownErrors[f.name]} onChange={set} onBlur={blur} />
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-4 rounded-[1.5rem] border border-fr-line bg-white p-5 lg:p-6">
              <legend className="px-1 text-sm font-bold uppercase tracking-[0.14em] text-fr-green">2 · Adresse de livraison</legend>
              <div className="mt-2 grid grid-cols-2 gap-4">
                {ADDRESS.map((f) => (
                  <Field key={f.name} f={f} value={values[f.name]} error={shownErrors[f.name]} onChange={set} onBlur={blur} />
                ))}
                <p className="col-span-2 rounded-lg bg-fr-mint/60 px-3 py-2 text-xs text-fr-ink/75">Pays : <strong>Suisse</strong> — livraison en Suisse uniquement.</p>
              </div>
            </fieldset>

            <fieldset className="mt-4 rounded-[1.5rem] border border-fr-line bg-white p-5 lg:p-6">
              <legend className="px-1 text-sm font-bold uppercase tracking-[0.14em] text-fr-green">3 · Paiement</legend>
              {PAYMENT_METHODS.length ? (
                <div role="radiogroup" aria-label="Moyen de paiement" className="mt-2 grid gap-2 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((m) => (
                    <label
                      key={m}
                      className={`flex h-12 cursor-pointer items-center gap-3 rounded-xl border-2 px-4 text-sm font-semibold ${
                        method === m ? 'border-fr-green bg-fr-mint/60' : 'border-fr-line'
                      }`}
                    >
                      <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-[#0E7A47]" />
                      {PAYMENT_LABELS[m] || m}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <Pending block>prestataire et moyens de paiement réellement activés</Pending>
                  <p className="text-sm text-fr-ink/75">
                    Le paiement sera traité sur la page sécurisée de notre prestataire. Aucune donnée de carte n’est saisie ni
                    conservée par {STORE.name}.
                  </p>
                </div>
              )}
            </fieldset>

            {status === 'not_configured' && (
              <div role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <strong>Paiement en ligne pas encore activé.</strong> Aucune commande n’a été enregistrée et aucun montant n’a été
                débité. (Intégration prestataire à connecter : VITE_PAYMENT_PROVIDER / VITE_CHECKOUT_API.)
              </div>
            )}
            {status === 'error' && (
              <div role="alert" className="mt-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                Le paiement n’a pas pu être initié. Aucun montant n’a été débité. Réessayez dans un instant ou contactez-nous.
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-fr-green shadow-[0_14px_28px_rgba(14,122,71,0.28)] text-base font-extrabold text-white transition-all hover:bg-[#0C6B3E] active:scale-[0.99] disabled:opacity-70"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Redirection vers le paiement…
                </>
              ) : (
                <>
                  <Lock size={17} /> Acheter · {formatCHF(offer.price)}
                </>
              )}
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-fr-muted">
              En cliquant sur « Acheter », vous passez une commande avec obligation de paiement et acceptez nos{' '}
              <Link to="/conditions-generales-de-vente" className="underline">conditions générales de vente</Link>. Une confirmation vous
              est envoyée par e-mail.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
