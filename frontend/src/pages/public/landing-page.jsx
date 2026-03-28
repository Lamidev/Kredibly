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
    Clock
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
        document.title = "Kredibly | Verified Ledger & AI Business Secretary on WhatsApp";
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
                            fontSize: 'clamp(0.6rem, 2.5vw, 0.85rem)',
                            fontWeight: 800, 
                            color: 'var(--primary)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}>The Intelligent Assistant for Every Merchant</span>
                    </div>

                    <h1 style={{ 
                        fontSize: 'clamp(2.1rem, 8vw, 5.5rem)',
                        fontWeight: 900, 
                        lineHeight: 1, 
                        letterSpacing: '-0.04em',
                        marginBottom: '32px'
                    }}>
                        <span style={{ display: 'block', marginBottom: '16px' }}>Stop chasing money.</span>
                        <div style={{ 
                            color: 'var(--primary)', 
                            position: 'relative', 
                            minHeight: '1.2em',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: '100%',
                            fontSize: 'clamp(2.1rem, 8vw, 5.5rem)',
                            overflow: 'hidden'
                        }}>
                             <Typewriter phrases={[
                                "Ditch the notebooks.",
                                "Get paid instantly.",
                                "Do business better."
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
                        You have a business to run. Let Kreddy handle the records. 
                        Track what you're owed, send professional receipts, and chase payments, all inside your WhatsApp.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
                        <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '20px 48px', fontSize: '1.1rem', borderRadius: '100px' }}>Get Started <ArrowRight size={20} /></button>
                        <button onClick={() => scrollToSection('how-it-works')} className="btn-secondary" style={{ padding: '20px 48px', fontSize: '1.1rem', borderRadius: '100px', background: 'white', color: 'black' }}>Meet Kreddy AI</button>
                    </div>
                </motion.div>
            </header>
            </section>

            {/* 2. Bento Grid Section - Repositioned for Personal Assistant + Ledger */}
            <section id="features" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px' }}>
                <div className="bento-grid" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div className="bento-item bento-1" style={{ background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h3 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-0.03em' }}>The Verified Hub</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: 1.6, fontWeight: 500 }}>
                                Stop the arguments. Your business is verified when you use Kredibly. Every receipt carries a professional seal that tells customers your records are secure and untamperable.
                            </p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.05 }}><ShieldCheck size={260} color="var(--primary)" /></div>
                    </div>

                    <div className="bento-item bento-2" style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>Personal Assistant</h4>
                            <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 500 }}>Kreddy doesn't just manage sales. She remembers your gym sessions, market runs, and doctor appointments.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.15 }}><Sparkles size={200} /></div>
                    </div>

                    <div className="bento-item bento-3" style={{ background: 'white', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '12px' }}>24/7 Reminders</h4>
                            <p style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 600 }}>Kreddy nudges your debtors automatically so you don't have to feel awkward chasing money.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.05 }}><Zap size={200} color="#7C3AED" /></div>
                    </div>

                    <div className="bento-item bento-4" style={{ background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '12px' }}>Instant Settlement</h4>
                            <p style={{ opacity: 0.8, fontSize: '1.1rem', lineHeight: 1.5, fontWeight: 500 }}>Secure "Pay Now" links mean money lands in your bank account the moment someone pays.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.15 }}><CreditCard size={200} /></div>
                    </div>

                    <div className="bento-item bento-5" style={{ background: '#F8FAFC', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h4 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '10px' }}>Scale Like a Chairman</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', fontWeight: 500 }}>Track what your sales staff are doing in real-time. Whether you have 1 stall or 10 shops.</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', opacity: 0.05 }}><TrendingUp size={200} color="#4C1D95" /></div>
                    </div>
                </div>
            </section>

            {/* 3. SIMULATED WHATSAPP FLOW - Kreddy Assistant Showcase */}
            <section id="how-it-works" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px', background: 'white' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '24px' }}>Meet Kreddy: Your 24/7 Digital Secretary.</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.3rem', fontWeight: 500, maxWidth: '700px', margin: '0 auto' }}>Leverage AI to manage your commerce and your day without ever leaving WhatsApp.</p>
                    </div>

                    <div className="landing-mockup-grid">
                        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                            <motion.div className="phone-mockup" style={{ width: '100%', maxWidth: '360px', height: '680px', background: '#111', borderRadius: '48px', padding: '12px', position: 'relative', boxShadow: '0 60px 120px -20px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                <div style={{ width: '100%', height: '100%', background: '#E5DDD5', borderRadius: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ background: '#075E54', padding: '40px 20px 16px', color: 'white', display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white' }}>K</div>
                                        <div><p style={{ fontSize: '0.95rem', fontWeight: 900 }}>Kredibly x Kreddy</p><p style={{ fontSize: '0.65rem', opacity: 0.8 }}>Business Assistant</p></div>
                                    </div>
                                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ alignSelf: 'flex-end', background: '#DCF8C6', padding: '16px', borderRadius: '16px 0 16px 16px', fontSize: '0.85rem', color: '#111', fontWeight: 500, maxWidth: '85%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#128C7E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={20} color="white" /></div>
                                                <div style={{ width: '120px', height: '6px', background: 'rgba(18, 140, 126, 0.3)', borderRadius: '3px' }} />
                                            </div>
                                            <p style={{ margin: '0', opacity: 0.7, fontSize: '0.75rem', fontStyle: 'italic' }}>"Ah Kreddy, I just gave 10 bags to Mr. Okoro for 50k, remind me to follow up next Tuesday. Also, remind me to go for my gym session by 5 PM today."</p>
                                        </div>
                                        <div style={{ alignSelf: 'flex-start', background: 'white', padding: '16px', borderRadius: '0 16px 16px 16px', fontSize: '0.85rem' }}>
                                            <p style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.75rem', marginBottom: '6px' }}>Kreddy Assistant</p>
                                            <p style={{ fontWeight: 600, lineHeight: 1.5 }}>
                                                Done, Chairman! 🫡<br /><br />
                                                ✅ <b>Recorded Sale:</b> Mr. Okoro (₦50k)<br />
                                                ⏳ <b>Debt Reminder:</b> Next Tuesday Morning<br />
                                                🏃‍♂️ <b>Personal Reminder:</b> Gym Session (5:00 PM Today)<br /><br />
                                                <i>I've got you covered!</i>
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
                                    { icon: Mic, title: "Stop typing. Start talking.", desc: "Send Kreddy a 30-second voice note while you're walking. She extracts the debt, sets the reminders, and updates your records instantly." },
                                    { icon: Calendar, title: "Plan Your Entire Life", desc: "Set gym reminders, market meetings, or child pick-ups via Kreddy. She isn't just for business; she's for your lifestyle." },
                                    { icon: ShieldCheck, title: "The 'Pay-Now' Advantage", desc: "Stop asking 'Have you sent it?' Send a secure Kredibly link and get notified the second the money leaves their hand." },
                                    { icon: TrendingUp, title: "Staff Monitoring & Trust", desc: "Record every sale globally so your sales boys can't play games with your money. Professional monitoring for modern bosses." },
                                    { icon: Clock, title: "Morning Market Briefing", desc: "Start every day with an 8 AM summary on WhatsApp of who owes you, what's in the bank, and what your schedule looks like." }
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

            {/* 4. PRICING SECTION - Updated for Success-Fee Model */}
            <section id="pricing" style={{ padding: 'clamp(2rem, 10vw, 8rem) 24px', background: '#FDFCFE' }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <div style={{ display: 'inline-block', padding: '10px 20px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em' }}>100% FREE TRANSACTIONS & INSTANT SETTLEMENT</div>
                        <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1 }}>Zero Platform Fees. <br /><span className="premium-gradient">Keep 100% of your sales.</span></h2>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginTop: '20px', maxWidth: '600px', margin: '20px auto 0' }}>We don't charge you to collect your own money. Enjoy free bank transfers for you and your customers forever.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        {/* Hustler */}
                        <div className="glass-card" style={{ padding: '48px', borderRadius: '32px', display: 'flex', flexDirection: 'column', border: '1px solid #E2E8F0' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Hustler</h3>
                            <p style={{ color: '#64748B', marginBottom: '32px', fontWeight: 600 }}>The Record-Keepers Special.</p>
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 900 }}>Free</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 800 }}>0% Transaction Fees</div>
                            </div>
                            <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Start Recording Free</button>
                            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {["10 Sales/Invoices limit per Month", "Kreddy AI Text Intelligence (Type normally)", "Basic Debt Recovery Assistant", "Kredibly Branded Receipts", "Personal Daily Reminders"].map((f, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}><Check size={18} color="var(--primary)" /> {f}</div>
                                ))}
                            </div>
                        </div>

                        {/* Oga */}
                        <div style={{ padding: '48px', borderRadius: '32px', background: '#0F172A', color: 'white', display: 'flex', flexDirection: 'column', transform: 'scale(1.05)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 12px', background: 'var(--primary)', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900 }}>MOST POPULAR</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Oga Plan</h3>
                            <p style={{ opacity: 0.7, marginBottom: '32px', fontWeight: 600 }}>Professional Growth Hub.</p>
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 900 }}>₦5,000<span style={{ fontSize: '1rem', opacity: 0.5 }}>/mo</span></div>
                                <div style={{ fontSize: '0.9rem', color: '#4ADE80', fontWeight: 800 }}>0% Transaction Fees</div>
                            </div>
                            <button onClick={() => navigate('/auth/register')} className="btn-white" style={{ width: '100%' }}>Step Up to Oga</button>
                            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {["Everything in Hustler", "Unlimited Sales Records", "Kreddy AI Voice Notes (Just speak!)", "Add 2 Staff Members", "Co-Branded Receipts (Your Logo)", "Advanced Recovery Assistant"].map((f, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 600 }}><Check size={18} color="#10B981" /> {f}</div>
                                ))}
                            </div>
                        </div>

                        {/* Chairman */}
                        <div className="glass-card" style={{ padding: '48px', borderRadius: '32px', display: 'flex', flexDirection: 'column', border: '1px solid #E2E8F0' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Chairman</h3>
                            <p style={{ color: '#64748B', marginBottom: '32px', fontWeight: 600 }}>The Empire Command Center.</p>
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ fontSize: '3rem', fontWeight: 900 }}>₦8,500<span style={{ fontSize: '1rem', opacity: 0.5 }}>/mo</span></div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 800 }}>0% Transaction Fees</div>
                            </div>
                            <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Lead Your Empire</button>
                            <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {["Everything in Oga", "White-Label Invoices (Only your Logo)", "Unlimited Staff & Shops", "Excel Business Reports", "8 AM VIP Morning Brief", "Priority Support & Vault"].map((f, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}><Check size={18} color="var(--primary)" /> {f}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission Map Section */}
            <section style={{ padding: '80px 24px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>THE MISSION MAP</div>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '24px', color: '#0F172A' }}>The Road to Trust.</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 500, maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>Building the infrastructure for African commerce isn't an overnight job. Here's our timeline.</p>
                    </div>

                    <div style={{ position: 'relative', marginTop: '40px' }}>
                        <div style={{ position: 'relative', paddingLeft: '40px' }}>
                            <div style={{ position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #E2E8F0 0%, var(--primary) 30%, var(--primary) 70%, #E2E8F0 100%)' }} />
                            {[
                                { date: "JULY '25", title: "The Genesis", desc: "Concept & Research Phase. Identifying the 'Trust Gap' in African commerce.", status: "completed" },
                                { date: "SEPT '25", title: "Strategic Architecture", desc: "Core blueprinting of the Kredibly workspace and AI interface flow.", status: "completed" },
                                { date: "DEC '25", title: "Kreddy AI Core", desc: "Intelligence engine development. Teaching Kreddy to understand merchant slang and complex debts.", status: "completed" },
                                { date: "JAN '26", title: "Premium Platform UX", desc: "Rollout of smart telemetry, professional document generators, and cross-device syncing.", status: "completed" },
                                { date: "FEBRUARY - PRESENT", title: "Founding Member Waitlist", desc: "Onboarding our first 1,000 pioneers. Early access rewards and lifetime status for active participants.", status: "active" },
                                { date: "Q2 2026", title: "Global Marketplace Launch", desc: "Opening the ecosystem for public merchant registration and global transactions.", status: "future" },
                                { date: "Q3 2026", title: "Kredibly Mobile (Native)", desc: "Your entire business in your pocket. Offline-first, biometric security, and instant push intelligence.", status: "future" }
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
                .glass-card { background: white; backdrop-filter: blur(20px); border: 1px solid rgba(0,0,0,0.05); transition: 0.3s; }
                .glass-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
                @media (max-width: 1024px) {
                    .phone-mockup { transform: scale(0.9); }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;