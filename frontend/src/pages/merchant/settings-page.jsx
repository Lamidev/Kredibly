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
    Upload,
    Zap,
    ShieldCheck,
    Clock
} from 'lucide-react';
import axios from 'axios';
import { isValidNigerianPhone, formatPhoneForDB } from '../../utils/validation';

const SettingsPage = () => {
    const { profile, updateProfile } = useAuth();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        displayName: profile?.displayName || "",
        whatsappNumber: profile?.whatsappNumber || "",
        enableReminders: profile?.assistantSettings?.enableReminders ?? true,
        bankName: profile?.bankDetails?.bankName || "",
        accountNumber: profile?.bankDetails?.accountNumber || "",
        accountName: profile?.bankDetails?.accountName || "",
        logoUrl: profile?.logoUrl || "",
        staffNumbers: profile?.staffNumbers || []
    });
    const [newStaffPhone, setNewStaffPhone] = useState("");
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
        if (!isValidNigerianPhone(form.whatsappNumber)) {
            setSaving(false);
            return toast.error("Invalid WhatsApp number format");
        }

        try {
            await updateProfile({
                displayName: form.displayName,
                whatsappNumber: formatPhoneForDB(form.whatsappNumber),
                assistantSettings: {
                    enableReminders: form.enableReminders
                },
                bankDetails: {
                    bankName: form.bankName,
                    accountNumber: form.accountNumber,
                    accountName: form.accountName
                },
                logoUrl: form.logoUrl,
                staffNumbers: form.staffNumbers
            });
            toast.success("Settings updated successfully!");
        } catch (err) {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    const addStaff = () => {
        if (!newStaffPhone) return;
        if (!isValidNigerianPhone(newStaffPhone)) {
            return toast.error("Invalid staff phone number");
        }
        const formatted = formatPhoneForDB(newStaffPhone);
        if (form.staffNumbers.includes(formatted)) {
            return toast.error("Number already added");
        }
        setForm({ ...form, staffNumbers: [...form.staffNumbers, formatted] });
        setNewStaffPhone("");
    };

    const removeStaff = (phone) => {
        setForm({ ...form, staffNumbers: form.staffNumbers.filter(p => p !== phone) });
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px', letterSpacing: '-0.02em' }}>Settings</h1>
                <p style={{ color: '#64748B', fontWeight: 500, margin: 0 }}>Manage your business identity, Kreddy (your AI partner), and payments.</p>
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

                {/* Staff Management Section */}
                <section className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ background: '#FFF7ED', color: '#F97316', padding: '10px', borderRadius: '12px' }}>
                            <Shield size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Staff Management</h2>
                            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Enables the "Oga Monitor" security feature.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        <input 
                            className="input-field" 
                            placeholder="Staff WhatsApp (e.g. 080123...)" 
                            value={newStaffPhone}
                            onChange={(e) => setNewStaffPhone(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button 
                            className="btn-primary" 
                            style={{ width: 'auto', padding: '0 24px', flexShrink: 0, height: '54px' }}
                            type="button"
                            onClick={addStaff}
                        >
                            Add Staff
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {form.staffNumbers.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', padding: '20px', border: '2px dashed #F1F5F9', borderRadius: '16px' }}>
                                No staff members added yet. Add them to allow them to record sales while you receive alerts!
                            </p>
                        )}
                        {form.staffNumbers.map((phone, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Smartphone size={18} color="#64748B" />
                                    <span style={{ fontWeight: 700, color: '#1E293B' }}>{phone}</span>
                                </div>
                                <button 
                                    onClick={() => removeStaff(phone)}
                                    type="button"
                                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '8px' }}
                                >
                                    <Upload size={18} style={{ transform: 'rotate(180deg)' }} /> 
                                </button>
                            </div>
                        ))}
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

                {/* Subscription & Plan Section */}
                <section className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ background: '#FFF1F2', color: '#E11D48', padding: '10px', borderRadius: '12px' }}>
                            <Zap size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Subscription & Plan</h2>
                    </div>

                    <div style={{ 
                        padding: '24px', 
                        background: profile?.plan === 'chairman' ? 'linear-gradient(135deg, #0F172A, #1E293B)' : 
                                    profile?.plan === 'oga' ? 'linear-gradient(135deg, #B45309, #D97706)' : 
                                    '#F8FAFC', 
                        borderRadius: '20px', 
                        border: '1px solid #E2E8F0',
                        color: (profile?.plan === 'oga' || profile?.plan === 'chairman') ? 'white' : '#1E293B'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>Current Plan</span>
                                    {profile?.isFoundingMember && (
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#4ADE80', color: '#064E3B', padding: '2px 8px', borderRadius: '6px' }}>★ FOUNDING MEMBER</span>
                                    )}
                                </div>
                                <h3 style={{ fontSize: '1.75rem', fontWeight: 950, margin: 0, letterSpacing: '-0.02em' }}>
                                    {profile?.plan?.toUpperCase() || 'HUSTLER'}
                                </h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8, marginBottom: '4px' }}>Status</p>
                                <span style={{ 
                                    fontSize: '0.8rem', 
                                    fontWeight: 800, 
                                    background: 'rgba(255,255,255,0.2)', 
                                    padding: '6px 16px', 
                                    borderRadius: '100px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    {profile?.planStatus?.toUpperCase() || 'ACTIVE'}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(120px, 45%, 140px), 1fr))', 
                                gap: '16px', 
                                marginBottom: '24px' 
                            }}>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>AI Intelligence</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? 'Basic AI' : 'Super Smart AI'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>Monthly Records</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? '20' : 'Unlimited'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>WhatsApp Limit</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? 'Standard' : profile?.plan === 'oga' ? '2,000/mo' : '10,000/mo'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>Staff Limit</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? '1 (Owner)' : profile?.plan === 'oga' ? '3 (Owner + 2)' : 'Unlimited'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>Voice Sync</p>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'chairman' ? 'Enabled' : 'Disabled'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Clock size={16} />
                                <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
                                    {profile?.planStatus === 'trialing' ? 
                                        `Your free trial ends on ${new Date(profile?.trialExpiresAt).toLocaleDateString()}` :
                                        profile?.isFoundingMember ? 
                                        `Pioneer period active until ${new Date(profile?.trialExpiresAt).toLocaleDateString()}` :
                                        'Plan renews automatically per your billing cycle.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                        <button 
                            type="button"
                            onClick={() => window.open('/pricing', '_blank')}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                            View Plan Details & Pricing
                        </button>
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
