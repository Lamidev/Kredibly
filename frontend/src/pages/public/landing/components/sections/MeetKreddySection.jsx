import React from "react";
import { motion } from "framer-motion";
import { KREDDY_CONFIG } from "../../../../../config";
import PhoneMockup from "../shared/PhoneMockup";

const MeetKreddySection = () => {
    const kreddyWhatsapp = "/kreddy-whatsapp.jpg";

    const steps = [
        {
            title: "Speak, Don't Type",
            desc: "Send Kreddy a voice note or message like 'Kreddy, invoice Tola ₦45k for 2 wigs, due Friday.' She automatically logs the sale, does the math, and formats the invoice."
        },
        {
            title: "Direct WhatsApp Delivery",
            desc: "No copy-pasting required. Your customer gets a clean, professional PDF invoice directly in their WhatsApp chat with a dynamic virtual bank account for instant transfer."

        },
        {
            title: "Automated Debt Reminders",
            desc: "No more awkward debt chasing on WhatsApp. Kreddy sends polite, scheduled payment reminders so you get paid without ruining customer relationships."
        },
        {
            title: "Instant Direct Bank Sweeps",
            desc: "The second a customer pays via bank transfer, the money is swept directly into your bank account. Zero holding periods, zero manual withdrawals."
        }
    ];

    return (
        <section id="meet-kreddy" style={{
            padding: 'clamp(4rem, 10vw, 7rem) 24px',
            background: 'linear-gradient(180deg, #F5F3FF 0%, #FAF8FC 100%)',
            color: '#0F172A',
            position: 'relative',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(124, 58, 237, 0.08)'

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
                        Meet Kreddy: <span style={{
                            background: 'linear-gradient(135deg, var(--primary) 0%, #DB2777 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Your WhatsApp Business Assistant</span>
                    </h2>
                    <p style={{ 
                        color: '#64748B', 
                        fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', 
                        fontWeight: 400, 
                        maxWidth: '720px', 
                        margin: '0 auto',
                        lineHeight: 1.6
                    }}>
                        Kreddy listens, records sales, sends invoices, and collects payments directly inside WhatsApp so you can focus on selling.
                    </p>
                </div>

                {/* Recolly-Style 2-Column Grid */}
                <div className="meet-kreddy-recolly-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: 'clamp(32px, 5vw, 64px)',
                    alignItems: 'center'
                }}>
                    {/* Left Column: Recolly-Style Vertical Steps */}
                    <div style={{ gridColumn: 'span 12', position: 'relative' }} className="tracker-col">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '44px', position: 'relative' }}>
                            {/* Connecting Line */}
                            <div style={{
                                position: 'absolute',
                                top: '16px',
                                bottom: '16px',
                                left: '11px',
                                width: '3px',
                                background: 'linear-gradient(180deg, var(--primary) 0%, rgba(124, 58, 237, 0.25) 100%)',
                                borderRadius: '4px',
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
                                        gap: '24px',
                                        alignItems: 'flex-start',
                                        position: 'relative',
                                        zIndex: 1
                                    }}
                                >
                                    {/* Solid Glowing Node Dot (Exact Recolly Style) */}
                                    <div style={{
                                        width: '25px',
                                        height: '25px',
                                        borderRadius: '50%',
                                        background: 'var(--primary)',
                                        boxShadow: '0 0 0 6px rgba(124, 58, 237, 0.15)',
                                        flexShrink: 0,
                                        marginTop: '4px'
                                    }} />

                                    {/* Clean Text Block (No Box / No Cards / No Icons) */}
                                    <div>
                                        <h3 style={{ 
                                            fontSize: 'clamp(1.35rem, 2.5vw, 1.65rem)', 
                                            fontWeight: 800, 
                                            color: '#0F172A',
                                            margin: '0 0 8px 0',
                                            letterSpacing: '-0.02em'
                                        }}>
                                            {step.title}
                                        </h3>
                                        <p style={{ 
                                            color: '#475569', 
                                            fontSize: 'clamp(0.98rem, 1.5vw, 1.08rem)', 
                                            lineHeight: 1.6, 
                                            fontWeight: 400,
                                            margin: 0,
                                            maxWidth: '560px'
                                        }}>
                                            {step.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Try Kreddy Capsule Pill Button */}
                        <div style={{ marginTop: '40px', paddingLeft: '49px' }}>
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

                    {/* Right Column: Soft Ambient Card + Phone Mockup */}
                    <div style={{ gridColumn: 'span 12' }} className="phone-col">
                        <div className="phone-card-wrapper" style={{
                            position: 'sticky',
                            top: '120px',
                            background: 'linear-gradient(135deg, rgba(76, 29, 149, 0.05) 0%, rgba(219, 39, 119, 0.05) 100%)',
                            borderRadius: '40px',
                            border: '1px solid rgba(124, 58, 237, 0.12)',
                            padding: 'clamp(32px, 5vw, 56px) 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 24px 64px -12px rgba(76, 29, 149, 0.08)'
                        }}>
                            <PhoneMockup 
                                imgSrc={kreddyWhatsapp} 
                                alt="Real Kreddy AI WhatsApp business conversation"
                                maxWidth="290px"
                                glowColor="rgba(124, 58, 237, 0.25)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media (min-width: 992px) {
                    .meet-kreddy-recolly-grid .tracker-col {
                        grid-column: span 7 !important;
                    }
                    .meet-kreddy-recolly-grid .phone-col {
                        grid-column: span 5 !important;
                    }
                }
                @media (max-width: 991px) {
                    .phone-card-wrapper {
                        position: relative !important;
                        top: 0 !important;
                    }
                }
                @media (max-width: 640px) {
                    .meet-kreddy-cta-wrap {
                        padding-left: 0 !important;
                        display: flex !important;
                        justify-content: center !important;
                    }
                }
            `}</style>
        </section>
    );
};

export default MeetKreddySection;
