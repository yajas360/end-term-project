import { useState, useCallback, useMemo } from 'react';
import { useMedication } from '../context/MedicationContext';
import MedicationCard from '../components/MedicationCard';
import AddMedicationModal from '../components/AddMedicationModal';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import {
  PlusIcon, MagnifyingGlassIcon, FunnelIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const STATUS_FILTERS = ['all', 'active', 'paused', 'completed'];

export default function MedicationsPage() {
  const { medications, todayLogs, removeMed, markDoseTaken, loadingMeds } = useMedication();
  const [showAdd, setShowAdd] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [deleteMed, setDeleteMed] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleting, setDeleting] = useState(false);
  const [takingDoseFor, setTakingDoseFor] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');

  const filtered = useMemo(() => {
    return medications.filter((m) => {
      const matchSearch =
        m.brandName?.toLowerCase().includes(search.toLowerCase()) ||
        m.genericName?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [medications, search, statusFilter]);

  const handleDelete = useCallback(async () => {
    if (!deleteMed) return;
    setDeleting(true);
    try {
      await removeMed(deleteMed.id);
      toast.success(`${deleteMed.brandName} removed`);
      setDeleteMed(null);
    } catch {
      toast.error('Failed to delete medication');
    } finally {
      setDeleting(false);
    }
  }, [deleteMed, removeMed]);

  const handleTakeDose = useCallback((med) => {
    if (med.schedule?.length === 1) {
      // Single schedule — log directly
      markDoseTaken(med, med.schedule[0]).then(() =>
        toast.success(`✅ ${med.brandName} logged`)
      );
    } else if (med.schedule?.length > 1) {
      setTakingDoseFor(med);
      setSelectedTime(med.schedule[0]);
    }
  }, [markDoseTaken]);

  const confirmTakeDose = async () => {
    if (!takingDoseFor) return;
    await markDoseTaken(takingDoseFor, selectedTime);
    toast.success(`✅ ${takingDoseFor.brandName} at ${selectedTime} logged`);
    setTakingDoseFor(null);
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6 animate-fade-in">
        <div>
          <h1 className="text-display font-extrabold text-white text-2xl">Medications</h1>
          <p className="text-muted text-sm mt-0.5">
            {medications.length} total · {medications.filter(m => m.status === 'active').length} active
          </p>
        </div>
        <button
          id="add-medication-btn"
          className="btn btn-primary"
          onClick={() => setShowAdd(true)}
        >
          <PlusIcon style={{ width: 16, height: 16 }} />
          Add Medication
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex gap-3 flex-wrap mb-6 animate-fade-in">
        <div className="relative flex-1" style={{ minWidth: 200 }}>
          <MagnifyingGlassIcon style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 16, height: 16, color: 'var(--neutral-400)', pointerEvents: 'none',
          }} />
          <input
            id="med-search"
            className="form-input"
            style={{ paddingLeft: 38 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medications..."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              id={`filter-${f}`}
              className={`btn btn-sm ${statusFilter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loadingMeds ? (
        <div className="loading-fullscreen" style={{ minHeight: 300 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card empty-state animate-fade-in">
          <div className="empty-icon">
            <ClipboardDocumentListIcon style={{ width: 30, height: 30 }} />
          </div>
          <div className="font-semibold text-white">
            {search ? 'No medications found' : 'No medications yet'}
          </div>
          <p className="text-sm text-muted" style={{ maxWidth: 260, textAlign: 'center' }}>
            {search
              ? `No results for "${search}"`
              : 'Add your first medication to start tracking doses and interactions.'}
          </p>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <PlusIcon style={{ width: 16, height: 16 }} />
              Add First Medication
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-3 gap-4 stagger">
          {filtered.map((med) => (
            <MedicationCard
              key={med.id}
              med={med}
              todayLogs={todayLogs}
              onEdit={(m) => setEditMed(m)}
              onDelete={(m) => setDeleteMed(m)}
              onTakeDose={handleTakeDose}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddMedicationModal
        key={editMed?.id || 'add'}
        isOpen={showAdd || !!editMed}
        onClose={() => { setShowAdd(false); setEditMed(null); }}
        editMed={editMed}
      />

      {/* Dose Time Picker Modal */}
      <Modal
        isOpen={!!takingDoseFor}
        onClose={() => setTakingDoseFor(null)}
        title={`Log dose — ${takingDoseFor?.brandName}`}
      >
        <div className="modal-body">
          <p className="text-sm text-muted mb-4">Which scheduled time are you logging?</p>
          <div className="form-group">
            <label className="form-label">Scheduled Time</label>
            <select
              className="form-input form-select"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              {takingDoseFor?.schedule?.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setTakingDoseFor(null)}>Cancel</button>
          <button className="btn btn-success" onClick={confirmTakeDose}>Log Dose ✓</button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteMed} onClose={() => setDeleteMed(null)} title="Remove Medication">
        <div className="modal-body">
          <p className="text-sm" style={{ color: 'var(--neutral-300)', lineHeight: 1.7 }}>
            Are you sure you want to remove{' '}
            <strong style={{ color: '#fff' }}>{deleteMed?.brandName}</strong>?
            This will also delete all associated intake logs.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setDeleteMed(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? <><div className="spinner spinner-sm" />Removing...</> : 'Remove'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
