import React, { useState, useEffect, useRef } from 'react';
import {
    MessagesSquare,
    Send,
    Heart,
    ChevronRight,
    Clock,
    CheckCircle2,
    Bot,
    AlertCircle,
    X,
    Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const HelpPage = () => {
    const [view, setView] = useState('menu'); // 'menu', 'faq', 'form', 'sent', 'tickets', 'chat'
    const [activeTicket, setActiveTicket] = useState(null);
    const [activeFaq, setActiveFaq] = useState(null);
    const [message, setMessage] = useState('');
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    const [tickets, setTickets] = useState([]);
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
            setTimeout(() => setView('menu'), 2500);
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
            toast.success("Ticket resolved!");
            fetchTickets();
            if (activeTicket?._id === ticketId) setView('tickets');
        } catch (err) {
            toast.error("Failed to resolve ticket");
        }
    };

    const openChat = (ticket) => {
        setActiveTicket(ticket);
        setView('chat');
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.04em' }}>Help & Support</h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1.1rem' }}>Instant access to Kreddy AI and our founding team.</p>
            </div>

            <div style={{ 
                maxWidth: '800px', 
                margin: '0 auto',
                background: 'white',
                borderRadius: '32px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-premium)',
                height: '700px',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                {/* Header Section */}
                <div style={{ 
                    background: 'var(--primary)', 
                    padding: '32px', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'white',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Bot size={32} color="var(--primary)" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Kreddy Assistant</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', opacity: 0.9 }}>
                            <span style={{ width: '8px', height: '8px', background: '#86EFAC', borderRadius: '50%' }}></span>
                            Official Support Channel
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, padding: '32px', background: '#F8FAFC', overflowY: 'auto' }} className="no-scrollbar">
                    <AnimatePresence mode="wait">
                        {view === 'menu' && (
                            <motion.div key="menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', marginBottom: '32px' }}>
                                    <p style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '8px' }}>Hey {profile?.displayName?.split(' ')[0]}! 👋</p>
                                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontWeight: 500 }}>I'm Kreddy, your business growth engine. Need help with a sale, a debt record, or just want to tell us how to improve? I'm listening!</p>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                                    <button onClick={() => setView('form')} style={{ background: 'white', border: '1px solid var(--border)', padding: '24px', borderRadius: '24px', textAlign: 'left', cursor: 'pointer', transition: '0.2s' }}>
                                        <div style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                            <Send size={20} />
                                        </div>
                                        <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>New Support Request</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ask a question or report an issue directly to the founders.</p>
                                    </button>

                                    <button onClick={() => setView('tickets')} style={{ background: 'white', border: '1px solid var(--border)', padding: '24px', borderRadius: '24px', textAlign: 'left', cursor: 'pointer' }}>
                                        <div style={{ background: 'var(--warning)', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                            <Clock size={20} />
                                        </div>
                                        <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>Request History</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{tickets.length} conversation(s) recorded in your support log.</p>
                                    </button>
                                </div>

                                <div style={{ background: '#F5F3FF', padding: '24px', borderRadius: '24px', border: '1px solid #DDD6FE' }}>
                                    <h4 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}> <Sparkles size={18} /> Daily Pro-Tip</h4>
                                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#6D28D9', lineHeight: 1.6, fontWeight: 500 }}>
                                        Did you know? Sending payment links to customers increases your Trust Score, which unlocks future credit features for your business!
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {view === 'form' && (
                            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ← Back to Support Home
                                </button>
                                <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                    <h3 style={{ fontWeight: 900, marginBottom: '24px' }}>How can we help you today?</h3>
                                    <textarea 
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Describe your issue or question in detail..."
                                        style={{ width: '100%', minHeight: '160px', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '1rem', resize: 'none', outline: 'none', marginBottom: '24px' }}
                                    />
                                    <button 
                                        onClick={handleSubmit}
                                        disabled={loading || !message.trim()}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '20px', borderRadius: '16px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                                    >
                                        <Send size={20} /> {loading ? 'Sending Request...' : 'Send to Founders'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {view === 'tickets' && (
                            <motion.div key="tickets" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <button onClick={() => setView('menu')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ← Back to Support Home
                                </button>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {tickets.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)' }}>
                                            <p style={{ fontWeight: 700, color: 'var(--text-muted)' }}>No support history found.</p>
                                        </div>
                                    ) : (
                                        tickets.map(t => (
                                            <div 
                                                key={t._id} 
                                                onClick={() => openChat(t)}
                                                style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative' }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</span>
                                                    <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, background: t.status === 'replied' ? '#EFF6FF' : '#F1F5F9', color: t.status === 'replied' ? 'var(--primary)' : 'var(--text-muted)' }}>{t.status.toUpperCase()}</span>
                                                </div>
                                                <p style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {view === 'chat' && activeTicket && (
                           <motion.div key="chat" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <button onClick={() => setView('tickets')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        ← Back to List
                                    </button>
                                    {activeTicket.status !== 'resolved' && (
                                        <button onClick={() => handleResolve(activeTicket._id)} style={{ background: '#F5F3FF', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 800, padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <CheckCircle2 size={16} /> Mark Resolved
                                        </button>
                                    )}
                                </div>

                                <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '12px' }} className="no-scrollbar">
                                    {/* Original Message */}
                                    <div style={{ alignSelf: 'flex-end', maxWidth: '80%', background: 'var(--primary)', color: 'white', padding: '16px 20px', borderRadius: '24px 24px 4px 24px', boxShadow: 'var(--shadow-premium)' }}>
                                        <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.5 }}>{activeTicket.message}</p>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', opacity: 0.7, textAlign: 'right' }}>{new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>

                                    {/* Replies */}
                                    {activeTicket.replies.map((r, idx) => (
                                        <div key={idx} style={{ 
                                            alignSelf: r.sender === 'admin' ? 'flex-start' : 'flex-end',
                                            maxWidth: '80%',
                                            background: r.sender === 'admin' ? 'white' : 'var(--primary)',
                                            color: r.sender === 'admin' ? 'var(--text)' : 'white',
                                            padding: '16px 20px',
                                            borderRadius: r.sender === 'admin' ? '24px 24px 24px 4px' : '24px 24px 4px 24px',
                                            border: r.sender === 'admin' ? '1px solid var(--border)' : 'none',
                                            boxShadow: 'var(--shadow-premium)'
                                        }}>
                                            <p style={{ margin: 0, fontWeight: 500, lineHeight: 1.5 }}>{r.message}</p>
                                            <p style={{ margin: '8px 0 0 0', fontSize: '0.7rem', opacity: 0.7, textAlign: r.sender === 'admin' ? 'left' : 'right' }}>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    ))}
                                </div>

                                {activeTicket.status !== 'resolved' && (
                                    <form onSubmit={handleReply} style={{ marginTop: '24px', position: 'relative' }}>
                                        <input 
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Type your message..."
                                            style={{ width: '100%', padding: '18px 60px 18px 24px', borderRadius: '20px', border: '1px solid var(--border)', background: 'white', outline: 'none', fontSize: '1rem' }}
                                        />
                                        <button type="submit" disabled={!replyText.trim() || loading} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'var(--primary)', color: 'white', border: 'none', height: '44px', width: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <Send size={20} />
                                        </button>
                                    </form>
                                )}
                           </motion.div>
                        )}

                        {view === 'sent' && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', py: '60px' }}>
                                <div style={{ background: '#F5F3FF', color: 'var(--primary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <Heart fill="var(--primary)" size={36} />
                                </div>
                                <h3 style={{ fontWeight: 900, fontSize: '1.6rem', marginBottom: '12px' }}>Request Received</h3>
                                <p style={{ color: 'var(--text-muted)', fontWeight: 600, maxWidth: '300px', margin: '0 auto' }}>We've received your message. A founder will reply shortly, and you'll get a notification on WhatsApp too!</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default HelpPage;
