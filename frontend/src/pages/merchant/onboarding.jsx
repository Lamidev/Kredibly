import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
    Camera,
    Activity
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { isValidNigerianPhone, formatPhoneForDB } from "../../utils/validation";

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [showWelcomePreview, setShowWelcomePreview] = useState(false);
    
    // Step 1 & 2 Data
    const [displayName, setDisplayName] = useState("");
    const [entityType, setEntityType] = useState("individual");
    const [sellMode, setSellMode] = useState("both");
    const [whatsappNumber, setWhatsappNumber] = useState("");

    const parseWhatsAppMarkdown = (text) => {
        if (!text) return "";
        return text
            .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
            .replace(/_(.*?)_/g, "<em>$1</em>")
            .replace(/\n/g, "<br />");
    };

    // Step 4 Data: Settlement
    const [banks, setBanks] = useState([]);
    const [searchBank, setSearchBank] = useState("");
    const [selectedBank, setSelectedBank] = useState(null);
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [isResolving, setIsResolving] = useState(false);
    const [banksLoading, setBanksLoading] = useState(false);
    
    // Step 4 Data: Logo & Staff
    const [logoUrl, setLogoUrl] = useState("");
    const [staffNumbers, setStaffNumbers] = useState([]);
    const [newStaffPhone, setNewStaffPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const { updateProfile, user, profile } = useAuth();

    // Step 3 Data: KYC (Moved after useAuth to access profile)
    const initialKycType = profile?.kyc?.method && profile.kyc.method !== 'none' ? profile.kyc.method : "bvn";
    const [kycType, setKycType] = useState(initialKycType);
    const [idNumber, setIdNumber] = useState("");
    const [dob, setDob] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [kycStatus, setKycStatus] = useState("pending"); // pending, verified, skipped
    const [hasKycError, setHasKycError] = useState(false);

    useEffect(() => {
        if (profile?.kyc?.method && profile.kyc.method !== 'none') {
            setKycType(profile.kyc.method);
        }
    }, [profile]);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const planTitle = profile?.plan === 'oga' ? 'Oga' : (profile?.plan === 'hustler' ? 'Hustler' : 'Chairman');

    // Get initials for logo fallback
    const getInitials = (name) => {
        if (!name) return user?.email?.[0]?.toUpperCase() || "K";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    // Fetch Banks on Mount — must send credentials (user is authenticated)
    useEffect(() => {
        const fetchBanks = async () => {
            setBanksLoading(true);
            try {
                const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
                const res = await axios.get(`${API_URL}/business/banks`, { withCredentials: true });
                if (res.data.success) {
                    const sorted = res.data.data.sort((a, b) => a.name.localeCompare(b.name));
                    setBanks(sorted);
                }
            } catch (err) {
                console.error("Failed to fetch banks", err);
                // Don't show error toast on mount — only show if user is on the bank step
            } finally {
                setBanksLoading(false);
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
            const res = await axios.get(`${API_URL}/business/resolve-account/${selectedBank.code}/${accountNumber}`, {
                withCredentials: true
            });
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
            console.error("Upload error details:", err.response?.data || err);
            toast.error(err.response?.data?.message || err.message || "Logo upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const nextStep = async () => {
        // Step 2 Completion: Save Basic Info
        if (step === 2) {
            if (!displayName.trim()) return toast.error("Please enter a business name");
            if (!whatsappNumber.trim()) return toast.error("WhatsApp is required for Kreddy AI");
            if (!isValidNigerianPhone(whatsappNumber)) return toast.error("Invalid WhatsApp number format");
        }

        // Step 3 Completion: Move to final touches
        if (step === 3) {
            if (!selectedBank || !accountNumber || !accountName) {
                return toast.error("Please verify your bank details to receive payments");
            }
            // We no longer save profile at Step 3 to ensure profile creation and email only happen at Step 4
            console.log("✅ Bank details verified. Moving to final touches.");
        }
        
        setStep(prev => prev + 1);
    };

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
                setKycStatus("verified");
                toast.success("Identity Verified!");
                setStep(4);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Verification failed. Check your details.");
            setHasKycError(true);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const savedLang = localStorage.getItem('kreddy_preferred_language') || 'english';
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
                staffNumbers,
                onboardingStep: 4, // 🚀 Mark onboarding as complete
                kyc: {
                    status: kycStatus,
                    method: kycStatus === 'verified' ? kycType : 'none',
                    idNumber: kycStatus === 'verified' ? idNumber.substring(0, 4) + '****' : ''
                },
                assistantSettings: {
                    preferredLanguage: savedLang
                }
            };
            await updateProfile(payload);
            toast.success(`Setup Complete! Welcome to the ${planTitle} Life.`);
            setShowWelcomePreview(true);
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
        if (staffNumbers.length >= 3) return toast.error("Founding Member Limit: You can add up to 3 staff members during setup.");
        setStaffNumbers([...staffNumbers, formatted]);
        setNewStaffPhone("");
    };

    const ProgressHeader = () => (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.02em', color: '#0F172A' }}>
                        {step === 1 ? 'Elite Access' : 'Quick Setup'}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#0F172A', fontWeight: 400 }}>
                        {step === 1 ? 'You are a Founding Member.' : `Step ${step - 1} of 3`}
                    </p>
                </div>
                {step > 1 && (
                    <div style={{ background: 'rgba(76, 29, 149, 0.05)', padding: '8px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
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

    const filteredBanks = banks.filter(b => b.name.toLowerCase().includes(searchBank.toLowerCase())).slice(0, 8);

    return (
        <div className="auth-pattern" style={{ 
            minHeight: '100vh', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            position: 'relative',
            overflowX: 'hidden'
        }}>
            {/* Dynamic Background Overlays */}
            <div className="pattern-dots" style={{ opacity: 0.05 }} />
            <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0) 0%, rgba(248, 250, 252, 0.4) 100%)',
                pointerEvents: 'none'
            }} />

            {/* Logo header — same style as AuthLayout */}
            <div
                onClick={() => navigate('/')}
                className="auth-logo-header animate-fade-in"
                style={{ 
                    padding: '40px 40px 20px',
                    cursor: 'pointer',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    width: 'fit-content'
                }}
            >
                <img 
                    src="/krediblyrevamped.png" 
                    alt="Kredibly" 
                    className="auth-logo-img"
                    style={{ height: '40px', width: 'auto', transition: 'height 0.3s ease' }} 
                />
            </div>
            
            <div className="onboarding-container" style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 24px 60px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '540px', width: '100%' }}>
                    
                    <div className="glass-card" style={{ padding: 'clamp(24px, 6vw, 48px)', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
                        {!showWelcomePreview && <ProgressHeader />}
                        
                        <AnimatePresence mode="wait">
                            {showWelcomePreview && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key="welcome-preview">
                                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                        <div style={{ width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Workspace Launched!</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
                                            Kreddy has sent the first message to your WhatsApp number: <strong style={{ color: '#0F172A' }}>{whatsappNumber}</strong>.
                                        </p>
                                    </div>

                                    {/* Mock WhatsApp Bubble */}
                                    <div style={{ background: '#E5DDD5', borderRadius: '24px', padding: '20px', border: '1px solid #CBD5E1', marginBottom: '32px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: '0.8rem' }}>K</div>
                                            <div>
                                                <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, color: '#1E293B' }}>Kreddy AI</p>
                                                <p style={{ fontSize: '0.65rem', opacity: 0.8, margin: 0, color: '#64748B' }}>Business Assistant</p>
                                            </div>
                                        </div>
                                        
                                        <div style={{ background: 'white', padding: '14px 16px', borderRadius: '0 16px 16px 16px', fontSize: '0.88rem', maxWidth: '90%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', color: '#334155', lineHeight: 1.5 }}
                                            dangerouslySetInnerHTML={{ __html: parseWhatsAppMarkdown(`Hello *${displayName || 'Boss'}*,\n\nI'm *Kreddy*, your Digital Chief of Staff.\n\nI've successfully launched your workspace for *${displayName || 'your business'}* and I'm ready to get to work.\n\nHere is what I can do for you:\n\n*Voice Note:*\n_"Sarah bought a bag for 15k, she paid 5k, remind me Friday for the balance."_\n\n*Picture:*\nSend me a paper invoice and I'll record it.\n\n*Ask me:*\n_"What is my revenue today?"_\n_"Who owes me money?"_\n\nTalk to me naturally.\n\nLet's get to work.`) }}
                                        />
                                    </div>

                                    <button 
                                        onClick={() => navigate("/dashboard")} 
                                        className="btn-primary" 
                                        style={{ width: '100%', height: '60px', fontSize: '1.1rem', boxShadow: '0 10px 15px -3px rgba(76, 29, 149, 0.3)' }}
                                    >
                                        Go to Dashboard 🚀
                                    </button>
                                </motion.div>
                            )}
                            {/* Step 1: Founding Member Welcome */}
                            {!showWelcomePreview && step === 1 && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key="welcome">
                                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white', boxShadow: '0 15px 30px rgba(76, 29, 149, 0.3)' }}>
                                            <Zap size={40} fill="white" />
                                        </div>
                                        <h2 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#000000', marginBottom: '12px' }} className="mobile-heading">Welcome, {planTitle}.</h2>
                                        <p style={{ color: '#000000', fontWeight: 400, fontSize: '1rem', lineHeight: 1.7 }} className="mobile-text">
                                            As a <span style={{ color: '#000000', fontWeight: 600 }}>Founding Member</span>, you've been granted <strong style={{ color: '#000000' }}>30 days</strong> of the <strong style={{ color: '#000000' }}>{planTitle} Plan</strong> for free during this beta phase.
                                        </p>
                                    </div>
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '20px', border: '1.5px solid #E2E8F0', marginBottom: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                            <CheckCircle2 size={18} color="#10B981" />
                                            <span style={{ fontWeight: 500, fontSize: '0.92rem', color: '#1E293B' }}>Unlimited Invoice Records (No 10 sale limit)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                                            <CheckCircle2 size={18} color="#10B981" />
                                            <span style={{ fontWeight: 500, fontSize: '0.92rem', color: '#1E293B' }}>Kreddy AI Voice Notes (Just Speak!)</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <CheckCircle2 size={18} color="#10B981" />
                                            <span style={{ fontWeight: 500, fontSize: '0.92rem', color: '#1E293B' }}>0% Transaction Fees, Always</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setStep(2)} className="btn-primary" style={{ width: '100%', height: '64px', fontSize: '1.15rem' }}>Verify Business Profile <ArrowRight size={20} /></button>
                                </motion.div>
                            )}

                            {/* Step 2: Basic Business Info */}
                            {!showWelcomePreview && step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="info">
                                    <div className="input-group" style={{ marginBottom: '24px' }}>
                                        <label className="input-label" style={{ fontWeight: 500, color: '#0F172A' }}>Name of your Business, Shop, or Service?</label>
                                        <div style={{ position: 'relative' }}>
                                            <Store size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                                            <input 
                                                type="text" 
                                                className="input-field" 
                                                style={{ height: '60px', paddingLeft: '56px', fontSize: '1.1rem', fontWeight: 400 }}
                                                placeholder="e.g. Trendy Collections, John The Plumber" 
                                                value={displayName} 
                                                onChange={e => setDisplayName(e.target.value)} 
                                                autoFocus 
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '40px' }}>
                                        <label className="input-label" style={{ fontWeight: 500, color: '#0F172A' }}>WhatsApp for Kreddy Notifications</label>
                                        <div style={{ position: 'relative' }}>
                                            <MessageCircle size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                                            <input 
                                                type="tel" 
                                                className="input-field" 
                                                style={{ paddingLeft: '56px', height: '60px', fontSize: '1.1rem', fontWeight: 400 }}
                                                placeholder="08123456789" 
                                                value={whatsappNumber} 
                                                onChange={e => setWhatsappNumber(e.target.value)} 
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#0F172A', marginTop: '8px', fontWeight: 400 }}>We'll use this to send you daily summaries and AI insights.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button onClick={nextStep} className="btn-primary" style={{ flex: 1, height: '64px', fontSize: '1.1rem' }}>Next: Payout Details <Landmark size={20} /></button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Payout Settlement (Moved before KYC) */}
                            {!showWelcomePreview && step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} key="bank">
                                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                        <div style={{ width: '64px', height: '64px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
                                            <Landmark size={32} />
                                        </div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>Payout Settlement</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 400 }}>Where should we pay your money?</p>
                                    </div>

                                    <div className="input-group" style={{ marginBottom: '24px' }}>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', zIndex: 2 }} />
                                            <input 
                                                type="text" 
                                                className="input-field" 
                                                style={{ height: '56px', paddingLeft: '48px', fontSize: '1rem', fontWeight: 400 }}
                                                placeholder={banksLoading ? "Loading banks..." : "Search Bank (e.g. Kuda, GTB)"}
                                                value={selectedBank ? selectedBank.name : searchBank}
                                                onChange={e => { setSearchBank(e.target.value); setSelectedBank(null); }}
                                                onClick={() => { if (selectedBank) setSelectedBank(null); }}
                                                disabled={banksLoading}
                                            />
                                            {banksLoading && (
                                                <Loader2 size={16} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', animation: 'spin 1s linear infinite' }} />
                                            )}
                                            {searchBank && !selectedBank && filteredBanks.length > 0 && (
                                                <div style={{ position: 'absolute', top: '62px', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', zIndex: 100, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: '280px', overflowY: 'auto' }}>
                                                    {filteredBanks.map(b => (
                                                        <div 
                                                            key={b.code} 
                                                            onMouseDown={() => { setSelectedBank(b); setSearchBank(""); setAccountName(""); }} 
                                                            style={{ padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', fontWeight: 500, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}
                                                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                                        >
                                                            <Landmark size={14} color="#94A3B8" />
                                                            {b.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '24px' }}>
                                        <label className="input-label" style={{ fontWeight: 500, color: '#0F172A' }}>Account Number</label>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type="text" 
                                                className="input-field" 
                                                style={{ height: '56px', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.2em' }}
                                                placeholder="0123456789" 
                                                maxLength={10}
                                                value={accountNumber} 
                                                onChange={e => setAccountNumber(e.target.value.replace(/\D/g, "").trim())}
                                            />
                                            {isResolving && <Loader2 className="spin" size={20} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />}
                                        </div>
                                    </div>
                                    {accountName && (
                                        <div style={{ background: '#F0FDF4', padding: '16px 20px', borderRadius: '16px', border: '1px solid #BBF7D0', marginBottom: '40px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <CheckCircle2 size={20} color="#16A34A" />
                                            <span style={{ fontWeight: 600, color: '#166534', fontSize: '0.95rem' }}>{accountName}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button onClick={nextStep} className="btn-primary" style={{ flex: 1, height: '64px', fontSize: '1.1rem' }}>Verify & Continue <ArrowRight size={20} /></button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Finishing Touches — Logo + Staff (Optional) */}
                            {!showWelcomePreview && step === 4 && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key="staff">
                                    {/* Logo Upload */}
                                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                        <div
                                            onClick={() => fileInputRef.current.click()}
                                            style={{ 
                                                width: '96px', height: '96px', borderRadius: '28px', 
                                                background: logoUrl ? 'transparent' : '#F8FAFC', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                margin: '0 auto 12px', border: '3px dashed #E2E8F0', 
                                                cursor: 'pointer', overflow: 'hidden',
                                                fontWeight: 600, fontSize: '1.8rem', color: 'var(--primary)'
                                            }}
                                        >
                                            {uploading ? (
                                                <Loader2 size={32} color="#94A3B8" style={{ animation: 'spin 1s linear infinite' }} />
                                            ) : logoUrl ? (
                                                <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="logo" />
                                            ) : (
                                                getInitials(displayName)
                                            )}
                                        </div>
                                        <p style={{ fontWeight: 600, color: '#0F172A', cursor: 'pointer', marginBottom: '4px' }} onClick={() => fileInputRef.current.click()}>
                                            {logoUrl ? "Logo Uploaded ✓" : "Upload Brand Logo (Optional)"}
                                        </p>
                                        <p style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 400 }}>
                                            {logoUrl ? "Click to change" : "Your initials show until you add a logo — you can also do this in Settings later"}
                                        </p>
                                        <input ref={fileInputRef} type="file" hidden onChange={handleLogoUpload} accept="image/*" />
                                    </div>

                                    <div className="input-group" style={{ marginBottom: '40px' }}>
                                        <label className="input-label" style={{ fontWeight: 500, color: '#0F172A' }}>Add Managers or Partners (Optional)</label>
                                        <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '12px', fontWeight: 400 }}>They'll be able to record sales on WhatsApp too. You can add multiple.</p>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <div style={{ position: 'relative', flex: 1 }}>
                                                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                                                <input 
                                                    type="tel" 
                                                    className="input-field" 
                                                    style={{ height: '56px', paddingLeft: '48px', fontSize: '1rem', fontWeight: 400, width: '100%' }}
                                                    placeholder="Their Phone Number" 
                                                    value={newStaffPhone}
                                                    onChange={e => setNewStaffPhone(e.target.value)}
                                                />
                                            </div>
                                            <button onClick={addStaff} className="btn-secondary" style={{ padding: '0 20px', borderRadius: '14px', height: '56px' }}>Add</button>
                                        </div>
                                        {staffNumbers.length > 0 && (
                                            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {staffNumbers.map(s => <div key={s} style={{ background: '#F1F5F9', padding: '6px 12px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600 }}>{s}</div>)}
                                            </div>
                                        )}
                                    </div>

                                    <button 
                                        onClick={handleSubmit} 
                                        disabled={loading} 
                                        className="btn-primary" 
                                        style={{ width: '100%', height: '64px', fontSize: '1.2rem', boxShadow: '0 15px 30px rgba(76, 29, 149, 0.4)' }}
                                    >
                                        {loading ? <Loader2 className="spin" size={24} style={{ animation: 'spin 1s linear infinite' }} /> : "Launch My Workspace"}
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div style={{ marginTop: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                        {!showWelcomePreview && (
                            <p style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 400 }}>
                                Not ready?{" "}
                                <Link to="/auth/login" style={{ color: '#0F172A', fontWeight: 600, textDecoration: 'none', borderBottom: '1px solid #CBD5E1', paddingBottom: '1px' }}>
                                    Back to Login
                                </Link>
                            </p>
                        )}
                        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <ShieldCheck size={16} color="#0F172A" /> DATA ENCRYPTED & BANK-GRADE SECURE
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .auth-pattern {
                    background-image: url('/Krediblypattern-sm.jpg');
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                    background-color: var(--background);
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 640px) {
                    .auth-logo-header { padding: 24px 20px 8px !important; }
                    .auth-logo-img { height: 28px !important; }
                    .glass-card { padding: 20px !important; border-radius: 20px !important; }
                    .mobile-heading { font-weight: 700 !important; font-size: 1.6rem !important; }
                    .mobile-text { font-weight: 400 !important; font-size: 0.95rem !important; line-height: 1.5 !important; }
                    .input-label { font-size: 0.85rem !important; font-weight: 500 !important; }
                    .input-field { height: 52px !important; font-size: 1rem !important; }
                    .btn-primary { height: 56px !important; font-size: 1.05rem !important; }
                }
            `}</style>
        </div>
    );
};

export default Onboarding;
