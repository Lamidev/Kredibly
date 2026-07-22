import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Lightbulb, CheckCircle, Clock, Trash2, Send, Star, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const AdminFeedback = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchFeedback();
    }, []);

    const fetchFeedback = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/feedback/all`, { withCredentials: true });
            if (res.data.success) {
                setFeedbacks(res.data.data);
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) return;
            toast.error("Failed to fetch roadmap suggestions.");
        } finally {
            setLoading(false);
        }
    };

    const updateFeedback = async (id, updates) => {
        try {
            const res = await axios.put(`${API_URL}/admin/feedback/${id}/update`, updates, { withCredentials: true });
            if (res.data.success) {
                toast.success("Roadmap updated successfully!");
                fetchFeedback();
            }
        } catch (err) {
            toast.error("Failed to update status.");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'planned': return { bg: '#E0F2FE', text: '#0369A1' };
            case 'in_progress': return { bg: '#FEF3C7', text: '#D97706' };
            case 'implemented': return { bg: '#DCFCE7', text: '#15803D' };
            case 'maybe_later': return { bg: '#F1F5F9', text: '#64748B' };
            default: return { bg: '#F8FAFC', text: '#475569' };
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${API_URL}/admin/feedback/${itemToDelete}`, { withCredentials: true });
            toast.success("Feedback removed from roadmap.");
            fetchFeedback();
        } catch (err) {
            toast.error("Cleanup failed.");
        } finally {
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };

    if (loading) return <div className="skeleton" style={{ height: '500px', borderRadius: '40px' }} />;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontWeight: 900, fontSize: '2rem', margin: 0, color: 'var(--text)' }}>Founder's Roadmap 🗺️</h2>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: '8px 0 0 0' }}>Merchant suggestions and feature requests directly from Kreddy.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ padding: '12px 20px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Star size={18} color="#FBBF24" fill="#FBBF24" />
                        <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{feedbacks.length} Ideas Saved</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' }}>
                <AnimatePresence mode="popLayout">
                    {feedbacks.map((f, idx) => (
                        <motion.div 
                            key={f._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                            layout
                            className="dashboard-glass"
                            style={{ 
                                padding: '32px', 
                                background: 'white', 
                                borderRadius: '32px', 
                                border: '1px solid var(--border)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{ padding: '10px', background: '#F0F9FF', borderRadius: '12px', color: '#0EA5E9' }}>
                                        <Lightbulb size={24} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontWeight: 900, color: 'var(--text)' }}>{f.businessId?.displayName || 'Merchant Idea'}</h4>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>{f.businessId?.plan?.toUpperCase()} PLAN</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <select 
                                        defaultValue={f.status}
                                        onChange={(e) => updateFeedback(f._id, { status: e.target.value })}
                                        style={{ 
                                            padding: '8px 12px', 
                                            borderRadius: '12px', 
                                            border: 'none', 
                                            background: getStatusColor(f.status).bg, 
                                            color: getStatusColor(f.status).text,
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="under_review">Under Review</option>
                                        <option value="planned">Planned</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="implemented">Implemented</option>
                                        <option value="maybe_later">Maybe Later</option>
                                    </select>
                                    <button 
                                        onClick={() => { setItemToDelete(f._id); setShowDeleteConfirm(true); }}
                                        style={{ background: '#FEF2F2', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer', color: '#EF4444' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '24px', flex: 1 }}>
                                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.6, color: '#334155' }}>"{f.message}"</p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>🛠️ Developer Notes</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Add thoughts for the dev team..."
                                        defaultValue={f.devNotes}
                                        onBlur={(e) => updateFeedback(f._id, { devNotes: e.target.value })}
                                        style={{ 
                                            flex: 1, 
                                            padding: '12px 16px', 
                                            borderRadius: '16px', 
                                            border: '1px solid #E2E8F0', 
                                            fontSize: '0.85rem', 
                                            fontWeight: 600,
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: '10px', borderTop: '1px solid #F1F5F9', marginTop: '10px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8' }}>Submitted {new Date(f.createdAt).toLocaleDateString()}</span>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748B' }}>
                                        <AlertCircle size={14} />
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{f.priority?.toUpperCase()} PRIORITY</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {showDeleteConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '40px', borderRadius: '32px', maxWidth: '400px', width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '80px', height: '80px', background: '#FEF2F2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#EF4444' }}>
                            <Trash2 size={40} />
                        </div>
                        <h3 style={{ fontWeight: 950, fontSize: '1.5rem', marginBottom: '12px' }}>Confirm Delete</h3>
                        <p style={{ color: '#64748B', fontWeight: 600, lineHeight: 1.6, marginBottom: '32px' }}>Are you sure you want to permanently remove this suggestion from the roadmap? This action cannot be undone.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <button onClick={() => { setShowDeleteConfirm(false); setItemToDelete(null); }} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 900, cursor: 'pointer' }}>Delete Target</button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminFeedback;
