import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// Dedicated BentoCard component that links scale, opacity & y translation directly to its scroll position in the viewport
const BentoCard = ({ children, style, className }) => {
    const cardRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "end start"]
    });

    // 0.0 -> 0.35: Entering from bottom -> Enlarges from scale 0.70 to 1.0 (actual grid size), opacity 0 -> 1
    // 0.35 -> 0.65: Fully in active view -> Stays at scale 1.0 (actual size), opacity 1
    // 0.65 -> 1.00: Exiting from top / scrolling back up -> Shrinks from scale 1.0 down to 0.70, opacity 1 -> 0 till it disappears
    const scale = useTransform(scrollYProgress, [0.05, 0.35, 0.65, 0.95], [0.70, 1, 1, 0.70]);
    const opacity = useTransform(scrollYProgress, [0.05, 0.25, 0.75, 0.95], [0, 1, 1, 0]);
    const y = useTransform(scrollYProgress, [0.05, 0.35, 0.65, 0.95], [40, 0, 0, -40]);

    return (
        <motion.div
            ref={cardRef}
            className={className}
            style={{
                ...style,
                scale,
                opacity,
                y,
                transformOrigin: 'center center',
                willChange: 'transform, opacity'
            }}
        >
            {children}
        </motion.div>
    );
};

const ProblemSectionV4Bento = () => {
    const sectionRef = useRef(null);

    // Section header scroll transform
    const { scrollYProgress: headerScroll } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });
    const headerScale = useTransform(headerScroll, [0, 0.25, 0.75, 1], [0.85, 1, 1, 0.85]);
    const headerOpacity = useTransform(headerScroll, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

    return (
        <section
            ref={sectionRef}
            id="problem"
            style={{
                padding: 'clamp(4rem, 9vw, 7.5rem) 24px',
                backgroundColor: '#F8FAFC',
                color: '#0F172A',
                position: 'relative',
                overflow: 'hidden',
                borderTop: '1px solid #E2E8F0',
                borderBottom: '1px solid #E2E8F0'
            }}
        >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Section Header */}
                <motion.div
                    style={{
                        textAlign: 'center',
                        marginBottom: 'clamp(40px, 6vw, 64px)',
                        scale: headerScale,
                        opacity: headerOpacity
                    }}
                >
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
                        Hours of productive time and cash flow leak through these 4 friction points every day.
                    </p>
                </motion.div>

                {/* BENTO GRID */}
                <div className="bento-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gridTemplateRows: 'auto auto',
                    gap: '16px'
                }}>
                    {/* CELL 1 — Wide top-left: Invoice (spans 2 cols) */}
                    <BentoCard
                        style={{
                            gridColumn: 'span 2',
                            background: '#0F172A',
                            borderRadius: '28px',
                            padding: 'clamp(28px, 4vw, 44px)',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '260px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-40px', left: '-40px', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', color: '#EF4444', textTransform: 'uppercase' }}>01</span>
                                <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.15)', display: 'block' }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.8)', textTransform: 'uppercase' }}>Invoice Hassle</span>
                            </div>
                            <p style={{
                                fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)',
                                fontWeight: 900,
                                lineHeight: 1.15,
                                letterSpacing: '-0.03em',
                                color: '#F8FAFC',
                                fontStyle: 'italic',
                                margin: '0 0 20px 0'
                            }}>
                                "Send invoice<br />make I pay."
                            </p>
                        </div>
                        <p style={{ color: '#64748B', fontSize: '0.92rem', lineHeight: 1.65, position: 'relative', zIndex: 1, margin: 0 }}>
                            Calculator, notes app, manual PDF, copy-paste to WhatsApp — every single time. While customers wait.
                        </p>
                    </BentoCard>

                    {/* CELL 2 — Top-right: Debt Chasing */}
                    <BentoCard
                        style={{
                            gridColumn: 'span 1',
                            background: 'linear-gradient(150deg, #FFF7ED 0%, #FFEDD5 100%)',
                            borderRadius: '28px',
                            padding: 'clamp(24px, 3vw, 36px)',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '260px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '1px solid rgba(249,115,22,0.15)'
                        }}
                    >
                        <div style={{ position: 'absolute', bottom: '-30px', right: '-30px', width: '160px', height: '160px', background: 'radial-gradient(circle, rgba(249,115,22,0.2) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', color: '#F97316', textTransform: 'uppercase' }}>02</span>
                                <span style={{ width: '1px', height: '10px', background: 'rgba(249,115,22,0.3)', display: 'block' }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: '#92400E', textTransform: 'uppercase' }}>Debt Chasing</span>
                            </div>
                            <p style={{
                                fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)',
                                fontWeight: 900,
                                lineHeight: 1.2,
                                letterSpacing: '-0.02em',
                                color: '#7C2D12',
                                fontStyle: 'italic',
                                margin: '0 0 16px 0'
                            }}>
                                "I go pay you<br />on Friday."
                            </p>
                        </div>
                        <p style={{ color: '#92400E', fontSize: '0.85rem', lineHeight: 1.65, position: 'relative', zIndex: 1, margin: 0, opacity: 0.8 }}>
                            Friday passes. Asking feels awkward. Cash flow stays trapped.
                        </p>
                    </BentoCard>

                    {/* CELL 3 — Bottom-left: Alert Anxiety */}
                    <BentoCard
                        style={{
                            gridColumn: 'span 1',
                            background: 'linear-gradient(150deg, #FEFCE8 0%, #FEF9C3 100%)',
                            borderRadius: '28px',
                            padding: 'clamp(24px, 3vw, 36px)',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '240px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '1px solid rgba(234,179,8,0.2)'
                        }}
                    >
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '130px', height: '130px', background: 'radial-gradient(circle, rgba(234,179,8,0.25) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', color: '#D97706', textTransform: 'uppercase' }}>03</span>
                                <span style={{ width: '1px', height: '10px', background: 'rgba(234,179,8,0.4)', display: 'block' }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: '#78350F', textTransform: 'uppercase' }}>Alert Anxiety</span>
                            </div>
                            <p style={{
                                fontSize: 'clamp(1.1rem, 2vw, 1.55rem)',
                                fontWeight: 900,
                                lineHeight: 1.2,
                                letterSpacing: '-0.02em',
                                color: '#78350F',
                                fontStyle: 'italic',
                                margin: '0 0 16px 0'
                            }}>
                                "I don transfer,<br />check alert."
                            </p>
                        </div>
                        <p style={{ color: '#92400E', fontSize: '0.85rem', lineHeight: 1.65, position: 'relative', zIndex: 1, margin: 0, opacity: 0.75 }}>
                            10 bank app refreshes before you pack one order.
                        </p>
                    </BentoCard>

                    {/* CELL 4 — Bottom-center+right: Notebook Chaos (spans 2 cols) */}
                    <BentoCard
                        style={{
                            gridColumn: 'span 2',
                            background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                            borderRadius: '28px',
                            padding: 'clamp(28px, 4vw, 44px)',
                            position: 'relative',
                            overflow: 'hidden',
                            minHeight: '240px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '1px solid rgba(139,92,246,0.15)'
                        }}
                    >
                        <div style={{ position: 'absolute', bottom: '-40px', right: '10%', width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', color: '#7C3AED', textTransform: 'uppercase' }}>04</span>
                                <span style={{ width: '1px', height: '10px', background: 'rgba(139,92,246,0.3)', display: 'block' }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: '#5B21B6', textTransform: 'uppercase' }}>Notebook Chaos</span>
                            </div>
                            <p style={{
                                fontSize: 'clamp(1.4rem, 3vw, 2.2rem)',
                                fontWeight: 900,
                                lineHeight: 1.2,
                                letterSpacing: '-0.03em',
                                color: '#3B0764',
                                fontStyle: 'italic',
                                margin: '0 0 16px 0'
                            }}>
                                "Where I keep<br />that record again?"
                            </p>
                        </div>
                        <div className="bento-last-bottom" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                            <p style={{ color: '#5B21B6', fontSize: '0.92rem', lineHeight: 1.65, margin: 0, opacity: 0.8, flex: '1 1 200px' }}>
                                Sales in notebooks, alerts in SMS, orders in WhatsApp. At month end, you can't tell your exact profit.
                            </p>
                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                {['₦45k Tola', '₦12k Emeka', '₦8k Friday'].map((t, i) => (
                                    <div key={i} style={{
                                        background: 'white',
                                        borderRadius: '10px',
                                        padding: '6px 10px',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        color: '#7C3AED',
                                        boxShadow: '0 4px 12px -2px rgba(139,92,246,0.15)',
                                        transform: `rotate(${[-4, 2, -2][i]}deg)`,
                                        whiteSpace: 'nowrap'
                                    }}>{t}</div>
                                ))}
                            </div>
                        </div>
                    </BentoCard>
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
                @media (max-width: 768px) {
                    .bento-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .bento-grid > * {
                        grid-column: span 1 !important;
                    }
                }
            `}</style>
        </section>
    );
};

export default ProblemSectionV4Bento;
