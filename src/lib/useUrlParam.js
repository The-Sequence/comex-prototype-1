import { useCallback, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { withSearchParam } from './urlParams'

/**
 * Drop-in replacement for `useState(defaultValue)` holding a list filter.
 * The value lives in the query string, so a reload or Back keeps the list
 * filtered. Changes replace the history entry: a filter refines the screen,
 * it is not a new place. A value outside `allowed` shows the default.
 */
export function useUrlParam(name, defaultValue = '', allowed) {
  const location = useLocation()
  const navigate = useNavigate()
  const raw = new URLSearchParams(location.search).get(name)
  const value = raw !== null && (!allowed || allowed.includes(raw)) ? raw : defaultValue

  // Read through a ref so the setter keeps one identity across URL changes.
  const locationRef = useRef(location)
  useLayoutEffect(() => {
    locationRef.current = location
  })

  const setValue = useCallback(
    (next) => {
      const current = locationRef.current
      const search = withSearchParam(current.search, name, next, defaultValue)
      if (search === (current.search || '')) return
      navigate({ pathname: current.pathname, search }, { replace: true, state: current.state })
    },
    [defaultValue, name, navigate],
  )

  return [value, setValue]
}
