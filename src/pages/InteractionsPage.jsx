import { useState, useMemo } from 'react';
import { useMedication } from '../context/MedicationContext';
import InteractionAlert from '../components/InteractionAlert';
import DrugSearchInput from '../components/DrugSearchInput';
import { ShieldCheckIcon, ShieldExclamationIcon, BeakerIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { checkDrugInteractions } from '../services/fdaApi';
import toast from 'react-hot-toast';

export default function InteractionsPage() {
  const { medications, interactions } = useMedication();
  const [checkDrugs, setCheckDrugs] = useState([]);
  const [manualResults, setManualResults] = useState([]);
  const [checking, setChecking] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  const severe = useMemo(() => interactions.filter(i => i.severity === 'severe'), [interactions]);
  const moderate = useMemo(() => interactions.filter(i => i.severity === 'moderate'), [interactions]);
  const minor = useMemo(() => interactions.filter(i => i.severity === 'minor'), [interactions]);

  const addDrugToCheck = (drug) => {
    if (checkDrugs.find(d => d.brandName === drug.brandName)) {
      return toast.error('Drug already added');
    }
    setCheckDrugs(prev => [...prev, drug]);
    setManualResults([]);
    setHasChecked(false);
  };

  const removeDrugToCheck = (name) => {
    setCheckDrugs(prev => prev.filter(d => d.brandName !== name));
    setManualResults([]);
    setHasChecked(false);
  };

  const runManualCheck = async () => {
    if (checkDrugs.length < 2) return toast.error('Add at least 2 drugs to check');
    setChecking(true);
    setHasChecked(false);
    try {
      const results = await checkDrugInteractions(checkDrugs);
      setManualResults(results);
      setHasChecked(true);
      if (results.length === 0) toast.success('No known interactions detected!');
      else toast.error(`${results.length} interaction(s) found`);
    } catch {
      toast.error('Check failed — please try again');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ padding: '28px 24px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div className="animate-fade-in mb-6">
        <h1 className="text-display font-extrabold text-white text-2xl">Drug Interactions</h1>
        <p className="text-sm text-muted mt-1">Powered by FDA adverse event database</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-3 gap-4 mb-8 stagger">
        <div className="glass-card stat-card animate-fade-in" style={{ borderLeft: '3px solid var(--danger-500)' }}>
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <ShieldExclamationIcon style={{ width: 20, height: 20, color: 'var(--danger-400)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--danger-400)' }}>{severe.length}</div>
          <div className="text-sm text-muted">Severe Interactions</div>
        </div>
        <div className="glass-card stat-card animate-fade-in" style={{ borderLeft: '3px solid var(--warning-400)' }}>
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <ShieldExclamationIcon style={{ width: 20, height: 20, color: 'var(--warning-400)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--warning-400)' }}>{moderate.length}</div>
          <div className="text-sm text-muted">Moderate Interactions</div>
        </div>
        <div className="glass-card stat-card animate-fade-in" style={{ borderLeft: '3px solid var(--primary-500)' }}>
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <ShieldCheckIcon style={{ width: 20, height: 20, color: 'var(--primary-400)' }} />
          </div>
          <div className="stat-value" style={{ color: 'var(--primary-400)' }}>{minor.length}</div>
          <div className="text-sm text-muted">Minor Interactions</div>
        </div>
      </div>

      {/* Current Medication Interactions */}
      <div className="glass-card mb-6 animate-fade-in" style={{ padding: 24 }}>
        <div className="flex items-center gap-2 mb-4">
          <ShieldExclamationIcon style={{ width: 20, height: 20, color: 'var(--primary-400)' }} />
          <h2 className="font-bold text-white text-base">Your Active Medication Interactions</h2>
          <span className="badge badge-neutral ml-auto">{interactions.length} detected</span>
        </div>

        {medications.filter(m => m.status === 'active').length < 2 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-icon">
              <ShieldCheckIcon style={{ width: 28, height: 28 }} />
            </div>
            <div className="text-sm text-muted text-center">
              Add at least 2 active medications to check for interactions automatically.
            </div>
          </div>
        ) : interactions.length === 0 ? (
          <div style={{
            padding: '20px 16px', borderRadius: 'var(--radius-md)',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <ShieldCheckIcon style={{ width: 24, height: 24, color: 'var(--accent-400)' }} />
            <div>
              <div className="font-semibold text-accent" style={{ color: 'var(--accent-400)' }}>
                No known interactions detected
              </div>
              <div className="text-sm text-muted">
                Your {medications.filter(m => m.status === 'active').length} active medications appear safe to take together.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...severe, ...moderate, ...minor].map((interaction) => (
              <InteractionAlert key={interaction.id} interaction={interaction} />
            ))}
          </div>
        )}
      </div>

      {/* Manual Drug Checker */}
      <div className="glass-card animate-fade-in" style={{ padding: 24 }}>
        <div className="flex items-center gap-2 mb-2">
          <BeakerIcon style={{ width: 20, height: 20, color: 'var(--accent-400)' }} />
          <h2 className="font-bold text-white text-base">Manual Drug Interaction Checker</h2>
        </div>
        <p className="text-sm text-muted mb-5">
          Check any combination of drugs — even ones not in your list. Uses FDA database.
        </p>

        {/* Drug picker */}
        <div className="form-group mb-4">
          <label className="form-label">Add drug to check</label>
          <DrugSearchInput
            onSelect={addDrugToCheck}
            placeholder="Search any drug from FDA database..."
          />
        </div>

        {/* Selected drugs */}
        {checkDrugs.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-muted mb-2 font-semibold uppercase tracking-widest">
              Drugs to check ({checkDrugs.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {checkDrugs.map((drug) => (
                <div
                  key={drug.brandName}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px',
                    background: 'rgba(99,102,241,0.15)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  <span className="text-sm font-semibold text-white">{drug.brandName}</span>
                  {drug.genericName && (
                    <span className="text-xs text-muted">({drug.genericName})</span>
                  )}
                  <button onClick={() => removeDrugToCheck(drug.brandName)} style={{ cursor: 'pointer', color: 'var(--neutral-400)', display: 'flex' }}>
                    <XMarkIcon style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          id="run-interaction-check-btn"
          className="btn btn-primary"
          onClick={runManualCheck}
          disabled={checking || checkDrugs.length < 2}
        >
          {checking ? (
            <><div className="spinner spinner-sm" />Checking FDA database...</>
          ) : (
            <><ShieldExclamationIcon style={{ width: 16, height: 16 }} />Check Interactions</>
          )}
        </button>

        {/* Manual Results */}
        {manualResults.length > 0 && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="text-sm font-semibold text-white">
              Results: {manualResults.length} interaction(s) found
            </div>
            {manualResults.map((i) => (
              <InteractionAlert key={i.id} interaction={i} />
            ))}
          </div>
        )}
        {manualResults.length === 0 && hasChecked && !checking && (
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-md)',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: '0.875rem', color: 'var(--accent-400)',
          }}>
            ✅ No known interactions between these drugs. Always confirm with your pharmacist.
          </div>
        )}

        {/* Disclaimer */}
        <div style={{
          marginTop: 20, padding: '12px 16px', borderRadius: 'var(--radius-md)',
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', lineHeight: 1.6 }}>
            ⚕️ <strong style={{ color: 'var(--neutral-300)' }}>Medical Disclaimer:</strong> This tool uses the FDA Open Data API and known clinical interaction pairs for informational purposes only. It is not a substitute for professional medical advice. Always consult your doctor or pharmacist before making changes to your medication regimen.
          </p>
        </div>
      </div>
    </div>
  );
}
