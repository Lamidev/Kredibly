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
            padding: 'clamp(40px, 5vw, 72px) 0 0',
            borderTop: '1px solid #F1F5F9',
            overflow: 'hidden',
            position: 'relative',
            width: '100%'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
                {/* Top Bar: Nav Links on Left, Legal Copyright Notice Strictly Opposite on Right */}
                <div className="footer-top-bar" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '24px',
                    paddingBottom: 'clamp(28px, 4vw, 48px)',
                    width: '100%'
                }}>
                    {/* Links Group: Stacked in 2 straight horizontal rows on mobile */}
                    <div className="footer-links-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Row 1: Primary Links in a straight line */}
                        <div className="footer-links-row" style={{ display: 'flex', gap: 'clamp(12px, 2vw, 24px)', alignItems: 'center', flexWrap: 'nowrap' }}>
                            <button onClick={() => scrollToSection('meet-kreddy')} className="footer-nav-link">
                                Meet Kreddy
                            </button>
                            <Link to="/privacy" className="footer-nav-link">
                                Privacy Policy
                            </Link>
                            <Link to="/terms" className="footer-nav-link">
                                Terms of Service
                            </Link>
                        </div>
                        {/* Row 2: Social Links in a straight line below */}
                        <div className="footer-social-row" style={{ display: 'flex', gap: 'clamp(16px, 2vw, 28px)', alignItems: 'center', flexWrap: 'nowrap' }}>
                            <a href="https://x.com/usekredibly" target="_blank" rel="noopener noreferrer" className="footer-nav-link footer-social-link">
                                Twitter
                            </a>
                            <a href="https://www.linkedin.com/company/usekredibly/" target="_blank" rel="noopener noreferrer" className="footer-nav-link footer-social-link">
                                LinkedIn
                            </a>
                            <a href="https://facebook.com/usekredibly" target="_blank" rel="noopener noreferrer" className="footer-nav-link footer-social-link">
                                Facebook
                            </a>
                        </div>
                    </div>

                    {/* Legal Copyright Line */}
                    <div className="footer-legal-line" style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 400, textAlign: 'right', flexShrink: 0 }}>
                        © {new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd (RC-9466327). All rights reserved.
                    </div>
                </div>
            </div>

            {/* Edge-to-Edge Full Viewport Width Giant Base Brand Display Logo */}
            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                paddingTop: '10px',
                overflow: 'hidden',
                lineHeight: 0.75
            }}>
                <h1 className="giant-footer-logo" style={{
                    fontSize: 'clamp(3.8rem, 21.2vw, 25rem)',
                    fontWeight: 950,
                    letterSpacing: '-0.06em',
                    color: 'transparent',
                    background: 'linear-gradient(180deg, #0F172A 0%, rgba(15, 23, 42, 0.1) 100%)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    margin: 0,
                    padding: 0,
                    userSelect: 'none',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    transform: 'translateY(10%) scaleX(1.04)'
                }}>
                    kredibly
                </h1>
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
                @media (min-width: 992px) {
                    .footer-top-bar {
                        flex-direction: row !important;
                        justify-content: space-between !important;
                        align-items: center !important;
                    }
                    .footer-legal-line {
                        margin-left: auto !important;
                        text-align: right !important;
                    }
                }
                @media (max-width: 991px) {
                    .footer-top-bar {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 20px !important;
                    }
                    .footer-links-group {
                        width: 100% !important;
                        gap: 14px !important;
                    }
                    .footer-links-row {
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: nowrap !important;
                        justify-content: flex-start !important;
                        gap: 12px !important;
                        width: 100% !important;
                    }
                    .footer-links-row .footer-nav-link {
                        font-size: 0.84rem !important;
                        white-space: nowrap !important;
                    }
                    .footer-social-row {
                        display: flex !important;
                        flex-direction: row !important;
                        flex-wrap: nowrap !important;
                        justify-content: flex-start !important;
                        gap: 16px !important;
                        width: 100% !important;
                    }
                    .footer-social-row .footer-nav-link {
                        font-size: 0.84rem !important;
                        white-space: nowrap !important;
                        color: #64748B !important;
                    }
                    .footer-legal-line {
                        text-align: left !important;
                        white-space: normal !important;
                        color: #64748B !important;
                        font-weight: 400 !important;
                        font-size: 0.78rem !important;
                    }

                    .giant-footer-logo {
                        font-size: 21vw !important;
                        letter-spacing: -0.05em !important;
                        transform: translateY(8%) scaleX(1.06) !important;
                    }
                }
            `}</style>
        </footer>
    );
};

export default PublicFooter;
