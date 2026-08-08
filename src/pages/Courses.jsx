import { Link } from 'react-router-dom'
import { certRegistry, hasStudy } from '../data/loader.js'
import { byVendor } from '../lib/vendors.js'
import Tag from '../components/Tag.jsx'

// Marketing copy +, where one exists, the paid Udemy listing for each cert. Exam facts,
// level, vendor and audience come from the blueprint (see certRegistry) so they can't drift.
// Ordering and vendor grouping live in lib/vendors.js.
const courseCopy = {
  'CCAO-F': {
    title: 'Claude Associate Foundations',
    description:
      'Claude use cases, capabilities, prompting, privacy, safety, human review, responsible adoption and business value.',
    url: 'https://www.udemy.com/course/claude-certified-associate-foundations-ccao-f-practice/?couponCode=391AA928F46CA448B3AC',
  },
  'CCDV-F': {
    title: 'Claude Developer Foundations',
    description:
      'Claude APIs, prompting, structured outputs, tools, agents, RAG, integrations, debugging, evaluation and secure AI development.',
    url: 'https://www.udemy.com/course/claude-certified-developer-foundations-ccdv-f/?couponCode=07714506C47E3819D559',
  },
  'CCAR-F': {
    title: 'Claude Architect Foundations',
    description:
      'Architecture decisions across enterprise integration, scalability, security, resilience, observability, governance, latency and cost.',
    url: 'https://www.udemy.com/course/claude-certified-architect-foundations-ccar-f/?couponCode=A79D255F4FF8197CB338',
  },
  'CCAR-P': {
    title: 'Claude Architect Professional',
    description:
      'Realistic scenarios covering architecture trade-offs, failure diagnosis, reliability, security, governance and enterprise AI operations.',
    url: 'https://www.udemy.com/course/claude-certified-architect-professional-practice/?couponCode=716D88928B0C6D1FB137',
  },
  'AI-103': {
    title: 'Azure AI Apps and Agents Developer',
    description:
      'Foundry solution setup, model selection, RAG, agents and multi-agent orchestration, vision and multimodal, language and speech, document extraction, responsible AI.',
  },
  'AI-200': {
    title: 'Azure AI Cloud Developer',
    description:
      'Production engineering for AI back ends: containers and orchestration, Cosmos DB, PostgreSQL with pgvector, Managed Redis, messaging, Key Vault, OpenTelemetry and KQL.',
  },
  'AIF-C01': {
    title: 'AWS Certified AI Practitioner',
    description:
      'AI and ML fundamentals, generative AI, foundation-model applications, responsible AI, and security, compliance and governance on AWS.',
  },
}

const steps = [
  {
    n: 1,
    title: 'Pick your certification',
    body: 'Claude, Microsoft Azure, and AWS exams, from Foundational to Architect Professional. Each one has its own question bank; the Claude certifications add a study guide and revision recaps.',
  },
  {
    n: 2,
    title: 'Learn the blueprint',
    body: 'Where a study guide exists, work through it domain by domain, then use Revision for a fast last-mile pass over every objective.',
  },
  {
    n: 3,
    title: 'Practice, then simulate',
    body: 'Answer scenario questions in Learn mode to see the full reasoning immediately, then take a timed Exam-mode run to test yourself.',
  },
]

const features = [
  {
    label: 'Study Guide',
    tagline: 'Claude certifications',
    body: 'One section per exam objective: a plain-language explanation, why it matters in production, worked examples and the common pitfalls.',
  },
  {
    label: 'Revision',
    tagline: 'Claude certifications',
    body: 'A short recap of every objective — key points plus the trap to watch for — with one high-yield question each. Built to be read straight through.',
  },
  {
    label: 'Learn mode',
    tagline: 'Every certification',
    body: 'Untimed. After each answer you get the full reasoning — why the right option is right, and the specific error behind each wrong one.',
  },
  {
    label: 'Exam mode',
    tagline: 'Every certification',
    body: 'Timed to the real exam pace with feedback withheld until you submit, then a complete per-question review of your reasoning.',
  },
]

function ExamFacts({ cert }) {
  const facts = [
    cert.examQuestions ? `${cert.examQuestions} questions` : null,
    cert.examMinutes ? `${cert.examMinutes} min` : null,
    cert.examFee || null,
  ].filter(Boolean)

  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-stone-200 pt-4 text-sm">
      <div>
        <dt className="text-xs uppercase tracking-wide text-stone-500">Real exam</dt>
        <dd className="mt-0.5 font-medium text-stone-800">
          {facts.length ? facts.join(' · ') : <span className="text-stone-400">not published here yet</span>}
        </dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-stone-500">In this app</dt>
        <dd className="mt-0.5 font-medium text-stone-800 tabular-nums">
          {cert.bankQuestions} questions · {cert.domainCount} domains
        </dd>
      </div>
    </dl>
  )
}

export default function Courses() {
  return (
    <div className="space-y-14">
      <section className="rounded-lg border border-stone-200 bg-white px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">
          Free · No sign-up · {certRegistry.length} certifications
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
          Prepare for Claude, Azure AI, and AWS AI certification exams.
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-stone-700">
          A reasoning-based question bank for every certification here — plus a full study guide for the Claude
          exams — built around the official blueprints. Every question is a realistic scenario with a full explanation
          of why each option is right or wrong, so you learn the judgement the exam tests, not just the answer key.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
          Everything runs in your browser. Nothing to install, no account needed, and your progress is saved on this
          device only.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#certifications"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Pick your certification
          </a>
          <a
            href="#how-it-works"
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">How it works</h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-stone-700">
          Three steps, in this order. You can jump straight to practice — and on the practice-only certifications that
          is the whole path.
        </p>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.n} className="rounded-lg border border-stone-200 bg-white p-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-800">
                {step.n}
              </span>
              <h3 className="mt-3 font-semibold text-stone-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="certifications" className="scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">Choose your certification</h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-stone-700">
          Grouped by vendor, easiest first. Pick the one that matches your role — each opens its own overview and
          question bank.
        </p>

        {byVendor(certRegistry).map((group) => (
          <div key={group.vendor} className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{group.label}</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {group.certs.map((cert) => {
                const copy = courseCopy[cert.code] ?? { title: cert.name, description: '' }
                const study = hasStudy(cert)
                return (
                  <article key={cert.code} className="flex flex-col rounded-lg border border-stone-200 bg-white p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                        {cert.code}
                      </span>
                      <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                        {cert.level}
                      </span>
                      {!study && <Tag kind="neutral">Practice only</Tag>}
                    </div>
                    <h4 className="mt-4 text-xl font-semibold text-stone-900">{copy.title}</h4>
                    <p className="mt-2 leading-relaxed text-stone-700">{copy.description}</p>
                    <p className="mt-3 text-sm leading-relaxed text-stone-500">{cert.audience}</p>

                    <ExamFacts cert={cert} />

                    <div className="mt-auto pt-5">
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          to={`/${cert.code}`}
                          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Start here →
                        </Link>
                        {study && (
                          <Link
                            to={`/${cert.code}/study`}
                            className="text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
                          >
                            Study guide
                          </Link>
                        )}
                        <Link
                          to={`/${cert.code}/practice`}
                          className="text-sm font-medium text-indigo-700 underline-offset-2 hover:underline"
                        >
                          Practice
                        </Link>
                      </div>
                      {copy.url && (
                        <a
                          href={copy.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block text-sm text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline"
                        >
                          Also on Udemy — lifetime access to the full practice sets ↗
                        </a>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900">What you get in each certification</h2>
        <p className="mt-2 max-w-3xl leading-relaxed text-stone-700">
          All of it shares the same objective tags, so your practice results tell you exactly which part of the
          blueprint to go back to.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.label} className="rounded-lg border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="font-semibold text-stone-900">{f.label}</h3>
                <span className="text-xs font-medium uppercase tracking-wide text-stone-500">{f.tagline}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-stone-700">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <aside className="rounded-lg border border-stone-200 bg-stone-50 p-5 text-sm leading-relaxed text-stone-600">
        These are independent educational and exam-preparation resources. They are not affiliated with or endorsed by
        Anthropic or Microsoft, and the questions are original — not exam dumps. Official exam details should always be
        confirmed on the vendor&apos;s own certification pages. Progress in this browser remains stored locally on this
        device.
      </aside>
    </div>
  )
}
