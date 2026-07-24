import { Link } from 'react-router-dom'
import { useCertData } from '../lib/cert.js'
import { domainStats, loadAttempts } from '../lib/storage.js'
import Meter from '../components/Meter.jsx'
import Tag from '../components/Tag.jsx'

export default function StudyIndex() {
  const { cert, domains, studyByDomain } = useCertData()
  const byDomain = domainStats(cert.code, loadAttempts(cert.code))
  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">Study Guide</h1>
      <p className="mt-2 max-w-3xl text-stone-700">
        One page per exam domain, one section per blueprint objective. Each section ends with a link into the question
        bank filtered to that exact objective.
      </p>
      <div className="mt-6 space-y-3">
        {domains.map((d) => {
          const s = byDomain[d.title] || { attempted: 0, correct: 0 }
          const ready = Boolean(studyByDomain[d.id])
          return (
            <div key={d.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-xl font-semibold text-stone-900">
                  {ready ? (
                    <Link to={`/${cert.code}/study/${d.id}`} className="hover:underline">
                      <span className="text-stone-400">Domain {d.id}:</span> {d.title}
                    </Link>
                  ) : (
                    <span>
                      <span className="text-stone-400">Domain {d.id}:</span> {d.title}
                    </span>
                  )}
                </h2>
                <Tag kind="domain">{d.weight}% of exam</Tag>
              </div>
              <ul className="mt-2 list-inside list-disc text-sm text-stone-600">
                {d.objectives.map((o) => (
                  <li key={o.objective}>{o.objective}</li>
                ))}
              </ul>
              <Meter className="mt-3" correct={s.correct} attempted={s.attempted} />
              {!ready && <p className="mt-2 text-xs italic text-stone-400">Content in progress.</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
