import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCertData } from '../lib/cert.js'
import { clearAllProgress, domainStats, loadAttempts, overallStats } from '../lib/storage.js'
import { percent } from '../lib/quiz.js'
import Meter from '../components/Meter.jsx'
import StatTile from '../components/StatTile.jsx'
import Tag from '../components/Tag.jsx'

export default function Home() {
  const { cert, allQuestions, domains } = useCertData()
  const [attempts, setAttempts] = useState(() => loadAttempts(cert.code))
  const overall = useMemo(() => overallStats(cert.code, attempts), [cert.code, attempts])
  const byDomain = useMemo(() => domainStats(cert.code, attempts), [cert.code, attempts])
  const recent = [...attempts].reverse().slice(0, 5)

  function handleReset() {
    if (window.confirm('Delete all attempt history stored in this browser? This cannot be undone.')) {
      clearAllProgress(cert.code)
      setAttempts([])
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900">
          {cert.name} <span className="text-stone-500">({cert.code})</span>
        </h1>
        <p className="mt-3 max-w-3xl leading-relaxed text-stone-700">
          A study guide and reasoning-based question bank built around the official exam blueprint. Read each domain's
          study sections, then practice against scenario questions tagged to the exact blueprint objective — every
          question links back to the section that teaches it.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to={`/${cert.code}/study`}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Open the study guide
          </Link>
          <Link
            to={`/${cert.code}/practice`}
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Start practicing
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Your progress</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile label="Question bank" value={allQuestions.length} detail={`scenario questions across ${domains.length} domains`} />
          <StatTile
            label="Coverage"
            value={`${percent(overall.uniqueQuestions, allQuestions.length)}%`}
            detail={`${overall.uniqueQuestions} of ${allQuestions.length} questions seen`}
          />
          <StatTile
            label="Accuracy"
            value={overall.attempted ? `${percent(overall.correct, overall.attempted)}%` : '—'}
            detail={overall.attempted ? `${overall.correct}/${overall.attempted} answers correct` : 'no attempts yet'}
          />
          <StatTile label="Sessions" value={overall.attemptCount} detail="learn + exam sessions completed" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Domains</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {domains.map((d) => {
            const s = byDomain[d.title] || { attempted: 0, correct: 0 }
            return (
              <div key={d.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-lg font-semibold text-stone-900">
                    <span className="text-stone-400">{d.id}.</span> {d.title}
                  </h3>
                  <Tag kind="domain">{d.weight}%</Tag>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {d.objectives.length} objectives · {d.questionCount * (cert.practiceSets ?? 1)} questions
                </p>
                <Meter className="mt-3" correct={s.correct} attempted={s.attempted} />
                <div className="mt-3 flex gap-4 text-sm font-medium">
                  <Link to={`/${cert.code}/study/${d.id}`} className="text-indigo-700 underline-offset-2 hover:underline">
                    Study →
                  </Link>
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

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Recent sessions</h2>
          {attempts.length > 0 && (
            <button onClick={handleReset} className="text-xs text-stone-500 underline-offset-2 hover:underline">
              Reset all progress
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No sessions yet — your results will appear here.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
            {recent.map((a) => {
              const correct = a.items.filter((i) => i.isCorrect).length
              return (
                <li key={a.id}>
                  <Link to={`/${cert.code}/results/${a.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-stone-50">
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
        )}
      </section>
    </div>
  )
}
