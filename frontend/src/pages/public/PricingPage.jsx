import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import { Check, X, Zap, ArrowRight, Star, Sparkles, BadgeCheck } from 'lucide-react';

const PricingPage = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Pricing Plans | Kredibly — Hustler, Oga & Chairman Plans";
    }, []);

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
                "10 Sale Records limit per Month",
                "Kreddy AI Text Intelligence",
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
            description: "Step up to professional branding and AI voice recording for your business.",
            price: "₦5,000", 
            isPopular: true,
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
            isFounding: true,
            fee: "Zero Transfer Fees*",
            period: "/ month",
            features: [
                "Everything in Oga Plan",
                "White-Label Receipts (Only Your Logo)",
                "Up to 3 Staff & Offices",
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

    return (
        <div style={{ minHeight: '100vh', background: 'white', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
            <PublicNavbar />
            
            {/* Header - Premium Vibe */}
            <section className="pricing-header" style={{ padding: 'clamp(80px, 12vw, 150px) 20px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: '#FDFCFE' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, background: 'radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 70%)' }} />
                
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '24px' }}>
                            Simple Pricing.<br />
                            <span className="premium-gradient">Unlimited Growth.</span>
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: '#64748B', marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px', fontWeight: 600 }}>
                            Choose the plan that fits your ambition. No hidden bank charges, no transaction commissions — just pure business power.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Grid */}
            <section style={{ padding: '40px 24px 100px', background: '#FDFCFE' }}>
                <div className="pp-pricing-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {plans.map((plan, i) => (
                        <div key={i} className={`pp-pricing-card ${plan.highlight ? 'pp-pricing-card--featured' : ''}`} style={{ position: 'relative' }}>
                            {plan.isPopular && (
                                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(76, 29, 149, 0.2)' }}>
                                    MOST POPULAR
                                </div>
                            )}
                            
                            <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 900, marginBottom: '8px' }}>{plan.name}</h3>
                            <p style={{ opacity: 0.7, fontSize: '0.9rem', fontWeight: 600, marginBottom: '24px', lineHeight: 1.5 }}>{plan.description}</p>
                            
                            <div style={{ marginBottom: '32px' }}>
                                <div className="pp-price-row">
                                    <span className="pp-price-main">{plan.price}</span>
                                    <span className="pp-price-period">{plan.period}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: plan.highlight ? '#4ADE80' : 'var(--primary)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Star size={14} fill={plan.highlight ? '#4ADE80' : 'var(--primary)'} />
                                    {plan.fee}
                                </div>
                            </div>

                            <button 
                                onClick={plan.ctaAction}
                                className={plan.highlight ? "btn-primary" : "btn-secondary"} 
                                style={{ width: '100%', marginBottom: '32px', justifyContent: 'center', height: '58px', borderRadius: '18px', fontSize: '1rem', fontWeight: 900, boxShadow: plan.highlight ? '0 15px 30px -5px rgba(124, 58, 237, 0.4)' : 'none' }}
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
                
                <div style={{ marginTop: '60px', textAlign: 'center', maxWidth: '800px', margin: '60px auto 0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 800, fontSize: '0.95rem', background: 'rgba(22, 163, 74, 0.05)', padding: '14px 28px', borderRadius: '100px', border: '1px solid rgba(22, 163, 74, 0.1)' }}>
                        <BadgeCheck size={20} /> WE COVER YOUR BANK CHARGES — Zero transfer fees on payouts.
                    </div>
                </div>
            </section>

            {/* Compare All Plans Section */}
            <section style={{ padding: '80px 24px', background: 'white' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '16px' }}>Compare All Plans</h2>
                        <p style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: 600 }}>Professional tools for professional businesses.</p>
                    </div>

                    <div style={{ overflowX: 'auto', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', minWidth: '800px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: '32px 24px', textAlign: 'left', fontSize: '1.1rem', fontWeight: 800, width: '30%', background: '#F8FAFC' }}>Features</th>
                                    <th style={{ padding: '32px 24px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, background: '#F8FAFC' }}>Hustler</th>
                                    <th style={{ padding: '32px 24px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, background: 'var(--primary)', color: 'white' }}>Oga Plan</th>
                                    <th style={{ padding: '32px 24px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 800, background: '#F8FAFC' }}>Chairman</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { category: "Infrastructure & AI", features: [
                                        { name: "WhatsApp AI Assistant (Text)", hustler: true, oga: true, chairman: true },
                                        { name: "Kreddy Voice Assistant", hustler: false, oga: true, chairman: true },
                                        { name: "Instant Bank Settlements", hustler: true, oga: true, chairman: true },
                                        { name: "Morning Business Briefing", hustler: false, oga: false, chairman: true },
                                        { name: "Automated Ledger Sync", hustler: true, oga: true, chairman: true }
                                    ]},
                                    { category: "Business Management", features: [
                                        { name: "Sales Records Limit", hustler: "10 / mo", oga: "Unlimited", chairman: "Unlimited" },
                                        { name: "Staff Members", hustler: "0", oga: "1", chairman: "3" },
                                        { name: "Multi-Office / Branches", hustler: false, oga: false, chairman: true },
                                        { name: "WhatsApp Image Sync", hustler: false, oga: false, chairman: true }
                                    ]},
                                    { category: "Receipts & Branding", features: [
                                        { name: "Digital Receipts", hustler: true, oga: true, chairman: true },
                                        { name: "Custom Logo on Receipts", hustler: false, oga: true, chairman: true },
                                        { name: "White-Label (No Kredibly Brand)", hustler: false, oga: false, chairman: true }
                                    ]},
                                    { category: "Recovery Engine", features: [
                                        { name: "Basic Debt Reminders", hustler: true, oga: true, chairman: true },
                                        { name: "Advanced AI Recovery Assistant", hustler: false, oga: true, chairman: true },
                                        { name: "Automated Debt Tracking", hustler: true, oga: true, chairman: true }
                                    ]},
                                    { category: "Support & ROI", features: [
                                        { name: "Zero Transfer Fees on Payouts", hustler: true, oga: true, chairman: true },
                                        { name: "Priority Vault Access", hustler: false, oga: false, chairman: true },
                                        { name: "Dedicated Support", hustler: false, oga: "Standard", chairman: "Priority" }
                                    ]}
                                ].map((cat, i) => (
                                    <React.Fragment key={i}>
                                        <tr style={{ background: '#F1F5F9' }}>
                                            <td colSpan="4" style={{ padding: '16px 24px', fontWeight: 800, fontSize: '0.85rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.category}</td>
                                        </tr>
                                        {cat.features.map((f, j) => (
                                            <tr key={j} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                                <td style={{ padding: '20px 24px', fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>{f.name}</td>
                                                <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                    {typeof f.hustler === 'boolean' ? (f.hustler ? <Check size={20} color="#10B981" style={{ margin: '0 auto' }} /> : <X size={20} color="#CBD5E1" style={{ margin: '0 auto' }} />) : <span style={{ fontWeight: 800, color: '#0F172A' }}>{f.hustler}</span>}
                                                </td>
                                                <td style={{ padding: '20px 24px', textAlign: 'center', background: 'rgba(124, 58, 237, 0.02)' }}>
                                                    {typeof f.oga === 'boolean' ? (f.oga ? <Check size={20} color="var(--primary)" style={{ margin: '0 auto' }} /> : <X size={20} color="#CBD5E1" style={{ margin: '0 auto' }} />) : <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{f.oga}</span>}
                                                </td>
                                                <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                                                    {typeof f.chairman === 'boolean' ? (f.chairman ? <Check size={20} color="#10B981" style={{ margin: '0 auto' }} /> : <X size={20} color="#CBD5E1" style={{ margin: '0 auto' }} />) : <span style={{ fontWeight: 800, color: '#0F172A' }}>{f.chairman}</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* AI Call to Action */}
            <section style={{ padding: '80px 24px', background: 'white' }}>
                <div className="pricing-cta-box" style={{ maxWidth: '1000px', margin: '0 auto', background: '#F5F3FF', padding: '60px', borderRadius: '48px', border: '1px solid rgba(124, 58, 237, 0.1)', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '24px' }}>Build your empire. <br /><span className="premium-gradient">Try Chairman Free.</span></h2>
                    <p style={{ fontSize: '1.15rem', color: '#4C1D95', fontWeight: 700, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                        Get 14 days of unlimited staff, AI voice notes, and executive briefings. Switch to any plan anytime.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '20px 48px', height: 'auto', borderRadius: '20px' }}>Start My 14-Day Free Trial</button>
                    </div>
                </div>
            </section>

            <PublicFooter />

            <style>{`
                .premium-gradient {
                    background: linear-gradient(135deg, var(--primary) 0%, #F472B6 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                /* ── Pricing Grid ── */
                .pp-pricing-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 32px;
                    align-items: start;
                }
                .pp-pricing-card {
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
                .pp-pricing-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.06);
                }
                .pp-pricing-card--featured {
                    background: #0F172A;
                    color: white;
                    border: 2px solid var(--primary);
                    box-shadow: 0 20px 50px -10px rgba(15,23,42,0.3);
                }
                .pp-price-row {
                    display: flex;
                    align-items: baseline;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .pp-price-main {
                    font-size: clamp(2rem, 4vw, 3.2rem);
                    font-weight: 950;
                    letter-spacing: -0.04em;
                    line-height: 1;
                }
                .pp-price-period {
                    opacity: 0.6;
                    font-weight: 700;
                    font-size: 1rem;
                }

                @media (max-width: 1000px) {
                    .pp-pricing-grid {
                        grid-template-columns: 1fr;
                        max-width: 480px;
                        margin: 0 auto;
                    }
                }
                @media (max-width: 768px) {
                    .pricing-cta-box {
                        padding: 36px 20px !important;
                    }
                    .pricing-header h1 {
                        font-size: clamp(2.2rem, 8vw, 3.5rem) !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PricingPage;
