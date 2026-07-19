import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Trash2, Eye, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const AdminMerchants = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Delete Modal State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Responsive State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
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

    const handleSelectMerchant = (user) => {
        navigate(`/admin/merchants/${user._id}`);
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
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.business?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '32px' }} />;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="dashboard-glass admin-card-padding" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h3 className="premium-gradient" style={{ fontWeight: 950, fontSize: '1.4rem', margin: 0, padding: '4px 8px', display: 'inline-block', marginLeft: '4px' }}>Merchant Directory</h3>
                    </div>
                    <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input 
                            type="text" 
                            placeholder="Search by name, email, or business..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: '0.9rem', outline: 'none' }}
                        />
                    </div>
                </div>
                
                {isMobile ? (
                    /* Mobile Card View */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((u) => (
                            <div 
                                key={u._id} 
                                onClick={() => handleSelectMerchant(u)}
                                style={{ background: '#F8FAFC', borderRadius: '24px', padding: '20px', border: '1px solid #F1F5F9', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    {u.business?.logoUrl ? (
                                        <img 
                                            src={u.business.logoUrl} 
                                            alt={u.business?.displayName || u.name} 
                                            style={{ width: '48px', height: '48px', borderRadius: '16px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }} 
                                            onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                        />
                                    ) : null}
                                    <div style={{ display: u.business?.logoUrl ? 'none' : 'flex', width: '48px', height: '48px', borderRadius: '16px', background: 'var(--primary)', color: 'white', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.1rem', flexShrink: 0 }}>
                                        {u.business?.displayName?.charAt(0) || u.name?.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                            <p style={{ margin: 0, fontWeight: 900, fontSize: '1rem' }}>{u.business?.displayName || u.name}</p>
                                            {u.business?.isKreddyConnected && (
                                                <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 900 }}>WA ACTIVE</span>
                                            )}
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', wordBreak: 'break-all' }}>{u.name} • {u.email}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setItemToDelete(u._id); setShowDeleteConfirm(true); }} 
                                        style={{ padding: '10px', borderRadius: '12px', background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
                                    <div>
                                        <span style={{ 
                                            padding: '4px 10px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900,
                                            background: u.business?.plan === 'hustler' ? '#E2E8F0' : u.business?.plan === 'oga' ? '#ECFDF5' : u.business?.plan === 'chairman' ? '#EEF2FF' : '#FFF7ED',
                                            color: u.business?.plan === 'hustler' ? '#64748B' : u.business?.plan === 'oga' ? '#10B981' : u.business?.plan === 'chairman' ? '#6366F1' : '#EA580C',
                                            textTransform: 'uppercase'
                                        }}>
                                            {u.business?.plan || 'INCOMPLETE'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                        Joined {new Date(u.business?.createdAt || u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })} <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Desktop Table View */
                    <div style={{ overflowX: 'auto', margin: '0 -10px' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: '600px' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>MERCHANT</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>PLAN</th>
                                    <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>JOINED (MERCHANT)</th>
                                    <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((u) => (
                                    <tr 
                                        key={u._id} 
                                        onClick={() => handleSelectMerchant(u)}
                                        className="row-hover"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <td style={{ padding: '16px', borderRadius: '20px 0 0 20px', border: '1px solid #F1F5F9', borderRight: 'none' }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                {u.business?.logoUrl ? (
                                                    <img 
                                                        src={u.business.logoUrl} 
                                                        alt={u.business?.displayName || u.name} 
                                                        style={{ width: 'clamp(32px, 8vw, 44px)', height: 'clamp(32px, 8vw, 44px)', borderRadius: '12px', objectFit: 'cover', border: '1px solid #E2E8F0', flexShrink: 0 }} 
                                                        onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                                                    />
                                                ) : null}
                                                <div style={{ display: u.business?.logoUrl ? 'none' : 'flex', width: 'clamp(32px, 8vw, 44px)', height: 'clamp(32px, 8vw, 44px)', borderRadius: '12px', background: 'var(--primary)', color: 'white', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem', flexShrink: 0 }}>
                                                    {u.business?.displayName?.charAt(0) || u.name?.charAt(0)}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        <p style={{ margin: 0, fontWeight: 850, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {u.business?.displayName || u.name}
                                                        </p>
                                                        {u.business?.displayName && u.name !== u.business.displayName && (
                                                            <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>({u.name})</span>
                                                        )}
                                                        {u.business?.isKreddyConnected && (
                                                            <span title="WhatsApp Connected" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#DCFCE7', color: '#166534', padding: '2px 6px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                                                                WA ACTIVE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                            <span style={{ 
                                                padding: '4px 10px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900,
                                                background: u.business?.plan === 'hustler' ? '#F1F5F9' : u.business?.plan === 'oga' ? '#ECFDF5' : u.business?.plan === 'chairman' ? '#EEF2FF' : '#FFF7ED',
                                                color: u.business?.plan === 'hustler' ? '#64748B' : u.business?.plan === 'oga' ? '#10B981' : u.business?.plan === 'chairman' ? '#6366F1' : '#EA580C',
                                                textTransform: 'uppercase', letterSpacing: '0.05em'
                                            }}>
                                                {u.business?.plan || 'INCOMPLETE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                                            {new Date(u.business?.createdAt || u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                                        </td>
                                        <td style={{ padding: '16px', borderRadius: '0 20px 20px 0', border: '1px solid #F1F5F9', borderLeft: 'none', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleSelectMerchant(u); }} 
                                                    style={{ padding: '8px 14px', borderRadius: '10px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <Eye size={14} /> View Details
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setItemToDelete(u._id); setShowDeleteConfirm(true); }} 
                                                    style={{ padding: '8px', borderRadius: '10px', background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', gap: '16px', borderTop: '1px solid #F1F5F9', alignItems: 'center' }}>
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        style={{ padding: '10px 20px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontWeight: 800, color: '#64748B', cursor: 'pointer', fontSize: '0.85rem', opacity: currentPage === 1 ? 0.5 : 1 }}
                    >
                        Prev
                    </button>
                    <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary)' }}>
                        Page {currentPage} of {Math.ceil(filteredUsers.length / itemsPerPage) || 1}
                    </div>
                    <button 
                        disabled={currentPage * itemsPerPage >= filteredUsers.length}
                        onClick={() => setCurrentPage(p => p + 1)}
                        style={{ padding: '10px 20px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', fontWeight: 800, color: '#64748B', cursor: 'pointer', fontSize: '0.85rem', opacity: currentPage * itemsPerPage >= filteredUsers.length ? 0.5 : 1 }}
                    >
                        Next
                    </button>
                </div>

                {/* DELETE CONFIRMATION MODAL */}
                {showDeleteConfirm && createPortal(
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '40px', borderRadius: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ width: '80px', height: '80px', background: '#FEF2F2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#EF4444' }}>
                                <Trash2 size={40} />
                            </div>
                            <h3 style={{ fontWeight: 950, fontSize: '1.5rem', marginBottom: '12px' }}>Confirm Delete</h3>
                            <p style={{ color: '#64748B', fontWeight: 600, lineHeight: 1.6, marginBottom: '32px' }}>Are you sure you want to permanently remove this merchant? This action cannot be undone.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                                <button onClick={confirmDelete} style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 900, cursor: 'pointer' }}>Delete Target</button>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}
            </div>
        </motion.div>
    );
};

export default AdminMerchants;
