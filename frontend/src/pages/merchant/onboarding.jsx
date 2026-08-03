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

    const { updateProfile, user, profile, logout } = useAuth();

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

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!displayName.trim()) return toast.error("Please enter the name for your invoices");
        if (!whatsappNumber.trim()) return toast.error("WhatsApp number is required for Kreddy");
        if (!isValidNigerianPhone(whatsappNumber)) return toast.error("Invalid WhatsApp number format");

        setLoading(true);
        try {
            const savedLang = localStorage.getItem('kreddy_preferred_language') || 'english';
            const payload = {
                displayName,
                whatsappNumber: formatPhoneForDB(whatsappNumber),
                onboardingStep: 4, // 🚀 Mark onboarding as complete
                assistantSettings: {
                    preferredLanguage: savedLang
                }
            };
            await updateProfile(payload);
            toast.success("Workspace Launched! Welcome to Kredibly.");
            setShowWelcomePreview(true);
        } catch (err) {
            toast.error(err.response?.data?.message || "Setup failed. Check details.");
        } finally {
            setLoading(false);
        }
    };

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

            {/* Logo header */}
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
            
            <div className="onboarding-container" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 24px 60px', position: 'relative', zIndex: 10 }}>
                <div style={{ maxWidth: '540px', width: '100%' }}>
                    
                    <div className="glass-card" style={{ padding: 'clamp(24px, 6vw, 48px)', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
                        
                        <AnimatePresence mode="wait">
                            {showWelcomePreview ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key="welcome-preview">
                                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                        <div style={{ width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Workspace Launched!</h3>
                                        <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
                                            Kreddy is ready on WhatsApp for: <strong style={{ color: '#0F172A' }}>{whatsappNumber}</strong>
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
                                            dangerouslySetInnerHTML={{ __html: parseWhatsAppMarkdown(`Hello *${displayName || 'User'}*,\n\nI'm *Kreddy*, your AI assistant.\n\nYour workspace for *${displayName}* is live! I'm ready to help you record sales, send invoices, and track payments.\n\nTalk to me naturally on WhatsApp anytime.`) }}
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
                            ) : (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key="micro-onboarding">
                                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                        <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white', boxShadow: '0 10px 20px rgba(76, 29, 149, 0.2)' }}>
                                            <Zap size={32} fill="white" />
                                        </div>
                                        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 1.8rem)', fontWeight: 800, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.03em' }}>Welcome to Kredibly</h2>
                                        <p style={{ color: '#64748B', fontWeight: 500, fontSize: '0.95rem' }}>Set up your workspace in less than 30 seconds.</p>
                                    </div>

                                    <form onSubmit={handleSubmit}>
                                        <div className="input-group" style={{ marginBottom: '24px' }}>
                                            <label className="input-label" style={{ fontWeight: 600, color: '#0F172A' }}>What name should appear on your invoices?</label>
                                            <div style={{ position: 'relative' }}>
                                                <Store size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                                                <input 
                                                    type="text" 
                                                    className="input-field" 
                                                    style={{ height: '58px', paddingLeft: '52px', fontSize: '1.05rem', fontWeight: 500 }}
                                                    placeholder="e.g. Joy's Closet, Tosin Creatives, or Tosin Adebayo" 
                                                    value={displayName} 
                                                    onChange={e => setDisplayName(e.target.value)} 
                                                    autoFocus
                                                    required 
                                                />
                                            </div>
                                            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '6px', fontWeight: 400 }}>
                                                This will be displayed on all receipts and invoices sent to customers.
                                            </p>
                                        </div>

                                        <div className="input-group" style={{ marginBottom: '36px' }}>
                                            <label className="input-label" style={{ fontWeight: 600, color: '#0F172A' }}>What WhatsApp number should Kreddy use?</label>
                                            <div style={{ position: 'relative' }}>
                                                <MessageCircle size={20} style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                                                <input 
                                                    type="tel" 
                                                    className="input-field" 
                                                    style={{ height: '58px', paddingLeft: '52px', fontSize: '1.05rem', fontWeight: 500 }}
                                                    placeholder="e.g. 08123456789" 
                                                    value={whatsappNumber} 
                                                    onChange={e => setWhatsappNumber(e.target.value)}
                                                    required 
                                                />
                                            </div>
                                            <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '6px', fontWeight: 400 }}>
                                                Kreddy uses this to send your sales confirmations and invoice alerts.
                                            </p>
                                        </div>

                                        <button 
                                            type="submit" 
                                            disabled={loading} 
                                            className="btn-primary" 
                                            style={{ width: '100%', height: '60px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '16px', boxShadow: '0 10px 20px rgba(76, 29, 149, 0.3)' }}
                                        >
                                            {loading ? <Loader2 className="spin" size={22} style={{ animation: 'spin 1s linear infinite' }} /> : "Launch My Workspace 🚀"}
                                        </button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div style={{ marginTop: '28px', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <ShieldCheck size={16} color="#10B981" /> 100% BANK-GRADE SECURE · NO CREDIT CARD REQUIRED
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
