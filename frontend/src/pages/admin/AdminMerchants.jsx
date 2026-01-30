import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const AdminMerchants = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/users`, { withCredentials: true });
            if (res.data.success) setUsers(res.data.data);
        } catch (err) {
            toast.error("Failed to fetch merchants.");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            const res = await axios.delete(`${API_URL}/admin/users/${itemToDelete}`, { withCredentials: true });
            if (res.data.success) {
                toast.success("Merchant purged successfully.");
                fetchUsers();
            }
        } catch (err) {
            toast.error("Purge failed.");
        } finally {
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '32px' }} />;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="dashboard-glass admin-card-padding" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <h3 style={{ fontWeight: 950, fontSize: '1.4rem', margin: 0 }}>Merchant Directory</h3>
                    <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: '0.9rem', outline: 'none' }}
                        />
                    </div>
                </div>
                
                <div style={{ overflowX: 'auto', margin: '0 -10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: '600px' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>MERCHANT</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>PLAN</th>
                                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>JOINED</th>
                                <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((u) => (
                                <tr key={u._id} className="row-hover">
                                    <td style={{ padding: '16px', borderRadius: '20px 0 0 20px', border: '1px solid #F1F5F9', borderRight: 'none' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>
                                                {u.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontWeight: 850, fontSize: '0.95rem' }}>{u.name}</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                        <span style={{ 
                                            padding: '4px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900,
                                            background: u.businessProfile?.plan === 'hustler' ? '#F1F5F9' : u.businessProfile?.plan === 'oga' ? '#ECFDF5' : '#EEF2FF',
                                            color: u.businessProfile?.plan === 'hustler' ? '#64748B' : u.businessProfile?.plan === 'oga' ? '#10B981' : '#6366F1',
                                            textTransform: 'uppercase', letterSpacing: '0.05em'
                                        }}>
                                            {u.businessProfile?.plan || 'UNRANKED'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>
                                        {new Date(u.createdAt).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px', borderRadius: '0 20px 20px 0', border: '1px solid #F1F5F9', borderLeft: 'none', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => { setItemToDelete(u._id); setShowDeleteConfirm(true); }} style={{ padding: '10px', borderRadius: '12px', background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {showDeleteConfirm && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '40px', borderRadius: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ width: '80px', height: '80px', background: '#FEF2F2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#EF4444' }}>
                                <Trash2 size={40} />
                            </div>
                            <h3 style={{ fontWeight: 950, fontSize: '1.5rem', marginBottom: '12px' }}>Confirm Purge</h3>
                            <p style={{ color: '#64748B', fontWeight: 600, lineHeight: 1.6, marginBottom: '32px' }}>Are you sure you want to permanently remove this merchant? This action cannot be undone.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={confirmDelete} style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 900, cursor: 'pointer' }}>Delete Target</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AdminMerchants;
