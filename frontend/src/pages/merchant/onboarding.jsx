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
    Camera,
    ShieldCheck
} from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { isValidNigerianPhone, formatPhoneForDB } from "../../utils/validation";

const Onboarding = () => {
    const [step, setStep] = useState(1);
    const [mission, setMission] = useState("hustler"); // hustler, oga, chairman
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
        // Create an optimistic preview
        const objectUrl = URL.createObjectURL(file);
        
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL;
            const res = await axios.post(`${API_URL}/common/upload-logo`, formData, {
                withCredentials: true,
            });
            if (res.data.success) {
                setLogoUrl(res.data.url);
                toast.success("Logo added successfully!");
            }
        } catch (err) {
            toast.error("Upload failed. Please try again.");
            console.error(err);
        } finally {
            setUploading(false);
            // Cleanup the optimistic preview URL to avoid memory leaks
            if(objectUrl) URL.revokeObjectURL(objectUrl);
        }
    };

    // ... [existing code for nextStep, handleSubmit, etc.]

    const nextStep = () => {
        if (step === 2 && !displayName.trim()) return toast.error("Please enter a name");
        if (step === 3) {
            if (!whatsappNumber.trim()) return toast.error("WhatsApp is required for Kreddy");
            if (!isValidNigerianPhone(whatsappNumber)) return toast.error("Invalid WhatsApp number format");
        }
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
                whatsappNumber: formatPhoneForDB(whatsappNumber),
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
        if (!isValidNigerianPhone(newStaffPhone)) return toast.error("Invalid staff phone number");
        const formatted = formatPhoneForDB(newStaffPhone);
        if (staffNumbers.includes(formatted)) return toast.error("Already added");
        setStaffNumbers([...staffNumbers, formatted]);
        setNewStaffPhone("");
    };

    const removeStaff = (phone) => {
        setStaffNumbers(staffNumbers.filter(p => p !== phone));
    };

    const ProgressHeader = () => (
        <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>Setup Wizard</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>Let's get your business ready.</p>
                </div>
                <div style={{ background: '#F1F5F9', padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                    Step {step} / 5
                </div>
            </div>
            {/* Premium Segmented Progress Bar */}
            <div style={{ display: 'flex', gap: '8px', height: '6px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} style={{ 
                        flex: 1, 
                        borderRadius: '4px', 
                        background: s <= step ? 'var(--primary)' : '#E2E8F0',
                        transition: 'all 0.4s ease',
                        boxShadow: s <= step ? '0 0 10px rgba(76, 29, 149, 0.3)' : 'none'
                    }} />
                ))}
            </div>
        </div>
    );

    const getInitials = (name) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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
            <div className="pattern-dots" style={{ opacity: 0.05 }}></div>
            
            {/* Top Left Logo */}
            <div 
                onClick={() => navigate('/')}
                className="onboarding-logo-header"
                style={{ 
                    padding: '40px', 
                    cursor: 'pointer', 
                    position: 'relative', 
                    zIndex: 20, 
                    width: 'fit-content' 
                }}
            >
                <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '40px' }} />
            </div>

            <div className="onboarding-container" style={{ 
                flex: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '20px 24px 60px', 
                position: 'relative', 
                zIndex: 10 
            }}>
                <div style={{ maxWidth: '640px', width: '100%' }}>
                    
                    <div className="glass-card" style={{ 
                        padding: '48px', 
                        borderRadius: '32px'
                    }}>
                        <ProgressHeader />
                        
                        <AnimatePresence mode="wait">
                            {/* Step 1: Mission Identity */}
                            {step === 1 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key="step0">
                                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', textAlign: 'center' }}>Choose your mission level</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                                        {[
                                            { id: 'hustler', t: 'Hustler', d: 'Starting small. Basic recording & recovery.', icon: User },
                                            { id: 'oga', t: 'Oga Plan', d: 'Scaling fast. Unlimited records & Voice Notes.', icon: Zap },
                                            { id: 'chairman', t: 'Chairman', d: 'Running an empire. Receipt scanning & priority tech.', icon: ShieldCheck }
                                        ].map(m => (
                                            <button key={m.id} onClick={() => setMission(m.id)} style={{
                                                padding: '24px', borderRadius: '24px', border: '2px solid ' + (mission === m.id ? 'var(--primary)' : '#F1F5F9'),
                                                background: mission === m.id ? 'rgba(76, 29, 149, 0.05)' : 'white', cursor: 'pointer', textAlign: 'left',
                                                display: 'flex', gap: '20px', alignItems: 'center', transition: 'all 0.2s'
                                            }}>
                                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: mission === m.id ? 'var(--primary)' : '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: mission === m.id ? 'white' : 'var(--primary)' }}>
                                                    <m.icon size={24} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: '#0F172A' }}>{m.t}</p>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>{m.d}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={nextStep} className="btn-primary" style={{ width: '100%', height: '60px', fontSize: '1.1rem' }}>Accept Mission <ArrowRight size={20} /></button>
                                </motion.div>
                            )}

                            {/* Step 2 */}
                            {step === 2 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key="step1">
                                    <div className="input-group" style={{ marginBottom: '24px' }}>
                                        <label className="input-label" style={{ fontSize: '1rem' }}>Business or Shop Name</label>
                                        <input 
                                            type="text" 
                                            className="input-field" 
                                            style={{ height: '60px', fontSize: '1.1rem', fontWeight: 600 }}
                                            placeholder="e.g. Kola's Studio" 
                                            value={displayName} 
                                            onChange={e => setDisplayName(e.target.value)} 
                                            autoFocus 
                                        />
                                    </div>

                                    <p className="input-label" style={{ marginBottom: '16px', fontSize: '1rem' }}>Describe your legal status</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                                        <button onClick={() => setEntityType('individual')} className="clickable-card" style={{
                                            padding: '24px', borderRadius: '20px', border: '2px solid' + (entityType === 'individual' ? ' var(--primary)' : ' #E2E8F0'),
                                            background: entityType === 'individual' ? '#F5F3FF' : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                        }}>
                                            <div style={{ background: entityType === 'individual' ? 'white' : '#F1F5F9', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                                <User size={24} color={entityType === 'individual' ? 'var(--primary)' : '#64748B'} />
                                            </div>
                                            <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>Solo Trader</p>
                                        </button>
                                        <button onClick={() => setEntityType('business')} className="clickable-card" style={{
                                            padding: '24px', borderRadius: '20px', border: '2px solid' + (entityType === 'business' ? ' var(--primary)' : ' #E2E8F0'),
                                            background: entityType === 'business' ? '#F5F3FF' : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s'
                                        }}>
                                            <div style={{ background: entityType === 'business' ? 'white' : '#F1F5F9', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                                <Building2 size={24} color={entityType === 'business' ? 'var(--primary)' : '#64748B'} />
                                            </div>
                                            <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>Registered Biz</p>
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, height: '60px' }}>Back</button>
                                        <button onClick={nextStep} className="btn-primary" style={{ flex: 2, height: '60px', fontSize: '1.1rem' }}>Continue <ArrowRight size={20} /></button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: WhatsApp & Selling Mode */}
                            {step === 3 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key="step3">
                                    <div className="input-group" style={{ marginBottom: '40px' }}>
                                        <label className="input-label" style={{ fontSize: '1rem' }}>Link your Digital Chief of Staff</label>
                                        <div style={{ position: 'relative' }}>
                                            <MessageCircle size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', zIndex: 10 }} />
                                            <input 
                                                type="tel" 
                                                className="input-field" 
                                                style={{ paddingLeft: '56px', height: '60px', fontSize: '1.1rem', fontWeight: 600, border: '2px solid var(--primary-glow)' }} 
                                                placeholder="Enter WhatsApp Number" 
                                                value={whatsappNumber} 
                                                onChange={e => setWhatsappNumber(e.target.value)} 
                                            />
                                            {whatsappNumber.length > 10 && <CheckCircle2 size={24} color="#10B981" style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />}
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '12px', fontWeight: 600 }}>Kreddy will use this to send your 8 AM Market Briefing & recovery links.</p>
                                    </div>

                                    <p className="input-label" style={{ marginBottom: '16px', fontSize: '1rem' }}>How do you sell?</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '40px' }}>
                                        {[{ id: 'offline', icon: Store, l: 'Store' }, { id: 'online', icon: ShoppingBag, l: 'Online' }, { id: 'service', icon: Briefcase, l: 'Service' }].map(m => (
                                            <button key={m.id} onClick={() => setSellMode(m.id)} className="clickable-card" style={{
                                                padding: '20px 12px', borderRadius: '16px', border: '2px solid' + (sellMode === m.id ? ' var(--primary)' : ' #E2E8F0'),
                                                background: sellMode === m.id ? '#F5F3FF' : 'white', cursor: 'pointer'
                                            }}>
                                                <m.icon size={28} color={sellMode === m.id ? 'var(--primary)' : '#94A3B8'} style={{ margin: '0 auto 8px' }} />
                                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>{m.l}</p>
                                            </button>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button onClick={() => setStep(2)} className="btn-secondary" style={{ flex: 1, height: '60px' }}>Back</button>
                                        <button onClick={nextStep} className="btn-primary" style={{ flex: 2, height: '60px', fontSize: '1.1rem' }}>Next Step <ArrowRight size={20} /></button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 4: Branding & Bank */}
                            {step === 4 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key="step4">
                                    {/* Logo Upload */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#F8FAFC', padding: '20px', borderRadius: '24px', marginBottom: '32px', border: '1px solid #E2E8F0', opacity: uploading ? 0.7 : 1 }}>
                                        <div
                                            onClick={() => !uploading && fileInputRef.current.click()}
                                            style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #CBD5E1', cursor: uploading ? 'not-allowed' : 'pointer', overflow: 'hidden', fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)', position: 'relative' }}
                                        >
                                            {uploading ? (
                                                 <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                                                    <div className="spin" style={{
                                                        width: '24px', height: '24px',
                                                        border: '3px solid #E2E8F0', borderTopColor: 'var(--primary)',
                                                        borderRadius: '50%'
                                                    }} />
                                                </div>
                                            ) : logoUrl ? (
                                                <img src={logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                getInitials(displayName)
                                            )}
                                        </div>
                                        <input ref={fileInputRef} type="file" hidden onChange={handleLogoUpload} accept="image/*" disabled={uploading}/>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: '0 0 4px', fontWeight: 800, fontSize: '1rem' }}>{uploading ? 'Uploading...' : 'Upload Brand Logo'}</p>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', lineHeight: 1.4 }}>{mission === 'hustler' ? 'Hint: Logos only appear on Oga receipts.' : 'Displayed on all your records & receipts.'}</p>
                                        </div>
                                        <div onClick={() => !uploading && fileInputRef.current.click()} style={{ background: 'white', padding: '10px', borderRadius: '12px', cursor: uploading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                            <Upload size={20} color={uploading ? "#94A3B8" : "var(--text)"} />
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ marginBottom: '20px' }}>
                                        <label className="input-label">Settlement Bank</label>
                                        <div style={{ position: 'relative' }}>
                                            <Landmark size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                            <input type="text" className="input-field" style={{ paddingLeft: '56px', height: '56px' }} placeholder="e.g. GTBank" value={bankName} onChange={e => setBankName(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="input-group" style={{ marginBottom: '40px' }}>
                                        <label className="input-label">Account Details</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                                            <input type="text" className="input-field" style={{ height: '56px' }} placeholder="Account Name" value={accountName} onChange={e => setAccountName(e.target.value)} />
                                            <input type="text" className="input-field" style={{ height: '56px' }} placeholder="Number" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button onClick={() => setStep(3)} className="btn-secondary" style={{ flex: 1, height: '60px' }}>Back</button>
                                        <button onClick={nextStep} className="btn-primary" style={{ flex: 2, height: '60px', fontSize: '1.1rem' }}>Next Step <ArrowRight size={20} /></button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 5: Team Setup */}
                            {step === 5 && (
                                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} key="step5">
                                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                        <div style={{ width: '80px', height: '80px', background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                            <CheckCircle2 size={40} color="#16A34A" />
                                        </div>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>Setup your team</h3>
                                        <p style={{ color: '#64748B', fontWeight: 500 }}>{mission === 'hustler' ? 'Hustlers work solo. Upgrade to Oga to add staff.' : `Command your team. You can add ${mission === 'oga' ? '2 staff members' : 'unlimited staff'}.`}</p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', opacity: (mission === 'hustler') ? 0.6 : 1, pointerEvents: (mission === 'hustler') ? 'none' : 'auto' }}>
                                        <input type="tel" className="input-field" style={{ height: '56px' }} placeholder={mission === 'hustler' ? "Upgrade for Staff" : "Staff Phone Number"} value={newStaffPhone} onChange={e => setNewStaffPhone(e.target.value)} />
                                        <button className="btn-secondary" style={{ width: 'auto', padding: '0 24px', height: '56px' }} onClick={addStaff}>Add</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '40px', maxHeight: '150px', overflowY: 'auto' }}>
                                        {staffNumbers.map((phone, idx) => (
                                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <User size={16} /> {phone}
                                                </span>
                                                <button onClick={() => removeStaff(phone)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>Remove</button>
                                            </div>
                                        ))}
                                        {staffNumbers.length === 0 && (
                                            <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '16px', textAlign: 'center', border: '1px dashed #E2E8F0' }}>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#94A3B8', fontWeight: 500 }}>No staff added yet.</p>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button onClick={() => setStep(4)} className="btn-secondary" style={{ flex: 1, height: '60px' }}>Back</button>
                                        <button onClick={handleSubmit} disabled={loading} className="btn-primary" style={{ flex: 2, height: '60px', fontSize: '1.1rem' }}>
                                            {loading ? 'Finalizing...' : 'Launch Empire'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Text */}
                    <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '24px', opacity: 0.8 }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'black', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={14} /> BANK-GRADE SECURITY
                        </p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'black', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MessageCircle size={14} /> 24/7 SUPPORT
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 640px) {
                    .onboarding-logo-header {
                        padding: 24px 20px 10px !important;
                    }
                    .onboarding-container {
                        padding: 0 12px 40px !important;
                        align-items: flex-start !important;
                    }
                    .glass-card { 
                        padding: 32px 24px !important; 
                        border-radius: 24px !important;
                        margin-top: 10px;
                    }
                    .btn-primary, .btn-secondary, .input-field {
                        height: 56px !important;
                        font-size: 1rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Onboarding;
