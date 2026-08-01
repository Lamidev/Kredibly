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
                {/* Desktop Top Bar */}
                <div className="footer-top-bar desktop-only" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '24px',
                    paddingBottom: 'clamp(28px, 4vw, 48px)',
                    width: '100%'
                }}>
                    <div className="footer-links-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                    <div className="footer-legal-line" style={{ fontSize: '0.85rem', color: '#94A3B8', fontWeight: 400, textAlign: 'right', flexShrink: 0 }}>
                        © {new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd (RC-9466327). All rights reserved.
                    </div>
                </div>

                {/* Mobile 2-Column Grid Footer (Exact Reference Layout) */}
                <div className="footer-mobile-container mobile-only">
                    <div className="mobile-footer-grid">
                        {/* Row 1 */}
                        <div className="mobile-grid-item text-left">
                            <button onClick={() => scrollToSection('meet-kreddy')} className="footer-nav-link mobile-link">
                                Meet Kreddy
                            </button>
                        </div>
                        <div className="mobile-grid-item text-right">
                            <a href="https://x.com/usekredibly" target="_blank" rel="noopener noreferrer" className="footer-nav-link mobile-link">
                                Twitter
                            </a>
                        </div>

                        {/* Row 2 */}
                        <div className="mobile-grid-item text-left">
                            <Link to="/privacy" className="footer-nav-link mobile-link">
                                Privacy Policy
                            </Link>
                        </div>
                        <div className="mobile-grid-item text-right">
                            <Link to="/terms" className="footer-nav-link mobile-link">
                                Terms of Service
                            </Link>
                        </div>

                        {/* Row 3 */}
                        <div className="mobile-grid-item text-left">
                            <a href="https://www.linkedin.com/company/usekredibly/" target="_blank" rel="noopener noreferrer" className="footer-nav-link mobile-link">
                                LinkedIn
                            </a>
                        </div>
                        <div className="mobile-grid-item text-right">
                            <a href="https://facebook.com/usekredibly" target="_blank" rel="noopener noreferrer" className="footer-nav-link mobile-link">
                                Facebook
                            </a>
                        </div>
                    </div>

                    {/* Legal Notice Below */}
                    <div className="footer-legal-line-mobile">
                        © {new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd (RC-9466327). All rights reserved.
                    </div>
                </div>
            </div>

            {/* Edge-to-Edge Giant Base Brand Display Logo */}
            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                paddingTop: '20px',
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
                    color: #0F172A;
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

                @media (min-width: 769px) {
                    .mobile-only {
                        display: none !important;
                    }
                    .desktop-only {
                        display: flex !important;
                    }
                }

                @media (max-width: 768px) {
                    .desktop-only {
                        display: none !important;
                    }
                    .mobile-only {
                        display: block !important;
                    }
                    .footer-mobile-container {
                        width: 100%;
                        padding: 10px 0 20px;
                    }
                    .mobile-footer-grid {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        row-gap: 28px !important;
                        column-gap: 32px !important;
                        max-width: 310px;
                        margin: 0 auto;
                        width: 100%;
                        align-items: center;
                    }
                    .mobile-grid-item.text-left {
                        text-align: left;
                    }
                    .mobile-grid-item.text-right {
                        text-align: right;
                    }
                    .mobile-link {
                        font-size: 0.95rem !important;
                        font-weight: 500 !important;
                        color: #0F172A !important;
                        white-space: nowrap !important;
                    }
                    .footer-legal-line-mobile {
                        text-align: center !important;
                        color: #64748B !important;
                        font-weight: 400 !important;
                        font-size: 0.84rem !important;
                        line-height: 1.5;
                        max-width: 320px;
                        margin: 36px auto 0;
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
