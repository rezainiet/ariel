// ─────────────────────────────────────────────────────────────
// Aide à la saisie d'adresse suisse — UNIQUEMENT via un service configuré
// (ex. API de La Poste suisse, appelée par NOTRE serveur). Sans service : aucune suggestion.
//
// Contrat (VITE_ADDRESS_API, GET, JSON) :
//   {API}/localities?zip=1003           → [{ "zip": "1003", "city": "Lausanne" }]
//   {API}/streets?zip=1003&q=rue du l   → [{ "street": "Rue du Lac", "zip": "1003", "city": "Lausanne" }]
// ─────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_ADDRESS_API || ''

export const hasAddressService = () => Boolean(API)

async function get(path) {
  if (!API) return []
  try {
    const res = await fetch(`${API}${path}`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function localitiesFor(zip) {
  const list = await get(`/localities?zip=${encodeURIComponent(zip)}`)
  return list.filter((l) => l && l.zip === zip && typeof l.city === 'string')
}

export async function streetsFor(q, zip) {
  if (!q || q.length < 3) return []
  const list = await get(`/streets?q=${encodeURIComponent(q)}${zip ? `&zip=${encodeURIComponent(zip)}` : ''}`)
  return list.filter((s) => s && typeof s.street === 'string').slice(0, 8)
}
