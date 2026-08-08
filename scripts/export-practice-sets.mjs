// Exports each cert's question bank as 3 stratified practice-set CSVs for a
// dependent bulk-upload system, matching PracticeTestBulkQuestionUploadTemplate_v2.csv.
// Usage: node scripts/export-practice-sets.mjs [certCode] [--force]
//   no args  -> export every cert under src/data/certs/ (skipping ones with no content yet)
//   certCode -> export just that cert
//   --force  -> also rewrite sets for certs whose existing exports this script
//               can no longer reproduce (see the extra-sets guard below)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const certsDir = join(root, 'src/data/certs');

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyCert = args.find((a) => !a.startsWith('--')) || null;

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

const TYPE_MAP = {
  single: 'multiple-choice',
  multi: 'multi-select',
};

function csvField(value) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function wrongStructuredSequences(question) {
  const correctKey = question.correct.join(',');
  const alternatives = [];
  const seen = new Set([correctKey]);
  const add = (sequence) => {
    const key = sequence.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      alternatives.push(sequence);
    }
  };

  // Include an unused response when the source ordering/matching item has one,
  // so a converted question can still test response selection as well as order.
  const unused = question.options.map((_, index) => index).filter((index) => !question.correct.includes(index));
  for (const unusedIndex of unused) {
    for (let position = 0; position < question.correct.length && alternatives.length < 3; position += 1) {
      const sequence = [...question.correct];
      sequence[position] = unusedIndex;
      add(sequence);
    }
  }

  function permute(prefix, remaining) {
    if (alternatives.length >= 3) return;
    if (remaining.length === 0) {
      add(prefix);
      return;
    }
    for (let index = 0; index < remaining.length; index += 1) {
      permute([...prefix, remaining[index]], [...remaining.slice(0, index), ...remaining.slice(index + 1)]);
      if (alternatives.length >= 3) return;
    }
  }
  permute([], [...question.correct]);
  return alternatives.slice(0, 3);
}

function structuredOption(question, sequence) {
  if (question.type === 'ordering') {
    return sequence.map((optionIndex, position) => `${position + 1}. ${question.options[optionIndex]}`).join(' → ');
  }
  return question.prompts.map((prompt, position) => `${prompt} → ${question.options[sequence[position]]}`).join('; ');
}

function structuredExplanation(question, sequence) {
  const mismatch = sequence.findIndex((optionIndex, position) => optionIndex !== question.correct[position]);
  if (question.type === 'ordering') {
    return `Incorrect. At position ${mismatch + 1}, this sequence uses “${question.options[sequence[mismatch]]}” instead of “${question.options[question.correct[mismatch]]}”. ${question.overallExplanation}`;
  }
  return `Incorrect. This maps “${question.prompts[mismatch]}” to “${question.options[sequence[mismatch]]}” instead of “${question.options[question.correct[mismatch]]}”. ${question.overallExplanation}`;
}

function prepareForCsv(question) {
  if (question.type !== 'ordering' && question.type !== 'matching') return question;

  const correctChoice = {
    option: structuredOption(question, question.correct),
    explanation: `Correct. ${question.overallExplanation}`,
  };
  const choices = wrongStructuredSequences(question).map((sequence) => ({
    option: structuredOption(question, sequence),
    explanation: structuredExplanation(question, sequence),
  }));
  const correctPosition = question.id % 4;
  choices.splice(correctPosition, 0, correctChoice);

  const promptList = question.type === 'matching'
    ? `\n${question.prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')}`
    : '';
  return {
    ...question,
    type: 'single',
    question: `${question.question}${promptList}\nChoose the option that gives the complete correct ${question.type === 'ordering' ? 'sequence' : 'mapping'}.`,
    options: choices.map((choice) => choice.option),
    optionExplanations: choices.map((choice) => choice.explanation),
    correct: [correctPosition],
  };
}

function toRow(sourceQuestion) {
  const question = prepareForCsv(sourceQuestion);
  const options = [0, 1, 2, 3, 4, 5].map((i) => question.options[i] ?? '');
  const explanations = [0, 1, 2, 3, 4, 5].map((i) => question.optionExplanations[i] ?? '');
  const correctAnswers = question.correct.map((i) => i + 1).join(',');
  return [
    question.question,
    TYPE_MAP[question.type],
    options[0], explanations[0],
    options[1], explanations[1],
    options[2], explanations[2],
    options[3], explanations[3],
    options[4], explanations[4],
    options[5], explanations[5],
    correctAnswers,
    question.overallExplanation,
    question.domain,
  ].map(csvField).join(',');
}

const certCodes = onlyCert
  ? [onlyCert]
  : readdirSync(certsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

for (const certCode of certCodes) {
  const certDir = join(certsDir, certCode);
  const blueprint = JSON.parse(readFileSync(join(certDir, 'blueprint.json'), 'utf8'));

  if (blueprint.domains.length === 0) {
    console.log(`skipping ${certCode}: no content yet`);
    continue;
  }

  const setCount = blueprint.cert?.practiceSets ?? null;
  const sets = Array.from({ length: setCount ?? 3 }, () => []);

  for (const domain of blueprint.domains) {
    const qPath = join(certDir, `questions/domain-${domain.id}.json`);
    const questions = JSON.parse(readFileSync(qPath, 'utf8'));
    if (setCount) {
      if (blueprint.cert.explicitSets) {
        for (const question of questions) sets[question.set - 1].push(question);
      } else {
        // Banks without explicit assignments are split per objective so each
        // export preserves the declared blueprint distribution.
        for (const obj of domain.objectives) {
          const qs = questions.filter((q) => q.objective === obj.objective).sort((a, b) => a.id - b.id);
          qs.forEach((q, i) => sets[i % setCount].push(q));
        }
      }
    } else {
      // Legacy split for banks without practiceSets: thirds per domain.
      questions.forEach((q, i) => {
        sets[i % 3].push(q);
      });
    }
  }

  const exportsDir = join(root, 'exports', certCode);

  // Guard: if more sets exist on disk than this script produces, they were added
  // by hand (e.g. a later batch of questions published as an extra practice
  // test). Rewriting sets 1..n would then pull those questions into the earlier
  // sets while the extra file still holds them — silently duplicating questions
  // across published tests. Refuse unless explicitly forced.
  if (!force && existsSync(exportsDir)) {
    const existing = readdirSync(exportsDir).filter((f) => /^PracticeSet\d+\.csv$/.test(f));
    if (existing.length > sets.length) {
      const extra = existing.filter((f) => Number(f.match(/\d+/)[0]) > sets.length);
      console.log(
        `skipping ${certCode}: ${existing.length} set(s) on disk but this script generates ${sets.length}.\n` +
          `  Hand-added: ${extra.join(', ')}. Rewriting sets 1-${sets.length} would duplicate those questions\n` +
          `  across sets. Re-run with --force once you've decided how the sets should be partitioned.`,
      );
      continue;
    }
  }

  mkdirSync(exportsDir, { recursive: true });

  sets.forEach((questions, i) => {
    const csv = [HEADER.join(','), ...questions.map(toRow)].join('\n') + '\n';
    const outPath = join(exportsDir, `PracticeSet${i + 1}.csv`);
    writeFileSync(outPath, csv, 'utf8');
    console.log(`Wrote ${outPath} (${questions.length} questions)`);
  });
}
