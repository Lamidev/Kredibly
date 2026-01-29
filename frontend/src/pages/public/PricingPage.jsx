import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Zap, HelpCircle } from 'lucide-react';

const PricingPage = () => {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const { profile } = useAuth();
    const isFoundingPhase = false; // Hide from public UI as per new strategy

    const getPrice = (basePrice) => {
        if (typeof basePrice !== 'number') return basePrice;
        const price = billingCycle === 'yearly' ? basePrice * 0.9 : basePrice;
        return `₦${Math.round(price).toLocaleString()}`;
    };

    const plans = [
        {
            name: "Hustler",
            slug: "hustler",
            tagline: "The Beginner's Tool",
            description: "Stop losing money to forgotten records. Start tracking today.",
            price: "Free",
            period: "",
            features: [
                "Basic AI Assistant",
                "20 Sales Records / month",
                "Basic WhatsApp Hub",
                "Standard Debt Tracking",
                "Web Dashboard Access"
            ],
            cta: profile?.plan === "hustler" ? "Current Plan" : "Get Started",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: false,
            color: "#64748B"
        },
        {
            name: "Oga Plan",
            slug: "oga",
            tagline: "Most Popular",
            description: "Your business partner that never forgets.",
            price: getPrice(7000),
            originalPrice: getPrice(7000),
            discountPrice: null,
            isFoundingMember: false,
            period: "/ month",
            features: [
                "Super Smart AI",
                "2,000 WhatsApp Msgs / mo",
                "Add up to 2 Staff Members",
                "Unlimited Smart Recording",
                "Automated Debt Reminders",
                "Branded WhatsApp Invoices"
            ],
            cta: profile?.plan === "oga" ? "Current Plan" : profile ? "Upgrade Now" : "Become an Oga",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: true,
            color: "var(--primary)"
        },
        {
            name: "Chairman",
            slug: "chairman",
            tagline: "Run multiple shops without stress.",
            description: "Let Kreddy handle the chaos. Pure peace for the empire.",
            price: getPrice(30000),
            originalPrice: getPrice(30000),
            discountPrice: null,
            isFoundingMember: false,
            period: "/ month",
            features: [
                "Everything in Oga Plan",
                "10,000 WhatsApp Msgs / mo",
                "Voice Note Recording",
                "Multi-Staff / Multi-Shop",
                "Weekly Business Insights",
                "Dedicated Digital Manager"
            ],
            cta: profile?.plan === "chairman" ? "Current Plan" : profile ? "Upgrade Now" : "Lead Your Empire",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: false,
            color: "#0F172A"
        }
    ];

    const comparisonFeatures = [
        { name: "Sales Recording", free: "20/mo", pro: "Unlimited", ent: "Unlimited" },
        { name: "Staff Members", free: "1 (You)", pro: "Up to 3 (You + 2)", ent: "Unlimited" },
        { name: "WhatsApp Messages", free: "Standard", pro: "2,000 included", ent: "10,000 included" },
        { name: "Assistant Type", free: "Basic AI", pro: "Super Smart AI", ent: "Super Smart AI" },
        { name: "Voice Notes", free: false, pro: false, ent: true },
        { name: "Data Export", free: false, pro: true, ent: true },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'white', color: 'var(--text)' }}>
            <PublicNavbar />
            
            {/* Header */}
            <section style={{ paddingTop: '180px', paddingBottom: '80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div className="pattern-dots" />
                <div style={{ position: 'relative', zIndex: 10, padding: '0 20px' }}>
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', border: '1px solid rgba(76, 29, 149, 0.1)' }}>
                            <Zap size={16} fill="currentColor" />
                            SPECIAL PIONEER PRICING ENDS SOON
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '24px' }}>
                            The smart assistant <br />
                            <span style={{ color: 'var(--primary)' }}>for your empire.</span>
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
                            Join today and get <span style={{ color: 'var(--text)', fontWeight: 700 }}>7 Days of Oga Plan for FREE.</span> <br />
                            Experience the full power of Kreddy AI.
                        </p>

                        {/* Billing Toggle */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F1F5F9', padding: '6px', borderRadius: '100px', position: 'relative' }}>
                            <button 
                                onClick={() => setBillingCycle('monthly')}
                                style={{ 
                                    padding: '12px 24px', 
                                    borderRadius: '100px', 
                                    border: 'none', 
                                    background: billingCycle === 'monthly' ? 'white' : 'transparent', 
                                    color: billingCycle === 'monthly' ? 'var(--text)' : '#64748B', 
                                    fontWeight: 700, 
                                    cursor: 'pointer',
                                    boxShadow: billingCycle === 'monthly' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                Monthly
                            </button>
                            <button 
                                onClick={() => setBillingCycle('yearly')}
                                style={{ 
                                    padding: '12px 24px', 
                                    borderRadius: '100px', 
                                    border: 'none', 
                                    background: billingCycle === 'yearly' ? 'white' : 'transparent', 
                                    color: billingCycle === 'yearly' ? 'var(--text)' : '#64748B', 
                                    fontWeight: 700, 
                                    cursor: 'pointer',
                                    boxShadow: billingCycle === 'yearly' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                    transition: 'all 0.2s ease',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                Yearly <span style={{ fontSize: '0.7rem', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '10px' }}>SAVE 10%</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section style={{ padding: '0 20px 100px' }}>
                <div className="pricing-grid" style={{ 
                    maxWidth: '1200px', 
                    margin: '0 auto', 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                    gap: '32px', 
                    alignItems: 'flex-start' 
                }}>
                    {plans.map((plan, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{ 
                                padding: '40px 32px', 
                                borderRadius: '32px', 
                                border: plan.highlight ? 'none' : '1px solid #E2E8F0',
                                background: plan.highlight ? 'var(--text)' : 'white',
                                color: plan.highlight ? 'white' : 'var(--text)',
                                position: 'relative',
                                boxShadow: plan.highlight ? '0 30px 60px -15px rgba(0,0,0,0.1)' : '0 10px 30px -10px rgba(0,0,0,0.05)',
                                zIndex: plan.highlight ? 2 : 1
                            }}
                            className={`glass-card ${plan.highlight ? 'highlight-card' : ''}`}
                        >
                            {plan.highlight && (
                                <div style={{ position: 'absolute', top: '32px', right: '32px', background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>
                                    RECOMMENDED
                                </div>
                            )}
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>{plan.name}</h3>
                            <p style={{ opacity: 0.7, marginBottom: '32px', minHeight: '48px', fontWeight: 500 }}>{plan.description}</p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '32px' }}>
                                {plan.isFoundingMember ? (
                                    <>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                            <span style={{ fontSize: '1.25rem', color: plan.highlight ? 'rgba(255,255,255,0.6)' : '#94A3B8', textDecoration: 'line-through', fontWeight: 600 }}>{plan.originalPrice}</span>
                                            <span style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-0.05em' }}>{plan.discountPrice}</span>
                                            <span style={{ opacity: 0.7, fontWeight: 500 }}>{plan.period}</span>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: plan.highlight ? '#4ADE80' : '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Zap size={12} fill="currentColor" /> FOUNDING MEMBER PRICE (-25%)
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <span style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-0.05em' }}>{plan.price}</span>
                                        <span style={{ opacity: 0.7, fontWeight: 500 }}>{plan.period}</span>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={plan.ctaAction}
                                className={plan.highlight ? "btn-primary" : "btn-secondary"} 
                                style={{ 
                                    width: '100%', 
                                    justifyContent: 'center', 
                                    marginBottom: '40px',
                                    background: plan.highlight ? 'white !important' : '#F1F5F9',
                                    color: plan.highlight ? 'black !important' : 'var(--text)',
                                    border: 'none'
                                }}
                            >
                                {plan.cta}
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {plan.features.map((feat, j) => (
                                    <div key={j} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.95rem', fontWeight: 500 }}>
                                        <div style={{ 
                                            width: '24px', height: '24px', borderRadius: '50%', 
                                            background: plan.highlight ? 'rgba(255,255,255,0.2)' : 'rgba(76, 29, 149, 0.1)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                                        }}>
                                            <Check size={14} color={plan.highlight ? 'white' : 'var(--primary)'} />
                                        </div>
                                        {feat}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Feature Comparison Table (Desktop Only mostly) */}
            <section style={{ padding: '80px 20px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Compare Features</h2>
                    </div>

                    <div style={{ overflowX: 'auto', borderRadius: '24px', background: 'white', border: '1px solid #E2E8F0', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <th style={{ textAlign: 'left', padding: '24px', width: '30%' }}></th>
                                    <th style={{ padding: '24px', fontWeight: 800 }}>Hustler</th>
                                    <th style={{ padding: '24px', fontWeight: 800, color: 'var(--primary)' }}>Oga</th>
                                    <th style={{ padding: '24px', fontWeight: 800 }}>Chairman</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonFeatures.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: i === comparisonFeatures.length - 1 ? 'none' : '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '24px', fontWeight: 600 }}>{row.name}</td>
                                        <td style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                                            {typeof row.free === 'boolean' ? (row.free ? <Check size={20} color="var(--primary)" style={{margin:'auto'}} /> : <X size={20} color="#94A3B8" style={{margin:'auto'}} />) : row.free}
                                        </td>
                                        <td style={{ padding: '24px', textAlign: 'center', fontWeight: 700, background: 'rgba(76,29,149,0.02)' }}>
                                            {typeof row.pro === 'boolean' ? (row.pro ? <Check size={20} color="var(--primary)" style={{margin:'auto'}} /> : <X size={20} color="#94A3B8" style={{margin:'auto'}} />) : row.pro}
                                        </td>
                                        <td style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                                            {typeof row.ent === 'boolean' ? (row.ent ? <Check size={20} color="var(--primary)" style={{margin:'auto'}} /> : <X size={20} color="#94A3B8" style={{margin:'auto'}} />) : row.ent}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ Area */}
            <section style={{ padding: '100px 20px' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '48px', textAlign: 'center' }}>Frequently Asked Questions</h2>
                    <div style={{ display: 'grid', gap: '24px' }}>
                        {[
                            { q: "Do I need to pay to add staff?", a: "On the Hustler (Free) plan, you get 1 user. To add staff members who can record sales for you, you'll need the Oga plan which includes up to 2 staff members (3 total users)." },
                            { q: "Can I cancel anytime?", a: "Absolutely. There are no contracts. You can switch back to the Free plan whenever you like." },
                            { q: "Is my data safe?", a: "Yes. We use bank-grade AES-256 encryption. Your business data is visible only to you and your authorized staff." }
                        ].map((faq, i) => (
                            <div key={i} className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ padding: '4px', height: 'fit-content' }}>
                                        <HelpCircle size={24} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px' }}>{faq.q}</h4>
                                        <p style={{ lineHeight: 1.6, color: 'var(--text-muted)' }}>{faq.a}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <PublicFooter />

            <style>{`
                .highlight-card {
                    transform: scale(1.05);
                }
                @media (max-width: 1024px) {
                    .highlight-card {
                        transform: none !important;
                    }
                    .pricing-grid {
                        gap: 24px !important;
                    }
                }
                @media (max-width: 480px) {
                    .glass-card {
                        padding: 32px 24px !important;
                    }
                    h1 {
                        font-size: 2.2rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PricingPage;
