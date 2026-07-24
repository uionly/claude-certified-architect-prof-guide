export default function StatTile({ label, value, detail }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-stone-900">{value}</div>
      {detail ? <div className="mt-0.5 text-xs text-stone-500">{detail}</div> : null}
    </div>
  )
}
