import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) throw new Error('Build environment file required')

const required = [
  'VITE_STORE_NAME',
  'VITE_MERCHANT_LEGAL_NAME',
  'VITE_MERCHANT_STREET',
  'VITE_MERCHANT_ZIP',
  'VITE_MERCHANT_CITY',
  'VITE_MERCHANT_UID',
  'VITE_SUPPORT_EMAIL',
  'VITE_RETURN_ADDRESS',
  'VITE_RETURN_CONDITION',
  'VITE_RETURN_COSTS',
  'VITE_REFUND_TERMS',
  'VITE_JURISDICTION',
]

const values = new Map()
for (const [index, line] of readFileSync(file, 'utf8').split(/\r?\n/).entries()) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(trimmed)
  if (!match) throw new Error(`Invalid build environment line ${index + 1}`)
  const [, name, raw] = match
  if (!name.startsWith('VITE_') || /(?:SECRET|TOKEN|PASSWORD|PRIVATE|ACCESS_KEY)/.test(name)) {
    throw new Error(`Unsafe build environment key at line ${index + 1}`)
  }
  const value = raw.replace(/^(["'])(.*)\1$/, '$2').trim()
  if (values.has(name)) throw new Error(`Duplicate build environment key: ${name}`)
  values.set(name, value)
}

const missing = required.filter((name) => !values.get(name))
if (missing.length) throw new Error(`Missing production shop values: ${missing.join(', ')}`)
console.log('Production build settings present')
