import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCertData } from '../lib/cert.js'
import { clearActiveQuiz, loadActiveQuiz, saveActiveQuiz, saveAttempt } from '../lib/storage.js'
import { applyOptionOrder, formatClock, isAnswered, isCorrectSelection } from '../lib/quiz.js'
import FeedbackPanel from '../components/FeedbackPanel.jsx'
import Tag from '../components/Tag.jsx'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

function buildAttempt(questionsById, state, { onlyAnswered = false } = {}) {
  const unscored = new Set(state.unscoredIds || [])
  const items = state.order
    .map((qid) => {
      const baseQuestion = questionsById.get(qid)
      const q = applyOptionOrder(baseQuestion, state.optionOrders?.[qid])
      const selected = state.answers[qid] || []
      if (!q || (onlyAnswered && !isAnswered(q, selected))) return null
      return {
        qid,
        domain: q.domain,
        objective: q.objective,
        selected,
        isCorrect: isCorrectSelection(q, selected),
        scored: !unscored.has(qid),
        optionOrder: state.optionOrders?.[qid] || null,
      }
    })
    .filter(Boolean)
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    mode: state.mode,
    sessionKind: state.sessionKind,
    setNumber: state.setNumber,
    timeLimitSec: state.timeLimitSec,
    elapsedSec: Math.round((Date.now() - state.startedAt) / 1000),
    items,
  }
}

export default function Quiz() {
  const navigate = useNavigate()
  const { cert, questionsById } = useCertData()
  const [state, setState] = useState(() => loadActiveQuiz(cert.code))
  // learn mode: whether the current question has been checked (feedback shown)
  const [checked, setChecked] = useState(false)
  const [now, setNow] = useState(Date.now())

  const baseQuestion = state ? questionsById.get(state.order[state.index]) : null
  const question = state ? applyOptionOrder(baseQuestion, state.optionOrders?.[baseQuestion?.id]) : null

  useEffect(() => {
    if (!state || state.mode !== 'exam') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [state])

  const remainingSec = state?.timeLimitSec
    ? state.timeLimitSec - Math.floor((now - state.startedAt) / 1000)
    : null

  function finish(finalState, opts) {
    const attempt = buildAttempt(questionsById, finalState, opts)
    if (attempt.items.length === 0) {
      clearActiveQuiz(cert.code)
      navigate(`/${cert.code}/practice`)
      return
    }
    saveAttempt(cert.code, attempt)
    clearActiveQuiz(cert.code)
    navigate(`/${cert.code}/results/${attempt.id}`, { replace: true })
  }

  // auto-submit exam when the clock runs out
  useEffect(() => {
    if (state && state.mode === 'exam' && remainingSec !== null && remainingSec <= 0) {
      finish(state)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSec])

  const answeredCount = useMemo(
    () => (state ? state.order.filter((qid) => {
      const base = questionsById.get(qid)
      const prepared = applyOptionOrder(base, state.optionOrders?.[qid])
      return prepared && isAnswered(prepared, state.answers[qid] || [])
    }).length : 0),
    [state, questionsById],
  )

  if (!state || !question) {
    return (
      <p className="text-stone-600">
        No practice session in progress.{' '}
        <Link to={`/${cert.code}/practice`} className="text-indigo-700 underline">Set one up →</Link>
      </p>
    )
  }

  const selected = state.answers[question.id] || []
  const isLearn = state.mode === 'learn'
  const isLast = state.index === state.order.length - 1

  function update(next) {
    setState(next)
    saveActiveQuiz(cert.code, next)
  }

  function toggleOption(i) {
    if (isLearn && checked) return
    let next
    if (question.type === 'multi') {
      next = selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i]
    } else {
      next = [i]
    }
    update({ ...state, answers: { ...state.answers, [question.id]: next } })
  }

  function updateOrdering(nextSelected) {
    if (isLearn && checked) return
    update({ ...state, answers: { ...state.answers, [question.id]: nextSelected } })
  }

  function setMatch(promptIndex, value) {
    if (isLearn && checked) return
    const next = Array.from({ length: question.prompts.length }, (_, index) => selected[index] ?? null)
    next[promptIndex] = value === '' ? null : Number(value)
    update({ ...state, answers: { ...state.answers, [question.id]: next } })
  }

  function goTo(index) {
    setChecked(false)
    update({ ...state, index })
  }

  function quit() {
    if (window.confirm('Abandon this session? Nothing will be scored.')) {
      clearActiveQuiz(cert.code)
      navigate(`/${cert.code}/practice`)
    }
  }

  function optionClasses(i) {
    const base = 'flex w-full items-start gap-3 rounded-md border p-3 text-left text-sm transition-colors'
    if (isLearn && checked) {
      const isRight = question.correct.includes(i)
      const picked = selected.includes(i)
      if (isRight) return `${base} border-emerald-400 bg-emerald-50`
      if (picked) return `${base} border-rose-400 bg-rose-50`
      return `${base} border-stone-200 bg-white opacity-70`
    }
    return selected.includes(i)
      ? `${base} border-indigo-500 bg-indigo-50`
      : `${base} border-stone-200 bg-white hover:border-stone-300`
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-stone-600 tabular-nums">
          Question <span className="font-semibold text-stone-900">{state.index + 1}</span> of {state.order.length}
          <span className="ml-3 text-stone-400">{state.mode === 'exam' ? 'Exam' : 'Learn'} mode</span>
        </div>
        <div className="flex items-center gap-3">
          {state.mode === 'exam' && remainingSec !== null && (
            <span
              className={`rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums ${
                remainingSec < 120 ? 'bg-rose-100 text-rose-800' : 'bg-stone-200 text-stone-800'
              }`}
              aria-label="time remaining"
            >
              ⏱ {formatClock(remainingSec)}
            </span>
          )}
          <button onClick={quit} className="text-xs text-stone-500 underline-offset-2 hover:underline">
            Abandon
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-stone-200 bg-white p-4 sm:p-6">
        {isLearn && (
          <div className="flex flex-wrap gap-2">
            <Tag kind="domain">{question.domain}</Tag>
            <Tag kind="objective">{question.objective}</Tag>
          </div>
        )}
        <p className="mt-4 leading-relaxed text-stone-900">{question.question}</p>
        {question.type === 'multi' && (
          <p className="mt-2 text-xs font-medium text-stone-500">Select exactly {question.correct.length} responses.</p>
        )}
        {question.type === 'ordering' && (
          <p className="mt-2 text-xs font-medium text-stone-500">Select exactly {question.correct.length} responses in the correct order.</p>
        )}
        {question.type === 'matching' && (
          <p className="mt-2 text-xs font-medium text-stone-500">Choose the response that matches each prompt.</p>
        )}

        {(question.type === 'single' || question.type === 'multi') && (
          <div className="mt-5 space-y-2">
            {question.options.map((opt, i) => (
              <button key={i} type="button" onClick={() => toggleOption(i)} className={optionClasses(i)}>
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${selected.includes(i) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-stone-300 text-stone-500'}`}>
                  {LETTERS[i]}
                </span>
                <span className="text-stone-800">{opt}</span>
              </button>
            ))}
          </div>
        )}

        {question.type === 'ordering' && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Your order</h2>
              <ol className="mt-2 space-y-2">
                {selected.map((optionIndex, position) => (
                  <li key={optionIndex} className="flex items-start gap-2 rounded-md border border-indigo-300 bg-indigo-50 p-3 text-sm">
                    <span className="font-bold text-indigo-800">{position + 1}.</span>
                    <span className="flex-1 text-stone-800">{question.options[optionIndex]}</span>
                    <button type="button" onClick={() => updateOrdering(selected.filter((_, index) => index !== position))} className="text-xs text-stone-500 underline">remove</button>
                  </li>
                ))}
                {selected.length === 0 && <li className="rounded-md border border-dashed border-stone-300 p-3 text-sm text-stone-500">Choose the first step from the available responses.</li>}
              </ol>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Available responses</h2>
              <div className="mt-2 space-y-2">
                {question.options.map((option, optionIndex) => selected.includes(optionIndex) || selected.length >= question.correct.length ? null : (
                  <button key={optionIndex} type="button" onClick={() => updateOrdering([...selected, optionIndex])} className="w-full rounded-md border border-stone-300 bg-white p-3 text-left text-sm text-stone-800 hover:border-indigo-400">
                    Add next: {option}
                  </button>
                ))}
                {selected.length >= question.correct.length && (
                  <p className="rounded-md border border-dashed border-stone-300 p-3 text-sm text-stone-500">Required responses selected. Remove a response to change the sequence.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {question.type === 'matching' && (
          <div className="mt-5 space-y-3">
            {question.prompts.map((prompt, promptIndex) => (
              <label key={prompt} className="block rounded-md border border-stone-200 bg-stone-50 p-3">
                <span className="block text-sm font-medium text-stone-900">{prompt}</span>
                <select value={Number.isInteger(selected[promptIndex]) ? selected[promptIndex] : ''} onChange={(event) => setMatch(promptIndex, event.target.value)} className="mt-2 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm">
                  <option value="">Select a response…</option>
                  {question.options.map((option, optionIndex) => <option key={optionIndex} value={optionIndex}>{option}</option>)}
                </select>
              </label>
            ))}
          </div>
        )}
      </div>

      {isLearn && checked && (
        <div className="mt-4">
          <FeedbackPanel question={question} selected={selected} />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {isLearn ? (
          !checked ? (
            <>
              <button
                type="button"
                disabled={!isAnswered(question, selected)}
                onClick={() => setChecked(true)}
                className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                Check answer
              </button>
              {answeredCount > 0 && (
                <button
                  type="button"
                  onClick={() => finish(state, { onlyAnswered: true })}
                  className="text-sm text-stone-500 underline-offset-2 hover:underline"
                >
                  End session & score answered
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => (isLast ? finish(state, { onlyAnswered: true }) : goTo(state.index + 1))}
                className="rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {isLast ? 'Finish session →' : 'Next question →'}
              </button>
              {!isLast && (
                <button
                  type="button"
                  onClick={() => finish(state, { onlyAnswered: true })}
                  className="text-sm text-stone-500 underline-offset-2 hover:underline"
                >
                  End session & score answered
                </button>
              )}
            </>
          )
        ) : (
          <>
            <button
              type="button"
              disabled={state.index === 0}
              onClick={() => goTo(state.index - 1)}
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              ← Previous
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => goTo(state.index + 1)}
              className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              Next →
            </button>
            <button
              type="button"
              onClick={() => {
                const unanswered = state.order.length - answeredCount
                if (
                  unanswered === 0 ||
                  window.confirm(`${unanswered} question(s) are unanswered and will be marked incorrect. Submit anyway?`)
                ) {
                  finish(state)
                }
              }}
              className="ml-auto rounded-md bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Submit exam ({answeredCount}/{state.order.length} answered)
            </button>
          </>
        )}
      </div>

      {state.mode === 'exam' && (
        <div className="mt-6 rounded-lg border border-stone-200 bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Navigator</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {state.order.map((qid, i) => {
              const base = questionsById.get(qid)
              const prepared = applyOptionOrder(base, state.optionOrders?.[qid])
              const answered = prepared && isAnswered(prepared, state.answers[qid] || [])
              const current = i === state.index
              return (
                <button
                  key={qid}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`h-8 w-8 rounded-md border text-xs font-medium tabular-nums ${
                    current
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : answered
                        ? 'border-indigo-300 bg-indigo-50 text-indigo-900'
                        : 'border-stone-200 bg-white text-stone-500'
                  }`}
                >
                  {i + 1}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
