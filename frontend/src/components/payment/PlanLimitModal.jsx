import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, X, Check, Shield, 
    Sparkles, ArrowRight, Star,
    MessageSquare,
    Calculator
} from 'lucide-react';

const PlanLimitModal = ({ isOpen, onClose, onUpgrade }) => {
    if (!isOpen) return null;

    const benefits = [
        { icon: <Zap size={18} />, title: "Unlimited Invoices", desc: "No more caps. Record every sale, big or small." },
        { icon: <MessageSquare size={18} />, title: "AI-Powered Follow-ups", desc: "Kreddy handles your debtors automatically." },
        { icon: <Shield size={18} />, title: "Verified Ledger", desc: "Premium trust badges on all your public receipts." },
        { icon: <Calculator size={18} />, title: "Detailed Analytics", desc: "Understand your cashflow like a pro." }
    ];

    return createPortal(
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                style={{ 
                    position: 'fixed', inset: 0, 
                    background: 'rgba(15, 23, 42, 0.7)', 
                    zIndex: 10000, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    backdropFilter: 'blur(16px)', padding: '20px' 
                }}
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    style={{ 
                        background: 'white', 
                        width: '100%', 
                        maxWidth: '520px', 
                        borderRadius: '40px', 
                        boxShadow: '0 30px 100px -20px rgba(0,0,0,0.5)', 
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                >
                    {/* Background Glow */}
                    <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '300px', height: '300px', background: 'var(--primary)', opacity: 0.1, filter: 'blur(100px)', borderRadius: '50%' }} />

                    <div style={{ padding: '40px', position: 'relative' }}>
                        {/* Close Button */}
                        <button 
                            onClick={onClose}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: '#F1F5F9', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: '#64748B' }}
                        >
                            <X size={20} />
                        </button>

                        {/* Top Icon */}
                        <div style={{ 
                            background: 'linear-gradient(135deg, #4C1D95, #2E1065)', 
                            color: 'white', 
                            width: '80px', height: '80px', 
                            borderRadius: '28px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            margin: '0 auto 32px',
                            boxShadow: '0 20px 40px -10px var(--primary-glow)'
                        }}>
                            <Zap size={40} fill="white" />
                        </div>

                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <div style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                background: 'rgba(76, 29, 149, 0.08)', 
                                padding: '8px 16px', 
                                borderRadius: '100px',
                                marginBottom: '16px'
                            }}>
                                <Sparkles size={14} color="var(--primary)" />
                                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Trial Limit Reached</span>
                            </div>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 950, color: '#0F172A', marginBottom: '16px', letterSpacing: '-0.04em', lineHeight: 1 }}>Upgrade to <span style={{ color: 'var(--primary)' }}>Oga</span></h2>
                            <p style={{ color: '#64748B', fontWeight: 600, fontSize: '1.1rem', lineHeight: 1.5 }}>You've hit the 5-invoice limit. Ready to professionalize your business and recover debt faster?</p>
                        </div>

                        {/* Benefits Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
                            {benefits.map((benefit, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {benefit.icon}
                                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{benefit.title}</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, margin: 0, lineHeight: 1.4 }}>{benefit.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <button 
                                onClick={onUpgrade}
                                className="btn-primary"
                                style={{ 
                                    width: '100%', padding: '20px', 
                                    borderRadius: '20px', fontSize: '1.2rem', 
                                    fontWeight: 900, display: 'flex', 
                                    alignItems: 'center', justifyContent: 'center', 
                                    gap: '12px', boxShadow: '0 20px 40px -10px var(--primary-glow)'
                                }}
                            >
                                <Star size={20} fill="white" />
                                Become an Oga Now
                                <ArrowRight size={20} strokeWidth={3} />
                            </button>
                            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem', fontWeight: 700 }}>
                                Join 500+ Nigerian merchants professionalizing their recovery.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default PlanLimitModal;
