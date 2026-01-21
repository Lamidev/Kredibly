import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";

const PrivacyPolicy = () => {
    return (
        <div className="auth-pattern" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            <PublicNavbar />

            <div style={{ paddingTop: '160px', maxWidth: '800px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
                <header style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <Shield size={48} color="var(--primary)" style={{ marginBottom: '24px' }} />
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px' }}>Privacy Policy</h1>
                    <p style={{ color: '#64748B' }}>Last Updated: January 2026</p>
                </header>

                <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px', lineHeight: '1.8', color: '#334155' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>1. Introduction</h3>
                    <p style={{ marginBottom: '24px' }}>
                        Kredibly Technologies Inc. ("we", "our", "us") values your privacy. This policy explains how we collect, use, and protect your data when you use our WhatsApp assistant (Kreddy) and our dashboard services.
                    </p>

                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>2. Data Collection</h3>
                    <p style={{ marginBottom: '24px' }}>
                        We collect information you provide directly, including business details, sales records logged via chat, and customer information for invoice generation.
                    </p>

                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>3. Data Usage</h3>
                    <div style={{ marginBottom: '24px' }}>
                        Your data is used to:
                        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                            <li>Provide and maintain the Service.</li>
                            <li>Generate verifiable invoices and financial reports.</li>
                            <li>Calculate your Trust Score.</li>
                        </ul>
                    </div>

                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>4. Security</h3>
                    <p style={{ marginBottom: '24px' }}>
                        We use industry-standard encryption to protect your data. Your financial records are private and are only shared with your explicit consent (e.g., when sending an invoice).
                    </p>
                </div>
            </div>
            <PublicFooter />
        </div>
    );
};

export default PrivacyPolicy;
