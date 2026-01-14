import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
    Zap,
    ArrowRight,
    MessageCircle,
    Sparkles,
    ShieldCheck,
    CheckCheck,
    LayoutDashboard,
    ChevronDown,
    Building2,
    Briefcase,
    User,
    Globe,
    CreditCard,
    Smartphone,
    Menu,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LandingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Helper to handle smooth scrolling and clean up URL hash
    const scrollToSection = (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            // Clean up the URL hash without a full page reload
            window.history.pushState("", document.title, window.location.pathname + window.location.search);
        }
        setIsMobileMenuOpen(false);
    };

    // Auto-scroll to top on mount if no hash exists
    useEffect(() => {
        if (!window.location.hash) {
            window.scrollTo(0, 0);
        }
    }, [location]);

    return (
        <div className="auth-pattern" style={{
            minHeight: '100vh',
            overflowX: 'hidden',
            color: 'var(--text)',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            position: 'relative'
        }}>
            {/* Background Layer */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 53, 0.03) 0%, transparent 50%)',
                zIndex: 0,
                pointerEvents: 'none'
            }}></div>

            {/* Navigation */}
            <nav className="glass-nav" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000 }}>
                <div className="landing-nav-container" style={{ height: '80px' }}>
                    <div className="nav-group">
                        <Link
                            to="/"
                            onClick={(e) => {
                                // If already on home, scroll to top and clear hash
                                if (window.location.pathname === '/') {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                    window.history.pushState("", document.title, window.location.pathname);
                                }
                            }}
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '36px', objectFit: 'contain' }} />
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex" style={{ gap: '32px' }}>
                            {/* Products Dropdown */}
                            <div className="dropdown-parent">
                                <div className="nav-link">Product <ChevronDown size={14} /></div>
                                <div className="dropdown-menu">
                                    <div className="dropdown-item">
                                        <div className="dropdown-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}><Smartphone size={20} /></div>
                                        <div className="dropdown-text">
                                            <h4>Kreddy (WhatsApp Assistant)</h4>
                                            <p>Record sales instantly via chat.</p>
                                        </div>
                                    </div>
                                    <div className="dropdown-item">
                                        <div className="dropdown-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}><LayoutDashboard size={20} /></div>
                                        <div className="dropdown-text">
                                            <h4>Merchant Dashboard</h4>
                                            <p>Deep analytics and inventory.</p>
                                        </div>
                                    </div>
                                    <div className="dropdown-item">
                                        <div className="dropdown-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><ShieldCheck size={20} /></div>
                                        <div className="dropdown-text">
                                            <h4>Verifiable Ledger</h4>
                                            <p>Proof of payment you can trust.</p>
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
                                            <h4>For Freelancers</h4>
                                            <p>Manage projects and quick receipts.</p>
                                        </div>
                                    </div>
                                    <div className="dropdown-item">
                                        <div className="dropdown-icon" style={{ background: '#F8FAFC', color: '#64748B' }}><Building2 size={20} /></div>
                                        <div className="dropdown-text">
                                            <h4>For Retail Shops</h4>
                                            <p>Track daily physical inventory.</p>
                                        </div>
                                    </div>
                                    <div className="dropdown-item">
                                        <div className="dropdown-icon" style={{ background: '#F8FAFC', color: '#64748B' }}><Globe size={20} /></div>
                                        <div className="dropdown-text">
                                            <h4>Digital Agencies</h4>
                                            <p>Client billing and trust scores.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => scrollToSection('how-it-works')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>How it Works</button>
                            <button onClick={() => scrollToSection('pricing')} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Pricing</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="hidden md:flex" style={{ gap: '12px', alignItems: 'center' }}>
                            <Link to="/auth/login" style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem', padding: '8px 12px' }}>Login</Link>
                            <Link to="/auth/register" className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.85rem', borderRadius: '12px' }}>
                                Start Selling Free
                            </Link>
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', padding: '8px' }}
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

            {/* Hero Section */}
            <header style={{
                padding: '120px 16px 40px',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="hero-badge" style={{ padding: '8px 20px', fontSize: '0.8rem', marginBottom: '32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} style={{ color: 'var(--primary)' }} /> The Smart Money Manager for Everyone
                    </div>

                    <h1 className="hero-title" style={{ fontWeight: 800 }}>
                        Sell with <span className="premium-gradient">Kredibly.</span><br />
                        Scale with <span style={{ fontWeight: 900 }}>Confidence.</span>
                    </h1>

                    <p className="hero-description" style={{ fontWeight: 500 }}>
                        Professional record keeping for freelancers, sellers, and business owners. Record sales on WhatsApp,
                        manage from your Dashboard, and grow with verified digital records.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '16px 36px', fontSize: '1.1rem' }}>
                            Start Selling Free <ArrowRight size={20} />
                        </button>
                    </div>
                </motion.div>
            </header>

            {/* Power Grid Section */}
            <section id="features" style={{ padding: '60px 0', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                    <div className="features-grid">
                        {[
                            { icon: MessageCircle, color: 'var(--primary)', title: 'Kreddy (AI Partner)', desc: 'Text our assistant to log sales & expenses. No apps needed when you\'re on the move.' },
                            { icon: LayoutDashboard, color: '#4F46E5', title: 'Power Dashboard', desc: 'A deep cockpit to manage inventory, analyze revenue, and track business health.' },
                            { icon: ShieldCheck, color: '#10B981', title: 'Verified Receipts', desc: 'Build instant trust with professional links sent to every customer via text or chat.' }
                        ].map((feature, i) => (
                            <motion.div key={i} whileHover={{ y: -5 }} className="glass-card" style={{ padding: '32px', background: 'white' }}>
                                <div style={{ background: i === 0 ? 'var(--primary-glow)' : i === 1 ? 'rgba(79, 70, 229, 0.1)' : 'rgba(16, 185, 129, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                    <feature.icon color={feature.color} size={24} />
                                </div>
                                <h3 style={{ marginBottom: '12px', fontWeight: 800, fontSize: '1.25rem' }}>{feature.title}</h3>
                                <p style={{ color: '#4B5563', lineHeight: 1.6, fontSize: '0.95rem', fontWeight: 500 }}>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Detailed Dual Management Section */}
            <section id="how-it-works" style={{ padding: '80px 20px', position: 'relative', zIndex: 1, background: '#F8FAFC' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                        <h2 className="section-title">One Business. Two Ways to Manage.</h2>
                        <p style={{ color: '#6B7280', fontSize: '1.1rem', fontWeight: 500 }}>Seamlessly switch between our Dashboard and WhatsApp Assistant.</p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '40px'
                    }}>
                        {/* WhatsApp Detailed Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #E5E7EB', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(37, 211, 102, 0.1)' }}>
                                    <MessageCircle color="#25D366" size={28} />
                                </div>
                                <h3 style={{ fontWeight: 800, fontSize: '1.5rem' }}>On the Go?</h3>
                            </div>

                            <div style={{
                                background: '#ECE5DD', // WhatsApp Background
                                borderRadius: '20px',
                                padding: '16px',
                                height: '320px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                marginBottom: '24px',
                                overflow: 'hidden',
                                border: '4px solid #333'
                            }}>
                                <div style={{ alignSelf: 'flex-end', maxWidth: '90%', background: '#DCF8C6', padding: '10px', borderRadius: '10px 0 10px 10px', fontSize: '0.8rem', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                                    <p style={{ color: '#111' }}>
                                        I just sold a Professional Camera to David Adeleke for 300,000 and he paid 100,000 by transfer. He promised to pay the rest next week Friday.
                                    </p>
                                    <p style={{ textAlign: 'right', fontSize: '0.6rem', color: '#666', marginTop: '4px' }}>14:08 <CheckCheck size={10} color="#34B7F1" /></p>
                                </div>
                                <div style={{ alignSelf: 'flex-start', maxWidth: '90%', background: 'white', padding: '10px', borderRadius: '0 10px 10px 10px', fontSize: '0.8rem', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' }}>
                                    <p style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '4px', fontSize: '0.75rem' }}>Kreddy</p>
                                    <p style={{ color: '#111' }}>
                                        ✅ *Logged!* Record for David Adeleke is saved.<br /><br />
                                        💰 *Balance:* ₦200,000<br />
                                        🗓️ *Reminder:* Set for next week Friday.
                                    </p>
                                </div>
                            </div>
                            <p style={{ fontSize: '1rem', color: '#4B5563', lineHeight: 1.6, fontWeight: 500 }}>
                                Professional logging using Natural Language Processing. Just talk, Kredibly records.
                            </p>
                        </motion.div>

                        {/* Dashboard Detailed Card */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            style={{ background: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #E5E7EB', boxShadow: '0 20px 40px rgba(0,0,0,0.03)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                                <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--primary-glow)' }}>
                                    <LayoutDashboard color="var(--primary)" size={28} />
                                </div>
                                <h3 style={{ fontWeight: 800, fontSize: '1.5rem' }}>In the Office?</h3>
                            </div>

                            <div style={{
                                width: '100%',
                                height: '320px',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                border: '1px solid #E2E8F0',
                                marginBottom: '24px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                            }}>
                                <img
                                    src="/dashboard_naira.png"
                                    alt="Kredibly Dashboard"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <p style={{ fontSize: '1rem', color: '#4B5563', lineHeight: 1.6, fontWeight: 500 }}>
                                Deep insights, inventory management, and financial reporting at your fingertips.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" style={{ padding: '100px 20px', background: 'white', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                        <h2 className="section-title">Transparent Pricing</h2>
                        <p style={{ color: '#6B7280', fontSize: '1.1rem', fontWeight: 500 }}>Start for free and scale as you grow.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', maxWidth: '900px', margin: '0 auto' }}>
                        {/* Free Plan */}
                        <div className="glass-card" style={{ padding: '40px', border: '1.5px solid #E5E7EB', borderRadius: '32px', position: 'relative' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Free Forever</h3>
                                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Perfect for individuals and solo sellers.</p>
                            </div>
                            <div style={{ marginBottom: '32px' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 900 }}>₦0</span>
                                <span style={{ color: '#6B7280' }}>/mo</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    "Unlimited Sales Records",
                                    "Kreddy (WhatsApp Assistant)",
                                    "Professional Digital Invoices",
                                    "Verifiable Trust Score",
                                    "Basic Dashboard Access"
                                ].map((feature, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>
                                        <CheckCheck size={18} color="#10B981" /> {feature}
                                    </li>
                                ))}
                            </ul>
                            <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ width: '100%', padding: '14px', borderRadius: '14px' }}>Get Started</button>
                        </div>

                        {/* Pro Plan - Coming Soon */}
                        <div className="glass-card" style={{ padding: '40px', border: '2px solid var(--primary)', borderRadius: '32px', position: 'relative', background: 'linear-gradient(to bottom, #FAFBFF, white)' }}>
                            <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>COMING SOON</div>
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Kredibly Growth</h3>
                                <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>For growing teams and registered shops.</p>
                            </div>
                            <div style={{ marginBottom: '32px' }}>
                                <span style={{ fontSize: '3rem', fontWeight: 900 }}>₦--</span>
                                <span style={{ color: '#6B7280' }}>/mo</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    "Everything in Free",
                                    "Inventory Management",
                                    "Multi-user Staff Access",
                                    "Advanced Business Insights",
                                    "Priority WhatsApp Support"
                                ].map((feature, i) => (
                                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>
                                        <CheckCheck size={18} color="var(--primary)" /> {feature}
                                    </li>
                                ))}
                            </ul>
                            <button disabled className="btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '14px', opacity: 0.6, cursor: 'not-allowed' }}>Waitlist Joining...</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" style={{ padding: '80px 20px', background: '#F8FAFC', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                        <h2 className="section-title">Common Questions</h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px' }}>
                        {[
                            { q: "Is Kredibly really free?", a: "Yes! Our core features—WhatsApp recording, our basic dashboard, and digital receipts—are completely free for individual sellers and freelancers." },
                            { q: "Do my customers need to sign up?", a: "No. Your customers simply receive a secure web link via WhatsApp or SMS. They can view, download, and confirm receipts without creating an account." },
                            { q: "Does Kredibly support voice notes?", a: "Voice recording is coming soon! 🎙️ In this current phase, you can record sales by texting Kreddy. Voice notes are a high-priority feature for our next update." },
                            { q: "What is a Verifiable Trust Score?", a: "It's a digital reputation based on your actual transaction history. As customers confirm your services/products, your score grows, making it easier to secure loans or partnerships." },
                            { q: "Is my data secure?", a: "Extremely. We use industry-standard encryption to protect your records. Your business data is private and only accessible to you." },
                            { q: "Can I use it for multiple businesses?", a: "Yes! You can manage multiple business identities and bank details under your single Kredibly account." }
                        ].map((faq, idx) => (
                            <div key={idx} className="glass-card" style={{ padding: '24px', background: 'white', borderRadius: '20px', border: '1px solid #F1F5F9' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text)' }}>
                                    <div style={{ minWidth: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                                    {faq.q}
                                </h4>
                                <p style={{ color: '#64748B', lineHeight: 1.5, fontSize: '0.9rem', fontWeight: 500 }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Marquee Reviews Section */}
            <section id="reviews" style={{ padding: '40px 0', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC', overflow: 'hidden' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trusted by Modern Hustlers</h3>
                </div>

                <div className="marquee-container" style={{ display: 'flex', overflow: 'hidden', width: '100%', position: 'relative' }}>
                    <div className="marquee-track" style={{ display: 'flex', gap: '24px' }}>
                        {[...Array(2)].map((_, i) => (
                            <div key={i} style={{ display: 'flex', gap: '24px' }}>
                                {[
                                    { name: "Sola Gadgets", text: "Kredibly makes my business look so professional. Clients trust me more." },
                                    { name: "Sarah G.", text: "I use this to track my freelance design gigs. The WhatsApp logging is a lifesaver." },
                                    { name: "Mama Tee Food", text: "I can track who owes me money instantly. Best tool for vendors." },
                                    { name: "David (Architect)", text: "Creating invoices used to take 10 mins. Now I just text the bot." },
                                    { name: "Glamour Hair", text: "My customers love receiving the digital receipt on WhatsApp." }
                                ].map((review, idx) => (
                                    <div key={idx} className="glass-card" style={{ minWidth: '280px', padding: '24px', background: 'white', borderRadius: '20px' }}>
                                        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                                            {[...Array(5)].map((_, star) => (
                                                <div key={star} style={{ color: '#F59E0B' }}>★</div>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '16px', fontStyle: 'italic', fontWeight: 500 }}>
                                            "{review.text}"
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                                                {review.name.charAt(0)}
                                            </div>
                                            <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>{review.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '100px 20px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    maxWidth: '1000px', margin: '0 auto', background: 'linear-gradient(135deg, var(--primary), #1E1B4B)',
                    padding: '80px 40px', borderRadius: '40px', color: 'white', textAlign: 'center',
                    boxShadow: '0 20px 40px rgba(76, 29, 149, 0.2)', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ marginBottom: '48px' }}>
                        <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, marginBottom: '24px' }}>Professionalize Your Hustle</h2>
                        <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>Join the next generation of Africans using Kredibly to build lasting financial credibility.</p>
                    </div>
                    {/* Using btn-secondary for white background and dark text */}
                    <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ padding: '20px 50px', borderRadius: '16px', fontSize: '1.2rem' }}>
                        Start Your Free Trial
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '40px 20px', textAlign: 'center', color: '#6B7280', background: 'white', borderTop: '1px solid #E5E7EB' }}>
                <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '32px', marginBottom: '16px' }} />
                <p style={{ fontWeight: 600, maxWidth: '600px', margin: '0 auto', lineHeight: 1.5, fontSize: '0.9rem' }}>
                    © 2026 Kredibly. Empowering African Commerce.
                </p>
            </footer>

            <style>{`
                @media (max-width: 768px) {
                    .hero-title { font-size: 2.8rem !important; }
                    .features-grid { grid-template-columns: 1fr !important; }
                    .features-grid .glass-card { padding: 24px !important; }
                }
            `}</style>
        </div>
    );
};

export default LandingPage;