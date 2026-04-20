import { memo } from 'react';
import { PencilIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { format, isToday, parseISO } from 'date-fns';

const STATUS_COLORS = {
  active: 'var(--accent-500)',
  paused: 'var(--warning-400)',
  completed: 'var(--neutral-400)',
};

const FREQUENCY_LABELS = {
  daily: 'Daily',
  twice_daily: 'Twice Daily',
  three_times: 'Three times/day',
  weekly: 'Weekly',
  as_needed: 'As Needed',
};

/**
 * MedicationCard — displays a single medication with pill count and actions
 */
const MedicationCard = memo(function MedicationCard({ med, onEdit, onDelete, onTakeDose, todayLogs }) {
  const takenCount = todayLogs?.filter((l) => l.medicationId === med.id).length || 0;
  const totalScheduled = med.schedule?.length || 0;
  const allTaken = totalScheduled > 0 && takenCount >= totalScheduled;
  const statusColor = STATUS_COLORS[med.status] || 'var(--neutral-400)';
  const isLowStock = med.pillCount !== undefined && med.pillCount <= 7;

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        padding: '18px 20px',
        borderLeft: `3px solid ${med.color || statusColor}`,
        transition: 'transform var(--transition-md), box-shadow var(--transition-md)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white">{med.brandName}</h3>
            {med.status && (
              <span
                className="badge"
                style={{
                  background: `${statusColor}22`,
                  color: statusColor,
                  fontSize: '0.68rem',
                }}
              >
                {med.status}
              </span>
            )}
          </div>
          {med.genericName && (
            <div className="text-xs text-muted">{med.genericName}</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              id={`edit-med-${med.id}`}
              className="btn btn-ghost btn-icon"
              onClick={() => onEdit(med)}
              title="Edit medication"
            >
              <PencilIcon style={{ width: 14, height: 14 }} />
            </button>
          )}
          {onDelete && (
            <button
              id={`delete-med-${med.id}`}
              className="btn btn-ghost btn-icon"
              onClick={() => onDelete(med)}
              style={{ color: 'var(--danger-400)' }}
              title="Delete medication"
            >
              <TrashIcon style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* Dosage & Route */}
      <div className="flex flex-wrap gap-2 mb-3">
        {med.dosage && (
          <span className="badge badge-neutral">
            <BeakerIcon style={{ width: 10, height: 10 }} />
            {med.dosage}
          </span>
        )}
        {med.frequency && (
          <span className="badge badge-primary">
            {FREQUENCY_LABELS[med.frequency] || med.frequency}
          </span>
        )}
        {med.route && (
          <span className="badge badge-neutral">{med.route}</span>
        )}
      </div>

      {/* Schedule */}
      {med.schedule?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {med.schedule.map((time, i) => {
            const taken = todayLogs?.some(
              (l) => l.medicationId === med.id && l.scheduledTime === time
            );
            return (
              <span
                key={i}
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: taken ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                  color: taken ? 'var(--accent-400)' : 'var(--neutral-300)',
                  border: `1px solid ${taken ? 'rgba(16,185,129,0.3)' : 'transparent'}`,
                  textDecoration: taken ? 'line-through' : 'none',
                }}
              >
                {time}
              </span>
            );
          })}
        </div>
      )}

      {/* Pill Count */}
      {med.pillCount !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-muted">Remaining pills</span>
            <span
              className={`text-xs font-bold ${isLowStock ? 'text-warning' : 'text-accent'}`}
            >
              {med.pillCount} {isLowStock && '⚠️ Refill soon'}
            </span>
          </div>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, (med.pillCount / (med.totalPills || 30)) * 100)}%`,
                background: isLowStock
                  ? 'linear-gradient(90deg, var(--warning-400), var(--danger-400))'
                  : 'linear-gradient(90deg, var(--accent-500), var(--primary-500))',
              }}
            />
          </div>
        </div>
      )}

      {/* Today's Log Progress */}
      {totalScheduled > 0 && onTakeDose && (
        <div className="divider" />
      )}
      {totalScheduled > 0 && onTakeDose && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: allTaken ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
              border: `2px solid ${allTaken ? 'var(--accent-500)' : 'var(--glass-border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700,
              color: allTaken ? 'var(--accent-400)' : 'var(--neutral-300)',
            }}>
              {allTaken ? '✓' : `${takenCount}/${totalScheduled}`}
            </div>
            <span className="text-xs text-muted">
              {allTaken ? 'All doses taken!' : `${totalScheduled - takenCount} remaining`}
            </span>
          </div>

          {!allTaken && (
            <button
              id={`take-dose-${med.id}`}
              className="btn btn-success btn-sm"
              onClick={() => onTakeDose(med)}
            >
              Log Dose
            </button>
          )}
        </div>
      )}

      {/* Notes */}
      {med.notes && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: 'var(--glass-shine)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.78rem',
          color: 'var(--neutral-300)',
          fontStyle: 'italic',
        }}>
          📝 {med.notes}
        </div>
      )}
    </div>
  );
});

export default MedicationCard;
