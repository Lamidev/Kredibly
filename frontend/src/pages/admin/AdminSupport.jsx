import { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchTickets();
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

    const handleReply = async (ticket) => {
        if (!ticket.replyText?.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/support/tickets/${ticket._id}/reply`, {
                message: ticket.replyText,
                sender: 'admin'
            }, { withCredentials: true });
            
            if (res.data.success) {
                toast.success("Response transmitted to merchant.");
                fetchTickets();
            }
        } catch (err) {
            toast.error("Signal failure: Could not send reply.");
        }
    };

    const handleResolve = async (ticketId) => {
        try {
            await axios.put(`${API_URL}/support/tickets/${ticketId}/resolve`, {}, { withCredentials: true });
            toast.success("Ticket archived as resolved.");
            fetchTickets();
        } catch (err) {
            toast.error("Cleanup failed.");
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
                            style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)', opacity: t.status === 'resolved' ? 0.8 : 1 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                     <div style={{ width: '44px', height: '44px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white' }}>
                                        {(t.businessId?.displayName || t.userId?.name || 'K').charAt(0)}
                                     </div>
                                     <div>
                                         <h4 style={{ margin: 0, fontWeight: 900, color: 'var(--text)', fontSize: '1rem' }}>{t.businessId?.displayName || 'Merchant'}</h4>
                                         <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.userId?.email}</p>
                                     </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {t.status !== 'resolved' && (
                                        <button onClick={() => handleResolve(t._id)} style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800, background: '#ECFDF5', color: '#10B981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16} /> Mark Resolved</button>
                                    )}
                                    <span style={{ padding: '6px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, background: '#F1F5F9', color: '#64748B', textTransform: 'uppercase' }}>{t.status}</span>
                                </div>
                            </div>

                            <div style={{ background: '#F0F9FF', borderRadius: '18px', padding: '20px', marginBottom: '20px' }}>
                                <p style={{ fontSize: '1rem', color: '#1E293B', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>{t.message}</p>
                            </div>

                            {t.status !== 'resolved' && (
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="Shield activated. Type your response..."
                                        value={t.replyText || ''}
                                        onChange={(e) => {
                                            const newTickets = [...tickets];
                                            const idx = tickets.findIndex(item => item._id === t._id);
                                            newTickets[idx].replyText = e.target.value;
                                            setTickets(newTickets);
                                        }}
                                        style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: '0.9rem', outline: 'none' }}
                                    />
                                    <button onClick={() => handleReply(t)} disabled={!t.replyText?.trim()} className="btn-primary" style={{ padding: '16px', borderRadius: '16px', background: t.replyText?.trim() ? 'var(--primary)' : '#CBD5E1', border: 'none' }}>
                                        <Zap size={22} fill="white" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default AdminSupport;
