import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import { Users, ShieldCheck, BookOpen, Lock, MessageSquare, HelpCircle, CheckCircle2, Award } from "lucide-react";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import SEO from "../../components/public/SEO";

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div style={{ borderBottom: '1px solid #E2E8F0', padding: '20px 0', cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{question}</h4>
                <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary)', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
            </div>
            {isOpen && (
                <p style={{ marginTop: '12px', fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                    {answer}
                </p>
            )}
        </div>
    );
};

const AboutUs = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const roadmapData = [
        { date: "JULY '25", title: "The Genesis", desc: "Research Phase: Identifying the informal bookkeeping gap and high failure rates in SME debt collection.", status: "completed" },
        { date: "SEPT '25", title: "Strategic Architecture", desc: "Design of our WhatsApp conversational transaction engine and real-time ledger architecture.", status: "completed" },
        { date: "DEC '25", title: "Kreddy AI Core", desc: "Training Kreddy to process Nigerian business slang, unstructured inputs, and voice notes.", status: "completed" },
        { date: "JAN '26 - MID-AUG '26", title: "Pioneer Program", desc: "Onboarding the first 1,000 retail pioneers under early-access status with lifetime transaction perks.", status: "active" },
        { date: "AUGUST 16TH '26", title: "Global Public Launch", desc: "Releasing Kredibly globally. Any African SME can start collecting payments via WhatsApp instantly.", status: "future" }
    ];

    const faqs = [
        { question: "What is Kredibly?", answer: "Kredibly is a personal AI business assistant that works directly inside WhatsApp. It helps African merchants, retail stores, and solopreneurs create invoices, automate customer debt tracking, send payment follow-ups, and receive bank transfer payments natively through chat." },
        { question: "Who are the founders of Kredibly?", answer: "Kredibly was founded by a team of African fintech developers and product designers who experienced firsthand the difficulty informal merchants face when tracking credits, reconciling accounts, and managing receivables without complex spreadsheets." },
        { question: "Is Kredibly secure?", answer: "Yes. Kredibly features bank-grade encryption layers. We never store credit card details, and all virtual accounts and payment links are securely processed through licensed and regulated payment channels (like Nomba)." },
        { question: "Why build on WhatsApp?", answer: "WhatsApp has a massive adoption rate across Africa. Instead of forcing merchants and their customers to download complex apps or visit slow web portals, we brought the entire financial ledger directly into the conversations they are already having daily." },
        { question: "How does the escrow settlement work?", answer: "When a customer pays a Kredibly invoice, the funds are safely processed through our partner rails and instantly swept directly into the merchant's linked bank account. Merchants enjoy zero payout transfer fees on all sweeps." }
    ];

    return (
        <div className="auth-pattern" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            <SEO 
                title="About Us" 
                description="We are building the OS for African Commerce. Kredibly bridges the gap between informal chat-based sales and formal financial credibility." 
                path="/about" 
            />
            <PublicNavbar />

            <div style={{ paddingTop: '160px', maxWidth: '1000px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
                <header style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h1 className="hero-title" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '24px' }}>
                        We are building the <span className="premium-gradient">OS for African Commerce</span>.
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                        Kredibly bridges the gap between informal chat-based sales and formal financial credibility.
                    </p>
                </header>

                {/* Section 1: Core Mission */}
                <div className="glass-card" style={{ padding: '60px', borderRadius: '32px', background: 'white', marginBottom: '40px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '16px' }}>
                        <Award size={18} /> OUR CORE MISSION
                    </div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '24px' }}>Empowering Millions of African Merchants</h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#475569', marginBottom: '0' }}>
                        For millions of African vendors, business happens on WhatsApp. Sales are negotiated, delivery locations are shared, and customer relationships are built inside chat. However, this critical transactional data is lost in chat history. It doesn't build a credit score, it doesn't serve as a ledger for tax audits, and it cannot help you obtain working capital.
                        <br /><br />
                        Kredibly changes that. We built <b>Kreddy</b>, an AI assistant that lives directly inside WhatsApp. By simply chatting or sending voice notes, Kreddy creates structured invoices, registers debtors, sends friendly payment reminders, coordinates conversational extensions, and reconciles incoming bank transfers instantly. Your conversations are automatically compiled into a verified dashboard ledger, bridging the gap between informal chat sales and formal financial credibility.
                    </p>
                </div>

                {/* Section 2: Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '80px' }}>
                    <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                        <Users size={32} color="var(--primary)" style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', color: '#0F172A' }}>For the Hustlers</h3>
                        <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '0.95rem' }}>We design for the solopreneurs, the Instagram vendors, and the market traders who run the economy. Kredibly works without spreadsheets or accounting jargon.</p>
                    </div>
                    <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                        <ShieldCheck size={32} color="#10B981" style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px', color: '#0F172A' }}>Trust First</h3>
                        <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '0.95rem' }}>Our goal is building trust. By verifying transaction cycles and delivering automated ledger seals, we turn informal sales into creditworthy records.</p>
                    </div>
                </div>

                {/* Section 3: Why WhatsApp */}
                <div className="glass-card" style={{ padding: '60px', borderRadius: '32px', background: 'white', marginBottom: '40px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '16px' }}>
                        <MessageSquare size={18} /> THE WHATSAPP ADVANTAGE
                    </div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '24px' }}>Why We Are WhatsApp-Native</h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#475569', marginBottom: '0' }}>
                        The informal economy moves fast. Forcing your customers to visit external website links to make payment, or forcing yourself to log in to complex web dashboards just to record a sale introduces unnecessary friction.
                        <br /><br />
                        Over 90% of mobile internet users in Africa use WhatsApp daily. By embedding Kredibly natively inside WhatsApp, we align with customer behavior:
                    </p>
                    <ul style={{ marginTop: '24px', listStyleType: 'none', paddingLeft: 0 }}>
                        {[
                            "No app installations required for you or your customers.",
                            "Send voice notes or simple texts to record sales in 5 seconds.",
                            "Invoices and payment notifications arrive where customers check messages.",
                            "Automatic, polite debt reminders that get clicked and resolved immediately."
                        ].map((item, index) => (
                            <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '1.05rem', color: '#475569', fontWeight: 500 }}>
                                <CheckCircle2 size={18} color="#10B981" style={{ flexShrink: 0 }} />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Section 4: Technology & Security */}
                <div className="glass-card" style={{ padding: '60px', borderRadius: '32px', background: 'white', marginBottom: '80px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '16px' }}>
                        <Lock size={18} /> SECURITY & STACK
                    </div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0F172A', marginBottom: '24px' }}>Bank-Grade Security for Your Ledger</h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#475569', marginBottom: '0' }}>
                        Kredibly handles critical financial information. We ensure all transactions are protected by industry-standard encryption protocols.
                        <br /><br />
                        Our platform is built in partnership with licensed commercial payment systems (Nomba) to manage dynamic virtual bank accounts. When bank transfers are performed, the funds are swept securely to your account with zero delays. Every transaction is logged with a secure cryptographic seal, ensuring that your records cannot be tampered with.
                    </p>
                </div>

                {/* Section 5: Timeline */}
                <section style={{ marginBottom: '120px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>THE MISSION MAP</div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '16px' }}>Our Journey & Vision</h2>
                        <p style={{ color: '#64748B', fontWeight: 500, fontSize: '1.2rem' }}>Building the future of African commerce, one milestone at a time.</p>
                    </div>

                    <div style={{ position: 'relative', paddingLeft: '40px', maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #E2E8F0 0%, var(--primary) 30%, var(--primary) 70%, #E2E8F0 100%)' }} />

                        {roadmapData.map((m, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                style={{ marginBottom: '64px', position: 'relative' }}
                            >
                                <div style={{ 
                                    position: 'absolute', 
                                    left: '-41px', 
                                    top: '4px', 
                                    width: '16px', 
                                    height: '16px', 
                                    borderRadius: '50%', 
                                    background: m.status === 'active' ? 'var(--primary)' : m.status === 'completed' ? '#10B981' : 'white',
                                    border: m.status === 'future' ? '2px solid #E2E8F0' : 'none',
                                    zIndex: 2
                                }}>
                                    {m.status === 'active' && <div className="pulse-dot-about" />}
                                </div>

                                <div style={{ opacity: m.status === 'completed' ? 0.7 : 1 }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: m.status === 'active' ? 'var(--primary)' : '#94A3B8', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>{m.date}</span>
                                    <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginBottom: '10px' }}>{m.title}</h4>
                                    <p style={{ color: '#64748B', fontWeight: 500, lineHeight: 1.6 }}>{m.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Section 6: FAQ Accordion */}
                <section style={{ paddingBottom: '100px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '16px' }}>
                            <HelpCircle size={18} /> QUESTIONS & ANSWERS
                        </div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', marginBottom: '16px' }}>Frequently Asked Questions</h2>
                        <p style={{ color: '#64748B', fontWeight: 500, fontSize: '1.2rem' }}>Everything you need to know about the Kredibly ledger ecosystem.</p>
                    </div>

                    <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                        {faqs.map((faq, i) => (
                            <FAQItem key={i} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </section>
            </div>
            <PublicFooter />
            <style>{`
                .pulse-dot-about {
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    background: var(--primary);
                    opacity: 0.3;
                    animation: pulse-ring-about 2s infinite;
                }
                @keyframes pulse-ring-about {
                    0% { transform: scale(1); opacity: 0.3; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default AboutUs;
