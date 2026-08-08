# Adding a certification

Candidate exams worth adding next, and the prompt that adds one. Written after the
AI-103 / AI-200 build, which is the reference implementation for a **practice-only**
certification (question bank, no study guide, no revision).

Everything below was verified against vendor pages in **August 2026**. Certification
lineups move fast — re-check the exam still exists, and its outline hasn't been
re-cut, before authoring 150 questions against it.

## Candidates

### Tier 1 — highest value alongside the existing Claude + Azure certs

| Cert | Code | Verified facts | Why |
|---|---|---|---|
| AWS Certified Machine Learning Engineer – Associate | MLA-C01 | 65 q · 720/1000 | The practitioner→engineer step; SageMaker and MLOps |
| Google Cloud Professional Machine Learning Engineer | — | ~50–60 q · 120 min · $200 | Vertex AI + Gemini. **Major June 2026 refresh — re-verify the outline first** |
| Databricks Certified Generative AI Engineer – Associate | — | Design 14% · Data prep 14% · App dev 30% · Deploy 22% · Governance 8% · Eval & monitoring 12% | RAG, Vector Search, Model Serving, Unity Catalog |

### Tier 2 — add if the audience fits

- **Google Cloud Generative AI Leader** (~$99, non-technical) — breadth/funnel play, a very
  different audience from the current five.
- **NVIDIA NCA-GENL** (50 q · 60 min · $125) — LLM fundamentals: transformers → RAG → agents.
  Largely vendor-neutral, so it travels well.
- **Salesforce Agentforce Specialist** (60 q · 105 min · 73% to pass) — only if there's
  Salesforce delivery work. Agent Builder, topics/actions, Einstein Trust Layer.
- **Microsoft AI-900 Azure AI Fundamentals** — cheap entry funnel feeding AI-103 / AI-200.

### Do not add

| Exam | Reason |
|---|---|
| OpenAI certifications | AI Foundations is a course + Credly badge (ETS-backed). No proctored exam has launched; realistically late 2026 / 2027 |
| AWS ML Specialty (MLS-C01) | Retired 31 March 2026 — AIP-C01 is the successor |
| Microsoft AI-102 | Retires 30 June 2026; AI-103 (already in the app) is the successor |
| Coursera / IBM "professional certificates" | Courseware, not proctored exams — there's no blueprint to build a bank against |

**Open question:** third-party sources also describe a separate Google Cloud
"Generative AI Engineer" certification. `cloud.google.com/learn/certification` wouldn't
render when checked, so confirm it exists before planning work around it.

## The prompt

Fill the parameter block and run it. It encodes the two things that cost time on the
AI-103 / AI-200 build: per-objective counts must divide evenly by `practiceSets`, and
objective strings must be the guide's **group headings**, ASCII-only.

```
Add <CERT NAME> (<CODE>, vendor <VENDOR>) to the cert-prep app at
/Users/deepak/ttn-internal-repo/pocs as a PRACTICE-ONLY certification,
following exactly the pattern established by AI-103 and AI-200.

PARAMETERS
  code            <CODE>              # directory name = cert.code
  vendor          <VENDOR>            # add to VENDOR_ORDER/VENDOR_LABELS in src/lib/vendors.js if new
  official guide  <URL>
  set size        <N>                 # 50 unless the vendor publishes an item count
  practiceSets    3

STEP 1 — VERIFY, DON'T TRUST MEMORY.
Fetch the official exam guide. Transcribe domain titles and weights VERBATIM.
Record the "skills measured as of" / guide version date. Note any place the
vendor's own pages disagree with each other. Get items/time/passing score/fee/
validity from the certification page; use null for anything not published —
never invent a number.

STEP 2 — BLUEPRINT (src/data/certs/<CODE>/blueprint.json).
- Objectives = the guide's sub-skill GROUP HEADINGS, verbatim and ASCII-only
  (normalise U+2011/U+2013 to '-'; they break the ?objective= deep links).
  Bullets are too numerous to give each one a question per set.
- Pick weights inside each published band such that weight/2 (for a 50-q set)
  is a whole number of questions and the weights sum to 100.
- Per-objective `questions` must sum to the domain's questionCount, and each
  must be an integer, because the bank holds questions x 3 and the exporter
  round-robins by id into the three sets.
- cert block: vendor, level, audience, examQuestions (null if unpublished),
  questionsPerSet, examTimeMinutes, examMinutesPerQuestion (= time/official total items),
  passingScore as a scaled string not a percentage, format, examFee,
  validityMonths, registrationUrl, practiceSets: 3,
  content: { "study": false, "revision": false }
- idStart for domain N = N*100+1. Then: npm run validate (expect only
  "missing questions/domain-N.json").

STEP 3 — QUESTION BANK. One background agent per domain (2-3 small domains can
share an agent). Each agent gets: the exact per-objective counts (questions x 3),
the id range, the official guide URL as a topic checklist, and this bar:
- realistic production SCENARIO stems (>=120 chars) with concrete signals —
  symptoms, numbers, CLI/code fragments — not definition lookups
- exactly 4 options, all plausible; 4 optionExplanations of >=80 chars each that
  name the specific misconception behind each distractor. Never "Incorrect."
- ~19% multi-select, stems ending "(Choose two.)"
- principle / relatedConcept / overallExplanation on every record
- the 3 items sharing an objective slot go to sets 1/2/3 IN ID ORDER — keep them
  comparable in difficulty and distinct in topic, or set 1 reads easier
- ground every item in real current product behaviour; invent no SDK methods
- the agent must run `node scripts/validate-content.mjs <CODE> <domainId>` and
  iterate until OK. Model the record shape on
  src/data/certs/CCAR-F/questions/domain-1.json.

STEP 4 — WIRE UP + VERIFY.
Add the cert to CERT_ORDER in src/lib/vendors.js and courseCopy in
src/pages/Courses.jsx (the Udemy url is optional). Then:
- npm run validate  (all certs OK)
- npm run lint && npm run build
- npm run export:csv <CODE>  -> 3 CSVs of exactly <N> questions
- check for duplicate option-sets within AND across domain files (must be 0)
- drive the app in a headless browser: landing page group, /<CODE> overview,
  /<CODE>/study redirecting to /<CODE>/practice, one learn-mode answer showing a
  NON-clickable objective tag, and a Claude cert still showing its study links
- update the README: cert table row, exam-facts table, content-progress section
```

Because the cert is practice-only, nothing else in the app needs touching — the
`cert.content` flag already drives the nav, the routing, the objective links and the
validator. Adding a cert that *does* ship a study guide and revision pass means
dropping `content` from the blueprint and authoring both trees; see the README's
study/revision schemas.

## What this costs

The AI-103 + AI-200 build produced 300 questions across 9 domain files from 6 parallel
agents, roughly 10–20 minutes each. Expect ~150 questions (about 210 KB of JSON) per
certification.

## Sanity checks worth keeping

Run these after any bank lands — they catch what the validator can't:

```bash
# per-file counts, multi share, explanation depth, duplicate option-sets
python3 - <<'PY'
import json, collections, glob
for cert in ['<CODE>']:
    seen = collections.Counter()
    for p in sorted(glob.glob(f'src/data/certs/{cert}/questions/domain-*.json')):
        qs = json.load(open(p))
        lens = [len(e) for q in qs for e in q['optionExplanations']]
        for q in qs: seen[tuple(sorted(q['options']))] += 1
        print(f"{p.split('/')[-1]:16s} {len(qs):3d} items  "
              f"{sum(1 for q in qs if q['type']=='multi'):2d} multi  "
              f"expl med {sorted(lens)[len(lens)//2]:3d}")
    print('cross-file duplicate option-sets:', sum(1 for v in seen.values() if v > 1))
PY

# objective/domain strings must be ASCII — non-ASCII breaks ?objective= deep links
grep -P '[^\x00-\x7F]' src/data/certs/<CODE>/blueprint.json
```

A healthy bank: median per-option explanation ~250 chars, ~19% multi-select, **zero**
duplicate option-sets, and zero non-ASCII in objective strings.
