import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import StudyIndex from './pages/StudyIndex.jsx'
import StudyDomain from './pages/StudyDomain.jsx'
import PracticeSetup from './pages/PracticeSetup.jsx'
import Quiz from './pages/Quiz.jsx'
import Results from './pages/Results.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'study', element: <StudyIndex /> },
      { path: 'study/:domainId', element: <StudyDomain /> },
      { path: 'practice', element: <PracticeSetup /> },
      { path: 'quiz', element: <Quiz /> },
      { path: 'results/:attemptId', element: <Results /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
