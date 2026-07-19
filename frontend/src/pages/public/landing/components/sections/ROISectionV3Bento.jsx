import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

// ROI V3 — Bento-style stat cards + interactive flip cards
// Big bold stat numbers dominate, hover reveals the "Kreddy fix"

const stats = [
    {
        icon: "📋",
        stat: "5+",
        unit: "hrs/week",
        label: "Wasted on manual invoicing",
        color: "#EF4444",
        bg: "#0F172A",
        textColor: "#F8FAFC",
        flip: {
            headline: "Done in 10 seconds",
            desc: "Say it to Kreddy. She logs the sale, creates the invoice and delivers it to your customer's WhatsApp — no typing, no formatting.",
            color: "#4ADE80"
        }
    },
    {
        icon: "💸",
        stat: "₦80k",
        unit: "/month",
        label: "Lost to forgotten credit sales",
        color: "#F97316",
        bg: "#FFF7ED",
        textColor: "#7C2D12",
        flip: {
            headline: "Every debt tracked",
            desc: "Kreddy records every credit sale instantly. Auto-reminders go out so you never chase a customer awkwardly again.",
            color: "#7C3AED"
        }
    },
    {
        icon: "🏦",
        stat: "24hr",
        unit: "delay",
        label: "Before money hits your account",
        color: "#EAB308",
        bg: "#FEFCE8",
        textColor: "#78350F",
        flip: {
            headline: "Instant settlements",
            desc: "Nomba dynamic virtual accounts sweep payments to your bank the moment funds land. 0% settlement fees. No waiting.",
            color: "#7C3AED"
        }
    },
    {
        icon: "😰",
        stat: "10×",
        unit: "per day",
        label: "Bank app refreshes per customer",
        color: "#8B5CF6",
        bg: "#F5F3FF",
        textColor: "#3B0764",
        flip: {
            headline: "Auto-confirmed, always",
            desc: "Every payment is automatically matched and confirmed. You get notified once — when money is already in your account.",
            color: "#7C3AED"
        }
    }
];

const FlipCard = ({ item, index }) => {
    const [flipped, setFlipped] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: false, margin: "-60px" }}
            transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setFlipped(f => !f)}
            style={{
                cursor: 'pointer',
                perspective: '1000px',
                minHeight: '220px',
                position: 'relative'
            }}
        >
            <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Front */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    background: item.bg,
                    borderRadius: '24px',
                    padding: 'clamp(22px, 3vw, 32px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '220px',
                    border: `1px solid ${item.color}22`
                }}>
                    <div style={{ fontSize: '2rem' }}>{item.icon}</div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                            <span style={{
                                fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                                fontWeight: 900,
                                letterSpacing: '-0.04em',
                                color: item.color,
                                lineHeight: 1
                            }}>{item.stat}</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: item.color, opacity: 0.7 }}>{item.unit}</span>
                        </div>
                        <p style={{ margin: '0 0 16px', fontSize: '0.88rem', fontWeight: 600, color: item.textColor, opacity: 0.75, lineHeight: 1.4 }}>
                            {item.label}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: item.color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tap to see the fix</span>
                            <span style={{ fontSize: '0.8rem', color: item.color }}>→</span>
                        </div>
                    </div>
                </div>

                {/* Back */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    background: '#0F172A',
                    borderRadius: '24px',
                    padding: 'clamp(22px, 3vw, 32px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '220px',
                    border: '1px solid rgba(124,58,237,0.3)'
                }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(74,222,128,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Check size={14} color="#4ADE80" strokeWidth={3} />
                    </div>
                    <div>
                        <p style={{ margin: '0 0 10px', fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', fontWeight: 900, color: '#4ADE80', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                            {item.flip.headline}
                        </p>
                        <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: '#94A3B8', lineHeight: 1.6 }}>
                            {item.flip.desc}
                        </p>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Tap to go back</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ROISectionV3Bento = () => {
    return (
        <section id="roi" style={{
            padding: 'clamp(4rem, 9vw, 7.5rem) 24px',
            background: '#F8FAFC',
            color: '#0F172A',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '1px solid #E2E8F0'
        }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-60px" }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}
                >
                    <p style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '12px' }}>
                        The Real Numbers
                    </p>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.4rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.1,
                        color: '#0F172A',
                        marginBottom: '16px'
                    }}>
                        How Much Is Manual Management{' '}
                        <span style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #DB2777 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Costing You?
                        </span>
                    </h2>
                    <p style={{ color: '#64748B', fontSize: 'clamp(1rem, 2vw, 1.15rem)', maxWidth: '600px', margin: '0 auto 8px', lineHeight: 1.6 }}>
                        These aren't guesses. Every number below is what Nigerian merchants lose every single month.
                    </p>
                    <p style={{ color: '#94A3B8', fontSize: '0.82rem', fontWeight: 600 }}>Tap any card to see how Kreddy fixes it →</p>
                </motion.div>

                {/* Bento 2×2 flip cards grid */}
                <div className="roi-bento-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px'
                }}>
                    {stats.map((item, i) => (
                        <FlipCard key={i} item={item} index={i} />
                    ))}
                </div>

                {/* Bottom CTA strip */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                        marginTop: '24px',
                        textAlign: 'center',
                        padding: 'clamp(24px, 4vw, 36px)',
                        background: '#0F172A',
                        borderRadius: '24px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px'
                    }}
                >
                    <p style={{ margin: 0, fontWeight: 800, color: '#F8FAFC', fontSize: 'clamp(1rem, 2vw, 1.15rem)' }}>
                        Ready to stop the bleed?
                    </p>
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
                            boxShadow: '0 8px 24px rgba(124,58,237,0.3)'
                        }}
                    >
                        <span>Start Free — Try Kreddy</span>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--primary)">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                            </svg>
                        </div>
                    </a>
                </motion.div>
            </div>

            <style>{`
                @media (max-width: 640px) {
                    .roi-bento-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </section>
    );
};

export default ROISectionV3Bento;
