import { Link } from 'react-router-dom'

// One tag vocabulary across the study guide and question bank so cross-links
// read as a single system: domain=indigo, objective=teal, principle=amber.
const styles = {
  domain: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  objective: 'border-teal-200 bg-teal-50 text-teal-900',
  principle: 'border-amber-200 bg-amber-50 text-amber-900',
  neutral: 'border-stone-300 bg-stone-100 text-stone-700',
}

export default function Tag({ kind = 'neutral', to, children, className = '' }) {
  const base = `inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[kind]} ${className}`
  if (to) {
    return (
      <Link to={to} className={`${base} underline-offset-2 hover:underline`}>
        <span className="truncate">{children}</span>
      </Link>
    )
  }
  return (
    <span className={base}>
      <span className="truncate">{children}</span>
    </span>
  )
}
