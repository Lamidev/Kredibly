import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

// ROI V2 — Side-by-Side Transformation Table
// Dark left panel (Without) + bright right panel (With Kreddy)
// Each row has a visual "cost badge" showing the loss

const ROISectionV2Table = () => {
    const rows = [
        {
            pain: "Forgotten Credit Sales",
            painDesc: "Unrecorded debts lost in WhatsApp chat history",
            cost: "₦50k+/mo",
            fix: "Automated WhatsApp Debt Tracking",
            fixDesc: "Kreddy logs every credit sale, debtor balance & due date in 5 seconds."
        },
        {
            pain: "Manual Bank Alert Audits",
            painDesc: "Refreshing banking apps 10× a day to verify transfers",
            cost: "3hrs/day",
            fix: "Instant Auto-Reconciliation",
            fixDesc: "Nomba virtual accounts auto-confirm and reconcile every payment instantly."
        },
        {
            pain: "Payment Gateway Cuts",
            painDesc: "1.5% transaction fees + 24hr settlement delays",
            cost: "~₦30k/mo",
            fix: "0% Fee Instant Settlements",
            fixDesc: "We cover all settlement transfer fees. Money hits your bank the same moment."
        },
        {
            pain: "Awkward Debt Chasing",
            painDesc: "Manually calling customers for unpaid invoices",
            cost: "2hrs/day",
            fix: "Automated Polite Nudges",
            fixDesc: "Kreddy sends timed, professional reminders without any awkwardness."
        }
    ];

    return (
        <section id="roi" style={{
            padding: 'clamp(4rem, 9vw, 7.5rem) 24px',
            background: '#0F172A',
            color: '#F8FAFC',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient glow */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />

            <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-60px" }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}
                >
                    <p style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: '12px' }}>
                        The Real Cost of Doing Nothing
                    </p>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.4rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.1,
                        color: '#F8FAFC',
                        marginBottom: '16px'
                    }}>
                        How Much Is Manual Management<br />
                        <span style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Costing You?
                        </span>
                    </h2>
                    <p style={{ color: '#94A3B8', fontSize: 'clamp(1rem, 2vw, 1.15rem)', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
                        Every hour spent on manual processes is a direct hit to your revenue and your time.
                    </p>
                </motion.div>

                {/* Comparison Table */}
                <div style={{ borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {/* Table Header */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 96px 1fr',
                        background: 'rgba(255,255,255,0.04)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        padding: '14px 24px'
                    }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#EF4444' }}>Without Kreddy</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8', textAlign: 'center' }}>Cost</div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4ADE80', textAlign: 'right' }}>With Kreddy</div>
                    </div>

                    {rows.map((row, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -16 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false, margin: "-40px" }}
                            transition={{ duration: 0.45, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 96px 1fr',
                                padding: 'clamp(16px, 2.5vw, 24px)',
                                borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                alignItems: 'center',
                                gap: '16px',
                                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                            }}
                        >
                            {/* Left: Pain */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'rgba(239,68,68,0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                    fontSize: '10px',
                                    color: '#EF4444',
                                    fontWeight: 900
                                }}>✕</div>
                                <div>
                                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#F8FAFC', fontSize: '0.95rem' }}>{row.pain}</p>
                                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem', lineHeight: 1.5 }}>{row.painDesc}</p>
                                </div>
                            </div>

                            {/* Center: Cost badge */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    background: 'rgba(239,68,68,0.12)',
                                    border: '1px solid rgba(239,68,68,0.25)',
                                    borderRadius: '100px',
                                    padding: '5px 10px',
                                    fontSize: '0.68rem',
                                    fontWeight: 900,
                                    color: '#FCA5A5',
                                    letterSpacing: '0.04em',
                                    whiteSpace: 'nowrap'
                                }}>{row.cost}</div>
                            </div>

                            {/* Right: Fix */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#4ADE80', fontSize: '0.95rem' }}>{row.fix}</p>
                                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem', lineHeight: 1.5 }}>{row.fixDesc}</p>
                                </div>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: 'rgba(74,222,128,0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '2px'
                                }}>
                                    <Check size={11} color="#4ADE80" strokeWidth={3} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom summary stat */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        marginTop: '32px',
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(219,39,119,0.1) 100%)',
                        border: '1px solid rgba(124,58,237,0.25)',
                        borderRadius: '20px',
                        padding: '24px 32px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                    }}
                >
                    <div>
                        <p style={{ margin: '0 0 4px', fontWeight: 800, color: '#F8FAFC', fontSize: '1.05rem' }}>
                            You're losing more than you think.
                        </p>
                        <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.88rem' }}>
                            Manual management costs the average Nigerian merchant 5+ hours and ₦80k+ every single month.
                        </p>
                    </div>
                    <a
                        href="https://wa.me/2349134715971?text=Hi%20Kreddy%2C%20I%20want%20to%20stop%20losing%20money%20to%20manual%20processes."
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 10px 10px 22px',
                            borderRadius: '100px',
                            background: 'var(--primary)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 8px 24px rgba(124,58,237,0.3)'
                        }}
                    >
                        <span>Fix It with Kreddy</span>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--primary)">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                            </svg>
                        </div>
                    </a>
                </motion.div>
            </div>
        </section>
    );
};

export default ROISectionV2Table;
