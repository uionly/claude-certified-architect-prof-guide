import { useNavigate } from 'react-router-dom'
import { certRegistry } from '../data/loader.js'

export default function CertSwitcher({ activeCertCode }) {
  const navigate = useNavigate()

  return (
    <select
      value={activeCertCode}
      onChange={(e) => {
        localStorage.setItem('selectedCert', e.target.value)
        navigate(`/${e.target.value}`)
      }}
      className="rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-700"
      aria-label="Switch certification"
    >
      {certRegistry.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.name}
        </option>
      ))}
    </select>
  )
}
