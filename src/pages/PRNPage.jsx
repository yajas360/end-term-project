import { useState, useMemo } from 'react';
import { useMedication } from '../context/MedicationContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, BeakerIcon, ClockIcon } from '@heroicons/react/24/outline';
import Modal from '../components/Modal';

export default function PRNPage() {
  const { medications, prnLogs, addPRNLog, removePRNLog } = useMedication();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    medicationId: '',
    medicationName: '',
    dosage: '',
    reason: '',
    notes: '',
    effectiveness: '3',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const prnMeds = medications.filter(m => m.frequency === 'as_needed' || m.status === 'active');

  const handleMedSelect = (e) => {
    const medId = e.target.value;
    const med = medications.find(m => m.id === medId);
    setForm(f => ({
      ...f,
      medicationId: medId,
      medicationName: med?.brandName || '',
      dosage: med?.dosage || '',
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.medicationName.trim()) return toast.error('Select or enter a medication');
    setSaving(true);
    try {
      await addPRNLog({
        medicationId: form.medicationId,
        medicationName: form.medicationName,
        dosage: form.dosage,
        reason: form.reason,
        notes: form.notes,
        effectiveness: Number(form.effectiveness),
        date: form.date,
        time: form.time,
      });
      toast.success('PRN dose logged!');
      setShowAdd(false);
      setForm({
        medicationId: '', medicationName: '', dosage: '',
        reason: '', notes: '', effectiveness: '3',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
      });
    } catch {
      toast.error('Failed to log PRN dose');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await removePRNLog(deleteId);
    toast('PRN log removed', { icon: '🗑️' });
    setDeleteId(null);
  };

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    prnLogs.forEach(log => {
      const d = log.date || 'Unknown date';
      if (!map[d]) map[d] = [];
      map[d].push(log);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [prnLogs]);

  const EFFECTIVENESS_LABELS = {
    1: 'None', 2: 'Minimal', 3: 'Moderate', 4: 'Good', 5: 'Excellent'
  };
  const EFFECTIVENESS_COLORS = {
    1: 'var(--danger-400)', 2: 'var(--warning-400)', 3: 'var(--neutral-300)',
    4: 'var(--accent-400)', 5: 'var(--accent-500)'
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 animate-fade-in">
        <div>
          <h1 className="text-display font-extrabold text-white text-2xl">PRN Log</h1>
          <p className="text-sm text-muted mt-0.5">
            As-needed medication tracking · {prnLogs.length} entries
          </p>
        </div>
        <button
          id="add-prn-btn"
          className="btn btn-primary"
          onClick={() => setShowAdd(true)}
        >
          <PlusIcon style={{ width: 16, height: 16 }} />
          Log PRN Dose
        </button>
      </div>

      {/* Logs */}
      {prnLogs.length === 0 ? (
        <div className="glass-card empty-state animate-fade-in">
          <div className="empty-icon">
            <BeakerIcon style={{ width: 30, height: 30 }} />
          </div>
          <div className="font-semibold text-white">No PRN logs yet</div>
          <p className="text-sm text-muted text-center" style={{ maxWidth: 280 }}>
            Log as-needed medications like pain relievers, allergy pills, or rescue inhalers.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <PlusIcon style={{ width: 16, height: 16 }} />
            Log First PRN Dose
          </button>
        </div>
      ) : (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {grouped.map(([date, logs]) => (
            <div key={date}>
              <div style={{
                fontSize: '0.8rem', fontWeight: 700, color: 'var(--neutral-400)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 10, paddingLeft: 4,
              }}>
                {date === format(new Date(), 'yyyy-MM-dd')
                  ? 'Today'
                  : format(new Date(date + 'T00:00:00'), 'MMMM d, yyyy')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="glass-card animate-fade-in"
                    style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-md)',
                      background: 'rgba(99,102,241,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <BeakerIcon style={{ width: 18, height: 18, color: 'var(--primary-400)' }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{log.medicationName}</span>
                        {log.dosage && <span className="badge badge-neutral">{log.dosage}</span>}
                        <div className="flex items-center gap-1 ml-auto">
                          <ClockIcon style={{ width: 12, height: 12, color: 'var(--neutral-500)' }} />
                          <span className="text-xs text-muted">{log.time || '—'}</span>
                        </div>
                      </div>
                      {log.reason && (
                        <div className="text-sm text-muted mt-1">
                          Reason: <span style={{ color: 'var(--neutral-300)' }}>{log.reason}</span>
                        </div>
                      )}
                      {log.notes && (
                        <div className="text-xs text-muted mt-1 italic">{log.notes}</div>
                      )}
                      {log.effectiveness && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted">Effectiveness:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <div
                                key={n}
                                style={{
                                  width: 10, height: 10, borderRadius: 2,
                                  background: n <= log.effectiveness
                                    ? EFFECTIVENESS_COLORS[log.effectiveness]
                                    : 'var(--neutral-700)',
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-semibold" style={{ color: EFFECTIVENESS_COLORS[log.effectiveness] }}>
                            {EFFECTIVENESS_LABELS[log.effectiveness]}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => setDeleteId(log.id)}
                      style={{ color: 'var(--danger-400)', flexShrink: 0 }}
                    >
                      <TrashIcon style={{ width: 15, height: 15 }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add PRN Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Log PRN Dose">
        <form onSubmit={handleSave}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Medication */}
            <div className="form-group">
              <label className="form-label">Medication</label>
              <select
                id="prn-medication-select"
                className="form-input form-select"
                value={form.medicationId}
                onChange={handleMedSelect}
              >
                <option value="">— Select from your list —</option>
                {prnMeds.map(m => (
                  <option key={m.id} value={m.id}>{m.brandName} ({m.dosage})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Or type medication name</label>
              <input
                id="prn-med-name"
                className="form-input"
                value={form.medicationName}
                onChange={e => setForm(f => ({ ...f, medicationName: e.target.value }))}
                placeholder="e.g. Ibuprofen"
              />
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Dosage</label>
                <input
                  id="prn-dosage"
                  className="form-input"
                  value={form.dosage}
                  onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))}
                  placeholder="e.g. 400mg"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Time Taken</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.time}
                  onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Reason / Symptom</label>
              <input
                id="prn-reason"
                className="form-input"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. headache, back pain..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Effectiveness: {EFFECTIVENESS_LABELS[form.effectiveness]}</label>
              <input
                type="range"
                min="1" max="5" step="1"
                value={form.effectiveness}
                onChange={e => setForm(f => ({ ...f, effectiveness: e.target.value }))}
                style={{ width: '100%', accentColor: 'var(--primary-500)' }}
              />
              <div className="flex justify-between text-xs text-muted">
                <span>None</span><span>Excellent</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                id="prn-notes"
                className="form-input"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any additional observations..."
                rows={2}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button id="save-prn-btn" type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner spinner-sm" />Saving...</> : 'Log PRN Dose'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remove PRN Log">
        <div className="modal-body">
          <p className="text-sm" style={{ color: 'var(--neutral-300)' }}>Delete this PRN log entry?</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </Modal>
    </div>
  );
}
