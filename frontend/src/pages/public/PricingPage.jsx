import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import { Check, X, Zap, HelpCircle, ArrowRight, ShieldCheck, Sparkles, Mic } from 'lucide-react';

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
            price: billingCycle === 'monthly' ? "₦5,000" : "₦4,500",
            fee: "0% Transaction Fees*",
            period: "/ month",
            features: [
                "Everything in Hustler Plan",
                "Unlimited Sales Records",
                "Kreddy Voice Notes (Just speak!)",
                "Add 2 Staff Members",
                "Co-Branded Receipts (Your Logo)",
                "Advanced AI Recovery Assistant"
            ],
            cta: profile?.plan === "oga" ? "Current Plan" : profile ? "Upgrade Now" : "Become an Oga",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: true,
            color: "var(--primary)"
        },
        {
            name: "Chairman",
            slug: "chairman",
            tagline: "The Empire Command Center",
            description: "Run multiple shops without stress. Lead your empire with zero commissions.",
            price: billingCycle === 'monthly' ? "₦8,500" : "₦7,650",
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
            cta: profile?.plan === "chairman" ? "Current Plan" : profile ? "Upgrade Now" : "Lead Your Empire",
            ctaAction: () => profile ? navigate('/dashboard') : navigate('/auth/register'),
            highlight: false,
            color: "#0F172A"
        }
    ];

    return (
        <div style={{ minHeight: '100vh', background: 'white', color: 'var(--text)' }}>
            <PublicNavbar />
            
            {/* Header - Repurposed for partnership vibe */}
            <section className="pricing-header" style={{ padding: 'clamp(80px, 12vw, 150px) 20px clamp(40px, 8vw, 80px)', textAlign: 'center', position: 'relative', overflow: 'hidden', background: '#FDFCFE' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, background: 'radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 70%)' }} />
                
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                            <Zap size={16} fill="currentColor" />
                            100% FREE TRANSACTIONS & INSTANT SETTLEMENT
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, letterSpacing: '-0.045em', lineHeight: 1.05, marginBottom: '24px', color: '#0F172A' }}>
                            Zero Platform Fees. <br />
                            <span className="premium-gradient">Keep 100% of your sales.</span>
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '48px', maxWidth: '700px', margin: '0 auto 48px', fontWeight: 500 }}>
                            We don't charge you to collect your own money. Our instant bank transfers are completely free forever for you and your customers.
                            <br />
                            <br />
                            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>*Standard third-party gateway fees (1.5%) only apply if your customer explicitly chooses to pay with a Debit Card.</span>
                        </p>

                        {/* Billing Toggle - Minimalist */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#F1F5F9', padding: '6px', borderRadius: '100px' }}>
                            <button onClick={() => setBillingCycle('monthly')} style={{ padding: '12px 28px', borderRadius: '100px', border: 'none', background: billingCycle === 'monthly' ? 'white' : 'transparent', color: billingCycle === 'monthly' ? '#0F172A' : '#64748B', fontWeight: 800, cursor: 'pointer', boxShadow: billingCycle === 'monthly' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: '0.3s' }}>Monthly</button>
                            <button onClick={() => setBillingCycle('yearly')} style={{ padding: '12px 28px', borderRadius: '100px', border: 'none', background: billingCycle === 'yearly' ? 'white' : 'transparent', color: billingCycle === 'yearly' ? '#0F172A' : '#64748B', fontWeight: 800, cursor: 'pointer', boxShadow: billingCycle === 'yearly' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none', transition: '0.3s', display: 'flex', gap: '8px', alignItems: 'center' }}>Yearly <span style={{ fontSize: '0.7rem', background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '10px' }}>-10%</span></button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Unique Pricing Grid */}
            <section style={{ padding: '0 24px 100px', background: '#FDFCFE' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                    {plans.map((plan, i) => (
                        <div key={i} style={{ 
                            padding: '48px', 
                            borderRadius: '32px', 
                            background: plan.highlight ? '#0F172A' : 'white', 
                            color: plan.highlight ? 'white' : '#0F172A',
                            border: plan.highlight ? 'none' : '1px solid #E2E8F0',
                            position: 'relative',
                            transform: plan.highlight ? 'scale(1.05)' : 'none',
                            boxShadow: plan.highlight ? '0 30px 60px -15px rgba(15, 23, 42, 0.3)' : '0 10px 30px -10px rgba(0,0,0,0.02)',
                            zIndex: plan.highlight ? 2 : 1,
                            display: 'flex', flexDirection: 'column'
                        }}>
                            {plan.highlight && <div style={{ position: 'absolute', top: '24px', right: '32px', background: 'var(--primary)', color: 'white', padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 900 }}>MOST POPULAR</div>}
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '8px' }}>{plan.name}</h3>
                            <p style={{ opacity: 0.7, fontSize: '0.95rem', fontWeight: 500, marginBottom: '32px', minHeight: '44px' }}>{plan.description}</p>
                            
                            <div style={{ marginBottom: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-0.05em' }}>{plan.price}</span>
                                    <span style={{ opacity: 0.6, fontWeight: 600 }}>{plan.period}</span>
                                </div>
                                <div style={{ fontSize: '1rem', fontWeight: 900, color: plan.highlight ? '#4ADE80' : 'var(--primary)', marginTop: '4px' }}>+ {plan.fee}</div>
                            </div>

                            <button 
                                onClick={plan.ctaAction}
                                className={plan.highlight ? "btn-white" : "btn-secondary"} 
                                style={{ width: '100%', marginBottom: '40px', justifyContent: 'center' }}
                            >
                                {plan.cta} <ArrowRight size={18} />
                            </button>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {plan.features.map((feat, j) => (
                                    <div key={j} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '1rem', fontWeight: 600 }}>
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
            </section>

            {/* Why Kreddy Assistant Section */}
            <section style={{ padding: '100px 24px', background: 'white' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '24px' }}>It's more than <br /><span className="premium-gradient">just a ledger.</span></h2>
                            <p style={{ fontSize: '1.2rem', color: '#475569', lineHeight: 1.6, marginBottom: '40px' }}>Kreddy is the first platform that proactively helps you collect. We don't just store data; we help you find the money you've worked for.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {[
                                    { i: ShieldCheck, t: "Verified Identity", d: "Your customers see a professional 'Verified Ledger' seal on every receipt." },
                                    { i: Sparkles, t: "Assistant Intelligence", d: "Kreddy drafts the perfect messages for you to send to late payers." },
                                    { i: Mic, t: "Voice Command", d: "Record sales and set reminders just by talking into WhatsApp." }
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '20px' }}>
                                        <div style={{ minWidth: '50px', height: '50px', background: '#F8FAFC', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.i color="var(--primary)" size={24} /></div>
                                        <div><h4 style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0 0 4px 0' }}>{item.t}</h4><p style={{ margin: 0, fontSize: '0.95rem', color: '#64748B', fontWeight: 500 }}>{item.d}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '60px', borderRadius: '40px', textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🫡</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px' }}>Personal Assistant Mode</h3>
                            <p style={{ color: '#475569', fontWeight: 600, lineHeight: 1.5 }}>Included in all plans. Tell Kreddy your gym time, your meetings, and your market calls. She remembers everything so you don't have to.</p>
                            <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ marginTop: '32px', width: '100%', justifyContent: 'center' }}>Try Kreddy Now</button>
                        </div>
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
                @media (max-width: 1024px) {
                    h1 { font-size: 2.5rem !important; }
                }
            `}</style>
        </div>
    );
};

export default PricingPage;
