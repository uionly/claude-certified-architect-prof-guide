import { useState } from 'react'
import Tag from './Tag.jsx'
import { hasStudy, slugify } from '../data/loader.js'
import { useCertData } from '../lib/cert.js'
import { isAnswered, isCorrectSelection } from '../lib/quiz.js'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

function ExplanationBlock({ label, indices, question, tone }) {
  const tones = {
    correct: 'border-emerald-200 bg-emerald-50',
    incorrect: 'border-rose-200 bg-rose-50',
  }
  const labelTones = {
    correct: 'text-emerald-800',
    incorrect: 'text-rose-800',
  }
  return (
    <div className={`rounded-md border p-3 ${tones[tone]}`}>
      <div className={`text-xs font-semibold uppercase tracking-wide ${labelTones[tone]}`}>{label}</div>
      {indices.map((i) => (
        <div key={i} className="mt-2">
          <p className="text-sm font-medium text-stone-900">
            {LETTERS[i]}. {question.options[i]}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-stone-700">{question.optionExplanations[i]}</p>
        </div>
      ))}
    </div>
  )
}

function StructuredAnswer({ question, answer, label, tone = 'incorrect' }) {
  const toneClass = tone === 'correct' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'

  if (question.type === 'matching') {
    return (
      <div className={`rounded-md border p-3 ${toneClass}`}>
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-700">{label}</div>
        <dl className="mt-2 space-y-2">
          {question.prompts.map((prompt, index) => {
            const optionIndex = answer[index]
            return (
              <div key={prompt}>
                <dt className="text-sm font-medium text-stone-900">{prompt}</dt>
                <dd className="text-sm text-stone-700">{Number.isInteger(optionIndex) ? question.options[optionIndex] : 'No response'}</dd>
              </div>
            )
          })}
        </dl>
      </div>
    )
  }

  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-700">{label}</div>
      <ol className="mt-2 space-y-1">
        {answer.map((optionIndex, position) => (
          <li key={`${optionIndex}-${position}`} className="text-sm text-stone-800">
            <span className="font-semibold">{position + 1}.</span> {question.options[optionIndex]}
          </li>
        ))}
      </ol>
    </div>
  )
}

// The visual centerpiece of practice mode: shown immediately after every
// answer in learn mode and per question in the post-exam review.
export default function FeedbackPanel({ question, selected }) {
  const { cert, domainIdForQuestion } = useCertData()
  const [goDeeper, setGoDeeper] = useState(false)
  const answered = isAnswered(question, selected)
  const attempted = Array.isArray(selected) && selected.some(Number.isInteger)
  const correct = answered && isCorrectSelection(question, selected)
  const structured = question.type === 'ordering' || question.type === 'matching'
  const correctSet = new Set(question.correct)
  const wrongPicks = selected.filter((i) => !correctSet.has(i))
  const domainId = domainIdForQuestion(question)
  // Practice-only certs have no study guide, so the objective stays a plain label.
  const studyLink = hasStudy(cert) ? `/${cert.code}/study/${domainId}#${slugify(question.objective)}` : null

  return (
    <div className="rounded-lg border border-stone-300 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
            correct ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {answered ? (correct ? 'Correct' : 'Incorrect') : attempted ? 'Incomplete' : 'Not answered'}
        </span>
        <Tag kind="principle">{question.principle}</Tag>
      </div>

      <div className="mt-4 space-y-3">
        {structured ? (
          <>
            {attempted && (
              <StructuredAnswer
                question={question}
                answer={selected}
                label={correct ? 'Your answer — correct' : answered ? 'Your answer' : 'Your incomplete answer'}
                tone={correct ? 'correct' : 'incorrect'}
              />
            )}
            {(!answered || !correct) && (
              <StructuredAnswer
                question={question}
                answer={question.correct}
                label={answered || attempted ? 'Correct answer' : 'Correct answer (you left this blank)'}
                tone="correct"
              />
            )}
          </>
        ) : answered && correct ? (
          <ExplanationBlock label="Your answer — correct" indices={selected} question={question} tone="correct" />
        ) : (
          <>
            {wrongPicks.length > 0 && (
              <ExplanationBlock label="Your answer" indices={wrongPicks} question={question} tone="incorrect" />
            )}
            <ExplanationBlock
              label={answered ? 'Correct answer' : 'Correct answer (you left this blank)'}
              indices={question.correct}
              question={question}
              tone="correct"
            />
          </>
        )}
      </div>

      <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm">
        <div className="text-stone-700">
          <span className="font-semibold text-stone-900">Related concept: </span>
          {question.relatedConcept}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Tag kind="objective" to={studyLink ?? undefined}>
            {question.objective}
          </Tag>
          {studyLink && <span className="text-xs text-stone-500">← read the study section for this objective</span>}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-indigo-200 bg-indigo-50 p-3 text-sm">
        <span className="font-semibold text-indigo-900">Overall explanation: </span>
        <span className="text-indigo-800">{question.overallExplanation}</span>
      </div>

      <button
        type="button"
        onClick={() => setGoDeeper((v) => !v)}
        className="mt-4 text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
      >
        {goDeeper ? 'Hide response-by-response reasoning ▲' : `Go deeper: reasoning for all ${question.options.length} responses ▼`}
      </button>

      {goDeeper && (
        <ol className="mt-3 space-y-2">
          {question.options.map((opt, i) => {
            const isRight = !structured && correctSet.has(i)
            const picked = !structured && selected.includes(i)
            return (
              <li key={i} className={`rounded-md border p-3 ${isRight ? 'border-emerald-200' : 'border-stone-200'}`}>
                <p className="text-sm font-medium text-stone-900">
                  {LETTERS[i]}. {opt}
                  <span className="ml-2 space-x-1 text-xs font-semibold">
                    {isRight && <span className="text-emerald-700">✓ correct</span>}
                    {structured && <span className="text-indigo-700">response</span>}
                    {picked && <span className="text-stone-500">(your pick)</span>}
                  </span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-stone-700">{question.optionExplanations[i]}</p>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
