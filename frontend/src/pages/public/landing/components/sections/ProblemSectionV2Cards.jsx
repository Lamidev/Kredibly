import React from "react";
import { motion } from "framer-motion";

const ProblemSectionV2Cards = () => {
    const painPoints = [
        {
            num: "01",
            label: "Invoice Hassle",
            quote: '"Send invoice make I pay."',
            desc: "You open a calculator, type items in notes, format a PDF manually and copy to WhatsApp — while other customers wait.",
            accent: "#EF4444",
            accentBg: "rgba(239,68,68,0.06)"
        },
        {
            num: "02",
            label: "Awkward Debt Chasing",
            quote: '"I go pay you on Friday."',
            desc: "Friday passes. Asking feels awkward. Your supplier is calling and your cash flow is trapped in someone's promise.",
            accent: "#F97316",
            accentBg: "rgba(249,115,22,0.06)"
        },
        {
            num: "03",
            label: "Bank Alert Anxiety",
            quote: '"I don transfer, check alert."',
            desc: "You log into your banking app and refresh 10 times a day to verify a transfer before you pack an order.",
            accent: "#EAB308",
            accentBg: "rgba(234,179,8,0.06)"
        },
        {
            num: "04",
            label: "Notebook Chaos",
            quote: '"Where I keep that record again?"',
            desc: "Sales in notebooks, alerts in SMS, orders in WhatsApp chats. At month end you can't tell your actual profit.",
            accent: "#8B5CF6",
            accentBg: "rgba(139,92,246,0.06)"
        }
    ];

    return (
        <section id="problem" style={{
            padding: 'clamp(4rem, 9vw, 7.5rem) 24px',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '1px solid #E2E8F0',
            borderBottom: '1px solid #E2E8F0'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Section Header */}
                <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
                    <h2 style={{
                        fontSize: 'clamp(2.1rem, 5vw, 3.6rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.15,
                        color: '#0F172A',
                        marginBottom: '16px'
                    }}>
                        Running a Business Shouldn't{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, var(--primary) 0%, #DB2777 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Feel Like This Every Day.</span>
                    </h2>
                    <p style={{
                        color: '#64748B',
                        fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                        fontWeight: 400,
                        maxWidth: '700px',
                        margin: '0 auto',
                        lineHeight: 1.6
                    }}>
                        Hours of productive time and cash flow leak through these 4 manual friction points every single day.
                    </p>
                </div>

                {/* 2×2 Card Grid */}
                <div className="pain-cards-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 'clamp(16px, 2vw, 24px)'
                }}>
                    {painPoints.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: false, margin: "-60px" }}
                            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                background: '#FFFFFF',
                                borderRadius: '24px',
                                padding: 'clamp(24px, 3vw, 36px)',
                                border: '1px solid #E2E8F0',
                                borderLeft: `4px solid ${item.accent}`,
                                boxShadow: '0 4px 24px -6px rgba(15,23,42,0.06)',
                                position: 'relative',
                                overflow: 'hidden',
                                transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                            }}
                            whileHover={{ y: -4, boxShadow: '0 16px 48px -8px rgba(15,23,42,0.12)' }}
                        >
                            {/* Soft accent background blob */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '160px',
                                height: '160px',
                                borderRadius: '50%',
                                background: item.accentBg,
                                filter: 'blur(40px)',
                                zIndex: 0
                            }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                {/* Label row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 900,
                                        color: item.accent,
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase'
                                    }}>{item.num}</span>
                                    <span style={{
                                        width: '1px',
                                        height: '14px',
                                        background: '#E2E8F0',
                                        display: 'block'
                                    }} />
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: '#94A3B8',
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase'
                                    }}>{item.label}</span>
                                </div>

                                {/* Dramatic Quote — Hero Element */}
                                <p style={{
                                    fontSize: 'clamp(1.25rem, 2.2vw, 1.55rem)',
                                    fontWeight: 900,
                                    color: '#0F172A',
                                    fontStyle: 'italic',
                                    lineHeight: 1.25,
                                    letterSpacing: '-0.02em',
                                    marginBottom: '16px',
                                    margin: '0 0 20px 0'
                                }}>
                                    {item.quote}
                                </p>

                                {/* Divider */}
                                <div style={{
                                    width: '32px',
                                    height: '2px',
                                    background: item.accent,
                                    borderRadius: '2px',
                                    marginBottom: '16px',
                                    opacity: 0.5
                                }} />

                                {/* Description */}
                                <p style={{
                                    color: '#64748B',
                                    fontSize: 'clamp(0.88rem, 1.3vw, 0.96rem)',
                                    lineHeight: 1.7,
                                    fontWeight: 400,
                                    margin: 0
                                }}>
                                    {item.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Transition Callout */}
                <div style={{
                    textAlign: 'center',
                    marginTop: '56px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                        There is a better way
                    </span>
                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '1.4rem' }}
                    >
                        ↓
                    </motion.div>
                </div>
            </div>

            <style>{`
                @media (max-width: 640px) {
                    .pain-cards-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </section>
    );
};

export default ProblemSectionV2Cards;
