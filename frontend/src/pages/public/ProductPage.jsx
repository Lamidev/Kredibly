import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import { Sparkles, LayoutDashboard, CreditCard, CheckCircle2, ArrowRight, Mic, Wallet, BadgeCheck, HelpCircle, Award } from 'lucide-react';
import SEO from '../../components/public/SEO';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div style={{ borderBottom: '1px solid #E2E8F0', padding: '20px 0', cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
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

const products = {
    'kreddy-ai': {
        title: "Kreddy AI Assistant",
        subtitle: "Conversational Ledger Intelligence",
        description: "Meet Kreddy—your WhatsApp-native AI business assistant. Simply send text descriptions or voice notes to record transactions, generate PDF invoices, and trigger polite reminder automations.",
        icon: Sparkles,
        color: "var(--primary)",
        bg: "rgba(76, 29, 149, 0.05)",
        features: [
            { title: "Voice-to-Ledger Translation", desc: "Speak naturally to Kreddy. She understands Nigerian business terms, numbers, and items in 5 seconds." },
            { title: "Automatic WhatsApp Delivery", desc: "Kreddy drafts, styles, and sends professional PDF invoices directly to your client's WhatsApp thread." },
            { title: "Schedules Due-Date Nudges", desc: "Polite payment notifications are scheduled and sent automatically as due dates approach." },
            { title: "Interactive Extension Flow", desc: "Customers can request payment extensions inside WhatsApp. Kreddy negotiates and updates your ledger on approval." }
        ],
        detailsTitle: "Bringing Bookkeeping to WhatsApp Chat",
        detailsText: "Over 90% of commerce in Nigeria starts with conversations. However, manual recording in paper ledgers leads to lost tracking, uncollected debts, and slow payments. Kreddy brings automated receivables directly where conversations are already happening.",
        workflow: [
            { title: "Send a Voice Note or Text", desc: "Record the sale naturally on WhatsApp: 'sold 5 cartons of cornflakes to Mrs. Alabi for N35,000 to be paid on Friday'." },
            { title: "Dynamic Invoice Generation", desc: "Kreddy converts the unstructured input into a structured invoice and returns a PDF draft for your review." },
            { title: "Conversational Delivery", desc: "On approval, Kreddy delivers the payment request to the customer's WhatsApp inbox containing secure bank payment options." },
            { title: "Automatic Settlement", desc: "When the customer performs a bank transfer, Kreddy reconciles the transaction and updates your ledger instantly." }
        ],
        faqs: [
            { question: "How accurate is the voice note transcription?", answer: "Kreddy's transcription models are fine-tuned on West African accents, currency slang (k, N, naira), and product naming structures, delivering over 95% transcription accuracy." },
            { question: "Can I review invoices before they are sent to customers?", answer: "Yes. By default, Kreddy returns a preview draft of the generated invoice for you to edit or confirm before sending it to the client." },
            { question: "Does Kreddy send reminders automatically?", answer: "Yes, you can configure reminders to trigger 3 days before, on the due date, or every 48 hours for overdue payments." }
        ]
    },
    'dashboard': {
        title: "Merchant Dashboard",
        subtitle: "Real-Time Revenue Analytics",
        description: "Get comprehensive control of your operations. View detailed invoice tracking, outstanding customer balances, staff activity logs, and real-time revenue analytics.",
        icon: LayoutDashboard,
        color: "#10B981",
        bg: "rgba(16, 185, 129, 0.05)",
        features: [
            { title: "Complete Accounts Receivable Ledger", desc: "Track every pending invoice, completed transaction, and customer ledger from one central board." },
            { title: "Staff Sales & Branch Monitoring", desc: "Add staff accounts, trace invoice entries to specific employees, and analyze physical store performances." },
            { title: "Interactive Revenue Analytics", desc: "Understand your cash flows, monthly revenues, and outstanding debts with clean, responsive chart modules." },
            { title: "Automated Debtor Reports", desc: "Generate weekly credit summaries and export tax-compliant spreadsheets in one click." }
        ],
        detailsTitle: "Operational Audits & Multi-Staff Tracking",
        detailsText: "As your retail operation grows, keeping records centralized across multiple sales representatives and locations becomes critical. The Kredibly V2 dashboard brings full visibility to your team's performance, prevents cash leakages, and speeds up accounting audit cycles.",
        workflow: [
            { title: "Onboard Sales Reps", desc: "Create staff logins from your settings panel to grant access to log invoices." },
            { title: "Real-Time Transaction Feeds", desc: "Every transaction recorded by a staff member on WhatsApp shows up on your admin portal instantly." },
            { title: "Audit Payout Sweeps", desc: "Monitor Nomba partner settlements, sweep status, and bank transaction hashes directly." },
            { title: "Export Tax-Ready Sheets", desc: "Download clean ledger reports to feed directly into your corporate tax returns or bookkeeping tools." }
        ],
        faqs: [
            { question: "Can I restrict staff access to my main bank settings?", answer: "Yes. Staff profiles only have permission to log invoices and view their individual sales logs. Dashboard analytics and bank details are restricted to the Admin account." },
            { question: "How many staff profiles can I add?", answer: "Our Hustler plan is single-user. The Oga Plan supports up to 2 staff members, and the Chairman Plan supports unlimited staff and physical branch locations." },
            { question: "Does the dashboard work on mobile screens?", answer: "Yes. The Kredibly V2 Merchant Dashboard is fully responsive and optimized to deliver desktop-grade analytics on tablets and mobile screens." }
        ]
    },
    'escrow': {
        title: "Instant Sweeps & Escrow",
        subtitle: "Secure Payment Rails",
        description: "Stop waiting 24 hours for your money. Invoices are delivered with secure payment buttons that settle payments directly to your bank account instantly.",
        icon: CreditCard,
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.05)",
        features: [
            { title: "Instant Bank Settlements", desc: "Funds transferred by clients are swept immediately to your partner bank account via API." },
            { title: "Zero Payout Transfer Fees", desc: "Avoid flat-rate payout transaction deductions. Kredibly sweeps your revenue to your bank with zero fees." },
            { title: "Interactive Pay Now Buttons", desc: "Deliver quick transfer virtual account numbers directly inside customer threads for faster clicks." },
            { title: "Verified Ledger Security Seal", desc: "Every receipt has a cryptographic hash seal, validating records for credit assessments and audits." }
        ],
        detailsTitle: "Nomba-Powered Conversational Settlements",
        detailsText: "Matching bank transfer slips to pending customer invoices is a massive friction point for merchants. Customer transfers are often made with generic references. Kredibly generates a dynamic virtual account for every single invoice, reconciling transactions automatically.",
        workflow: [
            { title: "Dynamic Virtual Account Assignment", desc: "Kreddy attaches a unique Nomba virtual account to every customer PDF invoice." },
            { title: "Instant Transfer Verification", desc: "Our system listens for transfer payouts and alerts you via WhatsApp as soon as payment hits the rail." },
            { title: "Zero-Fee Automatic Sweep", desc: "Reconciled funds are swept directly into your corporate bank account instantly." },
            { title: "Dynamic WhatsApp Receipt Delivery", desc: "Kreddy automatically delivers a verified cryptographic receipt containing the transfer hash to the customer." }
        ],
        faqs: [
            { question: "How fast do sweeps hit my bank account?", answer: "Sweeps are initiated instantly via API. Most payouts reflect in your linked bank account within 2-5 minutes." },
            { question: "Are there transaction commissions?", answer: "No. Unlike other payment processors, Kredibly doesn't charge percentage cuts. We charge a flat monthly subscription fee, leaving 100% of your margins to you." },
            { question: "Is the Nomba partner rail secure?", answer: "Yes. All virtual accounts are issued by licensed and regulated commercial banking entities, ensuring compliance with CBN regulations." }
        ]
    }
};

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = products[id];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id, product]);

    if (!product) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>Product not found</div>;

    const Icon = product.icon;

    return (
        <div style={{ minHeight: '100vh', background: 'white' }}>
            <SEO 
                title={product.title} 
                description={product.description} 
                path={`/product/${id}`} 
            />
            <PublicNavbar />
            
            <section style={{ paddingTop: '160px', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>
                <div className="pattern-dots" />
                <div className="container" style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px', alignItems: 'center' }}>
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', background: product.bg, color: product.color, fontWeight: 800, fontSize: '0.9rem', marginBottom: '32px' }}>
                            <Icon size={16} />
                            {product.title}
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, color: 'var(--text)', marginBottom: '24px', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                            {product.subtitle}
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '600px' }}>
                            {product.description}
                        </p>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button 
                                onClick={() => navigate('/auth/register')}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px 8px 8px 24px',
                                    borderRadius: '100px',
                                    background: 'var(--primary)',
                                    color: '#FFFFFF',
                                    fontWeight: 700,
                                    fontSize: '0.98rem',
                                    border: 'none',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                    boxShadow: '0 8px 24px rgba(109, 40, 217, 0.28)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(109, 40, 217, 0.38)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(109, 40, 217, 0.28)';
                                }}
                            >
                                <span>Try for Free</span>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    backgroundColor: '#FFFFFF',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <ArrowRight size={18} strokeWidth={2.5} />
                                </div>
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 800, fontSize: '0.9rem' }}>
                                <BadgeCheck size={18} /> Zero Bank Charges
                            </div>
                        </div>

                    </motion.div>
                </div>
            </section>

            {/* Premium, responsive card features block */}
            <section style={{ padding: '100px 0', background: '#F8FAFC' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        {product.features.map((feature, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{ padding: '32px', display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                            >
                                <div style={{ padding: '12px', borderRadius: '12px', background: product.bg, color: product.color }}>
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>{feature.title}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, margin: 0 }}>{feature.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Dynamic Product Workflow details */}
            <section style={{ padding: '80px 24px', background: 'white' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '16px' }}>
                                <Award size={18} /> DETAILED WORKFLOW
                            </div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '24px', lineHeight: 1.2 }}>{product.detailsTitle}</h2>
                            <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.8, marginBottom: 0 }}>
                                {product.detailsText}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {product.workflow.map((w, idx) => (
                                <div key={idx} style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.85rem', flexShrink: 0 }}>{idx + 1}</div>
                                    <div>
                                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px', marginTop: 0 }}>{w.title}</h4>
                                        <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>{w.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Product-Specific FAQs Section */}
            <section style={{ padding: '80px 24px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '16px' }}>
                            <HelpCircle size={18} /> QUESTIONS & ANSWERS
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', marginBottom: '16px' }}>Product Frequently Asked Questions</h2>
                        <p style={{ color: '#64748B', fontWeight: 500, fontSize: '1.2rem' }}>Everything you need to know about this dynamic module.</p>
                    </div>

                    <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                        {product.faqs.map((faq, i) => (
                            <FAQItem key={i} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default ProductPage;
