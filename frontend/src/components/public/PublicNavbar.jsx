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

    return (
        <>
            <nav className="glass-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
                {/* Same Desktop Nav Code... keeping it brief to focus on mobile menu below */}
                <div className="landing-nav-container" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link to="/home" onClick={() => window.scrollTo(0, 0)} style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '36px', objectFit: 'contain', filter: 'contrast(1.15) brightness(1.02)' }} />
                    </Link>

                    {/* Center: Desktop Nav Links... */}
                    <div className="hidden md:flex" style={{ gap: '32px', alignItems: 'center' }}>
                       <Link to="/home" className="nav-link" style={{ textDecoration: 'none', color: 'inherit' }}>Home</Link>
                        {/* ... (Existing Desktop Dropdowns - No Changes) ... */}
                        <div className="dropdown-parent">
                            <div className="nav-link">Product <ChevronDown size={14} /></div>
                            <div className="dropdown-menu">
                                <Link to="/product/kreddy-ai" className="dropdown-item">
                                    <div className="dropdown-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}><Sparkles size={20} /></div>
                                    <div className="dropdown-text"><h4>Kreddy AI Assistant</h4><p>Smart chat for sales & support.</p></div>
                                </Link>
                                <Link to="/product/merchant-dashboard" className="dropdown-item">
                                    <div className="dropdown-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}><LayoutDashboard size={20} /></div>
                                    <div className="dropdown-text"><h4>Merchant Dashboard</h4><p>Analytics, Inventory & Team Mode.</p></div>
                                </Link>
                                <Link to="/product/premium-invoices" className="dropdown-item">
                                    <div className="dropdown-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><CreditCard size={20} /></div>
                                    <div className="dropdown-text"><h4>Premium Invoices</h4><p>First-grade startup invoice designs.</p></div>
                                </Link>
                            </div>
                        </div>
                        <div className="dropdown-parent">
                            <div className="nav-link">Solutions <ChevronDown size={14} /></div>
                            <div className="dropdown-menu">
                                <Link to="/solution/solopreneurs" className="dropdown-item">
                                    <div className="dropdown-icon" style={{ background: '#F8FAFC', color: '#64748B' }}><User size={20} /></div>
                                    <div className="dropdown-text"><h4>For Solopreneurs</h4><p>Quick receipts and client tracking.</p></div>
                                </Link>
                                <Link to="/solution/retail" className="dropdown-item">
                                    <div className="dropdown-icon" style={{ background: '#F8FAFC', color: '#64748B' }}><Building2 size={20} /></div>
                                    <div className="dropdown-text"><h4>Retail & E-commerce</h4><p>Manage stock and offline sales.</p></div>
                                </Link>
                            </div>
                        </div>
                        <Link to="/pricing" className="nav-link" style={{ textDecoration: 'none', color: 'inherit' }}>Pricing</Link>
                        <Link to="/about" className="nav-link" style={{ textDecoration: 'none', color: 'inherit' }}>About Us</Link>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="hidden md:flex" style={{ gap: '12px', alignItems: 'center' }}>
                            <Link to="/auth/login" style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem', padding: '8px 12px' }}>Login</Link>
                            <Link to="/auth/register" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: '12px', whiteSpace: 'nowrap' }}>Start Selling</Link>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px' }} className="md:hidden">
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Drawer - Portal */}
            {createPortal(
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileMenuOpen(false)}
                                style={{ 
                                    position: 'fixed', 
                                    inset: 0, 
                                    background: 'rgba(15, 23, 42, 0.6)', 
                                    backdropFilter: 'blur(4px)',
                                    zIndex: 9998 
                                }}
                                className="md:hidden"
                            />
                            
                            {/* Side Drawer */}
                            <motion.div
                                initial={{ x: '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100%' }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                style={{ 
                                    position: 'fixed', 
                                    top: 0, 
                                    right: 0, 
                                    bottom: 0,
                                    width: '85%',
                                    maxWidth: '320px',
                                    background: 'white', 
                                    zIndex: 9999,
                                    overflowY: 'auto',
                                    boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
                                }}
                                className="md:hidden"
                            >
                                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                        <button 
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            style={{ 
                                                background: '#F1F5F9', border: 'none', borderRadius: '12px', 
                                                width: '40px', height: '40px', display: 'flex', alignItems: 'center', 
                                                justifyContent: 'center', color: '#64748B' 
                                            }}
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <Link to="/home" onClick={() => setIsMobileMenuOpen(false)} className="mobile-nav-item" style={{ padding: '16px', borderRadius: '16px', textDecoration: 'none', color: '#0F172A', fontWeight: 700, fontSize: '1.05rem', background: location.pathname === '/home' ? '#F8FAFC' : 'transparent' }}>
                                            Home
                                        </Link>
                                        
                                        {/* Products Accordion */}
                                        <div>
                                            <button onClick={() => toggleAccordion('products')} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: '#0F172A', fontWeight: 700, fontSize: '1.05rem', padding: '16px', cursor: 'pointer' }}>
                                                Products
                                                <ChevronDown size={18} style={{ transform: expandedMenu === 'products' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', color: '#475569' }} />
                                            </button>
                                            <AnimatePresence>
                                                {expandedMenu === 'products' && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '16px', paddingBottom: '8px' }}>
                                                            <Link to="/product/kreddy-ai" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '12px', textDecoration: 'none', color: '#1E293B', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1' }}></div> Kreddy AI Assistant
                                                            </Link>
                                                            <Link to="/product/merchant-dashboard" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '12px', textDecoration: 'none', color: '#1E293B', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1' }}></div> Merchant Dashboard
                                                            </Link>
                                                            <Link to="/product/premium-invoices" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '12px', textDecoration: 'none', color: '#1E293B', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1' }}></div> Premium Invoices
                                                            </Link>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Solutions Accordion */}
                                        <div>
                                            <button onClick={() => toggleAccordion('solutions')} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: '#0F172A', fontWeight: 700, fontSize: '1.05rem', padding: '16px', cursor: 'pointer' }}>
                                                Solutions
                                                <ChevronDown size={18} style={{ transform: expandedMenu === 'solutions' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s', color: '#475569' }} />
                                            </button>
                                            <AnimatePresence>
                                                {expandedMenu === 'solutions' && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '16px', paddingBottom: '8px' }}>
                                                            <Link to="/solution/solopreneurs" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '12px', textDecoration: 'none', color: '#1E293B', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1' }}></div> For Solopreneurs
                                                            </Link>
                                                            <Link to="/solution/retail" onClick={() => setIsMobileMenuOpen(false)} style={{ padding: '12px', textDecoration: 'none', color: '#1E293B', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#CBD5E1' }}></div> Retail & E-commerce
                                                            </Link>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} className="mobile-nav-item" style={{ padding: '16px', borderRadius: '16px', textDecoration: 'none', color: '#0F172A', fontWeight: 700, fontSize: '1.05rem', background: location.pathname === '/pricing' ? '#F8FAFC' : 'transparent' }}>
                                            Pricing
                                        </Link>
                                        <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="mobile-nav-item" style={{ padding: '16px', borderRadius: '16px', textDecoration: 'none', color: '#0F172A', fontWeight: 700, fontSize: '1.05rem', background: location.pathname === '/about' ? '#F8FAFC' : 'transparent' }}>
                                            About Us
                                        </Link>
                                    </div>

                                    <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <Link to="/auth/login" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '1rem' }}>Login</Link>
                                        <Link to="/auth/register" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '1rem', boxShadow: '0 10px 25px -5px var(--primary-glow)' }}>Start Selling Free</Link>
                                  
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
