import React, { useRef, useEffect } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { KREDDY_CONFIG } from "../../../../../config";
import PhoneMockup from "../shared/PhoneMockup";

const ProductivitySection = () => {
    const kreddyProductivityImg = "/kreddy-productivity.jpg";

    // Sequenced platform animation: block first, then phone halfway through
    const platformRef = useRef(null);
    const blockControls = useAnimation();
    const phoneControls = useAnimation();
    const isInView = useInView(platformRef, { once: true, margin: "-50px" });

    useEffect(() => {
        let timer;
        if (isInView) {
            // Step 1: Backdrop block fades + scales in immediately
            blockControls.start({ opacity: 1, scale: 1, transition: { duration: 0.6, ease: 'easeOut' } });
            // Step 2: Phone slides up after block is halfway done (350ms delay)
            timer = setTimeout(() => {
                phoneControls.start({ opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } });
            }, 350);
        }
        return () => clearTimeout(timer);
    }, [isInView, blockControls, phoneControls]);


    const steps = [
        {
            title: "Say Hi to Kreddy",
            desc: "Start a WhatsApp chat and treat Kreddy like your personal assistant. You can tell her anything you don't want to forget (from deadlines to dinner plans or gym appointments) and she'll remember for you."
        },
        {
            title: "Save What Matters",
            desc: "As you go about your day, keep dropping notes, tasks, or quick reminders into the chat. Kreddy organizes everything neatly behind the scenes, so you never have to dig through endless notes again."
        },
        {
            title: "Get Reminded",
            desc: "When the time comes, Kreddy shows up right on schedule with the exact info you saved. It's like having a second brain that never forgets, always ready when you need it most."
        }
    ];

    return (
        <section id="productivity" style={{
            padding: 'clamp(4rem, 10vw, 7rem) 24px',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            position: 'relative',
            overflow: 'hidden',
            borderTop: '1px solid #F1F5F9'
        }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 'clamp(40px, 6vw, 64px)' }}>
                    <h2 style={{ 
                        fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', 
                        fontWeight: 900, 
                        letterSpacing: '-0.04em', 
                        lineHeight: 1.1,
                        color: '#0F172A',
                        marginBottom: '16px'
                    }}>
                        Your Second Brain In 3 Easy Steps
                    </h2>
                    <p style={{ 
                        color: '#64748B', 
                        fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', 
                        fontWeight: 400, 
                        maxWidth: '720px', 
                        margin: '0 auto',
                        lineHeight: 1.6
                    }}>
                        Kreddy blends into your daily routine like a smart sidekick. You talk, she remembers, and when you need it, she brings everything back.
                    </p>
                </div>

                {/* Recolly-Style 2-Column Grid */}
                <div className="productivity-recolly-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: 'clamp(32px, 5vw, 64px)',
                    alignItems: 'center'
                }}>
                    {/* Left Column: Recolly-Style Vertical Steps */}
                    <div style={{ gridColumn: 'span 12', position: 'relative', paddingLeft: 'clamp(16px, 3vw, 36px)' }} className="tracker-col">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', position: 'relative' }}>
                            {/* Sleek Connecting Line (2px thickness, perfectly centered through 20px node dots) */}
                            <div style={{
                                position: 'absolute',
                                top: '14px',
                                bottom: '14px',
                                left: '9px',
                                width: '2px',
                                background: 'linear-gradient(180deg, var(--primary) 0%, rgba(124, 58, 237, 0.25) 100%)',
                                borderRadius: '2px',
                                zIndex: 0
                            }} />

                            {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    style={{
                                        display: 'flex',
                                        gap: '20px',
                                        alignItems: 'flex-start',
                                        position: 'relative',
                                        zIndex: 1
                                    }}
                                >
                                    {/* Recolly Node Dot (20px diameter with soft outer glow) */}
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        boxShadow: '0 0 0 5px rgba(124, 58, 237, 0.16), 0 0 16px rgba(124, 58, 237, 0.28)',
                                        flexShrink: 0,
                                        marginTop: '4px'
                                    }} />

                                    {/* Clean Text Block */}
                                    <div>
                                        <h3 style={{ 
                                            fontSize: 'clamp(1.18rem, 2.2vw, 1.45rem)', 
                                            fontWeight: 800, 
                                            color: '#0F172A',
                                            margin: '0 0 8px 0',
                                            letterSpacing: '-0.025em'
                                        }}>
                                            {step.title}
                                        </h3>
                                        <p style={{ 
                                            color: '#475569', 
                                            fontSize: 'clamp(0.88rem, 1.35vw, 0.98rem)', 
                                            lineHeight: 1.65, 
                                            fontWeight: 400,
                                            margin: 0,
                                            maxWidth: '460px'
                                        }}>
                                            {step.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Platform Block Card + Phone Mockup with Sequenced Scroll Effect */}
                    <div style={{ gridColumn: 'span 12' }} className="phone-col">
                        <div
                            ref={platformRef}
                            className="phone-platform-container"
                            style={{
                                position: 'sticky',
                                top: '100px',
                                width: '100%',
                                maxWidth: '360px',
                                margin: '0 auto',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                paddingTop: '50px',
                                paddingBottom: '50px'
                            }}
                        >
                            {/* 1. Backdrop Purple Block (Animates First via blockControls) */}
                            <motion.div
                                className="backdrop-purple-block"
                                animate={blockControls}
                                initial={{ opacity: 0, scale: 0.94 }}
                                style={{
                                    position: 'absolute',
                                    top: '125px',
                                    bottom: '0px',
                                    left: '-12px',
                                    right: '-12px',
                                    background: 'linear-gradient(180deg, #F3E8FF 0%, #E9D5FF 100%)',
                                    borderRadius: '48px',
                                    zIndex: 1,
                                    boxShadow: '0 24px 60px -10px rgba(124, 58, 237, 0.18)'
                                }}
                            />

                            {/* 2. Phone Mockup (Slides Up After Block is Halfway Done) */}
                            <motion.div
                                animate={phoneControls}
                                initial={{ opacity: 0, y: 100 }}
                                style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    width: '100%',
                                    maxWidth: '290px'
                                }}
                            >
                                <PhoneMockup 
                                    imgSrc={kreddyProductivityImg} 
                                    alt="Real Kreddy AI WhatsApp Task Reminder Conversation"
                                    maxWidth="290px"
                                    glowColor="rgba(124, 58, 237, 0.25)"
                                />
                            </motion.div>
                        </div>
                    </div>

                    {/* Try Kreddy Capsule Pill Button */}
                    <div style={{ gridColumn: 'span 12', marginTop: '24px', display: 'flex', justifyContent: 'center', width: '100%' }} className="productivity-cta-wrap">
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
            </div>

            <style>{`
                @media (min-width: 992px) {
                    .productivity-recolly-grid .tracker-col {
                        grid-column: span 7 !important;
                    }
                    .productivity-recolly-grid .phone-col {
                        grid-column: span 5 !important;
                    }
                }
                @media (max-width: 991px) {
                    .productivity-recolly-grid {
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .tracker-col {
                        order: 1;
                    }
                    .phone-col {
                        order: 2;
                        width: 100% !important;
                    }
                    .phone-col .phone-platform-container {
                        max-width: 100% !important;
                        width: 100% !important;
                    }
                    .productivity-cta-wrap {
                        order: 3;
                        padding-left: 0 !important;
                        margin-top: 32px !important;
                        display: flex !important;
                        justify-content: center !important;
                    }
                    .backdrop-purple-block {
                        left: 12px !important;
                        right: 12px !important;
                        width: auto !important;
                    }
                }
            `}</style>
        </section>
    );
};

export default ProductivitySection;
