import { Link } from 'react-router-dom'

const courses = [
  {
    code: 'CCDV-F',
    title: 'Claude Developer Foundations',
    level: 'Developer',
    description:
      'Build confidence with Claude APIs, prompting, structured outputs, tools, agents, RAG, integrations, debugging, evaluation and secure AI development.',
    audience: 'Backend, full-stack and AI engineers building Claude-powered applications.',
    url: 'https://www.udemy.com/course/claude-certified-developer-foundations-ccdv-f/?couponCode=07714506C47E3819D559',
  },
  {
    code: 'CCAR-F',
    title: 'Claude Architect Foundations',
    level: 'Architect',
    description:
      'Practice architecture decisions across enterprise integration, scalability, security, resilience, observability, governance, latency and cost.',
    audience: 'Developers, technical leads, cloud architects and emerging GenAI architects.',
    url: 'https://www.udemy.com/course/claude-certified-architect-foundations-ccar-f/?couponCode=A79D255F4FF8197CB338',
  },
  {
    code: 'CCAR-P',
    title: 'Claude Architect Professional',
    level: 'Advanced',
    description:
      'Work through realistic scenarios covering architecture trade-offs, failure diagnosis, reliability, security, governance and enterprise AI operations.',
    audience: 'Senior engineers, architects and technical leads preparing for advanced Claude work.',
    url: 'https://www.udemy.com/course/claude-certified-architect-professional-practice/?couponCode=716D88928B0C6D1FB137',
  },
  {
    code: 'CCAO-F',
    title: 'Claude Associate Foundations',
    level: 'Associate',
    description:
      'Strengthen your understanding of Claude use cases, capabilities, prompting, privacy, safety, human review, responsible adoption and business value.',
    audience: 'Developers working with product, consulting, customer or enterprise adoption teams.',
    url: 'https://www.udemy.com/course/claude-certified-associate-foundations-ccao-f-practice/?couponCode=391AA928F46CA448B3AC',
  },
]

export default function Courses() {
  return (
    <div className="space-y-12">
      <section className="rounded-lg border border-stone-200 bg-white px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Claude certification practice</p>
        <h1 className="mt-3 max-w-3xl font-serif text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Practice here. Keep learning for a lifetime on Udemy.
        </h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-stone-700">
          Explore the same certification-style practice questions in this browser, or reserve lifetime access to the
          complete practice sets on Udemy. Choose the path that matches your role and build confidence through
          realistic scenarios with detailed answer explanations.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#practice-courses"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Explore practice courses
          </a>
          <Link
            to="/certs"
            className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
          >
            Choose a practice set
          </Link>
        </div>
      </section>

      <section id="practice-courses" className="scroll-mt-24">
        <div className="max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">Choose your learning path</h2>
          <p className="mt-2 leading-relaxed text-stone-700">
            Start practicing instantly in the app, then reserve your spot on Udemy when you want lifetime access.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <article key={course.code} className="flex flex-col rounded-lg border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                  {course.code}
                </span>
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
                  {course.level}
                </span>
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold text-stone-900">{course.title}</h3>
              <p className="mt-3 leading-relaxed text-stone-700">{course.description}</p>
              <p className="mt-3 text-sm leading-relaxed text-stone-500">{course.audience}</p>
              <div className="mt-auto flex flex-wrap gap-3 pt-5">
                <a
                  href={course.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Reserve lifetime access on Udemy ↗
                </a>
                <Link
                  to={`/${course.code}/practice`}
                  className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
                >
                  Practice in browser
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="rounded-lg border border-stone-200 bg-stone-50 p-5 text-sm leading-relaxed text-stone-600">
        These are independent educational and exam-preparation resources. They are not affiliated with or endorsed by
        Anthropic. Progress in this browser remains stored locally on this device.
      </aside>
    </div>
  )
}
