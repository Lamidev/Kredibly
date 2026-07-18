import React from "react";
import { motion } from "framer-motion";

const ProblemSection = () => {
    const painPoints = [
        {
            num: "01",
            title: "The Invoice Hassle",
            quote: '"Send invoice make I pay."',
            desc: "Customer asks for an invoice. You open calculator to do math, type out items in notes app, format a PDF manually, and copy to WhatsApp while other customers wait."
        },
        {
            num: "02",
            title: "Awkward Debt Chasing",
            quote: '"I go pay you on Friday."',
            desc: "Friday passes. You want your money, but asking feels awkward. Meanwhile, your supplier is calling for payment and your cash flow is trapped."
        },
        {
            num: "03",
            title: "Bank Alert Refresh Stress",
            quote: '"I don transfer, check alert."',
            desc: "Customer says they transferred money, but bank app network is slow. You log in and refresh 10 times a day just to verify alerts before packing orders."
        },
        {
            num: "04",
            title: "Notebook Chaos",
            quote: '"Where I keep that record again?"',
            desc: "Sales written in paper notebooks, alerts in SMS, orders in WhatsApp chats. At the end of the month, you can't tell your exact profit or total sales."
        }
    ];

    return (
        <section id="problem" style={{
            padding: 'clamp(4rem, 9vw, 7.5rem) 24px',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '1px solid #F1F5F9',
            borderBottom: '1px solid #F1F5F9'
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
                        Running a Business Shouldn't <br />
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
                        Every day, hours of productive time and cash flow leak through these 4 manual friction points.
                    </p>
                </div>

                {/* Concept 2: Minimalist Editorial List Table */}
                <div style={{ borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                    {painPoints.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.08 }}
                            className="editorial-list-row"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(12, 1fr)',
                                padding: 'clamp(24px, 3.5vw, 32px) 16px',
                                borderBottom: index < painPoints.length - 1 ? '1px solid #F1F5F9' : 'none',
                                alignItems: 'center',
                                gap: '16px',
                                transition: 'all 0.25s ease',
                                borderRadius: '16px'
                            }}
                        >
                            {/* Number & Title */}
                            <div style={{ gridColumn: 'span 12', display: 'flex', alignItems: 'center', gap: '16px' }} className="ed-num-title">
                                <span style={{ 
                                    fontSize: '1rem', 
                                    fontWeight: 800, 
                                    color: 'var(--primary)', 
                                    opacity: 0.8,
                                    width: '24px'
                                }}>
                                    {item.num}
                                </span>
                                <h3 style={{ 
                                    fontSize: 'clamp(1.25rem, 2.2vw, 1.55rem)', 
                                    fontWeight: 800, 
                                    color: '#0F172A', 
                                    margin: 0,
                                    letterSpacing: '-0.02em'
                                }}>
                                    {item.title}
                                </h3>
                            </div>

                            {/* Quote */}
                            <div style={{ gridColumn: 'span 12' }} className="ed-quote">
                                <span style={{ 
                                    fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)', 
                                    fontWeight: 700, 
                                    color: '#EF4444', 
                                    fontStyle: 'italic'
                                }}>
                                    {item.quote}
                                </span>
                            </div>

                            {/* Description */}
                            <div style={{ gridColumn: 'span 12' }} className="ed-desc">
                                <p style={{ 
                                    color: '#475569', 
                                    fontSize: 'clamp(0.96rem, 1.5vw, 1.05rem)', 
                                    lineHeight: 1.6, 
                                    fontWeight: 400,
                                    margin: 0
                                }}>
                                    {item.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Transition Callout to Meet Kreddy */}
                <div style={{ 
                    textAlign: 'center', 
                    marginTop: '48px',
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
                @media (min-width: 992px) {
                    .editorial-list-row .ed-num-title {
                        grid-column: span 4 !important;
                    }
                    .editorial-list-row .ed-quote {
                        grid-column: span 3 !important;
                    }
                    .editorial-list-row .ed-desc {
                        grid-column: span 5 !important;
                    }
                }
                .editorial-list-row:hover {
                    background: #F8FAFC !important;
                    padding-left: 24px !important;
                }
            `}</style>
        </section>
    );
};

export default ProblemSection;
