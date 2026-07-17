import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking') // checking | valid | invalid

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setStatus('invalid')
      return
    }

    axios
      .get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => setStatus('valid'))
      .catch(() => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setStatus('invalid')
      })
  }, [])

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex items-center gap-3 text-primary">
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-base font-semibold">Verifying session...</span>
        </div>
      </div>
    )
  }

  if (status === 'invalid') {
    return <Navigate to="/auth" replace />
  }

  return children
}
