import { Link } from 'react-router-dom'
import { certRegistry } from '../data/loader.js'

export default function CertPicker() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">Certifications</h1>
      <p className="mt-2 max-w-3xl text-stone-700">Pick a certification to study for.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {certRegistry.map((c) => {
          const available = c.domainCount > 0
          return (
            <Link
              key={c.code}
              to={`/${c.code}`}
              className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-300"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-serif text-lg font-semibold text-stone-900">{c.name}</h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                    available ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-stone-700'
                  }`}
                >
                  {available ? 'Available' : 'Coming soon'}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                {c.code} · {c.totalQuestions * (c.practiceSets ?? 1)} questions
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
