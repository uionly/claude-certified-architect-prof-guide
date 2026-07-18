// Exports the question bank as 3 stratified practice-set CSVs for a
// dependent bulk-upload system, matching PracticeTestBulkQuestionUploadTemplate_v2.csv.
// Usage: node scripts/export-practice-sets.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const blueprint = JSON.parse(readFileSync(join(root, 'src/data/blueprint.json'), 'utf8'));

const HEADER = [
  'Question',
  'Question Type',
  'Answer Option 1',
  'Explanation 1',
  'Answer Option 2',
  'Explanation 2',
  'Answer Option 3',
  'Explanation 3',
  'Answer Option 4',
  'Explanation 4',
  'Answer Option 5',
  'Explanation 5',
  'Answer Option 6',
  'Explanation 6',
  'Correct Answers',
  'Overall Explanation',
  'Domain',
];

const TYPE_MAP = { single: 'multiple-choice', multi: 'multi-select' };

function csvField(value) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toRow(q) {
  const options = [0, 1, 2, 3, 4, 5].map((i) => q.options[i] ?? '');
  const explanations = [0, 1, 2, 3, 4, 5].map((i) => q.optionExplanations[i] ?? '');
  const correctAnswers = q.correct.map((i) => i + 1).join(',');
  return [
    q.question,
    TYPE_MAP[q.type],
    options[0], explanations[0],
    options[1], explanations[1],
    options[2], explanations[2],
    options[3], explanations[3],
    options[4], explanations[4],
    options[5], explanations[5],
    correctAnswers,
    q.overallExplanation,
    q.domain,
  ].map(csvField).join(',');
}

// 3 empty buckets to accumulate each domain's stratified slice into.
const sets = [[], [], []];

for (const domain of blueprint.domains) {
  const qPath = join(root, `src/data/questions/domain-${domain.id}.json`);
  const questions = JSON.parse(readFileSync(qPath, 'utf8'));
  questions.forEach((q, i) => {
    sets[i % 3].push(q);
  });
}

const exportsDir = join(root, 'exports');
mkdirSync(exportsDir, { recursive: true });

sets.forEach((questions, i) => {
  const csv = [HEADER.join(','), ...questions.map(toRow)].join('\n') + '\n';
  const outPath = join(exportsDir, `PracticeSet${i + 1}.csv`);
  writeFileSync(outPath, csv, 'utf8');
  console.log(`Wrote ${outPath} (${questions.length} questions)`);
});
