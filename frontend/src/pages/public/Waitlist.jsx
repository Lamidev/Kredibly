import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    MessageCircle, 
    BarChart3, 
    ArrowRight, 
    CheckCircle2, 
    Copy, 
    Share2,
    Rocket,
    Smartphone,
    TrendingUp,
    Users,
    Lock,
    CheckCircle,
    ArrowDown,
    FileText,
    Zap
} from "lucide-react";
import PublicFooter from "../../components/public/PublicFooter";
import axios from "axios";
import { toast } from "sonner";
import { isValidNigerianPhone, formatPhoneForDB } from "../../utils/validation";

const Waitlist = () => {
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        whatsappNumber: "",
        industry: ""
    });
    const [loading, setLoading] = useState(false);
    const [joined, setJoined] = useState(false);
    const [referralData, setReferralData] = useState(null);
    const [stats, setStats] = useState(0);

    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
    const referredBy = searchParams.get("ref");

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/waitlist/stats`);
            if (res.data.success) {
                setStats(res.data.total);
            }
        } catch (err) {
            console.error("Stats fail", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isValidNigerianPhone(formData.whatsappNumber)) {
            return toast.error("Please enter a valid Nigerian WhatsApp number (e.g. 080...)");
        }

        const formattedData = {
            ...formData,
            whatsappNumber: formatPhoneForDB(formData.whatsappNumber)
        };

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/waitlist/join`, {
                ...formattedData,
                referredBy
            });

            if (res.data.success) {
                setJoined(true);
                setReferralData(res.data.data);
                toast.success("Welcome to the inner circle!");
                fetchStats();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        const link = `${window.location.origin}/waitlist?ref=${referralData.referralCode}`;
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
    };

    const shareToWhatsApp = () => {
        const link = `${window.location.origin}/waitlist?ref=${referralData.referralCode}`;
        const text = `Hey! I just joined the waitlist for Kreddy AI. It's the smart assistant that handles sales and bookkeeping inside WhatsApp. Check it out: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const scrollToJoin = () => {
        const element = document.getElementById('join-form');
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="waitlist-page" style={{ 
            minHeight: '100vh', 
            background: '#FFFFFF', 
            color: '#1E293B', 
            fontFamily: 'var(--font-body)',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            {/* Subtle Premium Background Gradients */}
            <div style={{ position: 'absolute', top: '0', right: '0', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(76, 29, 149, 0.03) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0 }} />
            
            {/* Nav */}
            <nav className="waitlist-nav" style={{ 
                padding: '16px 20px', 
                position: 'sticky', 
                top: 0,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                zIndex: 1000, 
                maxWidth: '1200px', 
                margin: '0 auto',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
                <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '36px', filter: 'contrast(1.15) brightness(1.02)' }} className="nav-logo" />
                <div>
                     {/* Links removed for public as per strategy */}
                </div>
            </nav>

            {/* 1. Hero Section */}
            <section className="hero-section" style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 120px', textAlign: 'center' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', border: '1px solid rgba(76, 29, 149, 0.1)', borderRadius: '100px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '40px' }}>
                        JOIN THE FUTURE OF AFRICAN COMMERCE
                    </div>

                    <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', fontWeight: 950, lineHeight: 0.95, letterSpacing: '-0.05em', marginBottom: '32px', color: '#0F172A' }}>
                        The smart assistant <br />
                        <span className="premium-gradient">for your business.</span>
                    </h1>

                    <p className="hero-subtext" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.45rem)', color: '#334155', lineHeight: 1.5, marginBottom: '56px', maxWidth: '850px', margin: '0 auto 56px', fontWeight: 600 }}>
                        No more notebooks. No more confusing math. We help you track sales and collect your money inside the WhatsApp you already use.
                    </p>

                    <div className="hero-button-group" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
                        <button onClick={scrollToJoin} className="btn-primary" style={{ padding: '24px 56px', fontSize: '1.25rem', borderRadius: '24px', background: 'var(--primary)', color: 'white', boxShadow: '0 20px 40px -10px rgba(76, 29, 149, 0.3)' }}>
                            Join the Waitlist <ArrowRight size={22} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '12px 24px', borderRadius: '100px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', marginLeft: '8px' }}>
                                {[1,2,3].map(i => (
                                    <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', background: '#F1F5F9', marginLeft: '-10px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary)' }}>{i}</div>
                                ))}
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>Join <span style={{ color: '#0F172A', fontWeight: 900 }}>{stats + 480}+</span> innovative merchants</span>
                        </div>
                    </div>

                    {/* Premium App Store Silhouettes - Now in Hero */}
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', opacity: 0.8, marginBottom: '60px' }} className="hero-store-buttons">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <Smartphone size={16} color="#64748B" />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ margin: 0, fontSize: '0.6rem', opacity: 0.6, fontWeight: 900, textTransform: 'uppercase' }}>Available soon on</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900 }}>App Store</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 20px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <Zap size={16} color="#64748B" />
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ margin: 0, fontSize: '0.6rem', opacity: 0.6, fontWeight: 900, textTransform: 'uppercase' }}>Available soon on</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900 }}>Play Store</p>
                            </div>
                        </div>
                    </div>

                    <div className="scroll-indicator" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.4 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.15em', color: '#0F172A' }}>EXPLORE EXPERIENCE</span>
                        <ArrowDown size={20} className="bounce" color="#0F172A" />
                    </div>
                </motion.div>
            </section>

            {/* 2. Meet Kreddy Section */}
            <section className="adaptive-section" style={{ padding: '120px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                <div className="container waitlist-adaptive-grid" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ background: 'rgba(76, 29, 149, 0.1)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                            <Smartphone color="var(--primary)" size={32} />
                        </div>
                        <h2 style={{ fontSize: '3rem', fontWeight: 950, marginBottom: '24px', letterSpacing: '-0.03em', color: '#0F172A' }}>
                            <span style={{ color: 'var(--primary)' }}>Kreddy talks to you.</span>
                        </h2>
                        <p style={{ fontSize: '1.2rem', color: '#334155', lineHeight: 1.6, marginBottom: '40px', fontWeight: 600 }}>
                            Talk to Kreddy AI on WhatsApp like you're talking to a partner. Record transactions, check inventory, and let him handle your bookkeeping while you sleep.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { t: "No more paper notebooks", d: "Record your sales in 2 seconds. Kreddy handles the math so you don't have to." },
                                { t: "Simple for everyone", d: "If you can send a message on WhatsApp, you can use Kredibly. It's built for you." }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ background: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '4px' }}>
                                        <CheckCircle size={18} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1E293B', display: 'block', marginBottom: '4px' }}>{item.t}</span>
                                        <span style={{ color: '#334155', fontWeight: 600 }}>{item.d}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Mockup */}
                    <div className="chat-mockup" style={{
                        background: '#FFF',
                        borderRadius: '40px',
                        padding: '12px',
                        boxShadow: '0 40px 80px -12px rgba(0,0,0,0.08)',
                        border: '1px solid #E2E8F0'
                    }}>
                        <div style={{ background: '#E5DDD5', borderRadius: '32px', overflow: 'hidden', height: '520px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: '#075E54', padding: '36px 20px 14px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '50%', color: '#075E54', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>K</div>
                                <span style={{ fontWeight: 800 }}>Kreddy AI</span>
                            </div>
                            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ alignSelf: 'flex-end', background: '#DCF8C6', padding: '12px 18px', borderRadius: '16px 0 16px 16px', fontSize: '0.85rem', color: '#111', fontWeight: 500, maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                    Kreddy, sold 5 bags to Sarah for 50k. She's paid 20k deposit.
                                </div>
                                <div style={{ alignSelf: 'flex-start', background: 'white', padding: '16px', borderRadius: '0 16px 16px 16px', fontSize: '0.85rem', color: '#111', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                    <p style={{ margin: 0, fontWeight: 900, color: '#075E54', fontSize: '0.7rem', marginBottom: '6px' }}>Kreddy AI</p>
                                    <p style={{ fontWeight: 600, margin: 0 }}>Done! ✅ I've recorded the 50k sale.</p>
                                    <p style={{ fontWeight: 600, margin: '8px 0' }}>💰 Owed: 30k</p>
                                    <p style={{ fontWeight: 600, margin: 0 }}>I've sent Sarah her branded invoice link.</p>
                                </div>
                            </div>
                            <div style={{ padding: '15px', background: '#f0f0f0', display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1, height: '38px', background: 'white', borderRadius: '20px' }}></div>
                                <div style={{ width: '38px', height: '38px', background: '#075E54', borderRadius: '50%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. The Pillars Section */}
            <section className="adaptive-section" style={{ padding: '120px 24px', background: 'white' }}>
                <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(76, 29, 149, 0.05)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                        <BarChart3 color="var(--primary)" size={32} />
                    </div>
                    <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 950, marginBottom: '24px', letterSpacing: '-0.04em', color: '#0F172A' }}>
                        <span style={{ color: 'var(--primary)' }}>Kredibly tracks for you.</span>
                    </h2>
                    <p style={{ fontSize: '1.2rem', color: '#334155', lineHeight: 1.6, marginBottom: '72px', maxWidth: '750px', margin: '0 auto 72px', fontWeight: 600 }}>
                        Your premium command center. Get deep insights into your growth, reconcile accounts, and manage your entire empire in one place.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                        {[
                            { icon: Users, t: "Staff Monitoring", d: "See exactly what your staff are selling from anywhere. Keep your money safe." },
                            { icon: FileText, t: "Beautiful Receipts", d: "Send professional receipts to customers on WhatsApp. Build trust instantly." },
                            { icon: Lock, t: "Get Paid Faster", d: "Friendly automatic reminders that help you collect your money without stress." },
                            { icon: TrendingUp, t: "Daily Reports", d: "See how much you made today with simple, clear numbers. No accounting needed." }
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '48px 40px', borderRadius: '32px', background: '#FFFFFF', border: '1px solid #F1F5F9', textAlign: 'left', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }} className="hover-card-light">
                                <div style={{ color: 'var(--primary)', marginBottom: '24px', background: 'rgba(76, 29, 149, 0.05)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={28} /></div>
                                <h4 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '12px', color: '#0F172A' }}>{item.t}</h4>
                                <p style={{ color: '#334155', lineHeight: 1.6, fontSize: '1rem', fontWeight: 600 }}>{item.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Security & Trust Section */}
            <section className="adaptive-section" style={{ padding: '80px 24px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', padding: '64px 48px', borderRadius: '40px', border: '1.5px dashed #E2E8F0', background: 'white' }}>
                    <div style={{ color: '#10B981', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}><Lock size={36} /></div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '16px', color: '#0F172A' }}>Bank-Grade Security for Every Business.</h3>
                    <p style={{ color: '#334155', lineHeight: 1.6, fontWeight: 600, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Your data is encrypted and private. We use industry-standard security to ensure your financial records stay yours.
                    </p>
                    <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '40px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }} /> 256-BIT ENCRYPTION
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }} /> CLOUD BACKED
                        </span>
                    </div>
                </div>
            </section>

            {/* Premium Mobile Ecosystem Preview */}
            <section className="adaptive-section" style={{ 
                padding: '120px 0',
                background: '#020617', 
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)', filter: 'blur(120px)', zIndex: 0 }} />

                <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, padding: '0 24px' }}>
                    <div className="mobile-ecosystem-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px', alignItems: 'center' }}>
                        
                        {/* 3D iPhone Mockup */}
                        <div style={{ perspective: '2000px', display: 'flex', justifyContent: 'center' }}>
                            <motion.div 
                                style={{ position: 'relative', width: '100%', maxWidth: '300px' }}
                                initial={{ rotateY: -15, rotateX: 10, y: 30, opacity: 0 }}
                                whileInView={{ rotateY: 0, rotateX: 0, y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {/* Floating Feature Popups */}
                                <motion.div 
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ 
                                        position: 'absolute', 
                                        top: '20%', 
                                        left: '-40px', 
                                        zIndex: 50, 
                                        background: 'rgba(255,255,255,0.05)', 
                                        backdropFilter: 'blur(20px)', 
                                        padding: '16px 20px', 
                                        borderRadius: '24px', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px'
                                    }}
                                    className="floating-popup-left"
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={16} color="white" /></div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, fontWeight: 700 }}>Payment Received</p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900 }}>₦150,000</p>
                                    </div>
                                </motion.div>

                                <motion.div 
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    style={{ 
                                        position: 'absolute', 
                                        bottom: '15%', 
                                        right: '-40px', 
                                        zIndex: 50, 
                                        background: 'rgba(255,255,255,0.05)', 
                                        backdropFilter: 'blur(20px)', 
                                        padding: '16px 20px', 
                                        borderRadius: '24px', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px'
                                    }}
                                    className="floating-popup-right"
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} color="white" /></div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, fontWeight: 700 }}>Staff Activity</p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900 }}>Verified Sale</p>
                                    </div>
                                </motion.div>

                                <div style={{ 
                                    width: '100%', 
                                    height: '600px', 
                                    background: '#1E293B', 
                                    borderRadius: '50px', 
                                    padding: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    position: 'relative'
                                }}>
                                    <div style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        background: '#020617', 
                                        borderRadius: '40px',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '80px', height: '24px', background: '#000', borderRadius: '20px', zIndex: 5 }} />
                                        
                                        <div style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div style={{ height: '140px', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px' }}>
                                                <div style={{ width: '30%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '12px' }} />
                                                <div style={{ width: '60%', height: '24px', background: 'white', borderRadius: '6px', marginBottom: '24px', opacity: 0.4 }} />
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }} />)}
                                                </div>
                                            </div>
                                            {[1,2,3].map(i => (
                                                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ width: '60%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginBottom: '6px' }} />
                                                        <div style={{ width: '30%', height: '6px', background: 'rgba(255,255,255,0.02)', borderRadius: '3px' }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ 
                                            position: 'absolute', 
                                            inset: 0, 
                                            background: 'rgba(2, 6, 23, 0.4)', 
                                            backdropFilter: 'blur(8px)', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            zIndex: 10
                                        }}>
                                            <div style={{ 
                                                padding: '10px 24px', 
                                                background: 'rgba(255,255,255,0.1)', 
                                                borderRadius: '100px', 
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                color: 'white',
                                                fontSize: '0.8rem',
                                                fontWeight: 900,
                                                letterSpacing: '0.1em'
                                            }}>
                                                COMING Q3 2026
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Content */}
                        <div className="mobile-ecosystem-content">
                            <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '100px', marginBottom: '32px', color: '#A78BFA', fontWeight: 800, fontSize: '0.85rem' }}>
                                THE MOBILE OS FOR MERCHANTS
                            </div>
                            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '32px' }}>
                                Native. Powerful. <br />
                                <span style={{ color: 'var(--primary)' }}>Zero Compromise.</span>
                            </h2>
                            <p style={{ fontSize: '1.25rem', color: '#CBD5E1', fontWeight: 500, lineHeight: 1.6, marginBottom: '40px' }}>
                                We're building the full Kredibly experience for iOS and Android. Biometric security, offline-first ledger, and instant sales intelligence at your fingertips.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                {[
                                    { t: "iOS & Android", d: "Designed for the modern entrepreneur." },
                                    { t: "Deep Biometrics", d: "FaceID & Fingerprint protection." },
                                    { t: "Instant Alerts", d: "Push notifications for every payment." },
                                    { t: "Offline Mode", d: "Record sales even without internet." }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '8px', color: 'white' }}>{item.t}</h4>
                                        <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.4, margin: 0 }}>{item.d}</p>
                                    </div>
                                ))}
                            </div>

                             {/* Store Silhouettes - Premium Glow */}
                             <div className="mobile-ecosystem-buttons" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '48px' }}>
                                 <div style={{ 
                                     padding: '14px 28px', 
                                     background: 'rgba(255,255,255,0.05)', 
                                     borderRadius: '16px', 
                                     border: '1px solid rgba(255,255,255,0.1)',
                                     display: 'flex',
                                     alignItems: 'center',
                                     gap: '14px',
                                     cursor: 'not-allowed'
                                 }}>
                                     <Smartphone size={20} color="white" style={{ opacity: 0.6 }} />
                                     <div>
                                         <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.5, fontWeight: 900, textTransform: 'uppercase' }}>Available soon on</p>
                                         <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, color: 'white' }}>App Store</p>
                                     </div>
                                 </div>
                                 <div style={{ 
                                     padding: '14px 28px', 
                                     background: 'rgba(255,255,255,0.05)', 
                                     borderRadius: '16px', 
                                     border: '1px solid rgba(255,255,255,0.1)',
                                     display: 'flex',
                                     alignItems: 'center',
                                     gap: '14px',
                                     cursor: 'not-allowed'
                                 }}>
                                     <Zap size={20} color="white" style={{ opacity: 0.6 }} />
                                     <div>
                                         <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.5, fontWeight: 900, textTransform: 'uppercase' }}>Available soon on</p>
                                         <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, color: 'white' }}>Play Store</p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            </section>

            {/* 5. The Mission Map (Roadmap) */}
            <section className="adaptive-section" style={{ padding: '120px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <div style={{ display: 'inline-flex', padding: '8px 20px', borderRadius: '100px', background: 'rgba(76, 29, 149, 0.05)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '0.1em' }}>
                            OUR JOURNEY & VISION
                        </div>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 950, letterSpacing: '-0.04em', color: '#0F172A' }}>The Mission Map.</h2>
                        <p style={{ fontSize: '1.2rem', color: '#334155', fontWeight: 600, marginTop: '16px' }}>Transparent milestones from a simple idea to a global financial ecosystem.</p>
                    </div>

                    <div className="mission-timeline-container" style={{ position: 'relative', paddingLeft: '40px' }}>
                        {/* Vertical Line */}
                        <div className="timeline-line" style={{ position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #E2E8F0 0%, #7C3AED 30%, #7C3AED 70%, #E2E8F0 100%)' }} />

                        {[
                            { date: "JULY '25", title: "The Genesis", desc: "Concept & Research Phase. Identifying the 'Trust Gap' in African commerce.", status: "completed" },
                            { date: "SEPT '25", title: "Strategic Architecture", desc: "Core blueprinting of the Kredibly ledger and AI interface flow.", status: "completed" },
                            { date: "DEC '25", title: "Kreddy AI Core", desc: "Intelligence engine development. Teaching Kreddy to understand merchant slang and complex debts.", status: "completed" },
                            { date: "JAN '26 - PRESENT", title: "Founding Member Waitlist", desc: "Onboarding our first 1,000 pioneers. Early access rewards and lifetime status for active participants.", status: "active" },
                            { date: "FEBRUARY", title: "Premium Ledger UX", desc: "Rollout of smart telemetry, professional document generators, and cross-device syncing.", status: "building" },
                            { date: "Q2 2026", title: "Global Marketplace Launch", desc: "Opening the ecosystem for public merchant registration and global transactions.", status: "future" },
                            { date: "Q3 2026", title: "Kredibly Mobile (Native)", desc: "The full ledger in your pocket. Offline-first, biometric security, and instant push intelligence.", status: "future", isMobile: true }
                        ].map((m, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                style={{ marginBottom: '64px', position: 'relative' }}
                            >
                                {/* Timeline Dot */}
                                <div 
                                    className="timeline-dot"
                                    style={{ 
                                        position: 'absolute', 
                                        left: '-41px', 
                                        top: '4px', 
                                        width: '16px', 
                                        height: '16px', 
                                        borderRadius: '50%', 
                                        background: m.status === 'active' ? 'var(--primary)' : m.status === 'completed' ? '#10B981' : 'white',
                                        border: m.status === 'future' ? '2px solid #E2E8F0' : 'none',
                                        boxShadow: m.status === 'active' ? '0 0 20px rgba(124, 58, 237, 0.5)' : 'none',
                                        zIndex: 2
                                    }}>
                                    {m.status === 'active' && <div className="pulse-dot" />}
                                </div>

                                <div style={{ 
                                    background: m.status === 'active' ? 'white' : 'transparent',
                                    padding: m.status === 'active' ? '32px' : '0',
                                    borderRadius: '24px',
                                    border: m.status === 'active' ? '1px solid #E2E8F0' : 'none',
                                    boxShadow: m.status === 'active' ? '0 20px 40px -10px rgba(0,0,0,0.05)' : 'none',
                                    opacity: m.status === 'completed' ? 0.7 : 1
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: m.status === 'active' ? 'var(--primary)' : '#94A3B8', letterSpacing: '0.1em' }}>{m.date}</span>
                                        {m.status === 'active' && (
                                            <span style={{ fontSize: '0.65rem', fontWeight: 900, background: 'rgba(76, 29, 149, 0.1)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '100px' }}>LIVE NOW</span>
                                        )}
                                        {m.status === 'building' && (
                                            <span style={{ fontSize: '0.65rem', fontWeight: 900, background: '#EFF6FF', color: '#3B82F6', padding: '4px 12px', borderRadius: '100px' }}>IN BUILD</span>
                                        )}
                                    </div>
                                    <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E293B', marginBottom: '12px' }}>{m.title}</h4>
                                    <p style={{ color: '#334155', fontWeight: 600, lineHeight: 1.6, maxWidth: '600px', margin: 0 }}>{m.desc}</p>
                                    
                                    {m.isMobile && (
                                        <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <Smartphone size={32} color="var(--primary)" />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>Native Mobile Preview</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Join waitlist for early beta invite.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Join the Waitlist Form */}
            <section id="join-form" className="adaptive-section" style={{ padding: '140px 24px', background: 'white' }}>
                <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <AnimatePresence mode="wait">
                        {!joined ? (
                            <motion.div 
                                key="form"
                                className="form-card"
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                style={{ 
                                    padding: '64px 48px', 
                                    borderRadius: '48px',
                                    background: '#FFFFFF', 
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.1)',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ display: 'inline-flex', padding: '8px 20px', borderRadius: '100px', background: 'rgba(244, 114, 182, 0.1)', color: '#F472B6', fontSize: '0.8rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '0.05em' }}>
                                    LIMITED FOUNDING SPOTS
                                </div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '12px', letterSpacing: '-0.03em', color: '#0F172A' }}>The "Pioneer Council"</h3>
                                <p style={{ color: '#64748B', marginBottom: '48px', fontWeight: 500, fontSize: '1.2rem', lineHeight: 1.5 }}>
                                    Join the inner circle. Founding members get an exclusive <span style={{ color: '#0F172A', fontWeight: 800 }}>Lifetime Pioneer Badge</span> + <span style={{ color: '#0F172A', fontWeight: 800 }}>Exclusive Lifetime Pricing</span> for being part of the journey.
                                </p>

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <input 
                                        type="text" 
                                        className="waitlist-input-light" 
                                        placeholder="Full Name" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        required 
                                    />
                                    <input 
                                        type="email" 
                                        className="waitlist-input-light" 
                                        placeholder="Business Email" 
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        required 
                                    />
                                    <input 
                                        type="tel" 
                                        className="waitlist-input-light" 
                                        placeholder="WhatsApp Number" 
                                        value={formData.whatsappNumber}
                                        onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
                                        required 
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <select 
                                            className="waitlist-input-light"
                                            value={formData.industry}
                                            onChange={e => setFormData({...formData, industry: e.target.value})}
                                            required
                                        >
                                            <option value="" disabled>Select Your Industry</option>
                                            {["Fashion & Lifestyle", "Food & Groceries", "Electronics & Gadgets", "Beauty & Wellness", "Professional Services", "Mobile Money Agent", "Commercial Enterprise"].map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="btn-primary" 
                                        style={{ 
                                            width: '100%', 
                                            height: '72px', 
                                            borderRadius: '24px', 
                                            background: 'var(--primary)', 
                                            fontSize: '1.25rem', 
                                            marginTop: '16px',
                                            boxShadow: '0 20px 40px -10px rgba(76, 29, 149, 0.4)'
                                        }}
                                    >
                                        {loading ? 'Securing Spot...' : 'Claim My Access'}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="success"
                                className="form-card"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ 
                                    padding: '80px 48px', 
                                    borderRadius: '48px',
                                    background: 'white', 
                                    border: '1.5px solid #22C55E',
                                    textAlign: 'center',
                                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.1)'
                                }}
                            >
                                <div style={{ width: '84px', height: '84px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                                    <CheckCircle2 size={48} color="#22C55E" />
                                </div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '16px', letterSpacing: '-0.02em', color: '#0F172A' }}>Welcome, {referralData?.name.split(" ")[0]}!</h3>
                                <p style={{ color: '#64748B', marginBottom: '48px', fontWeight: 600, fontSize: '1.2rem', lineHeight: 1.6 }}>
                                    You are officially a **Kredibly Founder.** <br />
                                    <span style={{ color: '#0F172A' }}>Want to jump the queue?</span> Refer 3 fellow business owners to move to the top batch instantly.
                                </p>

                                <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', marginBottom: '40px' }}>
                                    <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>YOUR ACCESS LINK</p>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input 
                                            readOnly 
                                            value={`${window.location.origin}/?ref=${referralData.referralCode}`} 
                                            style={{ flex: 1, background: 'none', border: 'none', color: '#0F172A', fontSize: '1rem', fontWeight: 800, outline: 'none' }}
                                        />
                                        <button onClick={copyLink} style={{ background: 'var(--primary)', border: 'none', width: '48px', height: '48px', borderRadius: '16px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(76, 29, 149, 0.2)' }}><Copy size={20} /></button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <button onClick={shareToWhatsApp} className="btn-secondary" style={{ flex: 1, background: '#25D366', color: 'white', border: 'none', height: '68px', borderRadius: '24px', fontSize: '1.1rem', minWidth: '240px' }}>
                                        <MessageCircle size={22} /> Share to WhatsApp Status
                                    </button>
                                    <button onClick={() => scrollToSection('meet-kreddy')} className="btn-secondary" style={{ minWidth: '220px', height: '64px', fontSize: '1.1rem' }}>
                                        Explore Ecosystem
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* 6. Footer */}
            <PublicFooter />

            <style>{`
                .waitlist-input-light {
                    width: 100%;
                    height: 64px;
                    background: #F8FAFC;
                    border: 1.5px solid #E2E8F0;
                    border-radius: 18px;
                    padding: 0 24px;
                    color: #0F172A;
                    font-size: 1.1rem;
                    font-weight: 500;
                    outline: none;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .waitlist-input-light:focus {
                    border-color: var(--primary);
                    background: #FFFFFF;
                    box-shadow: 0 0 0 4px rgba(76, 29, 149, 0.08);
                }
                .premium-gradient {
                    background: linear-gradient(135deg, var(--primary) 0%, #F472B6 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .hover-card-light:hover {
                    background: #FFFFFF !important;
                    transform: translateY(-10px);
                    border-color: #E2E8F0 !important;
                    box-shadow: 0 20px 40px -12px rgba(0,0,0,0.08) !important;
                }
                .bounce {
                    animation: bounce 2s infinite;
                }
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
                    40% {transform: translateY(-8px);}
                    60% {transform: translateY(-4px);}
                }
                @media (max-width: 640px) {
                    .waitlist-page { padding-top: 5px; }
                    .waitlist-input-light { height: 60px !important; }
                    .btn-primary { height: 64px !important; }
                    #join-form { padding: 60px 16px !important; }
                    .form-card { padding: 40px 24px !important; border-radius: 32px !important; }
                    .hero-section { padding-top: 40px !important; padding-bottom: 60px !important; }
                    .hero-badge { margin-bottom: 24px !important; padding: 8px 16px !important; gap: 4px !important; }
                    .hero-title { margin-bottom: 24px !important; line-height: 1.05 !important; }
                    .hero-subtext { margin-bottom: 32px !important; font-size: 1.1rem !important; }
                    .hero-button-group { margin-bottom: 40px !important; }
                    .waitlist-nav { padding: 24px 20px !important; }
                    .nav-logo { height: 32px !important; }
                    .mobile-ecosystem-grid { gap: 40px !important; }
                    .mobile-ecosystem-content { text-align: center !important; }
                    .mobile-ecosystem-buttons { 
                        justify-content: center !important; 
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 12px !important;
                        margin-top: 32px !important;
                    }
                    .waitlist-footer {
                        padding: 40px 24px 20px !important;
                    }
                    #join-form {
                        padding: 40px 16px !important;
                    }
                    .floating-popup-left { left: -10px !important; scale: 0.9; }
                    .floating-popup-right { right: -10px !important; scale: 0.9; }
                    .mission-timeline-container { padding-left: 24px !important; }
                    .timeline-line { left: 1px !important; }
                    .timeline-dot { left: -7px !important; width: 14px !important; height: 14px !important; }
                    .adaptive-section {
                        padding-top: 60px !important;
                        padding-bottom: 60px !important;
                    }
                    .hero-store-buttons > div {
                        padding: 8px 16px !important;
                    }
                    .hero-store-buttons {
                        gap: 12px !important;
                    }
                }
                .pulse-dot {
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    background: var(--primary);
                    opacity: 0.3;
                    animation: pulse-ring 2s infinite;
                }
                @keyframes pulse-ring {
                    0% { transform: scale(1); opacity: 0.3; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

const Sparkles = ({ size }) => (
    <Rocket size={size} className="Sparkles" />
);

export default Waitlist;
