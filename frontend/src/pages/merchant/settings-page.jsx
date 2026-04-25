import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    Loader2,
    Building2,
    Search
} from 'lucide-react';
import axios from 'axios';
import { isValidNigerianPhone, formatPhoneForDB } from '../../utils/validation';

const SettingsPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user: currentUser, profile, updateProfile } = useAuth();
    
    // Check for Return from Nomba Checkout
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('checkout') === 'success') {
            toast.success("Payment Received! Validating your upgrade...");
            navigate('/merchant/settings', { replace: true });
            
            import('canvas-confetti').then((module) => {
                const confetti = module.default;
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            });
        }
    }, [location, navigate]);

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
        staffNumbers: profile?.staffNumbers || [],
        prefersGatewayFeeAbsorption: profile?.prefersGatewayFeeAbsorption ?? true
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

    const [lockCountdown, setLockCountdown] = useState("");
    
    // Update Vault Lock Countdown
    useEffect(() => {
        const lockUntil = profile?.bankDetails?.bankDetailsLockUntil;
        if (!lockUntil || new Date(lockUntil) <= new Date()) {
            setLockCountdown("");
            return;
        }

        const timer = setInterval(() => {
            const now = new Date();
            const end = new Date(lockUntil);
            const diff = end - now;

            if (diff <= 0) {
                setLockCountdown("");
                clearInterval(timer);
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setLockCountdown(`${h}h ${m}m ${s}s`);
        }, 1000);

        return () => clearInterval(timer);
    }, [profile?.bankDetails?.bankDetailsLockUntil]);

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("logo", file);

        setUploading(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.post(`${API_URL}/common/upload-logo`, formData, {
                withCredentials: true,
            });
            if (res.data.success) {
                const newLogoUrl = res.data.url;
                setForm(prev => ({ ...prev, logoUrl: newLogoUrl }));
                
                // Auto-save immediately to DB
                await updateProfile({ logoUrl: newLogoUrl });
                toast.success("Logo uploaded & saved successfully!");
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
                logoUrl: form.logoUrl,
                staffNumbers: form.staffNumbers,
                prefersGatewayFeeAbsorption: form.prefersGatewayFeeAbsorption
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
        const planLimit = profile?.plan === 'chairman' ? Infinity : (profile?.plan === 'oga' ? 1 : 0);
        if (form.staffNumbers.length >= planLimit) {
            return toast.error(`Plan Limit Reached: Your ${profile?.plan?.toUpperCase()} Plan allows only ${planLimit} staff member. Upgrade for more.`);
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
                <h1 style={{ fontSize: 'clamp(1.6rem, 8vw, 2.5rem)', fontWeight: 900, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.03em' }}>Settings</h1>
                <p style={{ color: '#64748B', fontWeight: 500, margin: 0 }}>Manage your business identity, Kreddy (your AI partner), and payments.</p>
            </div>

            <div style={{ display: 'grid', gap: '32px' }}>
                {/* Profile Section */}
                <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
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

                    <div style={{ marginTop: '32px', padding: '24px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
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
                <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
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
                <section 
                    className="glass-card" 
                    style={{ 
                        padding: 'clamp(20px, 5%, 32px)', 
                        background: 'white', 
                        borderRadius: '24px', 
                        border: '1px solid #E2E8F0', 
                        marginBottom: '32px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {profile?.plan === 'hustler' && profile?.planStatus !== 'trialing' && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '24px',
                            textAlign: 'center'
                        }}>
                            <div style={{ background: '#FFF7ED', color: '#F97316', padding: '16px', borderRadius: '24px', marginBottom: '16px' }}>
                                <Shield size={32} />
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>Staff Access Locked</h3>
                            <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem', maxWidth: '300px', marginBottom: '20px' }}>
                                Add staff members to record sales while you monitor their activities from anywhere.
                            </p>
                            <button 
                                onClick={() => {
                                    setSelectedPlan('oga');
                                    setShowCheckout(true);
                                }}
                                className="btn-primary" 
                                style={{ width: 'auto', padding: '12px 24px' }}
                            >
                                Upgrade to Oga
                            </button>
                        </div>
                    )}
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
                <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(76, 29, 149, 0.05) 0%, transparent 70%)', zIndex: 0 }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(76, 29, 149, 0.08)', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Payout Settings</h2>
                                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Set where you receive money from debtors.</p>
                            </div>
                        </div>
                        {profile?.paystackSubaccountCode && (
                            <div style={{ background: 'rgba(76, 29, 149, 0.08)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
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
                                                placeholder="10 digit account number"
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
                                            background: form.accountName ? 'rgba(76, 29, 149, 0.04)' : '#F1F5F9', 
                                            borderRadius: '12px', 
                                            border: '1.5px solid',
                                            borderColor: form.accountName ? 'rgba(76, 29, 149, 0.2)' : '#E5E7EB',
                                            height: '54px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: form.accountName ? 'var(--primary)' : '#94A3B8',
                                            fontWeight: 700,
                                            fontSize: '0.95rem',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {form.accountName || "Type account number..."}
                                            {form.accountName && <CheckCircle size={16} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />}
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
                                                background: 'var(--primary)',
                                                color: 'white',
                                                fontWeight: 800,
                                                fontSize: '0.95rem',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                boxShadow: '0 10px 15px -3px rgba(76, 29, 149, 0.25)',
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

                    <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #F1F5F9', position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', background: 'rgba(76, 29, 149, 0.04)', borderRadius: '20px', border: '1px solid rgba(76, 29, 149, 0.1)' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <p style={{ fontWeight: 800, color: '#1E293B', margin: 0 }}>Transaction Fee Recovery</p>
                                    <span style={{ fontSize: '10px', fontWeight: 900, background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase' }}>Smart</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, fontWeight: 600 }}>
                                    {form.prefersGatewayFeeAbsorption 
                                        ? "You are absorbing all gateway fees. Customers pay exactly the invoice amount." 
                                        : "Fees are passed to the customer. You receive 100% of your invoice amount."}
                                </p>
                            </div>
                            <div style={{ position: 'relative', display: 'inline-block', width: '60px', height: '32px', marginLeft: '20px' }}>
                                <input
                                    type="checkbox"
                                    id="fee-toggle"
                                    checked={!form.prefersGatewayFeeAbsorption}
                                    onChange={(e) => setForm({ ...form, prefersGatewayFeeAbsorption: !e.target.checked })}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <label
                                    htmlFor="fee-toggle"
                                    style={{
                                        position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                        backgroundColor: !form.prefersGatewayFeeAbsorption ? 'var(--primary)' : '#CBD5E1', borderRadius: '34px', transition: '.4s'
                                    }}
                                >
                                    <span style={{
                                        position: 'absolute', content: '""', height: '24px', width: '24px', left: '4px', bottom: '4px',
                                        backgroundColor: 'white', borderRadius: '50%', transition: '.4s',
                                        transform: !form.prefersGatewayFeeAbsorption ? 'translateX(28px)' : 'translateX(0)',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}></span>
                                </label>
                            </div>
                        </div>
                        <p style={{ marginTop: '12px', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textAlign: 'center' }}>
                            Tip: Most merchants pass fees to customers to ensure they get their full money instantly.
                        </p>
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
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? 'Standard' : 'Genius +'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>Sales Records</p>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? '10/mo' : 'Unlimited'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>Staff Limit</p>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? 'Owner' : profile?.plan === 'oga' ? 'Owner + 1' : 'Unlimited'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6, marginBottom: '4px', letterSpacing: '0.05em' }}>AI Quota</p>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{profile?.plan === 'hustler' ? '50/mo' : profile?.plan === 'oga' ? '150/mo' : '150/mo'}</p>
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
                                    style={{ padding: '24px', border: '1px solid var(--primary)', background: 'white', cursor: 'pointer', textAlign: 'left', width: '100%', position: 'relative', overflow: 'hidden' }}
                                >
                                    <div style={{ position: 'absolute', top: '0', left: '0', background: 'var(--primary)', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '4px 12px', borderRadius: '0 0 12px 0', textTransform: 'uppercase' }}>50% OFF PIONEER</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary)' }}>OGA PLAN</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textDecoration: 'line-through', marginRight: '6px' }}>₦6,000</span>
                                            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A' }}>₦3,000/mo</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>Voice Notes, Proactive Debt Reminders & 1 Staff. Pioneer Special active until May.</p>
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
                                    style={{ padding: '24px', border: '1px solid #8B5CF6', background: 'white', cursor: 'pointer', textAlign: 'left', width: '100%', position: 'relative', overflow: 'hidden' }}
                                >
                                    <div style={{ position: 'absolute', top: '0', left: '0', background: '#8B5CF6', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '4px 12px', borderRadius: '0 0 12px 0', textTransform: 'uppercase' }}>FOUNDER PRE-ORDER</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#8B5CF6' }}>CHAIRMAN</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textDecoration: 'line-through', marginRight: '6px' }}>₦9,000</span>
                                            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A' }}>₦4,500/mo</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>Image Recognition Receipts, White-Labeling & Unlimited Staff. Best for Scale.</p>
                                </button>
                            )}

                            {profile?.plan !== 'hustler' && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setSelectedPlan(profile.plan);
                                        setShowCheckout(true);
                                    }}
                                    className="glass-card clickable-card"
                                    style={{ padding: '24px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', textAlign: 'left', width: '100%', position: 'relative', overflow: 'hidden' }}
                                >
                                    <div style={{ position: 'absolute', top: '0', left: '0', background: '#334155', color: 'white', fontSize: '0.6rem', fontWeight: 900, padding: '4px 12px', borderRadius: '0 0 12px 0', textTransform: 'uppercase' }}>SPECIAL RENEWAL</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', marginTop: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#334155' }}>RENEW {profile.plan.toUpperCase()}</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textDecoration: 'line-through', marginRight: '6px' }}>
                                                ₦{profile.plan === 'oga' ? '6,000' : '9,000'}
                                            </span>
                                            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0F172A' }}>
                                                ₦{profile.plan === 'oga' ? '3,000' : '4,500'}/mo
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: 0, fontWeight: 600, lineHeight: 1.5 }}>Maintain all your premium data, staff access, and Kreddy intelligence features.</p>
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {showCheckout && (
                    <CheckoutModal 
                        plan={selectedPlan}
                        billingCycle={new Date() < new Date('2026-06-01') ? 'launch' : 'monthly'}
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
