// ─────────────────────────────────────────────────────────────
// Pays du visiteur par base GeoIP2 (format MaxMind .mmdb), lue par ce serveur.
//  · Adresse du visiteur : celle que NOTRE Nginx écrit dans X-Forwarded-For ($remote_addr, valeur
//    écrasée et non complétée). Elle n'est lue que pour une connexion venant de la machine elle-même
//    (Nginx local) ; on retient la dernière valeur, celle ajoutée par le proxy.
//  · Base : DATA_DIR/geoip/country.mmdb (DB-IP « IP to Country Lite », CC BY 4.0), mise à jour chaque
//    mois par server/update-geoip.mjs. Relue automatiquement quand le fichier change.
//  · Sans base ou sans résultat : pays inconnu (langue du navigateur, CHF). Rien n'est conservé.
// ─────────────────────────────────────────────────────────────
import { readFile, stat } from 'node:fs/promises'
import { isIP } from 'node:net'
import { join } from 'node:path'
import { Reader } from 'mmdb-lib'

const LOOPBACK = /^(127\.\d+\.\d+\.\d+|::1|::ffff:127\.\d+\.\d+\.\d+)$/

export const geoipPath = (dataDir, env = process.env) => env.GEOIP_DB || join(dataDir, 'geoip', 'country.mmdb')

export function clientIp(req) {
  const socket = req.socket?.remoteAddress || ''
  let ip = socket
  if (LOOPBACK.test(socket)) {
    const forwarded = String(req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean)
    if (forwarded.length) ip = forwarded[forwarded.length - 1]
  }
  ip = ip.replace(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/, '$1')
  return isIP(ip) ? ip : ''
}

// Pays ISO d'une adresse avec un lecteur .mmdb (champ country, à défaut registered_country).
export function countryForIp(reader, ip) {
  if (!reader || !ip) return ''
  try {
    const hit = reader.get(ip)
    return hit?.country?.iso_code || hit?.registered_country?.iso_code || ''
  } catch {
    return ''
  }
}

export function openReader(buffer) {
  return new Reader(buffer)
}

// Lecteur rechargé quand le fichier change (vérifié au démarrage puis toutes les 6 h).
export function createGeoip(path, { intervalMs = 6 * 60 * 60 * 1000, log = console } = {}) {
  let reader = null
  let mtime = 0
  const load = async () => {
    try {
      const info = await stat(path)
      if (info.mtimeMs === mtime) return
      reader = openReader(await readFile(path))
      mtime = info.mtimeMs
      log.info(`[geoip] base chargée (${reader.metadata.databaseType}, ${new Date(reader.metadata.buildEpoch).toISOString().slice(0, 10)})`)
    } catch (error) {
      if (error.code !== 'ENOENT') log.error('[geoip] base illisible', error.message)
      else if (!reader) log.info('[geoip] aucune base : pays inconnu, langue du navigateur')
    }
  }
  const ready = load()
  setInterval(load, intervalMs).unref()
  return {
    ready,
    lookup: (req) => countryForIp(reader, clientIp(req)),
    get loaded() { return Boolean(reader) },
  }
}
