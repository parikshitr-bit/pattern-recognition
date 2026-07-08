import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useState } from 'react'
import StartAssessmentModal from '../components/StartAssessmentModal'

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

const STATS = [
    { value: '10', label: 'Questions' },
    { value: '20m', label: 'Duration' },
    { value: '100', label: 'Max score' },
    { value: '1x', label: 'Attempt' },
]

const WARNINGS = [
    'Assessment cannot be paused once started',
    'Ensure a stable internet connection',
    'Find a quiet, distraction-free space',
]

export default function InstructionsPage() {
    const navigate = useNavigate()
    const [showStart, setShowStart] = useState(false)

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f7f8' }}>
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col gap-8">

                {/* Header */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium tracking-widest uppercase"
                        style={{ color: '#1D9E75' }}>
                        Before you begin
                    </p>
                    <h1 className="text-2xl font-medium text-gray-900">Assessment overview</h1>
                    <p className="text-sm text-gray-500">
                        Read through the instructions carefully before starting.
                    </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {STATS.map(({ value, label }) => (
                        <div key={label}
                            className="flex flex-col gap-1 px-5 py-4 rounded-2xl border border-gray-100 bg-white">
                            <span className="text-2xl font-medium font-mono" style={{ color: '#26215C' }}>
                                {value}
                            </span>
                            <span className="text-xs text-gray-400">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Two-col: instructions + right column */}
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
                                    <span className="text-xs font-medium font-mono mt-0.5 flex-shrink-0 w-6"
                                        style={{ color: '#AFA9EC' }}>
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
                                        <span className="text-xs font-medium font-mono px-2 py-0.5 rounded-md"
                                            style={{ color, backgroundColor: bg }}>
                                            {points}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Begin CTA */}
                <div className="flex items-center justify-between bg-white rounded-2xl
                        border border-gray-100 px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-gray-800">
                            Ready to test your pattern recognition?
                        </p>
                        <p className="text-xs text-gray-400">
                            Your time starts as soon as you click begin.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                            Go back
                        </button>
                        <button
                            onClick={() => setShowStart(true)}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium
                         text-white transition-all active:scale-[0.98]"
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
                </div>
                {showStart && <StartAssessmentModal onClose={() => setShowStart(false)} />}
            </main>
        </div>
    )
}