import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanCheckoutUrl } from '../src/lib/checkoutUrl.js'
import { buildRedirectUrl, defaultConfig, validateConfig } from '../src/lib/redirectPayment.js'
import { getOffer } from '../src/config/offers.js'

test('old saved Everflow links cannot reopen with sub5 or a mismatched sub1', () => {
  const link = cleanCheckoutUrl('https://www.molipy8trk.com/2J23GL9/WMD7FHG/?sub5=old&sub1=hardcoded&fbclid=real_click_123')
  const url = new URL(link)
  assert.equal(url.searchParams.has('sub5'), false)
  assert.equal(url.searchParams.get('sub1'), 'real_click_123')
  assert.equal(url.searchParams.get('fbclid'), 'real_click_123')
  const dotted = new URL(cleanCheckoutUrl('https://www.molipy8trk.com/2J23GL9/WMD7FHG/?fbclid=real.click_123'))
  assert.equal(dotted.searchParams.get('sub1'), 'real.click_123')
  const noClick = new URL(cleanCheckoutUrl('https://www.molipy8trk.com/2J23GL9/WMD7FHG/?sub5=old&sub1=hardcoded'))
  assert.equal(noClick.searchParams.has('sub1'), false)
  assert.equal(noClick.searchParams.has('sub5'), false)
})

test('saved admin redirect mapping cannot restore sub5 and passes consented click ID twice', () => {
  const config = defaultConfig()
  config.externalRedirect.domain = 'www.molipy8trk.com'
  config.externalRedirect.pathTemplate = '/2J23GL9/{code}/'
  config.externalRedirect.packages['pack-1'].code = 'WMD7FHG'
  config.externalRedirect.params.push({ param: 'sub5', field: 'prenom' }, { param: 'sub1', field: 'nom' })
  assert.equal(validateConfig(config).ok, false)
  const customer = { prenom: 'Ana', nom: 'Test', email: 'ana@example.ch' }
  const url = new URL(buildRedirectUrl(config, getOffer('pack-1'), customer, { fbclid: 'real_click_123' }))
  assert.equal(url.searchParams.has('sub5'), false)
  assert.equal(url.searchParams.get('sub1'), 'real_click_123')
  assert.equal(url.searchParams.get('fbclid'), 'real_click_123')
  const noConsent = new URL(buildRedirectUrl(config, getOffer('pack-1'), customer))
  assert.equal(noConsent.searchParams.has('sub1'), false)
  assert.equal(noConsent.searchParams.has('fbclid'), false)
  const snap = new URL(buildRedirectUrl(config, getOffer('pack-1'), customer, { sccid: 'snap-click-123' }))
  assert.equal(snap.searchParams.get('sub1'), 'snap-click-123')
  assert.equal(snap.searchParams.get('ScCid'), 'snap-click-123')
  assert.equal(snap.searchParams.has('fbclid'), false)
})

test('the payment link keeps the Snapchat click ID in sub1 when it is opened', () => {
  const link = new URL(cleanCheckoutUrl('https://www.molipy8trk.com/2J23GL9/WMD7FHG/?sub10=Ana&sub1=snap-click-123&ScCid=snap-click-123'))
  assert.equal(link.searchParams.get('sub1'), 'snap-click-123')
  assert.equal(link.searchParams.get('ScCid'), 'snap-click-123')
  assert.equal(link.searchParams.get('sub10'), 'Ana')
  const forged = new URL(cleanCheckoutUrl('https://www.molipy8trk.com/2J23GL9/WMD7FHG/?sub1=hardcoded&ScCid=snap-click-123'))
  assert.equal(forged.searchParams.get('sub1'), 'snap-click-123')
  const meta = new URL(cleanCheckoutUrl('https://www.molipy8trk.com/2J23GL9/WMD7FHG/?sub1=IwAR_1&fbclid=IwAR_1'))
  assert.deepEqual([meta.searchParams.get('sub1'), meta.searchParams.get('fbclid'), meta.searchParams.has('ScCid')], ['IwAR_1', 'IwAR_1', false])
})
