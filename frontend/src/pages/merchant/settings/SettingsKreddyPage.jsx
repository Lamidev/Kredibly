import React from 'react';
import { MessageCircle, Save } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

const SettingsKreddyPage = () => {
    const { form, setForm, saving, handleSave } = useSettings();

    return (
        <div style={{ display: 'grid', gap: '32px' }}>
            <div style={{ marginBottom: '4px' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 950, color: '#0F172A', marginBottom: '6px', letterSpacing: '-0.03em' }}>
                    Kreddy AI
                </h1>
                <p style={{ color: '#64748B', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    Configure how your Digital Chief of Staff behaves.
                </p>
            </div>

            <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <div style={{ background: '#F5F3FF', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                        <MessageCircle size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Kreddy Assistant</h2>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Configure how your Digital Chief of Staff behaves.</p>
                    </div>
                </div>

                {/* Smart Reminders Toggle */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '24px', background: '#F8FAFC', borderRadius: '24px', border: '1px solid #E2E8F0',
                    gap: '12px', flexWrap: 'nowrap', marginBottom: '32px'
                }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 800, color: '#1E293B', marginBottom: '4px', margin: 0 }}>Smart Reminder Drafts</p>
                        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, fontWeight: 600, lineHeight: 1.4 }}>
                            Kreddy will prepare draft reminders for you to send when a balance is due.
                        </p>
                    </div>
                    <div style={{ position: 'relative', display: 'inline-block', width: '56px', height: '30px', flexShrink: 0 }}>
                        <input
                            type="checkbox" id="reminder-toggle"
                            checked={form.enableReminders}
                            onChange={(e) => setForm({ ...form, enableReminders: e.target.checked })}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <label htmlFor="reminder-toggle" style={{
                            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: form.enableReminders ? 'var(--primary)' : '#CBD5E1', borderRadius: '34px', transition: '.4s'
                        }}>
                            <span style={{
                                position: 'absolute', height: '22px', width: '22px', left: '4px', bottom: '4px',
                                backgroundColor: 'white', borderRadius: '50%', transition: '.4s',
                                transform: form.enableReminders ? 'translateX(26px)' : 'translateX(0)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }} />
                        </label>
                    </div>
                </div>

                {/* Reminder Personality */}
                <div>
                    <p style={{ fontWeight: 800, color: '#1E293B', marginBottom: '16px', fontSize: '0.95rem' }}>Reminder Personality</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        {[
                            { id: 'friendly', title: 'Friendly', desc: 'Soft, professional draft tone. Best for regulars.' },
                            { id: 'formal', title: 'Formal', desc: 'Strict & clear tone. Best for overdue accounts.' },
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => setForm({ ...form, reminderTemplate: opt.id })}
                                style={{
                                    padding: '20px', borderRadius: '20px', border: '2px solid',
                                    borderColor: form.reminderTemplate === opt.id ? 'var(--primary)' : '#F1F5F9',
                                    background: form.reminderTemplate === opt.id ? 'rgba(76, 29, 149, 0.03)' : 'white',
                                    textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: form.reminderTemplate === opt.id ? 'var(--primary)' : '#CBD5E1' }} />
                                    <p style={{ margin: 0, fontWeight: 900, color: form.reminderTemplate === opt.id ? 'var(--primary)' : '#475569' }}>{opt.title}</p>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', fontWeight: 600, lineHeight: 1.4 }}>{opt.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '40px' }}>
                <button
                    className="btn-primary mobile-full-width"
                    style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px' }}
                    disabled={saving}
                    onClick={handleSave}
                >
                    {saving ? 'Saving...' : <><Save size={20} /> Save Changes</>}
                </button>
            </div>
        </div>
    );
};

export default SettingsKreddyPage;
