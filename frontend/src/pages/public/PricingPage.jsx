import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import { Check, X, Zap, HelpCircle, ArrowRight, ShieldCheck, Sparkles, Mic, Wallet, BadgeCheck } from 'lucide-react';

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

    return (
        <div style={{ minHeight: '100vh', background: 'white', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
            <PublicNavbar />
            
            {/* Header - Pioneer Vibe */}
            <section className="pricing-header" style={{ padding: 'clamp(80px, 12vw, 150px) 20px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: '#FDFCFE' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, background: 'radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 70%)' }} />
                
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>PIONEER LAUNCH (SUBSIZED RATES)</div>
                        <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '24px' }}>
                            Simple Pricing.<br />
                            <span className="premium-gradient">Zero Hidden Fees.</span>
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: '#64748B', marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px', fontWeight: 600 }}>
                            Join during our Grand Launch and lock in <strong>subsidized rates</strong> forever. No hidden bank charges — we cover your ₦25 transfer fees.
                        </p>
                    </motion.div>
                </div>
            </section>


            {/* Pricing Grid */}
            <section style={{ padding: '40px 24px 100px', background: '#FDFCFE' }}>
                <div className="pp-pricing-grid" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {plans.map((plan, i) => (
                        <div key={i} className={`pp-pricing-card ${plan.highlight ? 'pp-pricing-card--featured' : ''}`}>
                            {/* Badge ABOVE plan name */}
                            {plan.isSlash && (
                                <div className="pp-pricing-badge">
                                    🎉 Limited Time Pioneer Offer
                                </div>
                            )}
                            <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 900, marginBottom: '8px' }}>{plan.name}</h3>
                            <p style={{ opacity: 0.7, fontSize: '0.9rem', fontWeight: 500, marginBottom: '24px' }}>{plan.description}</p>
                            
                            <div style={{ marginBottom: '32px' }}>
                                <div className="pp-price-row">
                                    <span className="pp-price-original">{plan.originalPrice}</span>
                                    <span className="pp-price-main">{plan.price}</span>
                                    <span className="pp-price-period">{plan.period}</span>
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: plan.highlight ? 'white' : 'var(--primary)', marginTop: '4px' }}>{plan.fee}</div>
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
                
                <div style={{ marginTop: '60px', textAlign: 'center', maxWidth: '800px', margin: '60px auto 0' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 800, fontSize: '1rem', background: 'rgba(22, 163, 74, 0.05)', padding: '12px 24px', borderRadius: '100px' }}>
                        <BadgeCheck size={20} /> WE COVER YOUR BANK CHARGES — No ₦25 transfer fees on payouts.
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
                    gap: 24px;
                    align-items: start;
                }
                .pp-pricing-card {
                    padding: 40px;
                    border-radius: 28px;
                    background: white;
                    color: #0F172A;
                    border: 1px solid #E2E8F0;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.04);
                }
                .pp-pricing-card--featured {
                    background: #0F172A;
                    color: white;
                    border: 2px solid var(--primary);
                    box-shadow: 0 20px 50px -10px rgba(15,23,42,0.3);
                }
                .pp-pricing-badge {
                    display: inline-flex;
                    align-items: center;
                    background: var(--primary);
                    color: white;
                    padding: 5px 12px;
                    border-radius: 100px;
                    font-size: 0.72rem;
                    font-weight: 800;
                    margin-bottom: 14px;
                    width: fit-content;
                }
                .pp-price-row {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .pp-price-original {
                    font-size: 1.1rem;
                    font-weight: 700;
                    text-decoration: line-through;
                    opacity: 0.4;
                }
                .pp-price-main {
                    font-size: clamp(1.8rem, 4vw, 2.8rem);
                    font-weight: 950;
                    letter-spacing: -0.04em;
                    line-height: 1;
                }
                .pp-price-period {
                    opacity: 0.6;
                    font-weight: 600;
                    font-size: 0.9rem;
                }

                @media (max-width: 900px) {
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
                        font-size: clamp(2rem, 8vw, 3.5rem) !important;
                    }
                    .pricing-header p {
                        font-size: clamp(0.85rem, 3.5vw, 1.1rem) !important;
                    }
                }
                @media (max-width: 480px) {
                    .pp-pricing-card, .pp-pricing-card--featured {
                        padding: 24px 20px !important;
                    }
                    .pp-pricing-badge {
                        font-size: 0.62rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default PricingPage;
