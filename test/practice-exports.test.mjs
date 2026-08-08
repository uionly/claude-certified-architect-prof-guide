import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') {
        quoted = false
      } else {
        field += character
      }
    } else if (character === '"') {
      quoted = true
    } else if (character === ',') {
      row.push(field)
      field = ''
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }
  if (field || row.length) rows.push([...row, field])
  return rows
}

for (const [certCode, questionsPerSet, expectedTypes] of [
  ['AIF-C01', 50, { 'multiple-choice': 41, 'multi-select': 9 }],
  ['AIP-C01', 65, { 'multiple-choice': 53, 'multi-select': 12 }],
]) {
  test(`${certCode} CSV exports contain only uploader-supported question types`, () => {
    for (let setNumber = 1; setNumber <= 3; setNumber += 1) {
      const path = new URL(`../exports/${certCode}/PracticeSet${setNumber}.csv`, import.meta.url)
      const [header, ...rows] = parseCsv(readFileSync(path, 'utf8'))
      const typeColumn = header.indexOf('Question Type')
      const correctColumn = header.indexOf('Correct Answers')
      assert.notEqual(typeColumn, -1)
      assert.notEqual(correctColumn, -1)
      assert.equal(rows.length, questionsPerSet)
      const typeCounts = { 'multiple-choice': 0, 'multi-select': 0 }
      rows.forEach((row, rowIndex) => {
        assert.equal(row.length, header.length, `${certCode} set ${setNumber}, row ${rowIndex + 2}`)
        assert.ok(['multiple-choice', 'multi-select'].includes(row[typeColumn]), `${certCode} set ${setNumber}, row ${rowIndex + 2}`)
        typeCounts[row[typeColumn]] += 1
        assert.match(row[correctColumn], /^\d(?:,\d)*$/, `${certCode} set ${setNumber}, row ${rowIndex + 2}`)
      })
      assert.deepEqual(typeCounts, expectedTypes)
    }
  })
}
