import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import SEO from '../../components/public/SEO';

const TermsOfService = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            <SEO 
                title="Terms of Service" 
                description="Read Kredibly's Terms of Service. Clear guidelines and terms governing your use of our website and WhatsApp business assistant." 
                path="/terms" 
            />
            <PublicNavbar />
            
            {/* Header Area */}
            <header style={{
                padding: 'clamp(140px, 12vw, 180px) 24px clamp(32px, 4vw, 56px)',
                maxWidth: '1100px',
                margin: '0 auto'
            }}>
                {/* Top Split Header */}
                <div className="legal-header-split" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(12, 1fr)',
                    gap: '24px',
                    alignItems: 'start'
                }}>
                    <div style={{ gridColumn: 'span 12' }} className="legal-header-left">
                        <h1 style={{ 
                            fontSize: 'clamp(2.8rem, 6vw, 4.2rem)', 
                            fontWeight: 900, 
                            letterSpacing: '-0.04em',
                            margin: 0,
                            color: '#0F172A',
                            lineHeight: 1.1
                        }}>
                            Terms of Service
                        </h1>
                    </div>
                    <div style={{ gridColumn: 'span 12' }} className="legal-header-right">
                        <p style={{
                            color: '#64748B',
                            fontSize: '1rem',
                            lineHeight: 1.6,
                            margin: 0,
                            maxWidth: '420px'
                        }}>
                            Your use of and access to Kredibly services are subject to the following terms. Please read them carefully before using our platform.
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Clean Structured Content */}
            <main style={{
                maxWidth: '1100px',
                margin: '0 auto 120px',
                padding: '0 24px'
            }}>
                <div style={{
                    borderTop: '1px solid #E2E8F0',
                    paddingTop: '48px',
                    maxWidth: '820px'
                }}>
                    <motion.div
                        key="terms-content"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="legal-text-body"
                    >
                        <p className="lead-text">
                            Please note that your use of and access to the services (as defined below) are subject to the following terms; if you do not agree to all of these terms, you may not use or access the services in any manner.
                        </p>

                        <h2>Overview of the Service</h2>
                        <p>
                            Kredibly is an AI-powered business assistant that operates through WhatsApp to help you manage your sales, invoices, and business finances. You can issue invoices, collect payments, track debts, and receive financial insights—all via WhatsApp chat, images, or voice notes. The Service is provided by <strong>AkinByte Technologies Ltd (RC-9466327)</strong>.
                        </p>

                        <h2>User Eligibility</h2>
                        <p>You must be:</p>
                        <ul>
                            <li>At least 18 years old</li>
                            <li>The owner of the WhatsApp number used</li>
                            <li>Authorized to use any linked payment methods or business bank accounts</li>
                        </ul>

                        <h2>Acceptable Use</h2>
                        <p>By using Kredibly, you agree to:</p>
                        <ul>
                            <li>Use the Service only for lawful business and personal financial activities</li>
                            <li>Provide accurate and up-to-date information</li>
                            <li>Not impersonate anyone or provide a false identity</li>
                            <li>Not use the Service to conduct fraud, money laundering, or any unlawful activity</li>
                            <li>
                                Not abuse, misuse, or attempt to manipulate our AI system in any way, including but not limited to: sending excessive or automated requests to disrupt the Service; attempting to jailbreak, bypass, or override safety controls; extracting system prompts or proprietary model behavior; or using the AI to generate harmful, abusive, or malicious content
                            </li>
                        </ul>
                        <p className="emphasis-text">We reserve the right to suspend or terminate your access if you violate these terms.</p>

                        <h2>Data and Privacy</h2>
                        <p>
                            Your use of Kredibly is also governed by our Privacy Policy, which outlines how we collect, store, and use your data. By using the Service, you consent to the processing of your personal and financial data in accordance with that policy.
                        </p>

                        <h2>Service Limitations</h2>
                        <p>
                            Kredibly is an AI assistant and provides financial insights, not professional tax or legal advice. We do not guarantee that all responses or interpretations of your input will be 100% accurate or appropriate for every situation.
                        </p>
                        <p>
                            We may occasionally limit access, pause transactions, or restrict certain features for maintenance, updates, or compliance.
                        </p>

                        <h2>Transactions & Responsibility</h2>
                        <p>
                            You are fully responsible for verifying the correctness of all invoices and transactions you initiate via Kredibly. Once confirmed, transactions may not be reversible.
                        </p>
                        <p>Kredibly is not liable for:</p>
                        <ul>
                            <li>Mistaken or unauthorized transactions initiated from your device</li>
                            <li>Delays or errors caused by third-party services (e.g., banks, payment processors)</li>
                        </ul>

                        <h2>Intellectual Property</h2>
                        <p>
                            All branding, features, algorithms, and AI technology used in the Kredibly platform are the intellectual property of AkinByte Technologies Ltd and its partners. You may not copy, modify, or reverse-engineer any part of the Service.
                        </p>

                        <h2>Termination</h2>
                        <p>
                            You may stop using Kredibly at any time by contacting us via email at <strong>support@usekredibly.com</strong>.
                        </p>
                        <p>
                            We may suspend or terminate your access for violating these Terms or if required by law or regulation.
                        </p>

                        <h2>Modifications to Terms</h2>
                        <p>
                            We may update these Terms at any time. Continued use after changes are posted means you accept the updated Terms. We’ll notify you through WhatsApp, Email, or our website when updates are made.
                        </p>

                        <h2>Contact Information</h2>
                        <p>If you have questions or concerns about these Terms, please contact us at:</p>
                        <ul>
                            <li><strong>Email:</strong> support@usekredibly.com</li>
                            <li><strong>Company Name:</strong> AkinByte Technologies Ltd (RC-9466327)</li>
                        </ul>
                    </motion.div>
                </div>
            </main>

            <PublicFooter />

            <style>{`
                @media (min-width: 768px) {
                    .legal-header-split .legal-header-left {
                        grid-column: span 7 !important;
                    }
                    .legal-header-split .legal-header-right {
                        grid-column: span 5 !important;
                    }
                }
                .legal-text-body .lead-text {
                    font-size: 1.15rem;
                    line-height: 1.7;
                    color: #334155;
                    margin-bottom: 36px;
                }
                .legal-text-body h2 {
                    font-size: 1.65rem;
                    font-weight: 800;
                    color: #0F172A;
                    margin-top: 44px;
                    margin-bottom: 16px;
                    letter-spacing: -0.02em;
                }
                .legal-text-body h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #0F172A;
                    margin-top: 24px;
                    margin-bottom: 12px;
                }
                .legal-text-body p {
                    font-size: 1.05rem;
                    line-height: 1.7;
                    color: #475569;
                    margin-bottom: 20px;
                }
                .legal-text-body ul {
                    margin-bottom: 24px;
                    padding-left: 24px;
                }
                .legal-text-body li {
                    font-size: 1.02rem;
                    line-height: 1.7;
                    color: #475569;
                    margin-bottom: 10px;
                }
                .legal-text-body .emphasis-text {
                    font-weight: 700;
                    color: #0F172A;
                    background: #F8FAFC;
                    padding: 12px 16px;
                    border-left: 3px solid var(--primary);
                    margin: 24px 0;
                }
            `}</style>
        </div>
    );
};

export default TermsOfService;
