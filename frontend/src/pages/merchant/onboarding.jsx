import { useState, useRef } from "react";
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
    LogOut,
    Camera
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [displayName, setDisplayName] = useState("");
    const [entityType, setEntityType] = useState("individual");
    const [sellMode, setSellMode] = useState("both");
    const [logoUrl, setLogoUrl] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [staffNumbers, setStaffNumbers] = useState([]);
    const [newStaffPhone, setNewStaffPhone] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const { updateProfile, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

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
                setLogoUrl(res.data.url);
                toast.success("Logo added!");
            }
        } catch (err) {
            toast.error("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && !displayName.trim()) return toast.error("Please enter a name");
        if (step === 2 && !whatsappNumber.trim()) return toast.error("WhatsApp is required for Kreddy");
        setStep(prev => prev + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await updateProfile({
                displayName,
                entityType,
                sellMode,
                logoUrl,
                whatsappNumber,
                bankDetails: { bankName, accountNumber, accountName },
                staffNumbers
            });
            toast.success("Hustle verified. Welcome!");
            navigate("/dashboard");
        } catch (err) {
            toast.error("Setup failed. Check details.");
        } finally {
            setLoading(false);
        }
    };

    const addStaff = () => {
        if (!newStaffPhone) return;
        if (staffNumbers.includes(newStaffPhone)) return toast.error("Already added");
        setStaffNumbers([...staffNumbers, newStaffPhone]);
        setNewStaffPhone("");
    };

    const removeStaff = (phone) => {
        setStaffNumbers(staffNumbers.filter(p => p !== phone));
    };

    const ProgressHeader = () => (
        <div style={{ padding: '24px', background: 'white', borderRadius: '24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #F1F5F9' }}>
            <div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Setup Wizard</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Step {step} of 4</p>
            </div>
            <div style={{ width: '120px', height: '6px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                <motion.div animate={{ width: `${(step / 4) * 100}%` }} style={{ height: '100%', background: 'var(--primary)', borderRadius: '10px' }} />
            </div>
        </div>
    );

    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    return (
        <div className="auth-pattern" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
            <div className="pattern-dots"></div>

            <div style={{ maxWidth: '520px', width: '100%', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '35px' }} />
                </div>

                <ProgressHeader />

                <div className="glass-card" style={{ background: 'white', padding: '40px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}>
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key="step1">
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>Your Brand Identity</h2>
                                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '32px' }}>This info appears on your professional receipts.</p>

                                <div className="input-group" style={{ marginBottom: '24px' }}>
                                    <label className="input-label">Business or Shop Name</label>
                                    <input type="text" className="input-field" placeholder="e.g. Kola's Studio" value={displayName} onChange={e => setDisplayName(e.target.value)} autoFocus />
                                </div>

                                <p className="input-label" style={{ marginBottom: '12px' }}>Choose your style</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                                    <button onClick={() => setEntityType('individual')} style={{
                                        padding: '20px', borderRadius: '16px', border: '2px solid' + (entityType === 'individual' ? ' var(--primary)' : ' #F1F5F9'),
                                        background: entityType === 'individual' ? '#F5F3FF' : 'white', cursor: 'pointer', textAlign: 'center'
                                    }}>
                                        <User size={24} color={entityType === 'individual' ? 'var(--primary)' : '#94A3B8'} />
                                        <p style={{ margin: '8px 0 0', fontWeight: 800, fontSize: '0.85rem' }}>Personal</p>
                                    </button>
                                    <button onClick={() => setEntityType('business')} style={{
                                        padding: '20px', borderRadius: '16px', border: '2px solid' + (entityType === 'business' ? ' var(--primary)' : ' #F1F5F9'),
                                        background: entityType === 'business' ? '#F5F3FF' : 'white', cursor: 'pointer', textAlign: 'center'
                                    }}>
                                        <Building2 size={24} color={entityType === 'business' ? 'var(--primary)' : '#94A3B8'} />
                                        <p style={{ margin: '8px 0 0', fontWeight: 800, fontSize: '0.85rem' }}>Registered</p>
                                    </button>
                                </div>

                                <button onClick={nextStep} className="btn-primary" style={{ width: '100%', padding: '16px' }}>Continue</button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key="step2">
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>Essential Setup</h2>
                                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '32px' }}>Almost there! How should Kreddy help you?</p>

                                <div className="input-group" style={{ marginBottom: '24px' }}>
                                    <label className="input-label">WhatsApp Number (International)</label>
                                    <div style={{ position: 'relative' }}>
                                        <MessageCircle size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                        <input type="tel" className="input-field" style={{ paddingLeft: '48px' }} placeholder="e.g. 234801234..." value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} />
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '8px', fontWeight: 500 }}>
                                        Kreddy will use this to send you performance updates and debtor nudges.
                                    </p>
                                </div>

                                <p className="input-label" style={{ marginBottom: '12px' }}>How do you sell?</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '32px' }}>
                                    {[{ id: 'offline', icon: Store, l: 'Store' }, { id: 'online', icon: ShoppingBag, l: 'Online' }, { id: 'service', icon: Briefcase, l: 'Service' }].map(m => (
                                        <button key={m.id} onClick={() => setSellMode(m.id)} style={{
                                            padding: '12px', borderRadius: '12px', border: '2px solid' + (sellMode === m.id ? ' var(--primary)' : ' #F1F5F9'),
                                            background: sellMode === m.id ? '#F5F3FF' : 'white', cursor: 'pointer'
                                        }}>
                                            <m.icon size={20} color={sellMode === m.id ? 'var(--primary)' : '#94A3B8'} style={{ margin: '0 auto 4px' }} />
                                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.7rem' }}>{m.l}</p>
                                        </button>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                                    <button onClick={nextStep} className="btn-primary" style={{ flex: 2 }}>Next</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key="step3">
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>One Last Piece</h2>
                                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '32px' }}>Optional: Where should customers pay you?</p>

                                {/* Logo (Quick Add) */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#F8FAFC', padding: '16px', borderRadius: '20px', marginBottom: '24px' }}>
                                    <div
                                        onClick={() => fileInputRef.current.click()}
                                        style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #CBD5E1', cursor: 'pointer', overflow: 'hidden', fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}
                                    >
                                        {logoUrl ? (
                                            <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            getInitials(displayName)
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" hidden onChange={handleLogoUpload} />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem' }}>Upload Logo</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Add a touch of class</p>
                                    </div>
                                </div>

                                <div className="input-group" style={{ marginBottom: '16px' }}>
                                    <label className="input-label">Bank Name</label>
                                    <input type="text" className="input-field" placeholder="e.g. GTBank" value={bankName} onChange={e => setBankName(e.target.value)} />
                                </div>
                                <div className="input-group" style={{ marginBottom: '32px' }}>
                                    <label className="input-label">Account Name & Number</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input type="text" className="input-field" style={{ flex: 2 }} placeholder="Name" value={accountName} onChange={e => setAccountName(e.target.value)} />
                                        <input type="text" className="input-field" style={{ flex: 1 }} placeholder="000..." value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                                    <button onClick={nextStep} className="btn-primary" style={{ flex: 2 }}>Next Step</button>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key="step4">
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>The Oga Monitor 🛡️</h2>
                                <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '32px' }}>Optional: Add staff who can record sales while you stay in control.</p>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                                    <input type="tel" className="input-field" placeholder="Staff Phone" value={newStaffPhone} onChange={e => setNewStaffPhone(e.target.value)} />
                                    <button className="btn-secondary" style={{ width: 'auto', padding: '0 16px' }} onClick={addStaff}>Add</button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', maxHeight: '150px', overflowY: 'auto' }}>
                                    {staffNumbers.map((phone, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{phone}</span>
                                            <button onClick={() => removeStaff(phone)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>Remove</button>
                                        </div>
                                    ))}
                                    {staffNumbers.length === 0 && (
                                        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.75rem', padding: '16px' }}>No staff added. You can do this later in settings.</p>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button onClick={() => setStep(3)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                                    <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex: 2 }}>
                                        {loading ? 'Finalizing...' : 'Launch Dashboard 🚀'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em' }}>✓ BANK-GRADE SECURITY</p>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.1em' }}>✓ 24/7 SUPPORT</p>
                </div>
            </div>
            <style>{`
                @media (max-width: 640px) {
                    .glass-card { padding: 24px 20px !important; }
                    .onboarding-wizard-container { padding: 20px 0 !important; }
                    h2 { font-size: 1.25rem !important; }
                    .option-card p { font-size: 0.75rem !important; }
                }
            `}</style>
        </div>
    );
};

export default Onboarding;
