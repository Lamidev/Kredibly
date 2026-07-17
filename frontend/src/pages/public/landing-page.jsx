

import React, { useState, useEffect } from "react";
import {
    useNavigate,
    useLocation
} from "react-router-dom";
import {
    Zap,
    ArrowRight,
    Sparkles,
    ShieldCheck, X,
    Check,
    Smartphone,
    Lock,
    Calendar,
    Wallet,
    BadgeCheck,
    Plus,
    Minus,
    Monitor,
    Bell,
    Star,
    Mic,
    Play
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import { useAuth } from "../../context/AuthContext";
import SEO from "../../components/public/SEO";
// kreddy-whatsapp.jpg is served from /public for preload + stable URL (no Vite hash)
const kreddyWhatsapp = "/kreddy-whatsapp.jpg";
import { KREDDY_CONFIG } from "../../config";

/**
 * PhraseFlip — replaces the old Typewriter.
 * Each phrase slides up into view, dwells for ~2.5 s, then slides out.
 * The full phrase is always visible immediately — no character-by-character delay.
 */
const PhraseFlip = ({ phrases }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex(i => (i + 1) % phrases.length);
        }, 2800);
        return () => clearInterval(timer);
    }, [phrases.length]);

    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={index}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -22 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: 'block', fontWeight: 700, lineHeight: 1.2, paddingBottom: '0.2em', color: 'var(--primary)' }}
                translate="no"
            >
                {phrases[index]}
            </motion.span>
        </AnimatePresence>
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
            price: "₦3,000",
            period: "/ month",
            fee: "Settlement Transfer Covered",
            features: [
                "50 Sales Records per Month",
                "100 AI Conversations / Month",
                "Kreddy AI Text Intelligence",
                "Interactive Pay Now Invoices",
                "20 Customer Payment Reminders",
                "Professional Invoices with Your Logo",
                "Direct Bank Settlement"
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
            description: "Unlimited records, AI voice, and a trusted staff member by your side.",
            price: "₦6,000",
            fee: "Settlement Transfer Covered",
            period: "/ month",
            features: [
                "Everything in Hustler Plan",
                "Unlimited Sales Records",
                "Unlimited AI Conversations",
                "Kreddy Voice Notes (Just speak!)",
                "Unlimited Customer Reminders",
                "Add 1 Staff Member",
                "Morning Business Briefing"
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
            description: "Run multiple branches. Lead your empire with AI-powered automation.",
            price: "₦9,000",
            fee: "Settlement Transfer Covered",
            period: "/ month",
            features: [
                "Everything in Oga Plan",
                "Up to 3 Staff & Offices",
                "AI Invoice Scanner (OCR)",
                "Business Reports & Analytics",
                "Priority Support Channel"
            ],
            cta: profile?.plan === "chairman" ? "Current Plan" : profile ? "Lead Your Empire" : "Claim Chairman Title",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: false,
            color: "#0F172A"
        }
    ];

    const location = useLocation();
    const [showInstallBanner, setShowInstallBanner] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);

    useEffect(() => {
        if (location.state?.scrollTo) {
            const sectionId = location.state.scrollTo;
            setTimeout(() => {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                    window.history.replaceState({}, document.title);
                }
            }, 100);
        } else if (!window.location.hash) {
            window.scrollTo(0, 0);
        }
    }, [location]);

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
            <SEO path="" />
            <PublicNavbar />

            {/* 1. Hero Section */}
            <section style={{ 
                position: 'relative', 
                backgroundColor: 'white', 
                overflow: 'hidden',
                borderBottom: '1px solid #F1F5F9',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                paddingTop: 'env(safe-area-inset-top)'
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
                    padding: 'clamp(100px, 10vh, 120px) 24px clamp(1.5rem, 4vw, 50px)',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    position: 'relative',
                    zIndex: 2,
                    width: '100%'
                }}>
                    <div className="hero-container" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '40px',
                        alignItems: 'center',
                        minHeight: 'auto'
                    }}>
                        {/* Left Column - Text Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="hero-left"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <h1 style={{ 
                                fontSize: 'clamp(2rem, 5vw, 4.2rem)', 
                                fontWeight: 950, 
                                lineHeight: 1.05, 
                                marginBottom: '16px',
                                letterSpacing: '-0.04em',
                                fontFamily: 'var(--font-heading)'
                            }}>
                                <span style={{ display: 'block' }}>Your Personal AI</span>
                                <span style={{ display: 'block' }}>Business Assistant.</span>
                                <div style={{ 
                                    color: 'var(--primary)', 
                                    position: 'relative', 
                                    minHeight: '1.4em',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'flex-start',
                                    width: '100%',
                                    fontSize: 'clamp(2rem, 4.5vw, 3rem)',
                                    fontFamily: 'var(--font-heading)',
                                    overflow: 'hidden',
                                    marginTop: '4px'
                                }}>
                                    <PhraseFlip phrases={[
                                        "On WhatsApp.",
                                        "Send invoices.",
                                        "Collect payments.",
                                    ]} />
                                </div>
                            </h1>

                            <p style={{  
                                fontSize: 'clamp(0.85rem, 1.5vw, 1.1rem)', 
                                color: '#4B5563', 
                                marginBottom: '24px', 
                                lineHeight: 1.5, 
                                maxWidth: '520px', 
                                fontWeight: 400
                            }}>
                                Unlock automated invoicing, debt tracking, and instant payments with <b>Kreddy</b>, your AI-powered assistant on WhatsApp.
                            </p>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', width: '100%', gap: '16px', flexWrap: 'wrap' }}>
                                <a
                                    href={KREDDY_CONFIG.getLink("Hi Kreddy\nI'd like to see how Kredibly works.")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-magnetic"
                                    style={{
                                        padding: 'clamp(10px, 1vw, 14px) clamp(18px, 2vw, 28px)',
                                        fontSize: 'clamp(0.75rem, 0.9vw, 0.95rem)',
                                        borderRadius: '10px',
                                        background: 'var(--primary)',
                                        color: '#FFFFFF',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                        textDecoration: 'none',
                                        boxShadow: '0 6px 18px rgba(109, 40, 217, 0.25)'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#6D28D9';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'var(--primary)';
                                        e.currentTarget.style.transform = 'none';
                                    }}
                                >
                                    <svg viewBox="0 0 24 24" width="clamp(18px, 1.8vw, 24px)" height="clamp(18px, 1.8vw, 24px)" fill="white" style={{ flexShrink: 0 }}>
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                                    </svg>
                                    <span style={{ letterSpacing: "-0.01em" }}>Try Kreddy Now</span>
                                </a>
                                <button
                                    onClick={() => setShowVideoModal(true)}
                                    className="btn-magnetic"
                                    style={{
                                        padding: 'clamp(10px, 1vw, 14px) clamp(18px, 2vw, 28px)',
                                        fontSize: 'clamp(0.75rem, 0.9vw, 0.95rem)',
                                        borderRadius: '10px',
                                        background: 'rgba(255, 255, 255, 0.8)',
                                        color: '#0F172A',
                                        border: '1px solid #E2E8F0',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease',
                                        textDecoration: 'none',
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                                        backdropFilter: 'blur(8px)'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#F8FAFC';
                                        e.currentTarget.style.borderColor = '#CBD5E1';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                        e.currentTarget.style.transform = 'none';
                                    }}
                                >
                                    <Play size={18} fill="#0F172A" style={{ flexShrink: 0 }} />
                                    <span style={{ letterSpacing: "-0.01em" }}>Watch Demo</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* Right Column - Phone Mockup */}
                        <div className="hero-right" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <div className="phone-mockup-wrapper" style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '300px',
                                margin: '0 auto'
                            }}>
                                <motion.div
                                    className="phone-mockup"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    style={{
                                        width: '100%',
                                        background: '#0F172A',
                                        borderRadius: '48px',
                                        padding: '8px',
                                        boxShadow: '0 60px 120px -20px rgba(76,29,149,0.25), 0 0 0 1px rgba(255,255,255,0.08)',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Dynamic Island */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '16px',
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
                                        backgroundColor: 'transparent'
                                    }}>
                                        <img
                                            src={kreddyWhatsapp}
                                            alt="Real Kreddy AI WhatsApp conversation showing sales recording, scheduling, and debt tracking"
                                            fetchpriority="high"
                                            loading="eager"
                                            decoding="async"
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

                                {/* Floating Bubbles */}
                                <motion.div
                                    initial={{ opacity: 0, x: -30, y: 20 }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.6 }}
                                    className="floating-bubble-1"
                                    style={{
                                        position: 'absolute',
                                        top: '10%',
                                        left: '-22%',
                                        zIndex: 25,
                                        background: 'white',
                                        borderRadius: '100px',
                                        padding: '6px 18px 6px 6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                        animation: 'float-1 5s ease-in-out infinite'
                                    }}
                                    translate="no"
                                >
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#DB2777', fontSize: '12px' }}>
                                        MN
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 800, fontSize: '12px', color: '#0F172A', lineHeight: 1.2 }}>Received 20k</span>
                                        <span style={{ color: '#64748B', fontSize: '10px', fontWeight: 500 }}>from Mama Ngozi</span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 30, y: -20 }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    transition={{ delay: 0.6, duration: 0.6 }}
                                    className="floating-bubble-2"
                                    style={{
                                        position: 'absolute',
                                        top: '6%',
                                        right: '-22%',
                                        zIndex: 10,
                                        background: 'white',
                                        borderRadius: '20px',
                                        padding: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                        animation: 'float-2 6s ease-in-out infinite'
                                    }}
                                    translate="no"
                                >
                                   <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                       <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ position: 'absolute', top: 0, left: 0 }}>
                                           <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                                           <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="60, 100" strokeLinecap="round" />
                                       </svg>
                                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, marginTop: '2px' }}>
                                           <span style={{ fontSize: '7px', color: '#64748B', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '2px' }}>Total Budget</span>
                                           <span style={{ fontSize: '11px', fontWeight: 900, color: '#0F172A' }}>350,000</span>
                                       </div>
                                   </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8, duration: 0.6 }}
                                    className="floating-bubble-3"
                                    style={{
                                        position: 'absolute',
                                        bottom: '12%',
                                        left: '-20%',
                                        zIndex: 10,
                                        background: 'white',
                                        borderRadius: '100px',
                                        padding: '6px 10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                        animation: 'float-3 7s ease-in-out infinite'
                                    }}
                                >
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                                            <path d="M20 2 L36 10 L36 30 L20 38 L4 30 L4 10 Z" fill="#7C3AED" />
                                            <path d="M20 12 L28 16 L20 20 L16 18 M28 24 L20 28 L12 24 L12 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, border: '2px solid white', marginLeft: '-12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                                            <circle cx="20" cy="20" r="14" stroke="#10B981" strokeWidth="8" />
                                            <rect x="2" y="15" width="12" height="10" fill="#1E3A8A" rx="2" />
                                        </svg>
                                    </div>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: '2px solid white', marginLeft: '-12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                                            <path d="M20 4 L36 20 L20 36 L4 20 Z" stroke="#F97316" strokeWidth="4" />
                                            <path d="M20 12 L28 20 L20 28 L12 20 Z" stroke="#F97316" strokeWidth="4" />
                                            <rect x="18" y="18" width="4" height="4" fill="#F97316" />
                                        </svg>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </header>
            </section>


            {/* 2. Bento Grid Section */}
            <section id="features" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px' }}>
                <div className="bento-grid" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div className="bento-item bento-1" style={{ background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '12px' }}>Financial Trust Infrastructure</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 400 }}>
                                Your business is verified. Every Kredibly receipt and invoice carries a professional seal proving your records are secure and untamperable.
                            </p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.05 }}><ShieldCheck size={200} color="var(--primary)" /></div>
                    </div>

                    <div className="bento-item bento-2" style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '12px' }}>Interactive Payment Loops</h4>
                            <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 400 }}>Kreddy sends structured PDF invoices with Pay Now buttons. Customers can pay instantly or request extensions on WhatsApp.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.15 }}><Sparkles size={200} /></div>
                    </div>

                    <div className="bento-item bento-3" style={{ background: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Conversational Sales Logger</h4>
                            <p style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 400 }}>Speak or text to Kreddy. She matches names, records sales, tracks outstanding balances, and schedules automated nudges.</p>
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

            {/* 3. MEET KREDDY SECTION - Same phone as hero */}
            <section id="how-it-works" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px', background: 'white', color: '#0F172A', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '24px' }}>Meet Kreddy: Your AI Admin.</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.3rem', fontWeight: 400, maxWidth: '700px', margin: '0 auto' }}>She listens, learns, and drafts your commerce work so you can focus on selling.</p>
                    </div>

                    <div className="landing-mockup-grid">
                        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <div className="phone-mockup-wrapper" style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: '300px',
                                margin: '0 auto'
                            }}>
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
                                        padding: '8px',
                                        boxShadow: '0 60px 120px -20px rgba(76,29,149,0.25), 0 0 0 1px rgba(255,255,255,0.08)',
                                        overflow: 'hidden',
                                        position: 'relative'
                                    }}
                                >
                                    {/* Dynamic Island */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '16px',
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
                                        backgroundColor: 'transparent'
                                    }}>
                                        <img
                                            src={kreddyWhatsapp}
                                            alt="Real Kreddy AI WhatsApp conversation showing sales recording, scheduling, and debt tracking"
                                            loading="lazy"
                                            decoding="async"
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

                                {/* Floating bubbles - Same position on all devices */}
                                <motion.div
                                    initial={{ opacity: 0, x: -30, y: 20 }}
                                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                                    transition={{ delay: 0.3, duration: 0.6 }}
                                    className="floating-bubble-1"
                                    style={{
                                        position: 'absolute',
                                        top: '10%',
                                        left: '-22%',
                                        zIndex: 25,
                                        background: 'white',
                                        borderRadius: '100px',
                                        padding: '6px 18px 6px 6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                        animation: 'float-1 5s ease-in-out infinite'
                                    }}
                                >
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FCE7F3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#DB2777', fontSize: '12px' }}>
                                        MN
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 800, fontSize: '12px', color: '#0F172A', lineHeight: 1.2 }}>Received 20k</span>
                                        <span style={{ color: '#64748B', fontSize: '10px', fontWeight: 500 }}>from Mama Ngozi</span>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 30, y: -20 }}
                                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                                    transition={{ delay: 0.5, duration: 0.6 }}
                                    className="floating-bubble-2"
                                    style={{
                                        position: 'absolute',
                                        top: '6%',
                                        right: '-22%',
                                        zIndex: 10,
                                        background: 'white',
                                        borderRadius: '20px',
                                        padding: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                        animation: 'float-2 6s ease-in-out infinite'
                                    }}
                                >
                                   <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                       <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ position: 'absolute', top: 0, left: 0 }}>
                                           <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                                           <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="60, 100" strokeLinecap="round" />
                                       </svg>
                                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, marginTop: '2px' }}>
                                           <span style={{ fontSize: '7px', color: '#64748B', fontWeight: 600, letterSpacing: '0.02em', marginBottom: '2px' }}>Total Budget</span>
                                           <span style={{ fontSize: '11px', fontWeight: 900, color: '#0F172A' }}>350,000</span>
                                       </div>
                                   </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7, duration: 0.6 }}
                                    className="floating-bubble-3"
                                    style={{
                                        position: 'absolute',
                                        bottom: '12%',
                                        left: '-20%',
                                        zIndex: 10,
                                        background: 'white',
                                        borderRadius: '100px',
                                        padding: '6px 10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                                        animation: 'float-3 7s ease-in-out infinite'
                                    }}
                                >
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                                            <path d="M20 2 L36 10 L36 30 L20 38 L4 30 L4 10 Z" fill="#7C3AED" />
                                            <path d="M20 12 L28 16 L20 20 L16 18 M28 24 L20 28 L12 24 L12 16" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, border: '2px solid white', marginLeft: '-12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                                            <circle cx="20" cy="20" r="14" stroke="#10B981" strokeWidth="8" />
                                            <rect x="2" y="15" width="12" height="10" fill="#1E3A8A" rx="2" />
                                        </svg>
                                    </div>
                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, border: '2px solid white', marginLeft: '-12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
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
                                    { icon: Mic, title: "Speak, don't type.", desc: "Send Kreddy a voice note. She automatically records the sale, does the math, drafts the invoice, and schedules the due-date tracking." },
                                    { icon: Smartphone, title: "Direct WhatsApp Delivery", desc: "No copy-pasting required. Customers receive invoices directly in their WhatsApp chat with clean interactive action buttons." },
                                    { icon: Calendar, title: "Automated Extensions", desc: "Tired of awkward debt chasing? Customers can request due-date extensions directly on their invoice. Kreddy handles the limits and notifies you." },
                                    { icon: Zap, title: "Instant Bank Sweeps", desc: "As soon as a customer pays via bank transfer, the money is swept directly into your bank account. No holding periods, no manual withdrawals." },
                                    { icon: BadgeCheck, title: "Zero Payout Fees", desc: "SETTLEMENT FEES COVERED. We cover all payout bank transfer charges. Standard payment gateway processing fees (1% capped at ₦150) apply, with zero extra markups or hidden commissions." }
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

            {/* 4. PRICING SECTION */}
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



            {/* ROI SECTION */}
            <section id="roi" style={{ padding: 'clamp(4rem, 10vw, 8rem) 24px', background: 'white', color: '#0F172A', position: 'relative', overflow: 'hidden' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: '100px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '24px' }}>THE COST OF DOING NOTHING</div>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: '24px' }}>How much are you losing?</h2>
                    <p style={{ color: '#64748B', fontSize: '1.2rem', fontWeight: 400, maxWidth: '700px', margin: '0 auto 60px' }}>Traditional payment gateways charge you 1.5% and hold your money for 24 hours. Small debts go forgotten. Here is the Kredibly difference.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0', textAlign: 'left', borderRadius: '24px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
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
                                    <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', flex: 1 }}>Instant Payouts (Money swept instantly)</p>
                                </div>
                                <div style={{ height: '1px', background: '#E2E8F0' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#10B981' }}><Check size={20} /></div>
                                    <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', flex: 1 }}>Direct WhatsApp PDF Delivery & Pay Now links</p>
                                </div>
                                <div style={{ height: '1px', background: '#E2E8F0' }} />
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ color: '#10B981' }}><Check size={20} /></div>
                                    <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', flex: 1 }}>Automated Follow-ups & Due Date Extensions</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* FAQ SECTION */}
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
                            answer="Kreddy is your intelligent business companion on WhatsApp. When you send a voice note or message like 'Kreddy, log sale of cake to Tola for 15,000, due on Friday', she uses NLP to parse the details, logs it in your secure ledger, builds a professional PDF invoice, and delivers it directly to your customer on WhatsApp."
                        />
                        <FAQItem 
                            question="How do my customers pay their invoices?" 
                            answer="Every PDF invoice Kreddy delivers on WhatsApp has a 'Pay Now' action button. Customers can click it to complete a secure, direct bank transfer. The moment they pay, Kreddy automatically reconciles the transaction, updates your ledger, and notifies you."
                        />
                        <FAQItem 
                            question="What happens if a customer needs more time to pay?" 
                            answer="Customers can tap 'Request Extension' directly on their WhatsApp invoice. Kreddy will prompt them to specify how much time they need (with options like 3 days, 1 week, or a custom reply). She then routes the request to you for approval. To protect your business, customers are limited to a maximum of 2 extensions per invoice."
                        />
                        <FAQItem 
                            question="How do instant sweeps and zero bank charges work?" 
                            answer="Unlike traditional payment gateways that hold your money for 24-48 hours, Kredibly sweeps every successful payment directly to your bank account instantly. We cover 100% of the settlement transfer fees, ensuring there are no payout charges when you move money to your bank. Standard payment gateway processing fees (1% capped at ₦150) still apply to incoming customer payments, but we never charge any commissions, markups, or hidden bank fees on top."
                        />
                        <FAQItem 
                            question="Can I use Kredibly without a smartphone?" 
                            answer="Yes. While our merchant dashboard is best viewed on a smartphone or computer, the core Kreddy AI interface lives on WhatsApp. As long as you have any device that can run WhatsApp (even a feature phone), you can manage records, log sales, and check balances."
                        />
                    </div>
                </div>
            </section>

            {/* FINAL CONVERSION SECTION */}
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

            {/* Install Banner */}
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

                    <div style={{ height: '1px', background: '#F1F5F9', marginBottom: '18px' }} />

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

            {/* Video Demo Modal */}
            <AnimatePresence>
                {showVideoModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowVideoModal(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(12px)',
                            zIndex: 10000,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '24px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.5 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%',
                                maxWidth: '960px',
                                background: '#0F172A',
                                borderRadius: '24px',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                overflow: 'hidden',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                position: 'relative'
                            }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowVideoModal(false)}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    zIndex: 10,
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: '#FFFFFF',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                            >
                                <X size={20} />
                            </button>

                            {/* Aspect Ratio Video Container */}
                            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000' }}>
                                <video
                                    controls
                                    autoPlay
                                    playsInline
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        border: 'none'
                                    }}
                                >
                                    <source src="https://res.cloudinary.com/dz3ofeehd/video/upload/v1784261737/kredibly_assets/kreddydemo.mp4" type="video/mp4" />
                                    <source src="/kreddydemo.mp4" type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .landing-mockup-grid { display: grid; grid-template-columns: 1fr; gap: 3rem; align-items: center; }
                @media (min-width: 992px) { .landing-mockup-grid { grid-template-columns: 1fr 1.2fr; gap: 5rem; } }
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
                    borderRadius: 32px;
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

                /* Hero responsive styles - Keep floating bubbles in same position */
                @media (max-width: 992px) {
                    .hero-container {
                        grid-template-columns: 1fr !important;
                        gap: 28px !important;
                        min-height: auto !important;
                    }
                    .hero-left {
                        order: 1;
                        text-align: center;
                        padding-top: 20px;
                    }
                    .hero-left p {
                        margin-left: auto !important;
                        margin-right: auto !important;
                    }
                    .hero-left h1 {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .hero-left h1 > div {
                        justify-content: center !important;
                    }
                    .hero-left > div:last-child {
                        justify-content: center !important;
                    }
                    .hero-right {
                        order: 2;
                        margin-top: 8px;
                    }
                    .phone-mockup-wrapper {
                        max-width: 250px !important;
                    }
                    .phone-mockup {
                        border-radius: 42px !important;
                        padding: 6px !important;
                    }
                    .phone-mockup > div:last-child {
                        border-radius: 34px !important;
                    }
                    .phone-mockup > div:first-child {
                        width: 80px !important;
                        height: 22px !important;
                        top: 12px !important;
                        border-radius: 18px !important;
                    }
                    /* Floating bubbles stay in same position - no overrides */
                }

                @media (max-width: 480px) {
                    .hero-container {
                        gap: 20px !important;
                        padding-top: 0px;
                    }
                    .hero-left {
                        padding-top: 28px;
                    }
                    .hero-left h1 {
                        font-size: clamp(1.8rem, 8vw, 2.4rem) !important;
                    }
                    .hero-left p {
                        font-size: 0.88rem !important;
                        margin-bottom: 20px !important;
                    }
                    .phone-mockup-wrapper {
                        max-width: 210px !important;
                    }
                    .phone-mockup {
                        border-radius: 38px !important;
                        padding: 5px !important;
                    }
                    .phone-mockup > div:last-child {
                        border-radius: 32px !important;
                    }
                    .phone-mockup > div:first-child {
                        width: 70px !important;
                        height: 20px !important;
                        top: 10px !important;
                        border-radius: 16px !important;
                    }
                    /* Floating bubbles stay in same position - no overrides */
                    /* Increase button size on mobile */
                    .btn-magnetic {
                        padding: clamp(12px, 2.5vw, 16px) clamp(22px, 4vw, 32px) !important;
                        font-size: clamp(0.85rem, 2.5vw, 1rem) !important;
                    }
                    .btn-magnetic svg {
                        width: clamp(20px, 4vw, 26px) !important;
                        height: clamp(20px, 4vw, 26px) !important;
                    }
                }

                .phone-mockup-wrapper {
                    position: relative;
                    width: 100%;
                    max-width: 300px;
                    margin: 0 auto;
                }

                /* All floating bubbles use the same position on all devices */
                .floating-bubble-1 {
                    position: absolute;
                    top: 10%;
                    left: -22%;
                    z-index: 25;
                    animation: float-1 5s ease-in-out infinite;
                }
                .floating-bubble-2 {
                    position: absolute;
                    top: 6%;
                    right: -22%;
                    z-index: 10;
                    animation: float-2 6s ease-in-out infinite;
                }
                .floating-bubble-3 {
                    position: absolute;
                    bottom: 12%;
                    left: -20%;
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

                @keyframes float-1-mobile {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes float-2-mobile {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes float-3-mobile {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-7px); }
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