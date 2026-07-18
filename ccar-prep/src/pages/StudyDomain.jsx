import { Link, useParams } from 'react-router-dom'
import { domainById, domains, slugify, studyByDomain } from '../data/loader.js'
import { loadAttempts, objectiveStats } from '../lib/storage.js'
import Meter from '../components/Meter.jsx'
import Tag from '../components/Tag.jsx'

function practiceLink(domainId, objective) {
  return `/practice?domain=${domainId}&objective=${encodeURIComponent(objective)}`
}

export default function StudyDomain() {
  const { domainId } = useParams()
  const id = Number(domainId)
  const domain = domainById[id]
  const study = studyByDomain[id]
  const perObjective = objectiveStats(loadAttempts())

  if (!domain) {
    return <p className="text-stone-600">Unknown domain. <Link className="text-indigo-700 underline" to="/study">Back to the study guide.</Link></p>
  }
  if (!study) {
    return (
      <p className="text-stone-600">
        The study guide for Domain {id} hasn't been written yet.{' '}
        <Link className="text-indigo-700 underline" to="/study">Back to the study guide.</Link>
      </p>
    )
  }

  const prev = domains.find((d) => d.id === id - 1)
  const next = domains.find((d) => d.id === id + 1)
  const attemptedAny = domain.objectives.some((o) => perObjective[o.objective]?.attempted)

  return (
    <article className="mx-auto max-w-3xl">
      <header>
        <p className="text-sm text-stone-500">
          <Link to="/study" className="hover:underline">Study Guide</Link> / Domain {domain.id}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">{domain.title}</h1>
          <Tag kind="domain">{domain.weight}% of exam</Tag>
        </div>
        <p className="mt-4 leading-relaxed text-stone-700">{study.intro}</p>
      </header>

      <section className="mt-6 rounded-lg border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
          {attemptedAny ? 'Objectives & your performance' : 'Objectives in this domain'}
        </h2>
        <ul className="mt-3 space-y-3">
          {domain.objectives.map((o) => {
            const s = perObjective[o.objective] || { attempted: 0, correct: 0 }
            return (
              <li key={o.objective}>
                <a href={`#${slugify(o.objective)}`} className="text-sm font-medium text-indigo-700 underline-offset-2 hover:underline">
                  {o.objective}
                </a>
                <Meter className="mt-1" correct={s.correct} attempted={s.attempted} />
              </li>
            )
          })}
        </ul>
      </section>

      <div className="mt-2 divide-y divide-stone-200">
        {study.objectives.map((section) => {
          const s = perObjective[section.objective] || { attempted: 0, correct: 0 }
          return (
            <section key={section.objective} id={slugify(section.objective)} className="scroll-mt-20 py-8">
              <Tag kind="objective">{section.objective}</Tag>
              <h2 className="mt-3 font-serif text-2xl font-semibold text-stone-900">{section.objective}</h2>

              <div className="mt-4 space-y-4">
                {section.explanation.split('\n\n').map((p, i) => (
                  <p key={i} className="leading-relaxed text-stone-700">{p}</p>
                ))}
              </div>

              <div className="mt-5 rounded-md border-l-4 border-indigo-300 bg-indigo-50/60 p-4">
                <h3 className="text-sm font-semibold text-indigo-900">Why it matters in production</h3>
                <p className="mt-1 text-sm leading-relaxed text-stone-700">{section.whyItMatters}</p>
              </div>

              {section.examples.map((ex, i) => (
                <div key={i} className="mt-4 rounded-md border border-stone-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-stone-900">Worked example: {ex.title}</h3>
                  <div className="mt-2 space-y-2">
                    {ex.body.split('\n\n').map((p, j) => (
                      <p key={j} className="text-sm leading-relaxed text-stone-700">{p}</p>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-stone-900">Common pitfalls</h3>
                <ul className="mt-2 space-y-1.5">
                  {section.pitfalls.map((p, i) => (
                    <li key={i} className="flex gap-2 text-sm leading-relaxed text-stone-700">
                      <span className="text-amber-600" aria-hidden>⚠</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-md bg-stone-200/60 p-3">
                <Link
                  to={practiceLink(domain.id, section.objective)}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Practice this objective →
                </Link>
                <span className="text-xs text-stone-600 tabular-nums">
                  {s.attempted ? `Your record: ${s.correct}/${s.attempted} correct` : 'Not practiced yet'}
                </span>
              </div>
            </section>
          )
        })}
      </div>

      <nav className="mt-4 flex justify-between border-t border-stone-200 pt-4 text-sm font-medium">
        {prev ? (
          <Link to={`/study/${prev.id}`} className="text-indigo-700 underline-offset-2 hover:underline">
            ← Domain {prev.id}: {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/study/${next.id}`} className="text-right text-indigo-700 underline-offset-2 hover:underline">
            Domain {next.id}: {next.title} →
          </Link>
        ) : <span />}
      </nav>
    </article>
  )
}
