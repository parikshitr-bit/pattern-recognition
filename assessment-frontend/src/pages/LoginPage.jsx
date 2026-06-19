import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
// import { loginCandidate } from '../api'

const loginCandidate = async (username, password) => {
  if (username === 'candidate1' && password === 'test123') {
    return { data: { candidate: { id: 1, name: 'Candidate 1', username }, token: 'mock-token-abc123' } }
  }
  throw { response: { data: { message: 'Invalid credentials. Try candidate1 / test123.' } } }
}

const FEATURES = [
    {
        iconLabel: 'adaptive',
        title: 'Adaptive challenges',
        subtitle: '10 pattern-based questions',
    },
    {
        iconLabel: 'tracking',
        title: 'Behavioral tracking',
        subtitle: 'Time & attempts per question',
    },
    {
        iconLabel: 'analytics',
        title: 'Performance analytics',
        subtitle: 'Detailed results & insights',
    },
]

function FeatureIcon({ iconLabel }) {
    if (iconLabel === 'adaptive') return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
    if (iconLabel === 'tracking') return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    )
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    )
}

export default function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuth()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password.')
            return
        }
        setLoading(true)
        try {
            const { data } = await loginCandidate(username.trim(), password)
            login(data.candidate, data.token)
            navigate('/dashboard')
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Invalid credentials. Try candidate1 / test123.'
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-50">

            {/* ── Left panel ── */}
            <aside
                aria-label="Assessment overview"
                className="hidden md:flex w-[46%] flex-col justify-center px-14 py-16
                   bg-purple-900 relative overflow-hidden"
                style={{ backgroundColor: '#26215C' }}
            >
                {/* Dot grid background */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(83,74,183,0.45) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                <div className="relative z-10 flex flex-col gap-10">

                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="12" cy="12" r="3" />
                                <line x1="12" y1="2" x2="12" y2="6" />
                                <line x1="12" y1="18" x2="12" y2="22" />
                                <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
                                <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
                                <line x1="2" y1="12" x2="6" y2="12" />
                                <line x1="18" y1="12" x2="22" y2="12" />
                                <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" />
                                <line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium" style={{ color: '#EEEDFE' }}>PatternIQ</p>
                            <p className="text-xs" style={{ color: '#7F77DD' }}>Assessment platform</p>
                        </div>
                    </div>

                    {/* Hero text */}
                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#1D9E75' }}>
                            Candidate assessment
                        </p>
                        <h1 className="text-3xl font-medium leading-snug" style={{ color: '#EEEDFE' }}>
                            Test your logical<br />reasoning skills
                        </h1>
                        <p className="text-sm leading-relaxed" style={{ color: '#AFA9EC' }}>
                            Identify sequences, complete patterns, and demonstrate
                            analytical thinking across adaptive challenges.
                        </p>
                    </div>

                    {/* Features */}
                    <ul className="flex flex-col gap-5 list-none">
                        {FEATURES.map((f) => (
                            <li key={f.title} className="flex items-start gap-4">
                                <div
                                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{ backgroundColor: '#3C3489', color: '#AFA9EC' }}
                                >
                                    <FeatureIcon iconLabel={f.iconLabel} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: '#CECBF6' }}>{f.title}</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#7F77DD' }}>{f.subtitle}</p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Stats */}
                    <div
                        className="flex gap-8 pt-6 border-t"
                        style={{ borderColor: '#3C3489' }}
                    >
                        {[['10', 'questions'], ['~20m', 'duration'], ['100', 'max score']].map(([val, lbl]) => (
                            <div key={lbl} className="flex flex-col gap-0.5">
                                <span className="text-xl font-medium font-mono" style={{ color: '#EEEDFE' }}>{val}</span>
                                <span className="text-xs" style={{ color: '#7F77DD' }}>{lbl}</span>
                            </div>
                        ))}
                    </div>

                </div>
            </aside>

            {/* ── Right panel ── */}
            <main className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
                <div className="w-full max-w-sm flex flex-col gap-8">

                    {/* Mobile brand (shown only on small screens) */}
                    <div className="flex md:hidden items-center gap-3 mb-2">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="12" cy="12" r="3" />
                                <line x1="12" y1="2" x2="12" y2="6" />
                                <line x1="12" y1="18" x2="12" y2="22" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">PatternIQ</p>
                    </div>

                    {/* Form header */}
                    <div className="flex flex-col gap-1.5">
                        <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#1D9E75' }}>
                            Candidate login
                        </p>
                        <h2 className="text-2xl font-medium text-gray-900">Welcome back</h2>
                        <p className="text-sm text-gray-500">Enter your credentials to begin</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

                        {/* Username */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="username" className="text-xs font-medium text-gray-500">
                                Username
                            </label>
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"
                                >
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                    autoFocus
                                    className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 text-sm
                             text-gray-900 placeholder-gray-400 outline-none bg-white
                             hover:border-purple-300 focus:border-purple-600
                             focus:ring-2 focus:ring-purple-100 transition-all"
                                    style={{ '--tw-ring-color': '#EEEDFE' }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="password" className="text-xs font-medium text-gray-500">
                                Password
                            </label>
                            <div className="relative">
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"
                                >
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    id="password"
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    className="w-full h-11 pl-9 pr-11 rounded-xl border border-gray-200 text-sm
                             text-gray-900 placeholder-gray-400 outline-none bg-white
                             hover:border-purple-300 focus:border-purple-600
                             focus:ring-2 focus:ring-purple-100 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    aria-label={showPass ? 'Hide password' : 'Show password'}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-600 p-1 rounded transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        {showPass ? (
                                            <>
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </>
                                        ) : (
                                            <>
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </>
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div
                                role="alert"
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm border"
                                style={{ background: '#FFF0F0', borderColor: '#F7C1C1', color: '#A32D2D' }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            aria-busy={loading}
                            className="mt-1 h-11 flex items-center justify-center gap-2 rounded-xl
                         text-sm font-medium text-white transition-all active:scale-[0.98]
                         disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{ backgroundColor: loading ? '#534AB7' : '#534AB7' }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#3C3489' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#534AB7' }}
                        >
                            {loading ? (
                                <span
                                    className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"
                                    aria-label="Signing in…"
                                />
                            ) : (
                                <>
                                    Start assessment
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Mock credentials */}
                    <div
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs"
                        style={{ backgroundColor: '#E1F5EE', color: '#0F6E56' }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>Mock credentials:</span>
                        <code className="font-mono font-medium">candidate1 / test123</code>
                    </div>

                </div>
            </main>
        </div>
    )
}