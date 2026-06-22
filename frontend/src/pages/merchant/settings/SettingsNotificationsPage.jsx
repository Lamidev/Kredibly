import React from 'react';
import { Bell, MessageCircle, Loader2 } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

const SettingsNotificationsPage = () => {
    const { form, pushStatus, isSubscribing, handlePushToggle } = useSettings();

    return (
        <div style={{ display: 'grid', gap: '32px' }}>
            <div style={{ marginBottom: '4px' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 950, color: '#0F172A', marginBottom: '6px', letterSpacing: '-0.03em' }}>
                    Alerts
                </h1>
                <p style={{ color: '#64748B', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    Choose how Kreddy keeps you in the loop.
                </p>
            </div>

            <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <div style={{ background: '#F0F9FF', color: '#0EA5E9', padding: '10px', borderRadius: '12px' }}>
                        <Bell size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Notification Center</h2>
                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Choose how Kreddy keeps you updated.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                    {/* Browser Push */}
                    <div style={{
                        padding: '24px',
                        background: pushStatus === 'granted' ? 'rgba(34, 197, 94, 0.03)' : '#F8FAFC',
                        borderRadius: '24px',
                        border: '1px solid',
                        borderColor: pushStatus === 'granted' ? 'rgba(34, 197, 94, 0.1)' : '#E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap'
                    }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <p style={{ fontWeight: 800, color: '#1E293B', margin: 0 }}>Real-time Browser Alerts</p>
                                {pushStatus === 'granted' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 950 }}>
                                        <div className="pulse-dot" style={{ width: '6px', height: '6px', background: '#22C55E', borderRadius: '50%' }} />
                                        LIVE
                                    </div>
                                )}
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>
                                Get instant notifications on this device the moment a customer pays an invoice.
                            </p>
                        </div>
                        <button
                            onClick={handlePushToggle}
                            disabled={isSubscribing || pushStatus === 'unsupported'}
                            style={{
                                padding: '14px 28px', borderRadius: '16px', border: 'none',
                                background: pushStatus === 'granted' ? '#FEE2E2' : 'var(--primary)',
                                color: pushStatus === 'granted' ? '#EF4444' : 'white',
                                fontWeight: 900, fontSize: '0.9rem',
                                cursor: (isSubscribing || pushStatus === 'unsupported') ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: pushStatus === 'granted' ? 'none' : '0 10px 15px -3px rgba(76, 29, 149, 0.25)'
                            }}
                        >
                            {isSubscribing
                                ? <Loader2 size={18} className="spin-animation" />
                                : pushStatus === 'granted' ? 'Disable Alerts' : 'Enable Alerts'
                            }
                        </button>
                    </div>

                    {/* WhatsApp Status */}
                    <div style={{
                        padding: '24px',
                        background: 'rgba(34, 197, 94, 0.03)',
                        borderRadius: '24px',
                        border: '1px solid rgba(34, 197, 94, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px'
                    }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <p style={{ fontWeight: 800, color: '#1E293B', margin: 0 }}>WhatsApp Channel</p>
                                <div style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 950 }}>ACTIVE</div>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, fontWeight: 600 }}>
                                Kreddy is linked to <strong>{form.whatsappNumber}</strong>.
                            </p>
                        </div>
                        <div style={{ color: '#22C55E' }}>
                            <MessageCircle size={24} />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default SettingsNotificationsPage;
