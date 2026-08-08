import { NavLink, Outlet, ScrollRestoration, useParams } from 'react-router-dom'
import CertSwitcher from './components/CertSwitcher.jsx'
import { hasRevision, hasStudy } from './data/loader.js'
import { useCertData } from './lib/cert.js'

const navLinkClass = ({ isActive }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-stone-200 text-stone-900' : 'text-stone-600 hover:bg-stone-200/60 hover:text-stone-900'
  }`

export default function App() {
  // Only a route under ':certCode' has an active certification. On the landing
  // page we deliberately show no per-cert nav, so nobody lands inside a
  // certification they never chose.
  const { certCode } = useParams()
  const certData = useCertData()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-stone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <NavLink to="/" className="text-lg font-bold tracking-tight text-stone-900">
            Cert Prep
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              {certCode ? 'All certifications' : 'Home'}
            </NavLink>
            {certCode && (
              <>
                <NavLink to={`/${certCode}`} end className={navLinkClass}>
                  Overview
                </NavLink>
                {hasStudy(certData?.cert) && (
                  <NavLink to={`/${certCode}/study`} className={navLinkClass}>
                    Study Guide
                  </NavLink>
                )}
                {hasRevision(certData?.cert) && (
                  <NavLink to={`/${certCode}/revision`} className={navLinkClass}>
                    Revision
                  </NavLink>
                )}
                <NavLink to={`/${certCode}/practice`} className={navLinkClass}>
                  Practice
                </NavLink>
              </>
            )}
          </nav>
          <div className="ml-auto">
            <CertSwitcher activeCertCode={certCode} />
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
            : 'Unofficial certification practice material.'}{' '}
          Progress is stored only in this browser.
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  )
}
