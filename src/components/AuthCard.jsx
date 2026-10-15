import logo from '../assets/comex-logo.png'
import background from '../assets/auth-bg.jpg'

/** White card on the blurred campus backdrop — the shell of Frames 1–6. */
export default function AuthCard({ title, subtitle, children, wide = false }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="auth-backdrop" style={{ backgroundImage: `url(${background})` }} aria-hidden="true" />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className={`w-full ${wide ? 'max-w-md' : 'max-w-sm'} rounded-sm bg-white px-7 py-8 shadow-2xl`}>
          <img src={logo} alt="NU Fairview Community Extension Office" className="mx-auto mb-5 h-12 w-auto" />
          {title && <h1 className="text-center text-xl font-extrabold tracking-tight text-gray-900">{title}</h1>}
          {subtitle && <p className="mt-1 text-center text-xs text-gray-600">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </div>
      </main>
    </div>
  )
}
