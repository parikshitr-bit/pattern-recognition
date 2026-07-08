import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import UnansweredWarningModal from '../components/UnansweredWarningModal'
import { fetchQuestions, startSession, submitSession } from '../api'

// ─────────────────────────────────────────────
// Pattern renderers — one per question type
// ─────────────────────────────────────────────
function NumberSequence({ data }) {
    return (
        <div className="flex items-center justify-center gap-2 flex-wrap">
            {data.sequence.map((item, i) => {
                const isQuestion = item === '?'
                return (
                    <div key={i} className="flex items-center gap-2">
                        <div
                            className={[
                                'w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-medium font-mono',
                                isQuestion
                                    ? 'border-2 border-dashed text-purple-400'
                                    : 'bg-white border border-gray-100 text-gray-800 shadow-sm',
                            ].join(' ')}
                            style={isQuestion ? { borderColor: '#534AB7', color: '#534AB7', backgroundColor: '#EEEDFE' } : {}}
                        >
                            {item}
                        </div>
                        {i < data.sequence.length - 1 && (
                            <span className="text-gray-300 text-sm">→</span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function ShapePattern({ data }) {
    return (
        <div className="flex items-center justify-center gap-3 flex-wrap">
            {data.sequence.map((item, i) => {
                const isQuestion = item.count === 0
                return (
                    <div key={i} className="flex items-center gap-3">
                        <div
                            className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1"
                            style={
                                isQuestion
                                    ? { border: '2px dashed #534AB7', backgroundColor: '#EEEDFE' }
                                    : { backgroundColor: '#fff', border: '1px solid #f0f0f0' }
                            }
                        >
                            {isQuestion ? (
                                <span className="text-2xl font-medium" style={{ color: '#534AB7' }}>?</span>
                            ) : (
                                <>
                                    <span className="text-base leading-tight" style={{ color: '#26215C' }}>
                                        {Array(item.count).fill(item.shape).join(' ')}
                                    </span>
                                    <span className="text-xs font-mono text-gray-400">×{item.count}</span>
                                </>
                            )}
                        </div>
                        {i < data.sequence.length - 1 && (
                            <span className="text-gray-300 text-sm">→</span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function MatrixPattern({ data }) {
    return (
        <div className="flex justify-center">
            <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${data.grid[0].length}, 1fr)` }}>
                {data.grid.flat().map((cell, i) => {
                    const isQuestion = cell === '?'
                    return (
                        <div
                            key={i}
                            className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-medium font-mono"
                            style={
                                isQuestion
                                    ? { border: '2px dashed #534AB7', backgroundColor: '#EEEDFE', color: '#534AB7' }
                                    : { backgroundColor: '#fff', border: '1px solid #f0f0f0', color: '#1a1a2e' }
                            }
                        >
                            {cell}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function PatternDisplay({ question }) {
    if (question.type === 'number_sequence') return <NumberSequence data={question.pattern_data} />
    if (question.type === 'shape_pattern') return <ShapePattern data={question.pattern_data} />
    if (question.type === 'matrix') return <MatrixPattern data={question.pattern_data} />
    return null
}

// ─────────────────────────────────────────────
// Timer hook
// ─────────────────────────────────────────────
function useTimer() {
    const [seconds, setSeconds] = useState(0)
    const intervalRef = useRef(null)

    const start = useCallback(() => {
        setSeconds(0)
        clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    }, [])

    const stop = useCallback(() => {
        clearInterval(intervalRef.current)
        return seconds
    }, [seconds])

    useEffect(() => () => clearInterval(intervalRef.current), [])

    return { seconds, start, stop }
}

function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─────────────────────────────────────────────
// Difficulty badge
// ─────────────────────────────────────────────
const DIFFICULTY_STYLE = {
    easy: { color: '#0F6E56', bg: '#E1F5EE' },
    medium: { color: '#7A4F00', bg: '#FFF7E0' },
    hard: { color: '#A32D2D', bg: '#FFF0F0' },
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function AssessmentPage() {
    const navigate = useNavigate()

    // ── State ──────────────────────────────────
    const [questions, setQuestions] = useState([])   // fetched from API
    const [sessionId, setSessionId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState(null)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState({})     // { questionId: optionIndex }
    const [timePerQuestion, setTimePerQuestion] = useState({}) // { questionId: seconds }
    const [attemptsPerQuestion, setAttemptsPerQuestion] = useState({}) // { questionId: count }
    const [totalSeconds, setTotalSeconds] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [showUnanswered, setShowUnanswered] = useState(false)

    const questionTimer = useTimer()
    const totalTimerRef = useRef(null)
    const sessionStartRef = useRef(Date.now())

    const candidateId = (() => {
        try { return JSON.parse(sessionStorage.getItem('candidate'))?.id } catch { return null }
    })()

    // ── Start a session + load its questions on mount ──
    useEffect(() => {
        let cancelled = false
        if (!candidateId) { navigate('/login'); return }
        ;(async () => {
            try {
                const startRes = await startSession(candidateId)
                if (cancelled) return
                setSessionId(startRes.data.sessionId)

                const qRes = await fetchQuestions(candidateId)
                if (cancelled) return
                const mapped = (qRes.data || []).map(q => ({
                    id: q.id,
                    type: q.questionType,
                    question_text: q.questionText,
                    pattern_data: q.patternData,
                    options: q.options,
                    difficulty: q.difficulty,
                }))
                setQuestions(mapped)
                sessionStartRef.current = Date.now()
            } catch (err) {
                if (!cancelled) setLoadError(err.response?.data?.message || 'Could not start the assessment.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()
        return () => { cancelled = true }
    }, [candidateId])

    // ── Total timer ────────────────────────────
    useEffect(() => {
        totalTimerRef.current = setInterval(() => setTotalSeconds(s => s + 1), 1000)
        return () => clearInterval(totalTimerRef.current)
    }, [])

    // ── Per-question timer: restart on question change ──
    useEffect(() => {
        questionTimer.start()
    }, [currentIndex])

    // ── Loading / error / empty guards (after all hooks) ──
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
            <div className="flex flex-col items-center gap-3">
                <span className="w-8 h-8 rounded-full border-2 border-purple-200 animate-spin"
                    style={{ borderTopColor: '#534AB7' }} />
                <p className="text-sm text-gray-400">Preparing your assessment…</p>
            </div>
        </div>
    )

    if (loadError) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
            <div className="text-center flex flex-col gap-3 max-w-sm px-6">
                <p className="text-sm text-gray-600">{loadError}</p>
                <button onClick={() => navigate('/dashboard')}
                    className="text-sm font-medium" style={{ color: '#534AB7' }}>
                    Back to dashboard
                </button>
            </div>
        </div>
    )

    if (!questions.length) return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7f7f8' }}>
            <div className="text-center flex flex-col gap-3">
                <p className="text-sm text-gray-600">No questions are available right now.</p>
                <button onClick={() => navigate('/dashboard')}
                    className="text-sm font-medium" style={{ color: '#534AB7' }}>
                    Back to dashboard
                </button>
            </div>
        </div>
    )

    const current = questions[currentIndex]
    const isLast = currentIndex === questions.length - 1
    const selectedOption = answers[current.id] ?? null

    // ── Select an answer 
    const handleSelect = (optionIndex) => {
        const alreadyAnswered = answers[current.id] !== undefined
        setAnswers(prev => ({ ...prev, [current.id]: optionIndex }))
        setAttemptsPerQuestion(prev => ({
            ...prev,
            [current.id]: (prev[current.id] || 0) + (alreadyAnswered ? 1 : 1),
        }))
    }

    // ── Navigate between questions 
    const saveCurrentTime = () => {
        const elapsed = questionTimer.stop()
        setTimePerQuestion(prev => ({
            ...prev,
            [current.id]: (prev[current.id] || 0) + elapsed,
        }))
    }

    const goNext = () => {
        saveCurrentTime()
        setCurrentIndex(i => i + 1)
    }

    const goPrev = () => {
        saveCurrentTime()
        setCurrentIndex(i => i - 1)
    }

    const handleSubmit = async () => {
        saveCurrentTime()
        setSubmitting(true)

        const totalTime = Math.floor((Date.now() - sessionStartRef.current) / 1000)

        const payload = {
            candidateId,
            totalTimeSeconds: totalTime,
            responses: questions.map(q => ({
                questionId: q.id,
                selectedOptionIndex: answers[q.id] ?? null,
                timeTakenSeconds: timePerQuestion[q.id] || 0,
                attemptCount: attemptsPerQuestion[q.id] || 0,
            })),
        }

        try {
            await submitSession(sessionId, payload)
            // Results and analytics are fetched from the backend by session id.
            navigate(`/results/${sessionId}`)
        } catch (err) {
            setSubmitting(false)
            setLoadError(err.response?.data?.message || 'Failed to submit your assessment. Please try again.')
        }
    }

    // ── Progress ───────────────────────────────
    const answeredCount = Object.keys(answers).length
    const progressPct = ((currentIndex) / questions.length) * 100

    const diff = DIFFICULTY_STYLE[current.difficulty] || DIFFICULTY_STYLE.easy

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f7f7f8' }}>

            {/* ── Top bar ──────────────────────────── */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

                    {/* Brand — minimal */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div
                            className="w-6 h-6 rounded-md flex items-center justify-center"
                            style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="12" cy="12" r="3" />
                                <line x1="12" y1="2" x2="12" y2="6" />
                                <line x1="12" y1="18" x2="12" y2="22" />
                                <line x1="2" y1="12" x2="6" y2="12" />
                                <line x1="18" y1="12" x2="22" y2="12" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-400">PatternIQ</span>
                    </div>

                    {/* Progress — center */}
                    <div className="flex-1 max-w-xs flex flex-col items-center gap-1">
                        <p className="text-xs text-gray-400">
                            Question <span className="font-medium text-gray-700">{currentIndex + 1}</span> of {questions.length}
                            <span className="ml-2 text-gray-300">·</span>
                            <span className="ml-2">{answeredCount} answered</span>
                        </p>
                        <div className="w-full h-1 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${progressPct}%`, backgroundColor: '#534AB7' }}
                            />
                        </div>
                    </div>

                    {/* Timers — right */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* Per-question timer */}
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-mono font-medium text-gray-700">
                                {formatTime(questionTimer.seconds)}
                            </span>
                            <span className="text-[10px] text-gray-400">this question</span>
                        </div>
                        <div className="w-px h-6 bg-gray-100" />
                        {/* Total timer */}
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-mono font-medium" style={{ color: '#534AB7' }}>
                                {formatTime(totalSeconds)}
                            </span>
                            <span className="text-[10px] text-gray-400">total</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Question area ─────────────────────── */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
                <div className="w-full max-w-2xl flex flex-col gap-6">

                    {/* Question card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col gap-8 shadow-sm">

                        {/* Question header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex flex-col gap-1.5">
                                <p className="text-[10px] font-medium tracking-widest uppercase text-gray-400">
                                    Pattern {currentIndex + 1}
                                </p>
                                <h2 className="text-base font-medium text-gray-800">
                                    {current.question_text}
                                </h2>
                            </div>
                            <span
                                className="text-[10px] font-medium px-2 py-1 rounded-md flex-shrink-0"
                                style={{ color: diff.color, backgroundColor: diff.bg }}
                            >
                                {current.difficulty}
                            </span>
                        </div>

                        {/* Pattern display */}
                        <div
                            className="rounded-xl p-6 flex items-center justify-center min-h-28"
                            style={{ backgroundColor: '#f7f7f8' }}
                        >
                            <PatternDisplay question={current} />
                        </div>

                        {/* Answer options — 2×2 grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {current.options.map((option, i) => {
                                const isSelected = selectedOption === i
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleSelect(i)}
                                        className="h-14 rounded-xl border text-sm font-medium font-mono
                               transition-all duration-150 active:scale-[0.98]"
                                        style={
                                            isSelected
                                                ? { backgroundColor: '#EEEDFE', borderColor: '#534AB7', color: '#534AB7', borderWidth: '1.5px' }
                                                : { backgroundColor: '#fff', borderColor: '#e5e7eb', color: '#374151' }
                                        }
                                    >
                                        <span className="mr-2 text-[10px] font-normal opacity-50">
                                            {String.fromCharCode(65 + i)}
                                        </span>
                                        {option}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="flex items-center justify-between">

                        {/* Previous */}
                        <button
                            onClick={goPrev}
                            disabled={currentIndex === 0}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                         border border-gray-200 text-gray-500 bg-white transition-all
                         disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-300"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Previous
                        </button>

                        {/* Attempt indicator — center */}
                        <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs font-mono text-gray-400">
                                {attemptsPerQuestion[current.id]
                                    ? `${attemptsPerQuestion[current.id]} attempt${attemptsPerQuestion[current.id] > 1 ? 's' : ''}`
                                    : 'Not answered'}
                            </span>
                            {/* Dot indicators for all questions */}
                            <div className="flex gap-1 mt-0.5">
                                {questions.map((q, i) => (
                                    <div
                                        key={q.id}
                                        className="w-1.5 h-1.5 rounded-full transition-all"
                                        style={{
                                            backgroundColor:
                                                i === currentIndex ? '#534AB7'
                                                    : answers[q.id] !== undefined ? '#1D9E75'
                                                        : '#e5e7eb',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Next / Submit */}
                        {isLast ? (
                            <button
                                onClick={() => {
                                    const unanswered = questions.filter(q => answers[q.id] === undefined).length
                                    if (unanswered > 0) {
                                        setShowUnanswered(true)
                                    } else {
                                        handleSubmit()           // all answered, submit directly
                                    }
                                }}
                                disabled={submitting}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                           text-white transition-all active:scale-[0.98] disabled:opacity-70"
                                style={{ backgroundColor: '#1D9E75' }}
                                onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#0F6E56' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1D9E75' }}
                            >
                                {submitting ? (
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                ) : (
                                    <>
                                        Submit assessment
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={goNext}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                           text-white transition-all active:scale-[0.98]"
                                style={{ backgroundColor: '#534AB7' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3C3489'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#534AB7'}
                            >
                                Next
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </button>
                        )}
                    </div>

                </div>
            </main>
            {showUnanswered && (
                <UnansweredWarningModal
                    unansweredCount={questions.filter(q => answers[q.id] === undefined).length}
                    onConfirm={() => { setShowUnanswered(false); handleSubmit() }}
                    onClose={() => setShowUnanswered(false)}
                />
            )}
        </div>
    )
}