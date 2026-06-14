import React, { useState, useEffect } from "react";
import {
    useNavigate,
    useLocation,
    Link } from "react-router-dom";
import {
    Zap,
    ArrowRight,
    MessageCircle,
    Sparkles,
    ShieldCheck, X,
    Check,
    LayoutDashboard,
    CreditCard,
    Users,
    Smartphone,
    TrendingUp,
    FileText,
    Lock,
    Calendar,
    Clock,
    Wallet,
    BadgeCheck,
    Plus,
    Minus,
    ChevronDown,
    Monitor,
    Tablet,
    Layout,
    Bell,
    Star,
    Mic
} from "lucide-react";
import { motion } from "framer-motion";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import kreddyWhatsapp from "../../assets/kreddy-whatsapp.jpg";

const Typewriter = ({ phrases }) => {
    const [displayText, setDisplayText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [index, setIndex] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        const handleType = () => {
            const currentPhrase = phrases[index % phrases.length];
            
            if (!isDeleting) {
                if (displayText.length < currentPhrase.length) {
                    setDisplayText(currentPhrase.substring(0, displayText.length + 1));
                    setTypingSpeed(150);
                } else {
                    setIsDeleting(true);
                    setTypingSpeed(2000); 
                }
            } else {
                if (displayText.length > 0) {
                    setDisplayText(currentPhrase.substring(0, displayText.length - 1));
                    setTypingSpeed(50);
                } else {
                    setIsDeleting(false);
                    setIndex((prev) => prev + 1);
                    setTypingSpeed(400);
                }
            }
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayText, isDeleting, index, phrases, typingSpeed]);

    return (
        <span style={{ display: 'inline-block', minWidth: '1px', whiteSpace: 'nowrap' }}>
            <span className="premium-gradient" translate="no">{displayText}</span>
            <span style={{ 
                color: '#F472B6', 
                marginLeft: '2px',
                animation: 'blink 1s infinite',
                fontWeight: 400
            }}>|</span>
        </span>
    );
};

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div style={{ 
            borderBottom: '1px solid #E2E8F0', 
            padding: '24px 0',
            cursor: 'pointer'
        }} onClick={() => setIsOpen(!isOpen)}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '24px'
            }}>
                <h4 style={{ 
                    fontSize: 'clamp(1.1rem, 2vw, 1.3rem)', 
                    fontWeight: 500, 
                    color: '#0F172A',
                    margin: 0
                }}>{question}</h4>
                <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: isOpen ? 'var(--primary)' : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                }}>
                    {isOpen ? <Minus size={18} color="white" /> : <Plus size={18} color="#64748B" />}
                </div>
            </div>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0, marginTop: isOpen ? 16 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
            >
                <p style={{ 
                    color: '#475569', 
                    fontSize: '1.05rem', 
                    lineHeight: 1.6, 
                    fontWeight: 400,
                    margin: 0,
                    maxWidth: '800px'
                }}>
                    {answer}
                </p>
            </motion.div>
        </div>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    const plans = [
        {
            name: "Hustler",
            slug: "hustler",
            tagline: "The Record-Keeper's Choice",
            description: "Stop writing in notebooks. Start building your digital reputation today.",
            price: "₦2,500",
            period: "/ month",
            fee: "Zero Transfer Fees*",
            features: [
                "50 Sales Records per Month",
                "Kreddy AI Text Intelligence",
                "10 Auto-Reminders & Tasks / mo",
                "Basic Debt Recovery Assistant",
                "Verified Ledger Seal",
                "Digital Receipts & Invoices"
            ],
            cta: profile?.plan === "hustler" ? "Current Plan" : "Start Hustling",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: false,
            color: "#64748B"
        },
        {
            name: "Oga Plan",
            slug: "oga",
            tagline: "The Business Leader",
            isPopular: true,
            description: "Step up to professional branding and AI voice recording for your business.",
            price: "₦5,000", 
            fee: "Zero Transfer Fees*",
            period: "/ month",
            features: [
                "Everything in Hustler Plan",
                "Unlimited Sales Records",
                "Kreddy Voice Notes (Just speak!)",
                "8 AM Morning Business Brief",
                "Add 1 Staff Member",
                "Co-Branded Receipts (Your Logo)",
                "Advanced AI Recovery Assistant"
            ],
            cta: profile?.plan === "oga" ? "Current Plan" : profile ? "Upgrade to Oga" : "Become an Oga",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: true,
            color: "var(--primary)"
        },
        {
            name: "Chairman",
            slug: "chairman",
            tagline: "The Empire Command Center",
            description: "Run multiple shops without stress. Lead your empire with zero commissions.",
            price: "₦7,500", 
            fee: "Zero Transfer Fees*",
            period: "/ month",
            features: [
                "Everything in Oga Plan",
                "White-Label Receipts (Only Your Logo)",
                "Up to 3 Staff & Offices",
                "Paper Invoice Scanning",
                "Priority Vault & Support"
            ],
            cta: profile?.plan === "chairman" ? "Current Plan" : profile ? "Lead Your Empire" : "Claim Chairman Title",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: false,
            color: "#0F172A"
        }
    ];

    const location = useLocation();
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            window.history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    };

    useEffect(() => {
        document.title = "Kredibly .  The AI Business OS for Nigerian Merchants";
        
        // Handle scrolling from other pages
        if (location.state?.scrollTo) {
            const sectionId = location.state.scrollTo;
            // Small delay to ensure the page has rendered
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    // Clear the state so it doesn't scroll again on refresh
                    window.history.replaceState({}, document.title);
                }
            }, 100);
        } else if (!window.location.hash) {
            window.scrollTo(0, 0);
        }
    }, [location]);

    // Install banner: show once, 4 s after first visit, never again after dismiss
    useEffect(() => {
        const dismissed = localStorage.getItem('kredibly_install_dismissed');
        if (dismissed) return;
        const t = setTimeout(() => setShowInstallBanner(true), 4000);
        return () => clearTimeout(t);
    }, []);

    const dismissInstallBanner = () => {
        setShowInstallBanner(false);
        localStorage.setItem('kredibly_install_dismissed', '1');
    };

    return (
        <div className="noise-bg" style={{
            minHeight: '100vh',
            backgroundColor: 'var(--background)',
            color: 'var(--text)',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            <PublicNavbar />

            {/* 1. Hero Section: Focused on "Assistant" and "Recovery" */}
            <section style={{ 
                position: 'relative', 
                backgroundColor: 'white', 
                overflow: 'hidden',
                borderBottom: '1px solid #F1F5F9'
            }}>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: `
                        radial-gradient(circle at 0% 0%, rgba(76, 29, 149, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 100% 0%, rgba(76, 29, 149, 0.12) 0%, transparent 50%),
                        radial-gradient(circle at 50% 100%, rgba(76, 29, 149, 0.05) 0%, transparent 60%)
                    `,
                    pointerEvents: 'none',
                    zIndex: 1
                }} />

                <header style={{
                    padding: 'calc(clamp(80px, 10vw, 110px) + env(safe-area-inset-top, 0px)) 24px clamp(2rem, 6vw, 70px)',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 2
                }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '24px',
                        background: 'white',
                        padding: '10px 24px',
                        borderRadius: '100px',
                        border: '1px solid rgba(76, 29, 149, 0.15)',
                        boxShadow: '0 8px 16px rgba(76, 29, 149, 0.08)'
                    }}>
                        <span style={{ 
                            fontSize: 'clamp(0.65rem, 2.5vw, 0.85rem)',
                            fontWeight: 700, 
                            color: 'var(--primary)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>The Intelligent Assistant for Every Merchant</span>
                    </div>

                    <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}
                >

                    <h1 style={{ 
                        fontSize: 'clamp(3.2rem, 9vw, 5.5rem)', 
                        fontWeight: 950, 
                        lineHeight: 0.95, 
                        marginBottom: '32px',
                        letterSpacing: '-0.06em',
                        fontFamily: 'var(--font-heading)'
                    }}>
                        <span style={{ display: 'block', marginBottom: '16px' }}>Send invoices. Get paid.</span>
                        <div style={{ 
                            color: 'var(--primary)', 
                            position: 'relative', 
                            minHeight: '1.2em',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '100%',
                            fontSize: 'clamp(2.4rem, 9vw, 5.5rem)',
                            fontFamily: 'var(--font-heading)',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                        }}>
                             <Typewriter phrases={[
                                "Instantly.",
                                "Seamlessly.",
                                "On autopilot.",
                                "With Kreddy AI"
                            ]} />
                        </div>
                    </h1>

                    <p style={{  
                        fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', 
                        color: '#4B5563', 
                        marginBottom: '48px', 
                        lineHeight: 1.6, 
                        maxWidth: '800px', 
                        marginInline: 'auto',
                        fontWeight: 400
                    }}>
                        The most powerful workspace for the modern Nigerian merchant. Use <b>Kreddy AI</b> to record sales, let our <b>AI Recovery Engine</b> chase down debts on autopilot, and enjoy <b>Instant Bank Sweeps</b> with zero transfer fees. Your money lands exactly where it belongs: in your bank account, immediately.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/auth/register" className="btn-primary btn-magnetic" style={{ padding: '20px 40px', fontSize: '1.1rem', borderRadius: '18px' }}>
                            Get Started <ArrowRight size={20} />
                        </Link>
                        <div className="glass-premium" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 24px', borderRadius: '18px', color: '#64748B', fontSize: '0.9rem', fontWeight: 400 }}>
                            <ShieldCheck size={20} color="var(--success)" /> Direct-to-Bank Verified
                        </div>
                    </div>
                </motion.div>
            </motion.div>
            </header>
            </section>

            {/* 2. Bento Grid Section: Repositioned for Personal Assistant + Ledger */}
            <section id="features" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px' }}>
                <div className="bento-grid" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div className="bento-item bento-1" style={{ background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '12px' }}>Financial Trust Infrastructure</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 400 }}>
                                Your business is verified. Every Kredibly receipt carries a professional seal proving your records are secure and untamperable.
                            </p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.05 }}><ShieldCheck size={200} color="var(--primary)" /></div>
                    </div>

                    <div className="bento-item bento-2" style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '12px' }}>Intelligent Business Partner</h4>
                            <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 400 }}>Too busy to type? Speak to Kreddy. She drafts your professional invoices and follow-ups for you to send personally.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.15 }}><Sparkles size={200} /></div>
                    </div>

                    <div className="bento-item bento-3" style={{ background: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Automated Ledger Intelligence</h4>
                            <p style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 400 }}>Send paper invoices or store receipts to Kreddy. She reads the details and logs the sales instantly.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.05 }}><Lock size={200} color="#7C3AED" /></div>
                    </div>

                    <div className="bento-item bento-4" style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '12px' }}>Real-Time Revenue Access</h4>
                            <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 400 }}>Customer pays via bank transfer, money lands in your bank instantly. Zero holding periods.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.15 }}><Wallet size={200} /></div>
                    </div>

                    <div className="bento-item bento-5" style={{ background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '10px' }}>Zero-Fee Payout Model</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 400 }}>We cover your bank transfer charges. Your ₦5,000 sale is ₦5,000 in your pocket.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.05 }}><BadgeCheck size={200} color="#4C1D95" /></div>
                    </div>
                </div>
            </section>

            {/* 3. SIMULATED WHATSAPP FLOW: Kreddy Assistant Showcase */}
            <section id="how-it-works" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px', background: 'white', color: '#0F172A', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '24px' }}>Meet Kreddy: Your AI Admin.</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.3rem', fontWeight: 400, maxWidth: '700px', margin: '0 auto' }}>She listens, learns, and drafts your commerce work so you can focus on selling.</p>
                    </div>

                    <div className="landing-mockup-grid">
                        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div className="phone-mockup-wrapper">
                                <motion.div
                                    className="phone-mockup"
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.7, ease: 'easeOut' }}
                                    style={{
                                        width: '100%',
                                        background: '#0F172A',
                                        borderRadius: '48px',
                                        padding: '12px',
                                        boxShadow: '0 60px 120px -20px rgba(76,29,149,0.25), 0 0 0 1px rgba(255,255,255,0.08)',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Dynamic Island */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '20px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '100px',
                                        height: '28px',
                                        backgroundColor: '#000000',
                                        borderRadius: '24px',
                                        zIndex: 20,
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        padding: '0 10px',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
                                    }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#111', border: '1px solid #222' }}></div>
                                    </div>

                                    <div style={{
                                        width: '100%',
                                        borderRadius: '40px',
                                        overflow: 'hidden',
                                        lineHeight: 0,
                                        paddingTop: '32px',
                                        backgroundColor: '#F6F6F6'
                                    }}>
                                        <img
                                            src={kreddyWhatsapp}
                                            alt="Real Kreddy AI WhatsApp conversation showing sales recording, scheduling, and debt tracking"
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                display: 'block',
                                                objectFit: 'cover',
                                                objectPosition: 'top'
                                            }}
                                        />
                                    </div>
                                </motion.div>

                                {/* Floating Bubble 1: Received 20k */}
                                <motion.div
                                    initial={{ opacity: 0, x: -30, y: 20 }}
                                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                    className="floating-bubble-1"
                                    style={{
                                        background: 'white',
                                        borderRadius: '100px',
                                        padding: '12px 32px 12px 12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#DB2777', fontSize: '18px' }}>
                                        MN
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 800, fontSize: '16.5px', color: '#0F172A', lineHeight: 1.2 }}>Received 20k</span>
                                        <span style={{ color: '#64748B', fontSize: '14px', fontWeight: 500 }}>from Mama Ngozi</span>
                                    </div>
                                </motion.div>

                                {/* Floating Bubble 2: Total Budget */}
                                <motion.div
                                    initial={{ opacity: 0, x: 30, y: -20 }}
                                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                    className="floating-bubble-2"
                                    style={{
                                        background: 'white',
                                        borderRadius: '24px',
                                        padding: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'
                                    }}
                                >
                                   <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                       <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ position: 'absolute', top: 0, left: 0 }}>
                                           <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                                           <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="60, 100" strokeLinecap="round" />
                                       </svg>
                                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, marginTop: '2px' }}>
                                           <span style={{ fontSize: '9px', color: '#64748B', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '2px' }}>Total Budget</span>
                                           <span style={{ fontSize: '14px', fontWeight: 900, color: '#0F172A' }}>350,000</span>
                                       </div>
                                   </div>
                                </motion.div>

                                {/* Floating Bubble 3: Overlapping logos */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7, duration: 0.6 }}
                                    className="floating-bubble-3"
                                    style={{
                                        background: 'white',
                                        borderRadius: '100px',
                                        padding: '12px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                                            <path d="M20 2 L36 10 L36 30 L20 38 L4 30 L4 10 Z" fill="#7C3AED" />
                                            <path d="M20 12 L28 16 L20 20 L16 18 M28 24 L20 28 L12 24 L12 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, border: '3px solid white', marginLeft: '-18px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                                            <circle cx="20" cy="20" r="14" stroke="#10B981" strokeWidth="8" />
                                            <rect x="2" y="15" width="12" height="10" fill="#1E3A8A" rx="2" />
                                        </svg>
                                    </div>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: '3px solid white', marginLeft: '-18px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                                            <path d="M20 4 L36 20 L20 36 L4 20 Z" stroke="#F97316" strokeWidth="4" />
                                            <path d="M20 12 L28 20 L20 28 L12 20 Z" stroke="#F97316" strokeWidth="4" />
                                            <rect x="18" y="18" width="4" height="4" fill="#F97316" />
                                        </svg>
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
                                {[
                                    { icon: Mic, title: "Speak, don't type.", desc: "Send Kreddy a voice note. She handles the math, records the sale, and drafts the professional responses for you." },
                                    { icon: Smartphone, title: "You Send, She Drafts.", desc: "Keep the personal touch. Kreddy prepares the perfect messages, and you send them personally to your customers." },
                                    { icon: Zap, title: "Instant Bank Settlements", desc: "Your money hits your bank account the second a customer pays. No 24-hour waiting games." },
                                    { icon: BadgeCheck, title: "Zero Bank Charges", desc: "ZERO TRANSFER FEES. We cover your bank charges on all your payouts. Keep 100% of your earnings." },
                                    { icon: Clock, title: "8 AM Business Briefing", desc: "Wake up to a morning briefing on WhatsApp. Who owes you, who paid, and what your day looks like." }
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '28px' }}>
                                        <div style={{ minWidth: '64px', height: '64px', borderRadius: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon color="var(--primary)" size={28} /></div>
                                        <div><h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>{item.title}</h4><p style={{ color: '#475569', lineHeight: 1.6, fontWeight: 400 }}>{item.desc}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. PRICING SECTION: Updated for Premium Pricing */}
            <section id="pricing" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px', background: 'white', color: '#0F172A' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 8vw, 80px)' }}>
                        <div style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 700, fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', letterSpacing: '0.05em' }}>100% INSTANT SETTLEMENTS & ZERO BANK FEES</div>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1 }}>Premium Pricing. <br /><span className="premium-gradient">Unlimited Growth.</span></h2>
                        <p style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)', color: '#64748B', marginTop: '20px', maxWidth: '600px', margin: '20px auto 48px' }}>Choose the plan that fits your ambition. No hidden bank charges, no transaction commissions, just pure business power.</p>
                    </div>

                    <div className="lp-pricing-grid">
                        {plans.map((plan, i) => (
                             <div key={i} className={`lp-pricing-card ${plan.highlight ? 'lp-pricing-card--featured' : ''}`} style={{ position: 'relative' }}>
                                {plan.isPopular && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: '-16px', 
                                        left: '50%', 
                                        transform: 'translateX(-50%)',
                                        background: 'var(--primary)',
                                        color: '#fff',
                                        padding: '6px 16px',
                                        borderRadius: '100px',
                                        fontSize: '0.7rem',
                                        fontWeight: 800,
                                        boxShadow: '0 8px 16px rgba(76, 29, 149, 0.2)',
                                        zIndex: 10,
                                        letterSpacing: '0.05em',
                                        whiteSpace: 'nowrap'
                                    }}>MOST POPULAR</div>
                                )}

                                <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 800, marginBottom: '6px' }}>{plan.name}</h3>
                                <p style={{ opacity: 0.7, fontSize: '0.9rem', fontWeight: 600, marginBottom: '24px', lineHeight: 1.4 }}>{plan.description}</p>
                                
                                <div style={{ marginBottom: '32px' }}>
                                    <div className="lp-price-row">
                                        <span className="lp-price-main">{plan.price}</span>
                                        <span className="lp-price-period">{plan.period}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: plan.highlight ? '#4ADE80' : 'var(--primary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Star size={14} fill={plan.highlight ? '#4ADE80' : 'var(--primary)'} />
                                        {plan.fee}
                                    </div>
                                </div>



                                <button 
                                    onClick={plan.ctaAction}
                                    className={plan.highlight ? "btn-primary" : "btn-secondary"} 
                                    style={{ width: '100%', marginBottom: '32px', justifyContent: 'center', height: '58px', borderRadius: '18px', fontSize: '1rem', fontWeight: 800, boxShadow: plan.highlight ? '0 15px 30px -5px rgba(124, 58, 237, 0.4)' : 'none' }}
                                >
                                    {plan.cta} <ArrowRight size={18} strokeWidth={3} />
                                </button>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {plan.features.map((feat, j) => (
                                        <div key={j} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '0.9rem', fontWeight: 600 }}>
                                            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: plan.highlight ? 'rgba(255,255,255,0.1)' : 'rgba(76, 29, 149, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                                <Check size={14} strokeWidth={3} color={plan.highlight ? '#4ADE80' : 'var(--primary)'} />
                                            </div>
                                            <span style={{ lineHeight: 1.4 }}>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Progressive Web App (PWA) Section: Multi-Device Workspace */}
            <section id="pwa-workspace" style={{ padding: 'clamp(4rem, 10vw, 8rem) 24px', background: '#0F172A', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '80px', alignItems: 'center', marginBottom: '80px' }}>
                        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '100px', marginBottom: '32px', color: '#A78BFA', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                                THE PROFESSIONAL WORKSPACE
                            </div>
                            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '32px' }}>
                                Desktop Power. <br />
                                <span className="premium-gradient">One Seamless App.</span>
                            </h2>
                            <p style={{ fontSize: '1.25rem', color: '#CBD5E1', fontWeight: 400, lineHeight: 1.6, marginBottom: '40px' }}>
                                Install Kredibly on your phone, tablet, or laptop as a high-performance Progressive Web App (PWA). Get <b>Instant Push Alerts</b> for every payment without App Store downloads. Just lightning-fast access to your global commerce infrastructure.
                            </p>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px' }}>
                                {[
                                    { icon: Smartphone, title: "Phone", desc: "Native speed for on-the-go management." },
                                    { icon: Bell, title: "Push Alerts", desc: "Real-time payment notifications on your screen." },
                                    { icon: Monitor, title: "Desktop", desc: "Full-screen power for deep ledger work." }
                                ].map((f, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--primary)' }}>
                                            <f.icon size={20} />
                                            <h4 style={{ color: 'white', margin: 0, fontWeight: 700 }}>{f.title}</h4>
                                        </div>
                                        <p style={{ color: '#94A3B8', fontSize: '0.85rem', margin: 0, fontWeight: 400 }}>{f.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 30 }} 
                            whileInView={{ opacity: 1, y: 0 }} 
                            viewport={{ once: true }}
                            style={{ position: 'relative' }}
                        >
                            <div style={{ position: 'relative', width: '100%', height: '420px' }}>
                                {/* Detailed Laptop Mockup (Dark Mode) */}
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '0', 
                                    right: '0', 
                                    width: '100%', 
                                    maxWidth: '520px', 
                                    height: '320px', 
                                    background: '#1E293B', 
                                    borderRadius: '16px', 
                                    border: '10px solid #334155',
                                    boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ height: '24px', background: '#334155', display: 'flex', alignItems: 'center', padding: '0 12px', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444' }} />
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }} />
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                                    </div>
                                    <div style={{ padding: '15px', background: '#0F172A', height: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <div style={{ width: '100px', height: '20px', background: 'rgba(124, 58, 237, 0.2)', borderRadius: '4px' }} />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#1E293B' }} />
                                                <div style={{ width: '20px', height: '20px', borderRadius: '4px', background: '#1E293B' }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                            <div style={{ padding: '12px', background: '#1E293B', borderRadius: '10px', border: '1px solid #334155' }}>
                                                <div style={{ fontSize: '0.6rem', color: '#94A3B8', marginBottom: '4px' }}>Total Revenue</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>₦2,450,000</div>
                                            </div>
                                            <div style={{ padding: '12px', background: '#1E293B', borderRadius: '100px', border: '1px solid #334155', display: 'none' }} /> {/* dummy */}
                                            <div style={{ padding: '12px', background: '#1E293B', borderRadius: '10px', border: '1px solid #334155' }}>
                                                <div style={{ fontSize: '0.6rem', color: '#94A3B8', marginBottom: '4px' }}>Pending Debts</div>
                                                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#EF4444' }}>₦120,400</div>
                                            </div>
                                        </div>
                                        <div style={{ height: '80px', background: '#1E293B', borderRadius: '10px', padding: '12px' }}>
                                            <div style={{ fontSize: '0.6rem', color: '#94A3B8', marginBottom: '8px' }}>Sales Analytics</div>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '40px' }}>
                                                {[40, 70, 45, 90, 65, 80, 50].map((h, k) => <div key={k} style={{ flex: 1, height: `${h}%`, background: 'var(--primary)', borderRadius: '2px', opacity: 0.6 }} />)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Detailed Tablet Mockup (Dark Mode) */}
                                <motion.div 
                                    animate={{ y: [0, -15, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ 
                                        position: 'absolute', 
                                        bottom: '0', 
                                        left: '0', 
                                        width: '240px', 
                                        height: '320px', 
                                        background: '#0F172A', 
                                        borderRadius: '24px', 
                                        border: '8px solid #334155',
                                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                                        zIndex: 5,
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ height: '32px', background: '#1E293B', display: 'flex', alignItems: 'center', padding: '0 15px' }}>
                                        <div style={{ width: '30px', height: '4px', background: '#334155', borderRadius: '2px' }} />
                                    </div>
                                    <div style={{ padding: '20px' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '15px', color: 'white' }}>Daily Ledger</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { label: "Oando Plc", val: "+₦45k" },
                                                { label: "Musa & Sons", val: "+₦12k" },
                                                { label: "Debts Paid", val: "+₦200k" },
                                                { label: "New Sale", val: "+₦85k" }
                                            ].map((row, l) => (
                                                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#1E293B', borderRadius: '6px', fontSize: '0.65rem' }}>
                                                    <span style={{ fontWeight: 600, color: '#CBD5E1' }}>{row.label}</span>
                                                    <span style={{ color: '#10B981', fontWeight: 800 }}>{row.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>

                    {/* How to Install Guide (Transparent on Dark) */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', padding: '48px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '12px', color: 'white' }}>How to Install</h3>
                            <p style={{ color: '#94A3B8', fontWeight: 400 }}>No App Store needed. Setup in 10 seconds.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px' }}>
                            {[
                                { 
                                    device: "iOS (iPhone/iPad)", 
                                    steps: [
                                        "Open usekredibly.com in Safari",
                                        "Tap the 'Share' icon (square with arrow)",
                                        "Scroll down and tap 'Add to Home Screen'"
                                    ] 
                                },
                                { 
                                    device: "Android (Samsung/Pixel/etc)", 
                                    steps: [
                                        "Open usekredibly.com in Chrome",
                                        "Tap the three dots (⋮) at the top right",
                                        "Tap 'Install App' or 'Add to Home Screen'"
                                    ] 
                                },
                                { 
                                    device: "Desktop (Mac/Windows/Linux)", 
                                    steps: [
                                        "Open usekredibly.com in Chrome or Edge",
                                        "Click the 'Install' icon in the URL bar",
                                        "Confirm 'Install' to add to your dock/taskbar"
                                    ] 
                                }
                            ].map((guide, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ color: '#A78BFA', marginBottom: '20px', fontWeight: 700 }}>{guide.device}</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {guide.steps.map((step, j) => (
                                            <div key={j} style={{ display: 'flex', gap: '12px', fontSize: '0.9rem', color: '#CBD5E1', lineHeight: 1.4 }}>
                                                <div style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.2)', color: '#A78BFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>{j + 1}</div>
                                                {step}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
    {/* 3.5. ROI SECTION: The Cost of Doing Nothing */}
            <section id="roi" style={{ padding: 'clamp(4rem, 10vw, 8rem) 24px', background: 'white', color: '#0F172A', position: 'relative', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '100px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '24px' }}>THE COST OF DOING NOTHING</div>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '24px' }}>How much are you losing?</h2>
                    <p style={{ color: '#64748B', fontSize: '1.2rem', fontWeight: 400, maxWidth: '700px', margin: '0 auto 60px' }}>Traditional payment gateways charge you 1.5% and hold your money for 24 hours. Small debts go forgotten. Here is the Kredibly difference.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0', textAlign: 'left', borderRadius: '24px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                        {/* Traditional */}
                        <div style={{ background: '#F8FAFC', padding: '40px', borderRight: '1px solid #E2E8F0' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#64748B', marginBottom: '32px', textAlign: 'center' }}>Without Kredibly</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#EF4444' }}>✕</div>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#64748B', flex: 1 }}>High Fees (1.5% + ₦100 per transfer)</p>
                                </div>
                                <div style={{ height: '1px', background: '#E2E8F0' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#EF4444' }}>✕</div>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#64748B', flex: 1 }}>24-Hour Settlement Delays (T+1)</p>
                                </div>
                                <div style={{ height: '1px', background: '#E2E8F0' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#EF4444' }}>✕</div>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#64748B', flex: 1 }}>Manual Bank Alert Checking</p>
                                </div>
                                <div style={{ height: '1px', background: '#E2E8F0' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#EF4444' }}>✕</div>
                                    <p style={{ margin: 0, fontWeight: 500, color: '#64748B', flex: 1 }}>Forgotten Debts & Unpaid Invoices</p>
                                </div>
                            </div>
                        </div>

                        {/* Kredibly */}
                        <div style={{ background: 'white', padding: '40px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700 }}>ROI MULTIPLIER</div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '32px', textAlign: 'center' }}>With Kredibly</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#10B981' }}><Check size={20} /></div>
                                    <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', flex: 1 }}>Subsidized Gateway (Zero Transfer Fees)</p>
                                </div>
                                <div style={{ height: '1px', background: '#E2E8F0' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#10B981' }}><Check size={20} /></div>
                                    <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', flex: 1 }}>Instant Payouts (Money lands instantly)</p>
                                </div>
                                <div style={{ height: '1px', background: '#E2E8F0' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#10B981' }}><Check size={20} /></div>
                                    <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', flex: 1 }}>AI Slip Matching (Ledger auto-updates)</p>
                                </div>
                                <div style={{ height: '1px', background: '#E2E8F0' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#10B981' }}><Check size={20} /></div>
                                    <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', flex: 1 }}>Automated Debt Recovery AI</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
    <section id="mission-map" style={{ padding: 'clamp(4rem, 10vw, 8rem) 24px', background: '#F8FAFC', color: '#0F172A', borderTop: '1px solid #E2E8F0' }}>
                <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <div style={{ display: 'inline-flex', padding: '8px 20px', borderRadius: '100px', background: 'rgba(76, 29, 149, 0.05)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '24px', letterSpacing: '0.1em' }}>
                            OUR JOURNEY & VISION
                        </div>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#0F172A' }}>The Mission Map.</h2>
                        <p style={{ fontSize: '1.2rem', color: '#334155', fontWeight: 400, marginTop: '16px' }}>Transparent milestones from a simple idea to a global financial ecosystem.</p>
                    </div>

                    <div className="mission-timeline-container" style={{ position: 'relative', paddingLeft: '40px' }}>
                        {/* Vertical Line */}
                        <div className="timeline-line" style={{ position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #E2E8F0 0%, #7C3AED 30%, #7C3AED 70%, #E2E8F0 100%)' }} />

                        {[
                            { date: "JULY '25", title: "The Genesis", desc: "Concept & Research Phase. Identifying the 'Trust Gap' in African commerce.", status: "completed" },
                            { date: "SEPT '25", title: "Strategic Architecture", desc: "Core blueprinting of the Kredibly workspace and AI interface flow.", status: "completed" },
                            { date: "DEC '25", title: "Kreddy AI Core", desc: "Intelligence engine development. Teaching Kreddy to understand merchant slang and complex debts.", status: "completed" },
                            { date: "JAN '26", title: "Premium Platform UX", desc: "Rollout of smart telemetry, professional document generators, and cross-device syncing.", status: "done" },
                            { date: "JAN '26: JUNE '26", title: "Pioneer Program", desc: "Onboarding our first 1,000 pioneers. Lifetime status and exclusive rewards for our founding merchants.", status: "active", isFounding: true },
                            { date: "JULY 1ST", title: "Public Launch", desc: "Opening the ecosystem for public merchant registration and global transactions. Kredibly goes live for everyone.", status: "future" }
                        ].map((m, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.1 }}
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
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: m.status === 'active' ? 'var(--primary)' : '#94A3B8', letterSpacing: '0.1em' }}>{m.date}</span>
                                        {m.isFounding && m.status === 'active' && (
                                            <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'rgba(76, 29, 149, 0.1)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '100px' }}>LIVE NOW</span>
                                        )}
                                    </div>
                                    <h4 style={{ fontSize: '1.4rem', fontWeight: 700, color: m.status === 'active' ? '#0F172A' : '#64748B', marginBottom: '12px' }}>{m.title}</h4>
                                    <p style={{ color: m.status === 'active' ? '#334155' : '#64748B', fontWeight: 400, lineHeight: 1.6, maxWidth: '600px', margin: 0 }}>{m.desc}</p>
                                    
                                    {m.isMobile && (
                                        <div style={{ marginTop: '24px', padding: '20px', background: m.status === 'active' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <Smartphone size={32} color="var(--primary)" />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: m.status === 'active' ? '#0F172A' : '#64748B' }}>Native Mobile Preview</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Coming Q3 2026</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 8. FAQ Section */}
            <section id="faq" style={{ padding: 'clamp(4rem, 10vw, 8rem) 24px', background: 'white' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div style={{ display: 'inline-flex', padding: '8px 20px', borderRadius: '100px', background: 'rgba(76, 29, 149, 0.05)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '24px', letterSpacing: '0.1em' }}>GOT QUESTIONS?</div>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.04em', color: '#0F172A' }}>Common Questions.</h2>
                        <p style={{ fontSize: '1.2rem', color: '#64748B', fontWeight: 400, marginTop: '16px' }}>Everything you need to know about scaling with Kredibly.</p>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '40px', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
                        <FAQItem 
                            question="How does Kreddy AI actually work?" 
                            answer="Kreddy is your intelligent business companion on WhatsApp. When you send a voice note like 'Kreddy, I just sold a bag to Sarah for 50k', she uses natural language processing to extract the customer name, amount, and item. She then automatically creates a professional invoice, records it in your ledger, and even drafts the WhatsApp message for you to send to Sarah."
                        />
                        <FAQItem 
                            question="Is my money safe with Kredibly?" 
                            answer="Absolutely. Kredibly is built on top of regulated banking infrastructure. We never hold your funds for 24 hours like traditional gateways. The moment your customer pays, the money is routed through our instant-settlement pipeline directly to your verified bank account."
                        />
                        <FAQItem 
                            question="How do I get my money out?" 
                            answer="You don't have to! Unlike other platforms where you have to 'request withdrawal', Kredibly features Instant Bank Sweeps. This means every successful payment is automatically swept into your primary bank account within seconds of the transaction."
                        />
                        <FAQItem 
                            question="What are the charges?" 
                            answer="We believe in transparency. We charge a simple, flat monthly subscription fee based on your plan (Hustler, Oga, or Chairman). In return, we provide ZERO TRANSFER FEES on your payouts. We subsidize the bank charges so you keep exactly what you earned."
                        />
                        <FAQItem 
                            question="Can I use Kredibly without a smartphone?" 
                            answer="Yes. While our dashboard is best viewed on a smartphone or computer, the core Kreddy AI interface lives on WhatsApp. As long as you have any device that can run WhatsApp (even a feature phone with WhatsApp support), you can record sales, check balances, and manage your business."
                        />
                    </div>
                </div>
            </section>

            {/* 7. Final Conversion Section (Pioneer Edition): Oga Dark Theme */}
            <section style={{ padding: 'clamp(80px, 12vw, 150px) 24px', background: '#0F172A', textAlign: 'center', color: 'white' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '100px', marginBottom: '32px', color: 'white', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em' }}>EXCLUSIVE PRE-LAUNCH ACCESS</div>
                    <h2 style={{ fontSize: 'clamp(2.1rem, 7vw, 4.5rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '32px', color: 'white' }}>Build Your <span className="premium-gradient">Business Empire.</span></h2>
                    <p style={{ color: '#94A3B8', fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 400, maxWidth: '650px', margin: '0 auto 48px', lineHeight: 1.6 }}>Join the next generation of African merchants. Experience the full power of Kredibly's infrastructure with 14 days of Chairman access, absolutely free.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '24px 64px', fontSize: '1.25rem', borderRadius: '100px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}>Get 14 Days Free <ArrowRight size={24} /></button>
                        <p style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 500 }}>No card required. Setup in under 2 minutes.</p>
                    </div>
                </motion.div>
            </section>

            <PublicFooter />

            {/* ── Install Kredibly Banner ── */}
            {showInstallBanner && (
                <motion.div
                    initial={{ opacity: 0, y: 80, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 60, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        zIndex: 9999,
                        background: 'white',
                        borderRadius: '24px',
                        boxShadow: '0 24px 64px -12px rgba(76,29,149,0.22), 0 0 0 1px rgba(76,29,149,0.08)',
                        padding: '24px 28px 22px',
                        maxWidth: '340px',
                        width: 'calc(100vw - 48px)',
                        fontFamily: 'inherit'
                    }}
                >
                    {/* Dismiss */}
                    <button
                        onClick={dismissInstallBanner}
                        style={{
                            position: 'absolute', top: '16px', right: '16px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#94A3B8', padding: '4px', display: 'flex', alignItems: 'center'
                        }}
                        aria-label="Dismiss"
                    >
                        <X size={18} />
                    </button>

                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #4C1D95 0%, #7C3AED 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Smartphone size={26} color="white" />
                        </div>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A', margin: 0, lineHeight: 1.3 }}>Install Kredibly App</p>
                            <p style={{ color: '#64748B', fontSize: '0.82rem', margin: '4px 0 0', lineHeight: 1.4 }}>Add to your home screen for instant access and a better mobile experience.</p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '18px' }} />

                    {/* Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: 'rgba(76,29,149,0.08)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.8rem', color: '#4C1D95', flexShrink: 0
                            }}>1</div>
                            <p style={{ color: '#334155', fontSize: '0.88rem', margin: 0, lineHeight: 1.4 }}>
                                Tap the <strong>Share</strong> button ⬆ in Safari or Chrome
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: 'rgba(76,29,149,0.08)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.8rem', color: '#4C1D95', flexShrink: 0
                            }}>2</div>
                            <p style={{ color: '#334155', fontSize: '0.88rem', margin: 0, lineHeight: 1.4 }}>
                                Choose <strong>Add to Home Screen</strong> ⊞
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            <style>{`
                .landing-mockup-grid { display: grid; grid-template-columns: 1fr; gap: 3rem; align-items: center; }
                @media (min-width: 992px) { .landing-mockup-grid { grid-template-columns: 1fr 1.2fr; gap: 5rem; } }
                /* Flip order on desktop: image left, features right */
                @media (min-width: 992px) { .landing-mockup-grid > *:first-child { order: 1; } .landing-mockup-grid > *:last-child { order: 2; } }

                .premium-gradient {
                    background: linear-gradient(135deg, var(--primary) 0%, #F472B6 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .lp-pricing-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 32px;
                    align-items: start;
                }
                .lp-pricing-card {
                    padding: 48px 40px;
                    border-radius: 32px;
                    background: white;
                    color: #0F172A;
                    border: 1px solid #E2E8F0;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                    transition: all 0.3s ease;
                }
                .lp-pricing-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.06);
                }
                .lp-pricing-card--featured {
                    background: #0F172A;
                    color: white;
                    border: 2px solid var(--primary);
                    box-shadow: 0 20px 50px -10px rgba(15,23,42,0.3);
                }
                .lp-price-row {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .lp-price-main {
                    font-size: clamp(2rem, 4vw, 3.2rem);
                    font-weight: 800;
                    letter-spacing: -0.04em;
                    line-height: 1;
                }
                .lp-price-period {
                    opacity: 0.6;
                    font-weight: 700;
                    font-size: 1rem;
                }

                @media (max-width: 1000px) {
                    .lp-pricing-grid {
                        grid-template-columns: 1fr;
                        max-width: 480px;
                        margin: 0 auto;
                    }
                }

                .phone-mockup-wrapper {
                    position: relative;
                    width: 100%;
                    max-width: 340px;
                    margin: 0 auto;
                }
                .floating-bubble-1 {
                    position: absolute;
                    top: 20px;
                    left: -16%; /* Shifted to left to keep more of it outside the phone body */
                    z-index: 25; /* Higher than dynamic island (20) to cover it */
                    animation: float-1 5s ease-in-out infinite;
                }
                .floating-bubble-2 {
                    position: absolute;
                    top: 22px; /* Really close to dynamic island */
                    right: -15%;
                    z-index: 10;
                    animation: float-2 6s ease-in-out infinite;
                }
                .floating-bubble-3 {
                    position: absolute;
                    bottom: 18%;
                    left: -10%;
                    z-index: 10;
                    animation: float-3 7s ease-in-out infinite;
                }

                @keyframes float-1 {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes float-2 {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes float-3 {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-7px); }
                }

                @media (max-width: 768px) {
                    .phone-mockup-wrapper {
                        max-width: 280px !important;
                    }
                    .phone-mockup { transform: scale(1); max-width: 100% !important; }
                    .floating-bubble-1 {
                        top: 15px !important;
                        left: -25px !important; /* Shifted to left so part of it hangs outside the phone body */
                        z-index: 25 !important;
                        animation: float-1-mobile 5s ease-in-out infinite !important;
                        transform-origin: left center !important;
                    }
                    .floating-bubble-2 {
                        top: 15px !important;
                        right: -10px !important;
                        animation: float-2-mobile 6s ease-in-out infinite !important;
                        transform-origin: right center !important;
                    }
                    .floating-bubble-3 {
                        bottom: 12% !important;
                        left: -10px !important;
                        animation: float-3-mobile 7s ease-in-out infinite !important;
                        transform-origin: left center !important;
                    }
                    section h2 { font-size: clamp(1.5rem, 6vw, 2.4rem) !important; }
                    section h3 { font-size: clamp(1rem, 4vw, 1.4rem) !important; }
                    section h4 { font-size: clamp(0.95rem, 3.5vw, 1.2rem) !important; }
                    section p  { font-size: clamp(0.82rem, 3vw, 1rem) !important; }
                }

                @keyframes float-1-mobile {
                    0%, 100% { transform: scale(0.85) translateY(0); }
                    50% { transform: scale(0.85) translateY(-8px); }
                }
                @keyframes float-2-mobile {
                    0%, 100% { transform: scale(0.85) translateY(0); }
                    50% { transform: scale(0.85) translateY(-6px); }
                }
                @keyframes float-3-mobile {
                    0%, 100% { transform: scale(0.85) translateY(0); }
                    50% { transform: scale(0.85) translateY(-7px); }
                }
                
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                
                .pulse-dot-landing {
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    background: var(--primary);
                    opacity: 0.4;
                    animation: pulse-ring 2s infinite;
                }
                
                @keyframes pulse-ring {
                    0% { transform: scale(0.8); opacity: 0.5; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;