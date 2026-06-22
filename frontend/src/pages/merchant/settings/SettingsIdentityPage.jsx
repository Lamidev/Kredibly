import React, { useRef } from 'react';
import { User as UserIcon, Save } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

const getInitials = (name) => {
    if (!name) return 'K';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const SettingsIdentityPage = () => {
    const { form, setForm, saving, handleSave, uploading, handleLogoUpload } = useSettings();
    const fileInputRef = useRef(null);

    return (
        <div style={{ display: 'grid', gap: '32px' }}>
            <div style={{ marginBottom: '4px' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 950, color: '#0F172A', marginBottom: '6px', letterSpacing: '-0.03em' }}>
                    Identity
                </h1>
                <p style={{ color: '#64748B', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    Your business name, WhatsApp number, and logo shown on invoices.
                </p>
            </div>

            <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <div style={{ background: '#F0F9FF', color: '#0EA5E9', padding: '10px', borderRadius: '12px' }}>
                        <UserIcon size={20} />
                    </div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Identity Details</h2>
                </div>

                <div className="grid-2-col-responsive">
                    <div className="input-group">
                        <label className="input-label">Display Name</label>
                        <input
                            className="input-field"
                            value={form.displayName}
                            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                            style={{ background: '#F8FAFC' }}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">WhatsApp Number</label>
                        <input
                            className="input-field"
                            value={form.whatsappNumber}
                            onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                            style={{ background: '#F8FAFC' }}
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

export default SettingsIdentityPage;
