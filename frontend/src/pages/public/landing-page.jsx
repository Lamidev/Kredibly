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
    TrendingUp,
    FileText,
    Lock
} from "lucide-react";
import { motion } from "framer-motion";
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
            
            if (!isDeleting) {
                // Typing logic
                if (displayText.length < currentPhrase.length) {
                    setDisplayText(currentPhrase.substring(0, displayText.length + 1));
                    setTypingSpeed(150); // Slower, more readable typing
                } else {
                    // Longer pause to let people read
                    setIsDeleting(true);
                    setTypingSpeed(2000); 
                }
            } else {
                // Deleting logic
                if (displayText.length > 0) {
                    setDisplayText(currentPhrase.substring(0, displayText.length - 1));
                    setTypingSpeed(50); // Faster deleting
                } else {
                    // Switch to next word
                    setIsDeleting(false);
                    setIndex((prev) => prev + 1);
                    setTypingSpeed(400); // Short pause before typing next
                }
            }
        };

        const timer = setTimeout(handleType, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayText, isDeleting, index, phrases, typingSpeed]);

    return (
        <span style={{ display: 'inline-block', minWidth: '1px', whiteSpace: 'nowrap' }}>
            {displayText}
            <span style={{ 
                color: 'var(--primary)', 
                marginLeft: '2px',
                animation: 'blink 1s infinite',
                fontWeight: 600
            }}>|</span>
        </span>
    );
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
                padding: 'clamp(120px, 15vh, 180px) 20px 80px', // Reduced padding for mobile
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
                    style={{ position: 'relative' }}
                >
                    <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '40px',
                        background: 'rgba(76, 29, 149, 0.05)',
                        padding: '10px 24px',
                        borderRadius: '100px',
                        border: '1px solid rgba(76, 29, 149, 0.1)',
                        whiteSpace: 'nowrap'
                    }}>
                        <Sparkles size={16} color="var(--primary)" />
                        <span style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 700, 
                            color: 'var(--primary)',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>Built for the Modern Enterprise</span>
                    </div>

                    <h1 style={{ 
                        fontSize: 'clamp(2rem, 6vw, 5rem)', // Reduced min size for mobile
                        fontWeight: 950, 
                        lineHeight: 1.1, 
                        letterSpacing: '-0.05em',
                        marginBottom: '40px',
                        textAlign: 'center',
                        marginTop: '20px'
                    }}>
                        <span style={{ display: 'block', marginBottom: '10px' }}>Stop guessing.</span>
                        <div style={{ 
                            color: 'var(--primary)', 
                            position: 'relative', 
                            minHeight: '1.2em', // Use minHeight instead of fixed height
                            display: 'flex', 
                            flexDirection: 'column', // Stack if needed
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '100%' 
                        }}>
                             <Typewriter phrases={[
                                "Track money outside.",
                                "Get paid 3x faster.",
                                "Record sales smarter.",
                                "Stay in control."
                            ]} />
                        </div>
                    </h1>

                    <p style={{ 
                        fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', 
                        color: 'var(--text-muted)', 
                        maxWidth: '850px', 
                        margin: '0 auto clamp(32px, 5vw, 56px)', // Reduced margin-bottom
                        lineHeight: 1.45,
                        fontWeight: 500,
                        opacity: 0.9
                    }}>
                        From local commerce to global scale. Kredibly is the intelligent ledger that helps you 
                        automate sales, track what you're owed, and monitor operations, all inside the 
                        WhatsApp you already use.
                    </p>

                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <motion.button 
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/auth/login')} 
                            className="btn-primary" 
                            style={{ padding: '24px 56px', fontSize: '1.25rem', borderRadius: '24px' }}
                        >
                            Get started <ArrowRight size={22} />
                        </motion.button>
                        <motion.button 
                            whileHover={{ scale: 1.02, translateY: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => scrollToSection('how-it-works')} 
                            className="btn-secondary" 
                            style={{ padding: '24px 56px', fontSize: '1.25rem', borderRadius: '24px', background: 'white', color: 'black' }}
                        >
                            Explore Platform
                        </motion.button>
                    </div>
                </motion.div>
            </header>

            {/* Bento Grid - Redefined Features */}
            <section id="features" style={{ padding: '40px 0 80px' }}> {/* Reduced bottom padding */}
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
                            <h3 style={{ fontSize: '2.2rem', fontWeight: 950, marginBottom: '16px', letterSpacing: '-0.03em' }}>Business Overview</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: 1.6, fontWeight: 500 }}>
                                A powerful, bird's-eye view of your business. Real-time analytics, tracking money outside, and verifiable financial history—built for executive decision-making.
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
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>Digital Reputation</h4>
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
                        <p style={{ fontSize: '0.95rem', color: '#1E293B', fontWeight: 600 }}>Premium invoices designed to get you paid 3x faster.</p>
                    </motion.div>

                    <motion.div 
                        className="bento-item bento-4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <Smartphone color="var(--primary)" size={32} style={{ marginBottom: '16px' }} />
                        <h4 style={{ fontSize: '1.3rem', fontWeight: 900 }}>WhatsApp AI</h4>
                        <p style={{ fontSize: '0.95rem', color: '#1E293B', fontWeight: 600 }}>The simplicity of chat meets the power of a pro accounting firm.</p>
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
            <section id="how-it-works" className="adaptive-section" style={{ padding: '120px 20px', background: 'white' }}>
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
                                            Hi Kreddy, sold 3 designer bags to Sarah for ₦120,000. She paid ₦50k to balance up in two weeks.
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
                                                🔔 <b>Reminder set: 14 days</b><br /><br />
                                                Premium invoice sent to Sarah.
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
                                        desc: "Talk to Kreddy like you would a human partner. It understands inventory, owed money, and payments without forcing you into complex apps." 
                                    },
                                    { 
                                        icon: Zap, 
                                        title: "World-Class Impressions", 
                                        desc: "Every transaction generates a professional digital portal for your clients, building trust and accelerating your growth." 
                                    },
                            { icon: Users, t: "Staff Monitoring", d: "Track what your staff are doing from anywhere. Protect your money." },
                            { icon: FileText, t: "Professional Invoices", d: "Send beautiful receipts to customers via WhatsApp. Look like a big brand." },
                            { icon: Lock, t: "Collect Money Faster", d: "Friendly automatic reminders that help you get paid without any stress." },
                            { icon: TrendingUp, t: "Sales Reports", d: "See how your business is growing daily with simple, clear reports." }
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
                                            <h4 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '10px' }}>{item.title || item.t}</h4>
                                            <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 500, fontSize: '1.05rem' }}>{item.desc || item.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ultra-Premium Mobile Ecosystem Preview */}
            <section className="adaptive-section" style={{ 
                padding: '160px 0', // Changed padding for better overflow management
                background: '#020617', 
                color: 'white',
                position: 'relative',
                overflow: 'visible' // Allow floating elements to spill out slightly
            }}>
                {/* Background Ambient Glow */}
                <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)', filter: 'blur(120px)', zIndex: 0 }} />

                <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, padding: '0 40px' }}>
                    <div className="mobile-reverse" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px', alignItems: 'center' }}>
                        
                        {/* 3D-Motion iPhone Mockup Section */}
                        <div style={{ perspective: '2000px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                            <motion.div 
                                style={{ position: 'relative', width: '100%', maxWidth: '300px' }}
                                initial={{ rotateY: -15, rotateX: 10, y: 30, opacity: 0 }}
                                whileInView={{ rotateY: 0, rotateX: 0, y: 0, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {/* Floating Feature Popups - Responsive offsets */}
                                <motion.div 
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ 
                                        position: 'absolute', 
                                        top: '20%', 
                                        left: '-80px', 
                                        zIndex: 50, 
                                        background: 'rgba(255,255,255,0.05)', 
                                        backdropFilter: 'blur(20px)', 
                                        padding: '16px 20px', 
                                        borderRadius: '24px', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px',
                                        whiteSpace: 'nowrap'
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
                                        right: '-80px', 
                                        zIndex: 50, 
                                        background: 'rgba(255,255,255,0.05)', 
                                        backdropFilter: 'blur(20px)', 
                                        padding: '16px 20px', 
                                        borderRadius: '24px', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px',
                                        whiteSpace: 'nowrap'
                                    }}
                                    className="floating-popup-right"
                                >
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} color="white" /></div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, fontWeight: 700 }}>Staff Activity</p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 900 }}>New Sale Recorded</p>
                                    </div>
                                </motion.div>

                                {/* Modern iPhone Chassis */}
                                <div style={{ 
                                    width: '100%', 
                                    height: '620px', 
                                    background: '#1E293B', 
                                    borderRadius: '54px', 
                                    padding: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
                                    position: 'relative'
                                }}>
                                    {/* Inner Screen */}
                                    <div style={{ 
                                        width: '100%', 
                                        height: '100%', 
                                        background: '#020617', 
                                        borderRadius: '44px',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}>
                                        {/* Dynamic Island */}
                                        <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '90px', height: '28px', background: '#000', borderRadius: '20px', zIndex: 5 }} />
                                        
                                        {/* Mock App Content */}
                                        <div style={{ padding: '48px 24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), #F472B6)' }} />
                                                <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: '#1E293B' }} />
                                            </div>
                                            <div style={{ height: '160px', borderRadius: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', marginBottom: '24px' }}>
                                                <p style={{ margin: 0, opacity: 0.5, fontSize: '0.7rem', fontWeight: 800 }}>BUSINESS REVENUE</p>
                                                <p style={{ margin: '8px 0', fontSize: '2rem', fontWeight: 950 }}>₦4.82M</p>
                                                <div style={{ width: '40px', height: '4px', background: '#10B981', borderRadius: '2px' }} />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {[1,2,3].map(i => (
                                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)' }} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ width: '70%', height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', marginBottom: '6px' }} />
                                                            <div style={{ width: '40%', height: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Premium "Coming Q3" Shield - Moved inside and lowered Z-index */}
                                        <div style={{ 
                                            position: 'absolute', 
                                            inset: 0, 
                                            background: 'rgba(2, 6, 23, 0.45)', // Slightly lighter
                                            backdropFilter: 'blur(8px)', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            zIndex: 2 // lowered from 20
                                        }}>
                                            <div style={{ 
                                                padding: '12px 28px', 
                                                background: 'rgba(255,255,255,0.1)', 
                                                borderRadius: '100px', 
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                color: 'white',
                                                fontSize: '0.85rem',
                                                fontWeight: 900,
                                                letterSpacing: '0.1em',
                                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                                            }}>
                                                COMING Q3 2026
                                            </div>
                                            <p style={{ marginTop: '16px', fontSize: '0.75rem', fontWeight: 700, opacity: 0.5 }}>OS NATIVE EXPERIENCE</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Text and Store Silhouettes */}
                        <div className="mobile-ecosystem-content">
                            <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '100px', marginBottom: '32px', color: '#A78BFA', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                                THE ECOSYSTEM EXPANSION
                            </div>
                            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '40px' }}>
                                Pure Native. <br />
                                <span style={{ color: 'var(--primary)' }}>Zero Compromise.</span>
                            </h2>
                            <p style={{ fontSize: '1.25rem', color: '#CBD5E1', fontWeight: 500, lineHeight: 1.6, marginBottom: '48px', maxWidth: '600px' }}>
                                We're not just building an app. We're launching the full Kredibly ecosystem for **iOS and Android**. Fast, biometrically secure, and fully offline-capable.
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '64px' }}>
                                {[
                                    { t: "iOS & Android First", d: "Tailored native experiences for the mobile entrepreneur." },
                                    { t: "Deep Biometrics", d: "FaceID/Fingerprint protected ledgers." },
                                    { t: "Real-time Alerts", d: "Instant push notifications when customers view invoices." },
                                    { t: "Zero Connection", d: "Fully functional offline. Auto-syncs when you're back." }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '8px', color: 'white' }}>{item.t}</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>{item.d}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Store Silhouettes - Premium Glow */}
                            <div className="mobile-ecosystem-buttons" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
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
                            <p style={{ marginTop: '32px', fontSize: '0.9rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.15em' }}>GET PRIORITY ACCESS ON LAUNCH DAY</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Social Proof - Executive Marquee */}
            <section className="adaptive-section" style={{ padding: '140px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px', padding: '0 20px' }}>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 950, letterSpacing: '-0.03em' }}>From emerging vendors to established enterprises, Kredibly scales with you.
</h2>
                </div>
                
                <div className="marquee-container" style={{ 
                    position: 'relative',
                    width: '100%',
                    overflow: 'hidden',
                    maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
                }}>
                    <div className="marquee-track" style={{ display: 'flex', gap: '24px', width: 'max-content' }}>
                        {[...Array(2)].map((_, i) => (
                            <div key={i} style={{ display: 'flex', gap: '24px' }}>
                                {[
                                    { name: "John Adenuga", role: "Luxe Fashion Vendor", text: "Kredibly isn't just an app; it's my silent partner. It brings a level of structure my business was missing." },
                                    { name: "Sarah Chinedu", role: "Culinary Entrepreneur", text: "The professional invoices changed how my clients see me. I'm now winning 5x bigger contracts." },
                                    { name: "Mike Okoro", role: "Auto Parts Distributor", text: "I monitor inventory from transit across borders. Oga Mode is a game changer for scale." },
                                    { name: "Adeola Williams", role: "Signature Tech Store", text: "Collecting payments used to be my biggest headache. Kreddy handles follow-ups while I focus on strategy." }
                                ].map((review, j) => (
                                    <div key={j} className="testimonial-card" style={{ 
                                        padding: '32px', 
                                        minWidth: '320px',
                                        maxWidth: '350px',
                                        background: 'white',
                                        borderRadius: '28px',
                                        border: '1px solid rgba(0,0,0,0.04)',
                                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between'
                                    }}>
                                        <p style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.6, marginBottom: '24px', color: '#1E293B', fontStyle: 'italic' }}>"{review.text}"</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary)', fontSize: '0.9rem' }}>
                                                {review.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 900, fontSize: '0.95rem', margin: 0 }}>{review.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{review.role}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Premium Pricing Section */}
            <section id="pricing" className="adaptive-section" style={{ padding: '120px 24px', background: 'white' }}> {/* Reduced padding */}
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <div style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>TRANSPARENT PRICING</div>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1 }}>Start free. Scale endlessly.</h2>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '20px', maxWidth: '600px', margin: '20px auto 0' }}>Join today and get <span style={{ color: 'var(--text)', fontWeight: 700 }}>7 Days of Oga Plan for FREE.</span><br />No credit card required to start.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'center' }}>
                        {/* Free Tier */}
                        <div className="glass-card" style={{ padding: '48px', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>Hustler</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontWeight: 500 }}>The Beginner's Tool</p>
                            <div style={{ fontSize: '3rem', fontWeight: 950, marginBottom: '16px', letterSpacing: '-0.05em' }}>Free</div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '40px' }}>Forever free for up to 20 sales records/mo.</p>
                            <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Start Hustling</button>
                            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    "Basic AI Assistant",
                                    "20 Sales Records / month",
                                    "Basic WhatsApp Hub",
                                    "Standard Debt Tracking"
                                ].map((feat, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500, color: '#334155' }}>
                                        <CheckCheck size={18} color="var(--primary)" /> {feat}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pro Tier - highlighted */}
                        <div className="pricing-card highlight-card-landing" style={{ padding: '48px', borderRadius: '32px', background: 'var(--text)', color: 'white', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', zIndex: 2 }}>
                            <div style={{ position: 'absolute', top: '32px', right: '32px', background: 'var(--primary)', padding: '6px 16px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>POPULAR</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>Oga Plan</h3>
                            <p style={{ opacity: 0.7, marginBottom: '32px', fontWeight: 500 }}>Your business partner that never forgets.</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '40px' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-0.05em' }}>₦7,000</span>
                                <span style={{ opacity: 0.7 }}>/mo</span>
                            </div>
                            <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'white !important', color: 'black !important' }}>Become an Oga</button>
                            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    "Super Smart AI",
                                    "2,000 WhatsApp Msgs / mo",
                                    "Monitor 2 Staff Members",
                                    "Unlimited Smart Recording",
                                    "Branded WhatsApp Invoices"
                                ].map((feat, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500 }}>
                                        <CheckCheck size={18} color="#4ade80" /> {feat}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Enterprise Tier */}
                        <div className="glass-card" style={{ padding: '48px', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>Chairman</h3>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontWeight: 500 }}>Run multiple shops without stress.</p>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '40px' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-0.05em' }}>₦30,000</span>
                                <span style={{ opacity: 0.7 }}>/mo</span>
                            </div>
                            <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Lead Your Empire</button>
                            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    "Everything in Oga Plan",
                                    "10,000 WhatsApp Msgs / mo",
                                    "Voice Note Recording",
                                    "Multi-Staff / Multi-Shop",
                                    "Weekly Business Insights"
                                ].map((feat, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500, color: '#334155' }}>
                                        <CheckCheck size={18} color="var(--primary)" /> {feat}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Map Section */}
            <section className="adaptive-section" style={{ padding: '120px 20px', background: 'var(--background)' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>THE MISSION MAP</div>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1 }}>Our journey & commitment.</h2>
                        <p style={{ fontSize: '1.25rem', color: '#334155', marginTop: '20px', maxWidth: '600px', margin: '20px auto 0', fontWeight: 600 }}>Transparent milestones from a simple idea to a global financial ecosystem.</p>
                    </div>

                    <div style={{ position: 'relative', paddingLeft: '40px' }}>
                        {/* Vertical Line */}
                        <div style={{ position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #E2E8F0 0%, var(--primary) 30%, var(--primary) 70%, #E2E8F0 100%)' }} />

                        {[
                            { date: "JULY '25", title: "The Genesis", desc: "Concept & Research Phase. Identifying the 'Trust Gap' in African commerce.", status: "completed" },
                            { date: "SEPT '25", title: "Strategic Architecture", desc: "Core blueprinting of the Kredibly ledger and AI interface flow.", status: "completed" },
                            { date: "DEC '25", title: "Kreddy AI Core", desc: "Intelligence engine development. Teaching Kreddy to understand merchant slang and complex debts.", status: "completed" },
                            { date: "JAN '26 - PRESENT", title: "Founding Member Waitlist", desc: "Onboarding our first 1,000 pioneers. Early access rewards and lifetime status for active participants.", status: "active" },
                            { date: "FEBRUARY", title: "Premium Ledger UX", desc: "Rollout of smart telemetry, professional document generators, and cross-device syncing.", status: "building" },
                            { date: "Q2 2026", title: "Global Marketplace Launch", desc: "Opening the ecosystem for public merchant registration and global transactions.", status: "future" },
                            { date: "Q3 2026", title: "Kredibly Mobile (Native)", desc: "The full ledger in your pocket. Offline-first, biometric security, and instant push intelligence.", status: "future" }
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
                                <div style={{ 
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
                                    {m.status === 'active' && <div className="pulse-dot-landing" />}
                                </div>

                                <div style={{ 
                                    opacity: m.status === 'completed' ? 0.7 : 1
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: m.status === 'active' ? 'var(--primary)' : 'var(--text-muted)', letterSpacing: '0.1em' }}>{m.date}</span>
                                        {m.status === 'active' && (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 900, background: 'rgba(76, 29, 149, 0.1)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '100px' }}>LIVE NOW</span>
                                        )}
                                    </div>
                                    <h4 style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--text)', marginBottom: '10px' }}>{m.title}</h4>
                                    <p style={{ color: '#334155', fontWeight: 600, lineHeight: 1.6, maxWidth: '650px', margin: 0, fontSize: '1.05rem' }}>{m.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Premium CTA */}
            <section className="adaptive-section" style={{ padding: '80px 20px' }}>
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
                        <h2 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.9, marginBottom: '40px', color: 'white' }}>
                            The smart assistant<br />
                            for your business.
                        </h2>
                        <p style={{ fontSize: '1.35rem', opacity: 0.8, maxWidth: '650px', margin: '0 auto 64px', fontWeight: 500, lineHeight: 1.5, color: 'white' }}>
                            No more notebooks. No more confusing math. We help you track sales and collect your money inside the WhatsApp you already use.
                        </p>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px 40px', borderRadius: '20px', display: 'inline-block', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Product Launching Soon</p>
                            </div>
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
                .typewriter-cursor {
                    animation: blink 0.7s infinite;
                    margin-left: 2px;
                    color: var(--primary);
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                    .adaptive-section {
                        padding-top: 60px !important;
                        padding-bottom: 60px !important;
                    }
                    header { padding-top: 140px !important; }
                    .bento-grid { grid-template-columns: 1fr !important; }
                    .marquee-track { animation-duration: 40s !important; }
                    .testimonial-card { min-width: 280px !important; padding: 24px !important; }
                    .pricing-card { padding: 32px 24px !important; }
                    .highlight-card-landing { transform: none !important; margin: 0 !important; }
                    .mobile-reverse { display: flex !important; flex-direction: column !important; gap: 40px !important; }
                    .mobile-reverse > div:first-child { order: 2 !important; width: 100% !important; }
                    .mobile-reverse > div:last-child { order: 1 !important; width: 100% !important; }
                    .mobile-ecosystem-content { text-align: center !important; }
                    .mobile-ecosystem-buttons { 
                        justify-content: center !important; 
                        flex-direction: column !important;
                        align-items: stretch !important;
                        gap: 12px !important;
                    }
                }
                @media (max-width: 640px) {
                    .premium-cta-section {
                        padding: 40px 20px !important;
                    }
                    .premium-cta-section > div {
                        padding: 60px 24px !important;
                        border-radius: 40px !important;
                    }
                    footer {
                        padding: 40px 24px !important;
                    }
                    .floating-popup-left {
                        left: -20px !important;
                    }
                    .floating-popup-right {
                        right: -20px !important;
                    }
                    .mobile-ecosystem-grid {
                        gap: 20px !important;
                    }
                }
                .pulse-dot-landing {
                    position: absolute;
                    inset: -6px;
                    border-radius: 50%;
                    background: var(--primary);
                    opacity: 0.3;
                    animation: pulse-ring-landing 2s infinite;
                }
                @keyframes pulse-ring-landing {
                    0% { transform: scale(1); opacity: 0.3; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                .highlight-card-landing {
                    transform: scale(1.05);
                }
            `}</style>
        </div>
    );
};

export default LandingPage;