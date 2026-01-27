import React, { useState } from "react";
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
        <nav className="glass-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
            {/* Same Desktop Nav Code... keeping it brief to focus on mobile menu below */}
            <div className="landing-nav-container" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to="/home" onClick={() => window.scrollTo(0, 0)} style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '40px', objectFit: 'contain', filter: 'contrast(1.15) brightness(1.02)' }} />
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

            {/* Mobile Menu Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ background: 'white', borderBottom: '1px solid #F1F5F9', overflow: 'hidden' }}
                        className="md:hidden"
                    >
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '80vh', overflowY: 'auto' }}>
                            <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu</div>
                            <Link to="/home" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem' }}>Home</Link>
                            
                            {/* Products Accordion */}
                            <div>
                                <button onClick={() => toggleAccordion('products')} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem', padding: '0 0 12px', cursor: 'pointer' }}>
                                    Products
                                    <ChevronDown size={16} style={{ transform: expandedMenu === 'products' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                                </button>
                                <AnimatePresence>
                                    {expandedMenu === 'products' && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '12px', paddingBottom: '12px', borderLeft: '2px solid #F1F5F9' }}>
                                                <Link to="/product/kreddy-ai" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#334155', fontWeight: 500 }}>Kreddy AI Assistant</Link>
                                                <Link to="/product/merchant-dashboard" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#334155', fontWeight: 500 }}>Merchant Dashboard</Link>
                                                <Link to="/product/premium-invoices" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#334155', fontWeight: 500 }}>Premium Invoices</Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Solutions Accordion */}
                            <div>
                                <button onClick={() => toggleAccordion('solutions')} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem', padding: '0 0 12px', cursor: 'pointer' }}>
                                    Solutions
                                    <ChevronDown size={16} style={{ transform: expandedMenu === 'solutions' ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
                                </button>
                                <AnimatePresence>
                                    {expandedMenu === 'solutions' && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '12px', paddingBottom: '12px', borderLeft: '2px solid #F1F5F9' }}>
                                                <Link to="/solution/solopreneurs" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#334155', fontWeight: 500 }}>For Solopreneurs</Link>
                                                <Link to="/solution/retail" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: '#334155', fontWeight: 500 }}>Retail & E-commerce</Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem' }}>Pricing</Link>
                            <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem' }}>About Us</Link>
                            <div style={{ height: '1px', background: '#F1F5F9', margin: '4px 0' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <Link to="/auth/login" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Login</Link>
                                <Link to="/auth/register" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Start Selling Free</Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default PublicNavbar;
