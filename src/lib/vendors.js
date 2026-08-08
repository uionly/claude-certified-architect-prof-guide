// Certifications are grouped by the exam vendor (blueprint cert.vendor) on the landing
// page and in the header switcher.
export const VENDOR_ORDER = ['Anthropic', 'Microsoft']

export const VENDOR_LABELS = {
  Anthropic: 'Anthropic Claude',
  Microsoft: 'Microsoft Azure',
}

// Easiest first within a vendor. A cert missing from this list is still rendered — it is
// appended after the ordered ones, never silently dropped.
const CERT_ORDER = ['CCAO-F', 'CCDV-F', 'CCAR-F', 'CCAR-P', 'AI-103', 'AI-200']

const LAST = Number.MAX_SAFE_INTEGER

function rank(list, value) {
  const i = list.indexOf(value)
  return i === -1 ? LAST : i
}

// [{ vendor, label, certs: [...] }] — vendors in VENDOR_ORDER then alphabetically,
// certs in CERT_ORDER then alphabetically by code.
export function byVendor(certs) {
  const groups = new Map()
  for (const cert of certs) {
    const vendor = cert.vendor || 'Other'
    if (!groups.has(vendor)) groups.set(vendor, [])
    groups.get(vendor).push(cert)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => rank(VENDOR_ORDER, a) - rank(VENDOR_ORDER, b) || a.localeCompare(b))
    .map(([vendor, list]) => ({
      vendor,
      label: VENDOR_LABELS[vendor] ?? vendor,
      certs: list.sort(
        (a, b) => rank(CERT_ORDER, a.code) - rank(CERT_ORDER, b.code) || a.code.localeCompare(b.code),
      ),
    }))
}
