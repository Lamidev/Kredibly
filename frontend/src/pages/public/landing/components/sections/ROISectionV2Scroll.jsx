import React, { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Check } from "lucide-react";

const ROI_ROWS = [
    {
        num: "01",
        label: "Credit Sales",
        loss: "Forgotten Credit Sales",
        lossQuote: "Unrecorded debts\nlost in WhatsApp.",
        lossSub: "Every missed debt is money that quietly vanishes. No record, no follow-up, no recovery.",
        lossAccent: "#EF4444",
        fix: "Auto WhatsApp Debt Tracking",
        fixSub: "Kreddy logs every credit sale, debtor balance and due date in under 5 seconds via voice or text.",
        fixAccent: "#4ADE80"
    },
    {
        num: "02",
        label: "Alert Audits",
        loss: "Manual Bank Alert Audits",
        lossQuote: "Refresh. Refresh.\nRefresh. Nothing.",
        lossSub: "You open your banking app 10 times a day to verify one transfer before packing an order.",
        lossAccent: "#F97316",
        fix: "Instant Auto-Reconciliation",
        fixSub: "Nomba dynamic virtual accounts auto-confirm every payment. You get notified once: when it's done.",
        fixAccent: "#4ADE80"
    },
    {
        num: "03",
        label: "Settlement Delays",
        loss: "Gateway Cuts & Delays",
        lossQuote: "1.5% cut.\n24hrs to get paid.",
        lossSub: "Traditional gateways take a slice of every transaction and hold your money overnight.",
        lossAccent: "#EAB308",
        fix: "0% Fee Instant Settlements",
        fixSub: "We cover all settlement transfer fees. Money hits your bank the same moment a customer pays.",
        fixAccent: "#4ADE80"
    },
    {
        num: "04",
        label: "Debt Chasing",
        loss: "Awkward Payment Chasing",
        lossQuote: "He go pay.\nI don't want wahala.",
        lossSub: "Manually calling customers for unpaid invoices damages relationships and costs you hours a week.",
        lossAccent: "#8B5CF6",
        fix: "Automated Polite Nudges",
        fixSub: "Kreddy sends timed, professional WhatsApp reminders and negotiates extensions without any awkwardness.",
        fixAccent: "#4ADE80"
    }
];

const AnimatedWords = ({ text, isActive }) => {
    const words = text.split(/(\s+|\n)/).filter(Boolean);
    return (
        <span>
            {words.map((word, i) => {
                if (word === "\n") return <br key={i} />;
                return (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={isActive
                            ? { opacity: 1, y: 0 }
                            : { opacity: 0, y: 12 }
                        }
                        transition={{ duration: 0.3, delay: isActive ? i * 0.04 : 0, ease: [0.22, 1, 0.36, 1] }}
                        style={{ display: 'inline-block', marginRight: word.trim() ? '0.2em' : 0, willChange: 'transform, opacity' }}
                    >
                        {word.trim() && word}
                    </motion.span>
                );
            })}
        </span>
    );
};

const ROISectionV2Scroll = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const itemRefs = useRef([]);
    const headerRef = useRef(null);

    // Header scroll-linked shrink/enlarge animation matching ProblemSection header
    const { scrollYProgress: headerScrollProgress } = useScroll({
        target: headerRef,
        offset: ["start end", "end start"]
    });

    const headerScale = useTransform(headerScrollProgress, [0.05, 0.35, 0.65, 0.95], [0.82, 1, 1, 0.82]);
    const headerOpacity = useTransform(headerScrollProgress, [0.05, 0.25, 0.75, 0.95], [0, 1, 1, 0]);

    useEffect(() => {
        const observers = itemRefs.current.map((ref, index) => {
            if (!ref) return null;
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.45) {
                        setActiveIndex(index);
                    }
                },
                { threshold: 0.45 }
            );
            observer.observe(ref);
            return observer;
        });
        return () => observers.forEach(o => o?.disconnect());
    }, []);

    const active = ROI_ROWS[activeIndex];

    return (
        <section id="roi" style={{
            backgroundColor: '#0F172A',
            color: '#F8FAFC',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
            {/* Ambient glow */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at 25% 50%, rgba(124,58,237,0.14) 0%, transparent 60%), radial-gradient(ellipse at 75% 30%, rgba(219,39,119,0.08) 0%, transparent 55%)'
            }} />

            {/* Sticky section header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                background: 'linear-gradient(180deg, #0F172A 80%, transparent 100%)',
                padding: 'clamp(3rem, 8vw, 5rem) 24px clamp(1.5rem, 3vw, 2.5rem)'
            }}>
                <motion.div
                    ref={headerRef}
                    style={{
                        maxWidth: '1200px',
                        margin: '0 auto',
                        textAlign: 'center',
                        scale: headerScale,
                        opacity: headerOpacity,
                        transformOrigin: 'center center',
                        willChange: 'transform, opacity'
                    }}
                >
                    <p style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: '12px' }}>
                        The real cost of doing nothing
                    </p>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.1,
                        color: '#F8FAFC',
                        margin: 0
                    }}>
                        How Much Is Manual Management Costing You?
                    </h2>
                </motion.div>
            </div>

            {/* Scrollable rows */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px clamp(5rem, 10vw, 8rem)' }}>
                {ROI_ROWS.map((row, index) => (
                    <div
                        key={index}
                        className="roi-item-row"
                        ref={el => itemRefs.current[index] = el}
                        style={{
                            minHeight: '65vh',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 'clamp(40px, 6vw, 64px) 0',
                            borderBottom: index < ROI_ROWS.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                        }}
                    >
                        <div className="roi-scroll-row" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '40px',
                            width: '100%'
                        }}>
                            {/* Row label */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <motion.span
                                    animate={{ color: activeIndex === index ? row.lossAccent : 'rgba(100,116,139,0.6)' }}
                                    transition={{ duration: 0.3 }}
                                    style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.1em' }}
                                >{row.num}</motion.span>
                                <motion.span
                                    animate={{ color: activeIndex === index ? 'rgba(248,250,252,0.85)' : 'rgba(100,116,139,0.5)', x: activeIndex === index ? 0 : -4 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}
                                >{row.label}</motion.span>
                            </div>

                            {/* Two columns: Loss | Fix */}
                            <div className="roi-scroll-cols" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
                                {/* Left: The Loss */}
                                <div>
                                    <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: row.lossAccent, marginBottom: '16px', opacity: activeIndex === index ? 1 : 0.4 }}>
                                        Without Kreddy
                                    </p>
                                    <p style={{
                                        fontSize: 'clamp(1.6rem, 3.5vw, 2.6rem)',
                                        fontWeight: 900,
                                        lineHeight: 1.1,
                                        letterSpacing: '-0.03em',
                                        color: '#F8FAFC',
                                        fontStyle: 'italic',
                                        margin: '0 0 20px 0'
                                    }}>
                                        <span style={{ color: row.lossAccent, opacity: 0.3, marginRight: '3px' }}>"</span>
                                        <AnimatedWords text={row.lossQuote} isActive={activeIndex === index} />
                                        <span style={{ color: row.lossAccent, opacity: 0.3, marginLeft: '2px' }}>"</span>
                                    </p>

                                    {/* Accent bar */}
                                    <motion.div
                                        animate={{ width: activeIndex === index ? '64px' : '20px', opacity: activeIndex === index ? 1 : 0.3 }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ height: '3px', background: row.lossAccent, borderRadius: '3px', marginBottom: '16px' }}
                                    />
                                    <motion.p
                                        animate={{ opacity: activeIndex === index ? 1 : 0.35, y: activeIndex === index ? 0 : 8 }}
                                        transition={{ duration: 0.4, delay: 0.15 }}
                                        style={{ color: '#94A3B8', fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.65, margin: 0 }}
                                    >{row.lossSub}</motion.p>
                                </div>

                                {/* Right: The Fix */}
                                <div style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', paddingLeft: '48px' }}>
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        background: 'rgba(124, 58, 237, 0.15)',
                                        border: '1px solid rgba(167, 139, 250, 0.3)',
                                        borderRadius: '100px',
                                        padding: '4px 12px 4px 8px',
                                        marginBottom: '16px',
                                        opacity: activeIndex === index ? 1 : 0.4
                                    }}>
                                        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Check size={9} color="#0F172A" strokeWidth={3.5} />
                                        </div>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F3E8FF' }}>
                                            With Kreddy
                                        </span>
                                    </div>

                                    <motion.p
                                        animate={{ opacity: activeIndex === index ? 1 : 0.3, y: activeIndex === index ? 0 : 12 }}
                                        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                        style={{
                                            fontSize: 'clamp(1.3rem, 2.5vw, 1.9rem)',
                                            fontWeight: 900,
                                            lineHeight: 1.2,
                                            letterSpacing: '-0.025em',
                                            color: '#F8FAFC',
                                            margin: '0 0 20px 0'
                                        }}
                                    >{row.fix}</motion.p>

                                    <motion.div
                                        animate={{ width: activeIndex === index ? '64px' : '20px', opacity: activeIndex === index ? 1 : 0.3 }}
                                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                        style={{ height: '3px', background: 'linear-gradient(90deg, #A78BFA 0%, #34D399 100%)', borderRadius: '3px', marginBottom: '16px' }}
                                    />
                                    <motion.p
                                        animate={{ opacity: activeIndex === index ? 1 : 0.3, y: activeIndex === index ? 0 : 8 }}
                                        transition={{ duration: 0.4, delay: 0.3 }}
                                        style={{ color: '#94A3B8', fontSize: 'clamp(0.95rem, 1.6vw, 1.05rem)', lineHeight: 1.65, margin: 0 }}
                                    >{row.fixSub}</motion.p>

                                    {/* Problem Solved Badge */}
                                    <motion.div
                                        animate={{ opacity: activeIndex === index ? 1 : 0, scale: activeIndex === index ? 1 : 0.7 }}
                                        transition={{ duration: 0.35, delay: 0.4 }}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginTop: '20px',
                                            background: 'rgba(52,211,153,0.1)',
                                            border: '1px solid rgba(52,211,153,0.22)',
                                            borderRadius: '100px',
                                            padding: '6px 14px 6px 8px'
                                        }}
                                    >
                                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(52,211,153,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Check size={11} color="#34D399" strokeWidth={3} />
                                        </div>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34D399', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Problem Solved</span>
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Progress dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', paddingTop: '32px' }}>
                    {ROI_ROWS.map((row, i) => (
                        <motion.div
                            key={i}
                            animate={{ width: activeIndex === i ? '24px' : '6px', background: activeIndex === i ? row.lossAccent : 'rgba(100,116,139,0.4)' }}
                            transition={{ duration: 0.3 }}
                            style={{ height: '6px', borderRadius: '6px' }}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .roi-item-row {
                        min-height: auto !important;
                        padding: 36px 0 !important;
                    }
                    .roi-scroll-cols {
                        grid-template-columns: 1fr !important;
                        gap: 32px !important;
                    }
                    .roi-scroll-cols > div:last-child {
                        border-left: none !important;
                        padding-left: 0 !important;
                        border-top: 1px solid rgba(255,255,255,0.07);
                        padding-top: 24px;
                    }
                    .roi-scroll-row {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                }
            `}</style>
        </section>
    );
};

export default ROISectionV2Scroll;
