import { NavLink, Outlet, ScrollRestoration, useParams } from 'react-router-dom'
import CertSwitcher from './components/CertSwitcher.jsx'
import { useCertData } from './lib/cert.js'

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
  }`

export default function App() {
  const { certCode } = useParams()
  const certData = useCertData()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <NavLink to="/" className="font-serif text-lg font-semibold tracking-tight text-stone-900">
            Claude Cert Prep
          </NavLink>
          {certCode && (
            <nav className="flex flex-wrap items-center gap-1">
              <NavLink to={`/${certCode}`} end className={navLinkClass}>
                Overview
              </NavLink>
              <NavLink to={`/${certCode}/study`} className={navLinkClass}>
                Study Guide
              </NavLink>
              <NavLink to={`/${certCode}/revision`} className={navLinkClass}>
                Revision
              </NavLink>
              <NavLink to={`/${certCode}/practice`} className={navLinkClass}>
                Practice
              </NavLink>
            </nav>
          )}
          <div className="ml-auto">
            <CertSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-stone-200 bg-stone-50">
        <div className="mx-auto max-w-5xl px-4 py-4 text-xs text-stone-500">
          {certData
            ? `${certData.cert.name} (${certData.cert.code}) study companion.`
            : 'Unofficial Claude certification practice material.'}{' '}
          Progress is stored only in this browser.
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  )
}
