# CCAR-P Prep — Study Guide & Question Bank

A study + practice web app for the **Claude Certified Architect – Professional (CCAR-P)** certification. Two cross-linked parts:

- **Study guide** — one page per exam domain, one section per blueprint objective, each ending with a "Practice this objective" deep link into the question bank.
- **Question bank** — 200 reasoning-based scenario questions distributed by domain weight, every question tagged with its exact blueprint objective and linking back to the study section that teaches it.

No backend: React + Vite + Tailwind, all state client-side, attempt history persisted to `localStorage`.

## Setup

```bash
npm install
npm run dev        # dev server
npm run build      # production build → dist/
npm run preview    # serve the production build
npm run validate   # validate all question/study content against the blueprint
```

## How it works

- `src/data/blueprint.json` — single source of truth: domains, weights, exact objective strings, per-objective question counts, question id ranges.
- `src/data/questions/domain-N.json` — one array of questions per domain, merged at build time via `import.meta.glob` in `src/data/loader.js`.
- `src/data/study/domain-N.json` — study guide content per domain.
- `scripts/validate-content.mjs` — checks every content file against the blueprint (counts per objective, schema fields, exact objective strings, explanation lengths, no placeholder text). Run it after any content change.

### Modes

- **Learn mode** — untimed; full reasoning shown immediately after every answer, right or wrong. The feedback panel shows your answer + its explanation, the correct answer + its explanation, the principle tag, the related concept, and a "go deeper" toggle with all four option explanations.
- **Exam mode** — timed at 1.9 min/question; feedback withheld until submission, then full per-question review.

Performance is tracked **per objective tag** (not just per domain) across all attempts, and surfaced on the results screen, the study guide domain pages, and each objective section.

## Question schema

`src/data/questions/domain-N.json` — one array per file:

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
  "relatedConcept": "one-liner connecting to the domain theme"
}
```

- `id`: unique; domain N uses the range `N*100 + 1` … (e.g. Domain 3 → 301+).
- `objective` / `domain`: must match `blueprint.json` **character-for-character** — this is what powers study-guide cross-linking and per-objective stats.
- `type`: `"single"` (1 correct index) or `"multi"` (≥2 correct indices; stem ends with "(Choose two.)").
- `correct`: 0-based indices into `options`.

## Content-generation guidelines

Follow these when adding questions so new items match the existing depth (the validator enforces the mechanical parts):

1. **Scenario-based stem** — a realistic situation with a decision to make, not trivia. A named role at a company in a specific industry faces a concrete choice. Vary industries (fintech, healthcare, retail, public sector, SaaS) and difficulty (straightforward application vs. multi-factor trade-off judgment) within each objective.
2. **4 options, all plausible** — each option should be pickable by a competent-but-imperfect architect. No joke options, no "all of the above", and the correct option must not be recognizably longer or more detailed than the others.
3. **Per-option explanations (2–4 sentences each)** — for the correct option, name the underlying principle; for each wrong option, explain why it's tempting **and** the specific reasoning error (wrong trade-off, treats symptom not cause, violates a named principle, over-engineering, …).
4. **`principle` tag** — short phrase capturing the rule, e.g. `"least privilege > detective controls"`.
5. **`objective` tag** — the exact blueprint bullet (copy it from `blueprint.json`).
6. **`relatedConcept`** — one line connecting the question to the broader domain theme.
7. **Distribute evenly** — roughly 5–6 questions per objective bullet so every objective gets meaningful coverage.
8. **No stubs** — never commit TODO/placeholder text; the validator rejects it.
9. Ground content in real Claude/Anthropic concepts (model tiers, prompt caching, MCP, Claude Code, the workflow/agent pattern taxonomy) — don't invent product features or topics outside the blueprint.

Study guide sections follow the same spirit: plain-language explanation, why it matters in production, 1–2 worked examples, 3–5 pitfalls, documentation tone (no marketing copy). Schema is in any `src/data/study/domain-N.json`.

After adding content: `npm run validate` (or `node scripts/validate-content.mjs <domainId>` for one domain).

## Content progress

| Domain | Weight | Questions | Study guide |
|---|---|---|---|
| 1. Solution Design & Architecture | 17% | ✅ 34/34 | ✅ done |
| 2. Claude Models, Prompting & Context Engineering | 13% | ✅ 26/26 | ✅ done |
| 3. Integration | 19% | ✅ 38/38 | ✅ done |
| 4. Evaluation, Testing & Optimization | 16% | ✅ 32/32 | ✅ done |
| 5. Governance, Safety & Risk Management | 14% | ✅ 28/28 | ✅ done |
| 6. Stakeholder Communication & Lifecycle Management | 14% | ✅ 28/28 | ✅ done |
| 7. Developer Productivity & Operational Enablement | 7% | ✅ 14/14 | ✅ done |
| **Total** | 100% | **200/200** | **7/7** |

App shell: ✅ scaffold · ✅ navigation & filtering · ✅ learn/exam modes · ✅ feedback panel · ✅ results & review screens · ✅ per-objective tracking · ✅ study↔practice cross-links
