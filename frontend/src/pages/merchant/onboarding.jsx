import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import {
    Store,
    Briefcase,
    ShoppingBag,
    ArrowRight,
    ArrowLeft,
    User,
    Upload,
    Building2,
    CheckCircle2,
    MessageCircle,
    Landmark,
    ShieldCheck,
    Zap,
    Search,
    Loader2,
    Camera
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { isValidNigerianPhone, formatPhoneForDB } from "../../utils/validation";

const Onboarding = () => {
    const [step, setStep] = useState(1);
    
    // Step 1 & 2 Data
    const [displayName, setDisplayName] = useState("");
    const [entityType, setEntityType] = useState("individual");
    const [sellMode, setSellMode] = useState("both");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    
    // Step 3 Data: Settlement
    const [banks, setBanks] = useState([]);
    const [searchBank, setSearchBank] = useState("");
    const [selectedBank, setSelectedBank] = useState(null);
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [isResolving, setIsResolving] = useState(false);
    
    // Step 4 Data: Logo & Staff
    const [logoUrl, setLogoUrl] = useState("");
    const [staffNumbers, setStaffNumbers] = useState([]);
    const [newStaffPhone, setNewStaffPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const { updateProfile } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Fetch Banks on Mount
    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
                const res = await axios.get(`${API_URL}/business/banks`);
                if (res.data.success) setBanks(res.data.data);
            } catch (err) {
                console.error("Failed to fetch banks", err);
            }
        };
        fetchBanks();
    }, []);

    // Resolve Account Name when Number hits 10 digits
    useEffect(() => {
        if (accountNumber.length === 10 && selectedBank) {
            resolveBankName();
        } else {
            setAccountName("");
        }
    }, [accountNumber, selectedBank]);

    const resolveBankName = async () => {
        setIsResolving(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.get(`${API_URL}/business/resolve-account/${selectedBank.code}/${accountNumber}`);
            if (res.data.success) {
                setAccountName(res.data.data.account_name);
                toast.success(`Account Verified: ${res.data.data.account_name}`);
            }
        } catch (err) {
            toast.error("Could not verify account name. Please check the details.");
            setAccountName("");
        } finally {
            setIsResolving(false);
        }
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
                withCredentials: true,
            });
            if (res.data.success) {
                setLogoUrl(res.data.url);
                toast.success("Logo uploaded!");
            }
        } catch (err) {
            toast.error("Logo upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const nextStep = () => {
        if (step === 2) {
            if (!displayName.trim()) return toast.error("Please enter a business name");
            if (!whatsappNumber.trim()) return toast.error("WhatsApp is required for Kreddy AI");
            if (!isValidNigerianPhone(whatsappNumber)) return toast.error("Invalid WhatsApp number format");
        }
        if (step === 3) {
            if (!selectedBank || !accountNumber || !accountName) {
                return toast.error("Please verify your bank details to receive payments");
            }
        }
        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                displayName,
                entityType,
                sellMode,
                logoUrl,
                whatsappNumber: formatPhoneForDB(whatsappNumber),
                bankDetails: { 
                    bankName: selectedBank.name, 
                    bankCode: selectedBank.code,
                    accountNumber, 
                    accountName 
                },
                staffNumbers
            };
            await updateProfile(payload);
            toast.success("Setup Complete! Welcome to the Oga Life.");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.response?.data?.message || "Setup failed. Check details.");
        } finally {
            setLoading(false);
        }
    };

    const addStaff = () => {
        if (!newStaffPhone) return;
        if (!isValidNigerianPhone(newStaffPhone)) return toast.error("Invalid staff phone number");
        const formatted = formatPhoneForDB(newStaffPhone);
        if (staffNumbers.includes(formatted)) return toast.error("Already added");
        setStaffNumbers([...staffNumbers, formatted]);
        setNewStaffPhone("");
    };

    const ProgressHeader = () => (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.5rem', letterSpacing: '-0.02em', color: '#0F172A' }}>
                        {step === 1 ? 'Elite Access' : 'Quick Setup'}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#64748B', fontWeight: 600 }}>
                        {step === 1 ? 'You are a Founding Member.' : `Step ${step - 1} of 3`}
                    </p>
                </div>
                {step > 1 && (
                    <div style={{ background: 'rgba(76, 29, 149, 0.05)', padding: '8px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 900, color: 'var(--primary)' }}>
                        {Math.round(((step-1)/3)*100)}% COMPLETED
                    </div>
                )}
            </div>
            <div style={{ display: 'flex', gap: '8px', height: '6px' }}>
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} style={{ 
                        flex: 1, 
                        borderRadius: '4px', 
                        background: s <= step ? 'var(--primary)' : '#E2E8F0',
                        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: s <= step ? '0 0 10px rgba(76, 29, 149, 0.3)' : 'none'
                    }} />
                ))}
            </div>
        </div>
    );

    const filteredBanks = banks.filter(b => b.name.toLowerCase().includes(searchBank.toLowerCase())).slice(0, 5);

    return (
        <div className="auth-pattern" style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div className="pattern-dots" style={{ opacity: 0.05 }} />
            
            <div className="onboarding-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '540px', width: '100%' }}>
                    
                    <div className="glass-card" style={{ padding: '48px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
                        <ProgressHeader />
                        
                        <AnimatePresence mode="wait">
                            {/* Step 1: Founding Member Welcome */}
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key="welcome">
                                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white', boxShadow: '0 15px 30px rgba(76, 29, 149, 0.3)' }}>
                                            <Zap size={40} fill="white" />
                                        </div>
                                        <h2 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.04em', color: '#0F172A', marginBottom: '12px' }}>Welcome, Oga.</h2>
                                        <p style={{ color: '#64748B', fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.6 }}>
                                            As a <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Founding Member</span>, you've been granted **30 days** of the **Oga Plan** for free during this beta phase.
                                        </p>
                                    </div>
                                    <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', marginBottom: '40px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <CheckCircle2 size={18} color="#10B981" />
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>Unlimited Invoice Records (No 10 sale limit)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <CheckCircle2 size={18} color="#10B981" />
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>Kreddy AI Voice Notes (Just Speak!)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <CheckCircle2 size={18} color="#10B981" />
                                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>0% Transaction Fees Always</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setStep(2)} className="btn-primary" style={{ width: '100%', height: '64px', fontSize: '1.15rem' }}>Verify Business Profile <ArrowRight size={20} /></button>
                                </motion.div>
                            )}

                            {/* Step 2: Basic Business Info */}
                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="info">
                                    <div className="input-group" style={{ marginBottom: '24px' }}>
                                        <label className="input-label" style={{ fontWeight: 800, color: '#0F172A' }}>What is your Business/Shop name?</label>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            style={{ height: '60px', fontSize: '1.1rem', fontWeight: 700 }}
                                            placeholder="e.g. Trendy Collections" 
                                            value={displayName} 
                                            onChange={e => setDisplayName(e.target.value)} 
                                            autoFocus 
                                        />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '40px' }}>
                                        <label className="input-label" style={{ fontWeight: 800, color: '#0F172A' }}>WhatsApp for Kreddy Notifications</label>
                                        <div style={{ position: 'relative' }}>
                                            <MessageCircle size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                                            <input 
                                                type="tel" 
                                                className="input-field" 
                                                style={{ paddingLeft: '56px', height: '60px', fontSize: '1.1rem', fontWeight: 700 }}
                                                placeholder="08123456789" 
                                                value={whatsappNumber} 
                                                onChange={e => setWhatsappNumber(e.target.value)} 
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '8px', fontWeight: 600 }}>We'll use this to send you daily business summaries.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button onClick={nextStep} className="btn-primary" style={{ flex: 1, height: '64px', fontSize: '1.1rem' }}>Next: Payout Setup <ArrowRight size={20} /></button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Interactive Settlement */}
                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="bank">
                                    <div className="input-group" style={{ marginBottom: '24px' }}>
                                        <label className="input-label" style={{ fontWeight: 800, color: '#0F172A' }}>Where should we pay your money?</label>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '20px', color: '#94A3B8' }} />
                                            <input 
                                                type="text" 
                                                className="input-field" 
                                                style={{ height: '56px', paddingLeft: '48px', fontSize: '1rem', fontWeight: 700 }}
                                                placeholder="Search Bank (e.g. Kuda, GTB)" 
                                                value={selectedBank ? selectedBank.name : searchBank}
                                                onChange={e => { setSearchBank(e.target.value); setSelectedBank(null); }}
                                                onClick={() => setSelectedBank(null)}
                                            />
                                            {searchBank && !selectedBank && (
                                                <div style={{ position: 'absolute', top: '64px', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                                    {filteredBanks.map(b => (
                                                        <div key={b.code} onClick={() => { setSelectedBank(b); setSearchBank(""); }} style={{ padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', fontWeight: 700, fontSize: '0.9rem' }}>{b.name}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '24px' }}>
                                        <label className="input-label" style={{ fontWeight: 800, color: '#0F172A' }}>Account Number</label>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type="text" 
                                                className="input-field" 
                                                style={{ height: '56px', fontSize: '1.2rem', fontWeight: 800, letterSpacing: '0.2em' }}
                                                placeholder="0123456789" 
                                                maxLength={10}
                                                value={accountNumber} 
                                                onChange={e => setAccountNumber(e.target.value)}
                                            />
                                            {isResolving && <Loader2 className="spin" size={20} style={{ position: 'absolute', right: '16px', top: '18px', color: 'var(--primary)' }} />}
                                        </div>
                                    </div>
                                    {accountName && (
                                        <div style={{ background: '#F0FDF4', padding: '16px 20px', borderRadius: '16px', border: '1px solid #BBF7D0', marginBottom: '40px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <CheckCircle2 size={20} color="#16A34A" />
                                            <span style={{ fontWeight: 900, color: '#166534', fontSize: '0.95rem' }}>{accountName}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button onClick={nextStep} className="btn-primary" style={{ flex: 1, height: '64px', fontSize: '1.1rem' }}>Verify & Continue <ArrowRight size={20} /></button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Finishing Touches */}
                            {step === 4 && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key="staff">
                                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                        <div
                                            onClick={() => fileInputRef.current.click()}
                                            style={{ width: '96px', height: '96px', borderRadius: '28px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '3px dashed #E2E8F0', cursor: 'pointer', overflow: 'hidden' }}
                                        >
                                            {logoUrl ? <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={32} color="#94A3B8" />}
                                        </div>
                                        <p style={{ fontWeight: 800, color: '#0F172A', cursor: 'pointer' }} onClick={() => fileInputRef.current.click()}>Upload Brand Logo (Optional)</p>
                                        <input ref={fileInputRef} type="file" hidden onChange={handleLogoUpload} accept="image/*" />
                                    </div>

                                    <div className="input-group" style={{ marginBottom: '40px' }}>
                                        <label className="input-label" style={{ fontWeight: 800, color: '#0F172A' }}>Add a Business Manager (Optional)</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input 
                                                type="tel" 
                                                className="input-field" 
                                                style={{ height: '56px', fontSize: '1rem', fontWeight: 700 }}
                                                placeholder="Manager's Phone" 
                                                value={newStaffPhone}
                                                onChange={e => setNewStaffPhone(e.target.value)}
                                            />
                                            <button onClick={addStaff} className="btn-secondary" style={{ padding: '0 20px', borderRadius: '14px' }}>Add</button>
                                        </div>
                                        {staffNumbers.length > 0 && (
                                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {staffNumbers.map(s => <div key={s} style={{ background: '#F1F5F9', padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800 }}>{s}</div>)}
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        onClick={handleSubmit} 
                                        disabled={loading} 
                                        className="btn-primary" 
                                        style={{ width: '100%', height: '64px', fontSize: '1.2rem', boxShadow: '0 15px 30px rgba(76, 29, 149, 0.4)' }}
                                    >
                                        {loading ? <Loader2 className="spin" size={24} /> : "Launch My Business"}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div style={{ marginTop: '32px', textAlign: 'center', opacity: 0.6 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <ShieldCheck size={16} /> DATA ENCRYPTED & BANK-GRADE SECURE
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
