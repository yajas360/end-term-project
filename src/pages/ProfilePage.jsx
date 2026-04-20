import { useState } from 'react';
import { useMedication } from '../context/MedicationContext';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import toast from 'react-hot-toast';
import { UserCircleIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

const validate = (v) => {
  const e = {};
  if (v.age && (isNaN(v.age) || v.age < 0 || v.age > 130)) e.age = 'Invalid age';
  if (v.weight && isNaN(v.weight)) e.weight = 'Invalid weight';
  return e;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { userProfile, updateProfile } = useMedication();
  const [saving, setSaving] = useState(false);
  const [newAllergy, setNewAllergy] = useState('');
  const [newCondition, setNewCondition] = useState('');

  const form = useForm(
    {
      displayName: userProfile?.displayName || user?.displayName || '',
      age: userProfile?.age || '',
      weight: userProfile?.weight || '',
      height: userProfile?.height || '',
      bloodType: userProfile?.bloodType || '',
      doctorName: userProfile?.doctorName || '',
      doctorPhone: userProfile?.doctorPhone || '',
      emergencyContact: userProfile?.emergencyContact || '',
      emergencyPhone: userProfile?.emergencyPhone || '',
      allergies: userProfile?.allergies || [],
      conditions: userProfile?.conditions || [],
      notes: userProfile?.notes || '',
    },
    validate
  );

  // Repopulate form when userProfile loads from Firestore (async)
  const [profileLoaded, setProfileLoaded] = useState(false);
  if (userProfile && !profileLoaded) {
    form.setField('displayName', userProfile.displayName || user?.displayName || '');
    form.setField('age', userProfile.age || '');
    form.setField('weight', userProfile.weight || '');
    form.setField('height', userProfile.height || '');
    form.setField('bloodType', userProfile.bloodType || '');
    form.setField('doctorName', userProfile.doctorName || '');
    form.setField('doctorPhone', userProfile.doctorPhone || '');
    form.setField('emergencyContact', userProfile.emergencyContact || '');
    form.setField('emergencyPhone', userProfile.emergencyPhone || '');
    form.setField('allergies', userProfile.allergies || []);
    form.setField('conditions', userProfile.conditions || []);
    form.setField('notes', userProfile.notes || '');
    setProfileLoaded(true);
  }

  const handleSave = form.handleSubmit(async (values) => {
    setSaving(true);
    try {
      await updateProfile(values);
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  });

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    form.setField('allergies', [...form.values.allergies, newAllergy.trim()]);
    setNewAllergy('');
  };

  const removeAllergy = (i) => {
    form.setField('allergies', form.values.allergies.filter((_, idx) => idx !== i));
  };

  const addCondition = () => {
    if (!newCondition.trim()) return;
    form.setField('conditions', [...form.values.conditions, newCondition.trim()]);
    setNewCondition('');
  };

  const removeCondition = (i) => {
    form.setField('conditions', form.values.conditions.filter((_, idx) => idx !== i));
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-in mb-6">
        <h1 className="text-display font-extrabold text-white text-2xl">My Health Profile</h1>
        <p className="text-sm text-muted mt-0.5">
          Your information is used to personalize your experience and generate doctor reports.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Avatar + Name */}
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div className="flex items-center gap-4 mb-6">
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontWeight: 800, color: '#fff',
            }}>
              {(user?.displayName || user?.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-white text-lg">{user?.displayName || 'User'}</div>
              <div className="text-sm text-muted">{user?.email}</div>
              <span className="badge badge-success mt-1">Verified Account</span>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                id="profile-name"
                name="displayName"
                className="form-input"
                value={form.values.displayName}
                onChange={form.handleChange}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Blood Type</label>
              <select
                id="profile-blood-type"
                name="bloodType"
                className="form-input form-select"
                value={form.values.bloodType}
                onChange={form.handleChange}
              >
                <option value="">Select...</option>
                {BLOOD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                id="profile-age"
                name="age"
                type="number"
                min="0" max="130"
                className="form-input"
                value={form.values.age}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                placeholder="e.g. 65"
              />
              {form.touched.age && form.errors.age && <span className="form-error">{form.errors.age}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                id="profile-weight"
                name="weight"
                type="number"
                min="0"
                className="form-input"
                value={form.values.weight}
                onChange={form.handleChange}
                placeholder="e.g. 70"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Height (cm)</label>
              <input
                id="profile-height"
                name="height"
                type="number"
                min="0"
                className="form-input"
                value={form.values.height}
                onChange={form.handleChange}
                placeholder="e.g. 170"
                style={{ maxWidth: 200 }}
              />
            </div>
          </div>
        </div>

        {/* Medical Team */}
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div className="font-bold text-white text-base mb-4">Medical Team</div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Primary Doctor</label>
              <input
                id="profile-doctor-name"
                name="doctorName"
                className="form-input"
                value={form.values.doctorName}
                onChange={form.handleChange}
                placeholder="Dr. Smith"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Doctor's Phone</label>
              <input
                id="profile-doctor-phone"
                name="doctorPhone"
                className="form-input"
                value={form.values.doctorPhone}
                onChange={form.handleChange}
                placeholder="+1 555-0100"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Contact</label>
              <input
                id="profile-emergency-contact"
                name="emergencyContact"
                className="form-input"
                value={form.values.emergencyContact}
                onChange={form.handleChange}
                placeholder="Name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Phone</label>
              <input
                id="profile-emergency-phone"
                name="emergencyPhone"
                className="form-input"
                value={form.values.emergencyPhone}
                onChange={form.handleChange}
                placeholder="+1 555-0199"
              />
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div className="font-bold text-white text-base mb-4">Known Allergies</div>
          <div className="flex gap-2 mb-3">
            <input
              id="add-allergy-input"
              className="form-input flex-1"
              value={newAllergy}
              onChange={e => setNewAllergy(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
              placeholder="Add allergy (press Enter)"
            />
            <button type="button" className="btn btn-secondary" onClick={addAllergy}>
              <PlusIcon style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.values.allergies.length === 0 && (
              <span className="text-sm text-muted">No allergies recorded.</span>
            )}
            {form.values.allergies.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px',
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-full)',
              }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--danger-400)' }}>{a}</span>
                <button type="button" onClick={() => removeAllergy(i)} style={{ cursor: 'pointer', color: 'var(--danger-400)', display: 'flex' }}>
                  <XMarkIcon style={{ width: 12, height: 12 }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div className="font-bold text-white text-base mb-4">Medical Conditions</div>
          <div className="flex gap-2 mb-3">
            <input
              id="add-condition-input"
              className="form-input flex-1"
              value={newCondition}
              onChange={e => setNewCondition(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCondition())}
              placeholder="Add condition (press Enter)"
            />
            <button type="button" className="btn btn-secondary" onClick={addCondition}>
              <PlusIcon style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.values.conditions.length === 0 && (
              <span className="text-sm text-muted">No conditions recorded.</span>
            )}
            {form.values.conditions.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 10px',
                background: 'rgba(99,102,241,0.12)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 'var(--radius-full)',
              }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--primary-400)' }}>{c}</span>
                <button type="button" onClick={() => removeCondition(i)} style={{ cursor: 'pointer', color: 'var(--primary-400)', display: 'flex' }}>
                  <XMarkIcon style={{ width: 12, height: 12 }} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
          <div className="font-bold text-white text-base mb-4">Additional Notes</div>
          <textarea
            id="profile-notes"
            name="notes"
            className="form-input w-full"
            value={form.values.notes}
            onChange={form.handleChange}
            placeholder="Any additional health information for your doctor..."
            rows={3}
          />
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3 animate-fade-in">
          <button
            id="save-profile-btn"
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={saving || form.submitting}
          >
            {(saving || form.submitting)
              ? <><div className="spinner spinner-sm" />Saving...</>
              : '💾 Save Profile'}
          </button>
        </div>
      </form>

      <style>{`
        @media (max-width: 600px) {
          .grid[style*="1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
