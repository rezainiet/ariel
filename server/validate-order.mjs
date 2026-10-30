// ─────────────────────────────────────────────────────────────
// Validation côté serveur — à brancher dans le point d'accès POST {VITE_CHECKOUT_API}/checkout-session
// AVANT de créer la session chez le prestataire de paiement.
//
//   import { checkCheckoutRequest } from './validate-order.mjs'
//   const result = checkCheckoutRequest(req.body, { enabledMethods: ['twint', 'card'] })
//   if (!result.ok) return res.status(422).json({ errors: result.errors })   // messages FR, sans données saisies
//   // result.order.total = montant recalculé à partir de l'offre → à transmettre au prestataire
//
// Règles : mêmes contrôles que le navigateur (src/lib/orderValidation.js), montant jamais repris du client,
// aucune donnée personnelle dans les journaux (on ne journalise que les NOMS des champs en erreur).
// Auto-test : node server/validate-order.mjs
// ─────────────────────────────────────────────────────────────
import { validateOrder } from '../src/lib/orderValidation.js'

export function checkCheckoutRequest(body, { enabledMethods = [] } = {}) {
  if (!body || typeof body !== 'object') return { ok: false, errors: { body: 'Requête invalide.' } }
  const result = validateOrder(body, { enabledMethods })
  if (!result.ok) console.warn('[commande] refusée — champs :', Object.keys(result.errors).join(', '))
  return result
}

// ── Auto-test ──
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('validate-order.mjs')) {
  const ok = {
    offerId: 'pack-2',
    total: 0.01, // valeur falsifiée : doit être ignorée
    termsAccepted: true,
    method: 'twint',
    customer: { prenom: 'Léa', nom: 'Muller', email: 'LEA@EXEMPLE.CH', tel: '079 123 45 67', adresse: 'Rue du Lac 4', npa: '1003', ville: 'Lausanne' },
  }
  const cases = [
    ['commande valide, montant recalculé', ok, (r) => r.ok && r.order.total === 15 && r.order.packs === 2 && r.order.customer.email === 'lea@exemple.ch'],
    ['offre inconnue', { ...ok, offerId: 'pack-9' }, (r) => !r.ok && r.errors.offerId],
    ['NPA à 3 chiffres', { ...ok, customer: { ...ok.customer, npa: '100' } }, (r) => !r.ok && r.errors.npa],
    ['NPA commençant par 0', { ...ok, customer: { ...ok.customer, npa: '0123' } }, (r) => !r.ok && r.errors.npa],
    ['e-mail invalide', { ...ok, customer: { ...ok.customer, email: 'lea@' } }, (r) => !r.ok && r.errors.email],
    ['téléphone invalide', { ...ok, customer: { ...ok.customer, tel: '12' } }, (r) => !r.ok && r.errors.tel],
    ['téléphone obligatoire', { ...ok, customer: { ...ok.customer, tel: '' } }, (r) => !r.ok && r.errors.tel],
    ['téléphone étranger accepté', { ...ok, customer: { ...ok.customer, tel: '+33 6 12 34 56 78' } }, (r) => r.ok && r.order.customer.tel === '+33612345678'],
    ['téléphone +41 accepté', { ...ok, customer: { ...ok.customer, tel: '+41 79 123 45 67' } }, (r) => r.ok],
    ['CGV non acceptées', { ...ok, termsAccepted: false }, (r) => !r.ok && r.errors.terms],
    ['moyen non activé', ok, (r) => !r.ok && r.errors.method, ['card']],
    ['champs vides', { offerId: 'pack-1', termsAccepted: true, customer: {} }, (r) => !r.ok && ['prenom', 'nom', 'email', 'tel', 'adresse', 'npa', 'ville'].every((k) => r.errors[k])],
  ]
  let failed = 0
  for (const [name, body, check, methods = ['twint', 'card']] of cases) {
    const r = validateOrder(body, { enabledMethods: methods })
    const pass = Boolean(check(r))
    if (!pass) failed++
    console.log(`${pass ? '✓' : '✗'} ${name}`)
  }
  if (failed) process.exit(1)
}
