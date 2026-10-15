import { useCallback, useEffect, useState } from 'react'
import { errorText } from './decisions'

/**
 * Loads a list through an async adapter call. status is 'loading', 'ready'
 * or 'error'; reload() fetches again. Failures are shown, never hidden.
 */
export function useAsyncList(load, deps) {
  const [state, setState] = useState({ status: 'loading', rows: [], error: '' })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let live = true
    setState((s) => ({ ...s, status: 'loading', error: '' }))
    Promise.resolve()
      .then(load)
      .then((rows) => live && setState({ status: 'ready', rows: rows ?? [], error: '' }))
      .catch((err) => live && setState({ status: 'error', rows: [], error: errorText(err, 'Could not load the list.') }))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { ...state, reload }
}
