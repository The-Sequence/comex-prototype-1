/** Loading / error placeholder for lists fetched from the live backend. */
export default function ListState({ status, error, onRetry }) {
  if (status === 'loading') return <p className="py-8 text-center text-sm text-gray-500" role="status">Loading…</p>
  if (status !== 'error') return null
  return (
    <div className="rounded border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700" role="alert">
      <p>{error}</p>
      <button onClick={onRetry} className="mt-2 font-semibold underline">
        Try again
      </button>
    </div>
  )
}
