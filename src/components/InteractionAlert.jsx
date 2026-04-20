import { memo } from 'react';
import { ShieldExclamationIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const SEVERITY_CONFIG = {
  severe: {
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.35)',
    text: 'var(--danger-400)',
    badge: 'badge-danger',
    icon: ShieldExclamationIcon,
    label: 'Severe',
  },
  moderate: {
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.35)',
    text: 'var(--warning-400)',
    badge: 'badge-warning',
    icon: ExclamationTriangleIcon,
    label: 'Moderate',
  },
  minor: {
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.35)',
    text: 'var(--primary-400)',
    badge: 'badge-primary',
    icon: ShieldCheckIcon,
    label: 'Minor',
  },
};

/**
 * InteractionAlert — renders a single drug interaction card
 */
const InteractionAlert = memo(function InteractionAlert({ interaction }) {
  const cfg = SEVERITY_CONFIG[interaction.severity] || SEVERITY_CONFIG.minor;
  const Icon = cfg.icon;

  return (
    <div
      className="animate-fade-in"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        display: 'flex',
        gap: 14,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon style={{ width: 18, height: 18, color: cfg.text }} />
      </div>

      <div style={{ flex: 1 }}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
          <span className="text-sm font-semibold text-white">
            {interaction.drug1}
            <span className="text-muted" style={{ fontWeight: 400 }}> ⟷ </span>
            {interaction.drug2}
          </span>
        </div>
        <p style={{ fontSize: '0.845rem', color: 'var(--neutral-300)', lineHeight: 1.6 }}>
          {interaction.description}
        </p>
        {interaction.severity === 'severe' && (
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--danger-400)', fontWeight: 600 }}>
            ⚠️ Consult your doctor or pharmacist before taking these together.
          </div>
        )}
      </div>
    </div>
  );
});

export default InteractionAlert;
