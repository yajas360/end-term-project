import { useState, useMemo } from 'react';
import { useMedication } from '../context/MedicationContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CheckCircleIcon, ClockIcon, ExclamationCircleIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

export default function TrackerPage() {
  const {
    medications, todayLogs, allLogs, markDoseTaken, undoDose, todayProgress, today,
  } = useMedication();

  const [selectedDate, setSelectedDate] = useState(today);
  const [takingDose, setTakingDose] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');

  const activeMeds = medications.filter(m => m.status === 'active');

  // Logs for selected date
  const logsForDate = useMemo(() =>
    allLogs.filter(l => l.date === selectedDate),
    [allLogs, selectedDate]
  );

  // Build schedule grid for selected date
  const scheduleItems = useMemo(() => {
    return activeMeds.flatMap((med) =>
      (med.schedule || []).map((time) => {
        const log = logsForDate.find(
          l => l.medicationId === med.id && l.scheduledTime === time
        );
        return { med, time, log, taken: !!log };
      })
    ).sort((a, b) => a.time.localeCompare(b.time));
  }, [activeMeds, logsForDate]);

  // Group by time
  const grouped = useMemo(() => {
    const map = {};
    scheduleItems.forEach(item => {
      if (!map[item.time]) map[item.time] = [];
      map[item.time].push(item);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [scheduleItems]);

  const handleTake = async (item) => {
    if (item.taken) return;
    await markDoseTaken(item.med, item.time);
    toast.success(`✅ ${item.med.brandName} logged`);
  };

  const handleUndo = async (item) => {
    if (!item.log) return;
    await undoDose(item.log.id, item.med);
    toast('Dose undone', { icon: '↩️' });
  };

  const nowH = new Date().getHours() * 60 + new Date().getMinutes();
  const isToday = selectedDate === today;

  return (
    <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 animate-fade-in">
        <div>
          <h1 className="text-display font-extrabold text-white text-2xl">Daily Tracker</h1>
          <p className="text-sm text-muted mt-0.5">Log and review your dose schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            id="tracker-date-picker"
            type="date"
            className="form-input"
            value={selectedDate}
            max={today}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ width: 'auto' }}
          />
        </div>
      </div>

      {/* Today's Progress Bar (only for today) */}
      {isToday && (
        <div className="glass-card animate-fade-in mb-6" style={{ padding: 20 }}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-white text-sm">Today's Progress</span>
            <span className="font-bold text-white">{todayProgress.taken}/{todayProgress.total} doses</span>
          </div>
          <div className="progress-bar-track" style={{ height: 10 }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${todayProgress.percent}%`,
                background: todayProgress.percent === 100
                  ? 'linear-gradient(90deg, var(--accent-500), var(--accent-400))'
                  : 'linear-gradient(90deg, var(--primary-500), var(--accent-500))',
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-muted">
              {todayProgress.percent === 100
                ? '🎉 Perfect adherence!'
                : `${todayProgress.total - todayProgress.taken} dose${todayProgress.total - todayProgress.taken !== 1 ? 's' : ''} remaining`}
            </span>
            <span className="text-xs font-bold" style={{
              color: todayProgress.percent >= 80 ? 'var(--accent-400)' : 'var(--warning-400)'
            }}>
              {todayProgress.percent}%
            </span>
          </div>
        </div>
      )}

      {/* Viewing past date banner */}
      {!isToday && (
        <div style={{
          padding: '10px 16px', borderRadius: 'var(--radius-md)',
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
          marginBottom: 20, fontSize: '0.875rem', color: 'var(--primary-400)',
        }}>
          📅 Viewing history for {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
          {' · '}
          {logsForDate.length} dose{logsForDate.length !== 1 ? 's' : ''} logged
        </div>
      )}

      {/* Schedule Timeline */}
      {activeMeds.length === 0 ? (
        <div className="glass-card empty-state animate-fade-in">
          <div className="empty-icon">
            <ClockIcon style={{ width: 30, height: 30 }} />
          </div>
          <div className="font-semibold text-white">No active medications</div>
          <p className="text-sm text-muted">Add medications with a schedule to start tracking.</p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="glass-card empty-state animate-fade-in">
          <div className="empty-icon">
            <ClockIcon style={{ width: 30, height: 30 }} />
          </div>
          <div className="text-sm text-muted">No scheduled doses for this date.</div>
        </div>
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {grouped.map(([time, items]) => {
            const [h, m] = time.split(':').map(Number);
            const timeMin = h * 60 + m;
            const isPast = isToday && nowH > timeMin + 30;
            const isCurrent = isToday && Math.abs(nowH - timeMin) <= 30;

            return (
              <div key={time} className="animate-fade-in">
                {/* Time Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 14px',
                    background: isCurrent
                      ? 'rgba(99,102,241,0.2)'
                      : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${isCurrent ? 'rgba(99,102,241,0.4)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-full)',
                  }}>
                    <ClockIcon style={{ width: 14, height: 14, color: isCurrent ? 'var(--primary-400)' : 'var(--neutral-400)' }} />
                    <span style={{
                      fontSize: '0.875rem', fontWeight: 700,
                      color: isCurrent ? 'var(--primary-400)' : 'var(--neutral-300)',
                    }}>
                      {time}
                    </span>
                    {isCurrent && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>Now</span>}
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'var(--glass-border)' }} />
                </div>

                {/* Dose Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 8 }}>
                  {items.map(({ med, time: t, log, taken }) => (
                    <div
                      key={`${med.id}-${t}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 18px',
                        background: taken
                          ? 'rgba(16,185,129,0.08)'
                          : isPast
                            ? 'rgba(239,68,68,0.06)'
                            : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${
                          taken ? 'rgba(16,185,129,0.25)' :
                          isPast ? 'rgba(239,68,68,0.2)' :
                          'var(--glass-border)'
                        }`,
                        borderRadius: 'var(--radius-md)',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {/* Status icon */}
                      {taken ? (
                        <CheckCircleIcon style={{ width: 22, height: 22, color: 'var(--accent-500)', flexShrink: 0 }} />
                      ) : isPast ? (
                        <ExclamationCircleIcon style={{ width: 22, height: 22, color: 'var(--danger-400)', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          border: '2px solid var(--neutral-600)', flexShrink: 0,
                        }} />
                      )}

                      {/* Color dot */}
                      <div style={{
                        width: 10, height: 10, borderRadius: '50%',
                        background: med.color || 'var(--primary-500)', flexShrink: 0,
                      }} />

                      {/* Med info */}
                      <div style={{ flex: 1 }}>
                        <div className="text-sm font-semibold text-white">{med.brandName}</div>
                        <div className="text-xs text-muted">{med.dosage} · {med.route || 'oral'}</div>
                        {taken && log?.takenAt && (
                          <div className="text-xs" style={{ color: 'var(--accent-400)', marginTop: 2 }}>
                            Logged at {log.takenAt?.toDate ? format(log.takenAt.toDate(), 'hh:mm a') : '—'}
                          </div>
                        )}
                      </div>

                      {/* Status badge */}
                      {taken ? (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>✓ Taken</span>
                      ) : isPast ? (
                        <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Missed</span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>Upcoming</span>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!taken && isToday && (
                          <button
                            id={`log-dose-${med.id}-${t.replace(':', '')}`}
                            className="btn btn-success btn-sm"
                            onClick={() => handleTake({ med, time: t, log, taken })}
                          >
                            Log
                          </button>
                        )}
                        {taken && isToday && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleUndo({ med, time: t, log, taken })}
                            title="Undo dose"
                          >
                            <ArrowUturnLeftIcon style={{ width: 13, height: 13 }} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
