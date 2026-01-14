import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import {
    Bell,
    CreditCard,
    Shield,
    User,
    MessageCircle,
    Save,
    Building,
    Mail,
    Smartphone,
    Camera,
    Upload
} from 'lucide-react';
import axios from 'axios';

const SettingsPage = () => {
    const { profile, updateProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        displayName: profile?.displayName || "",
        whatsappNumber: profile?.whatsappNumber || "",
        enableReminders: profile?.assistantSettings?.enableReminders ?? true,
        bankName: profile?.bankDetails?.bankName || "",
        accountNumber: profile?.bankDetails?.accountNumber || "",
        accountNumber: profile?.bankDetails?.accountNumber || "",
        accountName: profile?.bankDetails?.accountName || "",
        logoUrl: profile?.logoUrl || ""
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    const getInitials = (name) => {
        if (!name) return "K";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("logo", file);

        setUploading(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.post(`${API_URL}/common/upload-logo`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
            });
            if (res.data.success) {
                setForm({ ...form, logoUrl: res.data.url });
                toast.success("Logo uploaded!");
            }
        } catch (err) {
            toast.error("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setSaving(true);
        try {
            await updateProfile({
                displayName: form.displayName,
                whatsappNumber: form.whatsappNumber,
                assistantSettings: {
                    enableReminders: form.enableReminders
                },
                bankDetails: {
                    bankName: form.bankName,
                    accountNumber: form.accountNumber,
                    accountName: form.accountName
                },
                logoUrl: form.logoUrl
            });
            toast.success("Settings updated successfully!");
        } catch (err) {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px', letterSpacing: '-0.02em' }}>Settings</h1>
                <p style={{ color: '#64748B', fontWeight: 500 }}>Manage your business identity, Kreddy (your AI partner), and payments.</p>
            </div>

            <div style={{ display: 'grid', gap: '32px' }}>
                {/* Profile Section */}
                <section className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ background: '#F0F9FF', color: '#0EA5E9', padding: '10px', borderRadius: '12px' }}>
                            <User size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Business Identity</h2>
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

                    <div style={{ marginTop: '32px', padding: '24px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div
                            onClick={() => fileInputRef.current.click()}
                            style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #CBD5E1', cursor: 'pointer', overflow: 'hidden', fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)', position: 'relative' }}
                        >
                            {form.logoUrl ? (
                                <img src={form.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                getInitials(form.displayName)
                            )}
                            {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}
                        </div>
                        <input ref={fileInputRef} type="file" hidden onChange={handleLogoUpload} />
                        <div>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 800, color: '#1E293B' }}>Business Logo</p>
                            <button
                                onClick={() => fileInputRef.current.click()}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
                            >
                                Change Photo
                            </button>
                        </div>
                    </div>
                </section>

                {/* AI Assistant Section */}
                <section className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ background: '#F5F3FF', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                            <MessageCircle size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Kreddy (AI Partner)</h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                        <div>
                            <p style={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>Proactive Debt Reminders</p>
                            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>Kreddy will automatically nudge customers when their balance is due.</p>
                        </div>
                        <div style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px' }}>
                            <input
                                type="checkbox"
                                id="reminder-toggle"
                                checked={form.enableReminders}
                                onChange={(e) => setForm({ ...form, enableReminders: e.target.checked })}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <label
                                htmlFor="reminder-toggle"
                                style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: form.enableReminders ? 'var(--primary)' : '#CBD5E1', borderRadius: '34px', transition: '.4s'
                                }}
                            >
                                <span style={{
                                    position: 'absolute', content: '""', height: '20px', width: '20px', left: '4px', bottom: '4px',
                                    backgroundColor: 'white', borderRadius: '50%', transition: '.4s',
                                    transform: form.enableReminders ? 'translateX(22px)' : 'translateX(0)'
                                }}></span>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Payment Bridge Section */}
                <section className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ background: '#F0FDF4', color: '#10B981', padding: '10px', borderRadius: '12px' }}>
                            <CreditCard size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Payment Bridge</h2>
                    </div>

                    <div style={{ display: 'grid', gap: '24px' }}>
                        <div className="input-group">
                            <label className="input-label">Bank Name</label>
                            <input
                                className="input-field"
                                value={form.bankName}
                                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                                placeholder="e.g. GTBank"
                                style={{ background: '#F8FAFC' }}
                            />
                        </div>
                        <div className="grid-2-col-responsive">
                            <div className="input-group">
                                <label className="input-label">Account Number</label>
                                <input
                                    className="input-field"
                                    value={form.accountNumber}
                                    onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                                    placeholder="10 digits"
                                    style={{ background: '#F8FAFC' }}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Account Name</label>
                                <input
                                    className="input-field"
                                    value={form.accountName}
                                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                                    placeholder="Full Name"
                                    style={{ background: '#F8FAFC' }}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingBottom: '40px' }}>
                    <button
                        className="btn-primary"
                        style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px' }}
                        disabled={saving}
                        onClick={handleSave}
                    >
                        {saving ? "Saving changes..." : <><Save size={20} /> Save All Settings</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
