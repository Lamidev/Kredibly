import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import { Check, X, Zap, HelpCircle, ArrowRight, ShieldCheck, Sparkles, Mic, UserX, UserCheck, TrendingUp, Wallet } from 'lucide-react';

const PricingPage = () => {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

    useEffect(() => {
        window.scrollTo(0, 0);
        document.title = "Pricing Plans | Kredibly — Hustler, Oga & Chairman Plans";
    }, []);

    const { profile } = useAuth();

    const plans = [
        {
            name: "Hustler",
            slug: "hustler",
            tagline: "The Record-Keeper's Choice",
            description: "Stop writing in notebooks. Start building your digital reputation today.",
            price: "Free",
            fee: "0% Transaction Fees*",
            period: "",
            features: [
                "10 Sale Records limit per Month",
                "Kreddy AI Text Intelligence (Type normally)",
                "Basic Debt Recovery Assistant",
                "Verified Ledger Seal",
                "Digital Receipts (Kredibly Branded)"
            ],
            cta: profile?.plan === "hustler" ? "Current Plan" : "Start Hustling Free",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: false,
            color: "#64748B"
        },
        {
            name: "Oga Plan",
            slug: "oga",
            tagline: "The Business Leader",
            description: "Step up to professional branding and lower fees for your growing business.",
            originalPrice: "₦6,000",
            price: "₦3,000", // 50% Slash
            isSlash: true,
            fee: "0% Transaction Fees*",
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
            price: "₦4,500", // 50% Slash
            isSlash: true,
            fee: "0% Transaction Fees*",
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

    return (
        <div style={{ minHeight: '100vh', background: 'white', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
            <PublicNavbar />
            
            {/* Header - Pioneer Vibe */}
            <section className="pricing-header" style={{ padding: 'clamp(80px, 12vw, 150px) 20px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: '#FDFCFE' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, background: 'radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 70%)' }} />
                
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>GRAND LAUNCH WINDOW (MAY 1 - JUNE 1)</div>
                        <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '24px' }}>
                            Hire Kreddy for <br />
                            <span className="premium-gradient">Less than ₦100 per day.</span>
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: '#64748B', marginBottom: '48px', maxWidth: '800px', margin: '0 auto 48px', fontWeight: 600 }}>
                            Launch Month Special: Get your first <strong>2 months</strong> at 50% off if you join before June 1. Welcome to the Vanguard!
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Street-Smart Comparison Card */}
            <section style={{ padding: '0 24px 80px' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ background: '#0F172A', borderRadius: '32px', padding: '48px', color: 'white', position: 'relative', overflow: 'hidden' }}
                    >
                        <div style={{ position: 'absolute', top: 0, right: 0, padding: '40px', opacity: 0.1 }}><TrendingUp size={120} /></div>
                        
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '40px', textAlign: 'center' }}>"The Street-Smart Choice"</h3>
                            
                            <div className="pricing-comparison-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserX size={20} color="#F87171" /></div>
                                        <span style={{ fontWeight: 950, fontSize: '1.25rem', color: '#F87171' }}>Human Shop Boy</span>
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '1rem', fontWeight: 600, opacity: 0.8 }}>
                                        <li style={{ display: 'flex', gap: '10px' }}>❌ Salary: ~₦30,000 / month</li>
                                        <li style={{ display: 'flex', gap: '10px' }}>❌ Arrives Late & Leaves Early</li>
                                        <li style={{ display: 'flex', gap: '10px' }}>❌ Forgets to record debts</li>
                                        <li style={{ display: 'flex', gap: '10px' }}>❌ "Can I borrow from the till?"</li>
                                    </ul>
                                </div>

                                <div style={{ background: 'rgba(76, 29, 149, 0.2)', padding: '32px', borderRadius: '24px', border: '1px solid var(--primary-glow)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCheck size={20} color="white" /></div>
                                        <span style={{ fontWeight: 950, fontSize: '1.25rem', color: 'white' }}>Kreddy AI (Launch Prices)</span>
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '1rem', fontWeight: 700 }}>
                                        <li style={{ display: 'flex', gap: '10px' }}>✅ Oga: ₦100/day | Chairman: ₦150/day</li>
                                        <li style={{ display: 'flex', gap: '10px' }}>✅ Works 24/7 without sleep</li>
                                        <li style={{ display: 'flex', gap: '10px' }}>✅ Records every kobo accurately</li>
                                        <li style={{ display: 'flex', gap: '10px' }}>✅ Recovers your debts while you sleep</li>
                                    </ul>
                                </div>
                            </div>
                            
                            <p style={{ textAlign: 'center', marginTop: '40px', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                                Kreddy doesn't take lunch breaks. She just tracks money.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Grid */}
            <section style={{ padding: '0 24px 100px', background: '#FDFCFE' }}>
                <div className="pricing-cards-grid" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    {plans.map((plan, i) => (
                        <div key={i} className={plan.highlight ? 'pricing-card-featured' : ''} style={{ 
                            padding: '48px', 
                            borderRadius: '32px', 
                            background: plan.highlight ? '#0F172A' : 'white', 
                            color: plan.highlight ? 'white' : '#0F172A',
                            border: plan.highlight ? '2px solid var(--primary)' : '1px solid #E2E8F0',
                            position: 'relative',
                            transform: plan.highlight ? 'scale(1.02)' : 'none',
                            boxShadow: plan.highlight ? '0 30px 60px -15px rgba(15, 23, 42, 0.3)' : '0 10px 30px -10px rgba(0,0,0,0.02)',
                            zIndex: plan.highlight ? 2 : 1,
                            display: 'flex', flexDirection: 'column'
                        }}>
                            {plan.isSlash && (
                                <div className="pricing-card-badge" style={{ position: 'absolute', top: '24px', right: '32px', background: 'var(--primary)', color: 'white', padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    2-MONTH 50% GRAND OPENING SPECIAL
                                </div>
                            )}
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '8px' }}>{plan.name}</h3>
                            <p style={{ opacity: 0.7, fontSize: '0.95rem', fontWeight: 600, marginBottom: '32px', minHeight: '44px' }}>{plan.description}</p>
                            
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    {plan.isSlash && <span style={{ fontSize: '1.5rem', fontWeight: 700, textDecoration: 'line-through', opacity: 0.4 }}>{plan.originalPrice}</span>}
                                    <span style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-0.05em' }}>{plan.price}</span>
                                    <span style={{ opacity: 0.6, fontWeight: 700 }}>{plan.period}</span>
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 900, color: plan.highlight ? '#4ADE80' : 'var(--primary)', marginTop: '4px' }}>+ {plan.fee}</div>
                            </div>

                            <button 
                                onClick={plan.ctaAction}
                                className={plan.highlight ? "btn-primary" : "btn-secondary"} 
                                style={{ width: '100%', marginBottom: '40px', justifyContent: 'center', height: '60px', borderRadius: '18px', boxShadow: plan.highlight ? '0 10px 20px rgba(124, 58, 237, 0.3)' : 'none' }}
                            >
                                {plan.cta} <ArrowRight size={18} />
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {plan.features.map((feat, j) => (
                                    <div key={j} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 700 }}>
                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: plan.highlight ? 'rgba(255,255,255,0.1)' : 'rgba(76, 29, 149, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Check size={14} color={plan.highlight ? '#4ADE80' : 'var(--primary)'} />
                                        </div>
                                        {feat}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div style={{ marginTop: '60px', textAlign: 'center' }}>
                    <p style={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.9rem' }}>
                        *Transaction fees are absorbed by Kredibly during the beta phase for all pioneers.
                    </p>
                </div>
            </section>

            {/* AI Call to Action */}
            <section style={{ padding: '80px 24px', background: 'white' }}>
                <div className="pricing-cta-box" style={{ maxWidth: '1000px', margin: '0 auto', background: '#F5F3FF', padding: '60px', borderRadius: '48px', border: '1px solid rgba(124, 58, 237, 0.1)', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '24px' }}>Stop bleeding money. <br /><span className="premium-gradient">Get Kreddy today.</span></h2>
                    <p style={{ fontSize: '1.15rem', color: '#4C1D95', fontWeight: 700, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                        Join 200+ Nigerian businesses who have abandoned their notebooks for Kreddy's AI secretary.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '20px 48px', height: 'auto', borderRadius: '20px' }}>Claim My 50% Pioneer Discount</button>
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

                /* ── Mobile Responsive Fixes ── */
                @media (max-width: 768px) {
                    .pricing-comparison-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .pricing-cards-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .pricing-card-featured {
                        transform: none !important;
                    }
                    .pricing-card-badge {
                        position: static !important;
                        display: inline-flex !important;
                        margin-bottom: 16px;
                        font-size: 0.65rem !important;
                    }
                    .pricing-comparison-box {
                        padding: 28px 20px !important;
                    }
                    .pricing-cta-box {
                        padding: 40px 24px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PricingPage;
