# Cert Prep — Study Guides & Question Banks

A study + practice web app covering multiple AI certifications from Anthropic (Claude), Microsoft (Azure AI), and Amazon Web Services. Every certification gets a question bank; the Claude certifications also get a study guide and a revision pass:

- **Question bank** — reasoning-based scenario questions distributed by domain weight, every question tagged with its exact blueprint objective and (where one exists) linking back to the study section that teaches it.
- **Study guide** — one page per exam domain, one section per blueprint objective, each ending with a "Practice this objective" deep link into the question bank.
- **Revision** — the last-mile pass: for every blueprint objective, a short recap (key points + the trap to watch for) and exactly one high-yield question with a reveal-answer toggle. Unscored and unsaved, built to be read straight through the day before the exam.

A cert declares which of these it ships via `cert.content` in its blueprint (see [Blueprint schema](#blueprint-schema)). Practice-only certs hide the Study Guide and Revision nav, and their study/revision routes redirect to Practice.

No backend: React + Vite + Tailwind, all state client-side, attempt history persisted to `localStorage`.

## Supported certifications

### Anthropic — Claude

| Code | Name | Content |
|---|---|---|
| CCAR-P | Claude Certified Architect – Professional | ✅ complete (200 questions, 7/7 study guides, full revision pass) |
| CCAO-F | Claude Certified Associate – Foundations | ✅ complete (180 questions = 3 × 60-question exams, 7/7 study guides, full revision pass) |
| CCDV-F | Claude Certified Developer – Foundations | ✅ complete (159 questions = 3 × 53-question exams, 8/8 study guides, full revision pass) |
| CCAR-F | Claude Certified Architect – Foundations | ✅ complete (180 questions = 3 × 60-question exams, 5/5 study guides, full revision pass) |

Cert codes are the official Anthropic exam codes. The three Foundations blueprints (domains, weights, objective strings) are transcribed from the official exam guides published on the [Anthropic Partner Academy](https://anthropic-partners.skilljar.com/page/partner-certifications) (v1.0, effective July 2026). Each Foundations bank holds **3 distinct, non-overlapping practice sets**, each the size and domain/objective distribution of the real exam (CCAO-F 60, CCDV-F 53, CCAR-F 60 questions per set).

### Microsoft — Azure AI

| Code | Name | Content |
|---|---|---|
| AI-103 | Azure AI Apps and Agents Developer Associate | ✅ practice only (150 questions = 3 × 50-question sets) |
| AI-200 | Azure AI Cloud Developer Associate | ✅ practice only (150 questions = 3 × 50-question sets) |

Blueprints (domains, weights, objective strings) are transcribed from the official Microsoft Learn study guides: [AI-103](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-103) (**skills measured as of April 16, 2026**) and [AI-200](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ai-200) (outline undated; page last updated 2026-05-05). Re-check both before a large content pass — Microsoft publishes two versions of the skills outline around an update.

Three transcription notes:

- **Objectives are the study guide's sub-skill *group headings*, not its individual bullets.** AI-103 has 64 bullets across 5 domains but only 50 questions per set, so several domains couldn't give every bullet an item. The group headings are also pure ASCII, whereas the bullets contain U+2011 non-breaking hyphens (`Event‑driven`, `alt‑text`) that would be fragile in the `?objective=` deep links the app matches character-for-character. The finer-grained bullet topic goes in each question's `principle` instead.
- **AI-200 domain 4 has two official spellings.** "Skills at a glance" and the exam page say `Secure, monitor, troubleshoot Azure solutions`; the study guide's section heading adds "and". We use the former.
- **Level.** Microsoft's "At a glance → Level" says *Intermediate* for both; we record `"Associate"` to match the credential names and the app's existing level vocabulary.

### Amazon Web Services

| Code | Name | Content |
|---|---|---|
| AIF-C01 | AWS Certified AI Practitioner | ✅ practice only (150 questions = 3 × 50 scored-question sets) |
| AIP-C01 | AWS Certified Generative AI Developer - Professional | ✅ practice only (195 questions = 3 × 65 scored-question sets) |

The blueprint is transcribed from the official [AWS Certified AI Practitioner exam guide](https://docs.aws.amazon.com/aws-certification/latest/ai-practitioner-01.html), **version 1.1, published April 30, 2026**. AWS lists 65 questions on the live exam: the guide identifies 50 scored questions and 15 unscored questions. Each practice set models the 50 scored questions and preserves the official 20/24/28/14/14 domain weighting exactly. The bank includes the version 1.1 additions covering agentic AI, context engineering, prompt management, business-alignment metrics, and hallucination grounding.

AIP-C01 is transcribed from the current official [AWS Certified Generative AI Developer - Professional exam guide](https://docs.aws.amazon.com/aws-certification/latest/ai-professional-01.html), checked August 2026. The live exam contains 75 questions: 65 scored and 10 unscored. Each practice set models the 65 scored questions using a 20/17/13/8/7 allocation, the closest integer realization of AWS's published 31/26/20/12/11 domain weighting. AWS does not publish a revision/version label for the current guide, so the blueprint records that field as `null` rather than inventing one.

The landing page (`/`) explains what the app is, how to use it in three steps, and lists every certification grouped by vendor with its exam facts — that's the canonical way in. Inside a cert, use the header nav (Overview / Study Guide / Revision / Practice, minus whatever that cert doesn't ship) or the header cert switcher to move around. The per-cert nav is deliberately hidden on the landing page so nobody lands inside a certification they never chose; `/certs` now redirects to the landing page's certification section.

Adding another certification: [docs/adding-a-certification.md](docs/adding-a-certification.md) lists the exams worth adding next and carries the fill-in prompt that builds one end to end.

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
    "name": "...", "code": "...", "vendor": "Anthropic",
    "level": "Associate", "audience": "who this exam is for",
    "examQuestions": 60, "examTimeMinutes": 120, "examMinutesPerQuestion": 2.0,
    "passingScore": "720 / 1000 (scaled)",
    "format": "Multiple choice & multiple response · online proctored or test center",
    "examFee": "$99 USD", "validityMonths": 12,
    "registrationUrl": "https://anthropic-partners.skilljar.com/...",
    "practiceSets": 3,
    "content": { "study": true, "revision": true }
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

`idStart` for domain N should be `N*100 + 1` so question ids don't collide across domains (domain 3 → ids 301-399). Weights must sum to 100; `questionCount`s must sum to the per-set question count (`questionsPerSet` when explicitly declared, otherwise `examQuestions`); each domain's objectives' `questions` counts must sum to that domain's `questionCount`.

`vendor` is the exam vendor. It groups the landing-page cards and the header cert switcher; the display label and the vendor/cert ordering live in `src/lib/vendors.js`. A cert missing from those order arrays still renders — it's appended, never silently dropped.

`content` (optional, defaults to both `true`) declares which content trees the cert ships. `{ "study": false, "revision": false }` makes it **practice-only**: the Study Guide and Revision nav disappear, objective tags in the feedback panel and results screen stop linking to study sections, and `/:cert/study*` and `/:cert/revision*` redirect to `/:cert/practice`. The validator then skips those checks *and* fails if a `study/` or `revision/` file exists anyway, so a half-written tree can't ship unvalidated. Read it in components via `hasStudy(cert)` / `hasRevision(cert)` from `src/data/loader.js` — both accept a `certRegistry` entry or `useCertData().cert`, which are different objects.

**Exam facts** (`level`, `audience`, `examQuestions`, `examTimeMinutes`, `passingScore`, `format`, `examFee`, `validityMonths`, `registrationUrl`) drive the "About this exam" panel on the cert overview and the fact rows on the landing page. The nullable ones must be **present as keys** — use `null` when the official value isn't known yet, and the UI omits that fact instead of inventing one.

All four certs' facts are transcribed from Anthropic's official exam guide PDFs (Version 1.0, effective July 2026), linked from <https://anthropic-partners.skilljar.com/page/partner-certifications> and cross-checked against <https://anthropic-partners.skilljar.com/page/faq-certifications>:

| | CCAO-F | CCDV-F | CCAR-F | CCAR-P |
|---|---|---|---|---|
| Items | 60 | 53 | 60 | 63 |
| Time limit | 120 min | 120 min | 120 min | 120 min |
| Passing score | 720 / 1000 scaled | ← | ← | ← |
| Fee | $99 | $125 | $125 | $175 |
| Validity | 12 months | ← | ← | ← |

The two Microsoft certs' facts come from Microsoft Learn (study guide + certification page), checked August 2026:

| | AI-103 | AI-200 |
|---|---|---|
| Items | **not published** | **not published** |
| Time limit | 120 min | 120 min |
| Passing score | 700 / 1000 scaled | ← |
| Fee | varies by country/region | ← |
| Validity | 12 months (annual renewal) | ← |

Because Microsoft doesn't publish an item count, `examQuestions` is `null` for both and the overview page says so rather than inventing a number. `examMinutesPerQuestion: 2.4` is **derived** (120 min ÷ our 50-question set), not a sourced fact — it only sets the Exam-mode pace.

AIF-C01 and AIP-C01 facts come from the official AWS certification pages and exam guides, checked August 2026:

| | AIF-C01 | AIP-C01 |
|---|---|---|
| Items | 65 total: 50 scored + 15 unscored | 75 total: 65 scored + 10 unscored |
| Time limit | 90 min | 180 min |
| Passing score | 700 / 1000 scaled | 750 / 1000 scaled |
| Fee | $100 USD | $300 USD |
| Validity | 36 months | 36 months |
| Question types | multiple choice, multiple response, ordering, matching | multiple choice, multiple response |

For AIF-C01, `questionsPerSet: 50` deliberately models only the scored blueprint while `examQuestions: 65` remains the independently sourced live-exam total. For AIP-C01 those values are 65 and 75. Each `examMinutesPerQuestion` is derived from the corresponding live pace (90 ÷ 65 and 180 ÷ 75) for Exam mode.

Two cautions. **The passing score is a scaled score on a 100–1,000 scale, not a percentage** — vendors don't publish the raw-to-scaled conversion, so rendering it as "72%" would be wrong; the validator rejects a bare percentage in `passingScore`. And the guides say "subject to change without notice", so re-check periodically.

Validation rules: when `practiceSets` is declared, the per-set question count must equal the sum of per-domain `questionCount`, so bank size can never be mistaken for set size. An explicit **`questionsPerSet`** takes precedence when a bank models scored content rather than unscored exam items, or when a vendor does not publish an item count; otherwise the validator uses `examQuestions`. One of the two must be present. Certs *without* `practiceSets` (legacy banks like CCAR-P, whose per-domain counts describe the whole 283-question bank) carry `examQuestions` as an independently-sourced figure and skip that check. `examTimeMinutes` is the official figure; if a cert lacks one, the UI falls back to `examQuestions × examMinutesPerQuestion`.

`examQuestions` describes the real exam total. `questionCount` and per-objective `questions` describe one practice set: normally a full exam, or the scored blueprint when unscored items have no published distribution. The optional `practiceSets` (default 1) says how many distinct sets the bank holds: the validator requires each objective to have `questions × practiceSets` items in its `domain-N.json`, and `scripts/export-practice-sets.mjs` splits the bank per objective (round-robin by id) into non-overlapping CSVs with the declared distribution.

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
- The validator requires a revision file for every domain that has questions + a study guide, unless the cert is practice-only (`cert.content.revision: false`).

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
9. Ground content in real, current product behaviour for that cert's vendor — for Claude certs: model tiers, prompt caching, MCP, Claude Code, the workflow/agent pattern taxonomy; for the Azure certs: Microsoft Foundry, Azure AI Search, Content Understanding, Container Apps/AKS/ACR, Cosmos DB, PostgreSQL + pgvector, Managed Redis, Service Bus/Event Grid/Functions, Key Vault, App Configuration, OpenTelemetry and KQL. Don't invent product features, SDK methods or topics outside the blueprint, and match technical depth to the cert's level (Foundations-level certs should be more conceptual than CCAR-P's Professional-level architecture scenarios).
10. **Watch the practice-set split.** `export-practice-sets.mjs` round-robins each objective's items by id, so within an objective the 1st/2nd/3rd item land in sets 1/2/3. Author each group of three at comparable difficulty and on distinct topics, or set 1 ends up systematically easier and the sets read as near-duplicates.

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

### AI-103 — Azure AI Apps and Agents Developer Associate

Practice only (no study guide, no revision). 3 practice sets × 50 questions (bank = 150). Per-domain bank counts (each set gets ⅓):

| Domain | Weight | Questions | Study guide | Revision |
|---|---|---|---|---|
| 1. Plan and manage an Azure AI solution | 28% | ✅ 42/42 | — practice only | — practice only |
| 2. Implement generative AI and agentic solutions | 32% | ✅ 48/48 | — practice only | — practice only |
| 3. Implement computer vision solutions | 14% | ✅ 21/21 | — practice only | — practice only |
| 4. Implement text analysis solutions | 14% | ✅ 21/21 | — practice only | — practice only |
| 5. Implement information extraction solutions | 12% | ✅ 18/18 | — practice only | — practice only |
| **Total** | 100% | **150/150** | — | — |

Weights are the midpoints of Microsoft's published bands (25–30 / 30–35 / 10–15 / 10–15 / 10–15), chosen so each domain's per-set count is a whole number of questions and the weights still sum to 100.

### AI-200 — Azure AI Cloud Developer Associate

Practice only (no study guide, no revision). 3 practice sets × 50 questions (bank = 150). Per-domain bank counts (each set gets ⅓):

| Domain | Weight | Questions | Study guide | Revision |
|---|---|---|---|---|
| 1. Develop containerized solutions on Azure | 24% | ✅ 36/36 | — practice only | — practice only |
| 2. Develop AI solutions by using Azure data management services | 28% | ✅ 42/42 | — practice only | — practice only |
| 3. Connect to and consume Azure services | 24% | ✅ 36/36 | — practice only | — practice only |
| 4. Secure, monitor, troubleshoot Azure solutions | 24% | ✅ 36/36 | — practice only | — practice only |
| **Total** | 100% | **150/150** | — | — |

Every weight sits inside its published band (20–25 / 25–30 / 20–25 / 20–25).

### AIF-C01 — AWS Certified AI Practitioner

Practice only (no study guide, no revision). 3 practice sets × 50 scored questions (bank = 150). Per-domain bank counts (each set gets ⅓):

| Domain | Weight | Questions | Study guide | Revision |
|---|---|---|---|---|
| 1. Fundamentals of AI and ML | 20% | ✅ 30/30 | — practice only | — practice only |
| 2. Fundamentals of GenAI | 24% | ✅ 36/36 | — practice only | — practice only |
| 3. Applications of Foundation Models | 28% | ✅ 42/42 | — practice only | — practice only |
| 4. Guidelines for Responsible AI | 14% | ✅ 21/21 | — practice only | — practice only |
| 5. Security, Compliance, and Governance for AI Solutions | 14% | ✅ 21/21 | — practice only | — practice only |
| **Total** | 100% | **150/150** | — | — |

AWS publishes exact weights against the 50 scored items, so every set contains 10/12/14/7/7 questions across the five domains. The 15 unscored live-exam items are intentionally not simulated because AWS does not publish their domain distribution.

### AIP-C01 — AWS Certified Generative AI Developer - Professional

Practice only (no study guide, no revision). 3 practice sets × 65 scored questions (bank = 195). Per-domain bank counts (each set gets ⅓):

| Domain | Weight | Questions | Study guide | Revision |
|---|---|---|---|---|
| 1. Foundation Model Integration, Data Management, and Compliance | 31% | ✅ 60/60 | — practice only | — practice only |
| 2. Implementation and Integration | 26% | ✅ 51/51 | — practice only | — practice only |
| 3. AI Safety, Security, and Governance | 20% | ✅ 39/39 | — practice only | — practice only |
| 4. Operational Efficiency and Optimization for GenAI Applications | 12% | ✅ 24/24 | — practice only | — practice only |
| 5. Testing, Validation, and Troubleshooting | 11% | ✅ 21/21 | — practice only | — practice only |
| **Total** | 100% | **195/195** | — | — |

AWS publishes percentages rather than integer domain item counts. Each 65-question set uses 20/17/13/8/7 questions, which rounds to 30.77/26.15/20.00/12.31/10.77% and is the closest whole-question allocation to the official 31/26/20/12/11 weighting. The 10 unscored live-exam items are not simulated because AWS does not publish their domain distribution.

App shell: ✅ scaffold · ✅ purpose-first landing page with exam facts · ✅ vendor-grouped cert cards & switcher · ✅ multi-cert switcher · ✅ navigation & filtering · ✅ learn/exam modes · ✅ feedback panel · ✅ results & review screens · ✅ per-objective tracking · ✅ study↔practice cross-links · ✅ revision pass · ✅ practice-only certs
