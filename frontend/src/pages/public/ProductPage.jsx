import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import { Sparkles, LayoutDashboard, CreditCard, CheckCircle2, ArrowRight } from 'lucide-react';

const products = {
    'kreddy-ai': {
        title: "Kreddy AI Assistant",
        subtitle: "Your 24/7 Business Partner",
        description: "Talk to Kreddy just like a human. Record sales, track debts, and manage inventory without ever leaving WhatsApp.",
        icon: Sparkles,
        color: "var(--primary)",
        bg: "rgba(76, 29, 149, 0.05)",
        features: [
            "Natural Language Processing",
            "Instant Sale Recording",
            "Automated Debtor Reminders",
            "Multi-staff Support"
        ]
    },
    'merchant-dashboard': {
        title: "Merchant Dashboard",
        subtitle: "The Command Center",
        description: "A powerful desktop and mobile view of your entire business operation. See trends, manage staff, and export reports.",
        icon: LayoutDashboard,
        color: "#4F46E5",
        bg: "rgba(79, 70, 229, 0.05)",
        features: [
            "Real-time Analytics",
            "Staff Activity Logs",
            "Inventory Management",
            "Financial Reports"
        ]
    },
    'premium-invoices': {
        title: "Premium Invoices",
        subtitle: "Look Global, Sell Local",
        description: "Generate world-class digital invoices that build trust. Customizable, verifiable, and designed to get you paid faster.",
        icon: CreditCard,
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.05)",
        features: [
            "Custom Logo Branding",
            "Payment Links Integration",
            "PDF Export & Sharing",
            "Automated Receipts"
        ]
    }
};

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = products[id];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!product) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>Product not found</div>;

    const Icon = product.icon;

    return (
        <div style={{ minHeight: '100vh', background: 'white' }}>
            <PublicNavbar />
            
            <section style={{ paddingTop: '160px', paddingBottom: '80px', position: 'relative', overflow: 'hidden' }}>
                <div className="pattern-dots" />
                <div className="container" style={{ position: 'relative', zIndex: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '60px', alignItems: 'center' }}>
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', background: product.bg, color: product.color, fontWeight: 800, fontSize: '0.9rem', marginBottom: '32px' }}>
                            <Icon size={16} />
                            {product.title}
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, color: 'var(--text)', marginBottom: '24px', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                            {product.subtitle}
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '40px', lineHeight: 1.6, maxWidth: '600px' }}>
                            {product.description}
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '20px 48px', fontSize: '1.1rem' }}>
                                Get Started Free <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ position: 'relative' }}
                    >
                        <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '48px', background: product.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: `1px solid ${product.color}20` }}>
                            {/* Abstract Visual Representation */}
                            <Icon size={250} color={product.color} style={{ opacity: 0.1 }} />
                        </div>
                    </motion.div>
                </div>
            </section>

            <section style={{ padding: '100px 0', background: 'var(--background)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        {product.features.map((feature, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card"
                                style={{ padding: '32px', display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'white' }}
                            >
                                <div style={{ padding: '12px', borderRadius: '12px', background: product.bg, color: product.color }}>
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>{feature}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>Built to help you scale faster and manage your business with less stress.</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default ProductPage;
