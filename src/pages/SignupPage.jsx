import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const validate = (v) => {
  const e = {};
  if (!v.email) e.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(v.email)) e.email = 'Invalid email';
  if (!v.password) e.password = 'Password is required';
  if (!v.displayName) e.displayName = 'Your name is required';
  if (v.password && v.password.length < 6) e.password = 'Password must be at least 6 characters';
  if (v.confirmPassword !== v.password) e.confirmPassword = 'Passwords do not match';
  return e;
};

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const form = useForm(
    { displayName: '', email: '', password: '', confirmPassword: '' },
    validate
  );

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await signup(values.email, values.password, values.displayName);
      toast.success('Account created! Welcome to MedTrack AI 🎉');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Email already in use'
        : err.message || 'Signup failed';
      toast.error(msg);
    }
  });

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      toast.success('Welcome to MedTrack AI!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', zIndex: 1 }}>
      <div className="app-bg" />

      <div style={{ width: '100%', maxWidth: 480 }}>
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
          <p className="text-sm text-muted mt-1">Your intelligent medication safety companion</p>
        </div>

        {/* Card */}
        <div className="glass-card-elevated animate-scale-in" style={{ padding: 32 }}>
          <h2 className="text-xl font-bold text-white mb-6">Create your account</h2>

          {/* Google */}
          <button
            id="google-signup-btn"
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
              <label className="form-label" htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                name="displayName"
                className="form-input"
                value={form.values.displayName}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="Your full name"
              />
              {form.touched.displayName && form.errors.displayName && (
                <span className="form-error">{form.errors.displayName}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                className="form-input"
                value={form.values.email}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="you@example.com"
              />
              {form.touched.email && form.errors.email && (
                <span className="form-error">{form.errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  name="password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input"
                  value={form.values.password}
                  onChange={form.handleChange}
                  onBlur={form.handleBlur}
                  placeholder="Min. 6 characters"
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

            <div className="form-group">
              <label className="form-label" htmlFor="signup-confirm">Confirm Password</label>
              <input
                id="signup-confirm"
                name="confirmPassword"
                type="password"
                className="form-input"
                value={form.values.confirmPassword}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="Repeat your password"
              />
              {form.touched.confirmPassword && form.errors.confirmPassword && (
                <span className="form-error">{form.errors.confirmPassword}</span>
              )}
            </div>

            {/* Privacy note */}
            <div style={{
              padding: '10px 12px', borderRadius: 'var(--radius-sm)',
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <ShieldCheckIcon style={{ width: 16, height: 16, color: 'var(--primary-400)', flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--neutral-300)', lineHeight: 1.5 }}>
                Your health data is encrypted and stored securely. We never sell your personal information.
              </span>
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg w-full mt-1"
              disabled={form.submitting}
            >
              {form.submitting ? <><div className="spinner spinner-sm" />Creating Account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-4">
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-400)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
