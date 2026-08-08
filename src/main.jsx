import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, redirect, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Courses from './pages/Courses.jsx'
import Home from './pages/Home.jsx'
import StudyIndex from './pages/StudyIndex.jsx'
import StudyDomain from './pages/StudyDomain.jsx'
import RevisionIndex from './pages/RevisionIndex.jsx'
import RevisionDomain from './pages/RevisionDomain.jsx'
import PracticeSetup from './pages/PracticeSetup.jsx'
import Quiz from './pages/Quiz.jsx'
import Results from './pages/Results.jsx'
import { certByCode, certRegistry, getCertData, hasRevision, hasStudy } from './data/loader.js'
import { migrateLegacyStorage } from './lib/storage.js'

migrateLegacyStorage()

const FALLBACK_CERT = 'CCAR-P'

function defaultCert() {
  const saved = localStorage.getItem('selectedCert')
  if (saved && certRegistry.some((c) => c.code === saved)) return saved
  return certRegistry.some((c) => c.code === FALLBACK_CERT) ? FALLBACK_CERT : certRegistry[0]?.code
}

// Practice-only certs (blueprint cert.content) have no study/revision content, so those
// routes bounce to practice. This lives on the ':certCode' child routes rather than the
// legacy redirects below, so both a direct deep link and a legacy bookmark end up right.
function requireContent(has) {
  return ({ params }) => {
    const cert = certByCode[params.certCode]
    if (cert && !has(cert)) throw redirect(`/${params.certCode}/practice`)
    return null
  }
}

async function certLoader({ params }) {
  const { certCode } = params
  if (!certRegistry.some((c) => c.code === certCode)) {
    throw new Response('Unknown certification', { status: 404 })
  }
  localStorage.setItem('selectedCert', certCode)
  return getCertData(certCode)
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Courses /> },
      // The standalone picker was merged into the landing page's cert section.
      { path: 'certs', loader: () => redirect('/#certifications') },
      {
        path: ':certCode',
        id: 'cert',
        loader: certLoader,
        children: [
          { index: true, element: <Home /> },
          { path: 'study', loader: requireContent(hasStudy), element: <StudyIndex /> },
          { path: 'study/:domainId', loader: requireContent(hasStudy), element: <StudyDomain /> },
          { path: 'revision', loader: requireContent(hasRevision), element: <RevisionIndex /> },
          { path: 'revision/:domainId', loader: requireContent(hasRevision), element: <RevisionDomain /> },
          { path: 'practice', element: <PracticeSetup /> },
          { path: 'quiz', element: <Quiz /> },
          { path: 'results/:attemptId', element: <Results /> },
        ],
      },
      // Pre-multi-cert bookmarks — redirect into the last-used (or default) cert.
      { path: 'study', loader: () => redirect(`/${defaultCert()}/study`) },
      {
        path: 'study/:domainId',
        loader: ({ params }) => redirect(`/${defaultCert()}/study/${params.domainId}`),
      },
      { path: 'revision', loader: () => redirect(`/${defaultCert()}/revision`) },
      {
        path: 'revision/:domainId',
        loader: ({ params }) => redirect(`/${defaultCert()}/revision/${params.domainId}`),
      },
      { path: 'practice', loader: () => redirect(`/${defaultCert()}/practice`) },
      { path: 'quiz', loader: () => redirect(`/${defaultCert()}/quiz`) },
      {
        path: 'results/:attemptId',
        loader: ({ params }) => redirect(`/${defaultCert()}/results/${params.attemptId}`),
      },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
