import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LogoutModal from './Logoutmodal'

export default function Navbar({ showBack = false }) {
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)

  const candidate = (() => {
    try { return JSON.parse(sessionStorage.getItem('candidate')) } catch { return null }
  })()
  const firstName = candidate?.name?.split(' ')[0] || 'Candidate'

  return (
    <>
      <nav
        className="flex items-center justify-between px-8 py-4 border-b border-white/10"
        style={{ backgroundColor: '#26215C' }}
      >
        {/* Brand */}
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

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Back button — only on analytics page */}
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: '#7F77DD' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to results
            </button>
          )}

          {/* Candidate avatar + name */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ backgroundColor: '#534AB7', color: '#CECBF6' }}
            >
              {firstName[0].toUpperCase()}
            </div>
            <span className="text-sm" style={{ color: '#AFA9EC' }}>{firstName}</span>
          </div>

          {/* Sign out */}
          <button
            onClick={() => setShowLogout(true)}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#7F77DD', border: '0.5px solid #3C3489' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3C3489'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Sign out
          </button>
        </div>
      </nav>

      {showLogout && <LogoutModal onClose={() => setShowLogout(false)} />}
    </>
  )
}