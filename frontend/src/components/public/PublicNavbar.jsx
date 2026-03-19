import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
    Menu, X, ChevronDown, Sparkles, LayoutDashboard, CreditCard, User, Building2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PublicNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [expandedMenu, setExpandedMenu] = useState(null);

    const toggleAccordion = (menu) => {
        setExpandedMenu(expandedMenu === menu ? null : menu);
    };

    const navLinks = [
        { name: "Home", path: "/home" },
        { 
            name: "Product", 
            type: "dropdown", 
            items: [
                { name: "Kreddy AI Assistant", desc: "Smart chat for sales & support.", path: "/product/kreddy-ai", icon: Sparkles },
                { name: "Merchant Dashboard", desc: "Analytics, Inventory & Team Mode.", path: "/product/merchant-dashboard", icon: LayoutDashboard },
                { name: "Premium Invoices", desc: "First-grade startup invoice designs.", path: "/product/premium-invoices", icon: CreditCard }
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
            <div style={{ 
                position: 'fixed', 
                top: '24px', 
                left: 0, 
                right: 0, 
                zIndex: 1000, 
                padding: '0 20px',
                pointerEvents: 'none'
            }}>
                <nav  style={{ 
                    maxWidth: '1100px', 
                    margin: '0 auto', 
                    background: 'rgba(255, 255, 255, 0.7)', 
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '100px',
                    padding: '8px 12px 8px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
                    pointerEvents: 'auto'
                }}>
                    {/* Logo */}
                    <Link to="/" onClick={() => window.scrollTo(0, 0)} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                        <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '32px' }} />
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex" style={{ gap: '24px', alignItems: 'center' }}>
                        {navLinks.map((link, i) => (
                            <div key={i} className="dropdown-parent" style={{ position: 'relative' }}>
                                {link.type === 'dropdown' ? (
                                    <>
                                        <div className="nav-link" style={{ color: '#0F172A', opacity: 0.8, fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '12px 0' }}>
                                            {link.name} <ChevronDown size={14} />
                                        </div>
                                        <div className="dropdown-menu" style={{ 
                                            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                                            background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', minWidth: '280px', borderRadius: '24px', padding: '12px',
                                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid #F1F5F9'
                                        }}>
                                            {link.items.map((item, j) => (
                                                <Link key={j} to={item.path} className="dropdown-item" style={{ 
                                                    display: 'flex', gap: '16px', padding: '12px', borderRadius: '16px', textDecoration: 'none', transition: '0.2s'
                                                }}>
                                                    <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(76, 29, 149, 0.05)', color: 'var(--primary)' }}>
                                                        <item.icon size={20} />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{item.name}</h4>
                                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{item.desc}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <Link to={link.path} style={{ color: '#0F172A', opacity: 0.8, fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none' }}>
                                        {link.name}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Link to="/auth/login" className="hidden md:flex" style={{ 
                            padding: '12px 24px', borderRadius: '100px',
                            color: '#0F172A', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none', transition: '0.2s'
                        }}>
                            Login
                        </Link>
                        <Link to="/auth/register" className="hidden md:flex" style={{ 
                            padding: '12px 28px', borderRadius: '100px', background: 'var(--primary)',
                            color: 'white', fontSize: '0.9rem', fontWeight: 700, textDecoration: 'none',
                            boxShadow: '0 4px 12px rgba(76, 29, 149, 0.2)'
                        }}>
                            Get Started
                        </Link>
                        <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: '#0F172A', padding: '8px' }} className="md:hidden">
                            <Menu size={24} />
                        </button>
                    </div>
                </nav>
            </div>

            {/* Mobile Menu (Keeping existing portal logic but updating styles for consistency) */}
            {createPortal(
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(10px)', zIndex: 9998 }} />
                            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '85%', maxWidth: '320px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(30px)', borderLeft: '1px solid rgba(255, 255, 255, 0.2)', zIndex: 9999, overflowY: 'auto' }}>
                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <img src="/krediblyrevamped.png" alt="Logo" style={{ height: '32px' }} />
                                        <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', width: '40px', height: '40px', color: '#0F172A' }}><X size={20} /></button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {navLinks.map((link, i) => (
                                            <div key={i}>
                                                {link.type === 'dropdown' ? (
                                                    <>
                                                        <button onClick={() => toggleAccordion(link.name)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'none', border: 'none', fontWeight: 600, fontSize: '1.05rem' }}>
                                                            {link.name} <ChevronDown size={18} style={{ transform: expandedMenu === link.name ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                                        </button>
                                                        {expandedMenu === link.name && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '16px' }}>
                                                                {link.items.map((item, j) => (
                                                                    <Link key={j} to={item.path} onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '12px', textDecoration: 'none', color: '#1E293B', fontWeight: 500 }}>{item.name}</Link>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Link to={link.path} onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '16px', display: 'block', textDecoration: 'none', color: '#0F172A', fontWeight: 600 }}>{link.name}</Link>
                                                )}
                                            </div>
                                        ))}

                                        <div style={{ padding: '16px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <Link to="/auth/login" onClick={() => setIsMobileMenuOpen(false)} style={{ 
                                                width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.05)', textAlign: 'center', textDecoration: 'none', color: '#0F172A', fontWeight: 700 
                                            }}>Login</Link>
                                            <Link to="/auth/register" onClick={() => setIsMobileMenuOpen(false)} style={{ 
                                                width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--primary)', textAlign: 'center', textDecoration: 'none', color: 'white', fontWeight: 700, boxShadow: '0 10px 20px -5px rgba(76, 29, 149, 0.3)' 
                                            }}>Start Selling Free</Link>
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
