import React, { useState } from "react";
import { Mail, MessageCircle, HelpCircle } from "lucide-react";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";

const SupportHub = () => {
    const [openIndex, setOpenIndex] = useState(null);

    const toggleFaq = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="auth-pattern" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', background: 'white', borderRadius: '24px', cursor: 'pointer' }} onClick={() => window.location.href = 'mailto:support@usekredibly.com'}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Mail size={24} color="var(--primary)" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>Email Support</h3>
                            <p style={{ color: '#64748B' }}>support@usekredibly.com</p>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', background: 'white', borderRadius: '24px', cursor: 'pointer' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(37, 211, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageCircle size={24} color="#25D366" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>WhatsApp Help</h3>
                            <p style={{ color: '#64748B' }}>Chat with Kreddy Support directly.</p>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '32px', display: 'flex', alignItems: 'center', gap: '24px', background: 'white', borderRadius: '24px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <HelpCircle size={24} color="#64748B" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>FAQs</h3>
                            <p style={{ color: '#64748B' }}>Check the home page for common questions.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <PublicFooter />
        </div>
    );
};

export default SupportHub;
