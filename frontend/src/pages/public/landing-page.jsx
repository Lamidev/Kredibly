import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Zap,
    ArrowRight,
    MessageCircle,
    Sparkles,
    ShieldCheck,
    Check,
    LayoutDashboard,
    CreditCard,
    Users,
    Smartphone,
    TrendingUp,
    FileText,
    Lock,
    Mic,
    Calendar,
    Clock,
    Wallet,
    BadgeCheck
} from "lucide-react";
import { motion } from "framer-motion";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import { useAuth } from "../../context/AuthContext";

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
                fontWeight: 500
            }}>|</span>
        </span>
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
            originalPrice: "₦3,000",
            price: "₦1,500",
            period: "/ month",
            fee: "Zero Transfer Fees*",
            features: [
                "10 Sale Records limit per Month",
                "Kreddy AI Text Intelligence (Type normally)",
                "Basic Debt Recovery Assistant",
                "Verified Ledger Seal",
                "Digital Receipts (Kredibly Branded)"
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
            description: "Step up to professional branding and lower fees for your growing business.",
            originalPrice: "₦6,000",
            price: "₦3,000", 
            isSlash: true,
            fee: "Zero Transfer Fees*",
            period: "/ month",
            features: [
                "Everything in Hustler Plan",
                "Unlimited Sales Records",
                "Kreddy Voice Notes (Just speak!)",
                "Add 1 Staff Member",
                "Co-Branded Receipts (Your Logo)",
                "Advanced AI Recovery Assistant"
            ],
            cta: profile?.plan === "oga" ? "Current Plan" : profile ? "Gain Pioneer Access" : "Become an Oga",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: true,
            color: "var(--primary)"
        },
        {
            name: "Chairman",
            slug: "chairman",
            tagline: "The Empire Command Center",
            description: "Run multiple shops without stress. Lead your empire with zero commissions.",
            originalPrice: "₦9,000",
            price: "₦4,500", 
            isSlash: true,
            fee: "Zero Transfer Fees*",
            period: "/ month",
            features: [
                "Everything in Oga Plan",
                "White-Label Receipts (Only Your Logo)",
                "Unlimited Staff & Offices",
                "WhatsApp Image Sync (Automatic)",
                "8 AM Executive Intelligence Brief",
                "Priority Vault & Support"
            ],
            cta: profile?.plan === "chairman" ? "Current Plan" : profile ? "Lead Your Empire" : "Claim Chairman Title",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: false,
            color: "#0F172A"
        }
    ];
    const location = useLocation();

    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            window.history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    };

    useEffect(() => {
        document.title = "Kredibly — The AI Business OS for Nigerian Merchants";
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

            {/* 1. Hero Section - Focused on "Assistant" and "Recovery" */}
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
                    padding: 'clamp(80px, 10vw, 110px) 24px clamp(2rem, 6vw, 70px)',
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
                            fontWeight: 800, 
                            color: 'var(--primary)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>The Intelligent Assistant for Every Merchant</span>
                    </div>

                    <h1 style={{ 
                        fontSize: 'clamp(2.1rem, 8vw, 5.5rem)',
                        fontWeight: 950, 
                        lineHeight: 1, 
                        letterSpacing: '-0.04em',
                        marginBottom: '32px'
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
                            fontSize: 'clamp(1.5rem, 6vw, 5.5rem)',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                        }}>
                             <Typewriter phrases={[
                                "In 20 seconds.",
                                "Automatically.",
                                "With Kreddy AI.",
                                "On autopilot."
                            ]} />
                        </div>
                    </h1>

                    <p style={{  
                        fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', 
                        color: 'var(--text-muted)', 
                        maxWidth: '850px', 
                        margin: '0 auto 48px',
                        lineHeight: 1.6,
                        fontWeight: 400,
                    }}>
                        Send professional invoices, get paid instantly to your bank account, and let Kreddy AI recover your debts automatically. 
                        The smartest way to run your business from WhatsApp.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '20px 48px', fontSize: '1.2rem', borderRadius: '100px' }}>Start billing professionally <ArrowRight size={20} /></button>
                            <button onClick={() => scrollToSection('how-it-works')} className="btn-secondary" style={{ padding: '20px 48px', fontSize: '1.2rem', borderRadius: '100px', background: 'white', color: 'var(--primary)', borderColor: 'var(--primary)' }}>Meet Kreddy AI</button>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gap: '5px', 
                            color: '#475569', 
                            fontWeight: 800, 
                            fontSize: 'clamp(0.6rem, 2vw, 0.75rem)',
                            padding: '8px 16px',
                            background: 'rgba(76, 29, 149, 0.04)',
                            borderRadius: '100px',
                            opacity: 0.9,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            width: 'fit-content',
                            margin: '0 auto'
                        }}>
                            <BadgeCheck size={14} style={{ flexShrink: 0, color: 'var(--primary)' }} /> 
                            <span>ZERO TRANSFER FEES, We cover your bank charges.</span>
                        </div>
                    </div>
                </motion.div>
            </header>
            
            </section>

            {/* 2. Bento Grid Section - Repositioned for Personal Assistant + Ledger */}
            <section id="features" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px' }}>
                <div className="bento-grid" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div className="bento-item bento-1" style={{ background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>The Verified Hub</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>
                                Your business is verified. Every Kredibly receipt carries a professional seal proving your records are secure and untamperable.
                            </p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.05 }}><ShieldCheck size={200} color="var(--primary)" /></div>
                    </div>

                    <div className="bento-item bento-2" style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>AI Drafting Assistant</h4>
                            <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 500 }}>Too busy to type? Speak to Kreddy. She drafts your professional invoices and follow-ups for you to send personally.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.15 }}><Sparkles size={200} /></div>
                    </div>

                    <div className="bento-item bento-3" style={{ background: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '12px' }}>Smart AI Reconciliation</h4>
                            <p style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 600 }}>Forward your bank slips to Kreddy. She matches them to invoices and updates your ledger automatically.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.05 }}><Lock size={200} color="#7C3AED" /></div>
                    </div>

                    <div className="bento-item bento-4" style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>Instant Settlement</h4>
                            <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 500 }}>Customer pays via bank transfer, money lands in your bank instantly. No 24-hour delays.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.15 }}><Wallet size={200} /></div>
                    </div>

                    <div className="bento-item bento-5" style={{ background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '10px' }}>Zero Hidden Fees</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>We cover your bank transfer charges. Your ₦5,000 sale is ₦5,000 in your pocket.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.05 }}><BadgeCheck size={200} color="#4C1D95" /></div>
                    </div>
                </div>
            </section>

            {/* 3. SIMULATED WHATSAPP FLOW - Kreddy Assistant Showcase */}
            <section id="how-it-works" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px', background: 'white' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '24px' }}>Meet Kreddy: Your AI Admin.</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.3rem', fontWeight: 500, maxWidth: '700px', margin: '0 auto' }}>She listens, learns, and drafts your commerce work so you can focus on selling.</p>
                    </div>

                    <div className="landing-mockup-grid">
                        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <motion.div className="phone-mockup" style={{ width: '100%', maxWidth: '360px', height: '680px', background: '#111', borderRadius: '48px', padding: '12px', position: 'relative', boxShadow: '0 60px 120px -20px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', background: '#E5DDD5', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ background: '#075E54', padding: '40px 20px 16px', color: 'white', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white' }}>K</div>
                                        <div><p style={{ fontSize: '0.95rem', fontWeight: 900 }}>KreddyAI</p><p style={{ fontSize: '0.65rem', opacity: 0.8 }}>Business Assistant</p></div>
                                    </div>
                                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                                        {/* Step 1: Voice Note */}
                                        <div style={{ alignSelf: 'flex-end', background: '#DCF8C6', padding: '16px', borderRadius: '16px 0 16px 16px', fontSize: '0.85rem', color: '#111', fontWeight: 500, maxWidth: '85%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={20} color="white" /></div>
                                                <div style={{ width: '120px', height: '6px', background: 'rgba(18, 140, 126, 0.3)', borderRadius: '3px' }} />
                                            </div>
                                            <p style={{ margin: '0', opacity: 0.7, fontSize: '0.75rem', fontStyle: 'italic' }}>"Kreddy, I just sold a laptop to Emeka for ₦300k. Send him the invoice link."</p>
                                        </div>
                                        {/* Step 2: Invoice Created */}
                                        <div style={{ alignSelf: 'flex-start', background: 'white', padding: '16px', borderRadius: '0 16px 16px 16px', fontSize: '0.85rem', maxWidth: '85%' }}>
                                            <p style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', marginBottom: '6px' }}>Kreddy Assistant</p>
                                            <p style={{ fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                                                Done! Invoice created. 📄<br /><br />
                                                🔗 <b>Payment Link:</b> pay.kredibly.com/emeka
                                            </p>
                                        </div>
                                        {/* Step 3: Payment Alert */}
                                        <div style={{ alignSelf: 'flex-start', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '16px', borderRadius: '0 16px 16px 16px', fontSize: '0.85rem', maxWidth: '85%', marginTop: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#10B981', fontWeight: 800 }}>
                                                <Zap size={16} /> Instant Payout Alert
                                            </div>
                                            <p style={{ fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
                                                Emeka just paid! ₦300,000 has been sent to your GTBank account. 💸
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ padding: '16px', background: '#f0f0f0', display: 'flex', gap: '10px' }}><div style={{ flex: 1, height: '40px', background: 'white', borderRadius: '20px' }} /><div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#128C7E' }} /></div>
                                </div>
                            </motion.div>
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
                                        <div><h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: '#0F172A' }}>{item.title}</h4><p style={{ color: '#475569', lineHeight: 1.6, fontWeight: 500 }}>{item.desc}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3.5. ROI SECTION - The Cost of Doing Nothing */}
            <section id="roi" style={{ padding: 'clamp(4rem, 10vw, 8rem) 24px', background: '#020617', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '100px', background: 'rgba(124, 58, 237, 0.1)', color: '#A78BFA', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '24px' }}>THE COST OF DOING NOTHING</div>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '24px' }}>How much are you losing?</h2>
                    <p style={{ color: '#94A3B8', fontSize: '1.2rem', fontWeight: 500, maxWidth: '700px', margin: '0 auto 60px' }}>Traditional payment gateways charge you 1.5% and hold your money for 24 hours. Small debts go forgotten. Here is the Kredibly difference.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0', textAlign: 'left', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {/* Traditional */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '40px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#64748B', marginBottom: '32px', textAlign: 'center' }}>Without Kredibly</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#EF4444' }}>✕</div>
                                    <p style={{ margin: 0, fontWeight: 600, color: '#CBD5E1', flex: 1 }}>High Fees (1.5% + ₦100 per transfer)</p>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#EF4444' }}>✕</div>
                                    <p style={{ margin: 0, fontWeight: 600, color: '#CBD5E1', flex: 1 }}>24-Hour Settlement Delays (T+1)</p>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#EF4444' }}>✕</div>
                                    <p style={{ margin: 0, fontWeight: 600, color: '#CBD5E1', flex: 1 }}>Manual Bank Alert Checking</p>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#EF4444' }}>✕</div>
                                    <p style={{ margin: 0, fontWeight: 600, color: '#CBD5E1', flex: 1 }}>Forgotten Debts & Unpaid Invoices</p>
                                </div>
                            </div>
                        </div>

                        {/* Kredibly */}
                        <div style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(124, 58, 237, 0.05))', padding: '40px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900 }}>ROI MULTIPLIER</div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', marginBottom: '32px', textAlign: 'center' }}>With Kredibly</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#10B981' }}><Check size={20} /></div>
                                    <p style={{ margin: 0, fontWeight: 700, color: 'white', flex: 1 }}>Subsidized Gateway (Zero Transfer Fees)</p>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#10B981' }}><Check size={20} /></div>
                                    <p style={{ margin: 0, fontWeight: 700, color: 'white', flex: 1 }}>Instant Payouts (Money lands in 20s)</p>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#10B981' }}><Check size={20} /></div>
                                    <p style={{ margin: 0, fontWeight: 700, color: 'white', flex: 1 }}>AI Slip Matching (Ledger auto-updates)</p>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#10B981' }}><Check size={20} /></div>
                                    <p style={{ margin: 0, fontWeight: 700, color: 'white', flex: 1 }}>Automated Debt Recovery AI</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)', filter: 'blur(120px)', zIndex: 0 }} />
            </section>

            {/* 4. PRICING SECTION - Updated for Success-Fee Model */}
            <section id="pricing" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px', background: '#FDFCFE' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 8vw, 80px)' }}>
                        <div style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', letterSpacing: '0.05em' }}>100% INSTANT SETTLEMENTS & ZERO BANK FEES</div>
                        <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>Pioneer Pricing. <br /><span className="premium-gradient">Limited Launch Access.</span></h2>
                        <p style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)', color: 'var(--text-muted)', marginTop: '20px', maxWidth: '600px', margin: '20px auto 48px' }}>Join our first 1,000 merchants and lock in these subsidized rates. We cover your transfer charges so you keep more of your money.</p>
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
                                        background: '#fff',
                                        color: '#000',
                                        border: '1px solid #E2E8F0',
                                        padding: '6px 16px',
                                        borderRadius: '100px',
                                        fontSize: '0.7rem',
                                        fontWeight: 900,
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                                        zIndex: 10,
                                        letterSpacing: '0.05em',
                                        whiteSpace: 'nowrap'
                                    }}>MOST POPULAR</div>
                                )}

                                <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 900, marginBottom: '6px' }}>{plan.name}</h3>
                                <p style={{ opacity: 0.7, fontSize: '0.9rem', fontWeight: 500, marginBottom: '24px' }}>{plan.description}</p>
                                
                                <div style={{ marginBottom: '32px' }}>
                                    <div className="lp-price-row">
                                        <span className="lp-price-original">{plan.originalPrice}</span>
                                        <span className="lp-price-main">{plan.price}</span>
                                        <span className="lp-price-period">{plan.period}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: plan.highlight ? 'white' : 'var(--primary)', marginTop: '4px' }}>{plan.fee}</div>
                                </div>

                                <button 
                                    onClick={plan.ctaAction}
                                    className={plan.highlight ? "btn-primary" : "btn-secondary"} 
                                    style={{ width: '100%', marginBottom: '32px', justifyContent: 'center', height: '54px', borderRadius: '16px', fontSize: '0.95rem', boxShadow: plan.highlight ? '0 10px 20px rgba(124, 58, 237, 0.3)' : 'none' }}
                                >
                                    {plan.cta} <ArrowRight size={16} />
                                </button>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    {plan.features.map((feat, j) => (
                                        <div key={j} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.9rem', fontWeight: 600 }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: plan.highlight ? 'rgba(255,255,255,0.1)' : 'rgba(76, 29, 149, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                                                <Check size={12} color={plan.highlight ? '#4ADE80' : 'var(--primary)'} />
                                            </div>
                                            {feat}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Premium Mobile Ecosystem Preview - THE MOBILE OS FOR MERCHANTS */}
            <section id="mobile-os" style={{ 
                padding: 'clamp(4rem, 12vw, 8rem) 0',
                background: '#020617', 
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{ duration: 1 }}
                >
                <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.1) 0%, transparent 70%)', filter: 'blur(120px)', zIndex: 0 }} />

                <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1, padding: '0 24px' }}>
                    <div className="mobile-ecosystem-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 'clamp(2rem, 8vw, 5rem)', alignItems: 'center' }}>
                        
                        {/* 3D iPhone Mockup */}
                        <div style={{ perspective: '2000px', display: 'flex', justifyContent: 'center' }}>
                            <motion.div 
                                style={{ position: 'relative', width: '100%', maxWidth: '300px' }}
                                initial={{ rotateY: -15, rotateX: 10, y: 30, opacity: 0 }}
                                whileInView={{ rotateY: 0, rotateX: 0, y: 0, opacity: 1 }}
                                viewport={{ once: true, amount: 0.1 }}
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
                                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, fontWeight: 600 }}>Payment Received</p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>₦150,000</p>
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
                                        <p style={{ margin: 0, fontSize: '0.7rem', opacity: 0.6, fontWeight: 600 }}>Staff Activity</p>
                                        <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Verified Sale</p>
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
                            <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '100px', marginBottom: '32px', color: '#A78BFA', fontWeight: 700, fontSize: '0.85rem' }}>
                                THE MOBILE OS FOR MERCHANTS
                            </div>
                            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '32px' }}>
                                Native. Powerful. <br />
                                <span style={{ color: 'var(--primary)' }}>Zero Compromise.</span>
                            </h2>
                            <p style={{ fontSize: '1.25rem', color: '#CBD5E1', fontWeight: 500, lineHeight: 1.6, marginBottom: '40px' }}>
                                We're building the full Kredibly experience for iOS and Android. Biometric security, offline-first workspace, and instant sales intelligence at your fingertips.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                                {[
                                    { t: "iOS & Android", d: "Designed for the modern entrepreneur." },
                                    { t: "Deep Biometrics", d: "FaceID & Fingerprint protection." },
                                    { t: "Instant Alerts", d: "Push notifications for every payment." },
                                    { t: "Offline Mode", d: "Record sales even without internet." }
                                ].map((item, i) => (
                                    <div key={i}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'white' }}>{item.t}</h4>
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
                                         <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>Available soon on</p>
                                         <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>App Store</p>
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
                                         <p style={{ margin: 0, fontSize: '0.65rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>Available soon on</p>
                                         <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>Play Store</p>
                                     </div>
                                 </div>
                             </div>
                         </div>
                    </div>
                    </div>
                </motion.div>
            </section>

            {/* 7. The Mission Map (Roadmap) - SYNCED WITH WAITLIST */}
            <section id="mission-map" style={{ padding: 'clamp(4rem, 10vw, 8rem) 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
                <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <div style={{ display: 'inline-flex', padding: '8px 20px', borderRadius: '100px', background: 'rgba(76, 29, 149, 0.05)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '24px', letterSpacing: '0.1em' }}>
                            OUR JOURNEY & VISION
                        </div>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', color: '#0F172A' }}>The Mission Map.</h2>
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
                            { date: "FEBRUARY - PRESENT", title: "Early Access Pioneer Program", desc: "Onboarding our first 1,000 pioneers. Lifetime status and exclusive rewards for active merchants.", status: "active", isFounding: true },
                            { date: "JUNE 1ST", title: "Grand Launch", desc: "Opening the ecosystem for public merchant registration and global transactions.", status: "future" },
                            { date: "Q3 2026", title: "Kredibly Mobile (Native)", desc: "Your entire business in your pocket. Offline-first, biometric security, and instant push intelligence.", status: "future", isMobile: true }
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
                                        <span style={{ fontSize: '0.75rem', fontWeight: 900, color: m.status === 'active' ? 'var(--primary)' : '#94A3B8', letterSpacing: '0.1em' }}>{m.date}</span>
                                        {m.isFounding && m.status === 'active' && (
                                            <span style={{ fontSize: '0.65rem', fontWeight: 900, background: 'rgba(76, 29, 149, 0.1)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '100px' }}>LIVE NOW</span>
                                        )}
                                    </div>
                                    <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>{m.title}</h4>
                                    <p style={{ color: '#334155', fontWeight: 400, lineHeight: 1.6, maxWidth: '600px', margin: 0 }}>{m.desc}</p>
                                    
                                    {m.isMobile && (
                                        <div style={{ marginTop: '24px', padding: '20px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <Smartphone size={32} color="var(--primary)" />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Native Mobile Preview</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Coming Q3 2026</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Final Conversion Section (Pioneer Edition) - Oga Dark Theme */}
            <section style={{ padding: 'clamp(80px, 12vw, 150px) 24px', background: '#0F172A', textAlign: 'center', color: 'white' }}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '100px', marginBottom: '32px', color: 'var(--primary-light)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em' }}>EXCLUSIVE PRE-LAUNCH ACCESS</div>
                    <h2 style={{ fontSize: 'clamp(2.1rem, 7vw, 4.5rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '32px', color: 'white' }}>Build Your <span className="premium-gradient">Business Empire.</span></h2>
                    <p style={{ color: '#94A3B8', fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)', fontWeight: 500, maxWidth: '650px', margin: '0 auto 48px', lineHeight: 1.6 }}>Join 1,000+ Nigerian merchants scaling with AI. Try the full power of Chairman for 14 days, absolutely free.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '24px 64px', fontSize: '1.25rem', borderRadius: '100px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}>Get 14 Days Free <ArrowRight size={24} /></button>
                        <p style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>No card required. Setup in under 2 minutes.</p>
                    </div>
                </motion.div>
            </section>

            <PublicFooter />

            <style>{`
                .landing-mockup-grid { display: grid; grid-template-columns: 1fr; gap: 4rem; align-items: center; }
                @media (min-width: 992px) { .landing-mockup-grid { grid-template-columns: 1.15fr 0.85fr; } }

                .premium-gradient {
                    background: linear-gradient(135deg, var(--primary) 0%, #F472B6 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .lp-pricing-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 24px;
                    align-items: start;
                }
                .lp-pricing-card {
                    padding: 36px;
                    border-radius: 28px;
                    background: white;
                    color: #0F172A;
                    border: 1px solid #E2E8F0;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
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
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .lp-price-original {
                    font-size: 1.1rem;
                    font-weight: 700;
                    text-decoration: line-through;
                    opacity: 0.4;
                }
                .lp-price-main {
                    font-size: clamp(1.8rem, 4vw, 2.8rem);
                    font-weight: 950;
                    letter-spacing: -0.04em;
                    line-height: 1;
                }
                .lp-price-period {
                    opacity: 0.6;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                @media (max-width: 900px) {
                    .lp-pricing-grid {
                        grid-template-columns: 1fr;
                        max-width: 480px;
                        margin: 0 auto;
                    }
                }

                @media (max-width: 768px) {
                    .phone-mockup { transform: scale(0.95); }
                    section h2 { font-size: clamp(1.5rem, 6vw, 2.4rem) !important; }
                    section h3 { font-size: clamp(1rem, 4vw, 1.4rem) !important; }
                    section h4 { font-size: clamp(0.95rem, 3.5vw, 1.2rem) !important; }
                    section p  { font-size: clamp(0.82rem, 3vw, 1rem) !important; }
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