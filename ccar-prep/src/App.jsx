import { NavLink, Outlet, ScrollRestoration } from 'react-router-dom'

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
  }`

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <NavLink to="/" className="font-serif text-lg font-semibold tracking-tight text-stone-900">
            CCAR-P Prep
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Overview
            </NavLink>
            <NavLink to="/study" className={navLinkClass}>
              Study Guide
            </NavLink>
            <NavLink to="/practice" className={navLinkClass}>
              Practice
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-stone-500">
          Claude Certified Architect – Professional (CCAR-P) study companion. Unofficial practice material; progress is
          stored only in this browser.
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  )
}
