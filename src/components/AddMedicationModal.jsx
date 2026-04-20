import { useState, useCallback } from 'react';
import Modal from './Modal';
import DrugSearchInput from './DrugSearchInput';
import { useMedication } from '../context/MedicationContext';
import { useForm } from '../hooks/useForm';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';

const FREQUENCIES = [
  { value: 'daily', label: 'Once Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'three_times', label: 'Three Times a Day' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as_needed', label: 'As Needed (PRN)' },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

const INITIAL = {
  brandName: '', genericName: '', dosage: '', route: '', frequency: 'daily',
  pillCount: '', totalPills: '30', notes: '', status: 'active', color: '#6366f1',
  manufacturer: '', warnings: '', contraindications: '',
};

const validate = (v) => {
  const e = {};
  if (!v.brandName.trim()) e.brandName = 'Medication name is required';
  if (!v.dosage.trim()) e.dosage = 'Dosage is required';
  return e;
};

export default function AddMedicationModal({ isOpen, onClose, editMed = null }) {
  const { addMed, updateMed } = useMedication();
  const [schedule, setSchedule] = useState(editMed?.schedule || ['08:00']);
  const [selectedDrug, setSelectedDrug] = useState(null);

  const initialValues = editMed
    ? { ...INITIAL, ...editMed, pillCount: String(editMed.pillCount ?? ''), totalPills: String(editMed.totalPills ?? '30') }
    : INITIAL;

  const form = useForm(initialValues, validate);

  const handleDrugSelect = useCallback((drug) => {
    setSelectedDrug(drug);
    form.setField('brandName', drug.brandName);
    form.setField('genericName', drug.genericName || '');
    form.setField('route', drug.route || '');
    form.setField('warnings', drug.warnings || '');
    form.setField('contraindications', drug.contraindications || '');
    form.setField('manufacturer', drug.manufacturer || '');
    toast.success(`Loaded FDA data for ${drug.brandName}`);
  }, [form]);

  const addTimeSlot = () => {
    setSchedule((prev) => [...prev, '12:00']);
  };

  const removeTimeSlot = (i) => {
    setSchedule((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateTimeSlot = (i, val) => {
    setSchedule((prev) => prev.map((t, idx) => (idx === i ? val : t)));
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    const raw = {
      ...values,
      pillCount: values.pillCount !== '' ? Number(values.pillCount) : null,
      totalPills: values.totalPills !== '' ? Number(values.totalPills) : 30,
      schedule: values.frequency === 'as_needed' ? [] : schedule,
    };
    // Firestore does NOT accept `undefined` — strip any undefined fields
    const payload = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined)
    );
    try {
      if (editMed) {
        await updateMed(editMed.id, payload);
        toast.success('Medication updated!');
      } else {
        await addMed(payload);
        toast.success('Medication added!');
      }
      form.reset();
      setSchedule(['08:00']);
      onClose();
    } catch (err) {
      console.error('Save medication error:', err);
      toast.error('Failed to save medication');
    }
  });

  const handleClose = () => {
    form.reset();
    setSchedule(editMed?.schedule || ['08:00']);
    setSelectedDrug(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={editMed ? 'Edit Medication' : 'Add Medication'} maxWidth={600}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* FDA Drug Search */}
          {!editMed && (
            <div className="form-group">
              <label className="form-label">🔍 Search FDA Drug Database</label>
              <DrugSearchInput onSelect={handleDrugSelect} placeholder="Type drug name to search..." />
              {selectedDrug && (
                <div style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                  fontSize: '0.78rem', color: 'var(--accent-400)',
                }}>
                  ✅ FDA data loaded for <strong>{selectedDrug.brandName}</strong>
                </div>
              )}
            </div>
          )}

          <div className="divider" style={{ margin: '4px 0' }} />

          {/* Name & Dosage Row */}
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Brand Name *</label>
              <input
                id="med-brand-name"
                name="brandName"
                className="form-input"
                value={form.values.brandName}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="e.g. Aspirin"
              />
              {form.touched.brandName && form.errors.brandName && (
                <span className="form-error">{form.errors.brandName}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Generic Name</label>
              <input
                id="med-generic-name"
                name="genericName"
                className="form-input"
                value={form.values.genericName}
                onChange={form.handleChange}
                placeholder="e.g. acetylsalicylic acid"
              />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Dosage *</label>
              <input
                id="med-dosage"
                name="dosage"
                className="form-input"
                value={form.values.dosage}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="e.g. 75mg"
              />
              {form.touched.dosage && form.errors.dosage && (
                <span className="form-error">{form.errors.dosage}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Route</label>
              <input
                id="med-route"
                name="route"
                className="form-input"
                value={form.values.route}
                onChange={form.handleChange}
                placeholder="e.g. oral, topical"
              />
            </div>
          </div>

          {/* Frequency */}
          <div className="form-group">
            <label className="form-label">Frequency</label>
            <select
              id="med-frequency"
              name="frequency"
              className="form-input form-select"
              value={form.values.frequency}
              onChange={form.handleChange}
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Schedule Times */}
          {form.values.frequency !== 'as_needed' && (
            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="form-label">Schedule Times</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addTimeSlot}>
                  <PlusIcon style={{ width: 14, height: 14 }} />
                  Add Time
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {schedule.map((time, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ClockIcon style={{ width: 16, height: 16, color: 'var(--neutral-400)' }} />
                    <input
                      type="time"
                      className="form-input"
                      value={time}
                      onChange={(e) => updateTimeSlot(i, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    {schedule.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeTimeSlot(i)}>
                        <TrashIcon style={{ width: 14, height: 14, color: 'var(--danger-400)' }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pill Count */}
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Current Pill Count</label>
              <input
                id="med-pill-count"
                name="pillCount"
                type="number"
                min="0"
                className="form-input"
                value={form.values.pillCount}
                onChange={form.handleChange}
                placeholder="e.g. 30"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Pills (full supply)</label>
              <input
                id="med-total-pills"
                name="totalPills"
                type="number"
                min="1"
                className="form-input"
                value={form.values.totalPills}
                onChange={form.handleChange}
                placeholder="30"
              />
            </div>
          </div>

          {/* Status & Color */}
          <div className="grid" style={{ gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                id="med-status"
                name="status"
                className="form-input form-select"
                value={form.values.status}
                onChange={form.handleChange}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="flex gap-1 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => form.setField('color', c)}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', background: c,
                      border: form.values.color === c ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer', transition: 'transform 0.15s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes / Instructions</label>
            <textarea
              id="med-notes"
              name="notes"
              className="form-input"
              value={form.values.notes}
              onChange={form.handleChange}
              placeholder="e.g. Take with food, avoid alcohol..."
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* FDA Warnings (auto-filled) */}
          {form.values.warnings && (
            <div style={{
              padding: '10px 12px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--neutral-300)',
            }}>
              <div style={{ color: 'var(--danger-400)', fontWeight: 700, marginBottom: 4 }}>⚠️ FDA Warnings</div>
              {form.values.warnings.substring(0, 300)}...
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button
            id="save-medication-btn"
            type="submit"
            className="btn btn-primary"
            disabled={form.submitting}
          >
            {form.submitting ? (
              <><div className="spinner spinner-sm" />{editMed ? 'Updating...' : 'Adding...'}</>
            ) : (
              editMed ? 'Update Medication' : 'Add Medication'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
