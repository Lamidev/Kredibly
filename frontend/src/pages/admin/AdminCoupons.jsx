import { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Trash2, X, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const AdminCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [newCoupon, setNewCoupon] = useState({ code: '', discountType: 'percentage', discountAmount: '', usageLimit: '', expiryDate: '' });
    
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/coupons`, { withCredentials: true });
            if (res.data.success) setCoupons(res.data.data);
        } catch (err) {
            toast.error("Failed to fetch coupons.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/admin/coupons`, newCoupon, { withCredentials: true });
            if (res.data.success) {
                toast.success("Coupon created successfully.");
                setShowCouponModal(false);
                setNewCoupon({ code: '', discountType: 'percentage', discountAmount: '', usageLimit: '', expiryDate: '' });
                fetchCoupons();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create coupon.");
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const res = await axios.delete(`${API_URL}/admin/coupons/${itemToDelete}`, { withCredentials: true });
            if (res.data.success) {
                toast.success("Coupon purged successfully.");
                fetchCoupons();
            }
        } catch (err) {
            toast.error("Purge failed.");
        } finally {
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };

    if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '32px' }} />;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontWeight: 950, fontSize: '1.4rem', margin: 0 }}>Discount Engine</h3>
                <button onClick={() => setShowCouponModal(true)} className="btn-primary" style={{ padding: '14px 24px', borderRadius: '16px', fontWeight: 900, fontSize: '0.9rem' }}>Create Coupon</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {coupons.map((c) => (
                    <div key={c._id} className="dashboard-glass" style={{ padding: '24px', borderRadius: '24px', background: 'white', border: '1px solid var(--border)', position: 'relative' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#EEF2FF', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <Tag size={24} />
                        </div>
                        <h4 style={{ margin: '0 0 4px', fontWeight: 950, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.code}</h4>
                        <p style={{ margin: '0 0 16px', color: 'var(--primary)', fontWeight: 800 }}>{c.discountType === 'percentage' ? `${c.discountAmount}% OFF` : `₦${c.discountAmount} OFF`}</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '16px', marginTop: '16px' }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>USAGES</p>
                                <p style={{ margin: 0, fontWeight: 900, fontSize: '0.9rem' }}>{c.usageCount} / {c.usageLimit || '∞'}</p>
                            </div>
                            <button onClick={() => { setItemToDelete(c._id); setShowDeleteConfirm(true); }} style={{ padding: '8px', borderRadius: '10px', background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {showCouponModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '40px', borderRadius: '32px', maxWidth: '500px', width: '100%', position: 'relative' }}>
                        <button onClick={() => setShowCouponModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}><X size={24} /></button>
                        <h3 style={{ fontWeight: 950, fontSize: '1.8rem', marginBottom: '8px' }}>Target: Add Coupon</h3>
                        <p style={{ color: '#64748B', fontWeight: 600, marginBottom: '32px' }}>Configure discount parameters for merchant acquisition.</p>
                        
                        <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#64748B' }}>COUPON CODE (UPPERCASE)</label>
                                <input required type="text" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }} placeholder="e.g. FOUNDER50" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#64748B' }}>DISCOUNT TYPE</label>
                                    <select value={newCoupon.discountType} onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }}>
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed (₦)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#64748B' }}>AMOUNT</label>
                                    <input required type="number" value={newCoupon.discountAmount} onChange={e => setNewCoupon({...newCoupon, discountAmount: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }} placeholder="0" />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#64748B' }}>USAGE LIMIT</label>
                                    <input type="number" value={newCoupon.usageLimit} onChange={e => setNewCoupon({...newCoupon, usageLimit: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }} placeholder="Unlimited" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 900, color: '#64748B' }}>EXPIRY DATE</label>
                                    <input type="date" value={newCoupon.expiryDate} onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700 }} />
                                </div>
                            </div>
                            <button type="submit" className="btn-primary" style={{ padding: '18px', borderRadius: '16px', marginTop: '12px', fontWeight: 950, fontSize: '1rem' }}>Deploy Coupon</button>
                        </form>
                    </motion.div>
                </div>
            )}

            {showDeleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '40px', borderRadius: '32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                         <div style={{ width: '80px', height: '80px', background: '#FEF2F2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#EF4444' }}>
                            <Activity size={40} />
                        </div>
                        <h3 style={{ fontWeight: 950, fontSize: '1.5rem', marginBottom: '12px' }}>Confirm Purge</h3>
                        <p style={{ color: '#64748B', fontWeight: 600, lineHeight: 1.6, marginBottom: '32px' }}>Are you sure you want to permanently remove this coupon? This action cannot be undone.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 900, cursor: 'pointer' }}>Delete Target</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminCoupons;
