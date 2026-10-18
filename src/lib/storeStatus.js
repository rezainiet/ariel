// ─────────────────────────────────────────────────────────────
// Statut de la boutique : heure serveur, campagne, stock réel.
// Source UNIQUE des éléments d'urgence. Sans source réelle, rien n'est affiché.
//
// Contrat du point d'accès (VITE_STORE_STATUS_API, GET, JSON) :
// {
//   "serverTime": "2026-10-18T10:00:00Z",           // heure du serveur (ISO 8601)
//   "campaign": { "endsAt": "2026-10-31T22:59:59Z",  // fin RÉELLE de l'opération, ou null
//                 "label": "Opération de déstockage" },
//   "stock": { "available": 240,                     // quantité RÉELLE (sachets), ou null
//              "lowThreshold": 50 }                  // facultatif : seuil « stock faible »
// }
// Le compte à rebours est calculé sur l'heure serveur (décalage horloge corrigé) :
// identique sur tous les appareils, jamais remis à zéro au rechargement.
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { URGENCY } from '../config/store.js'

const EMPTY = { ready: true, offset: 0, campaign: null, stock: null, limited: URGENCY.limitedConfirmed, isSample: false }

// Aperçu de conception : DEV uniquement et sur demande explicite (VITE_URGENCY_PREVIEW=sample).
// Ce bloc est éliminé du build de production ; chaque élément affiché porte le libellé d'aperçu.
function sampleStatus() {
  if (!(import.meta.env.DEV && import.meta.env.VITE_URGENCY_PREVIEW === 'sample')) return null
  const now = new Date()
  // Fin fixe (dernier jour du mois, 23:59 heure suisse) : ne se réinitialise pas au rechargement.
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 22, 59, 59))
  return {
    ready: true,
    offset: 0,
    campaign: { endsAt: end.toISOString(), label: 'Opération de déstockage' },
    stock: { available: 240, lowThreshold: 50 },
    limited: true,
    isSample: true,
  }
}

let cache = null
let inflight = null
const listeners = new Set()

function publish(status) {
  cache = status
  listeners.forEach((fn) => fn(status))
}

function validDate(v) {
  const t = Date.parse(v)
  return Number.isFinite(t) ? t : null
}

export async function loadStoreStatus() {
  const sample = sampleStatus()
  if (sample) return publish(sample)
  if (!URGENCY.statusApi) return publish(EMPTY)
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const sent = Date.now()
      const res = await fetch(URGENCY.statusApi, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const received = Date.now()
      const server = validDate(data.serverTime) ?? validDate(res.headers.get('Date'))
      // Décalage = heure serveur − heure locale au milieu de l'aller-retour.
      const offset = server ? server - (sent + received) / 2 : 0
      const endsAt = validDate(data.campaign?.endsAt)
      const available = Number.isInteger(data.stock?.available) && data.stock.available >= 0 ? data.stock.available : null
      publish({
        ready: true,
        offset,
        campaign: endsAt && server ? { endsAt: new Date(endsAt).toISOString(), label: data.campaign.label || '' } : null,
        stock:
          available === null
            ? null
            : { available, lowThreshold: Number.isInteger(data.stock.lowThreshold) ? data.stock.lowThreshold : null },
        limited: URGENCY.limitedConfirmed,
        isSample: false,
      })
    } catch {
      // Panne du service : on n'affiche aucune urgence plutôt qu'une information non vérifiée.
      publish(EMPTY)
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function useStoreStatus() {
  const [status, setStatus] = useState(cache || { ...EMPTY, ready: false })
  useEffect(() => {
    listeners.add(setStatus)
    if (!cache) loadStoreStatus()
    // Resynchronise l'heure et le stock au retour sur l'onglet.
    const onVisible = () => document.visibilityState === 'visible' && loadStoreStatus()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      listeners.delete(setStatus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return status
}

// Temps restant (ms) jusqu'à endsAt, sur l'heure serveur. null = pas de campagne ou terminée.
export function useCountdown(endsAt, offset = 0) {
  const target = endsAt ? Date.parse(endsAt) : null
  const compute = () => (target ? Math.max(0, target - (Date.now() + offset)) : 0)
  const [left, setLeft] = useState(compute)
  useEffect(() => {
    if (!target) return
    setLeft(compute())
    const id = setInterval(() => setLeft(compute()), 1000)
    return () => clearInterval(id)
  }, [target, offset]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!target || left <= 0) return null
  const s = Math.floor(left / 1000)
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 }
}
