import api from './axiosInstance'

// Auth
export const loginCandidate = (username, password) =>
  api.post('/auth/login', { username, password })

// Questions
export const fetchQuestions = () =>
  api.get('/questions')

// Sessions
export const startSession = (candidateId) =>
  api.post('/sessions/start', { candidateId })

export const submitSession = (sessionId, payload) =>
  api.post(`/sessions/${sessionId}/submit`, payload)

export const fetchResult = (sessionId) =>
  api.get(`/sessions/${sessionId}/result`)

export const fetchAnalytics = (sessionId) =>
  api.get(`/sessions/${sessionId}/analytics`)