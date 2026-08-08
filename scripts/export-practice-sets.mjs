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
  ordering: 'ordering',
  matching: 'matching',
};

function csvField(value) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toRow(q) {
  const options = [0, 1, 2, 3, 4, 5].map((i) => q.options[i] ?? '');
  const explanations = [0, 1, 2, 3, 4, 5].map((i) => q.optionExplanations[i] ?? '');
  const correctAnswers = q.correct.map((i) => i + 1).join(',');
  const questionText = q.type === 'matching'
    ? `${q.question}\n${q.prompts.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n')}`
    : q.question;
  return [
    questionText,
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
