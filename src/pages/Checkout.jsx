import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ShoppingBag,
  LockKeyhole,
  LockKeyholeOpen,
  Truck,
  RotateCcw,
  AlertCircle,
  Loader2,
  ChevronDown,
  Check,
  CreditCard,
  Info,
  ShieldCheck,
} from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { OFFERS, PRODUCT, DELIVERY, MERCHANT, PAYMENT_METHODS, PAYMENT_LABELS, formatCHF, savingsFor, storeRef } from '../config/store.js'
import { trackMetaPurchaseClick, trackStartCheckout } from '../lib/pixel.js'
import { trackAnalyticsEvent } from '../lib/analytics.js'
import { startPayment, isPaymentConfigured, getRedirectPayment, startRedirectPayment } from '../lib/payment.js'
import { validateCustomer, clean, swissNational } from '../lib/orderValidation.js'
import { hasAddressService, localitiesFor, streetsFor } from '../lib/address.js'
import { Logo } from '../concepts/frais/ChromeF.jsx'
import { Packs } from '../concepts/frais/HeroF.jsx'
import UrgencyPanel from '../concepts/frais/Urgency.jsx'
import { useStoreStatus } from '../lib/storeStatus.js'
import { useStock, isSoldOut, refreshStock } from '../lib/stock.js'
import { Chf } from '../concepts/frais/Icons.jsx'
import { Swap, useMediaQuery } from '../lib/motion.js'

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
  // Indicatif +41 fixe (livraison en Suisse uniquement) : la valeur enregistrée est « +41 79 123 45 67 ».
  { name: 'tel', label: 'Téléphone', type: 'tel', autoComplete: 'tel', inputMode: 'tel', required: true, placeholder: '79 123 45 67', prefix: '+41', hint: 'Numéro suisse, utile au transporteur en cas de besoin.' },
]
const ADDRESS = [
  { name: 'adresse', label: 'Adresse', autoComplete: 'address-line1', required: true, placeholder: 'Rue et numéro' },
  { name: 'complement', label: 'Complément d’adresse', autoComplete: 'address-line2', placeholder: 'Appartement, étage, c/o…' },
  { name: 'npa', label: 'Code postal', autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 4, pattern: '[0-9]*', required: true, zip: true },
  { name: 'ville', label: 'Ville', autoComplete: 'address-level2', required: true, city: true },
]
const ORDERED = [...CONTACT, ...ADDRESS]

const METHOD_ICONS = { card: CreditCard, visa: CreditCard, mastercard: CreditCard, amex: CreditCard }

// « 79 123 45 67 » à l'écran, « +41 79 123 45 67 » dans les valeurs du formulaire.
const withPrefix = (f, input) => {
  const n = swissNational(input)
  return n ? `${f.prefix} ${n}` : ''
}

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
        {f.prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-1.5 border-r border-fr-line pl-4 pr-3 text-[1rem] font-semibold text-fr-ink" aria-hidden="true">
            <svg viewBox="0 0 32 32" className="h-[1.1rem] w-[1.1rem] rounded-[3px]">
              <rect width="32" height="32" fill="#E30613" />
              <path d="M13 6h6v7h7v6h-7v7h-6v-7H6v-6h7z" fill="#fff" />
            </svg>
            {f.prefix}
          </span>
        )}
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
          value={(f.prefix ? swissNational(value) : value) || ''}
          aria-label={f.prefix ? `${f.label}, indicatif ${f.prefix}` : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
          onChange={(e) => onChange(f.name, f.zip ? e.target.value.replace(/\D/g, '').slice(0, 4) : f.prefix ? withPrefix(f, e.target.value) : e.target.value)}
          onBlur={() => onBlur(f.name)}
          className={`h-[3.25rem] w-full rounded-2xl border bg-white px-4 pr-11 ${f.prefix ? 'pl-[5.6rem]' : ''} text-[1rem] text-fr-ink outline-none transition-[border-color,box-shadow,background-color] duration-base ease-out-soft placeholder:text-fr-muted/60 focus:border-fr-green focus:shadow-[0_0_0_4px_rgba(14,122,71,0.12)] ${
            error ? 'border-red-400 bg-red-50/40' : 'border-fr-line hover:border-fr-green/40'
          }`}
        />
        {valid && !error && (
          <span className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2" aria-hidden="true">
            <Check size={17} strokeWidth={2.6} className="animate-pop text-fr-green" />
          </span>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} key={error} className="mt-1.5 flex animate-reveal-down items-center gap-1.5 text-[0.8rem] font-semibold text-red-600">
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

function Section({ n, title, children, aside, done = false, style }) {
  return (
    <section className="animate-fade-up rounded-[1.6rem] bg-white p-5 ring-1 ring-fr-line lg:p-7" style={style} aria-labelledby={`etape-${n}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`etape-${n}`} className="flex items-center gap-3 text-[1.08rem] font-extrabold tracking-[-0.015em] text-fr-ink">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[0.78rem] font-extrabold transition-colors duration-base ${
              done ? 'bg-fr-green text-white' : 'bg-fr-mint text-fr-green'
            }`}
          >
            {done ? (
              <>
                <span className="sr-only">{n}</span>
                <Check size={14} strokeWidth={3} className="animate-pop" aria-hidden="true" />
              </>
            ) : (
              n
            )}
          </span>
          {title}
        </h2>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

// Étapes : le trait vers « Paiement » se remplit à mesure que les informations obligatoires sont complètes.
// « Paiement » devient « prêt » (contour vert), jamais « fait » : le paiement a lieu chez le prestataire.
function Steps({ progress }) {
  const steps = ['Panier', 'Informations', 'Paiement']
  const ready = progress >= 1
  return (
    <ol className="flex items-center gap-2 text-[0.76rem] font-semibold" aria-label="Étapes de la commande">
      {steps.map((s, k) => (
        <li key={s} className="flex items-center gap-2" aria-current={k === 1 ? 'step' : undefined}>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem] transition-[background-color,color,box-shadow] duration-slow ease-out-soft ${
              k === 0
                ? 'bg-fr-green text-white'
                : k === 1
                  ? 'bg-fr-deep text-white ring-4 ring-fr-mint'
                  : ready
                    ? 'bg-white text-fr-green ring-2 ring-fr-green'
                    : 'bg-fr-line text-fr-muted'
            }`}
          >
            {k === 0 ? <Check size={13} strokeWidth={3} /> : k + 1}
          </span>
          <span className={k === 1 ? 'text-fr-ink' : 'text-fr-muted max-[379px]:sr-only'}>
            {s}
            {k === 1 && <span className="sr-only"> ({Math.round(progress * 100)} % complété)</span>}
          </span>
          {k < steps.length - 1 && (
            <span className="relative h-0.5 w-4 overflow-hidden rounded-full bg-fr-line min-[400px]:w-7" aria-hidden="true">
              <span
                className="absolute inset-0 origin-left rounded-full bg-fr-green transition-transform duration-slow ease-out-soft"
                style={{ transform: `scaleX(${k === 0 ? 1 : progress})` }}
              />
            </span>
          )}
        </li>
      ))}
    </ol>
  )
}

function Summary({ offer, changeOffer, stock }) {
  const save = savingsFor(offer)
  const group = useId()
  return (
    <div className="rounded-[1.6rem] bg-white p-5 ring-1 ring-fr-line lg:p-7">
      <h2 className="text-[0.74rem] font-extrabold uppercase tracking-[0.14em] text-fr-green">Votre commande</h2>
      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-[4.5rem] w-[4.5rem] flex-none items-end justify-center rounded-2xl bg-fr-mint pb-2">
          <Swap value={offer.id} anim="animate-fade-in" className="flex">
            <Packs n={offer.packs} size="sm" />
          </Swap>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold leading-tight text-fr-ink">{PRODUCT.name}</p>
          <Swap value={offer.id} as="p" className="mt-0.5 text-[0.86rem] text-fr-muted">
            {offer.packs} sachet{offer.packs > 1 ? 's' : ''} · {offer.washes} capsules
          </Swap>
        </div>
        <Swap value={offer.id} as="p" className="text-[1.05rem] font-extrabold tabular-nums text-fr-ink">
          <Chf v={offer.price} format={formatCHF} />
        </Swap>
      </div>

      {/* Modifier la sélection : remplace l'offre (jamais de doublon), les coordonnées restent saisies */}
      <fieldset className="mt-5">
        <legend className="text-[0.8rem] font-bold text-fr-ink">Modifier mon offre</legend>
        <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-2xl bg-fr-soft p-1.5">
          {OFFERS.map((o) => {
            const on = o.id === offer.id
            const out = isSoldOut(stock, o.id)
            return (
              <label
                key={o.id}
                className={`relative flex cursor-pointer flex-col items-center rounded-xl px-1 py-2 text-center transition-[background-color,box-shadow,transform] duration-base ease-out-soft focus-within:ring-2 focus-within:ring-fr-green motion-safe:active:scale-[0.98] ${
                  on ? 'bg-white shadow-[0_6px_16px_rgba(11,61,42,0.10)] ring-1 ring-fr-green' : 'hover:bg-white/70'
                }`}
              >
                <input type="radio" name={group} value={o.id} checked={on} onChange={() => changeOffer(o.id)} className="sr-only" />
                <span className="text-[0.8rem] font-bold text-fr-ink">
                  {o.packs} sachet{o.packs > 1 ? 's' : ''}
                </span>
                <span className={`text-[0.78rem] font-extrabold tabular-nums transition-colors duration-base ${out ? 'text-fr-muted' : on ? 'text-fr-green' : 'text-fr-muted'}`}>
                  {out ? 'Épuisé' : <Chf v={o.price} format={formatCHF} />}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <dl className="mt-5 space-y-2 text-[0.9rem]">
        <div className="flex justify-between text-fr-muted">
          <dt>Sous-total</dt>
          <Swap value={offer.id} as="dd" className="tabular-nums text-fr-ink">
            <Chf v={offer.price} format={formatCHF} />
          </Swap>
        </div>
        <div className="flex justify-between text-fr-muted">
          <dt>Livraison (Suisse)</dt>
          <dd className="font-bold text-fr-green">Offerte</dd>
        </div>
        {save > 0 && (
          <div className="flex justify-between text-fr-muted">
            <dt>Vous économisez</dt>
            <Swap value={offer.id} as="dd" className="font-semibold tabular-nums text-fr-green">
              − <Chf v={save} format={formatCHF} />
            </Swap>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-fr-line pt-3">
          <dt className="text-[1rem] font-extrabold text-fr-ink">Total à payer</dt>
          <Swap value={offer.id} as="dd" className="text-[1.6rem] font-extrabold tabular-nums tracking-[-0.03em] text-fr-green">
            <Chf v={offer.price} format={formatCHF} />
          </Swap>
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
            className={`flex h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 text-[0.92rem] font-bold transition-colors duration-base focus-within:ring-2 focus-within:ring-fr-green/40 ${
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
  const storeStatus = useStoreStatus()
  const stock = useStock()
  const soldOut = Boolean(offer) && isSoldOut(stock, offer.id)
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
  const desktop = useMediaQuery('(min-width: 1024px)')
  const [cities, setCities] = useState([])
  const [streets, setStreets] = useState([])
  const alertRef = useRef(null)
  // Moyen actif : redirection externe (réglée dans /admin) en priorité, sinon prestataire intégré.
  const [redirect, setRedirect] = useState({ enabled: false, domain: '', provider: '', checked: false })
  useEffect(() => {
    let alive = true
    getRedirectPayment().then((r) => alive && setRedirect({ ...r, checked: true }))
    return () => {
      alive = false
    }
  }, [])
  const paymentReady = redirect.enabled || isPaymentConfigured()
  const formComplete = useMemo(() =>
    Object.keys(validateCustomer(values, { terms })).length === 0,
  [values, terms])
  const canContinue = formComplete && paymentReady && !soldOut && status !== 'loading'
  // Offre épuisée : le récapitulatif (où l'on change d'offre) s'ouvre aussi sur mobile.
  useEffect(() => {
    if (soldOut) setShowSummary(true)
  }, [soldOut])

  useEffect(() => {
    if (hasItems) trackStartCheckout({ currency: 'CHF', price: offer.price, item_ids: [PRODUCT.id], number_items: offer.packs }, offer.id)
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
      trackAnalyticsEvent('checkoutInvalid')
      setStatus('idle')
      return focusAlert()
    }
    if (soldOut) return focusAlert()
    if (!paymentReady) {
      setStatus('unavailable')
      return focusAlert()
    }
    if (status === 'loading') return
    trackAnalyticsEvent('buyClick')
    trackMetaPurchaseClick(offer.id, crypto.randomUUID())
    setStatus('loading')
    if (redirect.enabled) {
      // Le serveur revalide la commande puis renvoie l'URL de la page de paiement externe.
      const res = await startRedirectPayment({ offerId: offer.id, termsAccepted: true, customer: clean(values) }, redirect.provider)
      if (res.status === 'redirecting') return
      trackAnalyticsEvent('checkoutError')
      if (res.status === 'invalid') {
        setErrors(res.errors)
        setStatus('idle')
      } else if (res.status === 'sold_out') {
        // Le serveur a refusé : stock insuffisant au moment de la commande. Rien n'est réservé ni débité.
        await refreshStock()
        setStatus('idle')
      } else setStatus(res.status === 'unavailable' ? 'unavailable' : 'error')
      return focusAlert()
    }
    // Le serveur recalcule le montant à partir de l'offre ; aucun total n'est transmis.
    const res = await startPayment({ offerId: offer.id, method: method || null, termsAccepted: true, customer: clean(values) })
    if (res.status !== 'redirecting') {
      trackAnalyticsEvent('checkoutError')
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
  // Avancement en direct (sans attendre la sortie du champ) : pastilles de section et trait des étapes.
  const liveErrors = useMemo(() => validateCustomer(values), [values])
  const complete = (f) => !liveErrors[f.name] && Boolean((values[f.name] || '').trim())
  const needed = ORDERED.filter((f) => f.required)
  const sectionDone = (fields) => fields.every((f) => !needed.includes(f) || complete(f))
  const progress = (needed.filter(complete).length + (terms ? 1 : 0)) / (needed.length + 1)

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
          <Steps progress={progress} />
        </div>
        <h1 className="mt-5 animate-fade-up text-[1.85rem] font-extrabold leading-tight tracking-[-0.025em] lg:mt-6 lg:text-[2.5rem]">Finaliser ma commande</h1>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:mt-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
          {/* Récapitulatif : repliable sur mobile, collant sur desktop */}
          <aside className="min-w-0 lg:sticky lg:top-6 lg:order-2" aria-label="Récapitulatif de commande">
            <button
              type="button"
              onClick={() => setShowSummary((v) => !v)}
              aria-expanded={showSummary}
              aria-controls="recapitulatif"
              className="flex w-full animate-fade-up items-center gap-3 rounded-2xl bg-white px-4 py-3 text-left ring-1 ring-fr-line transition-shadow duration-base hover:ring-fr-green/40 lg:hidden"
            >
              <span className="flex h-11 w-11 flex-none items-end justify-center rounded-xl bg-fr-mint pb-1">
                <Swap value={offer.id} anim="animate-fade-in" className="flex">
                  <Packs n={offer.packs} size="sm" />
                </Swap>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[0.86rem] font-bold text-fr-green">
                  {showSummary ? 'Masquer' : 'Afficher'} le récapitulatif
                  <ChevronDown size={16} className={`transition-transform duration-slow ease-out-soft ${showSummary ? 'rotate-180' : ''}`} />
                </span>
                <span className="block truncate text-[0.76rem] text-fr-muted">
                  {offer.packs} sachet{offer.packs > 1 ? 's' : ''} · {offer.washes} capsules · livraison offerte
                </span>
              </span>
              <Swap value={offer.id} className="text-[1.15rem] font-extrabold tabular-nums text-fr-ink">
                <Chf v={offer.price} format={formatCHF} />
              </Swap>
            </button>
            <div
              id="recapitulatif"
              inert={!showSummary && !desktop ? '' : undefined}
              className={`grid transition-[grid-template-rows,opacity] duration-slow ease-out-soft lg:block lg:animate-fade-up ${
                showSummary ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 lg:opacity-100'
              }`}
            >
              {/* p-px : l'anneau du récapitulatif n'est pas rogné pendant le dépliage */}
              <div className="-m-px min-h-0 overflow-hidden p-px lg:m-0 lg:overflow-visible lg:p-0">
              <div className="pt-3 lg:pt-0">
              <Summary offer={offer} changeOffer={changeOffer} stock={stock} />
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
              </div>
            </div>
          </aside>

          <form onSubmit={onSubmit} noValidate className="min-w-0 space-y-4 lg:order-1">
            <Section n={1} title="Vos coordonnées" done={sectionDone(CONTACT)}>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 [&>*]:min-w-0">
                {CONTACT.map((f) => (
                  <Field key={f.name} {...fieldProps(f)} />
                ))}
              </div>
            </Section>

            <Section n={2} title="Adresse de livraison" done={sectionDone(ADDRESS)} style={{ animationDelay: '50ms' }}>
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

            {!redirect.enabled && (
              <Section
                n={3}
                title="Paiement"
                style={{ animationDelay: '100ms' }}
                aside={
                  <span className="hidden items-center gap-1 text-[0.74rem] font-semibold text-fr-muted min-[400px]:flex">
                    <LockKeyhole size={13} /> Page sécurisée
                  </span>
                }
              >
              {!redirect.checked ? (
                <p className="flex items-center gap-2 rounded-2xl bg-fr-soft p-3.5 text-[0.86rem] text-fr-muted">
                  <Loader2 size={16} className="animate-spin" /> Chargement des moyens de paiement…
                </p>
              ) : paymentReady ? (
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
                  <ShieldCheck size={18} strokeWidth={1.8} className="mt-0.5 flex-none text-fr-green" />
                  <span>
                    <strong className="font-bold">Paiement sur une page sécurisée.</strong> Vos coordonnées de livraison sont
                    transmises au prestataire pour finaliser la commande. Aucune donnée de carte n’est saisie sur ce site.
                  </span>
                </p>
              )}
              </Section>
            )}

            <div className="animate-fade-up rounded-[1.6rem] bg-white p-5 ring-1 ring-fr-line [animation-delay:150ms] lg:p-6">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl p-3 transition-[background-color,box-shadow] duration-base ${shown.terms ? 'bg-red-50 ring-1 ring-red-300' : 'hover:bg-fr-soft'}`}
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
                    <span id="f-terms-err" className="mt-1 flex animate-reveal-down items-center gap-1.5 text-[0.8rem] font-semibold text-red-600">
                      <AlertCircle size={14} /> {shown.terms}
                    </span>
                  )}
                </span>
              </label>
            </div>

            {/* Messages : erreurs de saisie, paiement indisponible, annulation, erreur prestataire */}
            <div ref={alertRef} tabIndex={-1} className="space-y-3 outline-none">
              {errorList.length > 0 && (
                <div role="alert" className="animate-reveal-down rounded-2xl border border-red-200 bg-red-50 p-4">
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
              {soldOut && (
                <p role="alert" className="flex animate-reveal-down gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[0.88rem] text-amber-900">
                  <AlertCircle size={18} className="mt-0.5 flex-none" />
                  <span>
                    <strong className="font-bold">
                      {offer.packs} sachet{offer.packs > 1 ? 's' : ''} : épuisé pour le moment.
                    </strong>{' '}
                    Aucune commande n’a été enregistrée. Choisissez une autre offre dans le récapitulatif ; vos informations sont conservées.
                  </span>
                </p>
              )}
              {status === 'unavailable' && !errorList.length && (
                <p role="status" className="flex animate-reveal-down gap-2.5 rounded-2xl border border-fr-line bg-white p-4 text-[0.88rem] text-fr-ink">
                  <Info size={18} className="mt-0.5 flex-none text-fr-green" />
                  Vos informations sont complètes, mais le paiement en ligne n’est pas encore ouvert : aucune commande n’a été
                  enregistrée et aucun montant n’a été débité.
                </p>
              )}
              {status === 'cancelled' && (
                <p role="status" className="flex animate-reveal-down gap-2.5 rounded-2xl border border-fr-line bg-white p-4 text-[0.88rem] text-fr-ink">
                  <Info size={18} className="mt-0.5 flex-none text-fr-green" />
                  Paiement annulé : aucune commande n’a été passée. Vos informations sont conservées, vous pouvez réessayer.
                </p>
              )}
              {status === 'error' && (
                <p role="alert" className="flex animate-reveal-down gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-[0.88rem] text-red-700">
                  <AlertCircle size={18} className="mt-0.5 flex-none" />
                  Le paiement n’a pas pu être lancé. Aucun montant n’a été débité. Veuillez réessayer dans un instant.
                </p>
              )}
            </div>

            <UrgencyPanel status={storeStatus} offer={offer} />

            <button
              type="submit"
              disabled={!canContinue}
              aria-disabled={!canContinue}
              data-ready={canContinue}
              className="flex h-[3.75rem] w-full items-center justify-center gap-2.5 rounded-full bg-fr-green text-[1.02rem] font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_14px_28px_rgba(14,122,71,0.28)] transition-[transform,background-color,opacity,box-shadow] duration-base ease-out-soft enabled:hover:bg-[#0C6B3E] can-hover:enabled:hover:-translate-y-px enabled:active:translate-y-0 motion-safe:enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={19} className="animate-spin" /> Redirection vers le paiement…
                </>
              ) : soldOut ? (
                'Offre épuisée'
              ) : (
                <>
                  <span className="relative inline-block h-[18px] w-[18px] shrink-0" aria-hidden="true">
                    <LockKeyhole size={18} strokeWidth={2.2} className={`absolute inset-0 transition-[opacity,transform] duration-base ease-out-soft ${canContinue ? '-translate-y-1 -rotate-12 opacity-0' : 'translate-y-0 rotate-0 opacity-100'}`} />
                    {canContinue && <LockKeyholeOpen size={18} strokeWidth={2.2} className="checkout-unlock absolute inset-0" />}
                    {canContinue && <ShoppingBag size={18} strokeWidth={2} className="checkout-ready-bag absolute inset-0" />}
                  </span>
                  <span>
                    Acheter — <Swap value={offer.id}><Chf v={offer.price} format={formatCHF} /></Swap>
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
