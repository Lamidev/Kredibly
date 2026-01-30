import React, { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSales } from '../../context/SaleContext';
import { TrendingUp, Users, AlertCircle, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

const ReportsPage = () => {
    const { profile } = useAuth();
    const { sales, stats } = useSales();

    // 1. Calculate Top Customers
    const topCustomers = useMemo(() => {
        const customerMap = {};
        sales.forEach(sale => {
            const name = sale.customerName || 'Walk-in';
            if (!customerMap[name]) {
                customerMap[name] = { name, total: 0, count: 0, lastSeen: sale.createdAt };
            }
            customerMap[name].total += sale.totalAmount;
            customerMap[name].count += 1;
            if (new Date(sale.createdAt) > new Date(customerMap[name].lastSeen)) {
                customerMap[name].lastSeen = sale.createdAt;
            }
        });
        return Object.values(customerMap)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [sales]);

    // 2. Debtors Watchlist
    const debtors = useMemo(() => {
        return sales
            .filter(s => s.status !== 'paid')
            .map(s => ({
                ...s,
                balance: s.totalAmount - s.payments.reduce((acc, p) => acc + p.amount, 0)
            }))
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 5);
    }, [sales]);

    // 3. Handle Reminder Logic (Consistent with Invoice Page)
    const handleReminder = async (sale) => {
        try {
            await axios.post(`${API_URL}/sales/${sale._id}/remind`, {}, { withCredentials: true });
            
            // Construct the message
            const shareUrl = `${API_URL}/payments/share/${sale.invoiceNumber}`;
            const balance = sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0);
            const tone = profile?.assistantSettings?.reminderTemplate || 'friendly';
            let text = "";

            if (tone === 'formal') {
                text = `Dear ${sale.customerName || 'Customer'},\n\nThis is a formal payment notice from *${sale.businessId?.displayName || profile?.displayName}*.\n\nReference: Invoice #${sale.invoiceNumber}\nDescription: ${sale.description}\nOutstanding Balance: *₦${balance.toLocaleString()}*\n\nPlease arrange for settlement using this secure link: ${shareUrl}\n\nThank you.`;
            } else {
                text = `Hi ${sale.customerName || 'Friend'},\n\nThis is a friendly reminder from *${sale.businessId?.displayName || profile?.displayName}*.\n\nWe have an outstanding balance of *₦${balance.toLocaleString()}* for your recent purchase (${sale.description}).\n\nPlease check the invoice details here: ${shareUrl}\n\nThank you for your business!`;
            }

            if (sale.customerPhone) {
                window.open(`https://wa.me/${sale.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
                toast.success("Opening WhatsApp...");
            } else {
                navigator.clipboard.writeText(text);
                toast.success("Message Copied! Paste it anywhere to send.");
            }
        } catch (err) {
            toast.error("Failed to initiate reminder");
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                    <BarChart3 size={16} /> Business Intelligence
                </div>
                <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                    Performance Reports.
                </h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: '8px', fontSize: '0.95rem', maxWidth: '600px' }}>
                    Data-driven insights to help you identify VIP customers and recover debts faster.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                
                {/* VIP Customers */}
                <div className="dashboard-glass" style={{ padding: '32px', background: 'white', borderRadius: '32px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>VIP Customers</h3>
                        <div style={{ background: '#ECFDF5', color: '#059669', padding: '6px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>
                            TOP 5 BY REVENUE
                        </div>
                    </div>
                    
                    {topCustomers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>No data available yet.</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {topCustomers.map((c, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: i === 0 ? 'var(--primary)' : '#F1F5F9', color: i === 0 ? 'white' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 800, color: 'var(--text)', fontSize: '0.95rem' }}>{c.name}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.count} purchases</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontWeight: 900, color: 'var(--text)' }}>₦{c.total.toLocaleString()}</p>
                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>HIGH VALUE</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Debtors Watchlist */}
                <div className="dashboard-glass" style={{ padding: '32px', background: 'white', borderRadius: '32px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Recovery Watchlist</h3>
                         <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '6px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800 }}>
                            ACTION NEEDED
                        </div>
                    </div>

                    {debtors.length === 0 ? (
                         <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <div style={{ width: '48px', height: '48px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <CheckCircle2 size={24} color="#059669" />
                            </div>
                            <p style={{ fontWeight: 800, color: '#059669' }}>All clear!</p>
                            <p style={{ fontSize: '0.85rem', color: '#64748B' }}>No outstanding debts found.</p>
                         </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {debtors.map((d, i) => (
                                <div key={i} style={{ padding: '16px', borderRadius: '20px', background: '#FEF2F2', border: '1px solid #FEE2E2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 800, color: '#991B1B', fontSize: '0.9rem' }}>{d.customerName}</p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#B91C1C' }}>Owes: ₦{d.balance.toLocaleString()}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleReminder(d)}
                                        style={{ background: 'white', border: '1px solid #FECACA', color: '#DC2626', padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
                                        className="hover-scale"
                                    >
                                        Remind
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Monthly Trajectory */}
                <div className="dashboard-glass" style={{ padding: '32px', borderRadius: '32px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white', gridColumn: 'span 1' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '32px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                            <TrendingUp size={24} color="white" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '4px' }}>Sales Pulse</h3>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>Your revenue trajectory based on recent performance.</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '8px' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>₦{(stats?.revenue || 0).toLocaleString()}</h2>
                        <span style={{ color: '#4ade80', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}> <ArrowUpRight size={16} /> +12%</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Total revenue recorded this period.</p>
                </div>

            </div>
        </div>
    );
};

export default ReportsPage;
