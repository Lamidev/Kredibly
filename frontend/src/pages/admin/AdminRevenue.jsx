import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CreditCard, TrendingDown, TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';

const AdminRevenue = () => {
    const [payments, setPayments] = useState([]);
    const [healthStats, setHealthStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [paymentsRes, healthRes] = await Promise.all([
                axios.get(`${API_URL}/admin/payments`, { withCredentials: true }),
                axios.get(`${API_URL}/admin/stats/financial-health`, { withCredentials: true })
            ]);
            if (paymentsRes.data.success) setPayments(paymentsRes.data.data);
            if (healthRes.data.status === 'success') setHealthStats(healthRes.data);
        } catch (err) {
            toast.error("Failed to fetch revenue data.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '28px' }} />)}
            </div>
            <div className="skeleton" style={{ height: '400px', borderRadius: '32px' }} />
        </div>
    );

    const netMargin = (healthStats?.summary?.totalRevenue || 0) - (healthStats?.summary?.totalWhatsAppCost || 0);

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="admin-content-fade">
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <div className="admin-stats-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: '#F0F9FF', borderRadius: '16px', color: '#0EA5E9' }}>
                            <CreditCard size={24} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#0EA5E9', background: '#F0F9FF', padding: '4px 10px', borderRadius: '100px' }}>TOTAL CAP</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>Active Subscriptions</p>
                    <h3 style={{ fontSize: 'clamp(1.5rem, 8vw, 2.2rem)', fontWeight: 950, color: 'var(--text)', letterSpacing: '-0.04em' }}>{healthStats?.summary?.activeSubs || 0}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '0.75rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={14} /> Healthy Retention
                    </p>
                </div>

                <div className="admin-stats-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: '#FEF2F2', borderRadius: '16px', color: '#EF4444' }}>
                            <TrendingDown size={24} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#EF4444', background: '#FEF2F2', padding: '4px 10px', borderRadius: '100px' }}>BURN RATE</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>WhatsApp Infrastructure</p>
                    <h3 style={{ fontSize: 'clamp(1.5rem, 8vw, 2.2rem)', fontWeight: 950, color: '#EF4444', letterSpacing: '-0.04em' }}>₦{healthStats?.summary?.totalWhatsAppCost?.toLocaleString() || 0}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Meta Cloud API Costs</p>
                </div>

                <div className="admin-stats-card" style={{ background: '#0F172A', color: 'white', borderColor: '#1E293B' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', color: '#10B981' }}>
                            <DollarSign size={24} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>NET MARGIN</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>Platform Profitability</p>
                    <h3 style={{ fontSize: 'clamp(1.5rem, 8vw, 2.2rem)', fontWeight: 950, color: 'white', letterSpacing: '-0.04em' }}>₦{netMargin.toLocaleString() || 0}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '0.75rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ArrowUpRight size={14} /> Positively Scalable
                    </p>
                </div>
            </div>

             <div className="dashboard-glass" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '32px', overflow: 'hidden' }}>
                <div className="admin-card-padding" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <h3 style={{ fontWeight: 950, fontSize: '1.4rem', margin: 0 }}>Global Settlement Log</h3>
                    <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>Real-time verification of subscription events.</p>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: '800px', padding: '0 20px 20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>MERCHANT</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>PLAN & CYCLE</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>REFERENCE</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>AMOUNT</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>DATE</th>
                                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((p) => (
                                    <tr key={p._id} className="row-hover">
                                        <td style={{ padding: '16px', borderRadius: '20px 0 0 20px', border: '1px solid #F1F5F9', borderRight: 'none' }}>
                                            <p style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem' }}>{p.businessId?.displayName || 'Legacy Merchant'}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{p.businessId?._id ? `ID: ${p.businessId._id.toString().slice(-6).toUpperCase()}` : 'System Migration'}</p>
                                        </td>
                                        <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase' }}>{p.plan || 'OGA'}</p>
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{p.billingCycle || 'monthly'}</p>
                                        </td>
                                        <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>
                                            {p.reference || 'KRD-PAY-REF'}
                                        </td>
                                        <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', fontWeight: 950, color: 'var(--text)', fontSize: '1rem' }}>
                                            ₦{p.amount?.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>
                                            {new Date(p.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '16px', borderRadius: '0 20px 20px 0', border: '1px solid #F1F5F9', borderLeft: 'none', textAlign: 'right' }}>
                                            <span style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, background: '#ECFDF5', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminRevenue;
