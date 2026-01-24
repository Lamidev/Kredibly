import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import { Check, X, HelpCircle, ArrowRight } from 'lucide-react';

const PricingPage = () => {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState('yearly'); // 'monthly' | 'yearly'

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const plans = [
        {
            name: "Hustler",
            description: "For the 'One-Man Army' Instagram vendor.",
            price: "Free",
            period: "",
            features: [
                "Kreddy AI Assistant",
                "Ditch the Notebook (50 sales/mo)",
                "Basic WhatsApp Receipts",
                "Track Debtors Automatically",
                "Community Support"
            ],
            cta: "Start Hustling",
            ctaAction: () => navigate('/auth/register'),
            highlight: false
        },
        {
            name: "Oga Mode",
            description: "For shop owners who want sleep.",
            price: billingCycle === 'yearly' ? "₦4,500" : "₦5,000",
            period: "/ month",
            features: [
                "Everything in Hustler",
                "Unlimited Sales Recording",
                "Monitor 5 Staff Members (Anti-Theft)",
                "Inventory Tracking",
                "Premium Branded Invoices",
                "WhatsApp Priority Support"
            ],
            cta: "Take Control",
            ctaAction: () => navigate('/auth/register'),
            highlight: true
        },
        {
            name: "Empire",
            description: "For distributors & supermarkets.",
            price: "Custom",
            period: "",
            features: [
                "Unlimited Staff & Locations",
                "Dedicated Account Manager",
                "Custom API Integration",
                "Head Office Dashboard",
                "White-label Reports",
                "SLA Guarantee"
            ],
            cta: "Contact Sales",
            ctaAction: () => navigate('/contact'),
            highlight: false
        }
    ];

    const comparisonFeatures = [
        { name: "Sales Recording", free: "50/mo", pro: "Unlimited", ent: "Unlimited" },
        { name: "Staff Members", free: "1 (You)", pro: "Up to 5", ent: "Unlimited" },
        { name: "Debtor Reminders", free: "Manual", pro: "Automated", ent: "Custom Logic" },
        { name: "Invoices", free: "Standard", pro: "Premium (Custom Logo)", ent: "White-label" },
        { name: "Data Export", free: false, pro: true, ent: true },
        { name: "API Access", free: false, pro: false, ent: true },
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'white', color: 'var(--text)' }}>
            <PublicNavbar />
            
            {/* Header */}
            <section style={{ paddingTop: '180px', paddingBottom: '80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div className="pattern-dots" />
                <div style={{ position: 'relative', zIndex: 10, padding: '0 20px' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: 'inline-block', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', border: '1px solid rgba(76, 29, 149, 0.1)' }}>
                            SIMPLE, TRANSPARENT PRICING
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '24px' }}>
                            Invest in your <span style={{ color: 'var(--primary)' }}>Growth.</span>
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
                            Start for free. Upgrade when you're making money. <br />
                            No hidden charges, ever.
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
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'flex-start' }}>
                    {plans.map((plan, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card"
                            style={{ 
                                padding: '48px', 
                                borderRadius: '32px', 
                                border: plan.highlight ? 'none' : '1px solid #E2E8F0',
                                background: plan.highlight ? 'var(--text)' : 'white',
                                color: plan.highlight ? 'white' : 'var(--text)',
                                position: 'relative',
                                boxShadow: plan.highlight ? '0 30px 60px -15px rgba(0,0,0,0.2)' : '0 10px 30px -10px rgba(0,0,0,0.05)',
                                transform: plan.highlight ? 'scale(1.05)' : 'none',
                                zIndex: plan.highlight ? 2 : 1
                            }}
                        >
                            {plan.highlight && (
                                <div style={{ position: 'absolute', top: '32px', right: '32px', background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>
                                    RECOMMENDED
                                </div>
                            )}
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '8px' }}>{plan.name}</h3>
                            <p style={{ opacity: 0.7, marginBottom: '32px', minHeight: '48px', fontWeight: 500 }}>{plan.description}</p>
                            
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-0.05em' }}>{plan.price}</span>
                                <span style={{ opacity: 0.7, fontWeight: 500 }}>{plan.period}</span>
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
                                    <th style={{ padding: '24px', fontWeight: 800, color: 'var(--primary)' }}>Merchant</th>
                                    <th style={{ padding: '24px', fontWeight: 800 }}>Scale</th>
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
                            { q: "Do I need to pay to add staff?", a: "On the Hustler (Free) plan, you get 1 user. To add staff members who can record sales for you, you'll need the Merchant plan which includes up to 5 staff members." },
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
        </div>
    );
};

export default PricingPage;
