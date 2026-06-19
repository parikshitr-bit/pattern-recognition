import { useNavigate } from 'react-router-dom'

const STATS = [
    { value: '10', label: 'Questions' },
    { value: '20m', label: 'Duration' },
    { value: '100', label: 'Max score' },
    { value: '1x', label: 'Attempt' },
]

const INSTRUCTIONS = [
    {
        step: '01',
        title: 'Read each pattern carefully',
        desc: 'Each question presents a sequence or pattern. Take a moment to study it before answering.',
    },
    {
        step: '02',
        title: 'Select your answer',
        desc: 'Choose the option that best completes or continues the pattern. Only one answer is correct.',
    },
    {
        step: '03',
        title: 'Watch the timer',
        desc: 'Time taken per question is recorded as part of your behavioral metrics. Stay focused.',
    },
    {
        step: '04',
        title: 'Submit to see results',
        desc: 'After the last question, your score, accuracy, and detailed analytics will be generated.',
    },
]

const SCORING = [
    { label: 'Correct answer', points: '+10 pts', color: '#1D9E75', bg: '#E1F5EE' },
    { label: 'Wrong answer', points: '0 pts', color: '#A32D2D', bg: '#FFF0F0' },
    { label: 'Time bonus', points: 'up to +5 pts', color: '#534AB7', bg: '#EEEDFE' },
]

export default function Dashboard() {
    const navigate = useNavigate()

    // Get candidate name from sessionStorage (set during login)
    const candidate = (() => {
        try { return JSON.parse(sessionStorage.getItem('candidate')) } catch { return null }
    })()
    const firstName = candidate?.name?.split(' ')[0] || candidate?.username || 'Candidate'

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* ── Navbar ── */}
            <nav
                className="flex items-center justify-between px-8 py-4 border-b border-white/10"
                style={{ backgroundColor: '#26215C' }}
            >
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
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
                    <span className="text-sm font-medium" style={{ color: '#EEEDFE' }}>PatternIQ</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}
                        >
                            {firstName[0].toUpperCase()}
                        </div>
                        <span className="text-sm" style={{ color: '#AFA9EC' }}>{firstName}</span>
                    </div>
                    <button
                        onClick={() => {
                            sessionStorage.clear()
                            navigate('/login')
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ color: '#7F77DD', border: '0.5px solid #3C3489' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3C3489'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        Sign out
                    </button>
                </div>
            </nav>

            {/* ── Main content ── */}
            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium tracking-widest uppercase" style={{ color: '#1D9E75' }}>
                        Ready to begin
                    </p>
                    <h1 className="text-2xl font-medium text-gray-900">
                        Welcome, {firstName}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Review the assessment details below before you start.
                    </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {STATS.map(({ value, label }) => (
                        <div
                            key={label}
                            className="flex flex-col gap-1 px-5 py-4 rounded-2xl border border-gray-100 bg-white"
                        >
                            <span
                                className="text-2xl font-medium font-mono"
                                style={{ color: '#26215C' }}
                            >
                                {value}
                            </span>
                            <span className="text-xs text-gray-400">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Two-col layout: Instructions + Scoring */}
                <div className="grid md:grid-cols-[1fr_300px] gap-6">

                    {/* Instructions */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-2">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <h2 className="text-sm font-medium text-gray-700">How it works</h2>
                        </div>

                        <ol className="flex flex-col gap-5 list-none">
                            {INSTRUCTIONS.map(({ step, title, desc }) => (
                                <li key={step} className="flex gap-4">
                                    <span
                                        className="text-xs font-medium font-mono mt-0.5 flex-shrink-0 w-6"
                                        style={{ color: '#AFA9EC' }}
                                    >
                                        {step}
                                    </span>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm font-medium text-gray-800">{title}</p>
                                        <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Right column */}
                    <div className="flex flex-col gap-4">

                        {/* Scoring */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="#534AB7" strokeWidth="1.8" strokeLinecap="round">
                                    <line x1="18" y1="20" x2="18" y2="10" />
                                    <line x1="12" y1="20" x2="12" y2="4" />
                                    <line x1="6" y1="20" x2="6" y2="14" />
                                </svg>
                                <h2 className="text-sm font-medium text-gray-700">Scoring</h2>
                            </div>
                            <div className="flex flex-col gap-2">
                                {SCORING.map(({ label, points, color, bg }) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">{label}</span>
                                        <span
                                            className="text-xs font-medium font-mono px-2 py-0.5 rounded-md"
                                            style={{ color, backgroundColor: bg }}
                                        >
                                            {points}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Important note */}
                        <div
                            className="rounded-2xl p-5 flex flex-col gap-2"
                            style={{ backgroundColor: '#EEEDFE' }}
                        >
                            <div className="flex items-center gap-2">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                    stroke="#534AB7" strokeWidth="2" strokeLinecap="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                                <p className="text-xs font-medium" style={{ color: '#3C3489' }}>
                                    Before you start
                                </p>
                            </div>
                            <ul className="flex flex-col gap-1.5 list-none">
                                {[
                                    'Assessment cannot be paused once started',
                                    'Ensure a stable internet connection',
                                    'Find a quiet, distraction-free space',
                                ].map((note) => (
                                    <li key={note} className="flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: '#7F77DD' }} />
                                        <span className="text-xs leading-relaxed" style={{ color: '#534AB7' }}>{note}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                    </div>
                </div>

                {/* Start CTA */}
                <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-gray-800">Ready to test your pattern recognition?</p>
                        <p className="text-xs text-gray-400">Your time starts as soon as you click begin.</p>
                    </div>
                    <button
                        onClick={() => navigate('/assessment')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium
                       text-white transition-all active:scale-[0.98] flex-shrink-0"
                        style={{ backgroundColor: '#534AB7' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3C3489'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#534AB7'}
                    >
                        Begin assessment
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                </div>

            </main>
        </div>
    )
}