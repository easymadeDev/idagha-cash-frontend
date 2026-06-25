import { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const fetcher = (url: string) => fetch(url).then((r) => r.json());
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

  if (Array.isArray(bankAccounts) && !hasInit && !isLoading) {
    setAccountsForm(bankAccounts);
    setHasInit(true);
  }

  if (cronSchedule && !cronInit) {
    setCronForm(cronSchedule);
    setCronInit(true);
  }

  const parseCronTime = (expr: string) => {
    const p = expr.split(' ');
    return { hour: p[1], minute: p[0] };
  };
  const parseCronDay = (expr: string) => expr.split(' ')[4];
  const buildCron = (hour: string, minute: string, day?: string) =>
    day !== undefined ? `${minute} ${hour} * * ${day}` : `${minute} ${hour} * * *`;

  const handleAdd = () =>
    setAccountsForm([...accountsForm, { bank: '', accountName: 'IDAGHA CLASS 2018 ALUMNI', accountNumber: '', icon: '🏦', color: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' }]);

  const handleRemove = (i: number) => setAccountsForm(accountsForm.filter((_, idx) => idx !== i));
  const handleChange = (i: number, field: string, value: string) => {
    const u = [...accountsForm]; u[i][field] = value; setAccountsForm(u);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/bank-accounts', accountsForm);
      mutate('/api/settings/bank-accounts');
      toast('Bank accounts updated.', 'success');
    } catch { toast('Failed to save.', 'error'); }
    finally { setSaving(false); }
  };

  const handleSaveCron = async () => {
    setSavingCron(true);
    try {
      await api.put('/settings/cron-schedule', cronForm);
      mutate('/api/settings/cron-schedule');
      toast('Scheduler updated.', 'success');
    } catch { toast('Failed to save scheduler.', 'error'); }
    finally { setSavingCron(false); }
  };

  const handleCronChange = (field: string, value: any) => setCronForm({ ...cronForm, [field]: value });

  return (
    <AdminLayout>
      <div style={{ maxWidth: 680 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 2 }}>System Settings</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.8rem' }}>Manage bank accounts and automated scheduler configuration.</p>
        </div>

        {/* Bank Accounts */}
        <section className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 1 }}>Group Bank Accounts</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Shown publicly on the contribution page.</p>
            </div>
            <button className="btn btn-primary btn-sm" style={{ fontSize: '0.75rem', padding: '4px 10px' }} onClick={handleAdd}>+ Add</button>
          </div>

          {isLoading ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Loading...</div>
          ) : accountsForm.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-3)', background: 'var(--bg-base)', borderRadius: 8, fontSize: '0.8rem' }}>
              No accounts configured.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {accountsForm.map((acc, i) => (
                <div key={i} style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-base)', position: 'relative' }}>
                  <button
                    onClick={() => handleRemove(i)}
                    style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', lineHeight: 1 }}
                    title="Remove"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={labelStyle}>Bank Name</label>
                      <input className="form-input" style={inputStyle} value={acc.bank} onChange={(e) => handleChange(i, 'bank', e.target.value)} placeholder="e.g. First Bank" />
                    </div>
                    <div>
                      <label style={labelStyle}>Account Number</label>
                      <input className="form-input" style={inputStyle} value={acc.accountNumber} onChange={(e) => handleChange(i, 'accountNumber', e.target.value)} placeholder="e.g. 1234567890" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Account Name</label>
                      <input className="form-input" style={inputStyle} value={acc.accountName} onChange={(e) => handleChange(i, 'accountName', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={handleSave} disabled={saving || isLoading}>
              {saving ? 'Saving...' : 'Save Accounts'}
            </button>
          </div>
        </section>

        {/* Scheduler */}
        <section className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: 1 }}>Automated Schedulers</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Configure when birthday wishes and reunion reminders are sent.</p>
          </div>

          {cronForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {/* Birthday row */}
              <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: cronForm.birthdayEnabled ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1rem' }}>🎂</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>Birthday Wishes</span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                          background: cronForm.birthdayEnabled ? 'rgba(34,197,94,0.12)' : 'rgba(155,155,155,0.12)',
                          color: cronForm.birthdayEnabled ? 'var(--green-400)' : 'var(--text-3)',
                        }}>
                          {cronForm.birthdayEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 1 }}>Daily automated greetings</p>
                    </div>
                  </div>
                  <Toggle on={cronForm.birthdayEnabled} color="var(--green-400)" onToggle={() => handleCronChange('birthdayEnabled', !cronForm.birthdayEnabled)} />
                </div>

                {cronForm.birthdayEnabled && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Hour</label>
                      <select className="form-input" style={inputStyle}
                        value={parseCronTime(cronForm.birthdayTime).hour}
                        onChange={(e) => handleCronChange('birthdayTime', buildCron(e.target.value, parseCronTime(cronForm.birthdayTime).minute))}>
                        {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Minute</label>
                      <select className="form-input" style={inputStyle}
                        value={parseCronTime(cronForm.birthdayTime).minute}
                        onChange={(e) => handleCronChange('birthdayTime', buildCron(parseCronTime(cronForm.birthdayTime).hour, e.target.value))}>
                        {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 2, padding: '7px 10px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 7, fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-3)' }}>Sends daily at </span>
                      <span style={{ fontWeight: 700, color: 'var(--green-400)' }}>
                        {String(parseCronTime(cronForm.birthdayTime).hour).padStart(2, '0')}:{String(parseCronTime(cronForm.birthdayTime).minute).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Reunion row */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: cronForm.reunionReminderEnabled ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1rem' }}>💰</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>Reunion Fund Reminder</span>
                        <span style={{
                          fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                          background: cronForm.reunionReminderEnabled ? 'rgba(96,165,250,0.12)' : 'rgba(155,155,155,0.12)',
                          color: cronForm.reunionReminderEnabled ? 'var(--blue)' : 'var(--text-3)',
                        }}>
                          {cronForm.reunionReminderEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 1 }}>Weekly payment reminders</p>
                    </div>
                  </div>
                  <Toggle on={cronForm.reunionReminderEnabled} color="var(--blue)" onToggle={() => handleCronChange('reunionReminderEnabled', !cronForm.reunionReminderEnabled)} />
                </div>

                {cronForm.reunionReminderEnabled && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1.2 }}>
                      <label style={labelStyle}>Day</label>
                      <select className="form-input" style={inputStyle}
                        value={parseCronDay(cronForm.reunionReminderTime)}
                        onChange={(e) => handleCronChange('reunionReminderTime', buildCron(parseCronTime(cronForm.reunionReminderTime).hour, parseCronTime(cronForm.reunionReminderTime).minute, e.target.value))}>
                        {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Hour</label>
                      <select className="form-input" style={inputStyle}
                        value={parseCronTime(cronForm.reunionReminderTime).hour}
                        onChange={(e) => handleCronChange('reunionReminderTime', buildCron(e.target.value, parseCronTime(cronForm.reunionReminderTime).minute, parseCronDay(cronForm.reunionReminderTime)))}>
                        {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Minute</label>
                      <select className="form-input" style={inputStyle}
                        value={parseCronTime(cronForm.reunionReminderTime).minute}
                        onChange={(e) => handleCronChange('reunionReminderTime', buildCron(parseCronTime(cronForm.reunionReminderTime).hour, e.target.value, parseCronDay(cronForm.reunionReminderTime)))}>
                        {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{String(i).padStart(2, '0')}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1.5, padding: '7px 10px', background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.18)', borderRadius: 7, fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-3)' }}>Sends on </span>
                      <span style={{ fontWeight: 700, color: 'var(--blue)' }}>
                        {DAYS[parseInt(parseCronDay(cronForm.reunionReminderTime))]} {String(parseCronTime(cronForm.reunionReminderTime).hour).padStart(2, '0')}:{String(parseCronTime(cronForm.reunionReminderTime).minute).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => location.reload()}>Cancel</button>
            <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 14px' }} onClick={handleSaveCron} disabled={savingCron}>
              {savingCron ? 'Saving...' : 'Save Scheduler'}
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  fontSize: '0.8rem', padding: '6px 8px', height: 'auto',
};

function Toggle({ on, color, onToggle }: { on: boolean; color: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 40, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? color : 'rgba(155,155,155,0.25)', transition: 'background 0.2s',
        display: 'flex', alignItems: 'center', padding: '2px',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: 'white',
        transition: 'transform 0.2s', transform: on ? 'translateX(18px)' : 'translateX(0)',
      }} />
    </button>
  );
}
