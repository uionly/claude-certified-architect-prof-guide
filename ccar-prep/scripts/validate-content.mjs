// Validates question bank + study guide content against each cert's blueprint.
// Usage: node scripts/validate-content.mjs [certCode] [domainId]
//   no args        -> validate every cert under src/data/certs/
//   certCode        -> validate just that cert
//   certCode domainId -> validate just that cert's one domain
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const certsDir = join(root, 'src/data/certs');

const onlyCert = process.argv[2] || null;
const onlyDomain = process.argv[3] ? Number(process.argv[3]) : null;

const PLACEHOLDER = /\b(TODO|TBD|PLACEHOLDER|FIXME|Lorem ipsum)\b/i;

const certCodes = onlyCert
  ? [onlyCert]
  : readdirSync(certsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

let anyFailed = false;

for (const certCode of certCodes) {
  const certDir = join(certsDir, certCode);
  const blueprintPath = join(certDir, 'blueprint.json');
  if (!existsSync(blueprintPath)) {
    console.error(`FAIL — ${certCode}: missing ${blueprintPath}`);
    anyFailed = true;
    continue;
  }
  const blueprint = JSON.parse(readFileSync(blueprintPath, 'utf8'));
  // practiceSets: how many distinct full-exam-sized sets the bank holds.
  // The blueprint's questionCount / objective counts describe ONE exam; the
  // bank must contain that distribution × practiceSets.
  const sets = blueprint.cert?.practiceSets ?? 1;
  const errors = [];

  for (const domain of blueprint.domains) {
    if (onlyDomain && domain.id !== onlyDomain) continue;

    // ---- questions ----
    const qPath = join(certDir, `questions/domain-${domain.id}.json`);
    if (!existsSync(qPath)) { errors.push(`D${domain.id}: missing ${qPath}`); continue; }
    let questions;
    try {
      questions = JSON.parse(readFileSync(qPath, 'utf8'));
    } catch (e) { errors.push(`D${domain.id}: invalid JSON in questions file: ${e.message}`); continue; }

    if (!Array.isArray(questions)) { errors.push(`D${domain.id}: questions file is not an array`); continue; }
    if (questions.length !== domain.questionCount * sets)
      errors.push(`D${domain.id}: expected ${domain.questionCount * sets} questions (${domain.questionCount} per set × ${sets}), found ${questions.length}`);

    const validObjectives = new Set(domain.objectives.map((o) => o.objective));
    const perObjective = {};
    const seenIds = new Set();

    questions.forEach((q, i) => {
      const tag = `D${domain.id} q[${i}] (id ${q.id})`;
      if (typeof q.id !== 'number') errors.push(`${tag}: id must be a number`);
      if (seenIds.has(q.id)) errors.push(`${tag}: duplicate id`);
      seenIds.add(q.id);
      if (q.id < domain.idStart || q.id >= domain.idStart + 100)
        errors.push(`${tag}: id outside range ${domain.idStart}-${domain.idStart + 99}`);
      if (q.domain !== domain.title) errors.push(`${tag}: domain must be "${domain.title}"`);
      if (!validObjectives.has(q.objective)) errors.push(`${tag}: objective not in blueprint: "${q.objective}"`);
      perObjective[q.objective] = (perObjective[q.objective] || 0) + 1;
      if (q.type !== 'single' && q.type !== 'multi') errors.push(`${tag}: type must be "single"|"multi"`);
      if (typeof q.question !== 'string' || q.question.length < 120)
        errors.push(`${tag}: question stem missing or too short for a scenario (<120 chars)`);
      if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${tag}: must have exactly 4 options`);
      if (!Array.isArray(q.correct) || q.correct.length < 1) errors.push(`${tag}: correct must be a non-empty array`);
      else {
        if (q.type === 'single' && q.correct.length !== 1) errors.push(`${tag}: single type must have exactly 1 correct index`);
        if (q.type === 'multi' && q.correct.length < 2) errors.push(`${tag}: multi type must have >=2 correct indices`);
        for (const c of q.correct) if (!Number.isInteger(c) || c < 0 || c > 3) errors.push(`${tag}: correct index ${c} out of range`);
      }
      if (!Array.isArray(q.optionExplanations) || q.optionExplanations.length !== 4)
        errors.push(`${tag}: must have exactly 4 optionExplanations`);
      else q.optionExplanations.forEach((ex, j) => {
        if (typeof ex !== 'string' || ex.length < 80) errors.push(`${tag}: optionExplanations[${j}] too short (<80 chars)`);
      });
      if (typeof q.principle !== 'string' || !q.principle) errors.push(`${tag}: missing principle`);
      if (typeof q.relatedConcept !== 'string' || !q.relatedConcept) errors.push(`${tag}: missing relatedConcept`);
      if (typeof q.overallExplanation !== 'string' || q.overallExplanation.length < 40)
        errors.push(`${tag}: missing/too short overallExplanation`);
      const all = JSON.stringify(q);
      if (PLACEHOLDER.test(all)) errors.push(`${tag}: contains placeholder text (TODO/TBD/...)`);
    });

    for (const o of domain.objectives) {
      const n = perObjective[o.objective] || 0;
      if (n !== o.questions * sets)
        errors.push(`D${domain.id}: objective "${o.objective}" expected ${o.questions * sets} questions (${o.questions} per set × ${sets}), found ${n}`);
    }

    // ---- study guide ----
    const sPath = join(certDir, `study/domain-${domain.id}.json`);
    if (!existsSync(sPath)) { errors.push(`D${domain.id}: missing ${sPath}`); continue; }
    let study;
    try {
      study = JSON.parse(readFileSync(sPath, 'utf8'));
    } catch (e) { errors.push(`D${domain.id}: invalid JSON in study file: ${e.message}`); continue; }

    if (study.domain !== domain.id) errors.push(`D${domain.id}: study.domain must be ${domain.id}`);
    if (study.title !== domain.title) errors.push(`D${domain.id}: study.title must be "${domain.title}"`);
    if (typeof study.intro !== 'string' || study.intro.length < 100) errors.push(`D${domain.id}: study.intro missing or too short`);
    if (!Array.isArray(study.objectives) || study.objectives.length !== domain.objectives.length)
      errors.push(`D${domain.id}: study must have ${domain.objectives.length} objective sections`);
    else study.objectives.forEach((s, i) => {
      const expected = domain.objectives[i].objective;
      if (s.objective !== expected) errors.push(`D${domain.id} study[${i}]: objective must be exactly "${expected}"`);
      if (typeof s.explanation !== 'string' || s.explanation.length < 400) errors.push(`D${domain.id} study[${i}]: explanation too short (<400 chars)`);
      if (typeof s.whyItMatters !== 'string' || s.whyItMatters.length < 150) errors.push(`D${domain.id} study[${i}]: whyItMatters too short (<150 chars)`);
      if (!Array.isArray(s.examples) || s.examples.length < 1 || s.examples.length > 2) errors.push(`D${domain.id} study[${i}]: need 1-2 examples`);
      else s.examples.forEach((ex, j) => {
        if (!ex.title || typeof ex.body !== 'string' || ex.body.length < 200) errors.push(`D${domain.id} study[${i}] example[${j}]: needs title and body >=200 chars`);
      });
      if (!Array.isArray(s.pitfalls) || s.pitfalls.length < 2) errors.push(`D${domain.id} study[${i}]: need >=2 pitfalls`);
      if (PLACEHOLDER.test(JSON.stringify(s))) errors.push(`D${domain.id} study[${i}]: contains placeholder text`);
    });
  }

  if (errors.length) {
    console.error(`FAIL — ${certCode}: ${errors.length} error(s):`);
    for (const e of errors) console.error('  - ' + e);
    anyFailed = true;
  } else if (blueprint.domains.length === 0) {
    console.log(`OK — ${certCode}: no domains defined yet`);
  } else {
    console.log(`OK — ${certCode}: content valid${onlyDomain ? ` for domain ${onlyDomain}` : ' for all domains'}.`);
  }
}

if (anyFailed) process.exit(1);
