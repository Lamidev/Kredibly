import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import { Sparkles, LayoutDashboard, CreditCard, CheckCircle2, ArrowRight, Mic, Wallet, BadgeCheck } from 'lucide-react';

const products = {
    'kreddy-ai': {
        title: "Kreddy AI Assistant",
        subtitle: "Your AI Business Assistant",
        description: "Talk to Kreddy on WhatsApp using voice notes or messages. She automatically records your sales, delivers PDF invoices, schedules customer follow-ups, and manages payment extensions.",
        icon: Sparkles,
        color: "var(--primary)",
        bg: "rgba(76, 29, 149, 0.05)",
        features: [
            "Voice-to-Record Intelligence",
            "Direct Invoicing & Delivery on WhatsApp",
            "Automated Extensions & Reminders",
            "Auto-Reconciliation & Ledger Sync"
        ]
    },
    'merchant-dashboard': {
        title: "Merchant Dashboard",
        subtitle: "The Business Command Center",
        description: "A powerful real-time view of your entire business. Monitor staff, track inventory, and get deep insights into your cashflow.",
        icon: LayoutDashboard,
        color: "#4F46E5",
        bg: "rgba(79, 70, 229, 0.05)",
        features: [
            "Remote Staff Monitoring",
            "Instant Cashflow Insights",
            "Inventory & Stock Management",
            "Identity Guard (BVN Match Security)"
        ]
    },
    'premium-invoices': {
        title: "Premium Invoices",
        subtitle: "Instant Bank Settlements",
        description: "Stop waiting 24 hours for your money. Invoices are delivered with secure payment buttons that settle payments directly to your bank account instantly.",
        icon: CreditCard,
        color: "#F59E0B",
        bg: "rgba(245, 158, 11, 0.05)",
        features: [
            "Instant Bank settlements",
            "Zero Payout Transfer Fees",
            "Interactive Pay Now Buttons",
            "Verified Ledger Security Seal"
        ]
    }
};

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = products[id];

    useEffect(() => {
        window.scrollTo(0, 0);
        if (product) {
            document.title = `${product.title} | Kredibly`;
        }
    }, [id, product]);

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
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <button onClick={() => navigate('/auth/register')} className="btn-primary" style={{ padding: '20px 48px', fontSize: '1.1rem' }}>
                                Try for Free <ArrowRight size={20} />
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: 800, fontSize: '0.9rem' }}>
                                <BadgeCheck size={18} /> Zero Bank Charges
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section style={{ padding: '100px 0', background: '#F8FAFC' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        {product.features.map((feature, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                style={{ padding: '32px', display: 'flex', alignItems: 'flex-start', gap: '16px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                            >
                                <div style={{ padding: '12px', borderRadius: '12px', background: product.bg, color: product.color }}>
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>{feature}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>Optimized for the Nigerian market to ensure you get paid faster and stay secure.</p>
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
