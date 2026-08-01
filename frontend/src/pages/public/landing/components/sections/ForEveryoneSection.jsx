import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
    ShieldCheck
} from "lucide-react";
import { KREDDY_CONFIG } from "../../../../../config";

const kreddyWhatsapp = "/kreddy-whatsapp.jpg";

const RecollyCard = ({ children, style, className }) => {
    const cardRef = useRef(null);

    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "center center"]
    });

    const cardScale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
    const cardOpacity = useTransform(scrollYProgress, [0, 0.8], [0, 1]);
    const cardY = useTransform(scrollYProgress, [0, 1], [24, 0]);

    return (
        <motion.div
            ref={cardRef}
            className={className}
            style={{
                ...style,
                scale: cardScale,
                opacity: cardOpacity,
                y: cardY,
                transformOrigin: 'center center',
                willChange: 'transform, opacity'
            }}
        >
            {children}
        </motion.div>
    );
};

const ForEveryoneSection = () => {
    const sectionRef = useRef(null);

    const { scrollYProgress: sectionScroll } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const headerScale = useTransform(sectionScroll, [0.02, 0.25, 0.75, 0.98], [0.88, 1, 1, 0.88]);
    const headerOpacity = useTransform(sectionScroll, [0.02, 0.2, 0.8, 0.98], [0, 1, 1, 0]);

    return (
        <section
            ref={sectionRef}
            id="for-everyone"
            className="for-everyone-section"
            style={{
                padding: 'clamp(4rem, 9vw, 8rem) 24px',
                backgroundColor: '#FAFAFA',
                color: '#0F172A',
                position: 'relative',
                overflow: 'hidden',
                borderTop: '1px solid #E2E8F0',
                borderBottom: '1px solid #E2E8F0'
            }}
        >
            {/* Ambient Background Radial Glows */}
            <div style={{
                position: 'absolute',
                top: '5%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '1100px',
                height: '600px',
                background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

                {/* 1. MASTER SECTION HEADER */}
                <motion.div
                    style={{
                        textAlign: 'center',
                        marginBottom: 'clamp(40px, 6vw, 60px)',
                        scale: headerScale,
                        opacity: headerOpacity,
                        transformOrigin: 'center center'
                    }}
                >
                    <h2 style={{
                        fontSize: 'clamp(2.1rem, 5vw, 3.6rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 1.15,
                        color: '#0F172A',
                        marginBottom: '18px'
                    }}>
                        You Don't Need a Formal Business To Get Paid.
                    </h2>

                    <p style={{
                        color: '#64748B',
                        fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                        fontWeight: 400,
                        maxWidth: '720px',
                        margin: '0 auto',
                        lineHeight: 1.6
                    }}>
                        If people pay you for your work, whether it's a project, a repair, a lesson, or products, Kreddy lives in your WhatsApp to handle the money.
                    </p>
                </motion.div>

                {/* ============================================================ */}
                {/* RECOLLY-STYLE 4-CARD SHOWCASE (Compact Copy & Universal Scroll-Scale Effect) */}
                {/* ============================================================ */}
                <div className="recolly-cards-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '24px',
                    alignItems: 'stretch',
                    marginBottom: 'clamp(40px, 6vw, 60px)'
                }}>
                    {/* CARD 1 (Top Left — Soft Sky Blue `#E0F2FE`): Creatives & Freelancers */}
                    <RecollyCard
                        style={{
                            gridColumn: 'span 6',
                            background: '#E0F2FE',
                            borderRadius: '28px',
                            padding: 'clamp(24px, 3.5vw, 36px)',
                            color: '#0F172A',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            minHeight: '280px'
                        }}
                        className="recolly-card recolly-card-1"
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', color: '#0284C7', textTransform: 'uppercase' }}>01</span>
                                <span style={{ width: '1px', height: '10px', background: 'rgba(2,132,199,0.3)', display: 'block' }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: '#0369A1', textTransform: 'uppercase' }}>CREATIVES & FREELANCERS</span>
                            </div>
                            <h4 style={{ fontSize: 'clamp(1.25rem, 2vw, 1.65rem)', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em', color: '#0F172A', marginBottom: '8px' }}>
                                If People Pay You For a Skill
                            </h4>
                            <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.55, margin: 0, fontWeight: 450 }}>
                                Designers, writers, tailors, photographers, developers: Kreddy invoices upfront deposits on WhatsApp before work begins.
                            </p>
                        </div>

                        {/* Slanted Speech Bubbles Pill Visual */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                            {/* Blue Slanted Pill */}
                            <div style={{
                                alignSelf: 'flex-end',
                                background: 'var(--primary)',
                                color: '#FFFFFF',
                                borderRadius: '18px 18px 4px 18px',
                                padding: '8px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                maxWidth: '88%',
                                boxShadow: '0 6px 16px rgba(124,58,237,0.25)',
                                transform: 'rotate(-1.5deg)'
                            }}>
                                Upfront Deposit Invoices
                            </div>
                            {/* White Slanted Pill */}
                            <div style={{
                                alignSelf: 'flex-start',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                borderRadius: '18px 18px 18px 4px',
                                padding: '8px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                maxWidth: '88%',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                                transform: 'rotate(1deg)'
                            }}>
                                Direct WhatsApp Follow-ups
                            </div>
                        </div>
                    </RecollyCard>

                    {/* CARD 2 (Top Right — Soft Warm Cream `#FEF3C7`): Skilled Trades & Services */}
                    <RecollyCard
                        style={{
                            gridColumn: 'span 6',
                            background: '#FEF3C7',
                            borderRadius: '28px',
                            padding: 'clamp(24px, 3.5vw, 36px)',
                            color: '#0F172A',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            minHeight: '280px'
                        }}
                        className="recolly-card recolly-card-2"
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', color: '#D97706', textTransform: 'uppercase' }}>02</span>
                                <span style={{ width: '1px', height: '10px', background: 'rgba(217,119,6,0.3)', display: 'block' }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: '#92400E', textTransform: 'uppercase' }}>SKILLED TRADES & SERVICES</span>
                            </div>
                            <h4 style={{ fontSize: 'clamp(1.25rem, 2vw, 1.65rem)', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em', color: '#0F172A', marginBottom: '8px' }}>
                                If People Pay You For a Service
                            </h4>
                            <p style={{ color: '#451A03', fontSize: '0.9rem', lineHeight: 1.55, margin: 0, opacity: 0.9, fontWeight: 450 }}>
                                Mechanics, tutors, barbers, repairers: log credit sales in 5 seconds via voice notes and let Kreddy follow up when due.
                            </p>
                        </div>

                        {/* Shield Check Badge */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '20px',
                            background: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '16px auto 0',
                            boxShadow: '0 14px 28px -6px rgba(124, 58, 237, 0.35)'
                        }}>
                            <ShieldCheck size={42} color="#FFFFFF" strokeWidth={2} />
                        </div>
                    </RecollyCard>

                    {/* CARD 3 (Bottom Left — Soft Warm Cream `#FEF3C7`): Vendors & Retailers */}
                    <RecollyCard
                        style={{
                            gridColumn: 'span 6',
                            background: '#FEF3C7',
                            borderRadius: '28px',
                            padding: 'clamp(24px, 3.5vw, 36px)',
                            color: '#0F172A',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            minHeight: '280px'
                        }}
                        className="recolly-card recolly-card-3"
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', color: '#D97706', textTransform: 'uppercase' }}>03</span>
                                <span style={{ width: '1px', height: '10px', background: 'rgba(217,119,6,0.3)', display: 'block' }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: '#92400E', textTransform: 'uppercase' }}>VENDORS & RETAILERS</span>
                            </div>
                            <h4 style={{ fontSize: 'clamp(1.25rem, 2vw, 1.65rem)', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em', color: '#0F172A', marginBottom: '8px' }}>
                                If People Buy Products From You
                            </h4>
                            <p style={{ color: '#451A03', fontSize: '0.9rem', lineHeight: 1.55, margin: 0, opacity: 0.9, fontWeight: 450 }}>
                                Instagram vendors, retailers, caterers: no more paper debt books. Track who owes what and confirm transfers instantly.
                            </p>
                        </div>

                        {/* Overlapping Chat Speech Bubbles Visual */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                            {/* User Blue Bubble */}
                            <div style={{
                                alignSelf: 'flex-end',
                                background: 'var(--primary)',
                                color: '#FFFFFF',
                                borderRadius: '18px 18px 4px 18px',
                                padding: '8px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                maxWidth: '88%',
                                boxShadow: '0 6px 16px rgba(124,58,237,0.25)',
                                transform: 'rotate(-1.5deg)'
                            }}>
                                Kreddy, log ₦18k credit for Mr. Okafor
                            </div>
                            {/* Kreddy White Bubble */}
                            <div style={{
                                alignSelf: 'flex-start',
                                background: '#FFFFFF',
                                color: '#0F172A',
                                borderRadius: '18px 18px 18px 4px',
                                padding: '8px 14px',
                                fontSize: '0.8rem',
                                fontWeight: 500,
                                maxWidth: '88%',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                                transform: 'rotate(1deg)'
                            }}>
                                Logged! Reminder set for Thursday.
                            </div>
                        </div>
                    </RecollyCard>

                    {/* CARD 4 (Bottom Right — Soft Sky Blue `#E0F2FE`): Every Earner & Freelancer */}
                    <RecollyCard
                        style={{
                            gridColumn: 'span 6',
                            background: '#E0F2FE',
                            borderRadius: '28px',
                            padding: 'clamp(24px, 3.5vw, 36px) clamp(24px, 3.5vw, 36px) 0',
                            color: '#0F172A',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            minHeight: '280px'
                        }}
                        className="recolly-card recolly-card-4"
                    >
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.12em', color: '#0284C7', textTransform: 'uppercase' }}>04</span>
                                <span style={{ width: '1px', height: '10px', background: 'rgba(2,132,199,0.3)', display: 'block' }} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: '#0369A1', textTransform: 'uppercase' }}>EVERY EARNER & FREELANCER</span>
                            </div>
                            <h4 style={{ fontSize: 'clamp(1.25rem, 2vw, 1.65rem)', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em', color: '#0F172A', marginBottom: '8px' }}>
                                Your Second Brain for Every Naira
                            </h4>
                            <p style={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.55, margin: 0, fontWeight: 450 }}>
                                No accounting app or formal registration needed. If you offer value and receive money, Kreddy handles the records on WhatsApp.
                            </p>
                        </div>

                        {/* Compact Phone Mockup Top Snippet */}
                        <div style={{
                            width: '100%',
                            maxWidth: '165px',
                            height: '95px',
                            margin: '12px auto -10px auto',
                            borderRadius: '16px 16px 0 0',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: '0 16px 32px -8px rgba(15,23,42,0.2)',
                            border: '4px solid #0F172A',
                            borderBottom: 'none',
                            background: '#0F172A',
                            flexShrink: 0
                        }}>
                            {/* Dynamic Island */}
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '44px',
                                height: '10px',
                                backgroundColor: '#000000',
                                borderRadius: '10px',
                                zIndex: 10
                            }} />
                            <img
                                src={kreddyWhatsapp}
                                alt="Kreddy Voice Note preview"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    objectFit: 'cover',
                                    objectPosition: 'top'
                                }}
                            />
                        </div>
                    </RecollyCard>

                </div>

                {/* UNIFYING STANDARD CTA BUTTON (Matches MeetKreddy / Productivity / Hero CTA) */}
                <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                    <a
                        href={KREDDY_CONFIG.getLink("Hi Kreddy\nI'd like to see how Kredibly works.")}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 8px 8px 24px',
                            borderRadius: '100px',
                            background: 'var(--primary)',
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '0.98rem',
                            textDecoration: 'none',
                            boxShadow: '0 8px 24px rgba(124, 58, 237, 0.28)',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(124, 58, 237, 0.35)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(124, 58, 237, 0.28)';
                        }}
                    >
                        <span>Try Kreddy Now</span>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="var(--primary)">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                            </svg>
                        </div>
                    </a>
                </div>

            </div>

            <style>{`
                @media (max-width: 768px) {
                    .for-everyone-section {
                        padding: clamp(3rem, 7vw, 5rem) 24px !important;
                    }
                    .recolly-cards-grid {
                        grid-template-columns: 1fr !important;
                        gap: 20px !important;
                    }
                    .recolly-card {
                        grid-column: span 12 !important;
                        min-height: 270px !important;
                        padding: 24px 20px !important;
                        border-radius: 28px !important;
                    }
                }
            `}</style>
        </section>
    );
};

export default ForEveryoneSection;
