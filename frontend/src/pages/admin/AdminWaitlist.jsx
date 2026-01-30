import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Mail, Calendar, User, Search, Trash2, ShieldAlert, Phone, Briefcase, Hash } from 'lucide-react';
import { toast } from 'sonner';

const AdminWaitlist = () => {
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchWaitlist();
    }, []);

    const fetchWaitlist = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/waitlist`, { withCredentials: true });
            if (res.data.success) {
                setWaitlist(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to fetch waitlist entries.");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${API_URL}/admin/waitlist/${itemToDelete}`, { withCredentials: true });
            toast.success("Entry removed from the matrix.");
            fetchWaitlist();
        } catch (err) {
            toast.error("Deletion failed.");
        } finally {
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };

    const filteredWaitlist = waitlist.filter(entry => 
        entry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.whatsappNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="skeleton" style={{ height: '60px', borderRadius: '16px' }} />
            <div className="skeleton" style={{ height: '400px', borderRadius: '32px' }} />
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="admin-content-fade">
            <div className="dashboard-glass admin-card-padding" style={{ background: 'white', borderRadius: '32px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h3 style={{ fontWeight: 950, fontSize: '1.5rem', margin: 0 }}>Verified Waitlist</h3>
                        <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.9rem', marginTop: '4px' }}>Managing early birds and growth pipeline.</p>
                    </div>
                    <div style={{ position: 'relative', flex: '1', maxWidth: '400px', minWidth: '280px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input 
                            type="text" 
                            placeholder="Filter by name, email or phone..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: '0.9rem', outline: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: '1000px', paddingBottom: '20px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>APPLICANT</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>CONTACT & SOCIAL</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>INDUSTRY & CODE</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>JOINED</th>
                                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.7rem', color: '#64748B', fontWeight: 900, textTransform: 'uppercase' }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWaitlist.map((entry) => (
                                    <tr key={entry._id} className="row-hover">
                                        <td style={{ padding: '16px', borderRadius: '20px 0 0 20px', border: '1px solid #F1F5F9', borderRight: 'none' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div style={{ width: '44px', height: '44px', background: '#EFF6FF', color: '#3B82F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                                    {entry.name?.charAt(0) || '?' }
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontWeight: 850, fontSize: '0.95rem' }}>{entry.name || 'Anonymous'}</p>
                                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {entry.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                            <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Phone size={14} color="#10B981" /> {entry.whatsappNumber || 'N/A'}
                                            </p>
                                            <p style={{ margin: '4px 0 0', fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Hash size={12} /> Refs: {entry.referralCount || 0}
                                            </p>
                                        </td>
                                        <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ padding: '6px 12px', borderRadius: '100px', background: '#F1F5F9', color: '#64748B', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Briefcase size={10} /> {entry.industry || 'OTHERS'}
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>{entry.referralCode}</span>
                                           </div>
                                        </td>
                                        <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={14} /> {new Date(entry.createdAt).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td style={{ padding: '16px', borderRadius: '0 20px 20px 0', border: '1px solid #F1F5F9', borderLeft: 'none', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => { setItemToDelete(entry._id); setShowDeleteConfirm(true); }}
                                                style={{ padding: '10px', borderRadius: '12px', background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '40px', borderRadius: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '80px', height: '80px', background: '#FEF2F2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#EF4444' }}>
                            <ShieldAlert size={40} />
                        </div>
                        <h3 style={{ fontWeight: 950, fontSize: '1.5rem', marginBottom: '12px' }}>Confirm Deletion</h3>
                        <p style={{ color: '#64748B', fontWeight: 600, lineHeight: 1.6, marginBottom: '32px' }}>Are you sure you want to remove this verified lead? This action is permanent.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 900, cursor: 'pointer' }}>Delete Entry</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminWaitlist;
