import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

const PublicFooter = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const scrollToSection = (sectionId) => {
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: sectionId } });
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <footer style={{ padding: '100px 20px 60px', background: 'white', borderTop: '1px solid #F1F5F9' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '60px',
                    marginBottom: '80px',
                    textAlign: 'left'
                }}>
                    <div style={{ gridColumn: 'span 2' }}>
                        <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '40px', objectFit: 'contain', marginBottom: '24px' }} />
                        <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: '#64748B', fontWeight: 500, maxWidth: '400px' }}>
                            The Financial Operating System for African Commerce. We're bridging the gap between chat and credit-worthiness.
                        </p>
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 800, marginBottom: '24px', color: 'var(--text)' }}>Product</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <button onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', textAlign: 'left', color: '#64748B', fontWeight: 500, cursor: 'pointer', padding: 0, fontSize: '1rem', fontFamily: 'inherit' }}>Features</button>
                            <button onClick={() => scrollToSection('how-it-works')} style={{ background: 'none', border: 'none', textAlign: 'left', color: '#64748B', fontWeight: 500, cursor: 'pointer', padding: 0, fontSize: '1rem', fontFamily: 'inherit' }}>AI Sales Link</button>
                            <button onClick={() => scrollToSection('pricing')} style={{ background: 'none', border: 'none', textAlign: 'left', color: '#64748B', fontWeight: 500, cursor: 'pointer', padding: 0, fontSize: '1rem', fontFamily: 'inherit' }}>Pricing</button>
                        </div>
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 800, marginBottom: '24px', color: 'var(--text)' }}>Company</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <Link to="/about" style={{ textDecoration: 'none', color: '#64748B', fontWeight: 500 }}>About Us</Link>
                            <Link to="/contact" style={{ textDecoration: 'none', color: '#64748B', fontWeight: 500 }}>Support Hub</Link>
                            <Link to="/privacy" style={{ textDecoration: 'none', color: '#64748B', fontWeight: 500 }}>Privacy Policy</Link>
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
                    <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#94A3B8' }}>
                        © 2026 Kredibly Technologies Inc.
                    </p>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <span style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600 }}>Twitter</span>
                        <span style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600 }}>LinkedIn</span>
                        <span style={{ color: '#94A3B8', fontSize: '0.9rem', fontWeight: 600 }}>Instagram</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default PublicFooter;
