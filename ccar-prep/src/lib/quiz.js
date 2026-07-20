export function sameSet(a, b) {
  if (a.length !== b.length) return false
  const set = new Set(b)
  return a.every((x) => set.has(x))
}

export function isCorrectSelection(question, selected) {
  return sameSet(selected, question.correct)
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
