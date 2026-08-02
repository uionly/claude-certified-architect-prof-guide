import { useNavigate } from 'react-router-dom'
import { certRegistry } from '../data/loader.js'

// When no cert is active (the landing page), the select shows a neutral
// placeholder instead of implying a certification has already been chosen.
export default function CertSwitcher({ activeCertCode }) {
  const navigate = useNavigate()
  const hasActive = Boolean(activeCertCode)

  return (
    <select
      value={activeCertCode ?? ''}
      onChange={(e) => {
        if (!e.target.value) return
        localStorage.setItem('selectedCert', e.target.value)
        navigate(`/${e.target.value}`)
      }}
      className="max-w-[16rem] rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-700"
      aria-label={hasActive ? 'Switch certification' : 'Choose a certification'}
    >
      {!hasActive && <option value="">Choose a certification…</option>}
      {certRegistry.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.name}
        </option>
      ))}
    </select>
  )
}
