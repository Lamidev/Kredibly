import { useNavigate, Link } from "react-router-dom";
import {
    Zap,
    ArrowRight,
    Smartphone,
    MessageCircle,
    Sparkles,
    ChevronRight,
    Play,
    ShieldCheck,
    TrendingUp
} from "lucide-react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

const LandingPage = () => {
    const navigate = useNavigate();

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
                <div className="landing-nav-container" style={{ height: '80px', padding: '0 16px' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                        <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '36px', objectFit: 'contain' }} />
                    </Link>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Link to="/auth/login" style={{ textDecoration: 'none', color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem' }}>Login</Link>
                        <Link to="/auth/register" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '10px' }}>
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header style={{
                padding: '140px 16px 60px',
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
                    <div className="hero-badge" style={{ padding: '8px 16px', fontSize: '0.75rem', marginBottom: '32px' }}>
                        <Sparkles size={14} fill="var(--primary)" /> Professional Sales for Africa
                    </div>

                    <h1 className="hero-title">
                        Sell with <span style={{ fontWeight: 800 }}>Kredibly.</span><br />
                        Build with <span className="premium-gradient" style={{ fontWeight: 800 }}>Credibility.</span>
                    </h1>

                    <p className="hero-description">
                        The simplest way for modern sellers to generate instant invoices,
                        track client balances, and grow their reputation with verified digital records.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 700 }}>
                            Get Started Free <ArrowRight size={18} />
                        </button>
                        <button style={{ padding: '14px 28px', fontSize: '1rem', background: 'white', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Play size={18} fill="#374151" /> Watch Demo
                        </button>
                    </div>
                </motion.div>
            </header>

            {/* Features Section */}
            <section style={{ padding: '60px 0', position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.4)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h2 className="section-title">Why Smart Sellers Use Kredibly</h2>
                        <p style={{ color: '#6B7280', fontSize: '1rem', fontWeight: 500 }}>The essential toolkit for modern commerce.</p>
                    </div>

                    <div className="features-grid">
                        {[
                            { icon: MessageCircle, color: 'var(--primary)', title: 'WhatsApp Integrated', desc: 'Send professional invoices directly to your clients where they already chat.' },
                            { icon: ShieldCheck, color: '#10B981', title: 'Verified Records', desc: 'Secure digital trail for every transaction. No more "I didn\'t receive it" disputes.' },
                            { icon: TrendingUp, color: '#F59E0B', title: 'Growth Tracking', desc: 'Monitor outstanding balances and revenue trends in real-time from your phone.' }
                        ].map((feature, i) => (
                            <motion.div key={i} whileHover={{ y: -5 }} className="glass-card" style={{ padding: '24px', background: 'white' }}>
                                <div style={{ background: i === 0 ? 'var(--primary-glow)' : i === 1 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <feature.icon color={feature.color} size={24} />
                                </div>
                                <h3 style={{ marginBottom: '10px', fontWeight: 800, fontSize: '1.2rem' }}>{feature.title}</h3>
                                <p style={{ color: '#4B5563', lineHeight: 1.5, fontSize: '0.9rem', fontWeight: 500 }}>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mobile Preview Section */}
            <section style={{ padding: '80px 20px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '12px', background: 'var(--primary-glow)', marginBottom: '20px' }}>
                        <Smartphone size={20} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h2 className="section-title">Built for Credibility</h2>
                    <p style={{ color: '#4B5563', fontSize: '1rem', fontWeight: 500, lineHeight: 1.6, marginBottom: '40px' }}>
                        Speed is your superpower. Manage your entire business records in under 30 seconds.
                    </p>

                    <div style={{
                        width: '100%', maxWidth: '280px', margin: '0 auto', height: '540px',
                        position: 'relative', border: '10px solid #111', borderRadius: '40px',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.12)', background: 'white', overflow: 'hidden'
                    }}>
                        <div style={{ background: 'var(--primary)', height: '140px', padding: '32px 20px', textAlign: 'left', color: 'white' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2px' }}>My Store</h4>
                            <p style={{ fontSize: '0.75rem', opacity: 0.8, marginBottom: '8px' }}>Active Balance</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>₦142,500.00</p>
                        </div>
                        <div style={{ padding: '20px', textAlign: 'left' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1F2937', marginBottom: '12px' }}>Recent Sales</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '12px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Zap size={14} color="var(--primary)" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>Sales #{i}04</p>
                                                <p style={{ fontSize: '0.65rem', color: '#6B7280' }}>2 mins ago</p>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 800 }}>₦12,000</p>
                                    </div>
                                ))}
                            </div>
                            <button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '0.9rem', borderRadius: '12px', marginTop: '24px', fontWeight: 700 }}>
                                + Create New Invoice
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marquee Reviews Section */}
            <section style={{ padding: '40px 0', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB', background: '#F8FAFC', overflow: 'hidden' }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trusted by Modern Vendors</h3>
                </div>

                <div className="marquee-container" style={{ display: 'flex', overflow: 'hidden', width: '100%', position: 'relative' }}>
                    <div
                        className="marquee-track"
                        style={{ display: 'flex', gap: '24px' }}
                    >
                        {/* Duplicated list for seamless loop */}
                        {[...Array(2)].map((_, i) => (
                            <div key={i} style={{ display: 'flex', gap: '24px' }}>
                                {[
                                    { name: "Sola Gadgets", text: "Kredibly makes my business look so professional. Clients trust me more." },
                                    { name: "Lagos Wears", text: "No more arguing about payments. The receipt link settles everything." },
                                    { name: "Mama Tee Food", text: "I can track who owes me money instantly. Best tool for vendors." },
                                    { name: "TechHub Ikeja", text: "Creating invoices used to take 10 mins. Now it takes 15 seconds." },
                                    { name: "Glamour Hair", text: "My customers love receiving the digital receipt on WhatsApp." }
                                ].map((review, idx) => (
                                    <div
                                        key={idx}
                                        className="glass-card"
                                        style={{
                                            minWidth: '280px',
                                            padding: '20px',
                                            background: 'white',
                                            borderRadius: '16px',
                                            cursor: 'default'
                                        }}
                                    >
                                        <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                                            {[...Array(5)].map((_, star) => (
                                                <div key={star} style={{ color: '#F59E0B' }}>★</div>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.5, marginBottom: '16px', fontStyle: 'italic' }}>
                                            "{review.text}"
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                                                {review.name.charAt(0)}
                                            </div>
                                            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{review.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section style={{ padding: '60px 20px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    maxWidth: '1000px', margin: '0 auto', background: 'linear-gradient(135deg, var(--primary), #1E1B4B)',
                    padding: '40px 20px', borderRadius: '24px', color: 'white', textAlign: 'center',
                    boxShadow: '0 20px 40px rgba(76, 29, 149, 0.2)', position: 'relative', overflow: 'hidden'
                }}>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '16px' }}>Join the Future of African Commerce</h2>
                    <p style={{ fontSize: '1rem', opacity: 0.9, marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>Get started today and professionalize your business in minutes.</p>
                    <button onClick={() => navigate('/auth/register')} style={{ background: 'white', color: 'var(--primary)', padding: '16px 32px', borderRadius: '12px', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
                        Build Your Free Profile
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '40px 20px', textAlign: 'center', color: '#6B7280', background: 'white', borderTop: '1px solid #E5E7EB' }}>
                <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '28px', marginBottom: '16px' }} />
                <p style={{ fontWeight: 500, maxWidth: '600px', margin: '0 auto', lineHeight: 1.5, fontSize: '0.85rem' }}>
                    © 2026 Kredibly. Empowering the next generation of African entrepreneurs with digital clarity.
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;