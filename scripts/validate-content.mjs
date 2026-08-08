// Validates question bank + study guide + revision content against each cert's blueprint.
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
  const globalIds = new Set();
  const normalizedStems = new Set();
  const seenQuestionTypes = new Set();
  const storedSinglePositions = [];
  const storedMultiPatterns = [];
  let uniqueLongestCorrect = 0;
  let singleQuestionCount = 0;

  // ---- cert metadata ----
  const cert = blueprint.cert ?? {};
  const oneExamQuestions = blueprint.domains.reduce((n, d) => n + d.questionCount, 0);
  if (typeof cert.name !== 'string' || !cert.name) errors.push('cert.name missing');
  if (cert.code !== certCode) errors.push(`cert.code "${cert.code}" must match directory name "${certCode}"`);
  if (typeof cert.level !== 'string' || !cert.level) errors.push('cert.level missing (e.g. "Associate")');
  if (typeof cert.audience !== 'string' || !cert.audience) errors.push('cert.audience missing');
  // The exam vendor ("Anthropic", "Microsoft", ...). The landing page groups certs by it,
  // so a cert without one would be dropped from a vendor section.
  if (typeof cert.vendor !== 'string' || !cert.vendor)
    errors.push('cert.vendor missing (e.g. "Anthropic", "Microsoft")');
  if (!(typeof cert.examMinutesPerQuestion === 'number' && cert.examMinutesPerQuestion > 0))
    errors.push('cert.examMinutesPerQuestion must be a positive number');
  // cert.content declares which content trees this cert ships. Absent means all of them;
  // { study: false } means the cert is practice-only by design, which is how the validator
  // tells that apart from "the study guide hasn't been written yet".
  if ('content' in cert) {
    if (typeof cert.content !== 'object' || cert.content === null || Array.isArray(cert.content))
      errors.push('cert.content must be an object like { "study": false, "revision": false }');
    else
      for (const [key, value] of Object.entries(cert.content)) {
        if (key !== 'study' && key !== 'revision') errors.push(`cert.content.${key} unknown — only "study" and "revision" are supported`);
        else if (typeof value !== 'boolean') errors.push(`cert.content.${key} must be a boolean`);
      }
  }
  const wantStudy = cert.content?.study !== false;
  const wantRevision = cert.content?.revision !== false;
  // Nullable exam facts: each must be present as a key so it's clear the value
  // is unknown rather than forgotten. Sourced from the official exam guide.
  for (const key of [
    'examQuestions',
    'examTimeMinutes',
    'passingScore',
    'format',
    'examFee',
    'validityMonths',
    'registrationUrl',
  ]) {
    if (!(key in cert)) errors.push(`cert.${key} missing — use null if the official value isn't known yet`);
  }
  if (cert.registrationUrl != null && !/^https:\/\//.test(cert.registrationUrl))
    errors.push('cert.registrationUrl must be an https URL or null');
  // Guard against a percentage creeping in: the passing score is a scaled score
  // on a 100-1,000 scale, and vendors don't publish the raw-to-scaled map, so
  // rendering it as "72%" would be wrong.
  if (typeof cert.passingScore === 'string' && /^\s*\d{1,2}\s*%\s*$/.test(cert.passingScore))
    errors.push(`cert.passingScore "${cert.passingScore}" looks like a percentage; the official score is scaled (e.g. "720 / 1000 (scaled)")`);
  if (cert.examQuestions !== null && cert.examQuestions !== undefined && typeof cert.examQuestions !== 'number')
    errors.push('cert.examQuestions must be a number or null');
  if (cert.questionsPerSet !== null && cert.questionsPerSet !== undefined && typeof cert.questionsPerSet !== 'number')
    errors.push('cert.questionsPerSet must be a number or null');
  // When practiceSets is declared, the per-domain counts describe ONE set and the
  // bank is that × practiceSets — so the counts must add up to the declared set
  // length. This is what stops bank size being mistaken for set size.
  //
  // The set length is normally the official exam length (examQuestions). A cert can
  // explicitly use questionsPerSet when its practice sets intentionally model only
  // scored content (for example, an exam that also contains unscored items) or when
  // the vendor does not publish an item count.
  //
  // Certs WITHOUT practiceSets (legacy banks like CCAR-P) use per-domain counts to
  // describe the whole bank, so no such equality holds and examQuestions is simply
  // the independently-sourced official figure.
  if (blueprint.cert.practiceSets) {
    const setSize = cert.questionsPerSet ?? cert.examQuestions;
    if (setSize == null)
      errors.push('cert.practiceSets is set, so one of cert.examQuestions / cert.questionsPerSet must give the per-set question count');
    else if (typeof setSize === 'number' && setSize !== oneExamQuestions)
      errors.push(
        `per-set question count (${setSize}, from cert.${cert.questionsPerSet != null ? 'questionsPerSet' : 'examQuestions'}) must equal the sum of per-domain questionCount (${oneExamQuestions}); the bank holds ${oneExamQuestions * sets} (× ${sets} practiceSets)`,
      );
  }

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
      if (globalIds.has(q.id)) errors.push(`${tag}: id duplicates a question in another domain`);
      globalIds.add(q.id);
      if (q.id < domain.idStart || q.id >= domain.idStart + 100)
        errors.push(`${tag}: id outside range ${domain.idStart}-${domain.idStart + 99}`);
      if (q.domain !== domain.title) errors.push(`${tag}: domain must be "${domain.title}"`);
      if (!validObjectives.has(q.objective)) errors.push(`${tag}: objective not in blueprint: "${q.objective}"`);
      perObjective[q.objective] = (perObjective[q.objective] || 0) + 1;
      const supportedTypes = new Set(['single', 'multi', 'ordering', 'matching']);
      if (!supportedTypes.has(q.type)) errors.push(`${tag}: unsupported question type "${q.type}"`);
      seenQuestionTypes.add(q.type);
      if (typeof q.question !== 'string' || q.question.length < 120)
        errors.push(`${tag}: question stem missing or too short for a scenario (<120 chars)`);
      const normalizedStem = typeof q.question === 'string' ? q.question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() : '';
      if (normalizedStems.has(normalizedStem)) errors.push(`${tag}: duplicate normalized question stem`);
      normalizedStems.add(normalizedStem);
      if (!Array.isArray(q.options)) errors.push(`${tag}: options must be an array`);
      else {
        if (q.type === 'single' && q.options.length !== 4) errors.push(`${tag}: single questions must have exactly 4 options`);
        if (q.type === 'multi' && q.options.length < (cert.multipleResponseOptionsMin ?? 4))
          errors.push(`${tag}: multi questions must have at least ${cert.multipleResponseOptionsMin ?? 4} options`);
        if (q.type === 'ordering' && (q.options.length < 3 || q.options.length > 5))
          errors.push(`${tag}: ordering questions must have 3-5 responses`);
        if (q.type === 'matching' && (q.options.length < 3 || q.options.length > 7))
          errors.push(`${tag}: matching questions must have 3-7 responses`);
      }
      if (q.type === 'matching' && (!Array.isArray(q.prompts) || q.prompts.length < 3 || q.prompts.length > 7))
        errors.push(`${tag}: matching questions must have 3-7 prompts`);
      if (!Array.isArray(q.correct) || q.correct.length < 1) errors.push(`${tag}: correct must be a non-empty array`);
      else {
        if (q.type === 'single' && q.correct.length !== 1) errors.push(`${tag}: single type must have exactly 1 correct index`);
        if (q.type === 'multi' && q.correct.length < 2) errors.push(`${tag}: multi type must have >=2 correct indices`);
        if (q.type === 'ordering' && (q.correct.length < 2 || q.correct.length > (q.options?.length ?? 0)))
          errors.push(`${tag}: ordering correct answer must contain 2-${q.options?.length ?? 0} responses`);
        if (q.type === 'matching' && q.correct.length !== q.prompts?.length)
          errors.push(`${tag}: matching correct answer must contain one response for every prompt`);
        if ((q.type === 'ordering' || q.type === 'matching') && new Set(q.correct).size !== q.correct.length)
          errors.push(`${tag}: structured correct answers must not repeat response indices`);
        for (const c of q.correct) if (!Number.isInteger(c) || c < 0 || c >= (q.options?.length ?? 0)) errors.push(`${tag}: correct index ${c} out of range`);
      }
      if (!Array.isArray(q.optionExplanations) || q.optionExplanations.length !== q.options?.length)
        errors.push(`${tag}: optionExplanations must match the option count`);
      else q.optionExplanations.forEach((ex, j) => {
        if (typeof ex !== 'string' || ex.length < 80) errors.push(`${tag}: optionExplanations[${j}] too short (<80 chars)`);
      });
      if (typeof q.principle !== 'string' || !q.principle) errors.push(`${tag}: missing principle`);
      if (typeof q.relatedConcept !== 'string' || !q.relatedConcept) errors.push(`${tag}: missing relatedConcept`);
      if (typeof q.overallExplanation !== 'string' || q.overallExplanation.length < 40)
        errors.push(`${tag}: missing/too short overallExplanation`);
      const all = JSON.stringify(q);
      if (PLACEHOLDER.test(all)) errors.push(`${tag}: contains placeholder text (TODO/TBD/...)`);

      if (cert.explicitSets) {
        if (!Number.isInteger(q.set) || q.set < 1 || q.set > sets)
          errors.push(`${tag}: set must be an integer from 1 to ${sets}`);
        if (/confuses a related|addresses a related concern but misses|The decisive production principle/i.test(all))
          errors.push(`${tag}: contains a retired boilerplate explanation`);
      }
      if (q.type === 'single' && q.correct?.length === 1 && Array.isArray(q.options)) {
        singleQuestionCount += 1;
        storedSinglePositions.push(q.correct[0]);
        const lengths = q.options.map((option) => option.trim().split(/\s+/).length);
        const longest = Math.max(...lengths);
        if (lengths[q.correct[0]] === longest && lengths.filter((length) => length === longest).length === 1)
          uniqueLongestCorrect += 1;
      }
      if (q.type === 'multi') storedMultiPatterns.push(q.correct.join(','));
    });

    for (const o of domain.objectives) {
      const n = perObjective[o.objective] || 0;
      if (n !== o.questions * sets)
        errors.push(`D${domain.id}: objective "${o.objective}" expected ${o.questions * sets} questions (${o.questions} per set × ${sets}), found ${n}`);
    }

    if (cert.explicitSets) {
      for (let setNumber = 1; setNumber <= sets; setNumber += 1) {
        const setQuestions = questions.filter((question) => question.set === setNumber);
        if (setQuestions.length !== domain.questionCount)
          errors.push(`D${domain.id} set ${setNumber}: expected ${domain.questionCount} questions, found ${setQuestions.length}`);
        for (const objective of domain.objectives) {
          const count = setQuestions.filter((question) => question.objective === objective.objective).length;
          if (count !== objective.questions)
            errors.push(`D${domain.id} set ${setNumber}: objective "${objective.objective}" expected ${objective.questions}, found ${count}`);
        }
      }
    }

    // ---- study guide ----
    // Practice-only certs (cert.content.study === false) ship no study guide. The file must
    // then actually be absent, so a half-written tree can't sit in the repo unvalidated.
    const sPath = join(certDir, `study/domain-${domain.id}.json`);
    if (!wantStudy && existsSync(sPath))
      errors.push(`D${domain.id}: cert.content.study is false but ${sPath} exists — delete it or turn the flag on`);
    if (wantStudy) validateStudy();

    function validateStudy() {
      if (!existsSync(sPath)) { errors.push(`D${domain.id}: missing ${sPath}`); return; }
      let study;
      try {
        study = JSON.parse(readFileSync(sPath, 'utf8'));
      } catch (e) { errors.push(`D${domain.id}: invalid JSON in study file: ${e.message}`); return; }

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

    // ---- revision ----
    // A domain with questions + a study guide must also have a revision pass:
    // one recap + exactly one high-yield question per blueprint objective.
    const rPath = join(certDir, `revision/domain-${domain.id}.json`);
    if (!wantRevision && existsSync(rPath))
      errors.push(`D${domain.id}: cert.content.revision is false but ${rPath} exists — delete it or turn the flag on`);
    if (!wantRevision) continue;
    if (!existsSync(rPath)) { errors.push(`D${domain.id}: missing ${rPath}`); continue; }
    let revision;
    try {
      revision = JSON.parse(readFileSync(rPath, 'utf8'));
    } catch (e) { errors.push(`D${domain.id}: invalid JSON in revision file: ${e.message}`); continue; }

    if (revision.domain !== domain.id) errors.push(`D${domain.id}: revision.domain must be ${domain.id}`);
    if (revision.title !== domain.title) errors.push(`D${domain.id}: revision.title must be "${domain.title}"`);
    if (!Array.isArray(revision.objectives) || revision.objectives.length !== domain.objectives.length)
      errors.push(`D${domain.id}: revision must have ${domain.objectives.length} objective entries`);
    else revision.objectives.forEach((r, i) => {
      const tag = `D${domain.id} revision[${i}]`;
      const expected = domain.objectives[i].objective;
      if (r.objective !== expected) errors.push(`${tag}: objective must be exactly "${expected}"`);
      if (!Array.isArray(r.keyPoints) || r.keyPoints.length < 3 || r.keyPoints.length > 5)
        errors.push(`${tag}: need 3-5 keyPoints`);
      else r.keyPoints.forEach((p, j) => {
        if (typeof p !== 'string' || p.trim().length < 20) errors.push(`${tag}: keyPoints[${j}] missing or too short (<20 chars)`);
      });
      if (typeof r.watchFor !== 'string' || r.watchFor.trim().length < 40) errors.push(`${tag}: watchFor missing or too short (<40 chars)`);

      const q = r.question;
      if (!q || typeof q !== 'object') { errors.push(`${tag}: missing question`); return; }
      if (q.type !== 'single' && q.type !== 'multi') errors.push(`${tag}: question.type must be "single"|"multi"`);
      if (typeof q.stem !== 'string' || q.stem.length < 60) errors.push(`${tag}: question.stem missing or too short (<60 chars)`);
      if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${tag}: question must have exactly 4 options`);
      else q.options.forEach((opt, j) => {
        if (typeof opt !== 'string' || !opt.trim()) errors.push(`${tag}: options[${j}] must be a non-empty string`);
      });
      if (!Array.isArray(q.correct) || q.correct.length < 1) errors.push(`${tag}: question.correct must be a non-empty array`);
      else {
        if (q.type === 'single' && q.correct.length !== 1) errors.push(`${tag}: single type must have exactly 1 correct index`);
        if (q.type === 'multi' && q.correct.length < 2) errors.push(`${tag}: multi type must have >=2 correct indices`);
        if (q.type === 'multi' && !/\(Choose two\.\)$/.test(q.stem || '')) errors.push(`${tag}: multi stem must end with "(Choose two.)"`);
        for (const c of q.correct) if (!Number.isInteger(c) || c < 0 || c > 3) errors.push(`${tag}: correct index ${c} out of range`);
      }
      if (typeof q.answerWhy !== 'string' || q.answerWhy.length < 80) errors.push(`${tag}: question.answerWhy missing or too short (<80 chars)`);
      if (PLACEHOLDER.test(JSON.stringify(r))) errors.push(`${tag}: contains placeholder text`);
    });
  }

  if (!onlyDomain && Array.isArray(cert.questionTypes)) {
    for (const type of cert.questionTypes) {
      if (!seenQuestionTypes.has(type)) errors.push(`cert.questionTypes requires at least one "${type}" question`);
    }
  }
  if (!onlyDomain && cert.explicitSets && Array.isArray(cert.questionTypesPerSet)) {
    for (let setNumber = 1; setNumber <= sets; setNumber += 1) {
      for (const type of cert.questionTypesPerSet) {
        const found = blueprint.domains.some((domain) => {
          const qPath = join(certDir, `questions/domain-${domain.id}.json`);
          const questions = JSON.parse(readFileSync(qPath, 'utf8'));
          return questions.some((question) => question.set === setNumber && question.type === type);
        });
        if (!found) errors.push(`practice set ${setNumber} must contain at least one "${type}" question`);
      }
    }
  }
  if (!onlyDomain && cert.explicitSets && storedSinglePositions.length >= 20 && new Set(storedSinglePositions).size < 3)
    errors.push('stored single-answer positions must use at least 3 different positions');
  if (!onlyDomain && cert.explicitSets && storedMultiPatterns.length >= 10 && new Set(storedMultiPatterns).size < 3)
    errors.push('stored multi-response answers must use at least 3 different position patterns');
  if (!onlyDomain && cert.explicitSets && singleQuestionCount > 0 && uniqueLongestCorrect / singleQuestionCount > 0.4)
    errors.push(`correct answer is uniquely longest in ${uniqueLongestCorrect}/${singleQuestionCount} single-answer questions (>40%)`);

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
