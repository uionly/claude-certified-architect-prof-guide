import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCertData } from '../lib/cert.js'
import { slugify } from '../data/loader.js'
import { getAttempt } from '../lib/storage.js'
import { formatClock, percent } from '../lib/quiz.js'
import FeedbackPanel from '../components/FeedbackPanel.jsx'
import Meter from '../components/Meter.jsx'
import StatTile from '../components/StatTile.jsx'
import Tag from '../components/Tag.jsx'

function groupStats(items, keyFn) {
  const groups = {}
  for (const item of items) {
    const key = keyFn(item)
    const g = (groups[key] ||= { attempted: 0, correct: 0 })
    g.attempted += 1
    if (item.isCorrect) g.correct += 1
  }
  return groups
}

function ReviewItem({ item, index, questionsById }) {
  const [open, setOpen] = useState(false)
  const question = questionsById.get(item.qid)
  if (!question) return null
  return (
    <li className="rounded-lg border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 p-4 text-left hover:bg-stone-50"
      >
        <span
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
            item.isCorrect ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
          aria-label={item.isCorrect ? 'correct' : 'incorrect'}
        >
          {item.isCorrect ? '✓' : '✗'}
        </span>
        <span className="flex-1">
          <span className="text-sm text-stone-800">
            <span className="font-semibold text-stone-500">Q{index + 1}.</span> {question.question}
          </span>
        </span>
        <span className="text-xs text-stone-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="border-t border-stone-200 p-4">
          <FeedbackPanel question={question} selected={item.selected} />
        </div>
      )}
    </li>
  )
}

export default function Results() {
  const { attemptId } = useParams()
  const { cert, domainByTitle, questionsById } = useCertData()
  const attempt = useMemo(() => getAttempt(cert.code, attemptId), [cert.code, attemptId])

  if (!attempt) {
    return (
      <p className="text-stone-600">
        Attempt not found. <Link to={`/${cert.code}`} className="text-indigo-700 underline">Back to overview.</Link>
      </p>
    )
  }

  const correct = attempt.items.filter((i) => i.isCorrect).length
  const total = attempt.items.length
  const byDomain = groupStats(attempt.items, (i) => i.domain)
  const byObjective = groupStats(attempt.items, (i) => i.objective)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <p className="text-sm text-stone-500">{new Date(attempt.ts).toLocaleString()}</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-900 capitalize">
          {attempt.mode} session results
        </h1>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Score" value={`${percent(correct, total)}%`} detail={`${correct} of ${total} correct`} />
        <StatTile label="Questions" value={total} detail={attempt.mode === 'exam' ? 'all scored' : 'answered & scored'} />
        <StatTile label="Time" value={formatClock(attempt.elapsedSec)} detail={attempt.timeLimitSec ? `limit ${formatClock(attempt.timeLimitSec)}` : 'untimed'} />
        <StatTile label="Mode" value={attempt.mode === 'exam' ? 'Exam' : 'Learn'} detail={attempt.mode === 'exam' ? 'feedback after submit' : 'feedback per question'} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">By domain</h2>
        <ul className="mt-3 space-y-2 rounded-lg border border-stone-200 bg-white p-4">
          {Object.entries(byDomain).map(([domain, s]) => (
            <li key={domain}>
              <div className="text-sm font-medium text-stone-800">{domain}</div>
              <Meter className="mt-1" correct={s.correct} attempted={s.attempted} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">By objective</h2>
        <p className="mt-1 text-xs text-stone-500">Each objective tag links to its study-guide section.</p>
        <ul className="mt-3 space-y-3 rounded-lg border border-stone-200 bg-white p-4">
          {Object.entries(byObjective).map(([objective, s]) => {
            const domainId = domainByTitle[attempt.items.find((i) => i.objective === objective)?.domain]?.id
            return (
              <li key={objective}>
                <Tag kind="objective" to={domainId ? `/${cert.code}/study/${domainId}#${slugify(objective)}` : undefined}>
                  {objective}
                </Tag>
                <Meter className="mt-1.5" correct={s.correct} attempted={s.attempted} />
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Question review</h2>
        <p className="mt-1 text-xs text-stone-500">Expand any question for the full reasoning panel.</p>
        <ul className="mt-3 space-y-2">
          {attempt.items.map((item, i) => (
            <ReviewItem key={item.qid} item={item} index={i} questionsById={questionsById} />
          ))}
        </ul>
      </section>

      <div className="flex gap-4 border-t border-stone-200 pt-5 text-sm font-medium">
        <Link to={`/${cert.code}/practice`} className="text-indigo-700 underline-offset-2 hover:underline">
          Practice again →
        </Link>
        <Link to={`/${cert.code}/study`} className="text-indigo-700 underline-offset-2 hover:underline">
          Back to the study guide
        </Link>
      </div>
    </div>
  )
}
