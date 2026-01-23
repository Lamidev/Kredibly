import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Zap,
    ArrowRight,
    MessageCircle,
    Sparkles,
    ShieldCheck,
    CheckCheck,
    LayoutDashboard,
    CreditCard,
    Users,
    Smartphone,
    Globe,
    BarChart3,
    TrendingUp,
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";

const Typewriter = ({ phrases }) => {
    const [displayText, setDisplayText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [index, setIndex] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        const handleType = () => {
            const currentPhrase = phrases[index % phrases.length];
            
            if (isDeleting) {
                setDisplayText(currentPhrase.substring(0, displayText.length - 1));
                setTypingSpeed(50);
            } else {
                setDisplayText(currentPhrase.substring(0, displayText.length + 1));
                setTypingSpeed(150);
            }

            if (!isDeleting && displayText === currentPhrase) {
                setTimeout(() => setIsDeleting(true), 2500);
            } else if (isDeleting && displayText === "") {
                setIsDeleting(false);
                setIndex((prev) => prev + 1);
                setTypingSpeed(500);
            }
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayText, isDeleting, index, phrases, typingSpeed]);

    return <span>{displayText}</span>;
};

const LandingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            window.history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    };

    useEffect(() => {
        if (!window.location.hash) {
            window.scrollTo(0, 0);
        }
    }, [location]);

    return (
        <div className="noise-bg" style={{
            minHeight: '100vh',
            backgroundColor: 'var(--background)',
            color: 'var(--text)',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            <PublicNavbar />

            {/* Hero Section - Executive Redesign */}
            <header style={{
                padding: '180px 20px 120px',
                maxWidth: '1200px',
                margin: '0 auto',
                textAlign: 'center',
                position: 'relative',
                zIndex: 2
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '40px',
                        background: 'rgba(76, 29, 149, 0.05)',
                        padding: '10px 24px',
                        borderRadius: '100px',
                        border: '1px solid rgba(76, 29, 149, 0.1)'
                    }}>
                        <Sparkles size={16} color="var(--primary)" />
                        <span style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 700, 
                            color: 'var(--primary)',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>Built for the Modern Hustle</span>
                    </div>

                    <h1 style={{ 
                        fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', 
                        fontWeight: 900, 
                        lineHeight: 1.1, 
                        letterSpacing: '-0.05em',
                        marginBottom: '32px',
                        minHeight: '2.4em' /* Balanced for all phrases */
                    }}>
                        Stop guessing.<br />
                        <span style={{ color: 'var(--primary)', position: 'relative' }}>
                            <Typewriter phrases={[
                                "Start growing.",
                                "Recover your debts.",
                                "Track your cashflow.",
                                "Master your business."
                            ]} />
                        </span>
                    </h1>

                    <p style={{ 
                        fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', 
                        color: 'var(--text-muted)', 
                        maxWidth: '850px', 
                        margin: '0 auto 56px',
                        lineHeight: 1.45,
                        fontWeight: 500,
                        opacity: 0.9
                    }}>
                        You’re working too hard to not know exactly where your money is going. 
                        Record sales, track debtors, and send professional invoices—all inside 
                        the WhatsApp you already use. No stress, just business.
                    </p>

                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <motion.button 
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/auth/register')} 
                            className="btn-primary" 
                            style={{ padding: '24px 56px', fontSize: '1.25rem', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(76, 29, 149, 0.3)' }}
                        >
                            Get Started Free <ArrowRight size={22} />
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => scrollToSection('how-it-works')} 
                            className="btn-secondary" 
                            style={{ padding: '24px 56px', fontSize: '1.25rem', borderRadius: '24px' }}
                        >
                            Explore Platform
                        </motion.button>
                    </div>
                </motion.div>
            </header>

            {/* Bento Grid - Redefined Features */}
            <section id="features" style={{ padding: '40px 0 120px' }}>
                <div className="bento-grid">
                    <motion.div 
                        className="bento-item bento-1"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ background: '#F8FAFC', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', border: '1px solid #E2E8F0' }}>
                                <LayoutDashboard color="var(--primary)" size={32} />
                            </div>
                            <h3 style={{ fontSize: '2.2rem', fontWeight: 950, marginBottom: '16px', letterSpacing: '-0.03em' }}>Command Center</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: 1.6, fontWeight: 500 }}>
                                A powerful, bird's-eye view of your business. Real-time analytics, debt monitoring, and verifiable financial history—built for executive decision-making.
                            </p>
                            <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', gap: '12px' }}>
                                <span style={{ padding: '10px 20px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>Executive Dashboard</span>
                                <span style={{ padding: '10px 20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 800, color: '#10B981' }}>Live Sync</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div 
                        className="bento-item bento-2"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white' }}
                    >
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>Verifiable Trust Score</h4>
                            <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 500 }}>Build a digital business reputation that unlocks credit and global opportunities.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.15 }}>
                            <ShieldCheck size={200} />
                        </div>
                    </motion.div>

                    <motion.div 
                        className="bento-item bento-3"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <CreditCard color="#F59E0B" size={32} style={{ marginBottom: '16px' }} />
                        <h4 style={{ fontSize: '1.3rem', fontWeight: 900 }}>Fast Payments</h4>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>Premium invoices designed to get you paid 3x faster.</p>
                    </motion.div>

                    <motion.div 
                        className="bento-item bento-4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <Smartphone color="var(--primary)" size={32} style={{ marginBottom: '16px' }} />
                        <h4 style={{ fontSize: '1.3rem', fontWeight: 900 }}>WhatsApp AI</h4>
                        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>The simplicity of chat meets the power of a pro accounting firm.</p>
                    </motion.div>

                    <motion.div 
                        className="bento-item bento-5"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '1.6rem', fontWeight: 950, marginBottom: '10px' }}>Built for Scale</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>From one stall to ten locations. Kredibly grows as you grow.</p>
                            </div>
                            <div style={{ background: 'var(--background)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                <TrendingUp size={36} color="#10B981" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Simulated WhatsApp Flow - Clean Minimalist Redesign */}
            <section id="how-it-works" style={{ padding: '120px 20px', background: 'white' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '100px' }}>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '24px' }}>Business at the speed of thought.</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.3rem', fontWeight: 500, maxWidth: '700px', margin: '0 auto' }}>Leverage Kreddy AI to manage your commerce without ever leaving WhatsApp.</p>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                        gap: '80px', 
                        alignItems: 'center' 
                    }}>
                        {/* The Mockup */}
                        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <div className="phone-mockup" style={{
                                width: '100%',
                                maxWidth: '360px',
                                height: 'clamp(580px, 80vh, 680px)',
                                background: '#111',
                                borderRadius: '48px',
                                padding: '12px',
                                position: 'relative',
                                boxShadow: '0 60px 120px -20px rgba(0,0,0,0.15)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                overflow: 'hidden'
                            }}>
                                <div style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    background: '#E5DDD5', 
                                    borderRadius: '40px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {/* Chat Header */}
                                    <div style={{ background: '#075E54', padding: '40px 20px 16px', color: 'white', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ 
                                            width: '36px', 
                                            height: '36px', 
                                            borderRadius: '50%', 
                                            background: 'white', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            fontWeight: 900,
                                            color: '#075E54',
                                            fontSize: '1.2rem'
                                        }}>
                                            K
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.95rem', fontWeight: 900 }}>Kreddy AI</p>
                                            <p style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600 }}>Business Assistant</p>
                                        </div>
                                    </div>
                                    
                                    {/* Chat Messages */}
                                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 }}
                                            style={{ alignSelf: 'flex-end', background: '#DCF8C6', padding: '12px 16px', borderRadius: '16px 0 16px 16px', fontSize: '0.85rem', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontWeight: 500 }}
                                        >
                                            Hi Kreddy, sold 3 designer bags to Sarah for ₦120,000. She's paid ₦50k.
                                        </motion.div>

                                        <motion.div 
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 1.5 }}
                                            style={{ alignSelf: 'flex-start', background: 'white', padding: '16px', borderRadius: '0 16px 16px 16px', fontSize: '0.85rem', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                                        >
                                            <p style={{ color: 'var(--primary)', fontWeight: 950, fontSize: '0.75rem', marginBottom: '6px' }}>Kreddy AI</p>
                                            <p style={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                Sale recorded! ✅<br /><br />
                                                📁 <b>Order #KR-829</b><br />
                                                💰 Total: ₦120,000<br />
                                                📥 Received: ₦50,000<br />
                                                ⏳ Balance: ₦70,000<br /><br />
                                                Premium invoice sent to Sarah. 🚀
                                            </p>
                                        </motion.div>
                                    </div>

                                    {/* Chat Input Placeholder */}
                                    <div style={{ padding: '16px', background: '#f0f0f0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <div style={{ flex: 1, height: '40px', background: 'white', borderRadius: '20px' }}></div>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#128C7E' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature Highlights */}
                        <div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
                                {[
                                    { 
                                        icon: MessageCircle, 
                                        title: "One Chat, One Record.", 
                                        desc: "Talk to Kreddy like you would a human partner. It understands inventory, debt, and payments without forcing you into complex apps." 
                                    },
                                    { 
                                        icon: Zap, 
                                        title: "World-Class Impressions", 
                                        desc: "Every transaction generates a professional digital portal for your clients, building trust and accelerating your growth." 
                                    },
                                    { 
                                        icon: BarChart3, 
                                        title: "The Kredibly Score", 
                                        desc: "Every chat contributes to your financial identity. Turn your daily hustle into a bank-ready financial report." 
                                    }
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '28px' }}>
                                        <div style={{ 
                                            minWidth: '64px', 
                                            height: '64px', 
                                            borderRadius: '20px', 
                                            background: '#F8FAFC', 
                                            border: '1px solid #E2E8F0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <item.icon color="var(--primary)" size={28} />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '10px' }}>{item.title}</h4>
                                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 500, fontSize: '1.05rem' }}>{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof - Executive Marquee */}
            <section style={{ padding: '120px 0', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.03em' }}>Trusted by the Continent's Rising Elite</h2>
                </div>
                
                <div className="marquee-container" style={{ 
                    position: 'relative',
                    width: '100vw',
                    left: '50%',
                    right: '50%',
                    marginLeft: '-50vw',
                    marginRight: '-50vw',
                    maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
                }}>
                    <div className="marquee-track" style={{ display: 'flex', gap: '32px', width: 'max-content' }}>
                        {[...Array(2)].map((_, i) => (
                            <div key={i} style={{ display: 'flex', gap: '32px' }}>
                                {[
                                    { name: "John Adenuga", role: "Luxe Fashion Vendor", text: "Kredibly isn't just an app; it's my silent partner. It brings a level of structure my business was missing for years." },
                                    { name: "Sarah Chinedu", role: "Culinary Entrepreneur", text: "The professional invoices changed how my corporate clients see me. I'm now winning 5x bigger contracts." },
                                    { name: "Mike Okoro", role: "Auto Parts Distributor", text: "I can monitor my inventory from transit across borders. Oga Mode is a game changer for multi-location scale." },
                                    { name: "Adeola Williams", role: "Signature Tech Store", text: "Debt recovery used to be my biggest headache. Kreddy handles the follow-ups while I focus on strategy." }
                                ].map((review, j) => (
                                    <div key={j} style={{ 
                                        padding: '40px', 
                                        minWidth: '400px', 
                                        background: 'white',
                                        borderRadius: '32px',
                                        border: '1px solid rgba(0,0,0,0.04)',
                                        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.05)'
                                    }}>
                                        <p style={{ fontWeight: 500, fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '32px', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{review.text}"</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary)' }}>
                                                {review.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 900, fontSize: '1.1rem' }}>{review.name}</p>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{review.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Premium CTA */}
            <section style={{ padding: '120px 20px' }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
                        padding: '140px 40px',
                        borderRadius: '60px',
                        color: 'white',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 60px 120px -30px rgba(15, 23, 42, 0.4)'
                    }}
                >
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h2 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.9, marginBottom: '40px' }}>
                            Scale your business.<br />
                            Expand your vision.
                        </h2>
                        <p style={{ fontSize: '1.35rem', opacity: 0.8, maxWidth: '650px', margin: '0 auto 64px', fontWeight: 500, lineHeight: 1.5 }}>
                            The infrastructure for the next generation of African merchants is live. Start building your legacy today.
                        </p>
                        <motion.button 
                            whileHover={{ scale: 1.05, translateY: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/auth/register')}
                            className="btn-secondary" 
                            style={{ 
                                background: 'white', 
                                color: '#1E1B4B', 
                                border: 'none', 
                                padding: '28px 80px', 
                                borderRadius: '24px', 
                                fontSize: '1.5rem',
                                fontWeight: 900,
                                boxShadow: '0 20px 40px rgba(255,255,255,0.1)'
                            }}
                        >
                            Create Your Free Account
                        </motion.button>
                        <p style={{ marginTop: '40px', fontSize: '1rem', opacity: 0.6, fontWeight: 500 }}>Global infrastructure. Zero setup fees.</p>
                    </div>
                </motion.div>
            </section>

            <PublicFooter />

            <style>{`
                .text-reveal {
                    animation: text-shine 3s linear infinite alternate;
                }
                @keyframes text-shine {
                    from { background-position: 0% 50%; }
                    to { background-position: 100% 50%; }
                }
                .marquee-track {
                    animation: marquee-scroll 60s linear infinite;
                }
                @keyframes marquee-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(calc(-50% - 16px)); }
                }
                @media (max-width: 768px) {
                    header { padding-top: 140px !important; }
                    .bento-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;