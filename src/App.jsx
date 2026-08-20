import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import FacultyDashboard from './pages/FacultyDashboard'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Loader2 } from 'lucide-react'

function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, isAnonymous, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0f172a] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-3" />
        <p className="text-sm font-bold text-slate-300">Authenticating Raisoni PeerSpace session...</p>
      </div>
    );
  }

  if (!currentUser && !isAnonymous) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && role && role !== requiredRole) {
    return <Navigate to={role === 'faculty' ? '/faculty-dashboard' : '/dashboard'} replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#fff', borderRadius: '12px' } }} />
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requiredRole="student">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/faculty-dashboard" 
            element={
              <ProtectedRoute requiredRole="faculty">
                <FacultyDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
