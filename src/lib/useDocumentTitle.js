import { useEffect } from 'react'

export const APP_NAME = 'NU Fairview COMEX'

/** Names the browser tab after the screen ("Users · NU Fairview COMEX"). */
export function useDocumentTitle(pageName) {
  useEffect(() => {
    document.title = pageName ? `${pageName} · ${APP_NAME}` : APP_NAME
  }, [pageName])
}
