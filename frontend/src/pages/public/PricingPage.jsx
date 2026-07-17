import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import { Check, X, ArrowRight, Star, BadgeCheck } from 'lucide-react';
import SEO from '../../components/public/SEO';

const PricingFAQItem = ({ question, answer, isLast }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div style={{ borderBottom: isLast ? 'none' : '1px solid #E2E8F0', padding: '20px 0', cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{question}</h4>
                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary)', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
            </div>
            {isOpen && (
                <p style={{ marginTop: '12px', fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{answer}</p>
            )}
        </div>
    );
};

const PricingPage = () => {
    const navigate = useNavigate();
    const { profile, updateProfile } = useAuth();


    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
            description: "Unlimited records, AI voice, and a trusted staff member by your side.",
            price: "₦6,000",
            isPopular: true,
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
            isFounding: true,
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

    return (
        <div style={{ minHeight: '100vh', background: 'white', color: '#0F172A', fontFamily: "'Outfit', sans-serif" }}>
            <SEO 
                title="Pricing Plans" 
                description="Choose the Kredibly plan that fits your ambition. Zero hidden bank fees, no transaction commissions — just pure business power." 
                path="/pricing" 
            />
            <PublicNavbar />
            
            {/* Header - Premium Vibe */}
            <section className="pricing-header" style={{ padding: 'calc(clamp(80px, 12vw, 150px) + env(safe-area-inset-top, 0px)) 20px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: '#FDFCFE' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.05, background: 'radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 70%)' }} />
                
                <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '24px' }}>
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
                                <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(76, 29, 149, 0.2)' }}>
                                    MOST POPULAR
                                </div>
                            )}
                            
                            <h3 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 800, marginBottom: '8px' }}>{plan.name}</h3>
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
                        <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '16px' }}>Compare All Plans</h2>
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
                                    { category: "AI & Intelligence", features: [
                                        { name: "WhatsApp AI Assistant (Text)", hustler: true, oga: true, chairman: true },
                                        { name: "Monthly AI Conversations", hustler: "100 / mo", oga: "Unlimited", chairman: "Unlimited" },
                                        { name: "Kreddy Voice Notes", hustler: false, oga: true, chairman: true },
                                        { name: "AI Invoice Scanner (OCR)", hustler: false, oga: false, chairman: true },
                                        { name: "Morning Business Briefing", hustler: false, oga: true, chairman: true },
                                        { name: "Business Reports & Analytics", hustler: false, oga: false, chairman: true }
                                    ]},
                                    { category: "Business Management", features: [
                                        { name: "Monthly Sales Records", hustler: "50 / mo", oga: "Unlimited", chairman: "Unlimited" },
                                        { name: "Staff Members", hustler: "Owner Only", oga: "1 Staff", chairman: "3 Staff" },
                                        { name: "Multi-Office / Branches", hustler: false, oga: false, chairman: true }
                                    ]},
                                    { category: "Invoices & Branding", features: [
                                        { name: "Professional Invoices & Receipts", hustler: true, oga: true, chairman: true },
                                        { name: "Your Logo on Invoices", hustler: true, oga: true, chairman: true },
                                        { name: "Business Initials if No Logo", hustler: true, oga: true, chairman: true }
                                    ]},
                                    { category: "Payments & Collection", features: [
                                        { name: "WhatsApp Pay Now Links", hustler: true, oga: true, chairman: true },
                                        { name: "Customer Payment Reminders", hustler: "20 / mo", oga: "Unlimited", chairman: "Unlimited" },
                                        { name: "Automatic Payment Reconciliation", hustler: true, oga: true, chairman: true },
                                        { name: "Direct Bank Settlement", hustler: true, oga: true, chairman: true },
                                        { name: "Settlement Transfer Covered", hustler: true, oga: true, chairman: true }
                                    ]},
                                    { category: "Support", features: [
                                        { name: "Dashboard Access", hustler: true, oga: true, chairman: true },
                                        { name: "Dedicated Support", hustler: "Standard", oga: "Standard", chairman: "Priority" }
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

            {/* Detailed Plan Breakdown */}
            <section style={{ padding: '80px 24px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>Which Plan is Right for Your Business?</h2>
                        <p style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: 500 }}>A detailed breakdown of how each plan matches your operational growth.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                        <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Hustler — ₦3,000/mo</h3>
                            <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>
                                For solopreneurs and micro-merchants moving from notebooks to digital records. 50 structured sales records every month, 100 AI conversations with Kreddy, and 20 automated payment reminders.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                                <li>50 invoice records / month</li>
                                <li>100 AI conversations / month</li>
                                <li>20 customer reminders / month</li>
                                <li>Professional invoice with your logo</li>
                                <li>Direct bank settlement</li>
                            </ul>
                        </div>
                        <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid var(--primary)', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-12px', right: '24px', background: 'var(--primary)', color: 'white', fontSize: '0.75rem', fontWeight: 900, padding: '4px 12px', borderRadius: '100px' }}>POPULAR</div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Oga — ₦6,000/mo</h3>
                            <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>
                                For growing retail stores and service businesses. Unlimited records, unlimited AI conversations, AI voice note invoicing, unlimited reminders, and one trusted staff member.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                                <li>Unlimited sales records</li>
                                <li>Unlimited AI conversations</li>
                                <li>Voice note invoicing</li>
                                <li>Unlimited customer reminders</li>
                                <li>Add 1 staff member</li>
                                <li>Morning business briefing</li>
                            </ul>
                        </div>
                        <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #0F172A' }}>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px' }}>Chairman — ₦9,000/mo</h3>
                            <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, marginBottom: '20px' }}>
                                For multi-branch businesses that need full automation. Snap a photo of a paper invoice and Kreddy extracts the details, creates the record, and asks for your confirmation before saving.
                            </p>
                            <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', color: '#475569', lineHeight: 1.6 }}>
                                <li>AI invoice scanner (OCR)</li>
                                <li>Up to 3 staff & office accounts</li>
                                <li>Business reports & analytics</li>
                                <li>Priority dedicated support channel</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sweep & Reconciliation Guarantee */}
            <section style={{ padding: '80px 24px', background: 'white' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', padding: '8px 20px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '100px', color: '#10B981', fontWeight: 800, fontSize: '0.8rem', marginBottom: '24px' }}>THE KREDIBLY SWEEP GUARANTEE</div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '20px' }}>No Commission. Instant Sweeps. Zero Fees.</h2>
                    <p style={{ fontSize: '1.1rem', color: '#64748B', lineHeight: 1.8, marginBottom: '32px' }}>
                        Unlike other platforms that charge 1.5% to 2.5% on every customer transaction, Kredibly runs on a fixed subscription model. We do not take a slice of your hard-earned revenue. When customers pay via bank transfer using their dynamic virtual account, the funds are swept instantly directly to your linked settlement account, with zero transfer payout fees.
                    </p>
                </div>
            </section>

            {/* Pricing FAQs Section */}
            <section style={{ padding: '80px 24px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>Pricing & Billing FAQs</h2>
                        <p style={{ color: '#64748B', fontSize: '1.1rem', fontWeight: 500 }}>Frequently asked questions about Kredibly subscriptions.</p>
                    </div>

                    <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                        {[
                            { question: "Are there any hidden charges?", answer: "No. Kredibly charges only your monthly subscription. Payment gateway fees are handled according to the option you choose (merchant or customer pays), and Kredibly covers the settlement transfer cost on all paid plans. There are no platform commissions on your sales." },
                            { question: "How does payment processing work?", answer: "When a customer pays an invoice, a payment gateway fee applies (1% capped at ₦150). You decide who covers it: your customer pays it on top of the invoice, or it is deducted from your settlement. After payment is confirmed, funds are transferred directly to your verified bank account. Kredibly covers the settlement transfer cost — we do not charge you for moving your money." },
                            { question: "Does Kredibly take a commission on my sales?", answer: "No. Kredibly does not take a percentage of your sales. Your monthly subscription gives you full access to the platform. Payment processing follows the transparent fee structure above." },
                            { question: "Do you offer a free trial?", answer: "Yes. Every new business gets 14 days of full Chairman access — no credit card required. You experience everything before deciding on your plan." },
                            { question: "How does the Hustler 50-record limit work?", answer: "Every time you create an invoice or sales record via Kreddy, it counts as one entry. The counter resets on your monthly billing date. You can still view existing records even after the limit is reached." },
                            { question: "Can I upgrade or downgrade my plan?", answer: "Yes. You can upgrade, downgrade, or cancel at any time through your Settings panel. Upgrades take effect immediately." },
                            { question: "Is my payment information secure?", answer: "All subscription payments are processed securely through our licensed payment partners. Kredibly never stores your card details on our servers." }
                        ].map((faq, i, arr) => (
                            <PricingFAQItem key={i} question={faq.question} answer={faq.answer} isLast={i === arr.length - 1} />
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Call to Action */}
            <section style={{ padding: '80px 24px', background: 'white' }}>
                <div className="pricing-cta-box" style={{ maxWidth: '1000px', margin: '0 auto', background: '#F5F3FF', padding: '60px', borderRadius: '48px', border: '1px solid rgba(124, 58, 237, 0.1)', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '24px' }}>Build your empire. <br /><span className="premium-gradient">Start with 14 days free.</span></h2>
                    <p style={{ fontSize: '1.15rem', color: '#4C1D95', fontWeight: 700, marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
                        Every new business gets 14 days of full Chairman access. No credit card. No commitment. Just results.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '20px 48px', height: 'auto', borderRadius: '20px' }}>Start Your Free Trial <ArrowRight size={18} strokeWidth={3} /></button>
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
                    font-weight: 800;
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
