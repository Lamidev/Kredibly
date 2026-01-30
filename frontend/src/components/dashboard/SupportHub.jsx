import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    MessageSquare,
    MessagesSquare,
    X,
    Send,
    Heart,
    ShieldCheck,
    ChevronRight,
    Clock,
    MessageCircle,
    CheckCircle2,
    Bot,
    Sparkles,
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
    const [unreadReplyCount, setUnreadReplyCount] = useState(0);
    const { profile } = useAuth();

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('lock-scroll');
        } else {
            document.body.classList.remove('lock-scroll');
        }
        return () => document.body.classList.remove('lock-scroll');
    }, [isOpen]);

    useEffect(() => {
        const handleOpen = () => {
            setIsOpen(true);
            setView('tickets');
        };
        window.addEventListener('openSupportHub', handleOpen);
        return () => window.removeEventListener('openSupportHub', handleOpen);
    }, []);

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
                // Filter out the active ticket from the count if it's currently being viewed
                const repliedCount = res.data.data.filter(t => 
                    t.status === 'replied' && !(view === 'chat' && t._id === activeTicket?._id)
                ).length;
                setUnreadReplyCount(repliedCount);

                // Keep active ticket updated
                if (activeTicket) {
                    const updated = res.data.data.find(t => t._id === activeTicket._id);
                    if (updated) {
                        setActiveTicket(updated);
                        if (updated.status === 'replied' && view === 'chat') {
                            axios.patch(`${API_URL}/support/tickets/${updated._id}/seen`, {}, { withCredentials: true })
                                .then(() => {
                                     window.dispatchEvent(new CustomEvent('refreshNotifications'));
                                     fetchTickets();
                                });
                        }
                    }
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

    const handleMarkSeen = async (ticket) => {
        setActiveTicket(ticket);
        setView('chat');

        if (ticket.status === 'replied') {
            try {
                await axios.patch(`${API_URL}/support/tickets/${ticket._id}/seen`, {}, { withCredentials: true });
                window.dispatchEvent(new CustomEvent('refreshNotifications'));
                fetchTickets();
            } catch (err) {
                console.error("Failed to mark ticket as seen", err);
            }
        }
    };

    return createPortal(
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 10000 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="support-hub-card"
                        style={{
                            width: '400px',
                            background: 'white',
                            borderRadius: '28px',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
                            padding: '0',
                            overflow: 'hidden',
                            marginBottom: '20px',
                            border: '1px solid rgba(226, 232, 240, 0.8)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Header */}
                        <div style={{ 
                            background: 'var(--primary)', 
                            padding: '24px', 
                            color: 'white', 
                            position: 'relative', 
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(76, 29, 149, 0.2)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ 
                                            width: '48px', 
                                            height: '48px', 
                                            background: 'white', 
                                            borderRadius: '50%', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                                        }}>
                                            <MessagesSquare color="var(--primary)" size={26} />
                                        </div>
                                        <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', background: '#86EFAC', border: '2.5px solid white', borderRadius: '50%', boxShadow: '0 0 8px #86EFAC' }}></div>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                                            Kreddy 🌿
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, opacity: 0.9 }}>
                                            Online • Ready to help
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => { setIsOpen(false); setView('menu'); }} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '20px', height: '500px', display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

                            {view === 'menu' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ overflowY: 'auto' }} className="no-scrollbar">
                                    <div style={{ background: '#F5F3FF', padding: '16px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #DDD6FE' }}>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 800, margin: 0 }}>
                                            Hey there! {profile?.displayName || 'Chief'} 👋
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: '#6D28D9', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                                            Kreddy is here! Ask me anything about your records, trust score, or business scaling. 🌿
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
                                                    onClick={() => handleMarkSeen(t)}
                                                    style={{ background: 'white', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0', cursor: 'pointer', position: 'relative' }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94A3B8' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                                                        <span style={{
                                                            padding: '2px 8px', borderRadius: '100px', fontSize: '0.6rem', fontWeight: 800,
                                                            background: t.status === 'replied' ? '#EFF6FF' : t.status === 'resolved' ? '#F5F3FF' : '#F1F5F9',
                                                            color: t.status === 'replied' ? 'var(--primary)' : t.status === 'resolved' ? 'var(--primary)' : '#64748B'
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
                                        <button onClick={() => setView('tickets')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            ← List
                                        </button>
                                        {activeTicket.status !== 'resolved' && profile?.role === 'admin' && ( // Only admin can mark resolved
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleResolve(activeTicket._id); }}
                                                style={{ background: '#F5F3FF', border: 'none', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <CheckCircle2 size={12} /> Mark Resolved
                                            </button>
                                        )}
                                    </div>

                                    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }} className="no-scrollbar">
                                        <div style={{ alignSelf: 'flex-end', maxWidth: '85%', background: 'var(--primary)', color: 'white', padding: '12px 16px', borderRadius: '16px 16px 4px 16px', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)' }}>
                                            {activeTicket.message}
                                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', marginTop: '6px', textAlign: 'right' }}>{new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>

                                        {activeTicket.replies.map((r, idx) => (
                                            <div key={idx} style={{
                                                alignSelf: r.sender === 'admin' ? 'flex-start' : 'flex-end',
                                                maxWidth: '85%',
                                                background: r.sender === 'admin' ? '#F1F5F9' : 'var(--primary)',
                                                color: r.sender === 'admin' ? '#1E293B' : 'white',
                                                padding: '12px 16px',
                                                borderRadius: r.sender === 'admin' ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                                                fontSize: '0.9rem',
                                                boxShadow: r.sender === 'admin' ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.2)'
                                            }}>
                                                {r.message}
                                                <div style={{ fontSize: '0.65rem', color: r.sender === 'admin' ? '#94A3B8' : 'rgba(255,255,255,0.7)', marginTop: '6px', textAlign: r.sender === 'admin' ? 'left' : 'right' }}>
                                                    {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        ))}

                                        {activeTicket.status === 'resolved' && (
                                            <div style={{ padding: '16px', background: '#F5F3FF', borderRadius: '16px', border: '1px solid #DDD6FE', textAlign: 'center' }}>
                                                <CheckCircle2 size={24} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                                                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>Ticket Closed</p>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--primary)', opacity: 0.8 }}>This conversation has ended.</p>
                                            </div>
                                        )}
                                    </div>

                                    {activeTicket.status !== 'resolved' && (
                                        <form onSubmit={handleReply} style={{ marginTop: '16px', position: 'relative', flexShrink: 0 }}>
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
                                    <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
                                        <div style={{ display: 'flex', gap: '12px', background: '#EEF2FF', padding: '16px', borderRadius: '20px', border: '1px solid #E0E7FF', flexShrink: 0 }}>
                                            <AlertCircle size={20} color="var(--primary)" />
                                            <p style={{ fontSize: '0.8rem', color: '#4338CA', margin: 0, lineHeight: 1.4 }}>
                                                Describe your issue in detail. The team will reply here and on your WhatsApp shortly.
                                            </p>
                                        </div>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Example: I'm having trouble connecting my bank account..."
                                            style={{ flex: 1, minHeight: '100px', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '0.95rem', resize: 'none', outline: 'none', background: 'white' }}
                                        />
                                        <button
                                            disabled={loading || !message.trim()}
                                            type="submit"
                                            className="btn-primary"
                                            style={{ width: '100%', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexShrink: 0 }}
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
                                    <div style={{ background: '#F5F3FF', color: 'var(--primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <Heart fill="var(--primary)" size={32} />
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
                    boxShadow: '0 12px 35px rgba(76, 29, 149, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}
            >
                {isOpen ? <X size={26} /> : <div style={{ position: 'relative' }}><MessagesSquare size={26} /></div>}
                {!isOpen && unreadReplyCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '0', right: '0', width: '22px', height: '22px',
                        background: '#EF4444', border: '3px solid white', borderRadius: '50%',
                        fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900
                    }}>{unreadReplyCount}</span>
                )}
            </motion.button>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                
                @media (max-width: 480px) {
                    .support-hub-card {
                        width: calc(100vw - 32px) !important;
                        right: 16px !important;
                        bottom: 80px !important;
                        position: fixed !important;
                        height: calc(100dvh - 120px) !important;
                        max-height: 600px !important;
                    }
                    div[style*="height: 500px"] {
                        height: 100% !important;
                        min-height: 0 !important;
                    }
                }
                
                @media (min-width: 481px) {
                    .support-hub-card {
                        max-height: calc(100vh - 150px);
                    }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default SupportHub;
