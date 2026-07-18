const ATTEMPTS_KEY = 'ccarp.attempts.v1'
const ACTIVE_KEY = 'ccarp.active.v1'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function loadAttempts() {
  const attempts = read(ATTEMPTS_KEY, [])
  return Array.isArray(attempts) ? attempts : []
}

export function getAttempt(id) {
  return loadAttempts().find((a) => a.id === id) || null
}

export function saveAttempt(attempt) {
  const attempts = loadAttempts()
  attempts.push(attempt)
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
}

export function loadActiveQuiz() {
  return read(ACTIVE_KEY, null)
}

export function saveActiveQuiz(state) {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(state))
}

export function clearActiveQuiz() {
  localStorage.removeItem(ACTIVE_KEY)
}

export function clearAllProgress() {
  localStorage.removeItem(ATTEMPTS_KEY)
  localStorage.removeItem(ACTIVE_KEY)
}

// Aggregates every answered item across all attempts, keyed by objective tag.
// Returns { [objective]: { attempted, correct } }.
export function objectiveStats(attempts = loadAttempts()) {
  const stats = {}
  for (const attempt of attempts) {
    for (const item of attempt.items) {
      const s = (stats[item.objective] ||= { attempted: 0, correct: 0 })
      s.attempted += 1
      if (item.isCorrect) s.correct += 1
    }
  }
  return stats
}

// Same aggregation keyed by domain title.
export function domainStats(attempts = loadAttempts()) {
  const stats = {}
  for (const attempt of attempts) {
    for (const item of attempt.items) {
      const s = (stats[item.domain] ||= { attempted: 0, correct: 0 })
      s.attempted += 1
      if (item.isCorrect) s.correct += 1
    }
  }
  return stats
}

export function overallStats(attempts = loadAttempts()) {
  let attempted = 0
  let correct = 0
  const seen = new Set()
  for (const attempt of attempts) {
    for (const item of attempt.items) {
      attempted += 1
      if (item.isCorrect) correct += 1
      seen.add(item.qid)
    }
  }
  return { attempted, correct, uniqueQuestions: seen.size, attemptCount: attempts.length }
}
