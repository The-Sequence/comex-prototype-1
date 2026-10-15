import * as db from '../lib/db'
import { Alert } from './Form'

/** Shown on the account screens when no live backend is configured. */
export default function BackendNotice() {
  if (db.backendMode === 'live') return null
  return <Alert>The COMEX account service is not configured, so accounts cannot be created or used right now.</Alert>
}
