import React, { useRef } from 'react';
import { User as UserIcon, Save, Bell, MessageCircle, Loader2, Users, Shield } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

const getInitials = (name) => {
    if (!name) return 'K';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const SettingsIdentityPage = () => {
    const {
        form, setForm, saving, handleSave, uploading, handleLogoUpload,
        pushStatus, isSubscribing, handlePushToggle,
        newStaffPhone, setNewStaffPhone, staffLimit, addStaff, removeStaff,
        setSelectedPlan, setShowCheckout, profile
    } = useSettings();
    const fileInputRef = useRef(null);

    return (
        <div style={{ display: 'grid', gap: '32px' }}>
            {/* Page Title */}
            <div style={{ marginBottom: '4px' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 950, color: '#0F172A', marginBottom: '6px', letterSpacing: '-0.03em' }}>
                    Identity & Access
                </h1>
                <p style={{ color: '#64748B', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    Configure business identity, alert preferences, and staff members.
                </p>
            </div>

            {/* 1. Identity Details Section */}
            <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <div style={{ background: '#F0F9FF', color: '#0EA5E9', padding: '10px', borderRadius: '12px' }}>
                        <UserIcon size={20} />
                    </div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Business Identity</h2>
                </div>

                <div className="grid-2-col-responsive" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    <div className="input-group">
                        <label className="input-label" style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#64748B', marginBottom: '8px' }}>Display Name</label>
                        <input
                            className="input-field"
                            value={form.displayName}
                            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                            style={{ background: '#F8FAFC', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label" style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', color: '#64748B', marginBottom: '8px' }}>WhatsApp Number</label>
                        <input
                            className="input-field"
                            value={form.whatsappNumber}
                            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                            style={{ background: '#F8FAFC', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                {/* Logo upload */}
                <div style={{ marginTop: '32px', padding: '24px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div
                        onClick={() => fileInputRef.current.click()}
                        style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #CBD5E1', cursor: 'pointer', overflow: 'hidden', fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)', position: 'relative' }}
                    >
                        {form.logoUrl ? (
                            <img src={form.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="logo" />
                        ) : getInitials(form.displayName)}
                        {uploading && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="spinner" />
                            </div>
                        )}
                    </div>
                    <input ref={fileInputRef} type="file" hidden onChange={(e) => handleLogoUpload(e.target.files[0])} accept="image/*" />
                    <div>
                        <p style={{ margin: '0 0 4px 0', fontWeight: 800, color: '#1E293B' }}>Business Logo</p>
                        <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                            Shown on your invoices. Recommended: square, min 200×200px.
                        </p>
                        <button
                            onClick={() => fileInputRef.current.click()}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                        >
                            Change Photo
                        </button>
                    </div>
                </div>
            </section>

            {/* 2. Notification Center / Alerts Section */}
            <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <div style={{ background: '#F0F9FF', color: '#0EA5E9', padding: '10px', borderRadius: '12px' }}>
                        <Bell size={20} />
                    </div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Notification Alerts</h2>
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

                    {/* WhatsApp Channel */}
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

            {/* 3. Staff Management Section */}
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

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '40px' }}>
                <button
                    className="btn-primary mobile-full-width"
                    style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px' }}
                    disabled={saving}
                    onClick={handleSave}
                >
                    {saving ? 'Saving...' : <><Save size={20} /> Save All Changes</>}
                </button>
            </div>
        </div>
    );
};

export default SettingsIdentityPage;
