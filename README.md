# Claude Cert Prep — Study Guides & Question Banks

A study + practice web app covering multiple Claude certifications. Each certification gets:

- **Study guide** — one page per exam domain, one section per blueprint objective, each ending with a "Practice this objective" deep link into the question bank.
- **Question bank** — reasoning-based scenario questions distributed by domain weight, every question tagged with its exact blueprint objective and linking back to the study section that teaches it.
- **Revision** — the last-mile pass: for every blueprint objective, a short recap (key points + the trap to watch for) and exactly one high-yield question with a reveal-answer toggle. Unscored and unsaved, built to be read straight through the day before the exam.

No backend: React + Vite + Tailwind, all state client-side, attempt history persisted to `localStorage`.

## Supported certifications

| Code | Name | Content |
|---|---|---|
| CCAR-P | Claude Certified Architect – Professional | ✅ complete (200 questions, 7/7 study guides, full revision pass) |
| CCAO-F | Claude Certified Associate – Foundations | ✅ complete (180 questions = 3 × 60-question exams, 7/7 study guides, full revision pass) |
| CCDV-F | Claude Certified Developer – Foundations | ✅ complete (159 questions = 3 × 53-question exams, 8/8 study guides, full revision pass) |
| CCAR-F | Claude Certified Architect – Foundations | ✅ complete (180 questions = 3 × 60-question exams, 5/5 study guides, full revision pass) |

Cert codes are the official Anthropic exam codes. The three Foundations blueprints (domains, weights, objective strings) are transcribed from the official exam guides published on the [Anthropic Partner Academy](https://anthropic-partners.skilljar.com/page/partner-certifications) (v1.0, effective July 2026). Each Foundations bank holds **3 distinct, non-overlapping practice sets**, each the size and domain/objective distribution of the real exam (CCAO-F 60, CCDV-F 53, CCAR-F 60 questions per set).

The landing page (`/`) explains what the app is, how to use it in three steps, and lists every certification with its exam facts — that's the canonical way in. Inside a cert, use the header nav (Overview / Study Guide / Revision / Practice) or the header cert switcher to move around. The per-cert nav is deliberately hidden on the landing page so nobody lands inside a certification they never chose; `/certs` now redirects to the landing page's certification section.

## Setup

```bash
npm install
npm run dev        # dev server
npm run build      # production build → dist/
npm run preview    # serve the production build
npm run validate   # validate all certs' question/study/revision content against their blueprints
```

## Deploy (Vercel)

The app lives at the repository root (Vite + React). `vercel.json` rewrites all routes to `index.html` so client-side routing works.

```bash
npm install -g vercel   # if needed
vercel login
vercel                  # preview deploy
vercel --prod           # production deploy
```

Or connect the GitHub repo in the [Vercel dashboard](https://vercel.com/new): no root-directory override needed — framework preset **Vite**, build command `npm run build`, output directory `dist`.

## How it works

- `src/data/certs/<CODE>/blueprint.json` — single source of truth per cert: domains, weights, exact objective strings, per-objective question counts, question id ranges.
- `src/data/certs/<CODE>/questions/domain-N.json` — one array of questions per domain.
- `src/data/certs/<CODE>/study/domain-N.json` — study guide content per domain.
- `src/data/certs/<CODE>/revision/domain-N.json` — revision recaps + one high-yield question per objective, per domain.
- `src/data/loader.js` — `certRegistry` / `certByCode` (cheap, eager — every cert's `blueprint.json` plus derived `bankQuestions`, `examMinutes` and `domainCount`, used by the landing page and switcher) and `getCertData(certCode)` (async, code-split per cert — merges that cert's blueprint + question files + study files + revision files, discovered via `import.meta.glob`). Add a new cert directory under `src/data/certs/` and it's picked up automatically — no manual registration needed, beyond adding it to the switcher's data (also automatic, since the switcher reads `certRegistry`).
- URL scheme: `/<certCode>/...` (e.g. `/CCAR-P/study`, `/CCAR-P/revision/3`, `/CCAR-P/quiz`). `/` redirects to the last-used cert (or CCAR-P by default). Pre-existing un-prefixed bookmarks (`/study`, `/revision`, `/practice`, `/quiz`, `/results/:id`) redirect the same way.
- Progress storage is cert-scoped (`cert.<CODE>.attempts.v1` / `cert.<CODE>.active.v1` in `localStorage`); a one-time migration preserves history from the original single-cert version of this app (which used unscoped `ccarp.*` keys) into `cert.CCAR-P.*`.
- `scripts/validate-content.mjs` — checks every cert's content files against its blueprint (counts per objective, schema fields, exact objective strings, explanation lengths, no placeholder text). Run it after any content change.

### Revision

Routes: `/<certCode>/revision` (domain index) and `/<certCode>/revision/:domainId` (one card per objective). Nav sits between Study Guide and Practice.

Each card shows the objective's key points, a "Watch for" callout, and one question with a **Reveal answer** button. Reveal is local React state only — revision never writes an attempt, never touches `localStorage`, and its questions are separate from the practice bank (no shared ids, and they are not drawn into quizzes).

### Modes

- **Learn mode** — untimed; full reasoning shown immediately after every answer, right or wrong. The feedback panel shows your answer + its explanation, the correct answer + its explanation, the principle tag, the related concept, and a "go deeper" toggle with all four option explanations.
- **Exam mode** — timed at the cert's minutes-per-question rate; feedback withheld until submission, then full per-question review.

Performance is tracked **per objective tag** (not just per domain) across all attempts, and surfaced on the results screen, the study guide domain pages, and each objective section.

## Blueprint schema

`src/data/certs/<CODE>/blueprint.json`:

```json
{
  "cert": {
    "name": "...", "code": "...",
    "level": "Associate", "audience": "who this exam is for",
    "examQuestions": 60, "examTimeMinutes": 120, "examMinutesPerQuestion": 2.0,
    "passingScore": "720 / 1000 (scaled)",
    "format": "Multiple choice & multiple response · online proctored or test center",
    "examFee": "$99 USD", "validityMonths": 12,
    "registrationUrl": "https://anthropic-partners.skilljar.com/...",
    "practiceSets": 3
  },
  "domains": [
    {
      "id": 1,
      "title": "...",
      "weight": 17,
      "questionCount": 34,
      "idStart": 101,
      "objectives": [{ "objective": "...", "questions": 6 }]
    }
  ]
}
```

`idStart` for domain N should be `N*100 + 1` so question ids don't collide across domains (domain 3 → ids 301-399). Weights must sum to 100; `questionCount`s must sum to `examQuestions` (when it's known); each domain's objectives' `questions` counts must sum to that domain's `questionCount`.

**Exam facts** (`level`, `audience`, `examQuestions`, `examTimeMinutes`, `passingScore`, `format`, `examFee`, `validityMonths`, `registrationUrl`) drive the "About this exam" panel on the cert overview and the fact rows on the landing page. The nullable ones must be **present as keys** — use `null` when the official value isn't known yet, and the UI omits that fact instead of inventing one.

All four certs' facts are transcribed from Anthropic's official exam guide PDFs (Version 1.0, effective July 2026), linked from <https://anthropic-partners.skilljar.com/page/partner-certifications> and cross-checked against <https://anthropic-partners.skilljar.com/page/faq-certifications>:

| | CCAO-F | CCDV-F | CCAR-F | CCAR-P |
|---|---|---|---|---|
| Items | 60 | 53 | 60 | 63 |
| Time limit | 120 min | 120 min | 120 min | 120 min |
| Passing score | 720 / 1000 scaled | ← | ← | ← |
| Fee | $99 | $125 | $125 | $175 |
| Validity | 12 months | ← | ← | ← |

Two cautions. **The passing score is a scaled score on a 100–1,000 scale, not a percentage** — Anthropic doesn't publish the raw-to-scaled conversion, so rendering it as "72%" would be wrong; the validator rejects a bare percentage in `passingScore`. And the guides say "subject to change without notice", so re-check periodically.

Validation rules: when `practiceSets` is declared, `examQuestions` must equal the sum of per-domain `questionCount` (which describes one exam), so bank size can never be mistaken for exam size. Certs *without* `practiceSets` (legacy banks like CCAR-P, whose per-domain counts describe the whole 283-question bank) carry `examQuestions` as an independently-sourced figure and skip that check. `examTimeMinutes` is the official figure; if a cert lacks one, the UI falls back to `examQuestions × examMinutesPerQuestion`.

`examQuestions`, `questionCount`, and per-objective `questions` always describe **one real exam** (transcribed from the official guide). The optional `practiceSets` (default 1) says how many distinct full exams the bank holds: the validator requires each objective to have `questions × practiceSets` items in its `domain-N.json`, and `scripts/export-practice-sets.mjs` splits the bank per objective (round-robin by id) into `practiceSets` non-overlapping CSVs, each matching the official exam's exact size and distribution.

`npm run export:csv [certCode] [--force]`. The exporter **skips any cert that has more `PracticeSet*.csv` files on disk than it generates**, because those extra files were added by hand and rewriting sets 1..n would pull their questions into the earlier sets while the extra file still holds them — silently duplicating questions across published tests. This currently applies to **CCAR-P**: sets 1–3 hold its original 200 questions and a hand-added set 4 holds the 83 added later (verified zero overlap, 283 total). Since 283 is prime it can't be partitioned into equal exam-sized sets, so decide the intended partition before running with `--force`.

## Question schema

`src/data/certs/<CODE>/questions/domain-N.json` — one array per file:

```json
{
  "id": 301,
  "domain": "Integration",
  "objective": "Analyze authentication and authorization requirements to identify security gaps",
  "type": "single",
  "question": "scenario stem…",
  "options": ["…", "…", "…", "…"],
  "correct": [1],
  "optionExplanations": ["…", "…", "…", "…"],
  "principle": "the model is never the authorization boundary",
  "relatedConcept": "one-liner connecting to the domain theme",
  "overallExplanation": "summary of the principle + relatedConcept, shown on the feedback panel"
}
```

- `id`: unique; domain N uses the range `N*100 + 1` … (e.g. Domain 3 → 301+).
- `objective` / `domain`: must match that cert's `blueprint.json` **character-for-character** — this is what powers study-guide cross-linking and per-objective stats.
- `type`: `"single"` (1 correct index) or `"multi"` (≥2 correct indices; stem ends with "(Choose two.)").
- `correct`: 0-based indices into `options`.

## Revision schema

`src/data/certs/<CODE>/revision/domain-N.json` — one file per domain, one entry per blueprint objective in blueprint order:

```json
{
  "domain": 3,
  "title": "Integration",
  "objectives": [
    {
      "objective": "Analyze authentication and authorization requirements to identify security gaps",
      "keyPoints": ["3–5 short, exam-precise bullets (≈1 line each)"],
      "watchFor": "One sentence: the common trap, or what the exam is really testing.",
      "question": {
        "type": "single",
        "stem": "Short scenario — tighter than a practice-bank stem",
        "options": ["…", "…", "…", "…"],
        "correct": [1],
        "answerWhy": "2–3 sentences: why the correct option is right and why the tempting wrong one fails."
      }
    }
  ]
}
```

- `domain` / `title` / `objective`: must match `blueprint.json` **character-for-character**, same objective order.
- Exactly **one** question per objective. Prefer `"single"`; use `"multi"` only where the objective genuinely tests a choose-two skill (stem then ends with "(Choose two.)").
- Revision questions are new items — do **not** reuse practice-bank ids or add them under `questions/`.
- `keyPoints` are distilled from that domain's `study/domain-N.json` (`explanation` / `whyItMatters` / `pitfalls`). Precision over length; the study guide already carries the depth.
- The validator requires a revision file for every domain that has questions + a study guide.

## Content-generation guidelines

Follow these when adding questions for any cert so new items match the existing depth (the validator enforces the mechanical parts):

1. **Scenario-based stem** — a realistic situation with a decision to make, not trivia. A named role at a company in a specific industry faces a concrete choice. Vary industries (fintech, healthcare, retail, public sector, SaaS) and difficulty (straightforward application vs. multi-factor trade-off judgment) within each objective.
2. **4 options, all plausible** — each option should be pickable by a competent-but-imperfect practitioner. No joke options, no "all of the above", and the correct option must not be recognizably longer or more detailed than the others.
3. **Per-option explanations (2–4 sentences each)** — for the correct option, name the underlying principle; for each wrong option, explain why it's tempting **and** the specific reasoning error (wrong trade-off, treats symptom not cause, violates a named principle, over-engineering, …).
4. **`principle` tag** — short phrase capturing the rule, e.g. `"least privilege > detective controls"`.
5. **`objective` tag** — the exact blueprint bullet (copy it from that cert's `blueprint.json`).
6. **`relatedConcept`** — one line connecting the question to the broader domain theme.
7. **Distribute evenly** — roughly 5–6 questions per objective bullet so every objective gets meaningful coverage.
8. **No stubs** — never commit TODO/placeholder text; the validator rejects it.
9. Ground content in real Claude/Anthropic concepts (model tiers, prompt caching, MCP, Claude Code, the workflow/agent pattern taxonomy) — don't invent product features or topics outside the blueprint, and match technical depth to the cert's level (Foundations-level certs should be more conceptual than CCAR-P's Professional-level architecture scenarios).

Study guide sections follow the same spirit: plain-language explanation, why it matters in production, 1–2 worked examples, 3–5 pitfalls, documentation tone (no marketing copy). Schema is in any `src/data/certs/<CODE>/study/domain-N.json`.

After adding content: `npm run validate` (or `node scripts/validate-content.mjs <certCode> [domainId]` to check one cert, optionally one domain).

## Content progress

### CCAR-P — Claude Certified Architect – Professional

| Domain | Weight | Questions | Study guide | Revision |
|---|---|---|---|---|
| 1. Solution Design & Architecture | 17% | ✅ 34/34 | ✅ done | ✅ done |
| 2. Claude Models, Prompting & Context Engineering | 13% | ✅ 26/26 | ✅ done | ✅ done |
| 3. Integration | 19% | ✅ 38/38 | ✅ done | ✅ done |
| 4. Evaluation, Testing & Optimization | 16% | ✅ 32/32 | ✅ done | ✅ done |
| 5. Governance, Safety & Risk Management | 14% | ✅ 28/28 | ✅ done | ✅ done |
| 6. Stakeholder Communication & Lifecycle Management | 14% | ✅ 28/28 | ✅ done | ✅ done |
| 7. Developer Productivity & Operational Enablement | 7% | ✅ 14/14 | ✅ done | ✅ done |
| **Total** | 100% | **200/200** | **7/7** | **7/7** |

### CCAO-F — Claude Certified Associate – Foundations

3 practice sets × 60 questions (bank = 180). Per-domain bank counts (each set gets ⅓):

| Domain | Weight | Questions | Study guide | Revision |
|---|---|---|---|---|
| 1. Prompting and Task Execution | 14% | ✅ 24/24 | ✅ done | ✅ done |
| 2. Output Evaluation and Validation | 21% | ✅ 39/39 | ✅ done | ✅ done |
| 3. Product and Model Selection | 12% | ✅ 21/21 | ✅ done | ✅ done |
| 4. Workflow Integration and Solution Design | 16% | ✅ 30/30 | ✅ done | ✅ done |
| 5. Configuration and Knowledge Management | 12% | ✅ 21/21 | ✅ done | ✅ done |
| 6. Governance, Risk, and Responsible Use | 15% | ✅ 27/27 | ✅ done | ✅ done |
| 7. Troubleshooting and Optimization | 10% | ✅ 18/18 | ✅ done | ✅ done |
| **Total** | 100% | **180/180** | **7/7** | **7/7** |

### CCDV-F — Claude Certified Developer – Foundations

3 practice sets × 53 questions (bank = 159). Per-domain bank counts (each set gets ⅓):

| Domain | Weight | Questions | Study guide | Revision |
|---|---|---|---|---|
| 1. Agents and Workflows | 14.7% | ✅ 24/24 | ✅ done | ✅ done |
| 2. Applications and Integration | 33.1% | ✅ 51/51 | ✅ done | ✅ done |
| 3. Claude Code | 3.1% | ✅ 6/6 | ✅ done | ✅ done |
| 4. Eval, Testing, and Debugging | 2.6% | ✅ 3/3 | ✅ done | ✅ done |
| 5. Model Selection and Optimization | 16.8% | ✅ 27/27 | ✅ done | ✅ done |
| 6. Prompt and Context Engineering | 11.0% | ✅ 18/18 | ✅ done | ✅ done |
| 7. Security and Safety | 8.1% | ✅ 12/12 | ✅ done | ✅ done |
| 8. Tools and MCPs | 10.6% | ✅ 18/18 | ✅ done | ✅ done |
| **Total** | 100% | **159/159** | **8/8** | **8/8** |

### CCAR-F — Claude Certified Architect – Foundations

3 practice sets × 60 questions (bank = 180). Per-domain bank counts (each set gets ⅓):

| Domain | Weight | Questions | Study guide | Revision |
|---|---|---|---|---|
| 1. Agentic Architecture & Orchestration | 27% | ✅ 48/48 | ✅ done | ✅ done |
| 2. Tool Design & MCP Integration | 18% | ✅ 33/33 | ✅ done | ✅ done |
| 3. Claude Code Configuration & Workflows | 20% | ✅ 36/36 | ✅ done | ✅ done |
| 4. Prompt Engineering & Structured Output | 20% | ✅ 36/36 | ✅ done | ✅ done |
| 5. Context Management & Reliability | 15% | ✅ 27/27 | ✅ done | ✅ done |
| **Total** | 100% | **180/180** | **5/5** | **5/5** |

App shell: ✅ scaffold · ✅ purpose-first landing page with exam facts · ✅ multi-cert switcher · ✅ navigation & filtering · ✅ learn/exam modes · ✅ feedback panel · ✅ results & review screens · ✅ per-objective tracking · ✅ study↔practice cross-links · ✅ revision pass
