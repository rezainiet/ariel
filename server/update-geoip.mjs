// ─────────────────────────────────────────────────────────────
// Mise à jour de la base pays (DB-IP « IP to Country Lite », licence CC BY 4.0 — mention dans le pied de page).
// Usage : node server/update-geoip.mjs [DATA_DIR]   (cron mensuel du compte ariel, voir deploy/README.md)
// Télécharge le fichier du mois (ou du mois précédent), le vérifie, puis remplace l'ancien atomiquement :
// une base invalide ou un téléchargement interrompu ne remplace jamais la base en service.
// ─────────────────────────────────────────────────────────────
import { mkdir, writeFile, rename } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { geoipPath, openReader, countryForIp } from './geoip.mjs'

const dataDir = resolve(process.argv[2] || process.env.DATA_DIR || 'server/data')
const target = geoipPath(dataDir)
const month = (offset) => {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() - offset)
  return d.toISOString().slice(0, 7)
}

// Adresses publiques stables dont le pays ne fait pas de doute : la base doit les reconnaître.
const CHECKS = [['8.8.8.8', 'US'], ['194.25.2.129', 'DE'], ['195.186.1.111', 'CH'], ['2a02:2e0:3fe:1001:7777:772e:2:85', 'DE']]

async function download(version) {
  const url = `https://download.db-ip.com/free/dbip-country-lite-${version}.mmdb.gz`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return gunzipSync(Buffer.from(await res.arrayBuffer()))
}

let data = null
let version = ''
for (const v of [month(0), month(1)]) {
  try {
    data = await download(v)
    version = v
    break
  } catch (error) {
    console.warn('[geoip] indisponible :', error.message)
  }
}
if (!data) {
  console.error('[geoip] aucune base téléchargée ; la base actuelle reste en service')
  process.exit(1)
}
const reader = openReader(data)
for (const [ip, country] of CHECKS) {
  if (countryForIp(reader, ip) !== country) {
    console.error(`[geoip] contrôle échoué (${ip} ≠ ${country}) ; la base actuelle reste en service`)
    process.exit(1)
  }
}
await mkdir(dirname(target), { recursive: true })
await writeFile(`${target}.tmp`, data, { mode: 0o644 })
await rename(`${target}.tmp`, target)
console.log(`[geoip] base ${version} installée : ${target} (${(data.length / 1e6).toFixed(1)} Mo)`)
