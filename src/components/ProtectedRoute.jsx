import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — redirects to /login if user is not authenticated
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-fullscreen">
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            animation: 'float 2s ease-in-out infinite',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M10.5 3H13.5V10.5H21V13.5H13.5V21H10.5V13.5H3V10.5H10.5V3Z" />
            </svg>
          </div>
          <div className="text-display font-bold text-white text-xl mb-1">MedTrack AI</div>
          <div className="text-sm text-muted">Loading your health data...</div>
          <div className="spinner" style={{ margin: '20px auto 0' }} />
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
