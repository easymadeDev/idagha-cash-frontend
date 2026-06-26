import { useState, useMemo, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import useSWR, { mutate } from 'swr';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const authFetcher = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idagha_token') || '' : ''}` } }).then((r) => r.json());

function parseBirthdayMonthDay(birthday: string): { month: number; day: number } | null {
  if (!birthday) return null;
  const b = birthday.trim();
  // YYYY-MM-DD or MM-DD
  let m = b.match(/(?:\d{4}-)?(\d{1,2})-(\d{1,2})/);
  if (m) return { month: parseInt(m[1]) - 1, day: parseInt(m[2]) };
  // DD/MM or MM/DD — assume DD/MM (Nigerian convention)
  m = b.match(/(\d{1,2})\/(\d{1,2})/);
  if (m) return { month: parseInt(m[2]) - 1, day: parseInt(m[1]) };
  return null;
}

function getUpcomingBirthdays(members: any[], windowDays = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results: { name: string; photo: string; daysUntil: number; month: number; day: number }[] = [];

  for (const m of members) {
    if (!m.birthday) continue;
    const parsed = parseBirthdayMonthDay(m.birthday);
    if (!parsed) continue;

    const thisYear = new Date(today.getFullYear(), parsed.month, parsed.day);
    thisYear.setHours(0, 0, 0, 0);
    let diff = Math.round((thisYear.getTime() - today.getTime()) / 86400000);
    if (diff < 0) {
      const nextYear = new Date(today.getFullYear() + 1, parsed.month, parsed.day);
      diff = Math.round((nextYear.getTime() - today.getTime()) / 86400000);
    }
    if (diff <= windowDays) {
      results.push({ name: m.name, photo: m.photo, daysUntil: diff, month: parsed.month, day: parsed.day });
    }
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

export default function AdminSettings() {
  const { toast } = useToast();
  const { data: bankAccounts, isLoading } = useSWR('/api/settings/bank-accounts', fetcher);
  const { data: cronSchedule } = useSWR('/api/settings/cron-schedule', authFetcher);
  const { data: members } = useSWR('/api/members', fetcher);

  const [saving, setSaving] = useState(false);
  const [savingCron, setSavingCron] = useState(false);
  const [accountsForm, setAccountsForm] = useState<any[]>([]);
  const [hasInit, setHasInit] = useState(false);
  const [cronForm, setCronForm] = useState<any>({ birthdayTime: '0 8 * * *', reunionReminderTime: '0 8 * * 1', birthdayEnabled: true, reunionReminderEnabled: true, birthdayChannels: ['email', 'whatsapp'], reunionReminderChannels: ['email', 'whatsapp'] });
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

  const toggleChannel = (channelField: 'birthdayChannels' | 'reunionReminderChannels', ch: string) => {
    const current: string[] = cronForm[channelField] || ['email', 'whatsapp'];
    const next = current.includes(ch) ? current.filter((c: string) => c !== ch) : [...current, ch];
    // Must keep at least one channel
    if (next.length === 0) return;
    handleCronChange(channelField, next);
  };

  const upcomingBirthdays = useMemo(() => {
    if (!Array.isArray(members)) return [];
    return getUpcomingBirthdays(members);
  }, [members]);

  const [waStatus, setWaStatus] = useState<{ ready: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/whatsapp/status').then(r => r.json()).then(setWaStatus).catch(() => setWaStatus(null));
  }, []);

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
                  <>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 12 }}>
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

                    {/* Birthday Channels */}
                    <ChannelPicker
                      channels={cronForm.birthdayChannels || ['email', 'whatsapp']}
                      onToggle={(ch) => toggleChannel('birthdayChannels', ch)}
                      waReady={waStatus?.ready}
                    />

                    {/* Upcoming Birthdays */}
                    <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Upcoming Birthdays (30 days)</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{upcomingBirthdays.length} member{upcomingBirthdays.length !== 1 ? 's' : ''}</span>
                      </div>
                      {upcomingBirthdays.length === 0 ? (
                        <div style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center' }}>No birthdays in the next 30 days</div>
                      ) : (
                        <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                          {upcomingBirthdays.map((b, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderBottom: i < upcomingBirthdays.length - 1 ? '1px solid var(--border)' : 'none' }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {b.photo ? (
                                  <img src={b.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{b.name[0]}</span>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.775rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>{MONTHS[b.month]} {b.day}</div>
                              </div>
                              <span style={{
                                fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99, flexShrink: 0,
                                background: b.daysUntil === 0 ? 'rgba(34,197,94,0.15)' : b.daysUntil <= 3 ? 'rgba(251,146,60,0.15)' : 'rgba(155,155,155,0.1)',
                                color: b.daysUntil === 0 ? 'var(--green-400)' : b.daysUntil <= 3 ? '#fb923c' : 'var(--text-3)',
                              }}>
                                {b.daysUntil === 0 ? 'Today!' : b.daysUntil === 1 ? 'Tomorrow' : `${b.daysUntil}d`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                  <ChannelPicker
                    channels={cronForm.reunionReminderChannels || ['email', 'whatsapp']}
                    onToggle={(ch) => toggleChannel('reunionReminderChannels', ch)}
                    waReady={waStatus?.ready}
                  />
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

const badgeStyle = (color: string, bg: string): React.CSSProperties => ({
  fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99, color, background: bg,
});

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  fontSize: '0.8rem', padding: '6px 8px', height: 'auto',
};

function ChannelPicker({ channels, onToggle, waReady }: { channels: string[]; onToggle: (ch: string) => void; waReady?: boolean }) {
  const emailOn = channels.includes('email');
  const waOn = channels.includes('whatsapp');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8 }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>Send via</span>
      <button
        onClick={() => onToggle('email')}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: emailOn ? 'rgba(96,165,250,0.15)' : 'rgba(155,155,155,0.08)',
          color: emailOn ? 'var(--blue)' : 'var(--text-3)', fontWeight: 700, fontSize: '0.75rem',
          outline: emailOn ? '1.5px solid rgba(96,165,250,0.4)' : '1px solid var(--border)',
          transition: 'all 0.15s',
        }}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Email
      </button>
      <button
        onClick={() => onToggle('whatsapp')}
        style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
          background: waOn ? 'rgba(37,211,102,0.12)' : 'rgba(155,155,155,0.08)',
          color: waOn ? '#25d366' : 'var(--text-3)', fontWeight: 700, fontSize: '0.75rem',
          outline: waOn ? '1.5px solid rgba(37,211,102,0.35)' : '1px solid var(--border)',
          transition: 'all 0.15s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        WhatsApp
        {waOn && !waReady && <span style={{ fontSize: '0.6rem', color: '#f59e0b', marginLeft: 2 }}>⚠</span>}
      </button>
      {waOn && !waReady && (
        <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>WhatsApp not connected</span>
      )}
    </div>
  );
}

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
