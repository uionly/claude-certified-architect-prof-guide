export function sameSet(a, b) {
  if (a.length !== b.length) return false
  const set = new Set(b)
  return a.every((x) => set.has(x))
}

export function isCorrectSelection(question, selected) {
  if (question.type === 'ordering' || question.type === 'matching') {
    return selected.length === question.correct.length && selected.every((value, index) => value === question.correct[index])
  }
  return sameSet(selected, question.correct)
}

export function isAnswered(question, selected) {
  if (!Array.isArray(selected)) return false
  if (question.type === 'ordering' || question.type === 'matching') {
    return selected.length === question.correct.length && selected.every(Number.isInteger)
  }
  return selected.length > 0
}

export function examMinutes(questionCount, examMinutesPerQuestion) {
  return Math.ceil(questionCount * examMinutesPerQuestion)
}

export function shuffle(array) {
  const out = [...array]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function shuffledIndices(length) {
  return shuffle(Array.from({ length }, (_, index) => index))
}

export function buildOptionOrders(questions) {
  return Object.fromEntries(questions.map((question) => [question.id, shuffledIndices(question.options.length)]))
}

export function applyOptionOrder(question, order) {
  if (!question || !Array.isArray(order) || order.length !== question.options.length) return question
  const displayedIndexFor = new Map(order.map((originalIndex, displayedIndex) => [originalIndex, displayedIndex]))
  return {
    ...question,
    options: order.map((originalIndex) => question.options[originalIndex]),
    optionExplanations: order.map((originalIndex) => question.optionExplanations[originalIndex]),
    correct:
      question.type === 'ordering'
        ? question.correct.map((originalIndex) => displayedIndexFor.get(originalIndex))
        : question.type === 'matching'
          ? question.correct.map((originalIndex) => displayedIndexFor.get(originalIndex))
          : question.correct.map((originalIndex) => displayedIndexFor.get(originalIndex)).sort((a, b) => a - b),
  }
}

export function questionsForSet(allQuestions, setNumber) {
  return allQuestions.filter((question) => question.set === setNumber)
}

export function buildFullMock(allQuestions, setNumber, unscoredCount = 0) {
  const scored = questionsForSet(allQuestions, setNumber)
  const reserve = allQuestions.filter((question) => question.set !== setNumber)
  const unscored = shuffle(reserve).slice(0, unscoredCount)
  const questions = shuffle([...scored, ...unscored])
  return {
    questions,
    unscoredIds: unscored.map((question) => question.id),
  }
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

export function percent(correct, attempted) {
  if (!attempted) return 0
  return Math.round((correct / attempted) * 100)
}
