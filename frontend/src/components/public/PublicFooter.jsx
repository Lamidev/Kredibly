import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const PublicFooter = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const scrollToSection = (sectionId) => {
        const isHomePage = location.pathname === '/' || location.pathname === '/home';
        if (!isHomePage) {
            navigate('/', { state: { scrollTo: sectionId } });
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <footer style={{
            background: '#FFFFFF',
            color: '#0F172A',
            padding: 'clamp(48px, 6vw, 80px) 24px 0',
            borderTop: '1px solid #F1F5F9',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
                {/* Top Bar: Nav Links on Left, Legal Copyright Notice on Right */}
                <div className="footer-top-bar" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '24px',
                    paddingBottom: 'clamp(32px, 4vw, 48px)'
                }}>
                    {/* Minimal Horizontal Links */}
                    <div style={{ display: 'flex', gap: 'clamp(16px, 2.5vw, 32px)', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button onClick={() => scrollToSection('problem')} className="footer-nav-link">
                            Why Kredibly
                        </button>
                        <button onClick={() => scrollToSection('meet-kreddy')} className="footer-nav-link">
                            Meet Kreddy
                        </button>
                        <button onClick={() => navigate('/pricing')} className="footer-nav-link">
                            Pricing
                        </button>
                        <Link to="/privacy" className="footer-nav-link">
                            Privacy Policy
                        </Link>
                        <a href="https://x.com/usekredibly" target="_blank" rel="noopener noreferrer" className="footer-nav-link">
                            Twitter
                        </a>
                        <a href="https://www.linkedin.com/company/usekredibly/" target="_blank" rel="noopener noreferrer" className="footer-nav-link">
                            LinkedIn
                        </a>
                        <a href="https://facebook.com/usekredibly" target="_blank" rel="noopener noreferrer" className="footer-nav-link">
                            Facebook
                        </a>
                    </div>

                    {/* Legal Copyright Line (Placed BEFORE the Giant Logo) */}
                    <div style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 400 }}>
                        © {new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd (RC-9466327). All rights reserved.
                    </div>
                </div>

                {/* Giant Base Brand Display Logo (Exact Reference Image Style) */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    paddingTop: '20px',
                    overflow: 'hidden',
                    lineHeight: 0.85
                }}>
                    <h1 style={{
                        fontSize: 'clamp(4.5rem, 18vw, 17rem)',
                        fontWeight: 900,
                        letterSpacing: '-0.05em',
                        color: 'transparent',
                        background: 'linear-gradient(180deg, #0F172A 0%, rgba(15, 23, 42, 0.12) 100%)',
                        WebkitBackgroundClip: 'text',
                        margin: 0,
                        padding: 0,
                        userSelect: 'none',
                        textAlign: 'center',
                        transform: 'translateY(10%)'
                    }}>
                        kredibly
                    </h1>
                </div>
            </div>

            <style>{`
                .footer-nav-link {
                    background: none;
                    border: none;
                    color: #475569;
                    font-size: 0.95rem;
                    font-weight: 500;
                    cursor: pointer;
                    text-decoration: none;
                    padding: 0;
                    transition: color 0.2s ease;
                }
                .footer-nav-link:hover {
                    color: var(--primary) !important;
                }
                @media (max-width: 768px) {
                    .footer-top-bar {
                        flex-direction: column;
                        align-items: flex-start !important;
                    }
                }
            `}</style>
        </footer>
    );
};

export default PublicFooter;
