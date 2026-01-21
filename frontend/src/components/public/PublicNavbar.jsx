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

    const scrollToSection = (sectionId) => {
        if (location.pathname !== '/') {
            navigate('/', { state: { scrollTo: sectionId } });
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState("", document.title, window.location.pathname);
            }
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <nav className="glass-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
            <div className="landing-nav-container" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Left Side: Logo */}
                <Link
                    to="/"
                    onClick={(e) => {
                        if (window.location.pathname === '/') {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            window.history.pushState("", document.title, window.location.pathname);
                        }
                    }}
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '32px', objectFit: 'contain' }} />
                </Link>

                {/* Center: Desktop Nav Links (Hidden on Mobile) */}
                <div className="hidden md:flex" style={{ gap: '32px', alignItems: 'center' }}>
                    {/* Products Dropdown */}
                    <div className="dropdown-parent">
                        <div className="nav-link">Product <ChevronDown size={14} /></div>
                        <div className="dropdown-menu">
                            <div className="dropdown-item">
                                <div className="dropdown-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}><Sparkles size={20} /></div>
                                <div className="dropdown-text">
                                    <h4>Kreddy AI Assistant</h4>
                                    <p>Smart chat for sales & support.</p>
                                </div>
                            </div>
                            <div className="dropdown-item">
                                <div className="dropdown-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}><LayoutDashboard size={20} /></div>
                                <div className="dropdown-text">
                                    <h4>Merchant Dashboard</h4>
                                    <p>Analytics, Inventory & Team Mode.</p>
                                </div>
                            </div>
                            <div className="dropdown-item">
                                <div className="dropdown-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><CreditCard size={20} /></div>
                                <div className="dropdown-text">
                                    <h4>Premium Invoices</h4>
                                    <p>First-grade startup invoice designs.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Solutions Dropdown */}
                    <div className="dropdown-parent">
                        <div className="nav-link">Solutions <ChevronDown size={14} /></div>
                        <div className="dropdown-menu">
                            <div className="dropdown-item">
                                <div className="dropdown-icon" style={{ background: '#F8FAFC', color: '#64748B' }}><User size={20} /></div>
                                <div className="dropdown-text">
                                    <h4>For Solopreneurs</h4>
                                    <p>Quick receipts and client tracking.</p>
                                </div>
                            </div>
                            <div className="dropdown-item">
                                <div className="dropdown-icon" style={{ background: '#F8FAFC', color: '#64748B' }}><Building2 size={20} /></div>
                                <div className="dropdown-text">
                                    <h4>Retail & E-commerce</h4>
                                    <p>Manage stock and offline sales.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => scrollToSection('how-it-works')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>How it Works</button>
                    <button onClick={() => scrollToSection('pricing')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Pricing</button>
                    <Link to="/about" className="nav-link" style={{ textDecoration: 'none', color: 'inherit' }}>About Us</Link>
                </div>

                {/* Right Side: Desktop buttons + Mobile Toggle */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="hidden md:flex" style={{ gap: '12px', alignItems: 'center' }}>
                        <Link to="/auth/login" style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem', padding: '8px 12px' }}>Login</Link>
                        <Link to="/auth/register" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem', borderRadius: '12px', whiteSpace: 'nowrap' }}>
                            Start Selling
                        </Link>
                    </div>

                    {/* Mobile Toggle - Right Aligned */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '4px' }}
                        className="md:hidden"
                    >
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
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Menu</div>
                            <button onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem', textAlign: 'left', cursor: 'pointer' }}>Features</button>
                            <button onClick={() => scrollToSection('how-it-works')} style={{ background: 'none', border: 'none', textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem', textAlign: 'left', cursor: 'pointer' }}>How it Works</button>
                            <button onClick={() => scrollToSection('pricing')} style={{ background: 'none', border: 'none', textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem', textAlign: 'left', cursor: 'pointer' }}>Pricing</button>
                            <Link to="/about" style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 700, fontSize: '1.1rem' }}>About Us</Link>
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
