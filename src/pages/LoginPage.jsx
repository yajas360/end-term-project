import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const validate = (v) => {
  const e = {};
  if (!v.email) e.email = 'Email is required';
  if (!v.password) e.password = 'Password is required';
  return e;
};

export default function LoginPage() {
  const { login, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const form = useForm({ email: '', password: '' }, validate);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values.email, values.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err.message || 'Login failed';
      toast.error(msg);
    }
  });

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch {
      toast.error('Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) return toast.error('Enter your email first');
    try {
      await resetPassword(resetEmail);
      toast.success('Password reset email sent!');
      setShowReset(false);
    } catch {
      toast.error('Failed to send reset email');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
      <div className="app-bg" />

      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div className="text-center mb-6 animate-fade-in">
          <div style={{
            width: 60, height: 60,
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', animation: 'float 3s ease-in-out infinite',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
              <path d="M10.5 3H13.5V10.5H21V13.5H13.5V21H10.5V13.5H3V10.5H10.5V3Z" />
            </svg>
          </div>
          <h1 className="text-display font-extrabold text-white text-3xl">
            MedTrack <span className="gradient-text">AI</span>
          </h1>
          <p className="text-sm text-muted mt-1">Safe medication management powered by FDA data</p>
        </div>

        <div className="glass-card-elevated animate-scale-in" style={{ padding: 32 }}>
          <h2 className="text-xl font-bold text-white mb-6">Sign in to your account</h2>

          {/* Google */}
          <button
            id="google-login-btn"
            className="btn btn-secondary w-full mb-4"
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{ gap: 10, fontSize: '0.9rem' }}
          >
            {googleLoading ? <div className="spinner spinner-sm" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span className="text-xs text-muted">or with email</span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                className="form-input"
                value={form.values.email}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {form.touched.email && form.errors.email && (
                <span className="form-error">{form.errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <div className="flex justify-between">
                <label className="form-label" htmlFor="login-password">Password</label>
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  style={{ fontSize: '0.75rem', color: 'var(--primary-400)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  value={form.values.password}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  placeholder="Your password"
                  autoComplete="current-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)', cursor: 'pointer' }}
                >
                  {showPw ? <EyeSlashIcon style={{ width: 16, height: 16 }} /> : <EyeIcon style={{ width: 16, height: 16 }} />}
                </button>
              </div>
              {form.touched.password && form.errors.password && (
                <span className="form-error">{form.errors.password}</span>
              )}
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg w-full mt-1"
              disabled={form.submitting}
            >
              {form.submitting ? <><div className="spinner spinner-sm" />Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-4">
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--primary-400)', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>

        {/* Footer badges */}
        <div className="flex justify-center gap-3 mt-4 flex-wrap">
          {['🔒 HIPAA Aware', '🧪 FDA Data', '⚡ Real-time Alerts'].map((badge) => (
            <span key={badge} style={{
              fontSize: '0.72rem', color: 'var(--neutral-400)',
              padding: '3px 10px', borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--glass-border)',
            }}>{badge}</span>
          ))}
        </div>
      </div>

      {/* Password reset mini-modal */}
      {showReset && (
        <div className="modal-overlay">
          <div className="glass-card-elevated animate-scale-in" style={{ padding: 28, maxWidth: 360, width: '100%' }}>
            <h3 className="text-lg font-bold text-white mb-3">Reset Password</h3>
            <p className="text-sm text-muted mb-4">Enter your email to receive a reset link.</p>
            <input
              id="reset-email"
              type="email"
              className="form-input w-full mb-3"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <div className="flex gap-2 justify-end">
              <button className="btn btn-secondary" onClick={() => setShowReset(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleResetPassword}>Send Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
