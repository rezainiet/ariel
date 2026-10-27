// Strip retired tracking from newly returned and previously saved payment links.
// On Everflow, sub1 may only carry the ad click ID of the link itself: Meta fbclid, otherwise Snapchat ScCid.
export function cleanCheckoutUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return ''
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase() === 'sub5') url.searchParams.delete(key)
    }
    if (/^(www\.)?molipy8trk\.com$/i.test(url.hostname)) {
      const fbclid = url.searchParams.get('fbclid') || ''
      const sccid = url.searchParams.get('ScCid') || ''
      for (const key of [...url.searchParams.keys()]) {
        if (['sub1', 'fbclid', 'sccid'].includes(key.toLowerCase())) url.searchParams.delete(key)
      }
      const meta = /^[A-Za-z0-9._-]{1,500}$/.test(fbclid) ? fbclid : ''
      const snap = /^[A-Za-z0-9_-]{1,500}$/.test(sccid) ? sccid : ''
      if (meta || snap) url.searchParams.set('sub1', meta || snap)
      if (meta) url.searchParams.set('fbclid', meta)
      if (snap) url.searchParams.set('ScCid', snap)
    }
    return url.href
  } catch {
    return ''
  }
}
