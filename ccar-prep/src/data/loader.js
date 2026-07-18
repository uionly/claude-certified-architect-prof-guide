import blueprint from './blueprint.json'

// Question and study files are merged at build time; add a new
// questions/domain-N.json or study/domain-N.json and it is picked up here.
const questionModules = import.meta.glob('./questions/domain-*.json', { eager: true })
const studyModules = import.meta.glob('./study/domain-*.json', { eager: true })

export const cert = blueprint.cert
export const domains = blueprint.domains

export const allQuestions = Object.values(questionModules)
  .flatMap((m) => m.default)
  .sort((a, b) => a.id - b.id)

export const questionsById = new Map(allQuestions.map((q) => [q.id, q]))

const titleToId = Object.fromEntries(domains.map((d) => [d.title, d.id]))
export const domainByTitle = Object.fromEntries(domains.map((d) => [d.title, d]))
export const domainById = Object.fromEntries(domains.map((d) => [d.id, d]))

export function domainIdForQuestion(q) {
  return titleToId[q.domain]
}

export const studyByDomain = {}
for (const m of Object.values(studyModules)) {
  studyByDomain[m.default.domain] = m.default
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
