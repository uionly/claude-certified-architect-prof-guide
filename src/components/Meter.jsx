// Single-hue accuracy meter. The percentage is always printed as text next to
// the bar — color never carries the value on its own.
export default function Meter({ correct, attempted, className = '' }) {
  const pct = attempted ? Math.round((correct / attempted) * 100) : 0
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${correct} of ${attempted} correct`}
      >
        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-24 shrink-0 text-right text-xs text-stone-600 tabular-nums">
        {attempted ? `${correct}/${attempted} · ${pct}%` : 'no attempts'}
      </div>
    </div>
  )
}
