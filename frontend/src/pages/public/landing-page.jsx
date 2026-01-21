import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
    Zap,
    ArrowRight,
    MessageCircle,
    Sparkles,
    ShieldCheck,
    CheckCheck,
    LayoutDashboard,
    ChevronDown,
    Building2,
    Briefcase,
    Users,
    User,
    Globe,
    CreditCard,
    Smartphone,
    Menu,
    X,
    Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";

const LandingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Helper to handle smooth scrolling and clean up URL hash
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            // Clean up the URL hash without a full page reload
            window.history.pushState("", document.title, window.location.pathname + window.location.search);
        }
        setIsMobileMenuOpen(false);
    };

    // Auto-scroll to top on mount if no hash exists
    useEffect(() => {
        if (!window.location.hash) {
            window.scrollTo(0, 0);
        }
    }, [location]);

    return (
        <div className="auth-pattern" style={{
            minHeight: '100vh',
            overflowX: 'hidden',
            color: 'var(--text)',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            position: 'relative'
        }}>
            {/* Background Layer */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.03) 0%, transparent 50%)',
                zIndex: 0,
                pointerEvents: 'none'
            }}></div>

            <PublicNavbar />

            {/* Hero Section */}
            <header style={{
                padding: '140px 16px 60px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="hero-badge" style={{ padding: '8px 20px', fontSize: '0.8rem', marginBottom: '32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '100px', fontSize: '0.65rem' }}>NEW</span>
                            <Sparkles size={14} style={{ color: 'var(--primary)' }} /> 
                            <span>AI-Powered Financial OS for Africa</span>
                        </div>
                    </div>

                    <h1 className="hero-title" style={{ fontWeight: 900, marginBottom: '28px' }}>
                        Professionalize Your Hustle.<br />
                        <span className="premium-gradient">Scale Your Business.</span>
                    </h1>

                    <p className="hero-description" style={{ fontWeight: 500, maxWidth: '800px' }}>
                        The smart bridge between casual chat and professional commerce. Use <b>Kreddy AI</b> on WhatsApp to record sales instantly, send <b>premium invoices</b>, and build verifiable financial credibility.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '40px' }}>
                        <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '16px' }}>
                            Create Free Account <ArrowRight size={20} />
                        </button>
                        <button onClick={() => scrollToSection('how-it-works')} className="btn-secondary" style={{ padding: '16px 40px', fontSize: '1.1rem', borderRadius: '16px' }}>
                            Watch Demo
                        </button>
                    </div>

                    <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'center', gap: '40px', opacity: 0.6, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCheck size={18} /> No Card Required</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCheck size={18} /> Set up in 1 Minute</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCheck size={18} /> Free Forever Plan</div>
                    </div>
                </motion.div>
            </header>

            {/* Feature Highlights */}
            <section id="features" style={{ padding: '40px 0', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                    <div className="features-grid">
                        {[
                            { 
                                icon: Sparkles, 
                                color: 'var(--primary)', 
                                title: 'Kreddy AI Assistant', 
                                desc: 'Kreddy uses advanced AI to understand natural chat. Just text "I sold a bag to Sarah for 20k" and consider it logged.' 
                            },
                            { 
                                icon: MessageCircle, 
                                color: '#10B981', 
                                title: 'Smart Debt Recovery', 
                                desc: 'Send automated reminders to debtors with one click. They get a professional message with a direct payment link.' 
                            },
                            { 
                                icon: CreditCard, 
                                color: '#F59E0B', 
                                title: 'Premium Digital Invoices', 
                                desc: 'Impress clients with world-class invoice designs that build trust and encourage faster payments via secure links.' 
                            }
                        ].map((feature, i) => (
                            <motion.div key={i} whileHover={{ y: -5 }} className="glass-card" style={{ padding: '32px', background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <div style={{ background: i === 0 ? 'var(--primary-glow)' : i === 1 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(79, 70, 229, 0.1)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                    <feature.icon color={feature.color} size={28} />
                                </div>
                                <h3 style={{ marginBottom: '12px', fontWeight: 800, fontSize: '1.3rem', color: 'var(--text)' }}>{feature.title}</h3>
                                <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 500 }}>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI-First Workflow Section */}
            <section id="how-it-works" style={{ padding: '60px 20px', position: 'relative', zIndex: 1, background: '#F8FAFC' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 className="section-title">Record Faster. Manage Better.</h2>
                        <p style={{ color: '#6B7280', fontSize: '1.2rem', fontWeight: 500 }}>The perfect harmony between WhatsApp simplicity and Dashboard power.</p>
                    </div>

                    <div className="dual-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '40px',
                        alignItems: 'stretch' // Ensure both columns are equal height
                    }}>
                        {/* WhatsApp Detailed Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            style={{ background: 'white', padding: '48px', borderRadius: '40px', border: '1px solid #E5E7EB', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
                                <div style={{ padding: '12px', borderRadius: '16px', background: 'rgba(37, 211, 102, 0.1)' }}>
                                    <MessageCircle color="#25D366" size={32} />
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 900, fontSize: '1.6rem', marginBottom: '4px' }}>AI Sales Logging</h3>
                                    <p style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: 600 }}>NO APPS NEEDED</p>
                                </div>
                            </div>

                            <div style={{
                                flex: 1, // Fill available space
                                background: '#E5DDD5', 
                                borderRadius: '24px',
                                padding: '20px',
                                minHeight: '400px', // Increased height
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px',
                                marginBottom: '32px',
                                overflow: 'hidden',
                                border: '6px solid #1A1A1A',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                            }}>
                                <div style={{ alignSelf: 'flex-end', maxWidth: '85%', background: '#DCF8C6', padding: '12px', borderRadius: '12px 0 12px 12px', fontSize: '0.85rem', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                                    <p style={{ color: '#111', lineHeight: '1.4' }}>
                                        Hi Kreddy, I just sold a <b>Custom Sofa</b> to <b>Mrs. Smith</b> for <b>₦450,000</b>. She paid <b>₦200k</b> by transfer.
                                    </p>
                                    <p style={{ textAlign: 'right', fontSize: '0.65rem', color: '#666', marginTop: '6px' }}>10:42 <CheckCheck size={12} color="#34B7F1" /></p>
                                </div>
                                <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: 'white', padding: '12px', borderRadius: '0 12px 12px 12px', fontSize: '0.85rem', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                                    <p style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}> <Sparkles size={12}/> Kreddy AI</p>
                                    <p style={{ color: '#111', lineHeight: '1.4' }}>
                                        Got it! Mrs. Smith's record is updated. ✅<br /><br />
                                        💰 <b>Total:</b> ₦450,000<br />
                                        📥 <b>Received:</b> ₦200,000<br />
                                        ⏳ <b>Balance:</b> ₦250,000<br /><br />
                                        I've sent her a <b>Premium Invoice</b> link too! 🚀
                                    </p>
                                </div>
                            </div>
                            <p style={{ fontSize: '1.05rem', color: '#4B5563', lineHeight: 1.6, fontWeight: 500 }}>
                                Chat with Kreddy naturally. No forms, no friction. Just business at the speed of thought.
                            </p>
                        </motion.div>

                        {/* Dashboard Detailed Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}
                        >
                            {/* Main Dashboard Card */}
                            <div className="glass-card" style={{ padding: '40px', background: 'white', border: '1px solid #E5E7EB', flex: 2, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ padding: '12px', borderRadius: '16px', background: 'var(--primary-glow)' }}>
                                        <LayoutDashboard color="var(--primary)" size={32} />
                                    </div>
                                    <h3 style={{ fontWeight: 900, fontSize: '1.6rem' }}>Power Dashboard</h3>
                                </div>
                                <p style={{ color: '#4B5563', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '24px', fontWeight: 500 }}>
                                    Analytics, Inventory, and Debt Tracking—synced in real-time.
                                </p>
                                <div style={{
                                    width: '100%',
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                    marginTop: 'auto' // Push to bottom
                                }}>
                                    <img
                                        src="/dashboard_naira.png"
                                        alt="Kredibly Dashboard"
                                        style={{ width: '100%', height: 'auto', display: 'block' }}
                                    />
                                </div>
                            </div>

                            {/* Two Smaller Cards Side-by-Side to balance visual weight if needed, or keeping stacked but styling to match */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', flex: 1 }}>
                                <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #1E1B4B, #4C1D95)', color: 'white', borderRadius: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <ShieldCheck size={20} color="#10B981" />
                                        <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Financial Identity</h4>
                                    </div>
                                    <p style={{ opacity: 0.9, fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>
                                        Generate verifiable trust reports for loans.
                                    </p>
                                </div>

                                <div className="glass-card" style={{ padding: '24px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <Users size={20} color="var(--primary)" />
                                        <h4 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Team Mode</h4>
                                    </div>
                                    <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.5, fontWeight: 500 }}>
                                        Monitor employee sales in real-time.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" style={{ padding: '80px 20px', background: 'white', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <h2 className="section-title">Scale Without Limits</h2>
                        <p style={{ color: '#6B7280', fontSize: '1.2rem', fontWeight: 500 }}>Start building your financial reputation today for free.</p>
                    </div>

                    <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', maxWidth: '1000px', margin: '0 auto' }}>
                        {/* Free Plan */}
                        <div className="glass-card" style={{ padding: '48px', border: '1.5px solid #F1F5F9', borderRadius: '32px', position: 'relative', background: '#FFFFFF' }}>
                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px' }}>Free Forever</h3>
                                <p style={{ color: '#6B7280', fontSize: '0.95rem', lineHeight: 1.5 }}>For solopreneurs and vendors starting their journey.</p>
                            </div>
                            <div style={{ marginBottom: '40px' }}>
                                <span style={{ fontSize: '4rem', fontWeight: 950, letterSpacing: '-2px' }}>₦0</span>
                                <span style={{ color: '#94A3B8', fontSize: '1.1rem', fontWeight: 600 }}> /month</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {[
                                    "Unlimited AI Sales Records",
                                    "Premium Digital Invoices",
                                    "Real-time Dashboard",
                                    "Financial Trust Score",
                                    "WhatsApp Support"
                                ].map((feature, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: 500, color: '#334155' }}>
                                        <div style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CheckCheck size={14} color="#10B981" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ width: '100%', padding: '18px', borderRadius: '16px', fontSize: '1.1rem' }}>Create Free Account</button>
                        </div>

                        {/* Pro Plan - Coming Soon */}
                        <div className="glass-card" style={{ 
                            padding: '48px', 
                            border: '2px solid var(--primary)', 
                            borderRadius: '32px', 
                            position: 'relative', 
                            background: 'linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 100%)',
                            boxShadow: '0 30px 60px -12px rgba(76, 29, 149, 0.15)'
                        }}>
                            <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                                <span style={{ background: 'var(--primary)', color: 'white', padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>WAITLISTING</span>
                            </div>
                            <div style={{ marginBottom: '32px' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', color: 'var(--primary)' }}>Kredibly Business</h3>
                                <p style={{ color: '#6B7280', fontSize: '0.95rem', lineHeight: 1.5 }}>For growing teams and registered retails.</p>
                            </div>
                            <div style={{ marginBottom: '40px' }}>
                                <span style={{ fontSize: '4rem', fontWeight: 950, letterSpacing: '-2px', color: 'var(--text)' }}>₦--</span>
                                <span style={{ color: '#94A3B8', fontSize: '1.1rem', fontWeight: 600 }}> /month</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {[
                                    "Custom Branding & Logos",
                                    "Multi-user Staff Accounts",
                                    "Inventory Low-stock Alerts",
                                    "Direct POS Integration",
                                    "Dedicated Account Manager"
                                ].map((feature, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1rem', fontWeight: 500, color: '#334155' }}>
                                        <div style={{ minWidth: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CheckCheck size={14} color="var(--primary)" />
                                        </div>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button disabled className="btn-primary" style={{ width: '100%', padding: '18px', borderRadius: '16px', fontSize: '1.1rem', opacity: 0.7, cursor: 'not-allowed' }}>Join the Waitlist</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" style={{ padding: '80px 20px', background: '#F8FAFC', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                        <h2 className="section-title">Common Questions</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        {[
                            { 
                                q: "How does Kreddy AI actually work?", 
                                a: "Kreddy is an AI assistant powered by Google's Gemini. It's integrated into WhatsApp and your dashboard. You can talk to it like a real person to record sales, check your balance, or get support." 
                            },
                            { 
                                q: "Are the invoices professional enough for big clients?", 
                                a: "Absolutely. We've redesigned our invoices to match first-grade startup standards. They include professional layout, your branding, and verifiable payment verification." 
                            },
                            { 
                                q: "What is the 'Verifiable Trust Score'?", 
                                a: "Every successful, confirmed transaction on Kredibly builds your score. This score acts as a digital reputation that you can eventually use to access credit or prove business health." 
                            },
                            { 
                                q: "Is Kredibly really free?", 
                                a: "Yes. The core tools—WhatsApp recording, professional invoices, and basic dashboard features—are free forever. We will introduce 'Pro' features for larger teams later." 
                            }
                        ].map((faq, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                key={idx} 
                                className="glass-card" 
                                style={{ padding: '24px 32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', cursor: 'pointer' }}
                                whileHover={{ scale: 1.01 }}
                            >
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text)' }}>
                                    {faq.q}
                                </h4>
                                <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 500 }}>{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trusted By Section */}
            <section style={{ padding: '60px 20px', background: 'white', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.85rem', fontWeight: 800, color: '#94A3B8', marginBottom: '32px' }}>
                        Empowering the next generation of African Businesses
                    </p>
                    <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        <motion.div 
                            animate={{ x: [0, -1000] }}
                            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                            style={{ display: 'inline-flex', gap: '80px', opacity: 1 }}
                        >
                            {[...Array(3)].map((_, i) => (
                                <React.Fragment key={i}>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#64748B' }}>BOLT</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#64748B' }}>CHOWDECK</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#64748B' }}>PIGGYVEST</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#64748B' }}>PAYSTACK</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#64748B' }}>MONIEPOINT</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#64748B' }}>OPAY</div>
                                </React.Fragment>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            <section style={{ padding: '100px 20px', background: 'white', overflow: 'hidden' }}>
                <div style={{ maxWidth: '100%', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 className="section-title">Trusted by Hustlers</h2>
                        <p style={{ color: '#6B7280', fontSize: '1.2rem', fontWeight: 500 }}>Don't just take our word for it.</p>
                    </div>
                    
                    <div className="marquee-container" style={{ overflow: 'hidden', width: '100%', position: 'relative', maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                        <div className="marquee-track" style={{ display: 'flex', gap: '32px', width: 'max-content' }}>
                            {[
                                ...[
                                    { name: "Chinedu Okafor", role: "Auto Parts Dealer", text: "Before Kredibly, my boys would sell parts and money would miss. Now I get a WhatsApp alert for every screw they sell." },
                                    { name: "Aisha Bello", role: "Fashion Designer", text: "Sending reminders to clients for money was so awkward. Now I just click 'Remind' and Kreddy sends a professional message." },
                                    { name: "Tunde Bakare", role: "Gadget Vendor", text: "The invoices look so professional. My corporate clients stopped asking 'is this a real business?' trust score is practically a CV." },
                                    { name: "Ibrahim Musa", role: "Electronics", text: "I can finally take a vacation knowing my shop is running. The Oga Mode alerts keep me in the loop 24/7." },
                                    { name: "Sarah K.", role: "Online Vendor", text: "The 'No App' thing is a lifesaver. I just chat with Kreddy and my inventory is updated. Magic." }
                                ],
                                ...[
                                    { name: "Chinedu Okafor", role: "Auto Parts Dealer", text: "Before Kredibly, my boys would sell parts and money would miss. Now I get a WhatsApp alert for every screw they sell." },
                                    { name: "Aisha Bello", role: "Fashion Designer", text: "Sending reminders to clients for money was so awkward. Now I just click 'Remind' and Kreddy sends a professional message." },
                                    { name: "Tunde Bakare", role: "Gadget Vendor", text: "The invoices look so professional. My corporate clients stopped asking 'is this a real business?' trust score is practically a CV." },
                                    { name: "Ibrahim Musa", role: "Electronics", text: "I can finally take a vacation knowing my shop is running. The Oga Mode alerts keep me in the loop 24/7." },
                                    { name: "Sarah K.", role: "Online Vendor", text: "The 'No App' thing is a lifesaver. I just chat with Kreddy and my inventory is updated. Magic." }
                                ]
                            ].map((review, i) => (
                                <div key={i} className="glass-card review-card" style={{ 
                                    padding: '32px', 
                                    background: '#F8FAFC', 
                                    border: '1px solid #E2E8F0', 
                                    borderRadius: '24px',
                                    minWidth: '350px',
                                    maxWidth: '350px',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                                        {[...Array(5)].map((_, j) => <div key={j} style={{ color: '#F59E0B' }}>★</div>)}
                                    </div>
                                    <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#334155', marginBottom: '24px', fontStyle: 'italic' }}>"{review.text}"</p>
                                    <div>
                                        <h4 style={{ fontWeight: 800, color: 'var(--text)' }}>{review.name}</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>{review.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '60px 20px 100px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    maxWidth: '1100px', margin: '0 auto', background: 'linear-gradient(135deg, #1E1B4B 0%, #4C1D95 100%)',
                    padding: '100px 40px', borderRadius: '48px', color: 'white', textAlign: 'center',
                    boxShadow: '0 40px 100px -20px rgba(76, 29, 149, 0.4)', position: 'relative', overflow: 'hidden'
                }}>
                    {/* Decorative Elements */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'rgba(255,107,53,0.1)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
                    <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '300px', height: '300px', background: 'rgba(76,29,149,0.3)', filter: 'blur(80px)', borderRadius: '50%' }}></div>

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 950, marginBottom: '28px', letterSpacing: '-2px', lineHeight: 1 }}>Ready to level up your business?</h2>
                        <p style={{ fontSize: '1.3rem', opacity: 0.9, maxWidth: '700px', margin: '0 auto 56px', fontWeight: 500, lineHeight: 1.6 }}>
                            Join thousands of African entrepreneurs turning their daily hustle into a structured, credible empire. 
                        </p>
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ padding: '22px 56px', borderRadius: '20px', fontSize: '1.3rem', background: 'white', color: 'var(--primary)', border: 'none' }}>
                                Build Your Empire Now
                            </button>
                        </div>
                        <p style={{ marginTop: '32px', fontSize: '1rem', opacity: 0.7, fontWeight: 500 }}>
                            No credit card required. Cancel anytime.
                        </p>
                    </div>
                </div>
            </section>

            <PublicFooter />

            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .marquee-track {
                    animation: scroll 60s linear infinite;
                }
                .marquee-track:hover {
                    animation-play-state: paused;
                }
                .review-card:hover {
                    transform: scale(1.05); /* Pop up effect */
                    background: white !important;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
                    z-index: 10;
                }
                @media (max-width: 768px) {
                    .hero-title { font-size: 2.2rem !important; }
                    .features-grid, .dual-grid, .pricing-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
                    .features-grid .glass-card, .dual-grid .glass-card, .pricing-grid .glass-card { padding: 24px !important; }
                    /* Make review cards smaller on mobile */
                    .review-card { min-width: 280px !important; max-width: 280px !important; padding: 20px !important; }
                    .section-title { font-size: 2rem !important; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;