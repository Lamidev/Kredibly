import React, { useState } from "react";
import { Mail, MessageCircle, HelpCircle } from "lucide-react";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import SEO from "../../components/public/SEO";

const SupportHub = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="auth-pattern" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            <SEO 
                title="Contact & Support" 
                description="Get in touch with Kredibly support. We help small businesses and merchants automate their invoicing and payment collection on WhatsApp." 
                path="/contact" 
            />
            <PublicNavbar />

            <div style={{ paddingTop: '160px', maxWidth: '800px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 className="hero-title" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px' }}>
                        How can we help?
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: '#64748B' }}>
                        Choose a channel to get support instantly.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginBottom: '60px' }}>
                    <div className="glass-card" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', background: 'white', borderRadius: '24px', cursor: 'pointer' }} onClick={() => window.location.href = 'mailto:support@usekredibly.com'}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(124, 58, 237, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Mail size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px', color: '#0F172A' }}>Email Support</h3>
                            <p style={{ color: '#64748B', margin: 0 }}>support@usekredibly.com</p>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', background: 'white', borderRadius: '24px', cursor: 'pointer' }} onClick={() => window.open('https://wa.me/2347071238658', '_blank')}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(37, 211, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageCircle size={24} color="#25D366" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px', color: '#0F172A' }}>WhatsApp Help</h3>
                            <p style={{ color: '#64748B', margin: 0 }}>Chat with Kreddy Support directly.</p>
                        </div>
                    </div>
                </div>

                {/* Support SLA & Hours */}
                <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px', marginBottom: '60px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>Support Availability & SLAs</h3>
                    <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
                        Our AI Customer Assistant is active on WhatsApp **24/7** to handle account settings, invoice recording, and basic merchant settings.
                    </p>
                    <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                        For engineering requests, payment reconciliation tickets, and settlement locks, our human technical support team operates **Monday to Saturday (8:00 AM – 6:00 PM WAT)**. We aim to respond to all email tickets within **2 hours** during support windows.
                    </p>
                </div>

                {/* Operations Address / Trust EEAT */}
                <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px', marginBottom: '80px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '16px' }}>Operations Headquarters</h3>
                    <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
                        **Akinbyte Technologies Ltd**  
                    </p>
                    <p style={{ fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                        39/41 Ontire Avenue, Abaranje Rd, Ikotun, Lagos, Nigeria.  
                        <br />
                        Corporate Registry ID: RC-9466327
                    </p>
                </div>

                {/* FAQ Block */}
                <div style={{ marginBottom: '80px' }}>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '32px', textAlign: 'center' }}>Support Frequently Asked Questions</h3>
                    <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>
                        {[
                            { question: "How do I report a missing payment?", answer: "If your customer completed a transfer and your ledger hasn't updated, please share the customer name, amount, bank transfer slip, and invoice number with support@usekredibly.com." },
                            { question: "Can Kreddy reset my account password?", answer: "Yes, you can initiate a password reset on WhatsApp by telling Kreddy: 'reset my password' or 'I forgot my password'. She will email you a secure reset link." },
                            { question: "How do I change my settlement bank details?", answer: "Log in to your dashboard, navigate to Settings -> Payouts, and update your bank account. For safety, a 24-hour hold is applied on sweeps after banking modifications." }
                        ].map((faq, i) => {
                            const isOpen = openIndex === i;
                            return (
                                <div key={i} style={{ borderBottom: i < 2 ? '1px solid #E2E8F0' : 'none', padding: '20px 0', cursor: 'pointer' }} onClick={() => toggleFaq(i)}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{faq.question}</h4>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--primary)', transform: isOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                                    </div>
                                    {isOpen && (
                                        <p style={{ marginTop: '12px', fontSize: '0.95rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{faq.answer}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
            
            <PublicFooter />
        </div>
    );
};

export default SupportHub;
