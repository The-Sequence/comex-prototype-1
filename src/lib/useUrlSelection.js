import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Marks a history entry this hook pushed, so closing knows it may go back.
const PUSHED_FLAG = 'selectionPushed'

/**
 * Drop-in replacement for `useState(null)` holding "the record that is open"
 * (e.g. the account shown in Registration Details). Opening one adds
 * `?<paramName>=<id>` as a new history entry, so Back closes the dialog
 * instead of leaving the screen, and a reload reopens it. Closing goes back
 * one step when this hook pushed the entry, else removes the parameter.
 */
export function useUrlSelection(paramName, items) {
  const location = useLocation()
  const navigate = useNavigate()
  const paramId = new URLSearchParams(location.search).get(paramName)
  const [picked, setPicked] = useState(null)

  // The URL decides what is open. Back (parameter gone) closes it; a reload
  // or Forward (parameter, nothing picked yet) finds the record in `items`.
  let selected = null
  if (paramId) {
    selected =
      picked && String(picked.id) === paramId ? picked : (items?.find((item) => String(item.id) === paramId) ?? null)
  }

  const locationRef = useRef(location)
  useLayoutEffect(() => {
    locationRef.current = location
  })

  const setSelected = useCallback(
    (record) => {
      setPicked(record)
      const current = locationRef.current
      const params = new URLSearchParams(current.search)
      const currentId = params.get(paramName)

      if (record) {
        const id = String(record.id)
        if (currentId === id) return
        params.set(paramName, id)
        navigate(
          { pathname: current.pathname, search: `?${params}` },
          { replace: Boolean(currentId), state: { [PUSHED_FLAG]: true } },
        )
        return
      }

      if (!currentId) return
      if (current.state?.[PUSHED_FLAG]) {
        navigate(-1)
        return
      }
      params.delete(paramName)
      const search = params.toString()
      navigate({ pathname: current.pathname, search: search ? `?${search}` : '' }, { replace: true })
    },
    [navigate, paramName],
  )

  return [selected, setSelected]
}
