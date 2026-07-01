import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import AssessmentPage from './pages/AssessmentPage'
import ResultPage from './pages/ResultPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ProtectedRoute from './components/ProtectedRoute'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/assessment" element={
          <ProtectedRoute><AssessmentPage /></ProtectedRoute>
        } />
        <Route path="/results/:sessionId" element={
          <ProtectedRoute><ResultPage /></ProtectedRoute>
        } />
        <Route path="/analytics/:sessionId" element={
          <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}