import { useRouteLoaderData } from 'react-router-dom'

// Reads the { cert, domains, allQuestions, ... } bundle produced by the
// ':certCode' route's loader (see main.jsx's certLoader / data/loader.js's
// getCertData). Safe to call from any descendant of that route.
export function useCertData() {
  return useRouteLoaderData('cert')
}
