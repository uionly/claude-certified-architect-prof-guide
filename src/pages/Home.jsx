import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCertData } from '../lib/cert.js'
import { certByCode, hasRevision, hasStudy } from '../data/loader.js'
import { clearAllProgress, domainStats, loadAttempts, overallStats } from '../lib/storage.js'
import { percent } from '../lib/quiz.js'
import Meter from '../components/Meter.jsx'
import StatTile from '../components/StatTile.jsx'
import Tag from '../components/Tag.jsx'

function joinFacts(items) {
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`
}

function ExamFactStrip({ cert, meta, bankSize, domainCount }) {
  // Only facts that are actually recorded get rendered — no invented numbers.
  const facts = [
    { label: 'Exam questions', value: cert.examQuestions ? `${cert.examQuestions}` : null, missing: 'an item count' },
    { label: 'Time limit', value: meta?.examMinutes ? `${meta.examMinutes} min` : null, missing: 'a time limit' },
    { label: 'Passing score', value: cert.passingScore || null, missing: 'a passing score' },
    { label: 'Exam fee', value: cert.examFee || null, missing: 'a fixed fee' },
    { label: 'Valid for', value: cert.validityMonths ? `${cert.validityMonths} months` : null },
    { label: 'Format', value: cert.format || null },
  ]
  // Named so the note below says which facts are absent, rather than claiming all of them are.
  const missing = facts.filter((f) => !f.value && f.missing).map((f) => f.missing)
  const shown = facts.filter((f) => f.value)

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">About this exam</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {shown.map((f) => (
          <div key={f.label}>
            <dt className="text-xs text-stone-500">{f.label}</dt>
            <dd className="mt-0.5 font-semibold text-stone-900">{f.value}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs text-stone-500">Practice bank here</dt>
          <dd className="mt-0.5 font-semibold text-stone-900 tabular-nums">{bankSize} questions</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Domains</dt>
          <dd className="mt-0.5 font-semibold text-stone-900 tabular-nums">{domainCount}</dd>
        </div>
      </dl>
      {(cert.registrationUrl || missing.length > 0) && (
        <div className="mt-3 border-t border-stone-200 pt-3">
          {cert.registrationUrl && (
            <a
              href={cert.registrationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              Register for the official exam ↗
            </a>
          )}
          {missing.length > 0 && (
            <p className={`text-xs leading-relaxed text-stone-500 ${cert.registrationUrl ? 'mt-2' : ''}`}>
              {cert.vendor ?? 'The exam vendor'} doesn&apos;t publish {joinFacts(missing)} for this exam. Exam-mode
              timing here is based on the number of questions you choose.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StartHere({ cert }) {
  const steps = [
    hasStudy(cert) && {
      title: 'Read the study guide',
      body: 'One section per exam objective, with worked examples and the pitfalls people get caught by.',
      to: `/${cert.code}/study`,
      cta: 'Open the study guide',
    },
    {
      title: 'Practise in Learn mode',
      body: 'Untimed, with the full reasoning shown after every answer — including the ones you get right.',
      to: `/${cert.code}/practice`,
      cta: 'Start practising',
    },
    {
      title: 'Simulate the exam',
      body: hasRevision(cert)
        ? 'Timed run with feedback held until you submit, then review every question. Revision gives you a fast final pass.'
        : 'Timed run at the real exam pace with feedback held until you submit, then review every question and its reasoning.',
      to: hasRevision(cert) ? `/${cert.code}/revision` : `/${cert.code}/practice`,
      cta: hasRevision(cert) ? 'Open revision' : 'Set up an exam run',
    },
  ]
    .filter(Boolean)
    .map((step, i) => ({ ...step, n: i + 1 }))

  return (
    <section className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-5">
      <h2 className="text-lg font-semibold text-stone-900">New here? Start with this.</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-700">
        You don&apos;t have any attempts for this certification yet. The steps below are the fastest route from
        blueprint to exam-ready — your results then appear on this page.
      </p>
      <ol className={`mt-4 grid gap-3 ${steps.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {steps.map((s) => (
          <li key={s.n} className="flex flex-col rounded-md border border-stone-200 bg-white p-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-800">
              {s.n}
            </span>
            <h3 className="mt-2 font-semibold text-stone-900">{s.title}</h3>
            <p className="mt-1 flex-1 text-sm leading-relaxed text-stone-700">{s.body}</p>
            <Link
              to={s.to}
              className="mt-3 text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
            >
              {s.cta} →
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function Home() {
  const { cert, allQuestions, domains } = useCertData()
  const meta = certByCode[cert.code]
  const [attempts, setAttempts] = useState(() => loadAttempts(cert.code))
  const overall = useMemo(() => overallStats(cert.code, attempts), [cert.code, attempts])
  const byDomain = useMemo(() => domainStats(cert.code, attempts), [cert.code, attempts])
  const recent = [...attempts].reverse().slice(0, 5)
  const hasAttempts = attempts.length > 0
  const study = hasStudy(cert)
  const revision = hasRevision(cert)

  function handleReset() {
    if (window.confirm('Delete all attempt history stored in this browser? This cannot be undone.')) {
      clearAllProgress(cert.code)
      setAttempts([])
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
            {cert.level ? `${cert.level} certification` : 'Certification'}
          </p>
          {!study && <Tag kind="neutral">Practice only</Tag>}
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">
          {cert.name} <span className="text-stone-500">({cert.code})</span>
        </h1>
        <p className="mt-3 max-w-3xl leading-relaxed text-stone-700">
          {study ? (
            <>
              A study guide and reasoning-based question bank built around the official exam blueprint. Read each
              domain&apos;s study sections, then practice against scenario questions tagged to the exact blueprint
              objective — every question links back to the section that teaches it.
            </>
          ) : (
            <>
              A reasoning-based question bank built around the official exam blueprint:{' '}
              {cert.practiceSets ?? 1} practice sets of {cert.examQuestions ?? cert.questionsPerSet} questions, each one
              a scenario tagged to the exact blueprint objective, with a full explanation of why every option is right
              or wrong.
            </>
          )}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          {study && (
            <Link
              to={`/${cert.code}/study`}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Open the study guide
            </Link>
          )}
          <Link
            to={`/${cert.code}/practice`}
            className={
              study
                ? 'rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50'
                : 'rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700'
            }
          >
            Start practicing
          </Link>
          {revision && (
            <Link
              to={`/${cert.code}/revision`}
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Revision recaps
            </Link>
          )}
        </div>
      </section>

      <ExamFactStrip
        cert={cert}
        meta={meta}
        bankSize={allQuestions.length}
        domainCount={domains.length}
      />

      {!hasAttempts && <StartHere cert={cert} />}

      {hasAttempts && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Your progress</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Coverage"
              value={`${percent(overall.uniqueQuestions, allQuestions.length)}%`}
              detail={`${overall.uniqueQuestions} of ${allQuestions.length} questions seen`}
            />
            <StatTile
              label="Accuracy"
              value={`${percent(overall.correct, overall.attempted)}%`}
              detail={`${overall.correct}/${overall.attempted} answers correct`}
            />
            <StatTile label="Sessions" value={overall.attemptCount} detail="learn + exam sessions completed" />
            <StatTile
              label="Question bank"
              value={allQuestions.length}
              detail={`scenario questions across ${domains.length} domains`}
            />
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Domains</h2>
        <p className="mt-1 text-sm text-stone-600">
          Weighted as on the real exam — spend your time in proportion to these percentages.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {domains.map((d) => {
            const s = byDomain[d.title] || { attempted: 0, correct: 0 }
            return (
              <div key={d.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-stone-900">
                    <span className="text-stone-400">{d.id}.</span> {d.title}
                  </h3>
                  <Tag kind="domain">{d.weight}%</Tag>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {d.objectives.length} objectives · {d.questionCount * (cert.practiceSets ?? 1)} questions
                </p>
                <Meter className="mt-3" correct={s.correct} attempted={s.attempted} />
                <div className="mt-3 flex gap-4 text-sm font-medium">
                  {study && (
                    <Link
                      to={`/${cert.code}/study/${d.id}`}
                      className="text-indigo-700 underline-offset-2 hover:underline"
                    >
                      Study →
                    </Link>
                  )}
                  {revision && (
                    <Link
                      to={`/${cert.code}/revision/${d.id}`}
                      className="text-indigo-700 underline-offset-2 hover:underline"
                    >
                      Revise →
                    </Link>
                  )}
                  <Link
                    to={`/${cert.code}/practice?domain=${d.id}`}
                    className="text-indigo-700 underline-offset-2 hover:underline"
                  >
                    Practice →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {hasAttempts && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Recent sessions</h2>
            <button onClick={handleReset} className="text-xs text-stone-500 underline-offset-2 hover:underline">
              Reset all progress
            </button>
          </div>
          <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
            {recent.map((a) => {
              const correct = a.items.filter((i) => i.isCorrect).length
              return (
                <li key={a.id}>
                  <Link
                    to={`/${cert.code}/results/${a.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-stone-50"
                  >
                    <div>
                      <span className="text-sm font-medium capitalize text-stone-900">{a.mode} session</span>
                      <span className="ml-2 text-xs text-stone-500">{new Date(a.ts).toLocaleString()}</span>
                    </div>
                    <span className="text-sm text-stone-700 tabular-nums">
                      {correct}/{a.items.length} · {percent(correct, a.items.length)}%
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </div>
  )
}
