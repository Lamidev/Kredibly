import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
    const navigate = useNavigate();

    return (
        <section style={{
            padding: 'clamp(40px, 6vw, 80px) 24px',
            backgroundColor: '#FFFFFF',
            color: '#FFFFFF'
        }}>
            <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    style={{
                        position: 'relative',
                        background: 'linear-gradient(135deg, #091026 0%, #0F172A 50%, #1E1B4B 100%)',
                        borderRadius: '40px',
                        padding: 'clamp(60px, 8vw, 100px) clamp(24px, 5vw, 64px)',
                        textAlign: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px -15px rgba(15, 23, 42, 0.3)'
                    }}
                >
                    {/* Concentric SVG Radial Ripple Circles Pattern */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '1000px',
                        height: '1000px',
                        pointerEvents: 'none',
                        zIndex: 1,
                        opacity: 0.6
                    }}>
                        <svg width="100%" height="100%" viewBox="0 0 1000 1000" fill="none">
                            <circle cx="500" cy="500" r="150" stroke="white" strokeOpacity="0.04" strokeWidth="1.5" />
                            <circle cx="500" cy="500" r="280" stroke="white" strokeOpacity="0.06" strokeWidth="1.5" />
                            <circle cx="500" cy="500" r="410" stroke="white" strokeOpacity="0.08" strokeWidth="1.5" />
                            <circle cx="500" cy="500" r="540" stroke="white" strokeOpacity="0.05" strokeWidth="1.5" />
                            <circle cx="500" cy="500" r="670" stroke="white" strokeOpacity="0.03" strokeWidth="1.5" />
                        </svg>
                    </div>

                    {/* Content Container */}
                    <div style={{ position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto' }}>
                        <h2 style={{
                            fontSize: 'clamp(2.1rem, 5.5vw, 3.8rem)',
                            fontWeight: 900,
                            letterSpacing: '-0.04em',
                            lineHeight: 1.12,
                            color: '#FFFFFF',
                            marginBottom: '20px'
                        }}>
                            Ready to Run Your Business <br className="hidden-mobile" /> Without Stress?
                        </h2>

                        <p style={{
                            color: '#94A3B8',
                            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                            lineHeight: 1.6,
                            fontWeight: 400,
                            maxWidth: '640px',
                            margin: '0 auto 40px'
                        }}>
                            Try Kredibly free for 14 days. Send invoices, collect instant bank payments, and track sales on WhatsApp in under 2 minutes.
                        </p>

                        {/* White Capsule Pill Button with Circle Arrow Badge */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                            <button
                                onClick={() => navigate('/auth/register')}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '10px 10px 10px 32px',
                                    borderRadius: '100px',
                                    backgroundColor: '#FFFFFF',
                                    color: '#0F172A',
                                    border: 'none',
                                    fontWeight: 800,
                                    fontSize: 'clamp(0.98rem, 1.5vw, 1.1rem)',
                                    cursor: 'pointer',
                                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25)',
                                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.35)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.25)';
                                }}
                            >
                                <span>Get 14 Days Free</span>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#FFFFFF',
                                    flexShrink: 0
                                }}>
                                    <ArrowRight size={20} strokeWidth={2.5} />
                                </div>
                            </button>

                            <span style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 500 }}>
                                No card required. Setup in under 2 minutes.
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTASection;
