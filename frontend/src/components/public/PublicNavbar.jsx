import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
    Menu, X, ChevronDown, Sparkles, LayoutDashboard, CreditCard, User, Building2
} from "lucide-react";
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
                { name: "Kreddy AI Assistant", desc: "Smart chat for sales & support.", path: "/product/kreddy-ai", icon: Sparkles },
                { name: "Merchant Dashboard", desc: "Analytics, Inventory & Team Mode.", path: "/product/dashboard", icon: LayoutDashboard },
                { name: "Premium Invoices", desc: "First-grade startup invoice designs.", path: "/product/escrow", icon: CreditCard }
            ]
        },

        { 
            name: "Solutions", 
            type: "dropdown", 
            items: [
                { name: "For Solopreneurs", desc: "Quick receipts and client tracking.", path: "/solution/solopreneurs", icon: User },
                { name: "Retail & E-commerce", desc: "Manage stock and offline sales.", path: "/solution/retail", icon: Building2 }
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
                                        <div className="dropdown-menu">
                                            {link.items.map((item, j) => (
                                                <Link key={j} to={item.path} className="dropdown-item">
                                                    <div className="dropdown-icon" style={{ background: 'rgba(76, 29, 149, 0.05)', color: 'var(--primary)' }}>
                                                        <item.icon size={20} />
                                                    </div>
                                                    <div className="dropdown-text">
                                                        <h4>{item.name}</h4>
                                                        <p>{item.desc}</p>
                                                    </div>
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
                                padding: '10px 24px', borderRadius: '12px', background: 'var(--primary)',
                                color: 'white', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none',
                                boxShadow: '0 4px 12px rgba(76, 29, 149, 0.2)'
                            }}
                        >
                            Try Kreddy
                        </a>
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)} 
                            className="mobile-menu-toggle"
                            style={{ background: 'none', border: 'none', color: '#0F172A', padding: '6px' }}
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile Menu Portal */}
            {createPortal(
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', zIndex: 9998 }} />
                            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: '320px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(30px)', borderLeft: '1px solid rgba(255, 255, 255, 0.2)', zIndex: 9999, overflowY: 'auto' }}>
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', WebkitTapHighlightColor: 'transparent' }}>
                                    {/* Header Part */}
                                    <div style={{ padding: 'calc(24px + env(safe-area-inset-top, 0px)) 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <img src="/krediblyrevamped.png" alt="Logo" style={{ height: '22px' }} />
                                        <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', width: '40px', height: '40px', color: '#0F172A' }}><X size={20} /></button>
                                    </div>

                                    {/* Scrollable Middle Part */}
                                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {navLinks.map((link, i) => (
                                                <div key={i}>
                                                    {link.type === 'dropdown' ? (
                                                        <>
                                                            <button onClick={() => toggleAccordion(link.name)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'none', border: 'none', fontWeight: 700, fontSize: 'clamp(0.95rem, 4vw, 1.05rem)', color: '#0F172A', outline: 'none' }}>
                                                                {link.name} <ChevronDown size={18} style={{ transform: expandedMenu === link.name ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                                            </button>
                                                            {expandedMenu === link.name && (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '16px' }}>
                                                                    {link.items.map((item, j) => (
                                                                        <Link key={j} to={item.path} onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '12px', textDecoration: 'none', color: '#1E293B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                            <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(76, 29, 149, 0.05)', color: 'var(--primary)' }}><item.icon size={16} /></div>
                                                                            {item.name}
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <Link 
                                                            to={link.path} 
                                                            onClick={(e) => {
                                                                handleLinkClick(e, link.path);
                                                                setIsMobileMenuOpen(false);
                                                            }} 
                                                            style={{ padding: '16px', display: 'block', textDecoration: 'none', color: '#0F172A', fontWeight: 700, fontSize: 'clamp(0.95rem, 4vw, 1.05rem)' }}
                                                        >
                                                            {link.name}
                                                        </Link>

                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Fixed Footer Part */}
                                    <div style={{ padding: '24px', borderTop: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.1)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <Link to="/auth/login" onClick={() => setIsMobileMenuOpen(false)} style={{ 
                                                width: '100%', padding: '16px', borderRadius: '12px', background: 'white', border: '1px solid #E2E8F0', textAlign: 'center', textDecoration: 'none', color: '#0F172A', fontWeight: 800, fontSize: 'clamp(0.85rem, 3.5vw, 0.95rem)'
                                            }}>Login</Link>
                                            <a 
                                                href={KREDDY_CONFIG.getLink("Hi Kreddy\nI'd like to see how Kredibly works.")}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                style={{ 
                                                    width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--primary)', textAlign: 'center', textDecoration: 'none', color: 'white', fontWeight: 800, fontSize: 'clamp(0.85rem, 3.5vw, 0.95rem)', boxShadow: '0 10px 20px -5px rgba(76, 29, 149, 0.3)' 
                                                }}
                                            >
                                                Try Kreddy
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default PublicNavbar;
