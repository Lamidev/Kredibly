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
            navigate('/settings', { replace: true });
            
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
    const [isEditingPayout, setIsEditingPayout] = useState(!profile?.bankDetails?.accountNumber);
    
    // KYC State
    const [activeTab, setActiveTab] = useState('profile');
    const [kycType, setKycType] = useState(profile?.kyc?.method && profile.kyc.method !== 'none' ? profile.kyc.method : "bvn");
    const [idNumber, setIdNumber] = useState("");
    const [dob, setDob] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    
    const fileInputRef = React.useRef(null);
    const staffLimit = profile?.plan === 'chairman' ? 'Unlimited' : (profile?.plan === 'oga' ? 'Up to 2 Staff' : 'Owner Only');

    // Handle Tab Change from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab) setActiveTab(tab);

        // Sync KYC type if profile loads late
        if (profile?.kyc?.method && profile.kyc.method !== 'none') {
            setKycType(profile.kyc.method);
        }
    }, [location, profile]);


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

    const handleVerifyKYC = async () => {
        if (!idNumber || idNumber.length < 10) return toast.error("Please enter a valid ID number");
        setIsVerifying(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.post(`${API_URL}/business/kyc/verify`, {
                type: kycType,
                idNumber,
                dob
            }, { withCredentials: true });
            
            if (res.data.success) {
                toast.success("Identity Verified Successfully!");
                // Refresh profile via context
                await updateProfile({}); 
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Verification failed. Check your details.");
        } finally {
            setIsVerifying(false);
        }
    };

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
        <div className="animate-fade-in" style={{ maxWidth: '900px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: 'clamp(1.6rem, 8vw, 2.5rem)', fontWeight: 950, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.03em' }}>Settings</h1>
                <p style={{ color: '#64748B', fontWeight: 600, margin: 0 }}>Manage your business identity, Kreddy (your AI partner), and payouts.</p>
            </div>

            {/* Tab Navigation */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '40px', 
                padding: '6px', 
                background: 'rgba(15, 23, 42, 0.03)', 
                borderRadius: '18px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
            }} className="no-scrollbar">
                {[
                    { id: 'profile', label: 'Identity', icon: UserIcon },
                    { id: 'payout', label: 'Payouts', icon: CreditCard },
                    { id: 'kyc', label: 'Trust & Verification', icon: Shield },
                    { id: 'ai', label: 'Kreddy AI', icon: MessageCircle },
                    { id: 'staff', label: 'Staff', icon: Building2 },
                    { id: 'plan', label: 'Plan', icon: Zap }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            borderRadius: '14px',
                            border: 'none',
                            background: activeTab === tab.id ? 'white' : 'transparent',
                            color: activeTab === tab.id ? 'var(--primary)' : '#64748B',
                            fontWeight: 850,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        {tab.id === 'kyc' && profile?.kyc?.status !== 'verified' && (
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                        )}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gap: '32px' }}>
                {activeTab === 'profile' && (
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
                        
                        {/* Consolidated Save Button into the global footer below */}
                    </section>
                )}

                {activeTab === 'payout' && (
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
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                {profile?.bankDetails?.accountNumber && (
                                    <div style={{ background: 'rgba(76, 29, 149, 0.08)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <CheckCircle size={12} /> AUTOMATED PAYOUTS ACTIVE
                                    </div>
                                )}
                                {lockCountdown && (
                                    <div style={{ background: '#FFF1F2', color: '#E11D48', padding: '4px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={10} /> SECURITY LOCK: {lockCountdown}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            {!isEditingPayout ? (
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

                                    {lockCountdown && (
                                        <div style={{ marginTop: '8px', padding: 'clamp(12px, 4vw, 20px)', background: '#FFF7ED', borderRadius: '16px', border: '1px solid #FB923C', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ background: '#FB923C', color: 'white', padding: '8px', borderRadius: '10px' }}>
                                                    <Shield size={16} />
                                                </div>
                                                <p style={{ fontSize: '0.8rem', color: '#9A3412', fontWeight: 700, margin: 0, maxWidth: '280px' }}>
                                                    Payouts are locked for safety. **Re-verify BVN** to unlock instantly and skip the 24h wait.
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => setActiveTab('kyc')}
                                                style={{ background: '#FB923C', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}
                                                className="hover-scale"
                                            >
                                                Unlock Now
                                            </button>
                                        </div>
                                    )}

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
                                                <option value="">{fetchingBanks ? "Loading banks..." : "Choose a bank..."}</option>
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
                                            {profile?.bankDetails?.accountNumber && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsEditingPayout(false);
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
                                                    <>{profile?.bankDetails?.accountNumber ? "Confirm New Details" : "Setup Secure Payouts"}</>
                                                )}
                                            </button>
                                        </div>
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
                                            : "Customers cover the Gateway fee. You receive exactly the invoice amount."}
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
                        </div>
                    </section>
                )}

                {activeTab === 'kyc' && (
                    <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: profile?.kyc?.status === 'verified' ? '#F0FDF4' : '#F5F3FF', color: profile?.kyc?.status === 'verified' ? '#22C55E' : 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Trust & Verification</h2>
                                    <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Protect your payouts and unlock high limits.</p>
                                </div>
                            </div>
                            <div style={{ 
                                background: profile?.kyc?.status === 'verified' ? '#F0FDF4' : '#F5F3FF', 
                                color: profile?.kyc?.status === 'verified' ? '#166534' : 'var(--primary)',
                                padding: '6px 14px', 
                                borderRadius: '100px', 
                                fontSize: '0.75rem', 
                                fontWeight: 900,
                                border: '1px solid',
                                borderColor: profile?.kyc?.status === 'verified' ? '#DCFCE7' : 'rgba(76, 29, 149, 0.1)'
                            }}>
                                {profile?.kyc?.status === 'verified' ? `TIER ${profile.kyc.tier || 2} VERIFIED` : 'TIER 1 (PENDING)'}
                            </div>
                        </div>

                        {/* Escrow Banner */}
                        {profile?.heldBalance > 0 && (
                            <div style={{ 
                                background: '#FFF7ED', 
                                border: '1.5px dashed #FB923C', 
                                padding: '20px', 
                                borderRadius: '20px', 
                                marginBottom: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <div style={{ background: '#FB923C', color: 'white', padding: '12px', borderRadius: '14px' }}>
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, color: '#9A3412', textTransform: 'uppercase' }}>Funds on Hold</p>
                                    <h3 style={{ margin: '2px 0 0 0', fontSize: '1.4rem', fontWeight: 950, color: '#1E293B' }}>₦{profile.heldBalance.toLocaleString()}</h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#9A3412', fontWeight: 600 }}>Verify your identity below to release these funds to your bank instantly.</p>
                                </div>
                            </div>
                        )}

                        {profile?.kyc?.status === 'verified' ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(34, 197, 94, 0.02)', borderRadius: '24px', border: '1.5px dashed #22C55E' }}>
                                <div style={{ width: '64px', height: '64px', background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#166534' }}>
                                    <CheckCircle size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#166534', margin: '0 0 8px 0' }}>Fully Verified</h3>
                                <p style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 700, margin: 0 }}>
                                    Your identity was verified via {profile.kyc.method.toUpperCase()} Match on {new Date(profile.kyc.verifiedAt).toLocaleDateString()}.
                                </p>
                                <div style={{ marginTop: '24px', display: 'inline-flex', gap: '20px' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 900, color: '#64748B' }}>Daily Settlement</p>
                                        <p style={{ margin: 0, fontWeight: 800, color: '#1E293B' }}>Instant Payouts</p>
                                    </div>
                                    <div style={{ borderLeft: '1px solid #E2E8F0' }} />
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 900, color: '#64748B' }}>Daily Limit</p>
                                        <p style={{ margin: 0, fontWeight: 800, color: '#1E293B' }}>₦500,000</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '32px' }}>
                                <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                                    <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#475569', lineHeight: 1.5 }}>
                                        To protect our platform and your money, we use **BVN Matching**. We confirm that the ID you provide matches your Payout Bank Account details.
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>
                                        <Shield size={14} /> 100% Secure & CBN Compliant
                                    </div>
                                </div>

                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', 
                                    gap: '24px' 
                                }}>
                                    <div className="input-group">
                                        <label className="input-label">BVN Number</label>
                                        <input 
                                            className="input-field" 
                                            placeholder={`Enter 11-digit BVN`}
                                            value={idNumber}
                                            maxLength={11}
                                            onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                                            style={{ background: '#F8FAFC', width: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Date of Birth (Optional)</label>
                                        <input 
                                            type="date" 
                                            className="input-field" 
                                            value={dob}
                                            onChange={(e) => setDob(e.target.value)}
                                            style={{ 
                                                background: '#F8FAFC', 
                                                width: '100%', 
                                                boxSizing: 'border-box',
                                                WebkitAppearance: 'none',
                                                minHeight: '54px'
                                            }}
                                        />
                                        <p style={{ fontSize: '10px', color: '#64748B', margin: '4px 0 0 0' }}>Optional, but improves verification accuracy.</p>
                                    </div>
                                </div>

                                <button 
                                    className="btn-primary" 
                                    onClick={handleVerifyKYC} 
                                    disabled={isVerifying || idNumber.length < 11}
                                    style={{ 
                                        height: '60px',
                                        background: idNumber.length === 11 ? 'var(--primary)' : '#94A3B8',
                                        boxShadow: idNumber.length === 11 ? '0 10px 15px -3px rgba(76, 29, 149, 0.25)' : 'none'
                                    }}
                                >
                                    {isVerifying ? (
                                        <Loader2 className="spin-animation" size={24} />
                                    ) : (
                                        profile?.heldBalance > 0 ? "Verify & Release Funds" : "Complete Verification"
                                    )}
                                </button>

                                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>
                                    Identity verification is currently **FREE**. 
                                    By verifying, you agree to allow Kredibly confirm your details with NIBSS.
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'ai' && (
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
                                        textAlign: 'left', cursor: 'pointer'
                                    }}
                                >
                                    <p style={{ margin: 0, fontWeight: 800, color: form.reminderTemplate === 'friendly' ? 'var(--primary)' : '#475569' }}>Friendly Nudge</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Soft, professional reminder.</p>
                                </button>
                                <button 
                                    onClick={() => setForm({ ...form, reminderTemplate: 'formal' })}
                                    style={{ 
                                        padding: '16px', borderRadius: '16px', border: '2px solid', 
                                        borderColor: form.reminderTemplate === 'formal' ? 'var(--primary)' : '#F1F5F9',
                                        background: form.reminderTemplate === 'formal' ? '#F5F3FF' : 'white',
                                        textAlign: 'left', cursor: 'pointer'
                                    }}
                                >
                                    <p style={{ margin: 0, fontWeight: 800, color: form.reminderTemplate === 'formal' ? 'var(--primary)' : '#475569' }}>Formal Statement</p>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>Strict & clear for overdue accounts.</p>
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {activeTab === 'staff' && (
                    <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }}>
                        {profile?.plan === 'hustler' && profile?.planStatus !== 'trialing' && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', textAlign: 'center' }}>
                                <Shield size={32} color="#F97316" style={{ marginBottom: '16px' }} />
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E293B', marginBottom: '8px' }}>Staff Access Locked</h3>
                                <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem', maxWidth: '300px', marginBottom: '20px' }}>Upgrade to Oga or Chairman to add staff members.</p>
                                <button onClick={() => { setSelectedPlan('oga'); setShowCheckout(true); }} className="btn-primary" style={{ width: 'auto', padding: '12px 24px' }}>Upgrade Now</button>
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#FFF7ED', color: '#F97316', padding: '10px', borderRadius: '12px' }}>
                                    <Shield size={24} />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Staff Management</h2>
                            </div>
                            <div style={{ background: '#F1F5F9', padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>{staffLimit}</div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <input className="input-field" placeholder="Staff WhatsApp Number" value={newStaffPhone} onChange={(e) => setNewStaffPhone(e.target.value)} style={{ flex: 1 }} />
                            <button className="btn-primary" style={{ width: 'auto', padding: '0 24px' }} onClick={addStaff}>Add Staff</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {form.staffNumbers.map((phone, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                                    <span style={{ fontWeight: 700, color: '#1E293B' }}>{phone}</span>
                                    <button onClick={() => removeStaff(phone)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Upload size={18} style={{ transform: 'rotate(180deg)' }} /></button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {activeTab === 'plan' && (
                    <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#FFF1F2', color: '#E11D48', padding: '10px', borderRadius: '12px' }}>
                                <Zap size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Subscription & Plan</h2>
                        </div>

                        <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>Current Plan</p>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 950, margin: 0 }}>{profile?.plan?.toUpperCase() || 'HUSTLER'}</h3>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748B', marginBottom: '4px' }}>Status</p>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, background: '#DCFCE7', color: '#166534', padding: '4px 12px', borderRadius: '100px' }}>{profile?.planStatus?.toUpperCase() || 'ACTIVE'}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '32px' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94A3B8', textAlign: 'center', marginBottom: '20px', textTransform: 'uppercase' }}>Available Upgrades</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                <button 
                                    onClick={() => { setSelectedPlan('hustler'); setShowCheckout(true); }} 
                                    className="glass-card clickable-card" 
                                    style={{ 
                                        padding: '24px', 
                                        border: profile?.plan === 'hustler' ? '2px solid #64748B' : '1px solid #E2E8F0', 
                                        background: profile?.plan === 'hustler' ? 'rgba(100, 116, 139, 0.02)' : 'white', 
                                        textAlign: 'left' 
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span style={{ fontWeight: 900, color: '#64748B' }}>HUSTLER</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#94A3B8', textDecoration: 'line-through', display: 'block' }}>₦3,000</span>
                                            <span style={{ fontWeight: 900, color: '#1E293B' }}>₦1,500/mo</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 16px 0' }}>Basic invoice tracking & receipts.</p>
                                    <div style={{ width: '100%', padding: '10px', borderRadius: '10px', background: profile?.plan === 'hustler' ? '#64748B' : 'white', border: profile?.plan === 'hustler' ? 'none' : '1px solid #E2E8F0', color: profile?.plan === 'hustler' ? 'white' : '#64748B', fontWeight: 800, fontSize: '0.8rem', textAlign: 'center' }}>
                                        {profile?.plan === 'hustler' ? 'Current Plan' : (profile?.plan === 'oga' || profile?.plan === 'chairman' ? 'Downgrade' : 'Upgrade')}
                                    </div>
                                </button>
                                
                                <button 
                                    onClick={() => { setSelectedPlan('oga'); setShowCheckout(true); }} 
                                    className="glass-card clickable-card" 
                                    style={{ 
                                        padding: '24px', 
                                        border: profile?.plan === 'oga' ? '2px solid var(--primary)' : '1px solid #E2E8F0', 
                                        background: profile?.plan === 'oga' ? 'rgba(76, 29, 149, 0.02)' : 'white', 
                                        textAlign: 'left' 
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span style={{ fontWeight: 900, color: 'var(--primary)' }}>OGA PLAN</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#94A3B8', textDecoration: 'line-through', display: 'block' }}>₦6,000</span>
                                            <span style={{ fontWeight: 900, color: 'var(--primary)' }}>₦3,000/mo</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 16px 0' }}>Voice Notes, Proactive Reminders & 1 Staff.</p>
                                    <div style={{ width: '100%', padding: '10px', borderRadius: '10px', background: profile?.plan === 'oga' ? 'var(--primary)' : 'white', border: profile?.plan === 'oga' ? 'none' : '1px solid var(--primary)', color: profile?.plan === 'oga' ? 'white' : 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', textAlign: 'center' }}>
                                        {profile?.plan === 'oga' ? 'Current Plan' : (profile?.plan === 'chairman' ? 'Downgrade' : 'Upgrade')}
                                    </div>
                                </button>

                                <button 
                                    onClick={() => { setSelectedPlan('chairman'); setShowCheckout(true); }} 
                                    className="glass-card clickable-card" 
                                    style={{ 
                                        padding: '24px', 
                                        border: profile?.plan === 'chairman' ? '2px solid #8B5CF6' : '1px solid #E2E8F0', 
                                        background: profile?.plan === 'chairman' ? 'rgba(139, 92, 246, 0.02)' : 'white', 
                                        textAlign: 'left' 
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span style={{ fontWeight: 900, color: '#8B5CF6' }}>CHAIRMAN</span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#94A3B8', textDecoration: 'line-through', display: 'block' }}>₦9,000</span>
                                            <span style={{ fontWeight: 900, color: '#8B5CF6' }}>₦4,500/mo</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0 0 16px 0' }}>Unlimited Staff, AI Insights & White-labeling.</p>
                                    <div style={{ width: '100%', padding: '10px', borderRadius: '10px', background: profile?.plan === 'chairman' ? '#8B5CF6' : 'white', border: profile?.plan === 'chairman' ? 'none' : '1px solid #8B5CF6', color: profile?.plan === 'chairman' ? 'white' : '#8B5CF6', fontWeight: 800, fontSize: '0.8rem', textAlign: 'center' }}>
                                        {profile?.plan === 'chairman' ? 'Current Plan' : 'Upgrade'}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {showCheckout && (
                    <CheckoutModal 
                        plan={selectedPlan}
                        billingCycle="monthly"
                        userEmail={currentUser?.email}
                        onClose={() => setShowCheckout(false)}
                        onSuccess={async (reference) => {
                            try {
                                const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
                                await axios.post(`${API_URL}/payments/verify`, { reference: reference.reference, plan: selectedPlan }, { withCredentials: true });
                                setTimeout(() => window.location.reload(), 2000);
                            } catch (err) {
                                toast.error("Verification failed. Contact support.");
                            }
                        }}
                    />
                )}
                
                <PasswordConfirmModal 
                    isOpen={showPasswordModal}
                    onClose={() => setShowPasswordModal(false)}
                    onConfirm={handlePayoutSave}
                />

                {/* 🛡️ Smart Footer: Hide save button if on KYC tab */}
                {activeTab !== 'kyc' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingBottom: '40px' }}>
                        <button
                            className="btn-primary"
                            style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px' }}
                            disabled={saving}
                            onClick={handleSave}
                        >
                            {saving ? "Saving..." : <><Save size={20} /> Save All Changes</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
