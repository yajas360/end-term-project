import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMedication } from '../context/MedicationContext';
import { format, subDays } from 'date-fns';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  ShieldExclamationIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import InteractionAlert from '../components/InteractionAlert';

// Custom tooltip for chart
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--neutral-800)', border: '1px solid var(--glass-border)',
      borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem',
    }}>
      <div className="text-muted mb-1">{label}</div>
      <div className="text-white font-semibold">{payload[0]?.value} doses taken</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    medications, todayLogs, allLogs, interactions, severeInteractions,
    todayProgress, lowStockMeds, notifications, loadingMeds,
  } = useMedication();

  const activeMeds = medications.filter((m) => m.status === 'active');

  // Build last 7 days adherence chart data
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = allLogs.filter((l) => l.date === dateStr).length;
      return { day: format(date, 'EEE'), doses: count };
    });
  }, [allLogs]);

  const adherenceRate = useMemo(() => {
    const total7 = activeMeds.reduce((acc, m) => acc + (m.schedule?.length || 0) * 7, 0);
    const taken7 = allLogs.filter((l) => {
      const d = l.date || (l.takenAt?.toDate ? format(l.takenAt.toDate(), 'yyyy-MM-dd') : null);
      if (!d) return false;
      const diff = (new Date() - new Date(d)) / 86400000;
      return diff <= 7;
    }).length;
    return total7 > 0 ? Math.round((taken7 / total7) * 100) : 0;
  }, [allLogs, activeMeds]);

  const stats = [
    {
      label: 'Active Medications',
      value: activeMeds.length,
      icon: ClipboardDocumentListIcon,
      color: 'var(--primary-500)',
      bg: 'rgba(99,102,241,0.15)',
      link: '/medications',
    },
    {
      label: "Today's Progress",
      value: `${todayProgress.percent}%`,
      icon: CheckCircleIcon,
      color: 'var(--accent-500)',
      bg: 'rgba(16,185,129,0.15)',
      link: '/tracker',
    },
    {
      label: 'Interactions Detected',
      value: interactions.length,
      icon: ShieldExclamationIcon,
      color: interactions.length > 0 ? 'var(--danger-400)' : 'var(--accent-500)',
      bg: interactions.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
      link: '/interactions',
    },
    {
      label: '7-Day Adherence',
      value: `${adherenceRate}%`,
      icon: ArrowTrendingUpIcon,
      color: adherenceRate >= 80 ? 'var(--accent-500)' : 'var(--warning-400)',
      bg: adherenceRate >= 80 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
      link: '/reports',
    },
  ];

  if (loadingMeds) {
    return (
      <div className="loading-fullscreen">
        <div className="spinner" />
        <span className="text-muted text-sm">Loading your medications...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Greeting */}
      <div className="animate-fade-in mb-6">
        <h1 className="text-display font-extrabold text-white text-3xl">
          Good {getTimeOfDay()}, <span className="gradient-text">{user?.displayName?.split(' ')[0] || 'there'}</span> 👋
        </h1>
        <p className="text-muted mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")} · Here's your medication overview
        </p>
      </div>

      {/* Severe Interaction Banner */}
      {severeInteractions.length > 0 && (
        <div className="animate-fade-in glass-card mb-6" style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.4)',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <ShieldExclamationIcon style={{ width: 24, height: 24, color: 'var(--danger-400)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="font-bold text-danger" style={{ color: 'var(--danger-400)' }}>
              ⚠️ {severeInteractions.length} Severe Drug Interaction{severeInteractions.length > 1 ? 's' : ''} Detected
            </div>
            <div className="text-sm text-muted">
              Please consult your doctor immediately about your current medication combination.
            </div>
          </div>
          <Link to="/interactions" className="btn btn-danger btn-sm" style={{ flexShrink: 0 }}>
            Review
          </Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-4 gap-4 mb-6 stagger">
        {stats.map((s) => (
          <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
            <div className="glass-card stat-card animate-fade-in" style={{ cursor: 'pointer' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="stat-icon" style={{ background: s.bg }}>
                  <s.icon style={{ width: 20, height: 20, color: s.color }} />
                </div>
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="text-sm text-muted">{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 360px' }}>

        {/* Left: Today's Dose Timeline + Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 7-Day Chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-base">7-Day Adherence Trend</h2>
              <span className="badge badge-primary">{adherenceRate}% avg</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="doseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" tick={{ fill: '#6b6b9a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b6b9a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="doses"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#doseGrad)"
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Today's Schedule */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-base">Today's Schedule</h2>
              <Link to="/tracker" className="text-xs text-primary" style={{ color: 'var(--primary-400)' }}>
                View Full Tracker →
              </Link>
            </div>

            {activeMeds.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <BeakerIcon style={{ width: 28, height: 28 }} />
                </div>
                <div className="text-sm text-muted">No active medications</div>
                <Link to="/medications" className="btn btn-primary btn-sm">Add Medication</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeMeds
                  .flatMap((med) =>
                    (med.schedule || []).map((time) => ({ med, time }))
                  )
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map(({ med, time }) => {
                    const taken = todayLogs.some(
                      (l) => l.medicationId === med.id && l.scheduledTime === time
                    );
                    return (
                      <div
                        key={`${med.id}-${time}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 14px',
                          background: taken ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${taken ? 'rgba(16,185,129,0.2)' : 'var(--glass-border)'}`,
                        }}
                      >
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: taken ? 'var(--accent-500)' : 'transparent',
                          border: `2px solid ${taken ? 'var(--accent-500)' : 'var(--neutral-600)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {taken && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>}
                        </div>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: med.color || 'var(--primary-500)', flexShrink: 0,
                        }} />
                        <div style={{ flex: 1 }}>
                          <div className="text-sm font-semibold text-white">{med.brandName}</div>
                          <div className="text-xs text-muted">{med.dosage}</div>
                        </div>
                        <div className="text-sm font-bold" style={{ color: 'var(--neutral-400)' }}>{time}</div>
                        {taken && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>✓ Taken</span>}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Today's Summary Ring */}
          <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ margin: '0 auto 12px', display: 'block' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--neutral-700)" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={todayProgress.percent === 100 ? '#10b981' : '#6366f1'}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - todayProgress.percent / 100)}`}
                transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
              <text x="60" y="56" textAnchor="middle" fill="white" fontSize="22" fontWeight="800" fontFamily="Plus Jakarta Sans, sans-serif">
                {todayProgress.percent}%
              </text>
              <text x="60" y="72" textAnchor="middle" fill="#6b6b9a" fontSize="10">
                completed
              </text>
            </svg>
            <div className="font-bold text-white text-base">
              {todayProgress.taken}/{todayProgress.total} doses taken
            </div>
            <div className="text-xs text-muted mt-1">
              {todayProgress.percent === 100 ? '🎉 Perfect adherence today!' : `${todayProgress.total - todayProgress.taken} remaining`}
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockMeds.length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="flex items-center gap-2 mb-3">
                <ExclamationTriangleIcon style={{ width: 18, height: 18, color: 'var(--warning-400)' }} />
                <span className="font-bold text-white text-sm">Low Stock Alert</span>
              </div>
              {lowStockMeds.map((med) => (
                <div key={med.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--glass-border)',
                }}>
                  <div>
                    <div className="text-sm font-semibold text-white">{med.brandName}</div>
                    <div className="text-xs text-muted">{med.dosage}</div>
                  </div>
                  <span className="badge badge-warning">{med.pillCount} left</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent Interactions */}
          {interactions.length > 0 && (
            <div className="glass-card" style={{ padding: 20 }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldExclamationIcon style={{ width: 18, height: 18, color: 'var(--danger-400)' }} />
                  <span className="font-bold text-white text-sm">Interactions</span>
                </div>
                <Link to="/interactions" className="text-xs" style={{ color: 'var(--primary-400)' }}>See all →</Link>
              </div>
              {interactions.slice(0, 2).map((interaction) => (
                <InteractionAlert key={interaction.id} interaction={interaction} />
              ))}
            </div>
          )}

          {/* Quick links */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="font-bold text-white text-sm mb-3">Quick Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: '+ Add Medication', link: '/medications', color: 'var(--primary-400)' },
                { label: '📋 Log PRN Dose', link: '/prn', color: 'var(--accent-400)' },
                { label: '🧪 Check Interactions', link: '/interactions', color: 'var(--warning-400)' },
                { label: '📊 Doctor Report', link: '/reports', color: 'var(--neutral-300)' },
              ].map((item) => (
                <Link
                  key={item.link}
                  to={item.link}
                  style={{
                    display: 'block', padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--glass-shine)',
                    color: item.color, fontSize: '0.875rem', fontWeight: 500,
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--glass-shine)'}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive override */}
      <style>{`
        @media (max-width: 900px) {
          .grid[style*="1fr 360px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
