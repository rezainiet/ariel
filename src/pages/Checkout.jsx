import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  LockKeyhole,
  Truck,
  RotateCcw,
  AlertCircle,
  Loader2,
  ChevronDown,
  Check,
  CreditCard,
  Info,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { OFFERS, PRODUCT, DELIVERY, MERCHANT, PAYMENT_METHODS, PAYMENT_LABELS, formatCHF, savingsFor, storeRef } from '../config/store.js'
import { trackStartCheckout } from '../lib/pixel.js'
import { startPayment, isPaymentConfigured } from '../lib/payment.js'
import { validateCustomer, clean } from '../lib/orderValidation.js'
import { hasAddressService, localitiesFor, streetsFor } from '../lib/address.js'
import { Logo } from '../concepts/frais/ChromeF.jsx'
import { Packs } from '../concepts/frais/HeroF.jsx'
import { Chf } from '../concepts/frais/Icons.jsx'

// ─────────────────────────────────────────────────────────────
// Commande — gabarit Frais, pensé d'abord pour mobile.
// Paiement : UNIQUEMENT via la page hébergée du prestataire (src/lib/payment.js).
// Aucune donnée de carte n'est saisie ici ; succès affiché seulement après vérification serveur.
// ─────────────────────────────────────────────────────────────

const FORM_KEY = 'checkout-form-v1'
const readForm = () => {
  try {
    return JSON.parse(sessionStorage.getItem(FORM_KEY)) || {}
  } catch {
    return {}
  }
}

const CONTACT = [
  { name: 'prenom', label: 'Prénom', autoComplete: 'given-name', half: true, required: true },
  { name: 'nom', label: 'Nom', autoComplete: 'family-name', half: true, required: true },
  { name: 'email', label: 'Adresse e-mail', type: 'email', autoComplete: 'email', inputMode: 'email', required: true, hint: 'Pour la confirmation et le suivi de votre commande.' },
  { name: 'tel', label: 'Téléphone', type: 'tel', autoComplete: 'tel', inputMode: 'tel', hint: 'Utile au transporteur en cas de besoin.' },
]
const ADDRESS = [
  { name: 'adresse', label: 'Adresse', autoComplete: 'address-line1', required: true, placeholder: 'Rue et numéro' },
  { name: 'complement', label: 'Complément d’adresse', autoComplete: 'address-line2', placeholder: 'Appartement, étage, c/o…' },
  { name: 'npa', label: 'Code postal', autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 4, pattern: '[0-9]*', required: true, zip: true },
  { name: 'ville', label: 'Ville', autoComplete: 'address-level2', required: true, city: true },
]
const ORDERED = [...CONTACT, ...ADDRESS]

const METHOD_ICONS = { card: CreditCard, visa: CreditCard, mastercard: CreditCard, amex: CreditCard }

function Field({ f, value, error, valid, onChange, onBlur, list }) {
  const id = `f-${f.name}`
  const described = [error && `${id}-err`, f.hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  const span = f.half ? 'col-span-2 min-[400px]:col-span-1' : f.zip || f.city ? 'col-span-2 min-[360px]:col-span-1' : 'col-span-2'
  return (
    <div className={span}>
      <label htmlFor={id} className="block text-[0.86rem] font-bold text-fr-ink">
        {f.label}
        {f.required ? (
          <span className="ml-0.5 text-fr-green" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 text-[0.76rem] font-medium text-fr-muted">(facultatif)</span>
        )}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={f.name}
          type={f.type || 'text'}
          inputMode={f.inputMode}
          autoComplete={f.autoComplete}
          maxLength={f.maxLength}
          pattern={f.pattern}
          placeholder={f.placeholder}
          required={f.required}
          list={list}
          value={value || ''}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
          onChange={(e) => onChange(f.name, f.zip ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value)}
          onBlur={() => onBlur(f.name)}
          className={`h-[3.25rem] w-full rounded-2xl border bg-white px-4 pr-11 text-[1rem] text-fr-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fr-muted/60 focus:border-fr-green focus:shadow-[0_0_0_4px_rgba(14,122,71,0.12)] ${
            error ? 'border-red-400 bg-red-50/40' : 'border-fr-line hover:border-fr-green/40'
          }`}
        />
        {valid && !error && (
          <Check size={17} strokeWidth={2.6} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-fr-green" aria-hidden="true" />
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 flex items-center gap-1.5 text-[0.8rem] font-semibold text-red-600">
          <AlertCircle size={14} className="flex-none" /> {error}
        </p>
      ) : (
        f.hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-[0.76rem] text-fr-muted">
            {f.hint}
          </p>
        )
      )}
    </div>
  )
}

function Section({ n, title, children, aside }) {
  return (
    <section className="rounded-[1.6rem] bg-white p-5 ring-1 ring-fr-line lg:p-7" aria-labelledby={`etape-${n}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`etape-${n}`} className="flex items-center gap-3 text-[1.08rem] font-extrabold tracking-[-0.015em] text-fr-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-fr-mint text-[0.78rem] font-extrabold text-fr-green">{n}</span>
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Steps() {
  const steps = ['Panier', 'Informations', 'Paiement']
  return (
    <ol className="flex items-center gap-2 text-[0.76rem] font-semibold" aria-label="Étapes de la commande">
      {steps.map((s, k) => (
        <li key={s} className="flex items-center gap-2" aria-current={k === 1 ? 'step' : undefined}>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem] ${
              k === 0 ? 'bg-fr-green text-white' : k === 1 ? 'bg-fr-deep text-white ring-4 ring-fr-mint' : 'bg-fr-line text-fr-muted'
            }`}
          >
            {k === 0 ? <Check size={13} strokeWidth={3} /> : k + 1}
          </span>
          <span className={k === 1 ? 'text-fr-ink' : 'text-fr-muted max-[379px]:sr-only'}>{s}</span>
          {k < steps.length - 1 && <span className="h-px w-4 bg-fr-line min-[400px]:w-7" />}
        </li>
      ))}
    </ol>
  )
}

function Summary({ offer, changeOffer }) {
  const save = savingsFor(offer)
  const group = useId()
  return (
    <div className="rounded-[1.6rem] bg-white p-5 ring-1 ring-fr-line lg:p-7">
      <h2 className="text-[0.74rem] font-extrabold uppercase tracking-[0.14em] text-fr-green">Votre commande</h2>
      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-[4.5rem] w-[4.5rem] flex-none items-end justify-center rounded-2xl bg-fr-mint pb-2">
          <Packs n={offer.packs} size="sm" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold leading-tight text-fr-ink">{PRODUCT.name}</p>
          <p className="mt-0.5 text-[0.86rem] text-fr-muted">
            {offer.packs} sachet{offer.packs > 1 ? 's' : ''} · {offer.washes} capsules
          </p>
        </div>
        <p className="text-[1.05rem] font-extrabold tabular-nums text-fr-ink">
          <Chf v={offer.price} format={formatCHF} />
        </p>
      </div>

      {/* Modifier la sélection : remplace l'offre (jamais de doublon), les coordonnées restent saisies */}
      <fieldset className="mt-5">
        <legend className="text-[0.8rem] font-bold text-fr-ink">Modifier mon offre</legend>
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-2xl bg-fr-soft p-1.5">
          {OFFERS.map((o) => {
            const on = o.id === offer.id
            return (
              <label
                key={o.id}
                className={`relative flex cursor-pointer flex-col items-center rounded-xl px-1 py-2 text-center transition-all duration-200 focus-within:ring-2 focus-within:ring-fr-green ${
                  on ? 'bg-white shadow-[0_6px_16px_rgba(11,61,42,0.10)] ring-1 ring-fr-green' : 'hover:bg-white/70'
                }`}
              >
                <input type="radio" name={group} value={o.id} checked={on} onChange={() => changeOffer(o.id)} className="sr-only" />
                <span className="text-[0.8rem] font-bold text-fr-ink">
                  {o.packs} sachet{o.packs > 1 ? 's' : ''}
                </span>
                <span className={`text-[0.78rem] font-extrabold tabular-nums ${on ? 'text-fr-green' : 'text-fr-muted'}`}>
                  <Chf v={o.price} format={formatCHF} />
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <dl className="mt-5 space-y-2 text-[0.9rem]">
        <div className="flex justify-between text-fr-muted">
          <dt>Sous-total</dt>
          <dd className="tabular-nums text-fr-ink">
            <Chf v={offer.price} format={formatCHF} />
          </dd>
        </div>
        <div className="flex justify-between text-fr-muted">
          <dt>Livraison (Suisse)</dt>
          <dd className="font-bold text-fr-green">Offerte</dd>
        </div>
        {save > 0 && (
          <div className="flex justify-between text-fr-muted">
            <dt>Vous économisez</dt>
            <dd className="font-semibold tabular-nums text-fr-green">
              − <Chf v={save} format={formatCHF} />
            </dd>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-fr-line pt-3">
          <dt className="text-[1rem] font-extrabold text-fr-ink">Total à payer</dt>
          <dd className="text-[1.6rem] font-extrabold tabular-nums tracking-[-0.03em] text-fr-green">
            <Chf v={offer.price} format={formatCHF} />
          </dd>
        </div>
      </dl>
      <p className="mt-1 text-right text-[0.74rem] text-fr-muted">
        Prix en CHF{MERCHANT.vatNote ? ` · ${MERCHANT.vatNote}` : ''} · {offer.washes} lavages au dosage standard
      </p>
    </div>
  )
}

function MethodPicker({ method, setMethod }) {
  return (
    <div role="radiogroup" aria-label="Moyen de paiement" className="grid gap-2 sm:grid-cols-2">
      {PAYMENT_METHODS.map((m) => {
        const Icon = METHOD_ICONS[m]
        const on = method === m
        return (
          <label
            key={m}
            className={`flex h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 text-[0.92rem] font-bold transition-colors focus-within:ring-2 focus-within:ring-fr-green/40 ${
              on ? 'border-fr-green bg-fr-mint/50 text-fr-ink' : 'border-fr-line text-fr-ink hover:border-fr-green/40'
            }`}
          >
            <input type="radio" name="method" value={m} checked={on} onChange={() => setMethod(m)} className="h-4 w-4 accent-[#0E7A47]" />
            {Icon && <Icon size={18} strokeWidth={1.8} className="text-fr-green" aria-hidden="true" />}
            {PAYMENT_LABELS[m] || m}
          </label>
        )
      })}
    </div>
  )
}

export default function Checkout() {
  const { offer, hasItems, changeOffer } = useCart()
  const [params] = useSearchParams()
  const [values, setValues] = useState(readForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [terms, setTerms] = useState(false)
  // idle | loading | unavailable | error | cancelled (retour du prestataire : ?paiement=annule / erreur)
  const [status, setStatus] = useState(() => {
    const p = params.get('paiement')
    return p === 'annule' ? 'cancelled' : p === 'erreur' ? 'error' : 'idle'
  })
  const [method, setMethod] = useState(PAYMENT_METHODS[0] || '')
  const [showSummary, setShowSummary] = useState(false)
  const [cities, setCities] = useState([])
  const [streets, setStreets] = useState([])
  const alertRef = useRef(null)
  const paymentReady = isPaymentConfigured()

  useEffect(() => {
    if (hasItems) trackStartCheckout({ currency: 'CHF', price: offer.price, item_ids: [PRODUCT.id], number_items: offer.packs })
  }, [hasItems]) // eslint-disable-line react-hooks/exhaustive-deps

  // Les coordonnées restent saisies (rechargement, retour depuis les conditions, modification de l'offre).
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        sessionStorage.setItem(FORM_KEY, JSON.stringify(values))
      } catch {
        /* stockage indisponible */
      }
    }, 250)
    return () => clearTimeout(t)
  }, [values])

  // Aide à la saisie : seulement si un service d'adresses réel est configuré.
  useEffect(() => {
    if (!hasAddressService() || !/^[1-9]\d{3}$/.test(values.npa || '')) {
      setCities([])
      return
    }
    let alive = true
    localitiesFor(values.npa).then((list) => {
      if (!alive) return
      setCities(list)
      if (list.length === 1 && !values.ville) setValues((v) => ({ ...v, ville: list[0].city }))
    })
    return () => {
      alive = false
    }
  }, [values.npa]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hasAddressService()) return
    let alive = true
    const t = setTimeout(() => streetsFor(values.adresse, values.npa).then((l) => alive && setStreets(l)), 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [values.adresse, values.npa])

  const set = (name, v) => {
    const next = { ...values, [name]: v }
    setValues(next)
    if (touched[name] || submitted) setErrors(validateCustomer(next, { terms: submitted ? terms : undefined }))
  }
  const blur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }))
    setErrors(validateCustomer(values, { terms: submitted ? terms : undefined }))
  }
  const toggleTerms = (v) => {
    setTerms(v)
    if (submitted) setErrors(validateCustomer(values, { terms: v }))
  }

  const focusAlert = () => requestAnimationFrame(() => alertRef.current?.focus())

  const onSubmit = async (e) => {
    e.preventDefault()
    const errs = validateCustomer(values, { terms })
    setErrors(errs)
    setSubmitted(true)
    if (Object.keys(errs).length) {
      setStatus('idle')
      return focusAlert()
    }
    if (!paymentReady) {
      setStatus('unavailable')
      return focusAlert()
    }
    setStatus('loading')
    // Le serveur recalcule le montant à partir de l'offre ; aucun total n'est transmis.
    const res = await startPayment({ offerId: offer.id, method: method || null, termsAccepted: true, customer: clean(values) })
    if (res.status !== 'redirecting') {
      setStatus(res.status === 'not_configured' ? 'unavailable' : 'error')
      focusAlert()
    }
  }

  const shown = useMemo(
    () => Object.fromEntries(Object.entries(errors).filter(([k]) => touched[k] || submitted)),
    [errors, touched, submitted]
  )
  const errorList = [...ORDERED.filter((f) => shown[f.name]), ...(shown.terms ? [{ name: 'terms', label: 'Conditions générales' }] : [])]
  const isValid = (name) => (touched[name] || submitted) && !errors[name] && Boolean((values[name] || '').trim())

  if (!hasItems) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-fr-soft px-6 text-center font-jakarta">
        <Logo />
        <h1 className="mt-8 text-[1.8rem] font-extrabold tracking-[-0.025em] text-fr-ink">Votre panier est vide</h1>
        <p className="mt-2 max-w-sm text-fr-muted">Choisissez votre offre Ariel All‑in‑1 PODS avant de passer commande.</p>
        <Link to="/#offres" className="mt-6 flex h-12 items-center rounded-full bg-fr-green px-6 font-bold text-white shadow-[0_12px_26px_rgba(14,122,71,0.28)]">
          Voir les offres
        </Link>
      </div>
    )
  }

  const fieldProps = (f) => ({ f, value: values[f.name], error: shown[f.name], valid: isValid(f.name), onChange: set, onBlur: blur })

  return (
    <div className="min-h-screen bg-fr-soft font-jakarta text-fr-ink">
      <header className="border-b border-fr-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 lg:h-[4.5rem] lg:px-8">
          <Logo />
          <span className="flex items-center gap-1.5 rounded-full bg-fr-mint px-3 py-1.5 text-[0.76rem] font-bold text-fr-deep">
            <LockKeyhole size={14} strokeWidth={2} className="text-fr-green" /> Paiement sécurisé
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-5 lg:px-8 lg:pt-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[0.86rem] font-semibold text-fr-muted hover:text-fr-green">
            <ArrowLeft size={16} /> Retour à la boutique
          </Link>
          <Steps />
        </div>
        <h1 className="mt-5 text-[1.85rem] font-extrabold leading-tight tracking-[-0.025em] lg:mt-6 lg:text-[2.5rem]">Finaliser ma commande</h1>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:mt-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          {/* Récapitulatif : repliable sur mobile, collant sur desktop */}
          <aside className="min-w-0 lg:sticky lg:top-6 lg:order-2" aria-label="Récapitulatif de commande">
            <button
              type="button"
              onClick={() => setShowSummary((v) => !v)}
              aria-expanded={showSummary}
              aria-controls="recapitulatif"
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-fr-line lg:hidden"
            >
              <span className="flex h-11 w-11 flex-none items-end justify-center rounded-xl bg-fr-mint pb-1">
                <Packs n={offer.packs} size="sm" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[0.86rem] font-bold text-fr-green">
                  {showSummary ? 'Masquer' : 'Afficher'} le récapitulatif
                  <ChevronDown size={16} className={`transition-transform duration-300 ${showSummary ? 'rotate-180' : ''}`} />
                </span>
                <span className="block truncate text-[0.76rem] text-fr-muted">
                  {offer.packs} sachet{offer.packs > 1 ? 's' : ''} · {offer.washes} capsules · livraison offerte
                </span>
              </span>
              <span className="text-[1.15rem] font-extrabold tabular-nums text-fr-ink">
                <Chf v={offer.price} format={formatCHF} />
              </span>
            </button>
            <div id="recapitulatif" className={`${showSummary ? 'mt-3 block animate-fade-in' : 'hidden'} lg:mt-0 lg:block`}>
              <Summary offer={offer} changeOffer={changeOffer} />
              <ul className="mt-3 hidden space-y-2.5 rounded-[1.6rem] bg-white p-5 text-[0.84rem] ring-1 ring-fr-line lg:block">
                <li className="flex items-center gap-2.5">
                  <ShieldCheck size={17} strokeWidth={1.8} className="flex-none text-fr-green" /> Aucune donnée de carte ne transite par notre boutique
                </li>
                <li className="flex items-center gap-2.5">
                  <Truck size={17} strokeWidth={1.8} className="flex-none text-fr-green" /> Livraison offerte en Suisse
                </li>
                <li className="flex items-center gap-2.5">
                  <RotateCcw size={17} strokeWidth={1.8} className="flex-none text-fr-green" /> Retour possible sous {DELIVERY.returnWindowDays} jours après réception
                </li>
              </ul>
            </div>
          </aside>

          <form onSubmit={onSubmit} noValidate className="min-w-0 space-y-4 lg:order-1">
            <Section n={1} title="Vos coordonnées">
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 [&>*]:min-w-0">
                {CONTACT.map((f) => (
                  <Field key={f.name} {...fieldProps(f)} />
                ))}
              </div>
            </Section>

            <Section n={2} title="Adresse de livraison">
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 [&>*]:min-w-0">
                <div className="col-span-2">
                  <p className="block text-[0.86rem] font-bold text-fr-ink" id="pays-label">
                    Pays
                  </p>
                  <p
                    aria-labelledby="pays-label"
                    className="mt-1.5 flex h-[3.25rem] items-center justify-between gap-3 rounded-2xl border border-fr-line bg-fr-soft px-4 text-[1rem] text-fr-ink"
                  >
                    Suisse (CH)
                    <span className="text-right text-[0.72rem] font-semibold leading-tight text-fr-muted">Livraison en Suisse uniquement</span>
                  </p>
                </div>
                {ADDRESS.map((f) => (
                  <Field
                    key={f.name}
                    {...fieldProps(f)}
                    list={f.name === 'adresse' && streets.length ? 'rues' : f.city && cities.length > 1 ? 'localites' : undefined}
                  />
                ))}
                {streets.length > 0 && (
                  <datalist id="rues">
                    {streets.map((s) => (
                      <option key={`${s.street}-${s.zip}`} value={s.street} />
                    ))}
                  </datalist>
                )}
                {cities.length > 1 && (
                  <datalist id="localites">
                    {cities.map((c) => (
                      <option key={c.city} value={c.city} />
                    ))}
                  </datalist>
                )}
              </div>
            </Section>

            <Section
              n={3}
              title="Paiement"
              aside={
                <span className="hidden items-center gap-1 text-[0.74rem] font-semibold text-fr-muted min-[400px]:flex">
                  <LockKeyhole size={13} /> Page sécurisée
                </span>
              }
            >
              {paymentReady ? (
                <div className="space-y-3">
                  {PAYMENT_METHODS.length > 0 && <MethodPicker method={method} setMethod={setMethod} />}
                  <p className="flex gap-2.5 rounded-2xl bg-fr-soft p-3.5 text-[0.84rem] leading-relaxed text-fr-muted">
                    <ShieldCheck size={18} strokeWidth={1.8} className="mt-0.5 flex-none text-fr-green" />
                    Vous serez redirigé vers la page sécurisée de notre prestataire de paiement pour régler {formatCHF(offer.price)}.
                    Aucune donnée de carte n’est saisie ni conservée par notre boutique.
                  </p>
                </div>
              ) : (
                <p className="flex gap-2.5 rounded-2xl bg-fr-soft p-3.5 text-[0.86rem] leading-relaxed text-fr-ink">
                  <Info size={18} strokeWidth={1.8} className="mt-0.5 flex-none text-fr-green" />
                  <span>
                    <strong className="font-bold">Le paiement en ligne n’est pas encore ouvert.</strong> Vous pouvez vérifier votre
                    commande ; aucune commande ne peut être validée ni débitée pour le moment.
                  </span>
                </p>
              )}
            </Section>

            {/* Réassurance confirmée, à côté de l'action finale */}
            <div className="rounded-[1.6rem] bg-white p-5 ring-1 ring-fr-line lg:p-6">
              <ul className="space-y-3 text-[0.88rem]">
                <li className="flex items-start gap-3">
                  <Truck size={19} strokeWidth={1.8} className="mt-0.5 flex-none text-fr-green" />
                  <span>
                    <strong className="font-bold">Livraison offerte en Suisse</strong>
                    {DELIVERY.estimateDays ? ` · estimée sous ${DELIVERY.estimateDays} jours ouvrables` : ''}
                    <Link to="/livraison" target="_blank" rel="noopener" className="ml-1.5 inline-flex items-center gap-0.5 font-semibold text-fr-green underline-offset-2 hover:underline">
                      Conditions <ArrowUpRight size={13} />
                    </Link>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <RotateCcw size={19} strokeWidth={1.8} className="mt-0.5 flex-none text-fr-green" />
                  <span>
                    <strong className="font-bold">Retour possible sous {DELIVERY.returnWindowDays} jours après réception</strong>
                    <Link
                      to="/retours-remboursements"
                      target="_blank"
                      rel="noopener"
                      className="ml-1.5 inline-flex items-center gap-0.5 font-semibold text-fr-green underline-offset-2 hover:underline"
                    >
                      Politique de retour <ArrowUpRight size={13} />
                    </Link>
                  </span>
                </li>
              </ul>
              <details className="group mt-3 rounded-2xl bg-fr-soft px-4 py-3 text-[0.84rem]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-fr-ink [&::-webkit-details-marker]:hidden">
                  Lire le résumé de la politique de retour
                  <ChevronDown size={16} className="flex-none text-fr-green transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-2 space-y-1.5 leading-relaxed text-fr-muted">
                  <p>
                    Vous pouvez demander un retour dans les {DELIVERY.returnWindowDays} jours qui suivent la réception, en indiquant
                    votre numéro de commande. Il s’agit d’un engagement de notre boutique : la loi suisse ne prévoit pas de droit de
                    rétractation pour les achats en ligne.
                  </p>
                  <p>Article endommagé, défectueux ou erroné : contactez-nous dès réception. La garantie légale s’applique.</p>
                </div>
              </details>

              <label
                className={`mt-4 flex cursor-pointer items-start gap-3 rounded-2xl p-3 transition-colors ${shown.terms ? 'bg-red-50 ring-1 ring-red-300' : 'hover:bg-fr-soft'}`}
              >
                <input
                  id="f-terms"
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => toggleTerms(e.target.checked)}
                  aria-invalid={Boolean(shown.terms)}
                  aria-describedby={shown.terms ? 'f-terms-err' : undefined}
                  className="mt-0.5 h-5 w-5 flex-none rounded accent-[#0E7A47]"
                />
                <span className="text-[0.86rem] leading-relaxed text-fr-ink">
                  J’accepte les{' '}
                  <Link to="/conditions-generales-de-vente" target="_blank" rel="noopener" className="font-semibold text-fr-green underline">
                    conditions générales de vente
                  </Link>{' '}
                  et j’ai pris connaissance de la{' '}
                  <Link to="/retours-remboursements" target="_blank" rel="noopener" className="font-semibold text-fr-green underline">
                    politique de retour
                  </Link>
                  .
                  {shown.terms && (
                    <span id="f-terms-err" className="mt-1 flex items-center gap-1.5 text-[0.8rem] font-semibold text-red-600">
                      <AlertCircle size={14} /> {shown.terms}
                    </span>
                  )}
                </span>
              </label>
            </div>

            {/* Messages : erreurs de saisie, paiement indisponible, annulation, erreur prestataire */}
            <div ref={alertRef} tabIndex={-1} className="space-y-3 outline-none">
              {errorList.length > 0 && (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="flex items-center gap-2 text-[0.9rem] font-bold text-red-700">
                    <AlertCircle size={17} /> {errorList.length > 1 ? `Veuillez vérifier ${errorList.length} champs` : 'Veuillez vérifier un champ'}
                  </p>
                  <ul className="mt-2 space-y-1 pl-7 text-[0.86rem] text-red-700">
                    {errorList.map((f) => (
                      <li key={f.name}>
                        <a href={`#f-${f.name}`} className="font-semibold underline">
                          {f.label}
                        </a>{' '}
                        — {shown[f.name]}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {status === 'unavailable' && !errorList.length && (
                <p role="status" className="flex gap-2.5 rounded-2xl border border-fr-line bg-white p-4 text-[0.88rem] text-fr-ink">
                  <Info size={18} className="mt-0.5 flex-none text-fr-green" />
                  Vos informations sont complètes, mais le paiement en ligne n’est pas encore ouvert : aucune commande n’a été
                  enregistrée et aucun montant n’a été débité.
                </p>
              )}
              {status === 'cancelled' && (
                <p role="status" className="flex gap-2.5 rounded-2xl border border-fr-line bg-white p-4 text-[0.88rem] text-fr-ink">
                  <Info size={18} className="mt-0.5 flex-none text-fr-green" />
                  Paiement annulé : aucune commande n’a été passée. Vos informations sont conservées, vous pouvez réessayer.
                </p>
              )}
              {status === 'error' && (
                <p role="alert" className="flex gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-[0.88rem] text-red-700">
                  <AlertCircle size={18} className="mt-0.5 flex-none" />
                  Le paiement n’a pas pu être lancé. Aucun montant n’a été débité. Veuillez réessayer dans un instant.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex h-[3.75rem] w-full items-center justify-center gap-2.5 rounded-full bg-fr-green text-[1.02rem] font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_14px_28px_rgba(14,122,71,0.28)] transition-all duration-200 hover:-translate-y-px hover:bg-[#0C6B3E] active:translate-y-0 disabled:cursor-wait disabled:opacity-80"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={19} className="animate-spin" /> Redirection vers le paiement…
                </>
              ) : (
                <>
                  <LockKeyhole size={18} strokeWidth={2.2} />
                  <span>
                    Acheter — <Chf v={offer.price} format={formatCHF} />
                  </span>
                </>
              )}
            </button>
            <p className="text-center text-[0.76rem] leading-relaxed text-fr-muted">
              En cliquant sur « Acheter », vous passez une commande avec obligation de paiement auprès de {storeRef()}. Une
              confirmation vous est envoyée par e-mail.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
