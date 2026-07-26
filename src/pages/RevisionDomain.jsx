import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCertData } from '../lib/cert.js'
import { slugify } from '../data/loader.js'
import Tag from '../components/Tag.jsx'

const LETTERS = ['A', 'B', 'C', 'D']

// One revision card. All state is local and throwaway: revision is deliberately
// not scored and writes nothing to localStorage (that's what Practice is for).
function ObjectiveCard({ item, certCode, domainId }) {
  const [picked, setPicked] = useState([])
  const [revealed, setRevealed] = useState(false)
  const q = item.question
  const isMulti = q.type === 'multi'

  function toggle(i) {
    if (revealed) return
    setPicked((prev) =>
      isMulti ? (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]) : [i],
    )
  }

  function optionClasses(i) {
    const base = 'flex w-full items-start gap-3 rounded-md border p-2.5 text-left text-sm transition-colors'
    if (revealed) {
      if (q.correct.includes(i)) return `${base} border-emerald-400 bg-emerald-50`
      if (picked.includes(i)) return `${base} border-rose-400 bg-rose-50`
      return `${base} border-stone-200 bg-white opacity-70`
    }
    return picked.includes(i)
      ? `${base} border-indigo-500 bg-indigo-50`
      : `${base} border-stone-200 bg-white hover:border-stone-300`
  }

  return (
    <section id={slugify(item.objective)} className="scroll-mt-20 rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
      <Tag kind="objective">{item.objective}</Tag>

      <ul className="mt-3 space-y-1.5">
        {item.keyPoints.map((p, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-stone-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden />
            <span>{p}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 rounded-md border-l-4 border-amber-300 bg-amber-50/60 p-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-900">Watch for</span>
        <p className="mt-0.5 text-sm leading-relaxed text-stone-700">{item.watchFor}</p>
      </div>

      <div className="mt-4 border-t border-stone-200 pt-4">
        <p className="text-sm leading-relaxed text-stone-900">{q.stem}</p>
        <div className="mt-3 space-y-2">
          {q.options.map((opt, i) => (
            <button key={i} type="button" onClick={() => toggle(i)} className={optionClasses(i)}>
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  picked.includes(i) && !revealed
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-stone-300 text-stone-500'
                }`}
              >
                {LETTERS[i]}
              </span>
              <span className="text-stone-800">{opt}</span>
            </button>
          ))}
        </div>

        {revealed ? (
          <div className="mt-3 rounded-md border-l-4 border-emerald-400 bg-emerald-50/60 p-3">
            <p className="text-sm font-semibold text-emerald-900">
              Answer: {q.correct.map((i) => LETTERS[i]).join(' + ')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-stone-700">{q.answerWhy}</p>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Reveal answer
            </button>
            <span className="text-xs text-stone-500">
              {isMulti ? 'Choose two, then reveal.' : 'Commit to an option first — then reveal.'}
            </span>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs">
        <Link
          to={`/${certCode}/study/${domainId}#${slugify(item.objective)}`}
          className="text-indigo-700 underline-offset-2 hover:underline"
        >
          Study this objective →
        </Link>
      </p>
    </section>
  )
}

export default function RevisionDomain() {
  const { domainId } = useParams()
  const { cert, domainById, domains, revisionByDomain } = useCertData()
  const id = Number(domainId)
  const domain = domainById[id]
  const revision = revisionByDomain[id]

  if (!domain) {
    return (
      <p className="text-stone-600">
        Unknown domain.{' '}
        <Link className="text-indigo-700 underline" to={`/${cert.code}/revision`}>Back to revision.</Link>
      </p>
    )
  }
  if (!revision) {
    return (
      <p className="text-stone-600">
        The revision pass for Domain {id} hasn't been written yet.{' '}
        <Link className="text-indigo-700 underline" to={`/${cert.code}/revision`}>Back to revision.</Link>
      </p>
    )
  }

  const prev = domains.find((d) => d.id === id - 1)
  const next = domains.find((d) => d.id === id + 1)

  return (
    <article className="mx-auto max-w-3xl">
      <header>
        <p className="text-sm text-stone-500">
          <Link to={`/${cert.code}/revision`} className="hover:underline">Revision</Link> / Domain {domain.id}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">{domain.title}</h1>
          <Tag kind="domain">{domain.weight}% of exam</Tag>
        </div>
        <p className="mt-3 text-sm text-stone-600">
          {revision.objectives.length} objectives · one recap and one high-yield question each. Nothing is scored or
          saved.{' '}
          <Link to={`/${cert.code}/study/${domain.id}`} className="text-indigo-700 underline-offset-2 hover:underline">
            Full study guide →
          </Link>
        </p>
      </header>

      <div className="mt-6 space-y-4">
        {revision.objectives.map((item) => (
          <ObjectiveCard key={item.objective} item={item} certCode={cert.code} domainId={domain.id} />
        ))}
      </div>

      <nav className="mt-6 flex justify-between border-t border-stone-200 pt-4 text-sm font-medium">
        {prev ? (
          <Link to={`/${cert.code}/revision/${prev.id}`} className="text-indigo-700 underline-offset-2 hover:underline">
            ← Domain {prev.id}: {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link to={`/${cert.code}/revision/${next.id}`} className="text-right text-indigo-700 underline-offset-2 hover:underline">
            Domain {next.id}: {next.title} →
          </Link>
        ) : <span />}
      </nav>
    </article>
  )
}
