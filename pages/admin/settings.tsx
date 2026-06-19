import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json());

const authFetcher = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idagha_token') || '' : ''}` } }).then((r) => r.json());

export default function AdminSettings() {
  const { toast } = useToast();
  const { data: bankAccounts, isLoading } = useSWR('/api/settings/bank-accounts', fetcher);
  const { data: cronSchedule } = useSWR('/api/settings/cron-schedule', authFetcher);

  const [saving, setSaving] = useState(false);
  const [savingCron, setSavingCron] = useState(false);

  const [accountsForm, setAccountsForm] = useState<any[]>([]);
  const [hasInit, setHasInit] = useState(false);
  const [cronForm, setCronForm] = useState<any>({ birthdayTime: '0 8 * * *', reunionReminderTime: '0 8 * * 1', birthdayEnabled: true, reunionReminderEnabled: true });
  const [cronInit, setCronInit] = useState(false);

  // Initialize forms when data loads
  if (Array.isArray(bankAccounts) && !hasInit && !isLoading) {
    setAccountsForm(bankAccounts);
    setHasInit(true);
  }

  if (cronSchedule && !cronInit) {
    setCronForm(cronSchedule);
    setCronInit(true);
  }

  const parseCronTime = (cronExpr: string) => {
    const parts = cronExpr.split(' ');
    return { hour: parts[1], minute: parts[0] };
  };

  const parseCronDay = (cronExpr: string) => {
    const parts = cronExpr.split(' ');
    return parts[4];
  };

  const buildCronExpr = (hour: string, minute: string, day?: string) => {
    if (day !== undefined) {
      return `${minute} ${hour} * * ${day}`;
    }
    return `${minute} ${hour} * * *`;
  };

  const handleAdd = () => {
    setAccountsForm([
      ...accountsForm,
      {
        bank: '',
        accountName: 'IDAGHA CLASS 2018 ALUMNI',
        accountNumber: '',
        icon: '🏦',
        color: 'rgba(34,197,94,0.12)',
        border: 'rgba(34,197,94,0.3)',
      }
    ]);
  };

  const handleRemove = (index: number) => {
    setAccountsForm(accountsForm.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: string, value: string) => {
    const updated = [...accountsForm];
    updated[index][field] = value;
    setAccountsForm(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/bank-accounts', accountsForm);
      mutate('/api/settings/bank-accounts');
      toast('Bank accounts updated successfully.', 'success');
    } catch (err: any) {
      toast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCron = async () => {
    setSavingCron(true);
    try {
      await api.put('/settings/cron-schedule', cronForm);
      mutate('/api/settings/cron-schedule');
      toast('Scheduler settings updated successfully.', 'success');
    } catch (err: any) {
      toast('Failed to save scheduler settings.', 'error');
    } finally {
      setSavingCron(false);
    }
  };

  const handleCronChange = (field: string, value: any) => {
    setCronForm({ ...cronForm, [field]: value });
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 800 }}>
        <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 4 }}>System Settings</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem', marginBottom: 32 }}>Manage public configurations, bank accounts, and platform parameters.</p>

        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Group Bank Accounts</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>These accounts are displayed publicly on the "Make a Contribution" page.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleAdd}>+ Add Account</button>
          </div>

          {isLoading ? (
            <div style={{ color: 'var(--text-3)' }}>Loading accounts...</div>
          ) : accountsForm.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-3)', background: 'var(--bg-base)', borderRadius: 10 }}>
              No bank accounts configured.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {accountsForm.map((acc, i) => (
                <div key={i} style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-base)', position: 'relative' }}>
                  <button
                    onClick={() => handleRemove(i)}
                    style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}
                    title="Remove Account"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Bank Name</label>
                      <input className="form-input" value={acc.bank} onChange={(e) => handleChange(i, 'bank', e.target.value)} placeholder="e.g. First Bank" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Account Number</label>
                      <input className="form-input" value={acc.accountNumber} onChange={(e) => handleChange(i, 'accountNumber', e.target.value)} placeholder="e.g. 1234567890" />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                      <label className="form-label">Account Name</label>
                      <input className="form-input" value={acc.accountName} onChange={(e) => handleChange(i, 'accountName', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || isLoading}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Automated Schedulers</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: 24 }}>Configure when birthday wishes and reunion fund reminders are sent.</p>

          {cronForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Birthday Settings */}
              <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-base)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <label style={{ flex: 1, fontWeight: 600 }}>🎂 Birthday Wishes</label>
                  <input
                    type="checkbox"
                    checked={cronForm.birthdayEnabled}
                    onChange={(e) => handleCronChange('birthdayEnabled', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                {cronForm.birthdayEnabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Hour (0-23)</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        className="form-input"
                        value={parseCronTime(cronForm.birthdayTime).hour}
                        onChange={(e) => handleCronChange('birthdayTime', buildCronExpr(e.target.value, parseCronTime(cronForm.birthdayTime).minute))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Minute (0-59)</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        className="form-input"
                        value={parseCronTime(cronForm.birthdayTime).minute}
                        onChange={(e) => handleCronChange('birthdayTime', buildCronExpr(parseCronTime(cronForm.birthdayTime).hour, e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Reunion Reminder Settings */}
              <div style={{ padding: 20, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-base)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <label style={{ flex: 1, fontWeight: 600 }}>💰 Reunion Fund Reminder</label>
                  <input
                    type="checkbox"
                    checked={cronForm.reunionReminderEnabled}
                    onChange={(e) => handleCronChange('reunionReminderEnabled', e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
                {cronForm.reunionReminderEnabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Day (0=Sun, 1=Mon, ...)</label>
                      <input
                        type="number"
                        min="0"
                        max="6"
                        className="form-input"
                        value={parseCronDay(cronForm.reunionReminderTime)}
                        onChange={(e) => handleCronChange('reunionReminderTime', buildCronExpr(parseCronTime(cronForm.reunionReminderTime).hour, parseCronTime(cronForm.reunionReminderTime).minute, e.target.value))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Hour (0-23)</label>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        className="form-input"
                        value={parseCronTime(cronForm.reunionReminderTime).hour}
                        onChange={(e) => handleCronChange('reunionReminderTime', buildCronExpr(e.target.value, parseCronTime(cronForm.reunionReminderTime).minute, parseCronDay(cronForm.reunionReminderTime)))}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Minute (0-59)</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        className="form-input"
                        value={parseCronTime(cronForm.reunionReminderTime).minute}
                        onChange={(e) => handleCronChange('reunionReminderTime', buildCronExpr(parseCronTime(cronForm.reunionReminderTime).hour, e.target.value, parseCronDay(cronForm.reunionReminderTime)))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleSaveCron} disabled={savingCron}>
              {savingCron ? 'Saving...' : 'Save Scheduler Settings'}
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
