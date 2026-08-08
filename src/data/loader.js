// Every certification lives under ./certs/<CODE>/{blueprint.json, questions/domain-N.json,
// study/domain-N.json, revision/domain-N.json}.
// Add a new cert directory and it is picked up here automatically — no manual registration needed.
const blueprintModules = import.meta.glob('./certs/*/blueprint.json', { eager: true })

// Question/study/revision content is loaded lazily (one dynamic-import chunk per cert)
// so switching certs only downloads that cert's data.
const questionModules = import.meta.glob('./certs/*/questions/domain-*.json')
const studyModules = import.meta.glob('./certs/*/study/domain-*.json')
const revisionModules = import.meta.glob('./certs/*/revision/domain-*.json')

function codeFromPath(path) {
  return path.match(/^\.\/certs\/([^/]+)\//)[1]
}

// Derived, so the landing page can show sizes without loading any question file.
// The blueprint's per-domain questionCount describes ONE exam; the bank holds
// that distribution × practiceSets.
function bankSize(blueprint) {
  const sets = blueprint.cert.practiceSets ?? 1
  return blueprint.domains.reduce((n, d) => n + d.questionCount, 0) * sets
}

// Real-exam duration. Prefers the official figure from the exam guide; falls
// back to deriving it from the per-question pace for any cert that doesn't
// record one yet. Null when neither is available.
function examMinutes(cert) {
  if (cert.examTimeMinutes) return cert.examTimeMinutes
  if (!cert.examQuestions || !cert.examMinutesPerQuestion) return null
  return Math.round(cert.examQuestions * cert.examMinutesPerQuestion)
}

// Which content trees a cert ships. Practice-only certs declare
// content: { study: false, revision: false } in their blueprint.
// Written as `!== false` so a typo'd flag keeps the content visible and the
// validator is the thing that complains — never the other way round.
// Safe to call with either a certRegistry entry or useCertData().cert: both
// carry the raw blueprint's `content` field.
export const hasStudy = (cert) => cert?.content?.study !== false
export const hasRevision = (cert) => cert?.content?.revision !== false

export const certRegistry = Object.entries(blueprintModules)
  .map(([path, m]) => ({
    ...m.default.cert,
    domainCount: m.default.domains.length,
    bankQuestions: bankSize(m.default),
    examMinutes: examMinutes(m.default.cert),
    _path: path,
  }))
  .sort((a, b) => a.code.localeCompare(b.code))

export const certByCode = Object.fromEntries(certRegistry.map((c) => [c.code, c]))

const blueprintByCode = Object.fromEntries(
  Object.entries(blueprintModules).map(([path, m]) => [codeFromPath(path), m.default]),
)

const certDataCache = new Map()

export async function getCertData(certCode) {
  if (certDataCache.has(certCode)) return certDataCache.get(certCode)

  const blueprint = blueprintByCode[certCode]
  if (!blueprint) return null

  const domains = blueprint.domains

  const qLoaders = Object.entries(questionModules).filter(([path]) => codeFromPath(path) === certCode)
  const sLoaders = Object.entries(studyModules).filter(([path]) => codeFromPath(path) === certCode)
  const rLoaders = Object.entries(revisionModules).filter(([path]) => codeFromPath(path) === certCode)

  const [questionFiles, studyFiles, revisionFiles] = await Promise.all([
    Promise.all(qLoaders.map(([, load]) => load())),
    Promise.all(sLoaders.map(([, load]) => load())),
    Promise.all(rLoaders.map(([, load]) => load())),
  ])

  const allQuestions = questionFiles.flatMap((m) => m.default).sort((a, b) => a.id - b.id)
  const questionsById = new Map(allQuestions.map((q) => [q.id, q]))

  const titleToId = Object.fromEntries(domains.map((d) => [d.title, d.id]))
  const domainByTitle = Object.fromEntries(domains.map((d) => [d.title, d]))
  const domainById = Object.fromEntries(domains.map((d) => [d.id, d]))

  const studyByDomain = {}
  for (const m of studyFiles) studyByDomain[m.default.domain] = m.default

  const revisionByDomain = {}
  for (const m of revisionFiles) revisionByDomain[m.default.domain] = m.default

  const data = {
    cert: blueprint.cert,
    domains,
    allQuestions,
    questionsById,
    domainByTitle,
    domainById,
    domainIdForQuestion: (q) => titleToId[q.domain],
    studyByDomain,
    revisionByDomain,
  }
  certDataCache.set(certCode, data)
  return data
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
