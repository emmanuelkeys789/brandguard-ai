import React, { useState } from 'react';
import {
  Check,
  Save,
  Database,
  RefreshCw,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useBrand } from '../../context/useBrand';

export const SettingsTab: React.FC = () => {
  const {
    dbState,
    isSyncing,
    syncToDatabase,
    refreshFromDatabase
  } = useBrand();

  const [sensitivity, setSensitivity] = useState<'strict' | 'balanced' | 'advisory'>('balanced');
  const [autoFlagSuperlatives, setAutoFlagSuperlatives] = useState(true);
  const [requireDualSignoff, setRequireDualSignoff] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '840px' }}>
      {/* Header */}
      <div>
        <div className="glass-pill glass-pill-accent" style={{ marginBottom: '10px' }}>
          <span>WORKSPACE CONFIGURATION</span>
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 30px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Workspace Settings
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          Manage workspace preferences, storage backend, and governance guardrails.
        </p>
      </div>

      {/* Cloud Database & Persistence Backend Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: dbState.status === 'connected' ? 'var(--accent-lime-dim)' : 'rgba(251, 191, 36, 0.1)',
                border: '1px solid',
                borderColor: dbState.status === 'connected' ? 'var(--accent-lime-border)' : 'rgba(251, 191, 36, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Database size={18} color={dbState.status === 'connected' ? 'var(--accent-lime)' : 'var(--accent-amber)'} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Storage Backend &amp; Database
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                PostgreSQL persistence via Supabase with offline LocalStorage fallback
              </div>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: dbState.status === 'connected' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid',
              borderColor: dbState.status === 'connected' ? 'rgba(52, 211, 153, 0.35)' : 'var(--border-subtle)',
              fontSize: '12px',
              fontWeight: 600,
              color: dbState.status === 'connected' ? '#34D399' : 'var(--text-secondary)'
            }}
          >
            {dbState.status === 'connected' ? (
              <>
                <CheckCircle2 size={13} color="#34D399" />
                <span>Supabase PostgreSQL Connected ({dbState.latencyMs}ms)</span>
              </>
            ) : (
              <>
                <AlertCircle size={13} color="var(--accent-amber)" />
                <span>LocalStorage Mode (Offline Ready)</span>
              </>
            )}
          </div>
        </div>

        {/* Status Explanation */}
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '14px 0 16px 0' }}>
          {dbState.status === 'connected'
            ? `Your workspace is connected to Supabase PostgreSQL at ${dbState.url}. Profiles, rules, reviews, and decision audit logs persist directly in the cloud database.`
            : 'BrandGuard AI is operating in standalone LocalStorage mode. All brand profiles, custom rules, submitted drafts, and audit trails persist safely in your browser.'}
        </p>

        {/* Database Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          {dbState.status === 'connected' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={syncToDatabase}
              disabled={isSyncing}
              iconLeft={<UploadCloud size={14} />}
            >
              {isSyncing ? 'Syncing...' : 'Sync Local Data to Database'}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={refreshFromDatabase}
            iconLeft={<RefreshCw size={14} />}
          >
            Refresh Storage State
          </Button>

          {dbState.status !== 'connected' && (
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>To connect Cloud PostgreSQL: copy <code>.env.example</code> to <code>.env</code> and add your Supabase URL &amp; anon key.</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Enforcement Sensitivity */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Audit Engine Sensitivity
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Choose how strictly BrandGuard evaluates subjective tone vs objective citation requirements.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}
          >
            {[
              { id: 'strict', title: 'Strict Enterprise', desc: 'Blocks any claim lacking registered audit citations. Zero tolerance for superlatives.' },
              { id: 'balanced', title: 'Balanced (Standard)', desc: 'Flags unverified claims as warnings. Permits verified marketing assertions.' },
              { id: 'advisory', title: 'Advisory Only', desc: 'Surfaces recommendations without hard publishing blockers.' }
            ].map((option) => (
              <div
                key={option.id}
                onClick={() => setSensitivity(option.id as any)}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: sensitivity === option.id ? 'rgba(214, 255, 112, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid',
                  borderColor: sensitivity === option.id ? 'var(--accent-lime-border)' : 'var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: sensitivity === option.id ? 'var(--accent-lime)' : 'var(--text-primary)' }}>
                    {option.title}
                  </span>
                  {sensitivity === option.id && <Check size={16} color="var(--accent-lime)" />}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {option.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Governance Controls Toggles */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Policy Guardrails
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Enforce mandatory checkpoints for press releases and external communications.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Toggle 1 */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Mandatory Third-Party Source Citation
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Require registered source links for any claim referencing market share or ranking.
                </div>
              </div>
              <input
                type="checkbox"
                checked={autoFlagSuperlatives}
                onChange={(e) => setAutoFlagSuperlatives(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-lime)', cursor: 'pointer' }}
              />
            </label>

            {/* Toggle 2 */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Require Dual Editorial Sign-Off
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Both Marketing Lead and Legal Counsel must sign off before status changes to Approved.
                </div>
              </div>
              <input
                type="checkbox"
                checked={requireDualSignoff}
                onChange={(e) => setRequireDualSignoff(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-lime)', cursor: 'pointer' }}
              />
            </label>

            {/* Toggle 3 */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Real-time Slack / Email Drift Alerts
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Broadcast immediate alerts when critical brand violations are detected.
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-lime)', cursor: 'pointer' }}
              />
            </label>
          </div>
        </div>

        {/* Action Button & Confirmation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Button variant="primary" size="md" type="submit" iconLeft={<Save size={16} />}>
            Save Workspace Preferences
          </Button>

          {savedSuccess && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                color: 'var(--accent-lime)',
                fontWeight: 600
              }}
            >
              <Check size={16} /> Settings saved to local state
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
