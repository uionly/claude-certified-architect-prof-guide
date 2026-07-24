import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCertData } from '../lib/cert.js'
import { loadActiveQuiz, saveActiveQuiz } from '../lib/storage.js'
import { examMinutes, shuffle } from '../lib/quiz.js'
import Tag from '../components/Tag.jsx'

const COUNT_CHOICES = [10, 20, 30, 'all']

export default function PracticeSetup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { cert, allQuestions, domainById, domainIdForQuestion, domains } = useCertData()
  const paramDomain = params.get('domain') ? Number(params.get('domain')) : null
  const paramObjective = params.get('objective') || ''

  const [mode, setMode] = useState('learn')
  const [selectedDomains, setSelectedDomains] = useState(
    () => new Set(paramDomain ? [paramDomain] : domains.map((d) => d.id)),
  )
  const [objective, setObjective] = useState(paramObjective)
  const [countChoice, setCountChoice] = useState(10)

  const resumable = useMemo(() => loadActiveQuiz(cert.code), [cert.code])

  const singleDomain = selectedDomains.size === 1 ? domainById[[...selectedDomains][0]] : null

  const pool = useMemo(() => {
    let qs = allQuestions.filter((q) => selectedDomains.has(domainIdForQuestion(q)))
    if (objective) qs = qs.filter((q) => q.objective === objective)
    return qs
  }, [selectedDomains, objective, allQuestions, domainIdForQuestion])

  const count = countChoice === 'all' ? pool.length : Math.min(countChoice, pool.length)

  function toggleDomain(id) {
    setSelectedDomains((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setObjective('')
  }

  function start() {
    const order = shuffle(pool).slice(0, count).map((q) => q.id)
    const state = {
      mode,
      order,
      answers: {}, // qid -> number[]
      index: 0,
      startedAt: Date.now(),
      timeLimitSec: mode === 'exam' ? examMinutes(order.length, cert.examMinutesPerQuestion) * 60 : null,
    }
    saveActiveQuiz(cert.code, state)
    navigate(`/${cert.code}/quiz`)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">Practice</h1>

      {resumable && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <span>You have an unfinished {resumable.mode} session ({resumable.order.length} questions).</span>
          <button
            onClick={() => navigate(`/${cert.code}/quiz`)}
            className="rounded-md bg-amber-600 px-3 py-1 font-medium text-white hover:bg-amber-700"
          >
            Resume it →
          </button>
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Mode</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {[
            {
              key: 'learn',
              title: 'Learn mode',
              desc: 'No timer. Full reasoning appears immediately after every answer — right or wrong.',
            },
            {
              key: 'exam',
              title: 'Exam mode',
              desc: `Timed at ${cert.examMinutesPerQuestion} min/question (${count ? examMinutes(count, cert.examMinutesPerQuestion) : '—'} min for this set). Feedback is withheld until you submit.`,
            },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                mode === m.key ? 'border-indigo-500 bg-indigo-50' : 'border-stone-200 bg-white hover:border-stone-300'
              }`}
            >
              <div className="font-semibold text-stone-900">{m.title}</div>
              <div className="mt-1 text-sm text-stone-600">{m.desc}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Domains</h2>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {domains.map((d) => (
            <label
              key={d.id}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm hover:bg-stone-50"
            >
              <input
                type="checkbox"
                checked={selectedDomains.has(d.id)}
                onChange={() => toggleDomain(d.id)}
                className="accent-indigo-600"
              />
              <span className="flex-1 text-stone-800">
                {d.id}. {d.title}
              </span>
              <span className="text-xs text-stone-400">{d.weight}%</span>
            </label>
          ))}
        </div>
        <div className="mt-2 flex gap-3 text-xs">
          <button
            className="text-indigo-700 underline-offset-2 hover:underline"
            onClick={() => { setSelectedDomains(new Set(domains.map((d) => d.id))); setObjective('') }}
          >
            Select all
          </button>
          <button
            className="text-indigo-700 underline-offset-2 hover:underline"
            onClick={() => { setSelectedDomains(new Set()); setObjective('') }}
          >
            Clear
          </button>
        </div>
      </section>

      {singleDomain && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Objective <span className="normal-case text-stone-400">(optional — narrows within Domain {singleDomain.id})</span>
          </h2>
          <select
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">All objectives in this domain</option>
            {singleDomain.objectives.map((o) => (
              <option key={o.objective} value={o.objective}>
                {o.objective}
              </option>
            ))}
          </select>
          {objective && (
            <div className="mt-2">
              <Tag kind="objective">{objective}</Tag>
            </div>
          )}
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Number of questions</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {COUNT_CHOICES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCountChoice(c)}
              className={`rounded-md border px-4 py-1.5 text-sm font-medium ${
                countChoice === c ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'
              }`}
            >
              {c === 'all' ? `All (${pool.length})` : c}
            </button>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-stone-200 pt-5">
        <button
          type="button"
          disabled={count === 0}
          onClick={start}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          Start {mode === 'exam' ? 'exam' : 'learning'} — {count} question{count === 1 ? '' : 's'}
        </button>
        <span className="text-sm text-stone-500 tabular-nums">
          {pool.length} matching question{pool.length === 1 ? '' : 's'}
          {mode === 'exam' && count > 0 ? ` · ${examMinutes(count, cert.examMinutesPerQuestion)} minute limit` : ''}
        </span>
      </div>
    </div>
  )
}
