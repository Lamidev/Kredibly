import React from 'react';
import { Users, Shield, Save } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

const SettingsStaffPage = () => {
    const {
        form, setShowCheckout, setSelectedPlan,
        newStaffPhone, setNewStaffPhone,
        staffLimit, addStaff, removeStaff,
        saving, handleSave, profile,
    } = useSettings();

    return (
        <div style={{ display: 'grid', gap: '32px' }}>
            <div style={{ marginBottom: '4px' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 950, color: '#0F172A', marginBottom: '6px', letterSpacing: '-0.03em' }}>
                    Staff
                </h1>
                <p style={{ color: '#64748B', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    Add staff WhatsApp numbers to give them access to Kreddy.
                </p>
            </div>

            <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
                {/* Plan lock overlay for Hustler plan */}
                {profile?.plan === 'hustler' && profile?.planStatus !== 'trialing' && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                        <Shield size={32} color="#F97316" style={{ marginBottom: '16px' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>Staff Access Locked</h3>
                        <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem', maxWidth: '300px', marginBottom: '20px' }}>
                            Upgrade to Oga or Chairman to add staff members.
                        </p>
                        <button
                            onClick={() => { setSelectedPlan('oga'); setShowCheckout(true); }}
                            className="btn-primary"
                            style={{ width: 'auto', padding: '12px 24px' }}
                        >
                            Upgrade Now
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#FFF7ED', color: '#F97316', padding: '10px', borderRadius: '12px' }}>
                            <Users size={20} />
                        </div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Staff Management</h2>
                    </div>
                    <div style={{ background: '#F1F5F9', padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
                        {staffLimit}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <input
                        className="input-field"
                        placeholder="Staff WhatsApp Number (e.g. 08012345678)"
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button className="btn-primary" style={{ width: 'auto', padding: '0 24px' }} onClick={addStaff}>
                        Add Staff
                    </button>
                </div>

                {form.staffNumbers.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                        <Users size={28} style={{ opacity: 0.2, marginBottom: '12px' }} />
                        <p style={{ margin: 0, color: '#94A3B8', fontWeight: 600, fontSize: '0.85rem' }}>No staff added yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {form.staffNumbers.map((phone, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#F0F9FF', color: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                                        {idx + 1}
                                    </div>
                                    <span style={{ fontWeight: 700, color: '#1E293B' }}>{phone}</span>
                                </div>
                                <button
                                    onClick={() => removeStaff(phone)}
                                    style={{ background: '#FEE2E2', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px 14px', borderRadius: '10px', fontWeight: 700, fontSize: '0.8rem' }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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

export default SettingsStaffPage;
