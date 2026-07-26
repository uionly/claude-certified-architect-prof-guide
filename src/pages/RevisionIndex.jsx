import { Link } from 'react-router-dom'
import { useCertData } from '../lib/cert.js'
import Tag from '../components/Tag.jsx'

export default function RevisionIndex() {
  const { cert, domains, revisionByDomain } = useCertData()
  const covered = domains.filter((d) => revisionByDomain[d.id]).length
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">Revision</h1>
      <p className="mt-2 max-w-3xl text-stone-700">
        The last-mile pass. Every blueprint objective gets a short recap — key points and the trap to watch for — plus
        exactly one high-yield question in the style the exam is most likely to use. Nothing here is scored or saved;
        it's built to be read straight through.
      </p>
      <p className="mt-1 text-sm text-stone-500 tabular-nums">
        {covered}/{domains.length} domains ready ·{' '}
        {domains.reduce((n, d) => n + (revisionByDomain[d.id]?.objectives.length || 0), 0)} objectives
      </p>
      <div className="mt-6 space-y-3">
        {domains.map((d) => {
          const revision = revisionByDomain[d.id]
          const ready = Boolean(revision)
          return (
            <div key={d.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-xl font-semibold text-stone-900">
                  {ready ? (
                    <Link to={`/${cert.code}/revision/${d.id}`} className="hover:underline">
                      <span className="text-stone-400">Domain {d.id}:</span> {d.title}
                    </Link>
                  ) : (
                    <span>
                      <span className="text-stone-400">Domain {d.id}:</span> {d.title}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  {ready && <Tag kind="neutral">{d.objectives.length} recaps</Tag>}
                  <Tag kind="domain">{d.weight}% of exam</Tag>
                </div>
              </div>
              <ul className="mt-2 list-inside list-disc text-sm text-stone-600">
                {d.objectives.map((o) => (
                  <li key={o.objective}>{o.objective}</li>
                ))}
              </ul>
              {!ready && <p className="mt-2 text-xs italic text-stone-400">Content in progress.</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
