function keys(certCode) {
  return {
    attempts: `cert.${certCode}.attempts.v1`,
    active: `cert.${certCode}.active.v1`,
  }
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

// One-time, non-destructive migration of the pre-multi-cert storage keys
// (used only by CCAR-P, the original single-cert version of this app) into
// the new cert-scoped keys. Legacy keys are left in place as cheap insurance.
export function migrateLegacyStorage() {
  const legacyAttempts = localStorage.getItem('ccarp.attempts.v1')
  const legacyActive = localStorage.getItem('ccarp.active.v1')
  const { attempts, active } = keys('CCAR-P')
  if (legacyAttempts && !localStorage.getItem(attempts)) {
    localStorage.setItem(attempts, legacyAttempts)
  }
  if (legacyActive && !localStorage.getItem(active)) {
    localStorage.setItem(active, legacyActive)
  }
}

export function loadAttempts(certCode) {
  const attempts = read(keys(certCode).attempts, [])
  return Array.isArray(attempts) ? attempts : []
}

export function getAttempt(certCode, id) {
  return loadAttempts(certCode).find((a) => a.id === id) || null
}

export function saveAttempt(certCode, attempt) {
  const attempts = loadAttempts(certCode)
  attempts.push(attempt)
  localStorage.setItem(keys(certCode).attempts, JSON.stringify(attempts))
}

export function loadActiveQuiz(certCode) {
  return read(keys(certCode).active, null)
}

export function saveActiveQuiz(certCode, state) {
  localStorage.setItem(keys(certCode).active, JSON.stringify(state))
}

export function clearActiveQuiz(certCode) {
  localStorage.removeItem(keys(certCode).active)
}

export function clearAllProgress(certCode) {
  const { attempts, active } = keys(certCode)
  localStorage.removeItem(attempts)
  localStorage.removeItem(active)
}

// Aggregates every answered item across all attempts, keyed by objective tag.
// Returns { [objective]: { attempted, correct } }.
export function objectiveStats(certCode, attempts = loadAttempts(certCode)) {
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
export function domainStats(certCode, attempts = loadAttempts(certCode)) {
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

export function overallStats(certCode, attempts = loadAttempts(certCode)) {
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
