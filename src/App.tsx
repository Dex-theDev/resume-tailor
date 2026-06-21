import { useState } from 'react'
import type { AppState, TailorResponse } from './types'
import JDInput from './components/JDInput'
import LoadingState from './components/LoadingState'
import ResultsView from './components/ResultsView'
import { tailorResume } from './lib/tailor'
import pool from '../resume-pool.json'

export default function App() {
  const [state, setState] = useState<AppState>('idle')
  const [result, setResult] = useState<TailorResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (jd: string) => {
    setState('loading')
    setError(null)
    try {
      const res = await tailorResume(jd, pool as any)
      setResult(res)
      setState('results')
    } catch (e) {
      setError('Something went wrong. Try again.')
      setState('idle')
    }
  }

  if (state === 'loading') return <LoadingState />
  if (state === 'results' && result) {
    return (
      <ResultsView
        result={result}
        pool={pool as any}
        onReset={() => { setState('idle'); setResult(null) }}
      />
    )
  }

  return (
    <>
      <JDInput onSubmit={handleSubmit} />
      {error && (
        <p className="fixed bottom-4 left-0 right-0 text-center text-sm text-red-500">{error}</p>
      )}
    </>
  )
}
