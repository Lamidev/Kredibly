import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { KREDDY_CONFIG } from "../../config";

const PublicNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleAccordion = (menu) => {
        setExpandedMenu(expandedMenu === menu ? null : menu);
    };

    const handleLinkClick = (e, path) => {
        if (path === '/') {
            const isHomePage = location.pathname === '/' || location.pathname === '/home';
            if (isHomePage) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else if (path.startsWith('/#')) {
            e.preventDefault();
            const sectionId = path.replace('/#', '');
            const isHomePage = location.pathname === '/' || location.pathname === '/home';
            if (isHomePage) {
                const element = document.getElementById(sectionId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                navigate('/', { state: { scrollTo: sectionId } });
            }
        }
    };

    const navLinks = [
        { name: "Features", path: "/" },
        { 
            name: "Product", 
            type: "dropdown", 
            items: [
                { name: "Kreddy AI Assistant", desc: "Smart chat for sales, debts & support.", path: "/product/kreddy-ai" },
                { name: "Merchant Dashboard", desc: "Analytics, inventory & multi-staff mode.", path: "/product/dashboard" },
                { name: "Premium Invoices", desc: "Professional invoices & 0% fee bank sweeps.", path: "/product/premium-invoices" }
            ]
        },
        { 
            name: "Solutions", 
            type: "dropdown", 
            items: [
                { name: "For Solopreneurs", desc: "Quick receipts & client credit tracking.", path: "/solution/solopreneurs" },
                { name: "Retail & E-commerce", desc: "Manage stock & offline sales.", path: "/solution/retail" }
            ]
        },
        { name: "Pricing", path: "/pricing" },
        { name: "About Us", path: "/about" }
    ];

    return (
        <>
            <div className="pill-nav-container">
                <nav className="pill-nav">
                    {/* Logo */}
                    <Link to="/" onClick={() => window.scrollTo(0, 0)} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '26px' }} />
                    </Link>

                    {/* Desktop Links */}
                    <div className="nav-links-desktop">
                        {navLinks.map((link, i) => (
                            <div key={i} className="dropdown-parent" style={{ position: 'relative' }}>
                                {link.type === 'dropdown' ? (
                                    <>
                                        <div className="nav-link" style={{ color: '#0F172A', opacity: 1, fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '12px 0' }}>
                                            {link.name} <ChevronDown size={14} />
                                        </div>
                                        <div className="dropdown-menu" style={{
                                            minWidth: '240px',
                                            padding: '8px',
                                            borderRadius: '16px',
                                            background: '#FFFFFF',
                                            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.12)',
                                            border: '1px solid #E2E8F0'
                                        }}>
                                            {link.items.map((item, j) => (
                                                <Link key={j} to={item.path} className="dropdown-item-clean" style={{
                                                    display: 'block',
                                                    padding: '10px 12px',
                                                    borderRadius: '10px',
                                                    textDecoration: 'none',
                                                    transition: 'background 0.15s ease'
                                                }}>
                                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                                                        {item.name}
                                                    </h4>
                                                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B', lineHeight: 1.35, fontWeight: 400 }}>
                                                        {item.desc}
                                                    </p>
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <Link 
                                        to={link.path} 
                                        onClick={(e) => handleLinkClick(e, link.path)}
                                        style={{ color: '#0F172A', opacity: 1, fontSize: '0.92rem', fontWeight: 700, textDecoration: 'none' }}
                                    >
                                         {link.name}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="nav-actions">
                        <Link to="/auth/login" className="btn-desktop" style={{ 
                            padding: '10px 20px', borderRadius: '12px',
                            color: '#0F172A', fontSize: '0.92rem', fontWeight: 800, textDecoration: 'none', transition: '0.2s',
                            border: '1px solid rgba(15, 23, 42, 0.1)',
                            background: 'rgba(255,255,255,0.5)',
                            marginRight: '4px'
                        }}>
                            Login
                        </Link>
                        <a 
                            href={KREDDY_CONFIG.getLink("Hi Kreddy\nI'd like to see how Kredibly works.")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-desktop" 
                            style={{ 
                                padding: '10px 24px', borderRadius: '100px', background: 'var(--primary)',
                                color: 'white', fontSize: '0.9rem', fontWeight: 800, textDecoration: 'none',
                                boxShadow: '0 4px 12px rgba(76, 29, 149, 0.2)'
                            }}
                        >
                            Try Kreddy
                        </a>
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)} 
                            className="mobile-menu-toggle"
                            style={{ background: 'none', border: 'none', color: '#0F172A', padding: '6px' }}
                            aria-label="Open Navigation Menu"
                        >
                            <Menu size={26} />
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile Full-Screen Overlay Menu */}
            {createPortal(
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                width: '100vw',
                                height: '100vh',
                                height: '100dvh',
                                background: '#FFFFFF',
                                zIndex: 99999,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: 'clamp(20px, 4vh, 32px) 24px',
                                boxSizing: 'border-box',
                                WebkitTapHighlightColor: 'transparent'
                            }}
                        >
                            {/* Header: Logo on Left End + Close Button on Right End */}
                            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '24px' }} />
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{
                                        background: '#F1F5F9',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#0F172A',
                                        cursor: 'pointer'
                                    }}
                                    aria-label="Close Navigation Menu"
                                >
                                    <X size={22} />
                                </button>
                            </div>


                            {/* Centered Navigation Content */}
                            <div style={{
                                width: '100%',
                                maxWidth: '360px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                textAlign: 'center',
                                margin: 'auto 0'
                            }}>
                                {navLinks.map((link, i) => (
                                    <div key={i} style={{ width: '100%', textAlign: 'center' }}>
                                        {link.type === 'dropdown' ? (
                                            <div>
                                                <button
                                                    onClick={() => toggleAccordion(link.name)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#0F172A',
                                                        fontWeight: 800,
                                                        fontSize: '1.2rem',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        cursor: 'pointer',
                                                        padding: '6px 0'
                                                    }}
                                                >
                                                    <span>{link.name}</span>
                                                    <ChevronDown size={18} style={{ transform: expandedMenu === link.name ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                                </button>

                                                <AnimatePresence>
                                                    {expandedMenu === link.name && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '6px',
                                                                alignItems: 'center',
                                                                paddingTop: '6px',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            {link.items.map((item, j) => (
                                                                <Link
                                                                    key={j}
                                                                    to={item.path}
                                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                                    style={{
                                                                        color: '#475569',
                                                                        textDecoration: 'none',
                                                                        fontSize: '0.98rem',
                                                                        fontWeight: 600,
                                                                        padding: '4px 0'
                                                                    }}
                                                                >
                                                                    {item.name}
                                                                </Link>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        ) : (
                                            <Link
                                                to={link.path}
                                                onClick={(e) => {
                                                    handleLinkClick(e, link.path);
                                                    setIsMobileMenuOpen(false);
                                                }}
                                                style={{
                                                    color: '#0F172A',
                                                    textDecoration: 'none',
                                                    fontWeight: 800,
                                                    fontSize: '1.2rem',
                                                    display: 'block',
                                                    padding: '6px 0'
                                                }}
                                            >
                                                {link.name}
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Centered Actions Footer */}
                            <div style={{
                                width: '100%',
                                maxWidth: '320px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <Link
                                    to="/auth/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{
                                        color: '#0F172A',
                                        fontWeight: 700,
                                        fontSize: '1rem',
                                        textDecoration: 'none',
                                        padding: '4px 0'
                                    }}
                                >
                                    Login
                                </Link>
                                <a
                                    href={KREDDY_CONFIG.getLink("Hi Kreddy\nI'd like to see how Kredibly works.")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    style={{
                                        width: '100%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '14px 28px',
                                        borderRadius: '100px',
                                        backgroundColor: 'var(--primary)',
                                        color: '#FFFFFF',
                                        textDecoration: 'none',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        boxShadow: '0 8px 24px rgba(76, 29, 149, 0.25)',
                                        textAlign: 'center'
                                    }}
                                >
                                    Try Kreddy
                                </a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <style>{`
                .dropdown-item-clean:hover {
                    background-color: #F8FAFC !important;
                }
                .dropdown-item-clean:hover h4 {
                    color: var(--primary) !important;
                }
            `}</style>
        </>
    );
};

export default PublicNavbar;
