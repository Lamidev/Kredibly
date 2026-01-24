import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicNavbar from '../../components/public/PublicNavbar';
import PublicFooter from '../../components/public/PublicFooter';
import { motion } from 'framer-motion';
import CountUp from '../../components/ui/CountUp';
import { User, Store, ShieldCheck, ArrowRight } from 'lucide-react';

const solutions = {
    'solopreneurs': {
        title: "For Solopreneurs",
        subtitle: "The Army of One",
        description: "You do everything yourself—marketing, sales, delivery. Kredibly acts as your finance manager so you can focus on the hustle.",
        icon: User,
        color: "#2563EB",
        bg: "rgba(37, 99, 235, 0.05)",
        statValue: 10,
        statSuffix: "+ Hours Saved/Week",
        points: [
            "Track debt without awkward conversations",
            "Send professional receipts in seconds",
            "Separate business cash from personal spending"
        ]
    },
    'retail': {
        title: "Retail & E-commerce",
        subtitle: "Scale Your Operations",
        description: "From a single Instagram shop to multiple physical locations. Kredibly helps you synchronize inventory and staff activity.",
        icon: Store,
        color: "#10B981",
        bg: "rgba(16, 185, 129, 0.05)",
        statValue: 3,
        statSuffix: "x Faster Reconciliation",
        points: [
            "Monitor staff sales in real-time",
            "Inventory tracking via WhatsApp",
            "Customer database retention"
        ]
    }
};

const SolutionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const solution = solutions[id];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (!solution) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>Solution not found</div>;

    const Icon = solution.icon;

    return (
        <div style={{ minHeight: '100vh', background: 'white' }}>
            <PublicNavbar />
            
            <section style={{ paddingTop: '160px', paddingBottom: '100px', background: '#0F172A', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div className="pattern-dots" style={{ opacity: 0.1 }} />
                <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '100px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '32px' }}>
                            <Icon size={16} />
                            {solution.title}
                        </div>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 950, marginBottom: '24px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                            {solution.subtitle}
                        </h1>
                        <p style={{ fontSize: '1.25rem', opacity: 0.8, lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 40px' }}>
                            {solution.description}
                        </p>
                        <button onClick={() => navigate('/auth/register')} className="btn-secondary" style={{ padding: '20px 48px', fontSize: '1.1rem', background: 'white', border: 'none', color: '#0F172A' }}>
                            Start Your Journey <ArrowRight size={20} />
                        </button>
                    </motion.div>
                </div>
            </section>

            <section style={{ padding: '100px 0' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '60px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {solution.points.map((point, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.2 }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                                >
                                    <div style={{ padding: '16px', borderRadius: '50%', background: solution.bg, color: solution.color }}>
                                        <ShieldCheck size={24} />
                                    </div>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{point}</p>
                                </motion.div>
                            ))}
                        </div>
                        
                        <div style={{ padding: '60px', borderRadius: '40px', background: solution.bg, textAlign: 'center', border: `1px solid ${solution.color}20` }}>
                            <h3 style={{ fontSize: '4rem', fontWeight: 950, color: solution.color, marginBottom: '16px', lineHeight: 1 }}>
                                <CountUp to={solution.statValue} />
                            </h3>
                            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginBottom: '16px' }}>
                                {solution.statSuffix}
                            </p>
                            <p style={{ opacity: 0.6, fontSize: '0.9rem', fontWeight: 500 }}>Average impact reported by Kredibly merchants in this sector.</p>
                        </div>
                    </div>
                </div>
            </section>

            <PublicFooter />
        </div>
    );
};

export default SolutionPage;
