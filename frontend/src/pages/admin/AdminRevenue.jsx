// KREDY-ADMIN-REVENUE-V4 (BRAND ALIGNMENT)
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { CreditCard, TrendingUp, DollarSign, Activity, Receipt, Briefcase, Trash2, ShieldAlert, CheckCircle2, ShoppingBag } from 'lucide-react';

const AdminRevenue = () => {
    const [payments, setPayments] = useState([]);
    const [invoicePayments, setInvoicePayments] = useState([]);
    const [healthStats, setHealthStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' or 'invoices'
    
    // Delete Confirmation UI State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { id: string, type: 'subscription' | 'invoice', saleId?: string }

    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [paymentsRes, invoiceRes, healthRes] = await Promise.all([
                axios.get(`${API_URL}/admin/payments`, { withCredentials: true }),
                axios.get(`${API_URL}/admin/invoice-payments`, { withCredentials: true }),
                axios.get(`${API_URL}/admin/stats/financial-health`, { withCredentials: true })
            ]);
            if (paymentsRes.data.success) setPayments(paymentsRes.data.data);
            if (invoiceRes.data.success) setInvoicePayments(invoiceRes.data.data);
            if (healthRes.data.status === 'success') setHealthStats(healthRes.data);
        } catch (err) {
            toast.error("Security sync failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id, type, saleId = null) => {
        setItemToDelete({ id, type, saleId });
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        
        // Optimistic UI Update
        if (itemToDelete.type === 'subscription') {
            setPayments(prev => prev.filter(p => p._id !== itemToDelete.id));
        } else {
            setInvoicePayments(prev => prev.filter(p => p._id !== itemToDelete.id));
        }

        try {
            let res;
            if (itemToDelete.type === 'subscription') {
                res = await axios.delete(`${API_URL}/admin/payments/${itemToDelete.id}`, { withCredentials: true });
            } else {
                res = await axios.delete(`${API_URL}/admin/invoice-payments/${itemToDelete.saleId}/${itemToDelete.id}`, { withCredentials: true });
            }

            if (res.data.success) {
                toast.success("Legacy record removed.");
                // Re-fetch to ensure sync with server totals
                fetchData();
            } else {
                // Rollback on failure
                fetchData();
            }
        } catch (err) {
            toast.error("Operation failed.");
            fetchData();
        } finally {
            setShowDeleteConfirm(false);
            setItemToDelete(null);
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

    const totalRecordedVolume = invoicePayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const verifiedMethods = ['Nomba', 'Paystack', 'Squad', 'Kredibly Online'];
    const totalVerifiedVolume = invoicePayments
        .filter(p => verifiedMethods.includes(p.method))
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalSubs = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return (
        <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="admin-content-fade">
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                
                {/* Platform GTV Card */}
                <div className="admin-stats-card" style={{ border: '1px solid #4C1D95', background: 'rgba(76, 29, 149, 0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(76, 29, 149, 0.1)', borderRadius: '16px', color: '#4C1D95' }}>
                            <Activity size={24} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#4C1D95', background: 'rgba(76, 29, 149, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>PLATFORM GTV</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>Verified Cash Flow</p>
                    <h3 style={{ fontSize: 'clamp(1.5rem, 8vw, 2.2rem)', fontWeight: 950, color: 'var(--text)', letterSpacing: '-0.04em' }}>₦{totalVerifiedVolume.toLocaleString()}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '0.75rem', fontWeight: 700, color: '#4C1D95', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <TrendingUp size={14} /> ₦{totalRecordedVolume.toLocaleString()} Total Recorded
                    </p>
                </div>

                <div className="admin-stats-card" style={{ border: '1px solid #0EA5E9', background: 'rgba(14, 165, 233, 0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '16px', color: '#0EA5E9' }}>
                            <CreditCard size={24} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#0EA5E9', background: 'rgba(14, 165, 233, 0.1)', padding: '4px 10px', borderRadius: '100px' }}>VERIFIED REVENUE</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>Kredibly Subscriptions</p>
                    <h3 style={{ fontSize: 'clamp(1.5rem, 8vw, 2.2rem)', fontWeight: 950, color: 'var(--text)', letterSpacing: '-0.04em' }}>₦{totalSubs.toLocaleString() || 0}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '0.75rem', fontWeight: 700, color: '#0EA5E9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                         <TrendingUp size={14} /> Actual Cash Flow
                    </p>
                </div>

                <div className="admin-stats-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ padding: '12px', background: '#F5F3FF', borderRadius: '16px', color: '#8B5CF6' }}>
                            <ShoppingBag size={24} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#8B5CF6', background: '#F5F3FF', padding: '4px 10px', borderRadius: '100px' }}>SUCCESS RATE</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '4px' }}>Verified Transactions</p>
                    <h3 style={{ fontSize: 'clamp(1.5rem, 8vw, 2.2rem)', fontWeight: 950, color: '#8B5CF6', letterSpacing: '-0.04em' }}>{payments.length + invoicePayments.length}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Successful Sales & Subs</p>
                </div>
            </div>

            {/* TAB SELECTOR (BRAND PURPLE) - Mobile Responsive Wrap */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => setActiveTab('subscriptions')}
                    style={{ 
                        padding: '14px 28px', borderRadius: '100px', cursor: 'pointer', border: '1px solid',
                        background: activeTab === 'subscriptions' ? '#4C1D95' : 'white',
                        color: activeTab === 'subscriptions' ? 'white' : '#64748B',
                        borderColor: activeTab === 'subscriptions' ? '#4C1D95' : '#E2E8F0',
                        fontSize: '0.85rem', fontWeight: 950, transition: '0.3s', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: activeTab === 'subscriptions' ? '0 10px 20px rgba(76, 29, 149, 0.15)' : 'none',
                        flex: '1 1 auto', justifyContent: 'center', minWidth: '200px'
                    }}
                >
                    <Briefcase size={16} /> Subscription Settlements
                </button>
                <button 
                    onClick={() => setActiveTab('invoices')}
                    style={{ 
                        padding: '14px 28px', borderRadius: '100px', cursor: 'pointer', border: '1px solid',
                        background: activeTab === 'invoices' ? '#4C1D95' : 'white',
                        color: activeTab === 'invoices' ? 'white' : '#64748B',
                        borderColor: activeTab === 'invoices' ? '#4C1D95' : '#E2E8F0',
                        fontSize: '0.85rem', fontWeight: 950, transition: '0.3s', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: activeTab === 'invoices' ? '0 10px 20px rgba(76, 29, 149, 0.15)' : 'none',
                        flex: '1 1 auto', justifyContent: 'center', minWidth: '200px'
                    }}
                >
                    <Receipt size={16} /> Verified Payout Log
                </button>
            </div>

             <div className="dashboard-glass" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '32px', overflow: 'hidden' }}>
                <div className="admin-card-padding" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <h3 className="premium-gradient" style={{ fontWeight: 950, fontSize: '1.4rem', margin: 0 }}>
                        {activeTab === 'subscriptions' ? 'Global Subscription Settlements' : 'Verified Payout Log (Real Cash Only)'}
                    </h3>
                    <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>
                        {activeTab === 'subscriptions' ? 'Syncing real-time records of paid membership activations.' : 'Real-time record of verified Paystack flows to merchant subaccounts.'}
                    </p>
                </div>
                
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: '950px', padding: '0 20px 20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>
                                        {activeTab === 'subscriptions' ? 'MERCHANT' : 'RECEIVER (MERCHANT)'}
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>
                                        {activeTab === 'subscriptions' ? 'PLAN & CYCLE' : 'BUYER (CUSTOMER)'}
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>
                                        {activeTab === 'subscriptions' ? 'REFERENCE' : 'INVOICE'}
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>AMOUNT</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>DATE</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>STATUS</th>
                                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeTab === 'subscriptions' ? (
                                    payments.map((p) => (
                                        <tr key={p._id} className="row-hover">
                                            <td style={{ padding: '16px', borderRadius: '20px 0 0 20px', border: '1px solid #F1F5F9', borderRight: 'none' }}>
                                                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem' }}>{p.businessId?.displayName || 'Legacy Merchant'}</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{p.businessId?._id ? `ID: ${p.businessId._id.toString().slice(-6).toUpperCase()}` : 'System Migration'}</p>
                                            </td>
                                            <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#4C1D95', textTransform: 'uppercase' }}>{p.plan || 'OGA'}</p>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>{p.billingCycle || 'monthly'}</p>
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
                                            <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                                {p.status === 'success' ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 900, color: '#10B981', background: '#ECFDF5', padding: '6px 12px', borderRadius: '100px', width: 'fit-content' }}>
                                                        <CheckCircle2 size={12} /> VERIFIED
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#F97316', background: '#FFF7ED', padding: '6px 12px', borderRadius: '100px' }}>{p.status.toUpperCase()}</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px', borderRadius: '0 20px 20px 0', border: '1px solid #F1F5F9', borderLeft: 'none', textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => handleDeleteClick(p._id, 'subscription')}
                                                    style={{ padding: '10px', borderRadius: '14px', background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer', transition: '0.2s' }}
                                                    className="delete-btn-hover"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    invoicePayments.map((p, idx) => (
                                        <tr key={p._id || idx} className="row-hover">
                                            <td style={{ padding: '16px', borderRadius: '20px 0 0 20px', border: '1px solid #F1F5F9', borderRight: 'none' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {p.merchantLogo ? (
                                                        <img src={p.merchantLogo} style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CreditCard size={14} color="#64748B" /></div>
                                                    )}
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.9rem' }}>{p.merchantName}</p>
                                                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{p.method} Receiver</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                                <p style={{ margin: 0, fontWeight: 850, fontSize: '0.85rem', color: '#111827' }}>{p.customerName}</p>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B' }}>Verified Buyer</p>
                                            </td>
                                            <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', fontSize: '0.8rem', fontWeight: 700, color: '#4C1D95', fontFamily: 'monospace' }}>
                                                #{p.invoiceNumber}
                                            </td>
                                            <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', fontWeight: 950, color: '#10B981', fontSize: '1rem' }}>
                                                ₦{p.amount?.toLocaleString()}
                                            </td>
                                            <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>
                                                {new Date(p.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 900, color: '#10B981', background: '#ECFDF5', padding: '6px 12px', borderRadius: '100px', width: 'fit-content' }}>
                                                    <CheckCircle2 size={12} /> SUCCESS
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', borderRadius: '0 20px 20px 0', border: '1px solid #F1F5F9', borderLeft: 'none', textAlign: 'right' }}>
                                                <button 
                                                    onClick={() => handleDeleteClick(p._id, 'invoice', p.saleId)}
                                                    style={{ padding: '10px', borderRadius: '14px', background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer', transition: '0.2s' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showDeleteConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '40px', borderRadius: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ width: '80px', height: '80px', background: '#FEF2F2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#EF4444' }}>
                            <ShieldAlert size={40} />
                        </div>
                        <h3 style={{ fontWeight: 950, fontSize: '1.5rem', marginBottom: '12px' }}>Confirm Cleanup</h3>
                        <p style={{ color: '#64748B', fontWeight: 600, lineHeight: 1.6, marginBottom: '32px' }}>Are you sure you want to remove this transaction record? This action is permanent and will affect platform totals.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#4C1D95', color: 'white', fontWeight: 950, cursor: 'pointer' }}>Delete Record</button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </motion.div>
    );
};

export default AdminRevenue;
