import test from 'node:test'
import assert from 'node:assert/strict'
import { clean, validateCustomer, validateOrder } from '../src/lib/orderValidation.js'
import { buildEverflowUrl } from './everflow.mjs'

const base = { prenom: 'Alex', nom: 'Test', email: 'alex@example.com', adresse: 'Main Street 1', ville: 'Town' }

test('phone and postal code follow the selected country, while orders carry E.164 and ISO country', () => {
  for (const [country, phoneCountry, tel, npa, expectedPhone] of [
    ['CH', 'CH', '079 123 45 67', '1003', '+41791234567'],
    ['FR', 'FR', '06 12 34 56 78', '75001', '+33612345678'],
    ['DE', 'DE', '0151 23456789', '10115', '+4915123456789'],
    ['GB', 'GB', '07123 456789', 'SW1A 1AA', '+447123456789'],
    ['IE', 'IE', '087 123 4567', 'D02 X285', '+353871234567'],
  ]) {
    const customer = { ...base, country, phoneCountry, tel, npa }
    assert.deepEqual(validateCustomer(customer), {}, country)
    const order = validateOrder({ offerId: 'pack-1', termsAccepted: true, customer })
    assert.equal(order.ok, true, country)
    assert.equal(order.order.country, country)
    assert.equal(order.order.customer.country, country)
    assert.equal(order.order.customer.tel, expectedPhone)
  }
})

test('unsupported delivery countries and wrong postal formats are rejected by the server', () => {
  const customer = { ...base, country: 'FR', phoneCountry: 'FR', tel: '06 12 34 56 78', npa: '75001' }
  assert.ok(validateCustomer({ ...customer, country: 'US' }).country)
  assert.ok(validateCustomer({ ...customer, npa: '1003' }).npa)
  assert.ok(validateCustomer({ ...customer, tel: '123' }).tel)
  assert.equal(clean({ ...base, tel: '+41 79 123 45 67', npa: '1003' }).country, 'CH')
})

test('non-Swiss delivery country reaches the hosted checkout address', () => {
  const customer = { ...base, country: 'FR', tel: '+33612345678', npa: '75001' }
  const url = new URL(buildEverflowUrl('pack-1', customer, 'https://example.com/image.png'))
  assert.equal(url.searchParams.get('sub7'), 'Main Street 1, FR')
  assert.equal(url.searchParams.get('sub8'), '+33612345678')
})
