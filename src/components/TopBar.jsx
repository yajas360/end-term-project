import { useState, useCallback, useRef, useEffect } from 'react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useMedication } from '../context/MedicationContext';
import { format } from 'date-fns';

export default function TopBar({ onMenuToggle }) {
  const { notifications, dismissNotification, todayProgress } = useMedication();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifsRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const now = new Date();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(15,15,26,0.8)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
      padding: '0 24px',
      height: 64,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {/* Left: hamburger + date */}
      <div className="flex items-center gap-4">
        <button
          className="btn btn-ghost btn-icon"
          onClick={onMenuToggle}
          style={{ display: 'none' }}
          id="mobile-menu-btn"
        >
          <Bars3Icon style={{ width: 20, height: 20 }} />
        </button>
        <style>{`
          @media (max-width: 768px) {
            #mobile-menu-btn { display: flex !important; }
          }
        `}</style>

        <div>
          <div className="text-sm font-semibold text-white">
            {format(now, 'EEEE, MMMM d')}
          </div>
          <div className="text-xs text-muted">
            {format(now, 'yyyy')}
          </div>
        </div>
      </div>

      {/* Center: Progress pill */}
      <div className="flex items-center gap-3 hide-mobile">
        <div style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-full)',
          padding: '6px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div className="progress-bar-track" style={{ width: 100 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${todayProgress.percent}%`,
                background: todayProgress.percent === 100
                  ? 'var(--accent-500)'
                  : 'linear-gradient(90deg, var(--primary-500), var(--accent-500))',
              }}
            />
          </div>
          <span className="text-sm font-semibold text-white">
            {todayProgress.taken}/{todayProgress.total}
          </span>
          <span className="text-xs text-muted">doses today</span>
        </div>
      </div>

      {/* Right: Notifications */}
      <div className="flex items-center gap-2" ref={notifsRef}>
        <div className="relative">
          <button
            id="notif-bell"
            className="btn btn-ghost btn-icon"
            onClick={() => setShowNotifs((s) => !s)}
            style={{ position: 'relative' }}
          >
            <BellIcon style={{ width: 20, height: 20 }} />
            {notifications.length > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--danger-500)',
                fontSize: '0.65rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff',
              }}>
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="animate-scale-in" style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 340, maxHeight: 420,
              background: 'var(--neutral-800)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden', zIndex: 200,
            }}>
              <div style={{
                padding: '14px 16px', borderBottom: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span className="font-semibold text-white text-sm">Notifications</span>
                {notifications.length > 0 && (
                  <button
                    className="text-xs text-muted"
                    onClick={() => notifications.forEach(n => dismissNotification(n.id))}
                    style={{ cursor: 'pointer' }}
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div style={{ overflowY: 'auto', maxHeight: 340 }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--neutral-400)', fontSize: '0.875rem' }}>
                    🎉 All caught up!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex', gap: 12, alignItems: 'flex-start',
                      }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                        background: n.type === 'overdue' ? 'var(--danger-500)' : 'var(--warning-400)',
                      }} />
                      <div style={{ flex: 1 }}>
                        <div className="text-sm font-semibold text-white">{n.title}</div>
                        <div className="text-xs text-muted">{n.message}</div>
                      </div>
                      <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => dismissNotification(n.id)}
                        style={{ padding: 4 }}
                      >
                        <XMarkIcon style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
