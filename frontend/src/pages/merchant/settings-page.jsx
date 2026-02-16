import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import CheckoutModal from '../../components/payment/CheckoutModal';
import PasswordConfirmModal from '../../components/payment/PasswordConfirmModal';
import { toast } from 'sonner';
import {
    CreditCard,
    Shield,
    User as UserIcon,
    MessageCircle,
    Save,
    Smartphone,
    Upload,
    Zap,
    Clock,
    CheckCircle,
    AlertCircle as AlertIcon,
    Loader2,
    Building2,
    Search
} from 'lucide-react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { isValidNigerianPhone, formatPhoneForDB } from '../../utils/validation';

const SettingsPage = () => {
    const { user: currentUser, profile, updateProfile } = useAuth();
    const isPro = profile?.plan === 'oga' || profile?.plan === 'chairman';
    const [saving, setSaving] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('oga');
    const [form, setForm] = useState({
        displayName: profile?.displayName || "",
        whatsappNumber: profile?.whatsappNumber || "",
        enableReminders: profile?.assistantSettings?.enableReminders ?? true,
        reminderTemplate: profile?.assistantSettings?.reminderTemplate || "friendly",
        bankName: profile?.bankDetails?.bankName || "",
        bankCode: "", // Added bankCode
        accountNumber: profile?.bankDetails?.accountNumber || "",
        accountName: profile?.bankDetails?.accountName || "",
        logoUrl: profile?.logoUrl || "",
        staffNumbers: profile?.staffNumbers || []
    });
    const [newStaffPhone, setNewStaffPhone] = useState("");
    const [uploading, setUploading] = useState(false);
    const [fetchingBanks, setFetchingBanks] = useState(false);
    const [banks, setBanks] = useState([]);
    const [resolving, setResolving] = useState(false);
    const [isPayoutSaving, setIsPayoutSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [isEditingPayout, setIsEditingPayout] = useState(!profile?.paystackSubaccountCode);
    const fileInputRef = React.useRef(null);
    const staffLimit = profile?.plan === 'chairman' ? 'Unlimited' : (profile?.plan === 'oga' ? 'Up to 2 Staff' : 'Owner Only');


    // Fetch Banks on load
    useEffect(() => {
        const fetchBanks = async () => {
            setFetchingBanks(true);
            try {
                const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
                const res = await axios.get(`${API_URL}/business/banks`, { withCredentials: true });
                if (res.data.success) {
                    const bankList = res.data.data.sort((a, b) => a.name.localeCompare(b.name));
                    setBanks(bankList);

                    // Auto-match existing bank name to code if we have a name but no code
                    if (form.bankName && !form.bankCode) {
                        const matchedBank = bankList.find(b => b.name === form.bankName);
                        if (matchedBank) {
                            setForm(prev => ({ ...prev, bankCode: matchedBank.code }));
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch banks", err);
            } finally {
                setFetchingBanks(false);
            }
        };
        fetchBanks();
    }, []); // Run once on mount

    // Resolve Account Name Automatically
    useEffect(() => {
        const resolve = async () => {
            // Only resolve if we have both and we are in editing mode (or forcing a check)
            if (isEditingPayout && form.accountNumber.length === 10 && form.bankCode) {
                setResolving(true);
                try {
                    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
                    const res = await axios.get(`${API_URL}/business/resolve-account/${form.bankCode}/${form.accountNumber}`, { withCredentials: true });
                    if (res.data.success) {
                        setForm(prev => ({ ...prev, accountName: res.data.data.account_name }));
                    } else {
                        setForm(prev => ({ ...prev, accountName: "" }));
                        toast.error(res.data.message || "Could not verify account name.");
                    }
                } catch (err) {
                    console.error("Resolution failed", err);
                    setForm(prev => ({ ...prev, accountName: "" }));
                    toast.error(err.response?.data?.message || "Invalid account number for this bank.");
                } finally {
                    setResolving(false);
                }
            } else if (isEditingPayout && form.accountNumber.length > 0 && form.accountNumber.length < 10) {
                // Only clear if the user is actively typing a non-complete number
                if (form.accountName) setForm(prev => ({ ...prev, accountName: "" }));
            }
        };
        resolve();
    }, [form.accountNumber, form.bankCode, isEditingPayout]);

    const handlePayoutSave = async (password) => {
        setIsPayoutSaving(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.post(`${API_URL}/business/payout-settings`, {
                bankCode: form.bankCode,
                accountNumber: form.accountNumber,
                bankName: form.bankName,
                password
            }, { withCredentials: true });

            if (res.data.success) {
                setForm(prev => ({ ...prev, accountName: res.data.data.bankDetails.accountName }));
                toast.success(res.data.message);
                setShowPasswordModal(false);
                setIsEditingPayout(false); // Switch back to view mode on success
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to save payout settings");
            throw err;
        } finally {
            setIsPayoutSaving(false);
        }
    };

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
                    enableReminders: form.enableReminders,
                    reminderTemplate: form.reminderTemplate
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
        
        // Plan Enforcement
        const planLimit = profile?.plan === 'chairman' ? Infinity : (profile?.plan === 'oga' ? 2 : 0);
        if (form.staffNumbers.length >= planLimit) {
            return toast.error(`Plan Limit Reached: Your ${profile?.plan?.toUpperCase()} Plan allows only ${planLimit} staff member(s). Upgrade for more.`);
        }

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
                            <UserIcon size={24} />
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

                {/* Merchant Trust Badge Section */}
                <section className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ background: '#F0FDF4', color: '#10B981', padding: '10px', borderRadius: '12px' }}>
                            <CheckCircle size={24} />
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Official Trust Badge</h2>
                    </div>

                    {(() => {
                        const isVerified = form.displayName && form.whatsappNumber && profile?.bankDetails?.accountNumber;
                        
                        if (!isVerified) {
                            return (
                                <div style={{ 
                                    background: '#FFF7ED', 
                                    padding: '24px', 
                                    borderRadius: '20px', 
                                    border: '1px solid #FED7AA',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ background: 'white', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#EA580C' }}>
                                        <Clock size={24} />
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#9A3412', marginBottom: '8px' }}>Unlock Your Verification Badge</h3>
                                    <p style={{ color: '#C2410C', fontSize: '0.9rem', marginBottom: '0', fontWeight: 600 }}>
                                        Complete your Business Identity and Payout Settings to receive your official merchant trust badge.
                                    </p>
                                </div>
                            );
                        }

                        return (
                            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: '32px', alignItems: 'center' }} className="grid-2-col-responsive">
                                {/* Badge Preview */}
                                <div style={{ overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                                    <div id="trust-badge-export" style={{ 
                                        width: '320px', 
                                        height: '320px', 
                                        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
                                        borderRadius: '24px', 
                                        position: 'relative', 
                                        overflow: 'hidden',
                                        padding: '32px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        color: 'white',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                        flexShrink: 0
                                    }}>
                                        {/* Security Patterns */}
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #10B981, #3B82F6, #10B981)' }} />
                                        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                        
                                        <div style={{ 
                                            background: 'rgba(16, 185, 129, 0.1)', 
                                            border: '2px solid #10B981', 
                                            padding: '12px', 
                                            borderRadius: '20px',
                                            marginBottom: '20px'
                                        }}>
                                            <CheckCircle size={40} color="#10B981" />
                                        </div>
                                        
                                        <h3 style={{ fontSize: '1.6rem', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'white' }}>
                                            VERIFIED
                                        </h3>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                                            MERCHANT 2026
                                        </p>
                                        
                                        <div style={{ height: '2px', width: '40px', background: 'rgba(255,255,255,0.2)', marginBottom: '16px' }} />
                                        
                                        <p style={{ fontSize: '1.2rem', fontWeight: 800, maxWidth: '200px', color: 'white' }}>
                                            {form.displayName}
                                        </p>
                                        
                                        <div style={{ position: 'absolute', bottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.7 }}>
                                            <Shield size={14} color="#10B981" />
                                            <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kredibly Secured</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Download CTA */}
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 850, color: '#1E293B', marginBottom: '12px' }}>Boost Your Credibility</h3>
                                    <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
                                        Post this badge on your <b>WhatsApp Status</b> and set it as your <b>Profile Picture</b>. Verified merchants see 3x more payment speed from customers.
                                    </p>
                                    <button 
                                        onClick={async () => {
                                            const element = document.getElementById('trust-badge-export');
                                            const canvas = await html2canvas(element, { backgroundColor: null, scale: 2 });
                                            const url = canvas.toDataURL('image/png');
                                            const link = document.createElement('a');
                                            link.download = `${form.displayName.replace(/\s+/g, '_')}_Verified_Merchant.png`;
                                            link.href = url;
                                            link.click();
                                            toast.success("Badge downloaded! Post it on your WhatsApp.");
                                        }}
                                        className="btn-primary" 
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        Download for WhatsApp <Smartphone size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
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

                    <div style={{ marginTop: '24px' }}>
                        <p style={{ fontWeight: 700, color: '#1E293B', marginBottom: '12px', fontSize: '0.95rem' }}>Reminder Tone</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button 
                                onClick={() => setForm({ ...form, reminderTemplate: 'friendly' })}
                                style={{ 
                                    padding: '16px', borderRadius: '16px', border: '2px solid', 
                                    borderColor: form.reminderTemplate === 'friendly' ? 'var(--primary)' : '#F1F5F9',
                                    background: form.reminderTemplate === 'friendly' ? '#F5F3FF' : 'white',
                                    textAlign: 'left', cursor: 'pointer', transition: '0.2s'
                                }}
                            >
                                <p style={{ margin: 0, fontWeight: 800, color: form.reminderTemplate === 'friendly' ? 'var(--primary)' : '#475569', fontSize: '0.9rem' }}>Friendly Nudge</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Soft, professional reminder for early debts.</p>
                            </button>
                            <button 
                                onClick={() => setForm({ ...form, reminderTemplate: 'formal' })}
                                style={{ 
                                    padding: '16px', borderRadius: '16px', border: '2px solid', 
                                    borderColor: form.reminderTemplate === 'formal' ? 'var(--primary)' : '#F1F5F9',
                                    background: form.reminderTemplate === 'formal' ? '#F5F3FF' : 'white',
                                    textAlign: 'left', cursor: 'pointer', transition: '0.2s'
                                }}
                            >
                                <p style={{ margin: 0, fontWeight: 800, color: form.reminderTemplate === 'formal' ? 'var(--primary)' : '#475569', fontSize: '0.9rem' }}>Formal Statement</p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Strict & clear for overdue accounts.</p>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Staff Management Section */}
                <section className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#FFF7ED', color: '#F97316', padding: '10px', borderRadius: '12px' }}>
                                <Shield size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Staff Management</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Enables the "Oga Monitor" security feature.</p>
                            </div>
                        </div>
                        <div style={{ 
                            background: '#F1F5F9', 
                            padding: '6px 14px', 
                            borderRadius: '100px', 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            color: '#475569',
                            border: '1px solid #E2E8F0'
                        }}>
                            {staffLimit}
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

                {/* Payout Settings Section - THE PREMUM REDESIGN */}
                <section className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(76, 29, 149, 0.05) 0%, transparent 70%)', zIndex: 0 }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: '#F0FDF4', color: '#10B981', padding: '10px', borderRadius: '12px' }}>
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Payout Settings</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Set where you receive money from debtors.</p>
                            </div>
                        </div>
                        {profile?.paystackSubaccountCode && (
                            <div style={{ background: '#ECFDF5', color: '#059669', padding: '6px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle size={12} /> AUTOMATED PAYOUTS ACTIVE
                            </div>
                        )}
                    </div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {!isEditingPayout ? (
                            /* READ ONLY VIEW */
                            <div style={{ 
                                background: '#F8FAFC', 
                                padding: '24px', 
                                borderRadius: '20px', 
                                border: '1px solid #E2E8F0',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Active Destination Account</p>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1E293B', margin: 0 }}>{form.accountName || profile?.bankDetails?.accountName}</h3>
                                        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#64748B', margin: '4px 0 0 0' }}>
                                            {form.bankName || profile?.bankDetails?.bankName} • {form.accountNumber || profile?.bankDetails?.accountNumber}
                                        </p>
                                    </div>
                                    <div style={{ background: '#F0F9FF', color: '#0EA5E9', padding: '12px', borderRadius: '14px' }}>
                                        <Building2 size={24} />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditingPayout(true)}
                                    style={{ 
                                        marginTop: '8px',
                                        background: 'white', 
                                        border: '1px solid #E2E8F0', 
                                        padding: '12px', 
                                        borderRadius: '12px', 
                                        fontWeight: 800, 
                                        fontSize: '0.85rem', 
                                        color: 'var(--primary)',
                                        cursor: 'pointer'
                                    }}
                                    className="hover-scale"
                                >
                                    Change Payout Details
                                </button>
                            </div>
                        ) : (
                            /* EDIT MODE FORM */
                            <div style={{ display: 'grid', gap: '24px' }}>
                                <div className="input-group">
                                    <label className="input-label">Select Bank</label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            className="input-field"
                                            value={form.bankCode}
                                            onChange={(e) => {
                                                const selectedBank = banks.find(b => b.code === e.target.value);
                                                setForm({ ...form, bankCode: e.target.value, bankName: selectedBank?.name || "" });
                                            }}
                                            style={{ background: '#F8FAFC', appearance: 'none', paddingRight: '40px' }}
                                        >
                                            <option value="">Choose a bank...</option>
                                            {banks.map(bank => (
                                                <option key={bank.code} value={bank.code}>{bank.name}</option>
                                            ))}
                                        </select>
                                        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }}>
                                            <Building2 size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid-2-col-responsive" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)' }}>
                                    <div className="input-group">
                                        <label className="input-label">Account Number</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="input-field"
                                                value={form.accountNumber}
                                                maxLength={10}
                                                onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })}
                                                placeholder="10 Search digits"
                                                style={{ background: '#F8FAFC', paddingRight: '40px' }}
                                            />
                                            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                                                {resolving ? <Loader2 size={18} className="spin-animation" /> : <Search size={18} />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Account Name</label>
                                        <div style={{ 
                                            padding: '14px', 
                                            background: form.accountName ? '#F0FDF4' : '#F1F5F9', 
                                            borderRadius: '12px', 
                                            border: '1.5px solid',
                                            borderColor: form.accountName ? '#BBF7D0' : '#E5E7EB',
                                            height: '54px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: form.accountName ? '#166534' : '#94A3B8',
                                            fontWeight: 700,
                                            fontSize: '0.95rem',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {form.accountName || "Type account number..."}
                                            {form.accountName && <CheckCircle size={16} style={{ marginLeft: 'auto', color: '#22C55E' }} />}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '8px' }}>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        {profile?.paystackSubaccountCode && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsEditingPayout(false);
                                                    // Reset form to what is in the profile
                                                    setForm(prev => ({ 
                                                        ...prev, 
                                                        bankName: profile.bankDetails?.bankName || "",
                                                        accountNumber: profile.bankDetails?.accountNumber || "",
                                                        accountName: profile.bankDetails?.accountName || ""
                                                    }));
                                                }}
                                                style={{ 
                                                    flex: 1, 
                                                    padding: '16px', 
                                                    borderRadius: '14px', 
                                                    border: '1.5px solid #E2E8F0', 
                                                    background: 'white', 
                                                    fontWeight: 700, 
                                                    color: '#64748B', 
                                                    cursor: 'pointer' 
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordModal(true)}
                                            disabled={isPayoutSaving || !form.bankCode || form.accountNumber.length !== 10 || !form.accountName}
                                            style={{
                                                flex: 2,
                                                padding: '16px',
                                                borderRadius: '14px',
                                                background: isPro ? 'linear-gradient(135deg, #10B981, #059669)' : 'var(--primary)',
                                                color: 'white',
                                                fontWeight: 800,
                                                fontSize: '0.95rem',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            className="hover-scale"
                                        >
                                            {isPayoutSaving ? (
                                                <><Loader2 size={20} className="spin-animation" /> Verifying...</>
                                            ) : (
                                                <>{profile?.paystackSubaccountCode ? "Confirm New Details" : "Setup Secure Payouts"}</>
                                            )}
                                        </button>
                                    </div>
                                    <p style={{ marginTop: '12px', fontSize: '0.75rem', color: '#64748B', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        <Shield size={12} /> {profile?.paystackSubaccountCode ? "Securely update your bank destination." : "Powered by Paystack Secure Split Settlements"}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Subscription & Plan Section */}
                <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
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
                                <h3 style={{ fontSize: 'clamp(1.25rem, 5vw, 1.75rem)', fontWeight: 950, margin: 0, letterSpacing: '-0.02em' }}>
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

                        <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                                gap: '16px', 
                                marginBottom: '24px' 
                            }}>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>Intelligence</p>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? 'Basic' : 'Genius'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>Records</p>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? '20' : 'Unlimited'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>Staff</p>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? 'Owner Only' : profile?.plan === 'oga' ? 'Owner + 2' : 'Unlimited'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>WhatsApp</p>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? 'Standard' : profile?.plan === 'oga' ? '2,000/mo' : '10,000/mo'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={14} />
                                <p style={{ fontSize: '0.8rem', fontWeight: 600, margin: 0, opacity: 0.9 }}>
                                    {profile?.planStatus === 'trialing' ? 
                                        `Free trial ends: ${new Date(profile?.trialExpiresAt).toLocaleDateString()}` :
                                        profile?.isFoundingMember ? 
                                        `Pioneer active until: ${new Date(profile?.trialExpiresAt).toLocaleDateString()}` :
                                        'Plan renews automatically.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '32px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94A3B8', textAlign: 'center', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Premium Upgrades</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 100%, 250px), 1fr))', gap: '16px' }}>
                            {profile?.plan !== 'oga' && profile?.plan !== 'chairman' && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setSelectedPlan('oga');
                                        setShowCheckout(true);
                                    }}
                                    className="glass-card clickable-card"
                                    style={{ padding: '24px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary)' }}>OGA PLAN</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>₦7k/mo</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>Multi-device support, Staff accounts & Smart Kreddy reminders.</p>
                                </button>
                            )}

                            {profile?.plan !== 'chairman' && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setSelectedPlan('chairman');
                                        setShowCheckout(true);
                                    }}
                                    className="glass-card clickable-card"
                                    style={{ padding: '24px', border: '1px solid #E9D5FF', background: 'linear-gradient(135deg, white, #FAF5FF)', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#8B5CF6' }}>CHAIRMAN</span>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>₦30k/mo</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>Voice Sync, Custom Branding, Global Exports & Priority Kreddy AI.</p>
                                </button>
                            )}

                            {profile?.plan !== 'hustler' && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setSelectedPlan(profile.plan);
                                        setShowCheckout(true);
                                    }}
                                    style={{ padding: '20px', borderRadius: '20px', border: '1px dashed var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem' }}
                                >
                                    Renew Current Plan
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {showCheckout && (
                    <CheckoutModal 
                        plan={selectedPlan}
                        billingCycle="monthly"
                        userEmail={currentUser?.email}
                        onClose={() => setShowCheckout(false)}
                        onSuccess={async (reference, plan, billingCycle, couponCode) => {
                            try {
                                const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
                                await axios.post(`${API_URL}/payments/verify`, {
                                    reference: reference.reference,
                                    plan,
                                    billingCycle,
                                    couponCode
                                }, { withCredentials: true });
                                
                                // Modal handles the success UI, we just trigger reload after delay
                                setTimeout(() => window.location.reload(), 4500);
                            } catch (err) {
                                toast.error("Payment verified but upgrade failed. Contact support.");
                                throw err;
                            }
                        }}
                    />
                )}
                
                <PasswordConfirmModal 
                    isOpen={showPasswordModal}
                    onClose={() => setShowPasswordModal(false)}
                    onConfirm={handlePayoutSave}
                />

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
