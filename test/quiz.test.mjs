import assert from 'node:assert/strict'
import test from 'node:test'
import { applyOptionOrder, buildFullMock, isAnswered, isCorrectSelection } from '../src/lib/quiz.js'

test('option ordering remaps answers and explanations together', () => {
  const question = {
    id: 1,
    type: 'multi',
    options: ['a', 'b', 'c', 'd', 'e'],
    optionExplanations: ['A', 'B', 'C', 'D', 'E'],
    correct: [0, 3],
  }
  const prepared = applyOptionOrder(question, [4, 3, 2, 1, 0])
  assert.deepEqual(prepared.options, ['e', 'd', 'c', 'b', 'a'])
  assert.deepEqual(prepared.optionExplanations, ['E', 'D', 'C', 'B', 'A'])
  assert.deepEqual(prepared.correct, [1, 4])
  assert.equal(isCorrectSelection(prepared, [4, 1]), true)
})

test('ordering and matching require complete position-sensitive answers', () => {
  const ordering = { type: 'ordering', correct: [2, 0, 1] }
  assert.equal(isAnswered(ordering, [2, 0]), false)
  assert.equal(isCorrectSelection(ordering, [2, 0, 1]), true)
  assert.equal(isCorrectSelection(ordering, [0, 2, 1]), false)
  const subsetOrdering = { type: 'ordering', correct: [3, 1] }
  assert.equal(isAnswered(subsetOrdering, [3, 1]), true)
  assert.equal(isCorrectSelection(subsetOrdering, [3, 1]), true)
  assert.equal(isCorrectSelection(subsetOrdering, [3, 1, 0]), false)

  const matching = { type: 'matching', correct: [1, 2, 0] }
  assert.equal(isAnswered(matching, [1, null, 0]), false)
  assert.equal(isCorrectSelection(matching, [1, 2, 0]), true)
  assert.equal(isCorrectSelection(matching, [1, 0, 2]), false)
})

test('response shuffling preserves ordering and matching answer mappings', () => {
  const base = {
    options: ['a', 'b', 'c'],
    optionExplanations: ['A', 'B', 'C'],
  }
  const ordering = applyOptionOrder({ ...base, type: 'ordering', correct: [1, 0, 2] }, [2, 0, 1])
  const matching = applyOptionOrder({ ...base, type: 'matching', correct: [2, 0, 1] }, [2, 0, 1])
  assert.deepEqual(ordering.correct, [2, 1, 0])
  assert.deepEqual(matching.correct, [0, 1, 2])
})

test('full mocks use one scored set and reserve questions from other sets', () => {
  const questions = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    set: Math.floor(index / 4) + 1,
  }))
  const mock = buildFullMock(questions, 2, 3)
  assert.equal(mock.questions.length, 7)
  assert.equal(new Set(mock.questions.map((question) => question.id)).size, 7)
  assert.equal(mock.unscoredIds.length, 3)
  assert.deepEqual(
    mock.questions.filter((question) => !mock.unscoredIds.includes(question.id)).map((question) => question.set),
    [2, 2, 2, 2],
  )
  assert.equal(mock.questions.filter((question) => mock.unscoredIds.includes(question.id)).every((question) => question.set !== 2), true)
})
