import React from 'react';
import {
    MessageCircle,
    Zap,
    ShieldCheck,
    HelpCircle,
    BookOpen,
    LifeBuoy,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const HelpPage = () => {
    const faqs = [
        {
            q: "How do I talk to Kreddy (WhatsApp AI)?",
            a: "Simply text your registered WhatsApp number. You can say things like 'Sold a bag to Funke for 20k' or 'Hi' to see options. Kreddy uses natural language to understand your sales.",
            icon: MessageCircle,
            color: '#25D366'
        },
        {
            q: "What is the Verifiable Trust Score?",
            a: "It's a credibility rating for your business. It grows as you record sales and, most importantly, as your customers click 'Confirm' on their digital receipts.",
            icon: ShieldCheck,
            color: 'var(--primary)'
        },
        {
            q: "How do I share an invoice?",
            a: "After recording a sale (either on the Dashboard or via WhatsApp), you'll get a unique link. You can copy this link or use the 'Share to WhatsApp' button to send it directly to your customer.",
            icon: Zap,
            color: '#F59E0B'
        },
        {
            q: "Can I manage debts automatically?",
            a: "Yes! In your Settings, you can enable 'Proactive Reminders'. Kreddy will automatically nudge you when a customer's payment is due so you can follow up with a single tap.",
            icon: CheckCircle2,
            color: '#10B981'
        }
    ];

    return (
        <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px', letterSpacing: '-0.02em' }}>Help & Support</h1>
                <p style={{ color: '#64748B', fontWeight: 500 }}>Everything you need to know about professionalizing your hustle with Kredibly.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                <div className="glass-card clickable-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                    <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                        <BookOpen size={24} />
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '12px' }}>Getting Started Guide</h3>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' }}>New to Kredibly? Learn how to set up your business profile and record your first sale in under 2 minutes.</p>
                    <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0 }}>
                        Read Guide <ArrowRight size={16} />
                    </button>
                </div>

                <div className="glass-card clickable-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                        <LifeBuoy size={24} />
                    </div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '12px' }}>Contact Support</h3>
                    <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' }}>Need help? Use the blue chat bubble at the bottom right to talk to Kreddy, or click below for instant WhatsApp support.</p>
                    <button
                        onClick={() => window.open('https://wa.me/YOUR_SUPPORT_NUMBER', '_blank')}
                        style={{ background: 'none', border: 'none', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: 0 }}
                    >
                        Chat on WhatsApp <MessageCircle size={16} />
                    </button>
                </div>
            </div>

            <section>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E293B', marginBottom: '24px' }}>Frequently Asked Questions</h2>
                <div style={{ display: 'grid', gap: '16px' }}>
                    {faqs.map((faq, i) => (
                        <div key={i} className="glass-card" style={{ padding: '24px', background: 'white', borderRadius: '20px', border: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ background: `${faq.color}10`, color: faq.color, padding: '10px', borderRadius: '10px', height: 'fit-content' }}>
                                    <faq.icon size={20} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>{faq.q}</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.6, margin: 0 }}>{faq.a}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default HelpPage;
