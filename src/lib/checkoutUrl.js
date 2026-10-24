// Strip retired tracking from newly returned and previously saved payment links.
export function cleanCheckoutUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') return ''
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase() === 'sub5') url.searchParams.delete(key)
    }
    if (/^(www\.)?molipy8trk\.com$/i.test(url.hostname)) {
      const fbclid = url.searchParams.get('fbclid') || ''
      for (const key of [...url.searchParams.keys()]) {
        if (key.toLowerCase() === 'sub1' || key.toLowerCase() === 'fbclid') url.searchParams.delete(key)
      }
      if (/^[A-Za-z0-9._-]{1,500}$/.test(fbclid)) {
        url.searchParams.set('sub1', fbclid)
        url.searchParams.set('fbclid', fbclid)
      }
    }
    return url.href
  } catch {
    return ''
  }
}
