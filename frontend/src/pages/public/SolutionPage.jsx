import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import CountUp from '../../components/ui/CountUp';
import { User, Store, ShieldCheck, ArrowRight, CheckCircle2, Award, BookOpen, HelpCircle } from 'lucide-react';
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

const solutions = {
    'solopreneurs': {
        title: "For Solopreneurs",
        subtitle: "The Army of One",
        description: "You do everything yourself—marketing, sales, delivery. Kredibly acts as your AI executive assistant so you can automate operations and focus on your growth.",
        icon: User,
        color: "#2563EB",
        bg: "rgba(37, 99, 235, 0.05)",
        statValue: 10,
        statSuffix: "+ Hours Saved/Week",
        points: [
            "AI Assistant handles your daily logging and updates",
            "Professional invoices delivered directly on WhatsApp",
            "Automated payment reminders and extensions engine"
        ],
        detailsTitle: "Streamlining the Solopreneur Hustle",
        detailsText: "Running a business solo is hard. Between talking to customers, manufacturing/sourcing, packing orders, and coordinating logistics, bookkeeping is often the first thing to get abandoned. But without records, you cannot scale. Kredibly is designed to be your background operating partner.",
        workflow: [
            { title: "Record Orders via Voice Notes", desc: "Just speak to Kreddy on WhatsApp like a partner: 'Record order of 3 wigs for Chioma ₦45k'. She creates the ledger entry instantly." },
            { title: "Automated WhatsApp Invoice Delivery", desc: "Kreddy compiles the order into a clean, professional PDF invoice and delivers it to your customer's WhatsApp inbox." },
            { title: "Hands-Free Reminders & Extensions", desc: "No more awkward collection chats. Kreddy handles payment notifications and coordinates extension agreements conversationally." },
            { title: "Escrow Bank settlement", desc: "Customer pays via instant bank transfer using the generated Nomba virtual account. Payout is swept to your bank account with zero fees." }
        ],
        faqs: [
            { question: "How does Kreddy understand my voice notes?", answer: "Kreddy uses advanced natural language processing tuned specifically for African business slang, transaction abbreviations, and product naming conventions. Simply describe the sale as you would to a human." },
            { question: "Do my customers need to download Kredibly?", answer: "No. Your customers receive everything natively inside WhatsApp as standard messages and PDF files. They interact directly with the assistant via chat." },
            { question: "Can Kreddy track who owes me money?", answer: "Yes. Simply ask Kreddy 'Who owes me?' on WhatsApp, and she will output a clean list of pending balances, due dates, and debtor details instantly." }
        ]
    },
    'retail': {
        title: "Retail & E-commerce",
        subtitle: "Scale Your Operations",
        description: "From a single store to multiple locations. Kredibly helps you synchronize inventory, track staff activity, and collect payments automatically.",
        icon: Store,
        color: "#10B981",
        bg: "rgba(16, 185, 129, 0.05)",
        statValue: 3,
        statSuffix: "x Faster Reconciliation",
        points: [
            "Monitor staff sales and activity in real-time",
            "Instant bank sweeps with zero transfer fees",
            "Direct-to-WhatsApp customer payment loops"
        ],
        detailsTitle: "Managing Multi-Staff Operations & Reconciliation",
        detailsText: "For retail store owners, keeping track of sales across multiple staff members or physical branches is a constant challenge. Inventory walks, sales reconciliations, and cash auditing take hours. Kredibly automates this entire loop from the sales floor to your bank ledger.",
        workflow: [
            { title: "Assign Staff Accounts", desc: "Give your shop floor staff access to register sales directly. Every invoice logged is tracked back to the recording staff profile." },
            { title: "Dynamic Customer Payment Accounts", desc: "Every transaction generates a unique Nomba Virtual Account. Payments map directly to specific invoices, resolving duplicate transfer slips." },
            { title: "Real-Time Branch Analytics", desc: "Log in to your merchant dashboard to view hourly sales activity, branch performances, and employee leaderboards." },
            { title: "Escrow-Protected Banking", desc: "Incoming payments are reconciled automatically. Verified funds are swept directly into the merchant's corporate bank vault." }
        ],
        faqs: [
            { question: "Can I manage multiple physical store branches?", answer: "Yes. The Chairman Plan allows you to configure multiple branches and assign staff members to specific locations for isolated tracking." },
            { question: "How does payment reconciliation work?", answer: "Every Kredibly invoice generates a unique virtual bank account number for the customer. When they perform a transfer, our systems match the exact reference and update your dashboard in real-time." },
            { question: "Can I monitor staff sales activity remotely?", answer: "Yes. Your merchant dashboard provides a complete real-time ledger showing exactly which staff logged which transaction, complete with timestamps and payout summaries." }
        ]
    }
};

const SolutionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const solution = solutions[id];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id, solution]);

    if (!solution) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>Solution not found</div>;

    const Icon = solution.icon;

    return (
        <div style={{ minHeight: '100vh', background: 'white' }}>
            <SEO 
                title={solution.title} 
                description={solution.description} 
                path={`/solution/${id}`} 
            />
            <PublicNavbar />
            
            <section style={{ paddingTop: '160px', paddingBottom: '100px', background: '#0F172A', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div className="pattern-dots" style={{ opacity: 0.1 }} />
                <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '32px' }}>
                            <Icon size={16} />
                            {solution.title}
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, marginBottom: '24px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                            {solution.subtitle}
                        </h1>
                        <p style={{ fontSize: '1.25rem', opacity: 0.8, lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 40px' }}>
                            {solution.description}
                        </p>
                        <button 
                            onClick={() => navigate('/auth/register')}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '8px 8px 8px 24px',
                                borderRadius: '100px',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                fontWeight: 700,
                                fontSize: '0.98rem',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                boxShadow: '0 8px 24px rgba(255, 255, 255, 0.15)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 255, 255, 0.25)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 255, 255, 0.15)';
                            }}
                        >
                            <span>Start Your Journey</span>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--primary)',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <ArrowRight size={18} strokeWidth={2.5} />
                            </div>
                        </button>

                    </motion.div>
                </div>
            </section>

            <section style={{ padding: '100px 0', background: 'white' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '60px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {solution.points.map((point, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.2 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                                >
                                    <div style={{ padding: '16px', borderRadius: '50%', background: solution.bg, color: solution.color }}>
                                        <ShieldCheck size={24} />
                                    </div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{point}</p>
                                </motion.div>
                            ))}
                        </div>
                        
                        <div style={{ padding: '60px', borderRadius: '40px', background: solution.bg, textAlign: 'center', border: `1px solid ${solution.color}20` }}>
                            <h3 style={{ fontSize: '4rem', fontWeight: 950, color: solution.color, marginBottom: '16px', lineHeight: 1 }}>
                                <CountUp to={solution.statValue} />
                            </h3>
                            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>
                                {solution.statSuffix}
                            </p>
                            <p style={{ opacity: 0.6, fontSize: '0.9rem', fontWeight: 500 }}>Average impact reported by Kredibly merchants in this sector.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* In-depth Workflow Details */}
            <section style={{ padding: '80px 24px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px', alignItems: 'center', marginBottom: '80px' }}>
                        <div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '16px' }}>
                                <Award size={18} /> THE DETAILS
                            </div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '24px', lineHeight: 1.2 }}>{solution.detailsTitle}</h2>
                            <p style={{ fontSize: '1.05rem', color: '#475569', lineHeight: 1.8, marginBottom: 0 }}>
                                {solution.detailsText}
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {solution.workflow.map((w, idx) => (
                                <div key={idx} style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', gap: '16px' }}>
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

            {/* Solutions FAQs Section */}
            <section style={{ padding: '80px 24px', background: 'white' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '16px' }}>
                            <HelpCircle size={18} /> FAQ
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', marginBottom: '16px' }}>Solutions Frequently Asked Questions</h2>
                        <p style={{ color: '#64748B', fontWeight: 500, fontSize: '1.2rem' }}>Answers to operational workflows for your segment.</p>
                    </div>

                    <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                        {solution.faqs.map((faq, i) => (
                            <FAQItem key={i} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default SolutionPage;
