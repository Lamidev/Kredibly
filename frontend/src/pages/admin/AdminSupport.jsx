import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { MessageSquare, ShieldCheck, Zap, RefreshCw, ChevronDown, ChevronUp, Clock, X, CheckCircle2, Trash2, AlertTriangle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [processingId, setProcessingId] = useState(null);
    const [expandedTickets, setExpandedTickets] = useState({});
    const [resolveModal, setResolveModal] = useState({ show: false, ticketId: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, ticketId: null });
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchTickets();
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchTickets = async () => {
        try {
            const res = await axios.get(`${API_URL}/support/tickets/all`, { withCredentials: true });
            if (res.data.success) {
                setTickets(res.data.data.map(t => ({ ...t, replyText: '' })));
            }
        } catch (err) {
            toast.error("Failed to fetch support tickets.");
        } finally {
            setLoading(false);
        }
    };

    const toggleHistory = (ticketId) => {
        setExpandedTickets(prev => ({
            ...prev,
            [ticketId]: !prev[ticketId]
        }));
    };

    const handleReply = async (ticket) => {
        if (!ticket.replyText?.trim() || processingId === ticket._id) return;
        setProcessingId(ticket._id);
        try {
            const res = await axios.patch(`${API_URL}/support/tickets/${ticket._id}/reply`, {
                message: ticket.replyText,
                sender: 'admin'
            }, { withCredentials: true });
            
            if (res.data.success) {
                toast.success("Response transmitted to merchant.");
                fetchTickets();
            }
        } catch (err) {
            console.error("Reply error:", err);
            toast.error("Signal failure: Could not send reply.");
        } finally {
            setProcessingId(null);
        }
    };

    const confirmResolve = async () => {
        const ticketId = resolveModal.ticketId;
        if (!ticketId) return;
        setProcessingId(ticketId);
        setResolveModal({ show: false, ticketId: null });
        try {
            await axios.patch(`${API_URL}/support/tickets/${ticketId}/resolve`, {}, { withCredentials: true });
            toast.success("Ticket archived as resolved.");
            fetchTickets();
        } catch (err) {
            toast.error("Cleanup failed.");
        } finally {
            setProcessingId(null);
        }
    };

    const confirmDelete = async () => {
        const ticketId = deleteModal.ticketId;
        if (!ticketId) return;
        setProcessingId(ticketId);
        setDeleteModal({ show: false, ticketId: null });
        try {
            await axios.delete(`${API_URL}/support/tickets/${ticketId}`, { withCredentials: true });
            toast.success("Ticket permanently removed.");
            fetchTickets();
        } catch (err) {
            toast.error("Deletion failed.");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="skeleton" style={{ height: '400px', borderRadius: '32px' }} />;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {tickets.length === 0 ? (
                    <div style={{ padding: '100px 40px', textAlign: 'center', background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0' }}>
                        <MessageSquare size={60} style={{ marginBottom: '24px', opacity: 0.1, color: 'var(--primary)' }} />
                        <h3 style={{ fontWeight: 900, color: '#64748B' }}>No active support requests.</h3>
                    </div>
                ) : (
                    tickets.map((t) => (
                        <div
                            key={t._id}
                            className="dashboard-glass"
                            style={{ padding: isMobile ? '20px' : '24px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)', opacity: t.status === 'resolved' ? 0.7 : 1 }}
                        >
                            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: '16px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                     <div style={{ width: '44px', height: '44px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', flexShrink: 0 }}>
                                        {(t.businessId?.displayName || t.userId?.name || 'K').charAt(0)}
                                     </div>
                                     <div style={{ overflow: 'hidden' }}>
                                         <h4 style={{ margin: 0, fontWeight: 900, color: 'var(--text)', fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.businessId?.displayName || 'Merchant'}</h4>
                                         <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.userId?.email}</p>
                                     </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-start' : 'flex-end', flexWrap: 'wrap' }}>
                                    {t.status !== 'resolved' && (
                                        <button 
                                            onClick={() => setResolveModal({ show: true, ticketId: t._id })} 
                                            disabled={processingId === t._id}
                                            style={{ position: 'relative', padding: '8px 14px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(76, 29, 149, 0.08)', color: 'var(--primary)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <ShieldCheck size={14} /> Mark Resolved
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setDeleteModal({ show: true, ticketId: t._id })}
                                        disabled={processingId === t._id}
                                        style={{ padding: '8px', borderRadius: '10px', background: '#FEF2F2', color: '#EF4444', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Delete Ticket"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900, background: t.status === 'replied' ? 'rgba(76, 29, 149, 0.1)' : t.status === 'resolved' ? '#F0FDF4' : '#F1F5F9', color: t.status === 'replied' ? 'var(--primary)' : t.status === 'resolved' ? '#22C55E' : '#64748B', textTransform: 'uppercase' }}>{t.status}</span>
                                </div>
                            </div>

                            {/* Main Message (Initial Request) */}
                            <div style={{ background: '#F0F9FF', borderRadius: '18px', padding: isMobile ? '16px' : '20px', marginBottom: (t.replies?.length > 0 || expandedTickets[t._id]) ? '12px' : '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Initial Request</span>
                                    <span style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 700 }}>{new Date(t.createdAt).toLocaleString()}</span>
                                </div>
                                <p style={{ fontSize: isMobile ? '0.9rem' : '1rem', color: '#1E293B', lineHeight: 1.6, margin: 0, fontWeight: 500, wordBreak: 'break-word' }}>{t.message}</p>
                            </div>

                            {/* Conversation History Toggle */}
                            {(t.replies && t.replies.length > 0) && (
                                <button 
                                    onClick={() => toggleHistory(t._id)}
                                    style={{ background: 'none', border: 'none', padding: '12px 0', width: '100%', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem' }}
                                >
                                    {expandedTickets[t._id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    {expandedTickets[t._id] ? 'Hide Conversation History' : `Show Conversation History (${t.replies.length} messages)`}
                                </button>
                            )}

                            {/* Expanded Conversation History */}
                            <AnimatePresence>
                                {expandedTickets[t._id] && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', padding: '12px 0' }}
                                    >
                                        {(t.replies || []).map((reply, index) => (
                                            <div 
                                                key={index}
                                                style={{ 
                                                    alignSelf: reply.sender === 'admin' ? 'flex-end' : 'flex-start',
                                                    maxWidth: '85%',
                                                    background: reply.sender === 'admin' ? 'white' : '#F8FAFC',
                                                    border: '1px solid ' + (reply.sender === 'admin' ? 'rgba(76, 29, 149, 0.1)' : '#E2E8F0'),
                                                    padding: isMobile ? '12px' : '16px',
                                                    borderRadius: reply.sender === 'admin' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                    wordBreak: 'break-word'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: reply.sender === 'admin' ? 'var(--primary)' : '#64748B', textTransform: 'uppercase' }}>{reply.sender === 'admin' ? 'You (Admin)' : t.businessId?.displayName || 'Merchant'}</span>
                                                    <span style={{ fontSize: '0.6rem', color: '#94A3B8', fontWeight: 700 }}>{new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: isMobile ? '0.85rem' : '0.9rem', color: '#334155', lineHeight: 1.5, fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{reply.message}</p>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {t.status !== 'resolved' && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', flexDirection: isMobile ? 'column' : 'row', borderTop: '1px solid #F1F5F9', paddingTop: '20px' }}>
                                    <textarea
                                        placeholder="Type your response... (Ctrl+Enter to send)"
                                        value={t.replyText || ''}
                                        onChange={(e) => {
                                            const newTickets = [...tickets];
                                            const idx = tickets.findIndex(item => item._id === t._id);
                                            newTickets[idx].replyText = e.target.value;
                                            setTickets(newTickets);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                e.preventDefault();
                                                handleReply(t);
                                            }
                                        }}
                                        rows={2}
                                        style={{ 
                                            flex: 1, 
                                            width: '100%', 
                                            padding: '12px 16px', 
                                            borderRadius: '14px', 
                                            border: '1px solid #E2E8F0', 
                                            background: '#F8FAFC', 
                                            fontWeight: 700, 
                                            fontSize: '0.85rem', 
                                            outline: 'none',
                                            resize: 'vertical',
                                            fontFamily: 'inherit'
                                        }}
                                    />
                                    <button 
                                        onClick={() => handleReply(t)} 
                                        disabled={!t.replyText?.trim() || processingId === t._id} 
                                        className="btn-primary" 
                                        style={{ width: isMobile ? '100%' : 'auto', padding: '14px', borderRadius: '14px', background: (t.replyText?.trim() && processingId !== t._id) ? 'var(--primary)' : '#CBD5E1', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        {processingId === t._id ? <RefreshCw size={20} className="spin-animation" color="white" /> : <Send size={22} color="white" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Resolve Confirmation Modal (Purple Concept) */}
            {createPortal(
                <AnimatePresence>
                    {resolveModal.show && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '20px' }}>
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                style={{ padding: isMobile ? '24px' : '40px', maxWidth: '440px', width: '100%', background: 'white', borderRadius: isMobile ? '32px' : '40px', textAlign: 'center', boxShadow: '0 25px 70px -12px rgba(0,0,0,0.3)' }}
                            >
                                <div style={{ background: 'rgba(76, 29, 149, 0.1)', color: 'var(--primary)', width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <ShieldCheck size={32} />
                                </div>
                                <h3 style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: 950, color: '#0F172A', marginBottom: '12px', letterSpacing: '-0.02em' }}>Settle Ticket?</h3>
                                <p style={{ color: '#475569', marginBottom: '32px', lineHeight: 1.6, fontWeight: 600, fontSize: isMobile ? '0.9rem' : '1rem' }}>
                                    Are you 100% certain this merchant's request is fully resolved? This will archive the conversation.
                                </p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        className="btn-secondary" 
                                        style={{ flex: 1, padding: '18px', borderRadius: '18px', fontWeight: 800, fontSize: '0.95rem' }} 
                                        onClick={() => setResolveModal({ show: false, ticketId: null })}
                                    >
                                        Not Yet
                                    </button>
                                    <button 
                                        className="btn-primary"
                                        style={{ flex: 1, padding: '18px', borderRadius: '18px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }} 
                                        onClick={confirmResolve}
                                    >
                                        Yes, Settle
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Delete Confirmation Modal (Red Concept) */}
            {createPortal(
                <AnimatePresence>
                    {deleteModal.show && (
                        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '20px' }}>
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                style={{ padding: isMobile ? '24px' : '40px', maxWidth: '440px', width: '100%', background: 'white', borderRadius: isMobile ? '32px' : '40px', textAlign: 'center', boxShadow: '0 25px 70px -12px rgba(0,0,0,0.3)' }}
                            >
                                <div style={{ background: '#FEF2F2', color: '#EF4444', width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: 950, color: '#0F172A', marginBottom: '12px', letterSpacing: '-0.02em' }}>Delete Ticket?</h3>
                                <p style={{ color: '#475569', marginBottom: '32px', lineHeight: 1.6, fontWeight: 600, fontSize: isMobile ? '0.9rem' : '1rem' }}>
                                    This action is irreversible. The ticket and all its message history will be permanently deleted from the systems.
                                </p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button 
                                        className="btn-secondary" 
                                        style={{ flex: 1, padding: '18px', borderRadius: '18px', fontWeight: 800, fontSize: '0.95rem' }} 
                                        onClick={() => setDeleteModal({ show: false, ticketId: null })}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', padding: '18px', borderRadius: '18px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.2)' }} 
                                        onClick={confirmDelete}
                                    >
                                        Delete Forever
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};

export default AdminSupport;
