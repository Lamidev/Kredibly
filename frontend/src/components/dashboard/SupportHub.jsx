import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare,
    X,
    Send,
    Heart,
    ShieldCheck,
    ChevronRight,
    Clock,
    MessageCircle,
    CheckCircle2,
    History,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const SupportHub = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('menu'); // 'menu', 'faq', 'form', 'sent', 'tickets', 'chat'
    const [activeTicket, setActiveTicket] = useState(null);
    const [activeFaq, setActiveFaq] = useState(null);
    const [message, setMessage] = useState('');
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [hasUnreadReply, setHasUnreadReply] = useState(false);
    const { profile } = useAuth();

    const scrollRef = useRef(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        if (profile) {
            fetchTickets();
            const interval = setInterval(fetchTickets, 30000);
            return () => clearInterval(interval);
        }
    }, [profile]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activeTicket, view]);

    const fetchTickets = async () => {
        try {
            const res = await axios.get(`${API_URL}/support/tickets/me`, { withCredentials: true });
            if (res.data.success) {
                setTickets(res.data.data);
                const hasReplied = res.data.data.some(t => t.status === 'replied');
                setHasUnreadReply(hasReplied);

                // Keep active ticket updated
                if (activeTicket) {
                    const updated = res.data.data.find(t => t._id === activeTicket._id);
                    if (updated) setActiveTicket(updated);
                }
            }
        } catch (err) {
            console.error("Failed to fetch tickets", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        setLoading(true);
        try {
            await axios.post(`${API_URL}/support/tickets`, {
                message,
                businessId: profile?._id
            }, { withCredentials: true });

            fetchTickets();
            setView('sent');
            setMessage('');
            setTimeout(() => {
                setView('menu');
                setIsOpen(false);
            }, 3500);
        } catch (err) {
            toast.error("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !activeTicket) return;

        setLoading(true);
        try {
            await axios.patch(`${API_URL}/support/tickets/${activeTicket._id}/reply`, {
                message: replyText
            }, { withCredentials: true });

            setReplyText('');
            fetchTickets();
        } catch (err) {
            toast.error("Reply failed");
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (ticketId) => {
        try {
            await axios.patch(`${API_URL}/support/tickets/${ticketId}/resolve`, {}, { withCredentials: true });
            toast.success("Ticket marked as resolved. Glad we could help!");
            fetchTickets();
            if (activeTicket?._id === ticketId) {
                setView('tickets');
                setActiveTicket(null);
            }
        } catch (err) {
            toast.error("Failed to resolve ticket");
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="glass-card"
                        style={{
                            width: '380px',
                            background: 'white',
                            borderRadius: '28px',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
                            padding: '0',
                            overflow: 'hidden',
                            marginBottom: '20px',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            maxHeight: 'calc(100vh - 120px)'
                        }}
                    >
                        {/* Header */}
                        <div style={{ background: 'var(--primary)', padding: '24px', color: 'white', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MessageSquare size={20} />
                                        </div>
                                        <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', background: '#4ADE80', border: '2px solid var(--primary)', borderRadius: '50%' }}></div>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                                            {view === 'chat' ? 'Ticket Support' : 'Kredibly Help'}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>
                                            {view === 'chat' ? `ID: #${activeTicket?._id.toString().slice(-6)}` : 'Always online to help'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => { setIsOpen(false); setView('menu'); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '6px' }}>
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '20px', minHeight: '380px', maxHeight: '500px', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>

                            {view === 'menu' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div style={{ background: '#EEF2FF', padding: '16px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #E0E7FF' }}>
                                        <p style={{ fontSize: '0.9rem', color: '#4338CA', fontWeight: 800, margin: 0 }}>
                                            Welcome back, {profile?.displayName || 'Chief'}! 👋
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: '#6366F1', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                                            How can Kreddy and the team assist your business today?
                                        </p>
                                    </div>

                                    {tickets.some(t => t.status !== 'resolved') && (
                                        <button
                                            onClick={() => setView('tickets')}
                                            style={{
                                                width: '100%', background: 'white', border: '1px solid #E2E8F0',
                                                padding: '12px 16px', borderRadius: '16px', marginBottom: '12px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ background: 'var(--primary)', color: 'white', padding: '6px', borderRadius: '8px' }}>
                                                    <Clock size={14} />
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#1E293B' }}>Active Tickets</p>
                                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748B' }}>{tickets.filter(t => t.status !== 'resolved').length} open request(s)</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} color="#94A3B8" />
                                        </button>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', paddingLeft: '8px' }}>Common Questions</p>
                                        {[
                                            { q: "How do I record a sale?", a: "Just use the 'Plus' button or text Kreddy on WhatsApp: 'Sold a bag to Funke for 20k'." },
                                            { q: "What is the Trust Score?", a: "It's your reliability rating based on verified receipts. High scores = more trust!" },
                                        ].map((f, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setActiveFaq(f); setView('faq'); }}
                                                style={{ textAlign: 'left', padding: '14px 16px', borderRadius: '16px', background: 'white', border: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                            >
                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{f.q}</span>
                                                <ChevronRight size={14} color="#CBD5E1" />
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setView('form')}
                                        style={{ width: '100%', padding: '16px', borderRadius: '20px', border: '2px dashed #CBD5E1', background: 'transparent', cursor: 'pointer', color: '#64748B', fontWeight: 800, fontSize: '0.85rem' }}
                                    >
                                        Something else? Chat with us
                                    </button>
                                </motion.div>
                            )}

                            {view === 'tickets' && (
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        ← Back to Menu
                                    </button>
                                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} className="no-scrollbar">
                                        {tickets.length === 0 ? (
                                            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem', marginTop: '40px' }}>No support history yet.</p>
                                        ) : (
                                            tickets.map((t) => (
                                                <div
                                                    key={t._id}
                                                    onClick={() => { setActiveTicket(t); setView('chat'); }}
                                                    style={{ background: 'white', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0', cursor: 'pointer', position: 'relative' }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '100px', fontSize: '0.6rem', fontWeight: 800,
                                                            background: t.status === 'replied' ? '#EFF6FF' : t.status === 'resolved' ? '#ECFDF5' : '#F1F5F9',
                                                            color: t.status === 'replied' ? 'var(--primary)' : t.status === 'resolved' ? '#10B981' : '#64748B'
                                                        }}>
                                                            {t.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#1E293B', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.message}</p>

                                                    {t.replies.length > 0 && (
                                                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '6px', height: '6px', background: 'var(--primary)', borderRadius: '50%' }}></div>
                                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>Admin replied...</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {view === 'chat' && activeTicket && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <button onClick={() => setView('tickets')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            ← List
                                        </button>
                                        {activeTicket.status !== 'resolved' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleResolve(activeTicket._id); }}
                                                style={{ background: '#ECFDF5', border: 'none', color: '#10B981', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <CheckCircle2 size={12} /> Mark Resolved
                                            </button>
                                        )}
                                    </div>

                                    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }} className="no-scrollbar">
                                        <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: '#F1F5F9', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', fontSize: '0.9rem', color: '#1E293B' }}>
                                            {activeTicket.message}
                                            <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: '6px' }}>{new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>

                                        {activeTicket.replies.map((r, idx) => (
                                            <div key={idx} style={{
                                                alignSelf: r.sender === 'admin' ? 'flex-end' : 'flex-start',
                                                maxWidth: '85%',
                                                background: r.sender === 'admin' ? 'var(--primary)' : '#F1F5F9',
                                                color: r.sender === 'admin' ? 'white' : '#1E293B',
                                                padding: '12px 16px',
                                                borderRadius: r.sender === 'admin' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                fontSize: '0.9rem',
                                                boxShadow: r.sender === 'admin' ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none'
                                            }}>
                                                {r.message}
                                                <div style={{ fontSize: '0.65rem', color: r.sender === 'admin' ? 'rgba(255,255,255,0.7)' : '#94A3B8', marginTop: '6px', textAlign: r.sender === 'admin' ? 'right' : 'left' }}>
                                                    {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        ))}

                                        {activeTicket.status === 'resolved' && (
                                            <div style={{ padding: '16px', background: '#F0FDF4', borderRadius: '16px', border: '1px solid #DCFCE7', textAlign: 'center' }}>
                                                <CheckCircle2 size={24} color="#10B981" style={{ margin: '0 auto 8px' }} />
                                                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#166534' }}>Ticket Closed</p>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#166534', opacity: 0.8 }}>This conversation has ended.</p>
                                            </div>
                                        )}
                                    </div>

                                    {activeTicket.status !== 'resolved' && (
                                        <form onSubmit={handleReply} style={{ marginTop: '16px', position: 'relative' }}>
                                            <input
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Ask something else..."
                                                style={{ width: '100%', padding: '14px 45px 14px 16px', borderRadius: '16px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '0.9rem' }}
                                            />
                                            <button
                                                disabled={!replyText.trim() || loading}
                                                type="submit"
                                                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'var(--primary)', border: 'none', color: 'white', padding: '8px', borderRadius: '10px', display: 'flex', cursor: 'pointer' }}
                                            >
                                                <Send size={18} />
                                            </button>
                                        </form>
                                    )}
                                </motion.div>
                            )}

                            {view === 'form' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        ← Back to Menu
                                    </button>
                                    <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', gap: '12px', background: '#EEF2FF', padding: '16px', borderRadius: '20px', border: '1px solid #E0E7FF' }}>
                                            <AlertCircle size={20} color="var(--primary)" />
                                            <p style={{ fontSize: '0.8rem', color: '#4338CA', margin: 0, lineHeight: 1.4 }}>
                                                Describe your issue in detail. The team will reply here and on your WhatsApp shortly.
                                            </p>
                                        </div>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Example: I'm having trouble connecting my bank account..."
                                            style={{ flex: 1, minHeight: '140px', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '0.95rem', resize: 'none', outline: 'none', background: 'white' }}
                                        />
                                        <button
                                            disabled={loading || !message.trim()}
                                            type="submit"
                                            className="btn-primary"
                                            style={{ width: '100%', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            {loading ? 'Submitting...' : <><Send size={18} /> Submit Ticket</>}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {view === 'sent' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
                                >
                                    <div style={{ background: '#ECFDF5', color: '#10B981', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <Heart fill="#10B981" size={32} />
                                    </div>
                                    <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem', color: '#1E293B' }}>Ticket Logged!</h4>
                                    <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '10px', lineHeight: 1.5, maxWidth: '280px' }}>
                                        I've passed your message to the team. You'll get a notification when they reply! 🚀
                                    </p>
                                </motion.div>
                            )}

                            {view === 'faq' && activeFaq && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        ← Back to Menu
                                    </button>
                                    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                                        <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)', fontWeight: 900, fontSize: '1.1rem' }}>{activeFaq.q}</h4>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>{activeFaq.a}</p>
                                    </div>
                                    <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '12px' }}>Was this helpful?</p>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button onClick={() => setIsOpen(false)} style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>Yes, thanks!</button>
                                            <button onClick={() => setView('form')} style={{ padding: '10px 20px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>I need more</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setIsOpen(!isOpen); if (!isOpen) setView('menu'); }}
                style={{
                    width: '65px',
                    height: '65px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 12px 35px rgba(59, 130, 246, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}
            >
                {isOpen ? <X size={26} /> : <MessageSquare size={26} />}
                {!isOpen && hasUnreadReply && (
                    <span style={{
                        position: 'absolute', top: '0', right: '0', width: '18px', height: '18px',
                        background: '#EF4444', border: '3px solid white', borderRadius: '50%',
                        fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900
                    }}>!</span>
                )}
            </motion.button>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                @media (max-width: 480px) {
                    .glass-card {
                        width: calc(100vw - 40px) !important;
                        right: 20px !important;
                        bottom: 90px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default SupportHub;
