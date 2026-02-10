import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Twitter, Instagram, Linkedin, Facebook, Music2, MapPin, Mail, ChevronRight } from "lucide-react";

const PublicFooter = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const scrollToSection = (sectionId) => {
        if (location.pathname !== '/home') {
            navigate('/home', { state: { scrollTo: sectionId } });
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const socialLinks = [
        { name: "Twitter", icon: Twitter, url: "https://x.com/usekredibly" },
        { name: "Instagram", icon: Instagram, url: "https://instagram.com/usekredibly" },
        { name: "LinkedIn", icon: Linkedin, url: "https://www.linkedin.com/company/usekredibly/" },
        { name: "Facebook", icon: Facebook, url: "https://facebook.com/usekredibly" },
        { 
            name: "TikTok", 
            icon: (props) => (
                <svg width={props.size || 18} height={props.size || 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                </svg>
            ), 
            url: "https://tiktok.com/@usekredibly" 
        },
    ];

    return (
        <footer style={{ background: 'white', color: 'var(--text)', padding: '80px 20px 40px', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
                    gap: '40px',
                    marginBottom: '60px'
                }}>
                    <div style={{ maxWidth: '380px' }}>
                        <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '36px', objectFit: 'contain', marginBottom: '24px' }} />
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#334155', fontWeight: 500, marginBottom: '24px' }}>
                            The Operating System for African Commerce. We help millions of vendors turn chat-based sales into financial credibility.
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a 
                                        key={social.name} 
                                        href={social.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ 
                                            width: '40px', 
                                            height: '40px', 
                                            borderRadius: '12px', 
                                            background: '#F1F5F9', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: '#334155',
                                            transition: 'all 0.3s ease',
                                            textDecoration: 'none',
                                            border: '1px solid #E2E8F0'
                                        }}
                                        className="footer-social-link"
                                    >
                                        <Icon size={18} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <div className="footer-links-container">
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', color: 'var(--text)' }}>Product</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {['Features', 'How it Works', 'Pricing', 'Mission Map'].map(item => (
                                <button 
                                    key={item}
                                    onClick={() => item === 'Pricing' ? navigate('/pricing') : scrollToSection(item.toLowerCase().replace(/ /g, '-'))}
                                    style={{ background: 'none', border: 'none', textAlign: 'left', color: '#334155', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '1rem', transition: 'color 0.3s' }}
                                    className="footer-link-hover"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', color: 'var(--text)' }}>Company</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Link to="/about" style={{ textDecoration: 'none', color: '#334155', fontWeight: 600, transition: 'color 0.3s' }} className="footer-link-hover">About Us</Link>
                            <Link to="/contact" style={{ textDecoration: 'none', color: '#334155', fontWeight: 600, transition: 'color 0.3s' }} className="footer-link-hover">Contact Support</Link>
                            <Link to="/privacy" style={{ textDecoration: 'none', color: '#334155', fontWeight: 600, transition: 'color 0.3s' }} className="footer-link-hover">Privacy & Terms</Link>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px', color: 'var(--text)' }}>Contact</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '12px', color: '#334155' }}>
                                <MapPin size={20} color="var(--primary)" />
                                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Lagos, Nigeria & globally remote.</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', color: '#334155' }}>
                                <Mail size={20} color="var(--primary)" />
                                <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>hello@kredibly.com</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style={{ 
                    paddingTop: '40px', 
                    borderTop: '1px solid #F1F5F9', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '20px'
                }}>
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155' }}>
                        © 2026 Kredibly Technologies Inc. Made with ❤️ for Africa.
                    </p>
                    <div style={{ display: 'flex', gap: '32px' }}>
                        <span style={{ color: '#334155', fontSize: '0.9rem', fontWeight: 700 }}>Built for Global Commerce</span>
                    </div>
                </div>
            </div>

            <style>{`
                .footer-social-link:hover {
                    background: var(--primary) !important;
                    color: white !important;
                    border-color: var(--primary) !important;
                    transform: translateY(-4px);
                }
                .footer-link-hover:hover {
                    color: var(--primary) !important;
                }
                @media (min-width: 1024px) {
                    .footer-links-container {
                        padding-left: 40px;
                    }
                }
                @media (max-width: 640px) {
                    footer {
                        padding: 40px 24px 20px !important;
                    }
                    .footer-social-link {
                        width: 44px !important;
                        height: 44px !important;
                    }
                }
            `}</style>
        </footer>
    );
};

export default PublicFooter;
