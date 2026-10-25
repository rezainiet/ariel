import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  LockKeyhole, LogOut, Plus, Trash2, Loader2, Check, AlertCircle, ExternalLink, RotateCcw, RefreshCw,
  Boxes, Star, Languages, CreditCard, Clock, ArrowUpRight, PackageCheck, History, Info, ShoppingBag, Download, Mail, Phone, MapPin, BarChart3,
} from 'lucide-react'
import { OFFERS, PRODUCT, formatCHF } from '../config/offers.js'
import { FIELDS, DEFAULT_PARAMS, validateConfig, buildRedirectUrl, normalizeDomain } from '../lib/redirectPayment.js'
import { Logo } from '../concepts/frais/ChromeF.jsx'
import { Packs } from '../concepts/frais/HeroF.jsx'
import { Swap } from '../lib/motion.js'
import { CHANNELS, CHANNEL_LABELS } from '../lib/trafficSource.js'
import { LANGS } from '../i18n/detect.js'

// ─────────────────────────────────────────────────────────────
// Administration — trafic, stock, avis clients, paiement.
// Accès protégé côté serveur (mot de passe ADMIN_PASSWORD, cookie de session httpOnly).
// Page non liée publiquement et non indexée. Le serveur reste la seule source de vérité :
// rien n'est conservé dans le navigateur.
// ─────────────────────────────────────────────────────────────

const SAMPLE = { prenom: 'Léa', nom: 'Muller', email: 'lea.muller@exemple.ch', tel: '079 123 45 67', adresse: 'Rue du Lac 4', complement: 'App. 12', npa: '1003', ville: 'Lausanne' }
const MAX_QTY = 1_000_000

async function call(path, options = {}) {
  try {
    const res = await fetch(path, {
      credentials: 'same-origin',
      headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
      ...options,
    })
    const data = await res.json().catch(() => ({}))
    return { status: res.status, data }
  } catch {
    return { status: 0, data: {} }
  }
}

const dateTime = new Intl.DateTimeFormat('fr-CH', { timeZone: 'Europe/Zurich', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
const timeOnly = new Intl.DateTimeFormat('fr-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit' })
const fmt = (iso) => (iso ? dateTime.format(new Date(iso)) : '—')
const sachets = (n) => `${n} sachet${Math.abs(n) > 1 ? 's' : ''}`

const input =
  'h-11 w-full rounded-xl border border-fr-line bg-white px-3.5 text-[0.95rem] text-fr-ink outline-none transition placeholder:text-fr-muted/60 focus:border-fr-green focus:shadow-[0_0_0_4px_rgba(14,122,71,0.12)] aria-[invalid=true]:border-red-400'
const label = 'block text-[0.8rem] font-bold text-fr-ink'
const btnPrimary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full bg-fr-green px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(14,122,71,0.22)] transition duration-base ease-out-soft hover:bg-[#0C6B3E] motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none'
const btnSecondary =
  'inline-flex h-11 items-center justify-center gap-2 rounded-full border-2 border-fr-green bg-white px-4 text-sm font-bold text-fr-green transition duration-base ease-out-soft hover:bg-fr-mint motion-safe:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50'
const btnQuiet = 'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[0.8rem] font-semibold text-fr-muted transition duration-base ease-out-soft hover:bg-fr-mint hover:text-fr-green motion-safe:active:scale-[0.97] disabled:opacity-50'

function Login({ onDone, configured }) {
  const [password, setPassword] = useState('')
  const [state, setState] = useState({ busy: false, error: '' })
  const submit = async (e) => {
    e.preventDefault()
    setState({ busy: true, error: '' })
    const r = await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
    if (r.status === 200) return onDone()
    setState({
      busy: false,
      error: r.status === 429 ? 'Trop de tentatives. Réessayez dans 10 minutes.' : r.status === 503 ? 'Administration désactivée sur ce serveur.' : r.status === 0 ? 'Serveur injoignable.' : 'Mot de passe incorrect.',
    })
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-fr-soft px-4 font-jakarta">
      <form onSubmit={submit} className="w-full max-w-sm animate-fade-up rounded-[1.6rem] bg-white p-7 ring-1 ring-fr-line">
        <Logo />
        <h1 className="mt-6 text-[1.4rem] font-extrabold tracking-[-0.02em] text-fr-ink">Administration</h1>
        <p className="mt-1 text-sm text-fr-muted">Accès réservé à l’exploitant de la boutique.</p>
        {!configured ? (
          <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            L’accès administrateur n’est pas activé : définissez la variable ADMIN_PASSWORD (12 caractères minimum) sur le serveur.
          </p>
        ) : (
          <>
            <label htmlFor="pw" className="mt-5 block text-sm font-bold text-fr-ink">
              Mot de passe
            </label>
            <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={Boolean(state.error)} aria-describedby={state.error ? 'pw-err' : undefined} className={`${input} mt-1.5`} />
            {state.error && (
              <p id="pw-err" role="alert" key={state.error} className="mt-2 flex animate-reveal-down items-center gap-1.5 text-sm font-semibold text-red-600">
                <AlertCircle size={15} /> {state.error}
              </p>
            )}
            <button disabled={state.busy || !password} className={`${btnPrimary} mt-5 h-12 w-full`}>
              {state.busy ? <Loader2 size={18} className="animate-spin" /> : <LockKeyhole size={17} />} Se connecter
            </button>
          </>
        )}
      </form>
    </div>
  )
}

// ── Éléments communs ──
function Card({ title, desc, icon: Icon, aside, children, className = '' }) {
  return (
    <section className={`rounded-[1.25rem] bg-white p-4 ring-1 ring-fr-line sm:p-5 ${className}`}>
      {title && (
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 items-start gap-2.5">
            {Icon && (
              <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-fr-mint text-fr-green ring-1 ring-fr-green/10">
                <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              <h2 className="text-[1rem] font-extrabold tracking-[-0.015em] text-fr-ink">{title}</h2>
              {desc && <p className="mt-0.5 max-w-2xl text-[0.8rem] leading-relaxed text-fr-muted">{desc}</p>}
            </div>
          </div>
          {aside}
        </div>
      )}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </section>
  )
}

const Err = ({ id, msg }) =>
  msg ? (
    <p id={id} key={msg} className="mt-1.5 flex animate-reveal-down items-center gap-1.5 text-[0.78rem] font-semibold text-red-600">
      <AlertCircle size={14} className="flex-none" /> {msg}
    </p>
  ) : null

function Notice({ tone = 'ok', children }) {
  if (!children) return null
  const tones = {
    ok: 'bg-fr-mint text-fr-deep',
    error: 'bg-red-50 text-red-700',
    warn: 'bg-amber-50 text-amber-900',
  }
  const Icon = tone === 'ok' ? Check : AlertCircle
  return (
    <p
      key={typeof children === 'string' ? children : undefined}
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex animate-reveal-down items-start gap-2 rounded-xl px-3 py-2.5 text-[0.82rem] font-semibold ${tones[tone]}`}
    >
      <Icon size={16} className="mt-px flex-none" /> <span>{children}</span>
    </p>
  )
}

function Pill({ tone, children }) {
  const tones = {
    green: 'bg-fr-mint text-fr-green',
    deep: 'bg-fr-deep text-white',
    muted: 'bg-fr-soft text-fr-muted ring-1 ring-fr-line',
    amber: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  }
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${tones[tone]}`}>{children}</span>
}

// ── Commandes ──
// Chaque clic « Acheter » validé par le serveur, dédupliqué (même client + même offre = une commande).
const CHANNEL_TONES = { meta: 'bg-[#E7F0FF] text-[#1D4ED8]', snapchat: 'bg-[#FFFBD1] text-[#7A6400]', google: 'bg-[#FDECEA] text-[#B3261E]', other: 'bg-fr-soft text-fr-muted ring-1 ring-fr-line', direct: 'bg-fr-soft text-fr-muted ring-1 ring-fr-line' }
const STATUS_LABELS = { pending: ['Paiement à vérifier', 'amber'], confirmed: ['Confirmée', 'green'], cancelled: ['Annulée', 'muted'] }

function ChannelPill({ channel }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] font-bold ${CHANNEL_TONES[channel] || CHANNEL_TONES.direct}`}>{CHANNEL_LABELS[channel] || 'Direct'}</span>
}

const csvCell = (v) => {
  const value = String(v ?? '')
  // Customer and campaign fields are untrusted; prevent spreadsheet formula execution.
  const safe = /^\s*[=+\-@]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}
function exportCsv(orders, channel) {
  const head = ['Date', 'Commande', 'Statut', 'Provenance', 'Source UTM', 'Campagne UTM', 'Offre', 'Sachets', 'Total CHF', 'Prénom', 'Nom', 'E-mail', 'Téléphone', 'Adresse', 'Complément', 'NPA', 'Ville', 'Clics']
  const rows = orders.map((o) => [
    o.createdAt, o.orderId, STATUS_LABELS[o.status]?.[0] || o.status, CHANNEL_LABELS[o.channel], o.source?.last?.utmSource, o.source?.last?.utmCampaign,
    o.offerId, o.packs, o.total, o.customer.prenom, o.customer.nom, o.customer.email, o.customer.tel, o.customer.adresse, o.customer.complement, o.customer.npa, o.customer.ville, o.clicks,
  ])
  const csv = '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `commandes-${channel}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function OrdersPanel({ data, error, onReload }) {
  const [channel, setChannel] = useState('all')
  const [closing, setClosing] = useState('')
  const [actionError, setActionError] = useState('')
  const closeOrder = async (orderId, action) => {
    if (!window.confirm(action === 'confirm' ? 'Confirmer ce paiement uniquement après l’avoir vérifié chez le prestataire ?' : 'Annuler cette commande en attente ?')) return
    setClosing(orderId)
    setActionError('')
    const result = await call(`/api/admin/orders/${orderId}/${action}`, { method: 'POST', body: '{}' })
    setClosing('')
    if (result.status === 200) return onReload()
    setActionError('Impossible de modifier cette commande. Actualisez la liste et réessayez.')
  }
  const orders = useMemo(() => (data?.orders || []).filter((o) => channel === 'all' || o.channel === channel), [data, channel])
  const filters = [['all', 'Toutes', data?.total], ...CHANNELS.map((c) => [c, CHANNEL_LABELS[c], data?.byChannel?.[c]])]
  return (
    <Card
      icon={ShoppingBag}
      title="Commandes"
      desc="Chaque clic sur « Acheter » validé par le serveur, avec les coordonnées du client et sa provenance. Un même client qui recommande la même offre n’est compté qu’une fois."
      aside={
        <div className="flex gap-1">
          <button type="button" onClick={onReload} className={btnQuiet}><RefreshCw size={14} /> Actualiser</button>
          <button type="button" onClick={() => exportCsv(orders, channel)} disabled={!orders.length} className={btnQuiet}><Download size={14} /> CSV</button>
        </div>
      }
    >
      {error && <Notice tone="error">{error}</Notice>}
      {actionError && <Notice tone="error">{actionError}</Notice>}
      <div role="group" aria-label="Filtrer par provenance" className="flex flex-wrap gap-1.5">
        {filters.map(([id, name, n]) => (
          <button
            key={id}
            type="button"
            aria-pressed={channel === id}
            onClick={() => setChannel(id)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[0.82rem] font-bold transition duration-base ease-out-soft ${
              channel === id ? 'bg-fr-deep text-white' : 'bg-white text-fr-ink ring-1 ring-fr-line hover:ring-fr-green/40'
            }`}
          >
            {name}
            <span className={`rounded-full px-1.5 text-[0.7rem] tabular-nums ${channel === id ? 'bg-white/20' : 'bg-fr-soft text-fr-muted'}`}>{n ?? '…'}</span>
          </button>
        ))}
      </div>

      {!data && !error && <p className="mt-4 flex items-center gap-2 text-[0.85rem] text-fr-muted"><Loader2 size={15} className="animate-spin" /> Chargement des commandes…</p>}
      {data && !orders.length && <p className="mt-4 rounded-xl bg-fr-soft px-3 py-3 text-[0.85rem] text-fr-muted">Aucune commande{channel !== 'all' ? ` venant de ${CHANNEL_LABELS[channel]}` : ''} pour le moment.</p>}

      <ul className="mt-4 space-y-2.5">
        {orders.map((o) => {
          const [statusLabel, statusTone] = STATUS_LABELS[o.status] || [o.status, 'muted']
          const c = o.customer
          const campaign = o.source?.last?.utmCampaign || o.source?.last?.utmSource
          return (
            <li key={o.orderId} className="rounded-2xl p-3.5 ring-1 ring-fr-line sm:p-4">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span className="text-[0.95rem] font-extrabold text-fr-ink">{c.prenom} {c.nom}</span>
                <ChannelPill channel={o.channel} />
                <Pill tone={statusTone}>{statusLabel}</Pill>
                {o.clicks > 1 && <Pill tone="muted">{o.clicks} clics fusionnés</Pill>}
                <span className="ml-auto text-[0.76rem] tabular-nums text-fr-muted">{fmt(o.createdAt)}</span>
              </div>
              <div className="mt-2 grid gap-x-4 gap-y-1 text-[0.82rem] text-fr-ink sm:grid-cols-2">
                <span className="flex min-w-0 items-center gap-1.5"><Mail size={13} className="flex-none text-fr-muted" /><span className="truncate">{c.email}</span></span>
                <span className="flex items-center gap-1.5"><Phone size={13} className="flex-none text-fr-muted" />{c.tel || '—'}</span>
                <span className="flex min-w-0 items-center gap-1.5 sm:col-span-2"><MapPin size={13} className="flex-none text-fr-muted" /><span className="truncate">{[c.adresse, c.complement, `${c.npa} ${c.ville}`].filter(Boolean).join(', ')}</span></span>
              </div>
              <p className="mt-2 text-[0.78rem] text-fr-muted">
                <strong className="font-bold text-fr-ink">{sachets(o.packs)} · {formatCHF(o.total)}</strong>
                {campaign ? ` · campagne « ${campaign} »` : ''}
                {o.source?.last?.clickIdType ? ` · clic ${o.source.last.clickIdType}` : o.source?.last?.referrerHost ? ` · via ${o.source.last.referrerHost}` : ''}
                {' · '}{o.provider === 'external' ? 'redirection externe' : 'Everflow'} · n° {o.orderId.slice(0, 8)}
              </p>
              {o.provider === 'external' && o.status === 'pending' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={Boolean(closing)} onClick={() => closeOrder(o.orderId, 'confirm')} className={btnSecondary}>Paiement vérifié</button>
                  <button type="button" disabled={Boolean(closing)} onClick={() => closeOrder(o.orderId, 'cancel')} className={btnQuiet}>Annuler</button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

// ── Vue d'ensemble ──
function Overview({ stock, reviews, payment, orders, onOpen }) {
  const pending = stock?.reservations.filter((r) => r.active) || []
  const expired = stock?.reservations.filter((r) => !r.active) || []
  const tiles = [
    {
      tab: 'orders',
      icon: ShoppingBag,
      label: 'Commandes',
      value: !orders ? '…' : String(orders.total),
      sub: !orders ? 'Chargement' : `Meta ${orders.byChannel.meta} · Snap ${orders.byChannel.snapchat} · Google ${orders.byChannel.google}`,
    },
    {
      tab: 'stock',
      icon: Boxes,
      label: 'Stock disponible',
      value: !stock ? '…' : stock.tracked ? sachets(stock.available) : 'Non renseigné',
      sub: !stock ? 'Chargement' : stock.tracked ? `${stock.onHand} en stock · ${stock.held} réservé${stock.held > 1 ? 's' : ''}` : 'Commandes non limitées',
      tone: stock && !stock.tracked ? 'amber' : stock?.tracked && stock.available === 0 ? 'red' : null,
    },
    {
      tab: 'stock',
      focus: 'reservations',
      icon: Clock,
      label: 'Paiements à vérifier',
      value: !stock ? '…' : String(pending.length + expired.length),
      sub: !stock ? 'Chargement' : `${pending.length} en cours · ${expired.length} expirée${expired.length > 1 ? 's' : ''}`,
      tone: expired.length ? 'amber' : null,
    },
    { tab: 'reviews', icon: Star, label: 'Avis publiés', value: reviews === null ? '…' : String(reviews.length), sub: 'Visibles sur la boutique' },
    {
      tab: 'payment',
      icon: CreditCard,
      label: 'Paiement',
      value: payment.everflow ? 'Everflow actif' : payment.redirect ? 'Redirection active' : 'Fermé',
      sub: payment.everflow ? 'Page hébergée' : payment.redirect ? payment.domain : 'Aucune commande possible',
      tone: !payment.everflow && !payment.redirect ? 'muted' : null,
    },
  ]
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
      {tiles.map((t) => (
        <button
          key={t.label}
          type="button"
          onClick={() => onOpen(t.tab, t.focus)}
          className="group flex min-w-0 flex-col rounded-[1.1rem] bg-white p-3.5 text-left ring-1 ring-fr-line transition duration-base ease-out-soft hover:ring-fr-green/40 can-hover:hover:-translate-y-0.5 can-hover:hover:shadow-[0_10px_24px_rgba(11,61,42,0.08)] motion-safe:active:scale-[0.98] sm:p-4"
        >
          <span className="flex items-center gap-2 text-[0.68rem] font-extrabold uppercase tracking-[0.1em] text-fr-muted">
            <t.icon size={14} strokeWidth={2} className="text-fr-green" aria-hidden="true" />
            {t.label}
            {t.tone && t.tone !== 'muted' && <span className={`ml-auto h-2 w-2 rounded-full ${t.tone === 'red' ? 'bg-red-500' : 'bg-amber-500'}`} aria-hidden="true" />}
          </span>
          <Swap value={t.value} className={`mt-1.5 truncate text-[1.15rem] font-extrabold tracking-[-0.02em] sm:text-[1.3rem] ${t.tone === 'muted' ? 'text-fr-muted' : 'text-fr-ink'}`}>{t.value}</Swap>
          <span className="truncate text-[0.74rem] text-fr-muted">{t.sub}</span>
        </button>
      ))}
    </div>
  )
}

// ── Stock ──
const MOVES = {
  set: 'Quantité définie',
  untrack: 'Suivi désactivé',
  receive: 'Entrée de stock',
  remove: 'Sortie de stock',
  hold: 'Réservation (redirection paiement)',
  commit: 'Paiement confirmé · déduit',
  release: 'Réservation annulée',
}

function StockEditor({ stock, onStock, onLogout }) {
  const [qty, setQty] = useState(stock.onHand ?? '')
  const [hold, setHold] = useState(String(stock.holdMinutes))
  const [delta, setDelta] = useState('')
  const [state, setState] = useState({ busy: '', msg: '', error: '', errors: {} })
  const baseVersion = useRef(stock.version)

  // Valeurs du serveur reprises tant que l'administrateur n'a rien modifié.
  const dirty = String(qty) !== String(stock.onHand ?? '') || hold !== String(stock.holdMinutes)
  useEffect(() => {
    if (!dirty) baseVersion.current = stock.version
  }, [stock.version, dirty])
  useEffect(() => {
    if (!dirty) {
      setQty(stock.onHand ?? '')
      setHold(String(stock.holdMinutes))
    }
  }, [stock.onHand, stock.holdMinutes]) // eslint-disable-line react-hooks/exhaustive-deps

  const qtyText = String(qty).trim()
  const qtyError = qtyText === '' ? (stock.tracked ? 'Indiquez une quantité (0 si plus aucun sachet).' : '') : !/^\d+$/.test(qtyText) || Number(qtyText) > MAX_QTY ? `Nombre entier de 0 à ${MAX_QTY.toLocaleString('fr-CH')}.` : ''
  const holdError = !/^\d+$/.test(hold.trim()) || Number(hold) < 5 || Number(hold) > 1440 ? 'Entre 5 et 1440 minutes.' : ''
  const deltaText = delta.trim()
  const deltaError = deltaText && (!/^[+-]?\d+$/.test(deltaText) || Number(deltaText) === 0) ? 'Nombre entier, ex. +24 ou −3.' : ''

  const send = async (kind, body) => {
    setState({ busy: kind, msg: '', error: '', errors: {} })
    const r = await call(kind === 'adjust' ? '/api/admin/stock/adjust' : '/api/admin/stock', { method: kind === 'adjust' ? 'POST' : 'PUT', body: JSON.stringify(body) })
    if (r.status === 401) return onLogout()
    if (r.status === 200) {
      baseVersion.current = r.data.version
      onStock(r.data)
      setQty(r.data.onHand ?? '')
      setHold(String(r.data.holdMinutes))
      if (kind === 'adjust') setDelta('')
      const msg = kind === 'untrack' ? 'Suivi du stock désactivé : les commandes ne sont plus limitées.' : kind === 'adjust' ? `Stock ajusté : ${sachets(r.data.onHand)} en stock.` : r.data.tracked ? `Stock enregistré : ${sachets(r.data.onHand)} en stock.` : 'Réglage enregistré.'
      return setState({ busy: '', msg, error: '', errors: {} })
    }
    if (r.status === 409 && r.data.error === 'conflict' && r.data.stock) {
      onStock(r.data.stock)
      baseVersion.current = r.data.stock.version
      return setState({ busy: '', msg: '', errors: {}, error: `Le stock a changé pendant votre saisie (commande ou autre onglet) : ${r.data.stock.tracked ? sachets(r.data.stock.onHand) : 'non renseigné'} actuellement. Vérifiez puis enregistrez à nouveau.` })
    }
    setState({ busy: '', msg: '', errors: r.data.errors || {}, error: r.status === 0 ? 'Serveur injoignable : rien n’a été modifié.' : Object.values(r.data.errors || {})[0] || 'Enregistrement impossible.' })
  }

  const save = (e) => {
    e.preventDefault()
    if (qtyError || holdError) return setState({ busy: '', msg: '', error: '', errors: { onHand: qtyError, holdMinutes: holdError } })
    send('set', { onHand: qtyText === '' ? null : Number(qtyText), holdMinutes: Number(hold), version: baseVersion.current })
  }
  const adjust = (e) => {
    e.preventDefault()
    if (!deltaText || deltaError) return setState({ busy: '', msg: '', error: '', errors: { delta: deltaError || 'Indiquez une quantité.' } })
    send('adjust', { delta: Number(deltaText) })
  }
  const untrack = () => {
    if (!window.confirm('Ne plus suivre le stock ? Les commandes ne seront plus limitées et aucune offre ne sera affichée comme épuisée.')) return
    send('untrack', { onHand: null, version: baseVersion.current })
  }
  const errors = { ...state.errors }

  return (
    <Card
      icon={Boxes}
      title="Stock produit"
      desc="Le serveur est la seule référence : chaque commande est vérifiée au moment du paiement."
      aside={stock.tracked ? <Pill tone={stock.available === 0 ? 'red' : 'green'}>{stock.available === 0 ? 'Épuisé' : 'Suivi actif'}</Pill> : <Pill tone="amber">À renseigner</Pill>}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-fr-soft p-3">
        <span className="flex h-12 w-12 flex-none items-end justify-center rounded-xl bg-fr-mint pb-1">
          <Packs n={1} size="sm" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[0.92rem] font-extrabold">{PRODUCT.name}</p>
          <p className="text-[0.74rem] text-fr-muted">
            Unité : sachet de {PRODUCT.washesPerPack} capsules · réf. <span className="font-mono">{stock.sku}</span>
          </p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ['En stock', stock.tracked ? stock.onHand : '—', 'physique'],
          ['Réservé', stock.held, 'paiement en cours'],
          ['Disponible', stock.tracked ? stock.available : '—', 'à la vente'],
        ].map(([k, v, s]) => (
          <div key={k} className="rounded-xl px-1 py-2 ring-1 ring-fr-line">
            <dt className="text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-fr-muted">{k}</dt>
            <dd className="text-[1.35rem] font-extrabold tabular-nums tracking-[-0.02em] text-fr-ink">{v}</dd>
            <dd className="text-[0.66rem] text-fr-muted">{s}</dd>
          </div>
        ))}
      </dl>

      {!stock.tracked && (
        <div className="mt-3">
          <Notice tone="warn">
            Quantité non renseignée : les commandes ne sont pas limitées et rien n’est affiché comme épuisé. Saisissez le nombre réel de sachets
            prêts à l’expédition.
          </Notice>
        </div>
      )}

      <form onSubmit={save} noValidate className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-start">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="stock-qty" className={label}>
            Sachets en stock
          </label>
          <input
            id="stock-qty"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={stock.tracked ? '' : 'Non renseignée'}
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, '').slice(0, 7))}
            aria-invalid={Boolean(errors.onHand)}
            aria-describedby={errors.onHand ? 'stock-qty-err' : 'stock-qty-hint'}
            className={`${input} mt-1 tabular-nums`}
          />
          {errors.onHand ? <Err id="stock-qty-err" msg={errors.onHand} /> : <p id="stock-qty-hint" className="mt-1 text-[0.72rem] text-fr-muted">Nombre entier ≥ 0. Les sachets réservés en font partie.</p>}
        </div>
        <div>
          <label htmlFor="stock-hold" className={label}>
            Réservation <span className="font-normal text-fr-muted">(min)</span>
          </label>
          <input
            id="stock-hold"
            type="text"
            inputMode="numeric"
            value={hold}
            onChange={(e) => setHold(e.target.value.replace(/[^\d]/g, '').slice(0, 4))}
            aria-invalid={Boolean(errors.holdMinutes)}
            aria-describedby={errors.holdMinutes ? 'stock-hold-err' : undefined}
            className={`${input} mt-1 tabular-nums`}
          />
          <Err id="stock-hold-err" msg={errors.holdMinutes} />
        </div>
        <div className="flex items-end sm:pt-[1.3rem]">
          <button type="submit" disabled={Boolean(state.busy) || !dirty} className={`${btnPrimary} w-full`}>
            {state.busy === 'set' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Enregistrer
          </button>
        </div>
      </form>

      <form onSubmit={adjust} noValidate className="mt-3 grid grid-cols-[1fr_auto] items-start gap-3 border-t border-fr-line pt-3">
        <div>
          <label htmlFor="stock-delta" className={label}>
            Entrée / sortie <span className="font-normal text-fr-muted">(+ réception, − casse ou inventaire)</span>
          </label>
          <input
            id="stock-delta"
            type="text"
            inputMode="numeric"
            placeholder="+24"
            value={delta}
            disabled={!stock.tracked}
            onChange={(e) => setDelta(e.target.value.replace(/[^\d+−-]/g, '').replace('−', '-').slice(0, 8))}
            aria-invalid={Boolean(errors.delta || deltaError)}
            aria-describedby={errors.delta || deltaError ? 'stock-delta-err' : undefined}
            className={`${input} mt-1 tabular-nums disabled:bg-fr-soft`}
          />
          <Err id="stock-delta-err" msg={errors.delta || deltaError} />
        </div>
        <button type="submit" disabled={Boolean(state.busy) || !stock.tracked || !deltaText} className={`${btnSecondary} mt-[1.3rem]`}>
          {state.busy === 'adjust' ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Ajuster
        </button>
      </form>
      <p className="mt-1.5 text-[0.72rem] text-fr-muted">L’ajustement s’ajoute au stock actuel : il reste juste même si une commande arrive en même temps.</p>

      <div className="mt-3 space-y-2" aria-live="polite">
        <Notice>{state.msg}</Notice>
        <Notice tone="error">{state.error}</Notice>
      </div>
      {stock.tracked && (
        <button type="button" onClick={untrack} disabled={Boolean(state.busy)} className={`${btnQuiet} mt-2 -ml-3`}>
          Ne plus suivre le stock
        </button>
      )}
    </Card>
  )
}

function OfferAvailability({ stock }) {
  return (
    <Card icon={PackageCheck} title="Disponibilité par offre" desc="Les trois offres puisent dans le même stock de sachets.">
      <ul className="divide-y divide-fr-line">
        {stock.offers.map((o) => (
          <li key={o.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="flex h-10 w-12 flex-none items-end justify-center rounded-xl bg-fr-mint pb-1">
              <Packs n={o.packs} size="sm" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.88rem] font-extrabold">
                {sachets(o.packs)} · <span className="text-fr-green">{formatCHF(o.price)}</span>
              </p>
              <p className="text-[0.74rem] text-fr-muted">
                Retire {sachets(o.packs)} du stock
                {stock.tracked && ` · ${o.maxOrders} commande${o.maxOrders > 1 ? 's' : ''} possible${o.maxOrders > 1 ? 's' : ''}`}
              </p>
            </div>
            {!stock.tracked ? <Pill tone="muted">Non limité</Pill> : o.available ? <Pill tone="green">En vente</Pill> : <Pill tone="red">Épuisé</Pill>}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function Reservations({ stock, onStock, onLogout, focusRef }) {
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState({ tone: 'ok', text: '' })
  const act = async (r, verb) => {
    const who = r.customer?.name || 'ce client'
    const question =
      verb === 'confirm'
        ? `Confirmer le paiement de ${who} ? Faites-le seulement après avoir vu le paiement chez le prestataire. ${sachets(r.sachets)} seront définitivement retirés du stock.`
        : `Annuler la réservation de ${who} ? ${sachets(r.sachets)} redeviendront disponibles et la commande sera marquée annulée.`
    if (!window.confirm(question)) return
    setBusy(`${r.key}:${verb}`)
    setNotice({ tone: 'ok', text: '' })
    const res = await call(`/api/admin/stock/reservations/${r.key}/${verb}`, { method: 'POST', body: '{}' })
    setBusy('')
    if (res.status === 401) return onLogout()
    if (res.status === 200) {
      onStock(res.data)
      return setNotice({ tone: 'ok', text: verb === 'confirm' ? `Paiement confirmé : ${sachets(r.sachets)} déduits du stock.` : 'Réservation annulée : le stock est libéré.' })
    }
    const messages = {
      insufficient_stock: 'Stock insuffisant pour confirmer cette commande expirée : corrigez d’abord la quantité en stock.',
      already_closed: 'Cette réservation a déjà été traitée.',
      not_found: 'Réservation introuvable : rechargez la page.',
    }
    setNotice({ tone: 'error', text: messages[res.data.error] || (res.status === 0 ? 'Serveur injoignable.' : 'Action impossible.') })
  }
  const rows = stock.reservations
  return (
    <Card
      icon={Clock}
      title="Réservations en attente de paiement"
      desc={`Créées quand un client part vers la page de paiement hébergée et gardées ${stock.holdMinutes} minutes. Une redirection n’est pas un paiement : confirmez seulement un paiement vu chez le prestataire.`}
    >
      <div ref={focusRef} tabIndex={-1} className="outline-none">
        {rows.length === 0 ? (
          <p className="rounded-xl bg-fr-soft px-3 py-3 text-[0.84rem] text-fr-muted">Aucune réservation en attente.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const offer = OFFERS.find((o) => o.id === r.offerId)
              return (
                <li key={r.key} className="grid gap-2 rounded-2xl bg-fr-soft p-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.88rem] font-extrabold">
                      <span className="truncate">{r.customer?.name || 'Client inconnu'}</span>
                      {r.active ? <Pill tone="green">Réservé jusqu’à {timeOnly.format(new Date(r.expiresAt))}</Pill> : <Pill tone="amber">Expirée · stock libéré</Pill>}
                    </p>
                    <p className="mt-0.5 text-[0.76rem] text-fr-muted">
                      {sachets(r.sachets)}
                      {offer ? ` · ${formatCHF(offer.price)}` : ''} · créée le {fmt(r.createdAt)}
                      {r.customer?.city ? ` · ${r.customer.city}` : ''}
                    </p>
                    {r.orderId && <p className="mt-0.5 font-mono text-[0.7rem] text-fr-muted">Commande {r.orderId}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => act(r, 'confirm')} disabled={Boolean(busy)} aria-label={`Paiement reçu de ${r.customer?.name || 'ce client'} : déduire ${sachets(r.sachets)}`} className={`${btnSecondary} h-10 flex-1 px-3 sm:flex-none`}>
                      {busy === `${r.key}:confirm` ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Paiement reçu
                    </button>
                    <button type="button" onClick={() => act(r, 'cancel')} disabled={Boolean(busy)} aria-label={`Annuler la réservation de ${r.customer?.name || 'ce client'}`} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-semibold text-fr-muted ring-1 ring-fr-line transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                      {busy === `${r.key}:cancel` ? <Loader2 size={15} className="animate-spin" /> : null} Annuler
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        <div className="mt-2" aria-live="polite">
          <Notice tone={notice.tone}>{notice.text}</Notice>
        </div>
      </div>
    </Card>
  )
}

function Movements({ stock }) {
  if (!stock.movements.length) return null
  return (
    <details className="group rounded-[1.25rem] bg-white ring-1 ring-fr-line">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 p-4 text-[0.92rem] font-extrabold sm:px-5 [&::-webkit-details-marker]:hidden">
        <History size={16} className="text-fr-green" aria-hidden="true" /> Historique du stock
        <span className="text-[0.76rem] font-semibold text-fr-muted max-sm:hidden">({stock.movements.length} derniers mouvements)</span>
        <span className="ml-auto text-[0.76rem] font-semibold text-fr-green group-open:hidden">Afficher</span>
        <span className="ml-auto hidden text-[0.76rem] font-semibold text-fr-green group-open:inline">Masquer</span>
      </summary>
      <div className="max-h-72 overflow-auto border-t border-fr-line px-4 pb-3 sm:px-5">
        <table className="w-full text-left text-[0.8rem]">
          <thead className="sticky top-0 bg-white text-[0.68rem] uppercase tracking-[0.08em] text-fr-muted">
            <tr>
              <th className="py-2 font-bold">Date</th>
              <th className="py-2 font-bold">Mouvement</th>
              <th className="py-2 text-right font-bold">Variation</th>
              <th className="py-2 text-right font-bold">En stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fr-line">
            {stock.movements.map((m, k) => (
              <tr key={`${m.at}-${k}`}>
                <td className="whitespace-nowrap py-1.5 pr-2 tabular-nums text-fr-muted">{fmt(m.at)}</td>
                <td className="py-1.5 pr-2">{MOVES[m.type] || m.type}</td>
                <td className="py-1.5 text-right tabular-nums">{m.type === 'hold' ? <span className="text-fr-muted">({m.delta})</span> : m.delta == null ? '—' : m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                <td className="py-1.5 text-right tabular-nums">{m.onHand ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[0.7rem] text-fr-muted">Les réservations (entre parenthèses) bloquent la vente sans retirer de stock physique.</p>
      </div>
    </details>
  )
}

function StockPanel({ stock, error, onStock, onReload, onLogout, focusRef }) {
  if (!stock)
    return (
      <Card>
        {error ? (
          <div className="flex flex-wrap items-center gap-3">
            <Notice tone="error">{error}</Notice>
            <button type="button" onClick={onReload} className={btnSecondary}>
              <RefreshCw size={15} /> Réessayer
            </button>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-fr-muted" role="status">
            <Loader2 size={16} className="animate-spin" /> Chargement du stock…
          </p>
        )}
      </Card>
    )
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <StockEditor stock={stock} onStock={onStock} onLogout={onLogout} />
        <div className="space-y-3">
          <OfferAvailability stock={stock} />
          <Card>
            <p className="flex gap-2 text-[0.78rem] leading-relaxed text-fr-muted">
              <Info size={16} className="mt-0.5 flex-none text-fr-green" aria-hidden="true" />
              <span>
                <strong className="text-fr-ink">Règle appliquée :</strong> au départ vers le paiement, les sachets sont <em>réservés</em> ; sans
                confirmation ils redeviennent disponibles à l’expiration. Ils ne sont <em>déduits</em> qu’avec « Paiement reçu ». La boutique
                n’affiche que « disponible » ou « épuisé », jamais de quantité.
              </span>
            </p>
          </Card>
        </div>
      </div>
      <Reservations stock={stock} onStock={onStock} onLogout={onLogout} focusRef={focusRef} />
      <Movements stock={stock} />
    </div>
  )
}

// ── Avis clients ──
const emptyReview = { author: '', location: '', rating: 5, title: '', body: '', photos: [], lang: LANGS[0] }
const LANG_NAMES = { fr: 'Français', de: 'Allemand', en: 'Anglais' }
const TRANSLATED_BY = { deepl: 'DeepL', claude: 'Claude (IA)', reviewed: 'relue', manual: 'manuelle' }

function ReviewManager({ reviews, setReviews, onLogout }) {
  const [form, setForm] = useState(emptyReview)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [translator, setTranslator] = useState(undefined)

  useEffect(() => {
    call('/api/admin/review-translator').then((r) => setTranslator(r.status === 200 ? r.data.provider : null))
  }, [])
  const missing = (reviews || []).reduce((n, review) => n + LANGS.filter((l) => l !== review.lang && !review.translations?.[l]).length, 0)

  const set = (name, value) => setForm((current) => ({ ...current, [name]: value }))
  const upload = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    if (files.length + form.photos.length > 3 || files.some((file) => file.size > 2 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) {
      setError('Choisissez au maximum trois images PNG, JPEG ou WebP de 2 Mo chacune.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const urls = []
      for (const file of files) {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const r = await call('/api/admin/review-images', { method: 'POST', body: JSON.stringify({ dataUrl }) })
        if (r.status === 401) return onLogout()
        if (r.status !== 201) throw new Error('image')
        urls.push(r.data.url)
      }
      setForm((current) => ({ ...current, photos: [...current.photos, ...urls] }))
    } catch { setError('Téléversement impossible. Réessayez avec une autre image.') }
    finally { setBusy(false) }
  }

  const publish = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const r = await call('/api/admin/reviews', { method: 'POST', body: JSON.stringify(form) })
    if (r.status === 201) {
      setReviews((current) => [r.data, ...(current || [])])
      setForm(emptyReview)
      setMessage(translator ? 'Avis publié. Traduction automatique en cours : actualisez la liste dans un instant.' : 'Avis publié. Sans service de traduction, il s’affiche dans sa langue d’origine.')
    } else if (r.status === 401) onLogout()
    else setError(Object.values(r.data.errors || {})[0] || 'Publication impossible.')
    setBusy(false)
  }

  const translateAll = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    const r = await call('/api/admin/reviews/translate', { method: 'POST' })
    if (r.status === 401) return onLogout()
    if (r.status === 200) {
      const list = await call('/api/admin/reviews')
      if (list.status === 200) setReviews(list.data)
      setMessage(`${r.data.translated} traduction${r.data.translated > 1 ? 's' : ''} ajoutée${r.data.translated > 1 ? 's' : ''}${r.data.failed ? ` · ${r.data.failed} échec${r.data.failed > 1 ? 's' : ''}` : ''}.`)
    } else setError('Traduction impossible pour le moment.')
    setBusy(false)
  }

  const remove = async (review) => {
    if (!window.confirm(`Supprimer l’avis de ${review.author} ?`)) return
    setBusy(true)
    setMessage('')
    const r = await call(`/api/admin/reviews/${review.id}`, { method: 'DELETE' })
    if (r.status === 200) {
      setReviews((current) => current.filter((item) => item.id !== review.id))
      setMessage('Avis supprimé.')
    } else if (r.status === 401) onLogout()
    else setError('Suppression impossible.')
    setBusy(false)
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
      <Card icon={Plus} title="Publier un avis" desc="Uniquement des avis reçus de vrais clients, avec leur accord pour afficher le nom et les photos. Aucun badge « achat vérifié » n’est ajouté.">
        <form onSubmit={publish} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>Nom du client *
              <input required maxLength={80} value={form.author} onChange={(e) => set('author', e.target.value)} className={`${input} mt-1 font-normal`} />
            </label>
            <label className={label}>Localité <span className="font-normal text-fr-muted">(facultatif)</span>
              <input maxLength={80} value={form.location} onChange={(e) => set('location', e.target.value)} className={`${input} mt-1 font-normal`} />
            </label>
            <label className={label}>Note sur 5 *
              <select value={form.rating} onChange={(e) => set('rating', Number(e.target.value))} className={`${input} mt-1 font-normal`}>
                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
              </select>
            </label>
            <label className={label}>Langue de l’avis *
              <select value={form.lang} onChange={(e) => set('lang', e.target.value)} className={`${input} mt-1 font-normal`}>
                {LANGS.map((l) => <option key={l} value={l}>{LANG_NAMES[l] || l}</option>)}
              </select>
            </label>
            <label className={`${label} sm:col-span-2`}>Titre <span className="font-normal text-fr-muted">(facultatif)</span>
              <input maxLength={100} value={form.title} onChange={(e) => set('title', e.target.value)} className={`${input} mt-1 font-normal`} />
            </label>
          </div>
          <label className={label}>Avis du client *
            <textarea required maxLength={1200} rows={3} value={form.body} onChange={(e) => set('body', e.target.value)} className={`${input} mt-1 h-auto py-2.5 font-normal`} />
          </label>
          <label className={label}>Photos <span className="font-normal text-fr-muted">(3 maximum, 2 Mo chacune)</span>
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={upload} disabled={busy || form.photos.length >= 3} className="mt-1 block w-full min-w-0 max-w-full text-sm font-normal text-fr-muted file:mr-3 file:h-10 file:rounded-full file:border-0 file:bg-fr-mint file:px-4 file:font-bold file:text-fr-green" />
          </label>
          {form.photos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.photos.map((src) => (
                <div key={src} className="relative">
                  <img src={src} alt="Aperçu de la photo" className="h-16 w-16 rounded-xl object-cover" />
                  <button type="button" onClick={() => set('photos', form.photos.filter((photo) => photo !== src))} aria-label="Retirer cette photo" className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-red-600 shadow"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <div aria-live="polite" className="space-y-2">
            <Notice tone="error">{error}</Notice>
            <Notice>{message}</Notice>
          </div>
          <button type="submit" disabled={busy || !form.author.trim() || !form.body.trim()} className={btnPrimary}>
            {busy ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />} Publier l’avis
          </button>
        </form>
      </Card>

      <Card icon={Star} title="Avis publiés" desc={reviews?.length ? `${reviews.length} avis visible${reviews.length > 1 ? 's' : ''} sur la boutique.` : 'Sans avis publié, la section reste masquée sur la boutique.'}>
        {reviews === null ? (
          <p className="flex items-center gap-2 text-sm text-fr-muted" role="status"><Loader2 size={16} className="animate-spin" /> Chargement…</p>
        ) : reviews.length === 0 ? (
          <p className="rounded-xl bg-fr-soft px-3 py-3 text-[0.84rem] text-fr-muted">Aucun avis publié.</p>
        ) : (
          <ul className="space-y-2 lg:max-h-[34rem] lg:overflow-auto lg:pr-1">
            {reviews.map((review) => (
              <li key={review.id} className="flex animate-reveal-down items-start gap-3 rounded-2xl bg-fr-soft p-3 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-baseline gap-x-2 font-bold">
                    {review.author}
                    <span className="text-fr-green" aria-label={`${review.rating} sur 5`}>{'★'.repeat(review.rating)}<span className="text-fr-line">{'★'.repeat(5 - review.rating)}</span></span>
                    <span className="text-[0.72rem] font-medium text-fr-muted">{review.location ? `${review.location} · ` : ''}{review.source ? review.source.originalDate : review.date}</span>
                  </p>
                  {review.title && <p className="mt-0.5 font-semibold">{review.title}</p>}
                  <p className="mt-0.5 line-clamp-3 text-[0.82rem] text-fr-muted">{review.body}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.7rem] font-semibold">
                    <span className="rounded-full bg-white px-2 py-0.5 text-fr-deep ring-1 ring-fr-line">Original : {LANG_NAMES[review.lang] || review.lang}</span>
                    {LANGS.filter((l) => l !== review.lang).map((l) => review.translations?.[l] ? (
                      <span key={l} className="rounded-full bg-fr-mint px-2 py-0.5 text-fr-green">{l.toUpperCase()} ✓ {TRANSLATED_BY[review.translations[l].by] || 'traduit'}</span>
                    ) : (
                      <span key={l} className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-900">{l.toUpperCase()} : original affiché</span>
                    ))}
                  </p>
                  {review.source && <a href={review.source.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[0.74rem] font-semibold text-fr-green underline">Source externe : {review.source.label} · {review.source.variant}</a>}
                  {review.photos.length > 0 && (
                    <div className="mt-2 flex gap-1.5">
                      {review.photos.map((src) => <img key={src} src={src} alt="" className="h-10 w-10 rounded-lg object-cover" />)}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => remove(review)} disabled={busy} aria-label={`Supprimer l’avis de ${review.author}`} className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-fr-muted transition duration-base hover:bg-red-50 hover:text-red-600 motion-safe:active:scale-95"><Trash2 size={17} /></button>
              </li>
            ))}
          </ul>
        )}
        {reviews?.length > 0 && translator !== undefined && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-fr-soft px-3 py-2.5 text-[0.78rem] text-fr-muted">
            <span className="flex items-center gap-2"><Languages size={15} className="flex-none text-fr-green" />
              {translator ? `Traduction automatique : ${TRANSLATED_BY[translator] || translator}` : 'Traduction automatique désactivée (DEEPL_API_KEY absente)'}
              {` · ${missing ? `${missing} traduction${missing > 1 ? 's' : ''} manquante${missing > 1 ? 's' : ''}` : 'tout est traduit'}`}
            </span>
            {translator && missing > 0 && (
              <button type="button" onClick={translateAll} disabled={busy} className={`${btnSecondary} h-9 px-3 text-[0.78rem]`}>Traduire les avis manquants</button>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Paiement ──
function PaymentEditor({ initial, everflow, onSaved, onLogout }) {
  const [cfg, setCfg] = useState(initial.externalRedirect)
  const [savedAt, setSavedAt] = useState(initial.updatedAt)
  const [status, setStatus] = useState({ busy: false, msg: '', errors: {} })
  const [previewOffer, setPreviewOffer] = useState(OFFERS[1].id)
  const [saved, setSaved] = useState(() => JSON.stringify(initial.externalRedirect))
  const set = (patch) => setCfg((c) => ({ ...c, ...patch }))
  const setPkg = (id, patch) => setCfg((c) => ({ ...c, packages: { ...c.packages, [id]: { ...c.packages[id], ...patch } } }))
  const setParam = (i, patch) => setCfg((c) => ({ ...c, params: c.params.map((p, k) => (k === i ? { ...p, ...patch } : p)) }))
  const dirty = JSON.stringify(cfg) !== saved

  const check = useMemo(() => validateConfig({ externalRedirect: cfg }), [cfg])
  const preview = useMemo(() => {
    const domain = normalizeDomain(cfg.domain)
    if (!domain || !check.ok) return ''
    try {
      return buildRedirectUrl({ externalRedirect: { ...check.config.externalRedirect, enabled: true } }, OFFERS.find((o) => o.id === previewOffer), SAMPLE, { origin: window.location.origin })
    } catch {
      return ''
    }
  }, [cfg, check, previewOffer])
  const errors = { ...status.errors, ...(check.ok ? {} : check.errors) }

  const save = async () => {
    setStatus({ busy: true, msg: '', errors: {} })
    const r = await call('/api/admin/config', { method: 'PUT', body: JSON.stringify({ externalRedirect: cfg }) })
    if (r.status === 200) {
      setCfg(r.data.externalRedirect)
      setSaved(JSON.stringify(r.data.externalRedirect))
      setSavedAt(r.data.updatedAt)
      onSaved(r.data)
      setStatus({ busy: false, msg: 'Configuration enregistrée.', errors: {} })
    } else if (r.status === 401) onLogout()
    else setStatus({ busy: false, msg: '', errors: r.data.errors || { form: r.status === 0 ? 'Serveur injoignable : rien n’a été enregistré.' : 'Enregistrement impossible.' } })
  }

  return (
    <div className="space-y-3">
      <Card
        icon={LockKeyhole}
        title="Everflow — page de paiement hébergée"
        desc="Réglé uniquement par les variables du serveur (EVERFLOW_ENABLED, EVERFLOW_IMAGES_APPROVED, PUBLIC_ORIGIN). Les trois liens d’offre sont figés dans le code serveur."
        aside={everflow === null ? <Pill tone="muted">…</Pill> : everflow.enabled ? <Pill tone="green">Actif</Pill> : <Pill tone="muted">Désactivé</Pill>}
      >
        <ul className="grid gap-2 text-[0.8rem] sm:grid-cols-3">
          <li className="rounded-xl bg-fr-soft px-3 py-2"><span className="block text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-fr-muted">Priorité</span>Utilisé avant la redirection externe s’il est actif</li>
          <li className="rounded-xl bg-fr-soft px-3 py-2"><span className="block text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-fr-muted">Commande</span>Fiche « en attente » + réservation du stock</li>
          <li className="rounded-xl bg-fr-soft px-3 py-2"><span className="block text-[0.66rem] font-extrabold uppercase tracking-[0.08em] text-fr-muted">Attribution</span>{everflow?.attributionAvailable ? 'Pixels configurés (après consentement)' : 'Pixels non configurés'}</li>
        </ul>
      </Card>

      <Card
        icon={CreditCard}
        title="Redirection externe"
        desc="Activée (et Everflow inactif) : « Acheter » envoie le client vers l’URL ci-dessous avec ses coordonnées en paramètres. Désactivée : aucune commande ne passe par ce chemin."
        aside={
          <button
            type="button"
            role="switch"
            aria-checked={cfg.enabled}
            aria-label="Paiement par redirection externe"
            onClick={() => set({ enabled: !cfg.enabled })}
            className={`flex h-10 items-center gap-3 rounded-full text-sm font-bold transition-colors duration-base ${cfg.enabled ? 'flex-row-reverse bg-fr-green pl-4 pr-1.5 text-white' : 'bg-fr-line pl-1.5 pr-4 text-fr-muted'}`}
          >
            <Swap value={cfg.enabled} anim="animate-pop" className="h-7 w-7 rounded-full bg-white shadow" />
            {cfg.enabled ? 'Activé' : 'Désactivé'}
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
          <div>
            <label htmlFor="domain" className={label}>Domaine de paiement</label>
            <div className="mt-1 flex items-center rounded-xl border border-fr-line bg-fr-soft pl-3.5 text-sm text-fr-muted focus-within:border-fr-green focus-within:shadow-[0_0_0_4px_rgba(14,122,71,0.12)]">
              https://
              <input id="domain" value={cfg.domain} onChange={(e) => set({ domain: e.target.value })} placeholder="paiement.exemple.ch" aria-invalid={Boolean(errors.domain)} aria-describedby={errors.domain ? 'domain-err' : undefined} className="h-11 w-full rounded-r-xl bg-transparent px-1 text-[0.95rem] text-fr-ink outline-none" />
            </div>
            <Err id="domain-err" msg={errors.domain} />
          </div>
          <div>
            <label htmlFor="path" className={label}>
              Chemin <span className="font-normal text-fr-muted">({'{code}'} = code de l’offre)</span>
            </label>
            <input id="path" value={cfg.pathTemplate} onChange={(e) => set({ pathTemplate: e.target.value })} aria-invalid={Boolean(errors.pathTemplate)} className={`${input} mt-1 font-mono text-[0.88rem]`} />
            <Err msg={errors.pathTemplate} />
          </div>
        </div>

        <h3 className="mt-5 text-[0.74rem] font-extrabold uppercase tracking-[0.1em] text-fr-muted">Codes par offre</h3>
        <div className="mt-2 space-y-2">
          {OFFERS.map((o) => {
            const p = cfg.packages[o.id] || {}
            return (
              <div key={o.id} className="grid gap-2.5 rounded-2xl bg-fr-soft p-3 sm:grid-cols-[7rem_1fr_1fr] lg:grid-cols-[7rem_0.8fr_1.3fr_1.3fr] lg:items-start">
                <p className="text-[0.88rem] font-extrabold sm:pt-6">
                  {sachets(o.packs)}
                  <span className="ml-1.5 text-[0.8rem] font-semibold text-fr-green sm:ml-0 sm:block">{formatCHF(o.price)}</span>
                </p>
                <div>
                  <label className={label} htmlFor={`code-${o.id}`}>Code</label>
                  <input id={`code-${o.id}`} value={p.code || ''} onChange={(e) => setPkg(o.id, { code: e.target.value })} aria-invalid={Boolean(errors[`code_${o.id}`])} className={`${input} mt-1 font-mono text-[0.88rem]`} />
                  <Err msg={errors[`code_${o.id}`]} />
                </div>
                <div>
                  <label className={label} htmlFor={`name-${o.id}`}>Nom transmis</label>
                  <input id={`name-${o.id}`} value={p.productName || ''} onChange={(e) => setPkg(o.id, { productName: e.target.value })} className={`${input} mt-1`} />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className={label} htmlFor={`photo-${o.id}`}>
                    URL de la photo <span className="font-normal text-fr-muted">(vide = photo de la boutique)</span>
                  </label>
                  <input id={`photo-${o.id}`} value={p.photoUrl || ''} onChange={(e) => setPkg(o.id, { photoUrl: e.target.value })} placeholder="https://…" aria-invalid={Boolean(errors[`photo_${o.id}`])} className={`${input} mt-1`} />
                  <Err msg={errors[`photo_${o.id}`]} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_1fr] xl:items-start [&>*]:min-w-0">
        <Card
          title="Paramètres ajoutés à l’URL"
          desc="Ces données personnelles sont transmises au domaine de paiement : il doit être de confiance et figurer dans la politique de confidentialité."
          aside={
            <button type="button" onClick={() => set({ params: DEFAULT_PARAMS })} className={btnQuiet}>
              <RotateCcw size={14} /> Valeurs par défaut
            </button>
          }
        >
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[26rem] text-left text-sm">
              <thead>
                <tr className="text-[0.68rem] uppercase tracking-[0.08em] text-fr-muted">
                  <th className="pb-1.5 font-bold">Paramètre</th>
                  <th className="pb-1.5 font-bold">Donnée transmise</th>
                  <th className="w-11 pb-1.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fr-line">
                {cfg.params.map((row, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-2">
                      <input aria-label={`Nom du paramètre ${i + 1}`} value={row.param} onChange={(e) => setParam(i, { param: e.target.value })} className={`${input} h-10 font-mono text-[0.86rem]`} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <select aria-label={`Donnée du paramètre ${i + 1}`} value={row.field} onChange={(e) => setParam(i, { field: e.target.value })} className={`${input} h-10 text-[0.88rem]`}>
                        {Object.entries(FIELDS).map(([k, text]) => (
                          <option key={k} value={k}>{text}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5">
                      <button
                        type="button"
                        aria-label={`Supprimer le paramètre ${row.param || i + 1}`}
                        onClick={() => setCfg((c) => ({ ...c, params: c.params.filter((_, k) => k !== i) }))}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-fr-muted hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Err msg={errors.params} />
          <button type="button" onClick={() => setCfg((c) => ({ ...c, params: [...c.params, { param: '', field: 'prenom' }] }))} className="mt-2 inline-flex h-10 items-center gap-1.5 rounded-full bg-fr-mint px-4 text-sm font-bold text-fr-green hover:bg-fr-mint2">
            <Plus size={15} /> Ajouter un paramètre
          </button>
        </Card>

        <Card
          title="Aperçu de l’URL"
          desc="Avec des coordonnées d’essai, pour vérifier le format avant d’activer."
          aside={
            <select value={previewOffer} onChange={(e) => setPreviewOffer(e.target.value)} className={`${input} !h-10 !w-auto`} aria-label="Offre de l’aperçu">
              {OFFERS.map((o) => (
                <option key={o.id} value={o.id}>{sachets(o.packs)}</option>
              ))}
            </select>
          }
        >
          {preview ? (
            <div className="rounded-xl bg-fr-deep p-3.5">
              <code className="block break-all font-mono text-[0.76rem] leading-relaxed text-fr-mint">{preview}</code>
              <a href={preview} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-flex items-center gap-1 text-[0.78rem] font-semibold text-fr-leaf hover:underline">
                Ouvrir dans un nouvel onglet <ExternalLink size={13} />
              </a>
            </div>
          ) : (
            <p className="rounded-xl bg-fr-soft px-3 py-3 text-[0.84rem] text-fr-muted">Renseignez un domaine valide pour voir l’aperçu.</p>
          )}
        </Card>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-fr-line bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:shadow-[0_-8px_24px_rgba(11,61,42,0.06)]">
        <p className="mr-auto text-[0.78rem] text-fr-muted" aria-live="polite">
          {status.msg ? (
            <span key={status.msg} className="flex animate-reveal-down items-center gap-1.5 font-semibold text-fr-green" role="status"><Check size={15} className="animate-pop" /> {status.msg}</span>
          ) : status.errors.form ? (
            <span key={status.errors.form} className="inline-block animate-reveal-down font-semibold text-red-600" role="alert">{status.errors.form}</span>
          ) : !check.ok ? (
            <span className="font-semibold text-red-600">Corrigez les champs signalés pour enregistrer.</span>
          ) : dirty ? (
            <span className="font-semibold text-amber-700">Modifications non enregistrées</span>
          ) : savedAt ? (
            `Dernier enregistrement : ${new Date(savedAt).toLocaleString('fr-CH')}`
          ) : (
            'Jamais enregistré'
          )}
        </p>
        <button onClick={save} disabled={status.busy || !check.ok || !dirty} className={`${btnPrimary} h-11 px-6`}>
          {status.busy && <Loader2 size={17} className="animate-spin" />} Enregistrer le paiement
        </button>
      </div>
    </div>
  )
}

// ── Tableau de bord ──
const ANALYTICS_SECTIONS = {
  hero: 'Produit et offres', story: 'Le geste', quantity: 'Quantité', product: 'Produit',
  video: 'Vidéo', reviews: 'Avis', delivery: 'Livraison et retours', faq: 'FAQ', final: 'Dernier rappel',
}
const ANALYTICS_FUNNEL = [
  ['addToCart', 'Ajout au panier'], ['checkoutView', 'Page de commande'], ['buyClick', 'Clic Acheter'],
  ['paymentRedirect', 'Redirection paiement'], ['verifiedPurchase', 'Paiement vérifié'],
  ['checkoutInvalid', 'Formulaire incomplet'], ['checkoutError', 'Erreur de commande'],
]
const duration = (value) => value >= 60 ? `${Math.floor(value / 60)} min ${Math.round(value % 60)} s` : `${Math.round(value || 0)} s`

function AnalyticsPanel({ data, error, hours, onHours, onReload }) {
  return (
    <div className="space-y-4 rounded-[1.4rem] bg-white p-4 ring-1 ring-fr-line sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Parcours des visiteurs</h2>
          <p className="text-xs text-fr-muted">Sessions avec consentement, commencées dans la période. Temps actif = page visible, au premier plan, sans inactivité prolongée.</p>
        </div>
        <div className="flex gap-2">
          {[24, 168, 720].map((value) => <button key={value} type="button" onClick={() => onHours(value)} aria-pressed={hours === value} className={`${btnQuiet} ${hours === value ? 'bg-fr-mint text-fr-green' : ''}`}>{value === 24 ? '24 h' : value === 168 ? '7 j' : '30 j'}</button>)}
          <button type="button" onClick={onReload} className={btnQuiet} aria-label="Actualiser le trafic"><RefreshCw size={15} /></button>
        </div>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="text-sm text-fr-muted">Chargement des statistiques…</p>}
      {data && <>
        <div className="grid gap-2 sm:grid-cols-4">
          {[
            ['Sessions', data.sessions], ['Temps actif moyen', duration(data.avgActiveSeconds)],
            ['Défilement moyen', `${data.avgHomeScroll}%`], ['Clics Acheter', data.funnel.buyClick.events],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-fr-soft p-3"><span className="block text-xs text-fr-muted">{label}</span><strong className="text-xl tabular-nums">{value}</strong></div>)}
        </div>
        <p className="text-xs text-fr-muted">Temps actif par session : minimum {duration(data.minActiveSeconds)}, maximum {duration(data.maxActiveSeconds)}. « Direct » regroupe les liens sans référent, favoris et adresses saisies ; ces cas ne sont pas distinguables.</p>
        <div className="overflow-x-auto">
          <h3 className="mb-2 font-bold">Origine et progression</h3>
          <table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-fr-line text-fr-muted"><th className="py-2">Canal</th><th>Sessions</th><th>Temps moyen</th><th>Clics Acheter</th><th>Redirections</th><th>Paiements vérifiés</th></tr></thead><tbody>
            {data.channels.map((row) => <tr key={row.channel} className="border-b border-fr-line/70"><th className="py-2 font-semibold">{row.channel === 'direct' ? 'Direct / sans référent' : CHANNEL_LABELS[row.channel]}</th><td>{row.sessions}</td><td>{duration(row.avgActiveSeconds)}</td><td>{row.buyClicks}</td><td>{row.redirects}</td><td>{row.verified}</td></tr>)}
          </tbody></table>
        </div>
        <div className="overflow-x-auto">
          <h3 className="mb-2 font-bold">Sections de la page d’accueil</h3>
          <p className="mb-2 text-xs text-fr-muted">« Plus loin atteint » indique la section la plus basse observée durant la visite. Temps moyen, min. et max. sont calculés parmi les sessions qui ont atteint la section.</p>
          <table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-fr-line text-fr-muted"><th className="py-2">Section</th><th>Atteinte</th><th>Plus loin atteint</th><th>Temps moyen</th><th>Min.</th><th>Max.</th></tr></thead><tbody>
            {data.sections.map((row) => <tr key={row.key} className="border-b border-fr-line/70"><th className="py-2 font-semibold">{ANALYTICS_SECTIONS[row.key]}</th><td>{row.reached}</td><td>{row.deepest}</td><td>{duration(row.avgSeconds)}</td><td>{duration(row.minSeconds)}</td><td>{duration(row.maxSeconds)}</td></tr>)}
          </tbody></table>
          <p className="mt-2 text-xs text-fr-muted">Profondeur atteinte : {data.scrollDepth.map((row) => `${row.depth}% : ${row.sessions}`).join(' · ')} sessions.</p>
        </div>
        <div className="overflow-x-auto">
          <h3 className="mb-2 font-bold">Étapes du parcours</h3>
          <table className="w-full min-w-[420px] text-left text-sm"><thead><tr className="border-b border-fr-line text-fr-muted"><th className="py-2">Étape</th><th>Sessions</th><th>Actions</th></tr></thead><tbody>
            {ANALYTICS_FUNNEL.map(([key, label]) => <tr key={key} className="border-b border-fr-line/70"><th className="py-2 font-semibold">{label}</th><td>{data.funnel[key].sessions}</td><td>{data.funnel[key].events}</td></tr>)}
          </tbody></table>
        </div>
      </>}
    </div>
  )
}

const TABS = [
  { id: 'orders', label: 'Commandes', icon: ShoppingBag },
  { id: 'analytics', label: 'Trafic', icon: BarChart3 },
  { id: 'stock', label: 'Stock', icon: Boxes },
  { id: 'reviews', label: 'Avis', icon: Star },
  { id: 'payment', label: 'Paiement', icon: CreditCard },
]
const tabFromHash = () => {
  const id = window.location.hash.slice(1)
  return TABS.some((t) => t.id === id) ? id : 'orders'
}

function Dashboard({ initial, onLogout }) {
  const [tab, setTab] = useState(tabFromHash)
  const [config, setConfig] = useState(initial)
  const [stock, setStock] = useState(null)
  const [stockError, setStockError] = useState('')
  const [reviews, setReviews] = useState(null)
  const [everflow, setEverflow] = useState(null)
  const [orders, setOrders] = useState(null)
  const [ordersError, setOrdersError] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [analyticsError, setAnalyticsError] = useState('')
  const [analyticsHours, setAnalyticsHours] = useState(24)
  const [refreshing, setRefreshing] = useState(false)
  const tabRefs = useRef([])
  const reservationsRef = useRef(null)

  const loadStock = useCallback(async () => {
    const r = await call('/api/admin/stock')
    if (r.status === 401) return onLogout()
    if (r.status === 200) {
      setStock(r.data)
      setStockError('')
    } else setStockError(r.status === 0 ? 'Serveur injoignable : le stock n’a pas pu être chargé.' : 'Le stock n’a pas pu être chargé.')
  }, [onLogout])

  const loadOrders = useCallback(async () => {
    const r = await call('/api/admin/orders')
    if (r.status === 401) return onLogout()
    if (r.status === 200) {
      setOrders(r.data)
      setOrdersError('')
    } else setOrdersError(r.status === 0 ? 'Serveur injoignable : les commandes n’ont pas pu être chargées.' : 'Les commandes n’ont pas pu être chargées.')
  }, [onLogout])

  const loadAnalytics = useCallback(async () => {
    const r = await call(`/api/admin/analytics?hours=${analyticsHours}`)
    if (r.status === 401) return onLogout()
    if (r.status === 200) {
      setAnalytics(r.data)
      setAnalyticsError('')
    } else setAnalyticsError(r.status === 0 ? 'Serveur injoignable : le trafic n’a pas pu être chargé.' : 'Le trafic n’a pas pu être chargé.')
  }, [analyticsHours, onLogout])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    const [, , , r, p] = await Promise.all([loadStock(), loadOrders(), loadAnalytics(), call('/api/admin/reviews'), call('/api/payment/config')])
    if (r.status === 401) return onLogout()
    if (r.status === 200) setReviews(Array.isArray(r.data) ? r.data : [])
    if (p.status === 200) setEverflow(p.data.everflow || { enabled: false })
    setRefreshing(false)
  }, [loadStock, loadOrders, loadAnalytics, onLogout])

  useEffect(() => {
    refresh()
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      loadStock()
      loadOrders()
      loadAnalytics()
    }
    const onHash = () => setTab(tabFromHash())
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('hashchange', onHash)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('hashchange', onHash)
    }
  }, [refresh, loadStock, loadOrders, loadAnalytics])

  const open = (id, focus) => {
    setTab(id)
    window.history.replaceState(null, '', `#${id}`)
    requestAnimationFrame(() => {
      if (focus === 'reservations') {
        reservationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        reservationsRef.current?.focus({ preventScroll: true })
      } else tabRefs.current[TABS.findIndex((t) => t.id === id)]?.focus()
    })
  }
  const onTabKey = (e, k) => {
    const next = { ArrowRight: k + 1, ArrowLeft: k - 1, Home: 0, End: TABS.length - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    open(TABS[(next + TABS.length) % TABS.length].id)
  }

  const counts = {
    orders: orders ? orders.total : null,
    analytics: analytics ? analytics.sessions : null,
    stock: stock ? stock.reservations.length : null,
    reviews: reviews ? reviews.length : null,
  }
  const payment = { everflow: everflow?.enabled === true, redirect: config.externalRedirect.enabled, domain: config.externalRedirect.domain }

  return (
    <div className="min-h-screen bg-fr-soft font-jakarta text-fr-ink">
      <header className="sticky top-0 z-30 border-b border-fr-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo />
            <span className="rounded-full bg-fr-deep px-2 py-0.5 text-[0.64rem] font-bold uppercase tracking-[0.1em] text-white">Admin</span>
          </div>
          <div className="flex items-center gap-1">
            <a href="/" target="_blank" rel="noopener" className={`${btnQuiet} max-sm:hidden`}>
              Voir la boutique <ArrowUpRight size={14} />
            </a>
            <button type="button" onClick={refresh} disabled={refreshing} aria-label="Actualiser les données" className={btnQuiet}>
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> <span className="max-sm:sr-only">Actualiser</span>
            </button>
            <button type="button" onClick={onLogout} className={btnQuiet}>
              <LogOut size={15} /> <span className="max-sm:sr-only">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 pb-10 pt-5 lg:px-6 lg:pt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="text-[1.45rem] font-extrabold leading-tight tracking-[-0.025em] lg:text-[1.7rem]">Tableau de bord</h1>
            <p className="text-[0.82rem] text-fr-muted">Trafic, commandes, stock, avis clients et paiement de la boutique.</p>
          </div>
        </div>

        <Overview stock={stock} reviews={reviews} payment={payment} orders={orders} onOpen={open} />

        <div role="tablist" aria-label="Sections de l’administration" className="sticky top-14 z-20 -mx-4 grid grid-cols-5 gap-1 bg-fr-soft/95 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:inline-grid sm:rounded-full sm:bg-white sm:p-1 sm:ring-1 sm:ring-fr-line">
          {TABS.map((t, k) => {
            const on = tab === t.id
            return (
              <button
                key={t.id}
                ref={(el) => (tabRefs.current[k] = el)}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={on}
                aria-controls={`panel-${t.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => open(t.id)}
                onKeyDown={(e) => onTabKey(e, k)}
                className={`flex h-11 min-w-0 items-center justify-center gap-1 rounded-full px-1 text-[0.8rem] sm:text-[0.88rem] font-bold transition duration-base ease-out-soft sm:h-10 sm:gap-2 sm:px-5 ${
                  on ? 'bg-fr-deep text-white shadow-[0_6px_14px_rgba(11,61,42,0.18)]' : 'bg-white text-fr-muted ring-1 ring-fr-line hover:text-fr-green sm:bg-transparent sm:ring-0'
                }`}
              >
                <t.icon size={16} strokeWidth={2} aria-hidden="true" className="flex-none max-sm:hidden" />
                {t.label}
                {counts[t.id] > 0 && (
                  <span className={`rounded-full px-1.5 text-[0.68rem] tabular-nums max-sm:hidden ${on ? 'bg-white/20 text-white' : 'bg-fr-mint text-fr-green'}`}>{counts[t.id]}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Les panneaux restent montés : une saisie en cours n'est jamais perdue en changeant d'onglet. */}
        <div id="panel-orders" role="tabpanel" aria-labelledby="tab-orders" hidden={tab !== 'orders'} className="animate-panel-in">
          <OrdersPanel data={orders} error={ordersError} onReload={loadOrders} />
        </div>
        <div id="panel-analytics" role="tabpanel" aria-labelledby="tab-analytics" hidden={tab !== 'analytics'} className="animate-panel-in">
          <AnalyticsPanel data={analytics} error={analyticsError} hours={analyticsHours} onHours={setAnalyticsHours} onReload={loadAnalytics} />
        </div>
        <div id="panel-stock" role="tabpanel" aria-labelledby="tab-stock" hidden={tab !== 'stock'} className="animate-panel-in">
          <StockPanel stock={stock} error={stockError} onStock={setStock} onReload={loadStock} onLogout={onLogout} focusRef={reservationsRef} />
        </div>
        <div id="panel-reviews" role="tabpanel" aria-labelledby="tab-reviews" hidden={tab !== 'reviews'} className="animate-panel-in">
          <ReviewManager reviews={reviews} setReviews={setReviews} onLogout={onLogout} />
        </div>
        <div id="panel-payment" role="tabpanel" aria-labelledby="tab-payment" hidden={tab !== 'payment'} className="animate-panel-in">
          <PaymentEditor initial={initial} everflow={everflow} onSaved={setConfig} onLogout={onLogout} />
        </div>
      </main>
    </div>
  )
}

export default function Admin() {
  const [state, setState] = useState({ phase: 'loading' })

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  const load = async () => {
    const s = await call('/api/admin/session')
    if (s.status !== 200) return setState({ phase: 'offline' })
    if (!s.data.authenticated) return setState({ phase: 'login', configured: s.data.configured })
    const c = await call('/api/admin/config')
    if (c.status === 200) setState({ phase: 'ready', config: c.data })
    else setState({ phase: 'login', configured: true })
  }
  useEffect(() => {
    load()
  }, [])

  const logout = useCallback(async () => {
    await call('/api/admin/logout', { method: 'POST' })
    setState({ phase: 'login', configured: true })
  }, [])

  if (state.phase === 'loading')
    return (
      <div className="flex min-h-screen items-center justify-center bg-fr-soft" role="status" aria-label="Chargement">
        <Loader2 className="animate-spin text-fr-green" />
      </div>
    )
  if (state.phase === 'offline')
    return (
      <div className="flex min-h-screen items-center justify-center bg-fr-soft px-4 text-center font-jakarta text-fr-ink">
        <p>Le serveur d’administration est injoignable. Démarrez-le avec « npm run server ».</p>
      </div>
    )
  if (state.phase === 'login') return <Login configured={state.configured} onDone={load} />
  return <Dashboard initial={state.config} onLogout={logout} />
}
