import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, Mail, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';

const PrivacyPolicy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const sections = [
        { id: 'introduction', title: '1. Introduction', icon: FileText },
        { id: 'data-collection', title: '2. Information We Collect', icon: Eye },
        { id: 'security', title: '3. Bank-Grade Security', icon: Lock },
        { id: 'contact', title: '4. Contact Support', icon: Mail }
    ];

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -100;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
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
            
            {/* Executive Hero Section - Matching Landing Page Style */}
            <header style={{
                padding: '180px 20px 100px',
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
                    <div className="hero-badge">
                        <Shield size={16} style={{ marginRight: '8px' }} />
                        TRUST & TRANSPARENCY
                    </div>
                    <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 950, letterSpacing: '-0.05em' }}>
                        Your Safety. <br />
                        <span style={{ color: 'var(--primary)', fontWeight: 950 }}>Our Priority.</span>
                    </h1>
                    <p className="hero-description" style={{ fontSize: '1.3rem', maxWidth: '750px', margin: '0 auto 40px' }}>
                        Kredibly is built on a foundation of absolute privacy. We treat your business data with the 
                        same rigor as a global financial institution.
                    </p>
                </motion.div>
            </header>

            <main style={{
                maxWidth: '1250px',
                margin: '0 auto 120px',
                padding: '0 24px',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 340px',
                gap: '80px',
                alignItems: 'start'
            }} className="desktop-grid">
                
                {/* Main Legal Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
                    
                    <motion.section 
                        id="introduction"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ background: 'rgba(76, 29, 149, 0.05)', padding: '16px', borderRadius: '20px', color: 'var(--primary)', border: '1px solid rgba(76, 29, 149, 0.1)' }}>
                                <FileText size={28} />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>Introduction</h2>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '1.15rem', lineHeight: 1.8, fontWeight: 500 }}>
                            <p style={{ marginBottom: '24px' }}>
                                At Kredibly, we respect your privacy and are committed to protecting your personal data. 
                                This policy informs you of our practices regarding the collection, use, and disclosure of 
                                personal data when you use our Service and the choices you have associated with that data.
                            </p>
                            <p>
                                By utilizing Kredibly, you agree to the collection and use of information in accordance 
                                with this Policy. We only collect the data necessary to provide a professional, 
                                automated experience for your business.
                            </p>
                        </div>
                    </motion.section>

                    <motion.section 
                        id="data-collection"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '20px', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                <Eye size={28} />
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>Data Collection</h2>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                            {[
                                { title: "Business Identity", desc: "Official name, business category, and your display settings for professional invoicing." },
                                { title: "Interaction History", desc: "Message context from WhatsApp to accurately record your sales and debts using Kreddy AI." },
                                { title: "Merchant Contacts", desc: "Verified WhatsApp numbers for routing mission-critical business alerts and reminders." },
                                { title: "Financial Ledger", desc: "Debt balances and customer names to manage your proactive notifications and scores." }
                            ].map((item, i) => (
                                <div key={i} className="glass-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <h4 style={{ fontWeight: 900, marginBottom: '4px', fontSize: '1.2rem', color: 'var(--text)' }}>{item.title}</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.6 }}>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.section>

                    <motion.section 
                        id="security"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{ 
                            background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)',
                            borderRadius: '48px',
                            padding: '80px 60px',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 40px 80px -20px rgba(15, 23, 42, 0.4)'
                        }}>
                            <div className="pattern-dots" style={{ opacity: 0.1 }} />
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                                    <Lock size={24} color="#10B981" />
                                    <span style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.8rem', opacity: 0.8, textTransform: 'uppercase' }}>Security Protocol</span>
                                </div>
                                <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 950, marginBottom: '24px', letterSpacing: '-0.04em' }}>Bank-Grade Protection</h2>
                                <p style={{ fontSize: '1.25rem', opacity: 0.7, fontWeight: 500, lineHeight: 1.6, maxWidth: '650px', marginBottom: '48px' }}>
                                    Your business intelligence is protected with AES-256 encryption and processed through 
                                    isolated security layers. We never compromise on your data safety.
                                </p>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.95rem', fontWeight: 800 }}>🛡️ End-to-End Encrypted</div>
                                    <div style={{ padding: '14px 28px', background: 'rgba(255,255,255,0.06)', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.95rem', fontWeight: 800 }}>🔓 GDPR & NDPR Ready</div>
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section 
                        id="contact"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', padding: '80px 0', background: 'rgba(255,255,255,0.5)', borderRadius: '48px', border: '1px solid rgba(0,0,0,0.03)' }}
                    >
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '20px' }}>Need further clarity?</h2>
                        <p className="hero-description" style={{ marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
                            Our data protection team is standing by to assist with any technical or legal queries 
                            regarding your privacy.
                        </p>
                        <a href="mailto:support@usekredibly.com" className="btn-primary" style={{ padding: '24px 64px', fontSize: '1.2rem' }}>
                            Contact Privacy Team <ArrowRight size={22} />
                        </a>
                    </motion.section>

                </div>

                {/* Executive Side Navigation */}
                <aside className="desktop-only-sticky">
                    <div className="glass-card" style={{ padding: '48px 40px', background: 'white', borderRadius: '40px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.04)' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '40px', textTransform: 'uppercase' }}>Quick Navigation</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className="legal-nav-item"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '16px 0',
                                        width: '100%',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                        textAlign: 'left',
                                        borderBottom: '1px solid rgba(0,0,0,0.04)'
                                    }}
                                >
                                    <span>{section.title}</span>
                                    <ChevronRight size={18} />
                                </button>
                            ))}
                        </div>
                        <div style={{ marginTop: '48px', padding: '28px', background: 'rgba(76, 29, 149, 0.04)', borderRadius: '24px', border: '1px solid rgba(76, 29, 149, 0.05)' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', lineHeight: 1.6 }}>
                                Last Revision: <br />
                                January 24, 2026. <br />
                                <span style={{ opacity: 0.6 }}>Governance v1.02</span>
                            </p>
                        </div>
                    </div>
                </aside>
            </main>

            <PublicFooter />

            <style>{`
                .legal-nav-item:hover {
                    color: var(--primary) !important;
                    padding-left: 12px !important;
                }
                @media (max-width: 1024px) {
                    .desktop-grid {
                        grid-template-columns: 1fr !important;
                        gap: 60px !important;
                    }
                    aside {
                        display: none !important;
                    }
                }
                @media (max-width: 640px) {
                    header {
                        padding: 140px 20px 60px !important;
                    }
                    main {
                        margin-bottom: 60px !important;
                    }
                    .section-title {
                        font-size: 2rem !important;
                    }
                    .glass-card {
                        padding: 24px !important;
                    }
                    #security > div {
                        padding: 40px 24px !important;
                        border-radius: 32px !important;
                    }
                    #contact {
                        padding: 40px 20px !important;
                        border-radius: 32px !important;
                    }
                    div[style*="gap: 80px"] {
                        gap: 48px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PrivacyPolicy;
