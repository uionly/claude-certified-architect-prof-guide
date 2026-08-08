import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import test from 'node:test'
import { buildFullMock } from '../src/lib/quiz.js'

const root = new URL('../src/data/certs/', import.meta.url)

for (const certCode of ['AIF-C01', 'AIP-C01']) {
  test(`${certCode} has three explicit blueprint-balanced sets`, () => {
    const certDir = new URL(`${certCode}/`, root)
    const blueprint = JSON.parse(readFileSync(new URL('blueprint.json', certDir), 'utf8'))
    const questionsDir = new URL('questions/', certDir)
    const questions = readdirSync(questionsDir)
      .filter((file) => file.endsWith('.json'))
      .flatMap((file) => JSON.parse(readFileSync(new URL(file, questionsDir), 'utf8')))

    for (let setNumber = 1; setNumber <= blueprint.cert.practiceSets; setNumber += 1) {
      const set = questions.filter((question) => question.set === setNumber)
      assert.equal(set.length, blueprint.cert.questionsPerSet)
      for (const domain of blueprint.domains) {
        const domainQuestions = set.filter((question) => question.domain === domain.title)
        assert.equal(domainQuestions.length, domain.questionCount)
        for (const objective of domain.objectives) {
          assert.equal(domainQuestions.filter((question) => question.objective === objective.objective).length, objective.questions)
        }
      }
      if (certCode === 'AIF-C01') {
        assert.ok(set.some((question) => question.type === 'ordering'))
        assert.ok(set.some((question) => question.type === 'matching'))
      }
    }

    const mock = buildFullMock(questions, 1, blueprint.cert.unscoredQuestions)
    assert.equal(mock.questions.length, blueprint.cert.examQuestions)
    assert.equal(mock.unscoredIds.length, blueprint.cert.unscoredQuestions)
    assert.equal(mock.questions.filter((question) => !mock.unscoredIds.includes(question.id)).length, blueprint.cert.scoredQuestions)
    assert.equal(mock.questions.filter((question) => mock.unscoredIds.includes(question.id)).every((question) => question.set !== 1), true)
  })

  test(`${certCode} has varied stored answer positions and authentic multi-response counts`, () => {
    const questionsDir = new URL(`${certCode}/questions/`, root)
    const questions = readdirSync(questionsDir)
      .filter((file) => file.endsWith('.json'))
      .flatMap((file) => JSON.parse(readFileSync(new URL(file, questionsDir), 'utf8')))
    const singles = questions.filter((question) => question.type === 'single')
    const multis = questions.filter((question) => question.type === 'multi')
    assert.ok(new Set(singles.map((question) => question.correct[0])).size >= 3)
    assert.ok(new Set(multis.map((question) => question.correct.join(','))).size >= 3)
    assert.equal(multis.every((question) => question.options.length >= 5), true)
  })
}
