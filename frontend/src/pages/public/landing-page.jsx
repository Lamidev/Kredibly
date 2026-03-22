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
            <span className="premium-gradient">{displayText}</span>
            <span style={{ 
                color: '#F472B6', 
                marginLeft: '2px',
                animation: 'blink 1s infinite',
                fontWeight: 500
            }}>|</span>
        </span>
    );
};

const LandingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'yearly'

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

            {/* 1. Hero Section with Premium Purple Mesh */}
            <section style={{ 
                position: 'relative', 
                backgroundColor: 'white', 
                overflow: 'hidden',
                borderBottom: '1px solid #F1F5F9'
            }}>
                {/* Unique Purple Mesh Background */}
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

                {/* Floating Mesh Circles */}
                <motion.div 
                    animate={{ 
                        x: [0, 50, 0], 
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1]
                    }} 
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute',
                        top: '10%',
                        left: '10%',
                        width: '400px',
                        height: '400px',
                        background: 'radial-gradient(circle, rgba(76, 29, 149, 0.06) 0%, transparent 75%)',
                        filter: 'blur(60px)',
                        borderRadius: '50%',
                        zIndex: 1
                    }} 
                />
                
                <motion.div 
                    animate={{ 
                        x: [0, -40, 0], 
                        y: [0, 60, 0],
                        scale: [1, 1.2, 1]
                    }} 
                    transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    style={{
                        position: 'absolute',
                        bottom: '20%',
                        right: '5%',
                        width: '500px',
                        height: '500px',
                        background: 'radial-gradient(circle, rgba(76, 29, 149, 0.03) 0%, transparent 70%)',
                        filter: 'blur(80px)',
                        borderRadius: '50%',
                        zIndex: 1
                    }} 
                />

                <header style={{
                    padding: 'clamp(100px, 12vw, 140px) 24px clamp(2rem, 8vw, 100px)',
                    maxWidth: '1400px',
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
                        gap: '10px',
                        marginBottom: '24px',
                        background: 'white',
                        padding: '10px 24px',
                        borderRadius: '100px',
                        border: '1px solid rgba(76, 29, 149, 0.15)',
                        boxShadow: '0 8px 16px rgba(76, 29, 149, 0.08)'
                    }}>
                        <span style={{ 
                            fontSize: 'clamp(0.6rem, 2.5vw, 0.85rem)',
                            fontWeight: 800, 
                            color: 'var(--primary)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap'
                        }}>The Operating System for African Commerce</span>
                    </div>

                    <h1 style={{ 
                        fontSize: 'clamp(2.1rem, 8vw, 5.5rem)',
                        fontWeight: 900, 
                        lineHeight: 1, 
                        letterSpacing: '-0.04em',
                        marginBottom: '32px'
                    }}>
                        <span style={{ display: 'block', marginBottom: '16px', whiteSpace: 'nowrap' }}>Stop losing money.</span>
                        <div style={{ 
                            color: 'var(--primary)', 
                            position: 'relative', 
                            minHeight: '1.2em',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '100%' 
                        }}>
                             <Typewriter phrases={[
                                "Get paid 3x faster.",
                                "Delegate your day.",
                                "Business on Autopilot."
                            ]} />
                        </div>
                    </h1>

                    <p style={{ 
                        fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', 
                        color: 'var(--text-muted)', 
                        maxWidth: '850px', 
                        margin: '0 auto 48px',
                        lineHeight: 1.6,
                        fontWeight: 400,
                        opacity: 0.8
                    }}>
                        From local commerce to global scale. Kredibly is the intelligent receivables platform that helps you 
                        automate sales, track what you're owed, and monitor operations—all inside WhatsApp.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
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

            </section>

            {/* 2. Bento Grid Section */}
            <section id="features" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px' }}>
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 1 }}
                    className="bento-grid" 
                    style={{ maxWidth: '1400px', margin: '0 auto' }}
                >
                    <motion.div className="bento-item bento-1" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ background: '#F8FAFC', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', border: '1px solid #E2E8F0' }}>
                                <LayoutDashboard color="var(--primary)" size={32} />
                            </div>
                            <h3 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-0.03em' }}>Business Overview</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: 1.6, fontWeight: 500 }}>
                                A powerful, bird's-eye view of your business. Real-time analytics, tracking money outside, and verifiable financial history, built for executive decision-making.
                            </p>
                            <div style={{ marginTop: 'auto', paddingTop: '40px', display: 'flex', gap: '12px' }}>
                                <span style={{ padding: '10px 20px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>Executive Dashboard</span>
                                <span style={{ padding: '10px 20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>Live Sync</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div className="bento-item bento-2" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.1 }} style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>Digital Reputation</h4>
                            <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 500 }}>Build a digital business reputation that unlocks credit and global opportunities.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.15 }}><ShieldCheck size={200} /></div>
                    </motion.div>

                    <motion.div className="bento-item bento-3" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: false, amount: 0.1 }}>
                        <CreditCard color="#F59E0B" size={32} style={{ marginBottom: '16px' }} />
                        <h4 style={{ fontSize: '1.3rem', fontWeight: 900 }}>Fast Payments</h4>
                        <p style={{ fontSize: '0.95rem', color: '#1E293B', fontWeight: 600 }}>Professional invoices designed to get you paid 3x faster and build trust.</p>
                    </motion.div>

                    <motion.div className="bento-item bento-4" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 0.98 }} viewport={{ once: false, amount: 0.1 }} style={{ border: '2px solid var(--primary-glow)', background: 'rgba(76, 29, 149, 0.02)' }}>
                        <Zap color="var(--primary)" size={32} style={{ marginBottom: '16px' }} />
                        <h4 style={{ fontSize: '1.3rem', fontWeight: 900 }}>Executive Productivity</h4>
                        <p style={{ fontSize: '0.95rem', color: '#1E293B', fontWeight: 600 }}>Delegated power! Set tasks, get morning market briefings, and manage your entire business life via voice notes.</p>
                    </motion.div>

                    <motion.div className="bento-item bento-5" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }}>
                        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '10px' }}>Built for Scale</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>From one stall to ten locations. Infrastructure built to grow with you.</p>
                            </div>
                            <div style={{ background: 'var(--background)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)' }}><TrendingUp size={36} color="#10B981" /></div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* 3. Simulated WhatsApp Flow */}
            <section id="how-it-works" className="adaptive-section" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px', background: 'white' }}>
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1 }}
                    transition={{ duration: 1 }}
                    style={{ maxWidth: '1100px', margin: '0 auto' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '24px' }}>Business at the speed of thought.</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.3rem', fontWeight: 500, maxWidth: '700px', margin: '0 auto' }}>Leverage Kreddy AI to manage your commerce without ever leaving WhatsApp.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'clamp(2rem, 8vw, 5rem)', alignItems: 'center' }}>
                        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <div className="phone-mockup" style={{ width: '100%', maxWidth: '360px', height: '680px', background: '#111', borderRadius: '48px', padding: '12px', position: 'relative', boxShadow: '0 60px 120px -20px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', background: '#E5DDD5', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ background: '#075E54', padding: '40px 20px 16px', color: 'white', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#075E54' }}>K</div>
                                        <div><p style={{ fontSize: '0.95rem', fontWeight: 900 }}>Kreddy AI</p><p style={{ fontSize: '0.65rem', opacity: 0.8 }}>Business Assistant</p></div>
                                    </div>
                                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} style={{ alignSelf: 'flex-end', background: '#DCF8C6', padding: '12px 16px', borderRadius: '16px 0 16px 16px', fontSize: '0.85rem' }}>
                                            Kreddy, Sarah just paid 50k out of 120k for the bags. Remind me to call her next Friday morning to collect the rest. Also, set a reminder for my gym session by 6pm!
                                        </motion.div>
                                        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }} style={{ alignSelf: 'flex-start', background: 'white', padding: '16px', borderRadius: '0 16px 16px 16px', fontSize: '0.85rem' }}>
                                            <p style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', marginBottom: '6px' }}>Kreddy AI</p>
                                            <p style={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                Done, Chairman! 🫡<br /><br />
                                                ✅ <b>Recorded:</b> ₦50k from Sarah James.<br />
                                                ⏳ <b>New Balance:</b> ₦70k.<br /><br />
                                                📋 <b>2 Reminders Set:</b><br />
                                                1. Next Friday (Friday morning) to call Sarah.<br />
                                                2. Today (5:45pm) for your gym session. 💪<br /><br />
                                                <i>I'm on it! Anything else?</i>
                                            </p>
                                        </motion.div>
                                    </div>
                                    <div style={{ padding: '16px', background: '#f0f0f0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <div style={{ flex: 1, height: '40px', background: 'white', borderRadius: '20px' }}></div>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#128C7E' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '56px' }}>
                                    { [
                                        { icon: MessageCircle, title: "One Chat, One Record.", desc: "Talk to Kreddy like you would a human partner. It understands inventory, owed money, and payments without forcing you into complex apps." },
                                        { icon: Sparkles, title: "Your Digital Chief of Staff", desc: "Set gym reminders, meeting alarms, or personal tasks via voice. Kreddy tracks your entire day, not just your sales." },
                                        { icon: Zap, title: "Proactive Follow-ups", desc: "Kreddy doesn't just wait for you. If a debt was due yesterday, he'll ask you about it this morning: 'Did they pay or should I snooze?'" },
                                        { icon: Users, title: "Staff & Team Monitoring", desc: "Track what your sales boys are doing in real-time. Protect your money while you focus on vision." },
                                        { icon: FileText, title: "8 AM Intelligence Briefing", desc: "Start every day with a high-level summary of cash collected, new sales, and top debtors—sent directly to your WhatsApp." },
                                        { icon: Lock, title: "Biometric Security Vault", desc: "Professional-grade security that protects your records and your payouts. Scale with total peace of mind." }
                                    ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '28px' }}>
                                        <div style={{ minWidth: '64px', height: '64px', borderRadius: '20px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon color="var(--primary)" size={28} /></div>
                                        <div><h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: '#0F172A' }}>{item.title}</h4><p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 400, fontSize: '1.05rem' }}>{item.desc}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 4. Ultra-Premium Mobile Ecosystem */}
            <section className="adaptive-section" style={{ padding: 'clamp(4rem, 15vw, 10rem) 24px', background: '#020617', color: 'white', position: 'relative', overflow: 'visible' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: false, amount: 0.1 }} transition={{ duration: 1 }}>
                    <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)', filter: 'blur(120px)' }} />
                    <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, padding: '0 40px' }}>
                        <div className="mobile-reverse" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px', alignItems: 'center' }}>
                            <div style={{ perspective: '2000px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                                <motion.div style={{ position: 'relative', width: '100%', maxWidth: '300px' }} initial={{ rotateY: -15, rotateX: 10, y: 30, opacity: 0 }} whileInView={{ rotateY: 0, rotateX: 0, y: 0, opacity: 1 }} viewport={{ once: false, amount: 0.1 }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>
                                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ position: 'absolute', top: '20%', left: '-40px', zIndex: 50, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', padding: '16px 20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={16} color="white" /></div>
                                        <div><p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, fontWeight: 600 }}>Payment Received</p><p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>₦150,000</p></div>
                                    </motion.div>
                                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }} style={{ position: 'absolute', bottom: '15%', right: '-40px', zIndex: 50, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', padding: '16px 20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} color="white" /></div>
                                        <div><p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, fontWeight: 600 }}>Staff Activity</p><p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>New Sale Recorded</p></div>
                                    </motion.div>
                                    <div style={{ width: '100%', height: '620px', background: '#1E293B', borderRadius: '54px', padding: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)', position: 'relative' }}>
                                        <div style={{ width: '100%', height: '100%', background: '#020617', borderRadius: '44px', overflow: 'hidden', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '90px', height: '28px', background: '#000', borderRadius: '20px', zIndex: 5 }} />
                                            <div style={{ padding: '48px 24px' }}>
                                                <div style={{ height: '160px', borderRadius: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px', marginBottom: '24px' }}>
                                                    <p style={{ margin: 0, opacity: 0.5, fontSize: '0.7rem', fontWeight: 600 }}>BUSINESS REVENUE</p><p style={{ margin: '8px 0', fontSize: '2rem', fontWeight: 800 }}>₦4.82M</p>
                                                    <div style={{ width: '40px', height: '4px', background: '#10B981', borderRadius: '2px' }} />
                                                </div>
                                            </div>
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.45)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                                                <div style={{ padding: '12px 28px', background: 'rgba(255,255,255,0.1)', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.1em' }}>COMING Q3 2026</div>
                                                <p style={{ marginTop: '16px', fontSize: '0.75rem', fontWeight: 700, opacity: 0.5 }}>OS NATIVE EXPERIENCE</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="mobile-ecosystem-content">
                                <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '100px', marginBottom: '32px', color: '#A78BFA', fontWeight: 600, fontSize: '0.85rem' }}>THE ECOSYSTEM EXPANSION</div>
                                <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1, marginBottom: '40px' }}>Pure Native. <br /><span style={{ color: 'var(--primary)' }}>Zero Compromise.</span></h2>
                                <p style={{ fontSize: '1.25rem', color: '#CBD5E1', fontWeight: 500, lineHeight: 1.6, marginBottom: '48px', maxWidth: '600px' }}>We're not just building an app. We're launching the full Kredibly ecosystem for iOS and Android. Fast, biometrically secure, and fully offline-capable.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '64px' }}>
                                    {[
                                        { t: "iOS & Android First", d: "Tailored native experiences for the mobile entrepreneur." },
                                        { t: "Deep Biometrics", d: "FaceID/Fingerprint protected ledgers." },
                                        { t: "Real-time Alerts", d: "Instant push notifications when customers view invoices." },
                                        { t: "Zero Connection", d: "Fully functional offline. Auto-syncs when you're back." }
                                    ].map((item, i) => (
                                        <div key={i}><h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: 'white' }}>{item.t}</h4><p style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 400, margin: 0, lineHeight: 1.5 }}>{item.d}</p></div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                    <div style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'not-allowed' }}>
                                        <Smartphone size={20} color="white" style={{ opacity: 0.6 }} />
                                        <div><p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.5, fontWeight: 900 }}>Available soon on</p><p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>App Store</p></div>
                                    </div>
                                    <div style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'not-allowed' }}>
                                        <Zap size={20} color="white" style={{ opacity: 0.6 }} />
                                        <div><p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.5, fontWeight: 900 }}>Available soon on</p><p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>Play Store</p></div>
                                    </div>
                                </div>
                                <p style={{ marginTop: '32px', fontSize: '0.9rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.15em' }}>GET PRIORITY ACCESS ON LAUNCH DAY</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 5. Testimonials Section */}
            <section className="adaptive-section" style={{ padding: 'clamp(2rem, 10vw, 10rem) 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: false, amount: 0.1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px', padding: '0 20px' }}>
                                <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>From emerging vendors to established enterprises, Kredibly scales with you.</h2>
                            </div>
                    
                    <div className="marquee-container" style={{ position: 'relative', width: '100%', overflow: 'hidden', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                        <div className="marquee-track" style={{ display: 'flex', gap: '24px', width: 'max-content' }}>
                            {[...Array(2)].map((_, i) => (
                                <div key={i} style={{ display: 'flex', gap: '24px' }}>
                                    {[
                                        { name: "John Adenuga", role: "Luxe Fashion Vendor", text: "Kredibly isn't just an app; it's my silent partner. It brings a level of structure my business was missing." },
                                        { name: "Sarah Chinedu", role: "Culinary Entrepreneur", text: "The professional invoices changed how my clients see me. I'm now winning 5x bigger contracts." },
                                        { name: "Mike Okoro", role: "Auto Parts Distributor", text: "I monitor inventory from transit across borders. Oga Mode is a game changer for scale." },
                                        { name: "Adeola Williams", role: "Signature Tech Store", text: "Collecting payments used to be my biggest headache. Kreddy handles follow-ups while I focus on strategy." }
                                    ].map((review, j) => (
                                        <div key={j} style={{ padding: '32px', minWidth: '320px', maxWidth: '350px', background: 'white', borderRadius: '28px', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <p style={{ fontWeight: 400, fontSize: '1rem', lineHeight: 1.6, marginBottom: '24px', color: '#1E293B', fontStyle: 'italic' }}>"{review.text}"</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(76, 29, 149, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary)', fontSize: '0.9rem' }}>{review.name.charAt(0)}</div>
                                                <div><p style={{ fontWeight: 900, fontSize: '0.95rem', margin: 0 }}>{review.name}</p><p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{review.role}</p></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 6. Pricing Section */}
            <section id="pricing" className="adaptive-section" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px', background: 'white' }}>
                <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false, amount: 0.1 }}>
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                            <div style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>TRANSPARENT PRICING</div>
                            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>Start free. Scale endlessly.</h2>
                            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '20px', maxWidth: '600px', margin: '20px auto 40px' }}>Join today and get <span style={{ color: 'var(--text)', fontWeight: 600 }}>7 Days of Oga Plan for FREE.</span></p>

                            {/* Billing Cycle Toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '40px' }}>
                                <span style={{ fontSize: '1.1rem', fontWeight: billingCycle === 'monthly' ? 700 : 500, color: billingCycle === 'monthly' ? '#0F172A' : '#64748B' }}>Monthly</span>
                                <button 
                                    onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                                    style={{ 
                                        width: '64px', height: '32px', borderRadius: '100px', background: 'var(--primary)', position: 'relative', border: 'none', cursor: 'pointer', transition: '0.3s' 
                                    }}
                                >
                                    <div style={{ 
                                        position: 'absolute', top: '4px', left: billingCycle === 'monthly' ? '4px' : '36px', width: '24px', height: '24px', background: 'white', borderRadius: '50%', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
                                    }} />
                                </button>
                                <span style={{ fontSize: '1.1rem', fontWeight: billingCycle === 'yearly' ? 700 : 500, color: billingCycle === 'yearly' ? '#0F172A' : '#64748B' }}>Yearly</span>
                                <div style={{ padding: '4px 12px', background: '#DCFCE7', color: '#166534', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800 }}>SAVE 10%</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                            <div className="glass-card" style={{ padding: '48px', borderRadius: '32px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Hustler</h3><p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontWeight: 400 }}>The Entry-Level Ledger.</p>
                                <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '40px' }}>Free</div>
                                <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Start Hustling</button>
                                <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        "8% AI Debt Recovery Fee",
                                        "Basic Productivity Assistant",
                                        "Standard Security Vault",
                                        "Unlimited Sales Recording",
                                        "5 Automated Reminders / month"
                                    ].map((feat, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500, color: '#334155' }}><CheckCheck size={18} color="var(--primary)" /> {feat}</div>
                                    ))}
                                </div>
                            </div>
                            <div className="pricing-card highlight-card-landing" style={{ padding: '48px', borderRadius: '32px', background: 'var(--text)', color: 'white', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 12px', background: 'var(--primary)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>MOST POPULAR</div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Oga Plan</h3><p style={{ opacity: 0.7, marginBottom: '32px', fontWeight: 400 }}>Professional Productivity Engine.</p>
                                
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <span style={{ fontSize: '3rem', fontWeight: 800 }}>₦{billingCycle === 'monthly' ? '5,000' : '4,500'}</span>
                                        <span style={{ opacity: 0.7 }}>/mo</span>
                                    </div>
                                    {billingCycle === 'yearly' && <p style={{ margin: '8px 0 0', fontSize: '0.9rem', opacity: 0.6, fontWeight: 700 }}>₦54,000 billed annually</p>}
                                </div>

                                <button onClick={() => navigate('/auth/register')} className="btn-white" style={{ width: '100%' }}>Become an Oga</button>
                                <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        "4% AI Debt Recovery Fee",
                                        "Proactive 'Did They Pay?' Nudges",
                                        "Advanced Digital Chief of Staff",
                                        "8 AM Business Briefing (Morning)",
                                        "WhatsApp Voice Note Sync",
                                        "Staff Management (Add 2 Staff)",
                                        "Standard Security Vault"
                                    ].map((feat, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500 }}><CheckCheck size={18} color="#4ade80" /> {feat}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="glass-card" style={{ padding: '48px', borderRadius: '32px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Chairman</h3><p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontWeight: 400 }}>The Elite Command Center.</p>
                                
                                <div style={{ marginBottom: '40px' }}>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                        <span style={{ fontSize: '3rem', fontWeight: 800 }}>₦{billingCycle === 'monthly' ? '8,500' : '7,650'}</span>
                                        <span style={{ opacity: 0.7 }}>/mo</span>
                                    </div>
                                    {billingCycle === 'yearly' && <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: '#64748B', fontWeight: 700 }}>₦91,800 billed annually</p>}
                                </div>

                                <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Lead Empire</button>
                                <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[
                                        "1.5% AI Debt Recovery Fee (Elite)",
                                        "Elite Digital Chief of Staff",
                                        "8 AM Executive Summary (Advanced)",
                                        "Voice Note & Image Sync (Receipts)",
                                        "Priority Vault Release",
                                        "Unlimited Staff & Branches Tracking"
                                    ].map((feat, i) => (
                                        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500, color: '#334155' }}><CheckCheck size={18} color="var(--primary)" /> {feat}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 7. Mission Map Section */}
            <section className="adaptive-section" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px', background: 'var(--background)' }}>
                <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: false, amount: 0.1 }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                            <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>THE MISSION MAP</div>
                            <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>Our journey & commitment.</h2>
                            <p style={{ fontSize: '1.25rem', color: '#334155', marginTop: '20px', maxWidth: '600px', margin: '20px auto 0', fontWeight: 400 }}>Transparent milestones from a simple idea to a global financial ecosystem.</p>
                        </div>
                        <div style={{ position: 'relative', paddingLeft: '40px' }}>
                            <div style={{ position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #E2E8F0 0%, var(--primary) 30%, var(--primary) 70%, #E2E8F0 100%)' }} />
                            {[
                                { date: "JULY '25", title: "The Genesis", desc: "Concept & Research Phase. Identifying the 'Trust Gap' in African commerce.", status: "completed" },
                                { date: "SEPT '25", title: "Strategic Architecture", desc: "Core blueprinting of the Kredibly ledger and AI interface flow.", status: "completed" },
                                { date: "DEC '25", title: "Kreddy AI Core", desc: "Intelligence engine development. Teaching Kreddy to understand merchant slang and complex debts.", status: "completed" },
                                { date: "JAN '26", title: "Premium Ledger UX", desc: "Rollout of smart telemetry, professional document generators, and cross-device syncing.", status: "completed" },
                                { date: "FEBRUARY - PRESENT", title: "Founding Member Waitlist", desc: "Onboarding our first 1,000 pioneers. Early access rewards and lifetime status for active participants.", status: "active" },
                                { date: "Q2 2026", title: "Global Marketplace Launch", desc: "Opening the ecosystem for public merchant registration and global transactions.", status: "future" },
                                { date: "Q3 2026", title: "Kredibly Mobile (Native)", desc: "The full ledger in your pocket. Offline-first, biometric security, and instant push intelligence.", status: "future" }
                            ].map((m, i) => (
                                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: 0.1 }} style={{ marginBottom: '64px', position: 'relative' }}>
                                    <div style={{ position: 'absolute', left: '-41px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: m.status === 'active' ? 'var(--primary)' : m.status === 'completed' ? '#10B981' : 'white', border: m.status === 'future' ? '2px solid #E2E8F0' : 'none', zIndex: 2 }}>{m.status === 'active' && <div className="pulse-dot-landing" />}</div>
                                    <div style={{ opacity: m.status === 'completed' ? 0.7 : 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: m.status === 'active' ? 'var(--primary)' : 'var(--text-muted)', letterSpacing: '0.1em' }}>{m.date}</span>
                                            {m.status === 'active' && <span style={{ fontSize: '0.7rem', fontWeight: 900, background: 'rgba(76, 29, 149, 0.1)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '100px' }}>LIVE NOW</span>}
                                        </div>
                                         <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '10px' }}>{m.title}</h4>
                                        <p style={{ color: '#334155', fontWeight: 400, lineHeight: 1.6, maxWidth: '650px', margin: 0, fontSize: '1.05rem' }}>{m.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* 8. Premium CTA Section */}
            <section className="adaptive-section" style={{ padding: '80px 20px' }}>
                <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: false, amount: 0.1 }} style={{ maxWidth: '1200px', margin: '0 auto', background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', padding: '140px 40px', borderRadius: '60px', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 60px 120px -30px rgba(15, 23, 42, 0.4)' }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <h2 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 0.9, marginBottom: '40px', color: 'white' }}>The smart assistant<br />for your business.</h2>
                        <p style={{ fontSize: '1.35rem', opacity: 0.8, maxWidth: '650px', margin: '0 auto 64px', fontWeight: 400, lineHeight: 1.5, color: 'white' }}>No more notebooks. No more confusing math. We help you track sales and collect your money inside the WhatsApp you already use.</p>
                        <button onClick={() => navigate('/auth/register')} className="btn-white" style={{ padding: '24px 56px', fontSize: '1.25rem', borderRadius: '24px' }}>Join the waitlist <ArrowRight size={22} /></button>
                    </div>
                </motion.div>
            </section>

            <PublicFooter />

            <style>{`
                .marquee-track { animation: marquee-scroll 60s linear infinite; }
                @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-50% - 12px)); } }
                @media (max-width: 1024px) { 
                    .adaptive-section { padding: 60px 24px !important; }
                    .bento-grid { grid-template-columns: 1fr !important; }
                    .mobile-reverse { display: flex !important; flex-direction: column !important; gap: 40px !important; }
                    .mobile-reverse > div:first-child { order: 2 !important; width: 100% !important; }
                    .mobile-reverse > div:last-child { order: 1 !important; width: 100% !important; }
                }
                .premium-gradient {
                    background: linear-gradient(135deg, var(--primary) 0%, #F472B6 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .pulse-dot-landing { position: absolute; inset: -6px; border-radius: 50%; background: var(--primary); opacity: 0.3; animation: pulse-ring-landing 2s infinite; }
                @keyframes pulse-ring-landing { 0% { transform: scale(1); opacity: 0.3; } 100% { transform: scale(2.5); opacity: 0; } }
                .highlight-card-landing { transform: scale(1.05); }
                @media (max-width: 640px) { .highlight-card-landing { transform: none !important; } }
            `}</style>
        </div>
    );
};

export default LandingPage;