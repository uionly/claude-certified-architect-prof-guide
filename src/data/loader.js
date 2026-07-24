// Every certification lives under ./certs/<CODE>/{blueprint.json, questions/domain-N.json, study/domain-N.json}.
// Add a new cert directory and it is picked up here automatically — no manual registration needed.
const blueprintModules = import.meta.glob('./certs/*/blueprint.json', { eager: true })

// Question/study content is loaded lazily (one dynamic-import chunk per cert)
// so switching certs only downloads that cert's data.
const questionModules = import.meta.glob('./certs/*/questions/domain-*.json')
const studyModules = import.meta.glob('./certs/*/study/domain-*.json')

function codeFromPath(path) {
  return path.match(/^\.\/certs\/([^/]+)\//)[1]
}

export const certRegistry = Object.entries(blueprintModules)
  .map(([path, m]) => ({ ...m.default.cert, domainCount: m.default.domains.length, _path: path }))
  .sort((a, b) => a.code.localeCompare(b.code))

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

  const [questionFiles, studyFiles] = await Promise.all([
    Promise.all(qLoaders.map(([, load]) => load())),
    Promise.all(sLoaders.map(([, load]) => load())),
  ])

  const allQuestions = questionFiles.flatMap((m) => m.default).sort((a, b) => a.id - b.id)
  const questionsById = new Map(allQuestions.map((q) => [q.id, q]))

  const titleToId = Object.fromEntries(domains.map((d) => [d.title, d.id]))
  const domainByTitle = Object.fromEntries(domains.map((d) => [d.title, d]))
  const domainById = Object.fromEntries(domains.map((d) => [d.id, d]))

  const studyByDomain = {}
  for (const m of studyFiles) studyByDomain[m.default.domain] = m.default

  const data = {
    cert: blueprint.cert,
    domains,
    allQuestions,
    questionsById,
    domainByTitle,
    domainById,
    domainIdForQuestion: (q) => titleToId[q.domain],
    studyByDomain,
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
