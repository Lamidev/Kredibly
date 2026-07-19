import React, { useRef, useEffect, useState } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

const PAIN_POINTS = [
    {
        num: "01",
        label: "Invoice Hassle",
        quote: "Send invoice\nmake I pay.",
        sub: "While other customers wait, you manually calculate, type, format and send — every single time.",
        accent: "#EF4444"
    },
    {
        num: "02",
        label: "Debt Chasing",
        quote: "I go pay you\non Friday.",
        sub: "Friday passes. You want your money, but asking feels awkward — and your cash flow stays trapped.",
        accent: "#F97316"
    },
    {
        num: "03",
        label: "Alert Anxiety",
        quote: "I don transfer,\ncheck alert.",
        sub: "You log into your bank and refresh 10 times a day to verify a payment before packing an order.",
        accent: "#EAB308"
    },
    {
        num: "04",
        label: "Notebook Chaos",
        quote: "Where I keep\nthat record?",
        sub: "Sales in notebooks, alerts in SMS, orders in WhatsApp. You can't tell your exact profit at month end.",
        accent: "#8B5CF6"
    }
];

const AnimatedQuote = ({ quote, isActive, accent }) => {
    const words = quote.split(/(\s+|\n)/).filter(Boolean);
    return (
        <span>
            {words.map((word, i) => {
                if (word === "\n") return <br key={i} />;
                return (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                        animate={isActive
                            ? { opacity: 1, y: 0, filter: "blur(0px)" }
                            : { opacity: 0, y: 20, filter: "blur(6px)" }
                        }
                        transition={{
                            duration: 0.4,
                            delay: isActive ? i * 0.07 : 0,
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        style={{ display: 'inline-block', marginRight: word.trim() ? '0.22em' : '0' }}
                    >
                        {word.trim() && word}
                    </motion.span>
                );
            })}
        </span>
    );
};

const ProblemSectionV3Scroll = () => {
    const sectionRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Intersection observers for each item
    const itemRefs = useRef([]);

    useEffect(() => {
        const observers = itemRefs.current.map((ref, index) => {
            if (!ref) return null;
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        setActiveIndex(index);
                    }
                },
                { threshold: 0.5 }
            );
            observer.observe(ref);
            return observer;
        });
        return () => observers.forEach(o => o?.disconnect());
    }, []);

    return (
        <section
            ref={sectionRef}
            id="problem"
            style={{
                backgroundColor: '#0F172A',
                color: '#F8FAFC',
                position: 'relative',
                overflow: 'hidden',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                borderBottom: '1px solid rgba(255,255,255,0.06)'
            }}
        >
            {/* Ambient noise / gradient */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(219,39,119,0.08) 0%, transparent 55%)',
                pointerEvents: 'none'
            }} />

            {/* Sticky Header */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                padding: 'clamp(3rem, 8vw, 6rem) 24px clamp(2rem, 4vw, 3rem)',
                background: 'linear-gradient(180deg, #0F172A 80%, transparent 100%)',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'rgba(148,163,184,0.8)',
                        marginBottom: '12px'
                    }}>The daily merchant struggle</p>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.1,
                        color: '#F8FAFC',
                        margin: 0
                    }}>
                        Running a business{' '}
                        <span style={{
                            background: 'linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>shouldn't feel like this.</span>
                    </h2>
                </div>
            </div>

            {/* Scrollable Items */}
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 24px clamp(5rem, 10vw, 8rem)'
            }}>
                {PAIN_POINTS.map((item, index) => (
                    <div
                        key={index}
                        ref={el => itemRefs.current[index] = el}
                        style={{
                            minHeight: '60vh',
                            display: 'flex',
                            alignItems: 'center',
                            padding: 'clamp(40px, 6vw, 64px) 0',
                            borderBottom: index < PAIN_POINTS.length - 1
                                ? '1px solid rgba(255,255,255,0.06)'
                                : 'none'
                        }}
                    >
                        <div className="pain-scroll-row" style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr',
                            gap: '32px',
                            width: '100%',
                            alignItems: 'center'
                        }}>
                            {/* Number + Label */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <motion.span
                                    animate={{ color: activeIndex === index ? item.accent : 'rgba(100,116,139,0.6)' }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 900,
                                        letterSpacing: '0.1em'
                                    }}
                                >{item.num}</motion.span>
                                <motion.span
                                    animate={{
                                        color: activeIndex === index ? 'rgba(248,250,252,0.9)' : 'rgba(100,116,139,0.5)',
                                        x: activeIndex === index ? 0 : -4
                                    }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        letterSpacing: '0.08em',
                                        textTransform: 'uppercase'
                                    }}
                                >{item.label}</motion.span>
                            </div>

                            {/* Giant Quote */}
                            <div>
                                <p style={{
                                    fontSize: 'clamp(2rem, 6vw, 4.5rem)',
                                    fontWeight: 900,
                                    lineHeight: 1.1,
                                    letterSpacing: '-0.03em',
                                    color: '#F8FAFC',
                                    margin: '0 0 24px 0',
                                    fontStyle: 'italic'
                                }}>
                                    <span style={{ opacity: 0.25, marginRight: '4px' }}>"</span>
                                    <AnimatedQuote
                                        quote={item.quote}
                                        isActive={activeIndex === index}
                                        accent={item.accent}
                                    />
                                    <span style={{ opacity: 0.25, marginLeft: '2px' }}>"</span>
                                </p>

                                {/* Accent bar */}
                                <motion.div
                                    animate={{
                                        width: activeIndex === index ? '80px' : '24px',
                                        opacity: activeIndex === index ? 1 : 0.3
                                    }}
                                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                                    style={{
                                        height: '3px',
                                        background: item.accent,
                                        borderRadius: '3px',
                                        marginBottom: '20px'
                                    }}
                                />

                                {/* Sub text */}
                                <motion.p
                                    animate={{
                                        opacity: activeIndex === index ? 1 : 0.4,
                                        y: activeIndex === index ? 0 : 8
                                    }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    style={{
                                        color: '#94A3B8',
                                        fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
                                        lineHeight: 1.6,
                                        fontWeight: 400,
                                        maxWidth: '640px',
                                        margin: 0
                                    }}
                                >
                                    {item.sub}
                                </motion.p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Progress dots */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    paddingTop: '32px'
                }}>
                    {PAIN_POINTS.map((item, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                width: activeIndex === i ? '24px' : '6px',
                                background: activeIndex === i ? item.accent : 'rgba(100,116,139,0.4)'
                            }}
                            transition={{ duration: 0.3 }}
                            style={{ height: '6px', borderRadius: '6px' }}
                        />
                    ))}
                </div>
            </div>

            {/* Transition Callout */}
            <div style={{
                textAlign: 'center',
                paddingBottom: 'clamp(3rem, 6vw, 5rem)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#A78BFA' }}>
                    There is a better way
                </span>
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ color: '#A78BFA', fontWeight: 900, fontSize: '1.4rem' }}
                >
                    ↓
                </motion.div>
            </div>

            <style>{`
                @media (min-width: 768px) {
                    .pain-scroll-row {
                        grid-template-columns: 180px 1fr !important;
                    }
                }
            `}</style>
        </section>
    );
};

export default ProblemSectionV3Scroll;
