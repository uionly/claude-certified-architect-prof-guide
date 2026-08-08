import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCertData } from '../lib/cert.js'
import { loadActiveQuiz, saveActiveQuiz } from '../lib/storage.js'
import { buildFullMock, buildOptionOrders, examMinutes, shuffle } from '../lib/quiz.js'
import Tag from '../components/Tag.jsx'

export default function PracticeSetup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { cert, allQuestions, domainById, domainIdForQuestion, domains } = useCertData()
  const hasFullMocks = Boolean(cert.explicitSets && cert.practiceSets && cert.questionsPerSet)
  const paramDomain = params.get('domain') ? Number(params.get('domain')) : null
  const paramObjective = params.get('objective') || ''

  const [sessionKind, setSessionKind] = useState(hasFullMocks && !paramDomain ? 'mock' : 'drill')
  const [setNumber, setSetNumber] = useState(1)
  const [mode, setMode] = useState('learn')
  const [selectedDomains, setSelectedDomains] = useState(
    () => new Set(paramDomain ? [paramDomain] : domains.map((d) => d.id)),
  )
  const [objective, setObjective] = useState(paramObjective)
  const [countChoice, setCountChoice] = useState(10)

  const resumable = useMemo(() => loadActiveQuiz(cert.code), [cert.code])
  const singleDomain = selectedDomains.size === 1 ? domainById[[...selectedDomains][0]] : null

  const pool = useMemo(() => {
    let questions = allQuestions.filter((question) => selectedDomains.has(domainIdForQuestion(question)))
    if (objective) questions = questions.filter((question) => question.objective === objective)
    return questions
  }, [selectedDomains, objective, allQuestions, domainIdForQuestion])

  const countChoices = useMemo(
    () => [...new Set([10, 20, 30, cert.questionsPerSet].filter((value) => Number.isInteger(value)))].sort((a, b) => a - b).concat('all'),
    [cert.questionsPerSet],
  )
  const count = countChoice === 'all' ? pool.length : Math.min(countChoice, pool.length)

  function toggleDomain(id) {
    setSelectedDomains((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setObjective('')
  }

  function start() {
    let questions
    let unscoredIds = []
    let quizMode = mode
    let timeLimitSec

    if (sessionKind === 'mock') {
      const mock = buildFullMock(allQuestions, setNumber, cert.unscoredQuestions ?? 0)
      questions = mock.questions
      unscoredIds = mock.unscoredIds
      quizMode = 'exam'
      timeLimitSec = cert.examTimeMinutes * 60
    } else {
      questions = shuffle(pool).slice(0, count)
      timeLimitSec = mode === 'exam' ? examMinutes(questions.length, cert.examMinutesPerQuestion) * 60 : null
    }

    const state = {
      version: 2,
      mode: quizMode,
      sessionKind,
      setNumber: sessionKind === 'mock' ? setNumber : null,
      order: questions.map((question) => question.id),
      optionOrders: buildOptionOrders(questions),
      unscoredIds,
      answers: {},
      index: 0,
      startedAt: Date.now(),
      timeLimitSec,
    }
    saveActiveQuiz(cert.code, state)
    navigate(`/${cert.code}/quiz`)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">Practice</h1>

      {resumable && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <span>You have an unfinished {resumable.sessionKind === 'mock' ? 'full mock' : resumable.mode} session ({resumable.order.length} questions).</span>
          <button onClick={() => navigate(`/${cert.code}/quiz`)} className="rounded-md bg-amber-600 px-3 py-1 font-medium text-white hover:bg-amber-700">
            Resume it →
          </button>
        </div>
      )}

      {hasFullMocks && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Session</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSessionKind('mock')}
              className={`rounded-lg border p-4 text-left ${sessionKind === 'mock' ? 'border-indigo-500 bg-indigo-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}
            >
              <div className="font-semibold text-stone-900">Full exam simulation</div>
              <div className="mt-1 text-sm text-stone-600">
                {cert.examQuestions} questions in {cert.examTimeMinutes} minutes: {cert.scoredQuestions} scored-style plus {cert.unscoredQuestions} unidentified trial items.
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSessionKind('drill')}
              className={`rounded-lg border p-4 text-left ${sessionKind === 'drill' ? 'border-indigo-500 bg-indigo-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}
            >
              <div className="font-semibold text-stone-900">Custom drill</div>
              <div className="mt-1 text-sm text-stone-600">Choose domains, objectives, length, and learn or timed mode.</div>
            </button>
          </div>
        </section>
      )}

      {sessionKind === 'mock' ? (
        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Practice set</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from({ length: cert.practiceSets }, (_, index) => index + 1).map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => setSetNumber(number)}
                className={`rounded-md border px-4 py-2 text-sm font-semibold ${setNumber === number ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'}`}
              >
                Set {number}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            The {cert.scoredQuestions} scored-style questions preserve the official domain and objective distribution. Trial items come from the other sets and are mixed in without labels, as on the live exam.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Mode</h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {[
                { key: 'learn', title: 'Learn mode', desc: 'Untimed. Full reasoning appears after every answer.' },
                { key: 'exam', title: 'Timed drill', desc: `Timed at ${cert.examMinutesPerQuestion} min/question. Feedback appears after submission.` },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setMode(item.key)}
                  className={`rounded-lg border p-4 text-left ${mode === item.key ? 'border-indigo-500 bg-indigo-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}
                >
                  <div className="font-semibold text-stone-900">{item.title}</div>
                  <div className="mt-1 text-sm text-stone-600">{item.desc}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Domains</h2>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {domains.map((domain) => (
                <label key={domain.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm hover:bg-stone-50">
                  <input type="checkbox" checked={selectedDomains.has(domain.id)} onChange={() => toggleDomain(domain.id)} className="accent-indigo-600" />
                  <span className="flex-1 text-stone-800">{domain.id}. {domain.title}</span>
                  <span className="text-xs text-stone-400">{domain.weight}%</span>
                </label>
              ))}
            </div>
            <div className="mt-2 flex gap-3 text-xs">
              <button className="text-indigo-700 underline-offset-2 hover:underline" onClick={() => { setSelectedDomains(new Set(domains.map((domain) => domain.id))); setObjective('') }}>Select all</button>
              <button className="text-indigo-700 underline-offset-2 hover:underline" onClick={() => { setSelectedDomains(new Set()); setObjective('') }}>Clear</button>
            </div>
          </section>

          {singleDomain && (
            <section className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Objective <span className="normal-case text-stone-400">(optional)</span></h2>
              <select value={objective} onChange={(event) => setObjective(event.target.value)} className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm">
                <option value="">All objectives in this domain</option>
                {singleDomain.objectives.map((item) => <option key={item.objective} value={item.objective}>{item.objective}</option>)}
              </select>
              {objective && <div className="mt-2"><Tag kind="objective">{objective}</Tag></div>}
            </section>
          )}

          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Number of questions</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {countChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setCountChoice(choice)}
                  className={`rounded-md border px-4 py-1.5 text-sm font-medium ${countChoice === choice ? 'border-indigo-500 bg-indigo-50 text-indigo-900' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'}`}
                >
                  {choice === 'all' ? `All (${pool.length})` : choice}
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-stone-200 pt-5">
        <button
          type="button"
          disabled={sessionKind === 'drill' && count === 0}
          onClick={start}
          className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {sessionKind === 'mock' ? `Start full mock — Set ${setNumber}` : `Start ${mode === 'exam' ? 'timed drill' : 'learning'} — ${count} questions`}
        </button>
        <span className="text-sm text-stone-500 tabular-nums">
          {sessionKind === 'mock'
            ? `${cert.examQuestions} questions · ${cert.examTimeMinutes} minute limit`
            : `${pool.length} matching questions${mode === 'exam' && count > 0 ? ` · ${examMinutes(count, cert.examMinutesPerQuestion)} minute limit` : ''}`}
        </span>
      </div>
    </div>
  )
}
