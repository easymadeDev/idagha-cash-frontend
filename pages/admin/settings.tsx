import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

        <div className="card" style={{ padding: 0, marginBottom: 32, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(96,165,250,0.1) 100%)', padding: '28px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>⏰ Automated Schedulers</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>Configure when birthday wishes and reunion fund reminders are automatically sent to members.</p>
          </div>

          {cronForm && (
            <div style={{ padding: 24 }}>
              {/* Birthday Scheduler */}
              <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: '1.4rem' }}>🎂</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Birthday Wishes</h3>
                      <span style={{
                        display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                        background: cronForm.birthdayEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(155,155,155,0.15)',
                        color: cronForm.birthdayEnabled ? 'var(--green-400)' : 'var(--text-3)',
                      }}>
                        {cronForm.birthdayEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Automatic greetings sent daily at your configured time</p>
                  </div>
                  <button
                    onClick={() => handleCronChange('birthdayEnabled', !cronForm.birthdayEnabled)}
                    style={{
                      width: 56, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer',
                      background: cronForm.birthdayEnabled ? 'var(--green-400)' : 'rgba(155,155,155,0.3)',
                      transition: 'all 0.2s', flexShrink: 0,
                      display: 'flex', alignItems: 'center', padding: '2px',
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: 'white',
                      transition: 'transform 0.2s',
                      transform: cronForm.birthdayEnabled ? 'translateX(28px)' : 'translateX(0)',
                    }} />
                  </button>
                </div>

                {cronForm.birthdayEnabled && (
                  <div style={{ background: 'var(--bg-base)', padding: 20, borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Hour</label>
                      <select
                        value={parseCronTime(cronForm.birthdayTime).hour}
                        onChange={(e) => handleCronChange('birthdayTime', buildCronExpr(e.target.value, parseCronTime(cronForm.birthdayTime).minute))}
                        className="form-input"
                        style={{ fontSize: '0.95rem', fontWeight: 600 }}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Minute</label>
                      <select
                        value={parseCronTime(cronForm.birthdayTime).minute}
                        onChange={(e) => handleCronChange('birthdayTime', buildCronExpr(parseCronTime(cronForm.birthdayTime).hour, e.target.value))}
                        className="form-input"
                        style={{ fontSize: '0.95rem', fontWeight: 600 }}
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1', padding: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 4 }}>NEXT SEND</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--green-400)' }}>
                        Daily at {String(parseCronTime(cronForm.birthdayTime).hour).padStart(2, '0')}:{String(parseCronTime(cronForm.birthdayTime).minute).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reunion Reminder Scheduler */}
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: '1.4rem' }}>💰</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Reunion Fund Reminder</h3>
                      <span style={{
                        display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                        background: cronForm.reunionReminderEnabled ? 'rgba(96,165,250,0.15)' : 'rgba(155,155,155,0.15)',
                        color: cronForm.reunionReminderEnabled ? 'var(--blue)' : 'var(--text-3)',
                      }}>
                        {cronForm.reunionReminderEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Weekly payment reminders sent on your chosen day and time</p>
                  </div>
                  <button
                    onClick={() => handleCronChange('reunionReminderEnabled', !cronForm.reunionReminderEnabled)}
                    style={{
                      width: 56, height: 28, borderRadius: 99, border: 'none', cursor: 'pointer',
                      background: cronForm.reunionReminderEnabled ? 'var(--blue)' : 'rgba(155,155,155,0.3)',
                      transition: 'all 0.2s', flexShrink: 0,
                      display: 'flex', alignItems: 'center', padding: '2px',
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: 'white',
                      transition: 'transform 0.2s',
                      transform: cronForm.reunionReminderEnabled ? 'translateX(28px)' : 'translateX(0)',
                    }} />
                  </button>
                </div>

                {cronForm.reunionReminderEnabled && (
                  <div style={{ background: 'var(--bg-base)', padding: 20, borderRadius: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Day of Week</label>
                      <select
                        value={parseCronDay(cronForm.reunionReminderTime)}
                        onChange={(e) => handleCronChange('reunionReminderTime', buildCronExpr(parseCronTime(cronForm.reunionReminderTime).hour, parseCronTime(cronForm.reunionReminderTime).minute, e.target.value))}
                        className="form-input"
                        style={{ fontSize: '0.95rem', fontWeight: 600 }}
                      >
                        {DAYS.map((day, i) => (
                          <option key={i} value={i}>{day}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Hour</label>
                      <select
                        value={parseCronTime(cronForm.reunionReminderTime).hour}
                        onChange={(e) => handleCronChange('reunionReminderTime', buildCronExpr(e.target.value, parseCronTime(cronForm.reunionReminderTime).minute, parseCronDay(cronForm.reunionReminderTime)))}
                        className="form-input"
                        style={{ fontSize: '0.95rem', fontWeight: 600 }}
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Minute</label>
                      <select
                        value={parseCronTime(cronForm.reunionReminderTime).minute}
                        onChange={(e) => handleCronChange('reunionReminderTime', buildCronExpr(parseCronTime(cronForm.reunionReminderTime).hour, e.target.value, parseCronDay(cronForm.reunionReminderTime)))}
                        className="form-input"
                        style={{ fontSize: '0.95rem', fontWeight: 600 }}
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <option key={i} value={i}>{String(i).padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1', padding: 12, background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 8 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 4 }}>NEXT SEND</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--blue)' }}>
                        {DAYS[parseInt(parseCronDay(cronForm.reunionReminderTime))]} at {String(parseCronTime(cronForm.reunionReminderTime).hour).padStart(2, '0')}:{String(parseCronTime(cronForm.reunionReminderTime).minute).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '20px 24px', background: 'var(--bg-base)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => location.reload()}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveCron} disabled={savingCron}>
              {savingCron ? '💾 Saving...' : '✓ Save Changes'}
            </button>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
