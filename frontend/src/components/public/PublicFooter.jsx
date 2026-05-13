import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Twitter, Instagram, Linkedin, Facebook, Music2, MapPin, Mail, ChevronRight } from "lucide-react";

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
        <footer style={{ background: 'white', color: '#0F172A', padding: '100px 24px 0', borderTop: '1px solid #E2E8F0' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
                    gap: '60px',
                    marginBottom: '80px'
                }}>
                    <div style={{ maxWidth: '380px' }}>
                        <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '32px', objectFit: 'contain', marginBottom: '24px' }} />
                        <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#64748B', fontWeight: 400, marginBottom: '32px' }}>
                            Receivables Infrastructure for the Future of African Commerce. We empower Nigerian vendors to automate sales, track debts, and build financial credibility.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {socialLinks.map((social) => {
                                const Icon = social.icon;
                                return (
                                    <a 
                                        key={social.name} 
                                        href={social.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{ 
                                            width: '44px', 
                                            height: '44px', 
                                            borderRadius: '14px', 
                                            background: '#F8FAFC', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: '#64748B',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            textDecoration: 'none',
                                            border: '1px solid #E2E8F0'
                                        }}
                                        className="footer-social-link"
                                    >
                                        <Icon size={20} />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    <div className="footer-links-container">
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '32px', color: '#0F172A' }}>Product</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {['Features', 'How it Works', 'Pricing', 'Mission Map'].map(item => (
                                <button 
                                    key={item}
                                    onClick={() => item === 'Pricing' ? navigate('/pricing') : scrollToSection(item.toLowerCase().replace(/ /g, '-'))}
                                    style={{ background: 'none', border: 'none', textAlign: 'left', color: '#64748B', fontWeight: 400, cursor: 'pointer', padding: 0, fontSize: '0.95rem', transition: 'all 0.2s' }}
                                    className="footer-link-hover"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '32px', color: '#0F172A' }}>Company</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <Link to="/about" style={{ textDecoration: 'none', color: '#64748B', fontWeight: 400, fontSize: '0.95rem', transition: 'all 0.2s' }} className="footer-link-hover">About Us</Link>
                            <Link to="/contact" style={{ textDecoration: 'none', color: '#64748B', fontWeight: 400, fontSize: '0.95rem', transition: 'all 0.2s' }} className="footer-link-hover">Contact Support</Link>
                            <Link to="/privacy" style={{ textDecoration: 'none', color: '#64748B', fontWeight: 400, fontSize: '0.95rem', transition: 'all 0.2s' }} className="footer-link-hover">Privacy & Terms</Link>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '32px', color: '#0F172A' }}>Trust & Safety</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                <MapPin size={18} color="var(--primary)" />
                                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#0F172A' }}>Lagos, Nigeria 🇳🇬</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                <Mail size={18} color="#10B981" />
                                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#10B981' }}>hello@usekredibly.com</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ 
                    padding: '40px 0', 
                    borderTop: '1px solid #F1F5F9', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
                        <p style={{ fontWeight: 400, fontSize: '0.85rem', color: '#94A3B8', margin: 0 }}>
                            © {new Date().getFullYear()} Kredibly · A product of AkinByte Technologies Ltd (RC-9466327).
                        </p>
                        <p style={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 400 }}>All rights reserved. Professional Receivables Infrastructure.</p>
                    </div>
                </div>
            </div>



            <style>{`
                .footer-social-link:hover {
                    background: var(--primary) !important;
                    color: white !important;
                    border-color: var(--primary) !important;
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(124, 58, 237, 0.2);
                }
                .footer-link-hover:hover {
                    color: var(--primary) !important;
                    transform: translateX(4px);
                }
                @media (min-width: 1024px) {
                    .footer-links-container {
                        padding-left: 40px;
                    }
                }
                @media (max-width: 640px) {
                    footer {
                        padding: 60px 24px 40px !important;
                    }
                    .footer-social-link {
                        width: 48px !important;
                        height: 48px !important;
                    }
                }
            `}</style>
        </footer>
    );
};

export default PublicFooter;
