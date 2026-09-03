import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
    MessageSquare, ShieldCheck, RefreshCw, Clock, X, CheckCircle2,
    Trash2, AlertTriangle, Send, Search, Smartphone, Globe,
    ChevronLeft, User, ExternalLink, Check, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { API_URL } from '../../config';

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'open', 'resolved'
    const [replyText, setReplyText] = useState('');
    const [processingId, setProcessingId] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [resolveModal, setResolveModal] = useState({ show: false, ticketId: null });
    const [deleteModal, setDeleteModal] = useState({ show: false, ticketId: null });

    const chatEndRef = useRef(null);
    const replyInputRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 25000); // Polling for new incoming messages
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll chat to bottom when active ticket or its replies change
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedTicketId, tickets]);

    const fetchTickets = async (maintainSelection = true) => {
        try {
            const res = await axios.get(`${API_URL}/support/tickets/all`, { withCredentials: true });
            if (res.data.success) {
                const fetched = res.data.data;
                setTickets(fetched);

                // Auto-select first ticket on initial load if none selected
                if (!maintainSelection || !selectedTicketId) {
                    if (fetched.length > 0 && !selectedTicketId && window.innerWidth >= 768) {
                        setSelectedTicketId(fetched[0]._id);
                    }
                }
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) return;
            toast.error("Failed to load support tickets.");
        } finally {
            setLoading(false);
        }
    };

    const selectedTicket = tickets.find(t => t._id === selectedTicketId) || null;

    const handleSendReply = async (e) => {
        if (e) e.preventDefault();
        if (!replyText.trim() || !selectedTicket || processingId === selectedTicket._id) return;

        const ticketId = selectedTicket._id;
        const msgToSend = replyText.trim();
        setProcessingId(ticketId);

        try {
            const res = await axios.patch(`${API_URL}/support/tickets/${ticketId}/reply`, {
                message: msgToSend,
                sender: 'admin'
            }, { withCredentials: true });

            if (res.data.success) {
                toast.success(
                    selectedTicket.source === 'whatsapp' 
                        ? "Reply dispatched directly to merchant's WhatsApp." 
                        : "Reply posted to dashboard and notification sent."
                );
                setReplyText('');
                await fetchTickets(true);
                if (replyInputRef.current) replyInputRef.current.focus();
            }
        } catch (err) {
            console.error("Reply error:", err);
            toast.error("Could not send reply.");
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
            toast.success("Ticket marked as resolved.");
            await fetchTickets(true);
        } catch (err) {
            toast.error("Could not update status.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReopenTicket = async (ticketId) => {
        if (!ticketId) return;
        setProcessingId(ticketId);
        try {
            await axios.patch(`${API_URL}/support/tickets/${ticketId}/reply`, {
                message: "Ticket reopened by support team.",
                sender: 'admin'
            }, { withCredentials: true });
            toast.success("Ticket reopened.");
            await fetchTickets(true);
        } catch (err) {
            toast.error("Could not reopen ticket.");
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
            toast.success("Ticket deleted.");
            if (selectedTicketId === ticketId) {
                setSelectedTicketId(null);
            }
            await fetchTickets(false);
        } catch (err) {
            toast.error("Deletion failed.");
        } finally {
            setProcessingId(null);
        }
    };

    // Filter tickets
    const filteredTickets = tickets.filter(t => {
        const matchesStatus = 
            statusFilter === 'all' ? true :
            statusFilter === 'open' ? (t.status === 'open' || t.status === 'replied') :
            t.status === 'resolved';

        const q = searchQuery.toLowerCase().trim();
        if (!q) return matchesStatus;

        const bizName = (t.businessId?.displayName || '').toLowerCase();
        const userName = (t.userId?.name || '').toLowerCase();
        const userEmail = (t.userId?.email || '').toLowerCase();
        const msg = (t.message || '').toLowerCase();
        const shortId = t._id.toString().slice(-6).toLowerCase();

        const matchesQuery = bizName.includes(q) || userName.includes(q) || userEmail.includes(q) || msg.includes(q) || shortId.includes(q);

        return matchesStatus && matchesQuery;
    });

    const openCount = tickets.filter(t => t.status === 'open' || t.status === 'replied').length;

    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 140px)' }}>
                <div className="skeleton" style={{ width: '360px', height: '100%', borderRadius: '24px' }} />
                <div className="skeleton" style={{ flex: 1, height: '100%', borderRadius: '24px' }} />
            </div>
        );
    }

    return (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top Stat Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                            Customer Support
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', fontWeight: 500 }}>
                            Direct two-way customer support across Web Dashboard and WhatsApp
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => fetchTickets(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '10px',
                            background: '#F8FAFC', border: '1px solid #E2E8F0',
                            fontSize: '0.8rem', fontWeight: 700, color: '#475569',
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={14} className={processingId ? 'spin-animation' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Main 2-Column Container */}
            <div style={{
                flex: 1,
                display: 'flex',
                background: '#FFFFFF',
                borderRadius: '24px',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                minHeight: 0
            }}>
                {/* ── LEFT COLUMN: Ticket List ── */}
                <div style={{
                    width: isMobile ? '100%' : '360px',
                    minWidth: isMobile ? '100%' : '340px',
                    borderRight: isMobile ? 'none' : '1px solid #F1F5F9',
                    display: isMobile && selectedTicketId ? 'none' : 'flex',
                    flexDirection: 'column',
                    background: '#FAFBFD'
                }}>
                    {/* Search & Filters */}
                    <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search by merchant, email, ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '9px 12px 9px 36px',
                                    borderRadius: '12px',
                                    border: '1px solid #E2E8F0',
                                    background: '#FFFFFF',
                                    fontSize: '0.82rem',
                                    fontWeight: 500,
                                    outline: 'none',
                                    color: '#0F172A'
                                }}
                            />
                        </div>

                        {/* Status Filter Pills */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {[
                                { key: 'all', label: `All (${tickets.length})` },
                                { key: 'open', label: `Active (${openCount})` },
                                { key: 'resolved', label: `Resolved (${tickets.length - openCount})` }
                            ].map(filter => (
                                <button
                                    key={filter.key}
                                    onClick={() => setStatusFilter(filter.key)}
                                    style={{
                                        flex: 1,
                                        padding: '6px 8px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: statusFilter === filter.key ? '#7C3AED' : '#F1F5F9',
                                        color: statusFilter === filter.key ? '#FFFFFF' : '#64748B',
                                        fontSize: '0.72rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ticket Items List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                        {filteredTickets.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                                <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>No tickets found</p>
                            </div>
                        ) : (
                            filteredTickets.map(t => {
                                const isSelected = selectedTicketId === t._id;
                                const isResolved = t.status === 'resolved';
                                const isWhatsapp = t.source === 'whatsapp';
                                const plan = t.businessId?.plan || 'hustler';
                                const merchantName = t.businessId?.displayName || t.userId?.name || 'Merchant';
                                const shortId = t._id.toString().slice(-6);
                                const lastReply = t.replies && t.replies.length > 0 ? t.replies[t.replies.length - 1] : null;
                                const previewSnippet = lastReply ? lastReply.message : t.message;

                                return (
                                    <div
                                        key={t._id}
                                        onClick={() => setSelectedTicketId(t._id)}
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: '14px',
                                            marginBottom: '6px',
                                            cursor: 'pointer',
                                            background: isSelected ? '#FFFFFF' : 'transparent',
                                            border: isSelected ? '1.5px solid #7C3AED' : '1.5px solid transparent',
                                            boxShadow: isSelected ? '0 4px 12px rgba(124,58,237,0.08)' : 'none',
                                            transition: 'all 0.15s ease',
                                            opacity: isResolved ? 0.65 : 1
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 800,
                                                    color: '#7C3AED',
                                                    background: 'rgba(124,58,237,0.08)',
                                                    padding: '2px 6px',
                                                    borderRadius: '6px'
                                                }}>
                                                    #{shortId}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    padding: '2px 6px',
                                                    borderRadius: '6px',
                                                    background: isWhatsapp ? '#DCFCE7' : '#F1F5F9',
                                                    color: isWhatsapp ? '#15803D' : '#475569',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '3px'
                                                }}>
                                                    {isWhatsapp ? <Smartphone size={10} /> : <Globe size={10} />}
                                                    {isWhatsapp ? 'WhatsApp' : 'Dashboard'}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
                                                {formatTimeAgo(lastReply?.createdAt || t.createdAt)}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <h4 style={{
                                                margin: 0,
                                                fontSize: '0.88rem',
                                                fontWeight: 800,
                                                color: '#0F172A',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                maxWidth: '180px'
                                            }}>
                                                {merchantName}
                                            </h4>
                                            <span style={{
                                                fontSize: '0.62rem',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                color: plan === 'chairman' ? '#7C3AED' : plan === 'oga' ? '#2563EB' : '#64748B'
                                            }}>
                                                {plan}
                                            </span>
                                        </div>

                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.78rem',
                                            color: '#64748B',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            lineHeight: 1.4
                                        }}>
                                            {lastReply?.sender === 'admin' && <span style={{ color: '#7C3AED', fontWeight: 700 }}>You: </span>}
                                            {previewSnippet}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── RIGHT COLUMN: Conversation Chat Area ── */}
                <div style={{
                    flex: 1,
                    display: isMobile && !selectedTicketId ? 'none' : 'flex',
                    flexDirection: 'column',
                    background: '#FFFFFF',
                    minWidth: 0
                }}>
                    {!selectedTicket ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#94A3B8', textAlign: 'center' }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: '#F8FAFC', border: '1px solid #E2E8F0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '16px', color: '#94A3B8'
                            }}>
                                <MessageSquare size={28} />
                            </div>
                            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 800, color: '#334155' }}>
                                No Conversation Selected
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', maxWidth: '300px' }}>
                                Select a support ticket from the list on the left to read and respond to the customer.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #F1F5F9',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: '#FFFFFF'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                                    {isMobile && (
                                        <button
                                            onClick={() => setSelectedTicketId(null)}
                                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#64748B' }}
                                        >
                                            <ChevronLeft size={22} />
                                        </button>
                                    )}
                                    <div style={{
                                        width: '42px', height: '42px', borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#FFFFFF', fontWeight: 900, fontSize: '1rem', flexShrink: 0
                                    }}>
                                        {(selectedTicket.businessId?.displayName || selectedTicket.userId?.name || 'M').charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {selectedTicket.businessId?.displayName || 'Merchant'}
                                            </h3>
                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                padding: '2px 8px',
                                                borderRadius: '100px',
                                                background: selectedTicket.businessId?.plan === 'chairman' ? 'rgba(124,58,237,0.1)' : '#F1F5F9',
                                                color: selectedTicket.businessId?.plan === 'chairman' ? '#7C3AED' : '#475569'
                                            }}>
                                                {selectedTicket.businessId?.plan || 'Hustler'}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {selectedTicket.userId?.email || 'No email'} 
                                            {selectedTicket.businessId?.whatsappNumber && (
                                                <span> &bull; +{selectedTicket.businessId.whatsappNumber}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                    {selectedTicket.status !== 'resolved' ? (
                                        <button
                                            onClick={() => setResolveModal({ show: true, ticketId: selectedTicket._id })}
                                            disabled={processingId === selectedTicket._id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '7px 12px', borderRadius: '10px',
                                                background: '#DCFCE7', border: '1px solid #BBF7D0',
                                                fontSize: '0.75rem', fontWeight: 800, color: '#15803D',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Check size={14} /> Mark Resolved
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleReopenTicket(selectedTicket._id)}
                                            disabled={processingId === selectedTicket._id}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '7px 12px', borderRadius: '10px',
                                                background: '#F1F5F9', border: '1px solid #E2E8F0',
                                                fontSize: '0.75rem', fontWeight: 800, color: '#475569',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <RotateCcw size={14} /> Reopen
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setDeleteModal({ show: true, ticketId: selectedTicket._id })}
                                        disabled={processingId === selectedTicket._id}
                                        style={{
                                            padding: '7px 10px', borderRadius: '10px',
                                            background: '#FEF2F2', border: '1px solid #FEE2E2',
                                            color: '#EF4444', cursor: 'pointer'
                                        }}
                                        title="Delete ticket"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Scroll Area */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                background: '#F8FAFC'
                            }}>
                                {/* Ticket Meta Pill */}
                                <div style={{ textAlign: 'center', margin: '4px 0 10px 0' }}>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        color: '#64748B',
                                        background: '#FFFFFF',
                                        border: '1px solid #E2E8F0',
                                        padding: '4px 12px',
                                        borderRadius: '100px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        Ticket #{selectedTicket._id.toString().slice(-6)} &bull; Opened {new Date(selectedTicket.createdAt).toLocaleDateString()} at {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} via {selectedTicket.source === 'whatsapp' ? 'WhatsApp' : 'Web Dashboard'}
                                    </span>
                                </div>

                                {/* Customer Initial Request Bubble */}
                                <div style={{
                                    alignSelf: 'flex-start',
                                    maxWidth: '80%',
                                    background: '#FFFFFF',
                                    border: '1.5px solid #E2E8F0',
                                    borderRadius: '18px 18px 18px 4px',
                                    padding: '14px 16px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase' }}>
                                            {selectedTicket.businessId?.displayName || 'Customer'} (Initial Request)
                                        </span>
                                        <span style={{ fontSize: '0.62rem', color: '#94A3B8', fontWeight: 600 }}>
                                            {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0F172A', lineHeight: 1.55, fontWeight: 500, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                        {selectedTicket.message}
                                    </p>
                                </div>

                                {/* Replies Stream */}
                                {(selectedTicket.replies || []).map((reply, idx) => {
                                    const isAdmin = reply.sender === 'admin';
                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                                                maxWidth: '80%',
                                                background: isAdmin ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)' : '#FFFFFF',
                                                color: isAdmin ? '#FFFFFF' : '#0F172A',
                                                border: isAdmin ? 'none' : '1.5px solid #E2E8F0',
                                                borderRadius: isAdmin ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                padding: '14px 16px',
                                                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '6px' }}>
                                                <span style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 800,
                                                    color: isAdmin ? 'rgba(255,255,255,0.85)' : '#64748B',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {isAdmin ? 'You (Support Team)' : selectedTicket.businessId?.displayName || 'Merchant'}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.62rem',
                                                    color: isAdmin ? 'rgba(255,255,255,0.7)' : '#94A3B8',
                                                    fontWeight: 600
                                                }}>
                                                    {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.9rem',
                                                lineHeight: 1.55,
                                                fontWeight: 500,
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                color: isAdmin ? '#FFFFFF' : '#0F172A'
                                            }}>
                                                {reply.message}
                                            </p>
                                        </div>
                                    );
                                })}

                                {selectedTicket.status === 'resolved' && (
                                    <div style={{ textAlign: 'center', margin: '12px 0' }}>
                                        <span style={{
                                            fontSize: '0.72rem',
                                            fontWeight: 700,
                                            color: '#15803D',
                                            background: '#DCFCE7',
                                            border: '1px solid #BBF7D0',
                                            padding: '4px 14px',
                                            borderRadius: '100px'
                                        }}>
                                            Ticket marked as resolved
                                        </span>
                                    </div>
                                )}

                                <div ref={chatEndRef} />
                            </div>

                            {/* Reply Input Box */}
                            <div style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9', background: '#FFFFFF' }}>
                                {selectedTicket.status === 'resolved' ? (
                                    <div style={{
                                        padding: '12px', textAlign: 'center', background: '#F8FAFC',
                                        borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '0.82rem', color: '#64748B'
                                    }}>
                                        This ticket is resolved.{' '}
                                        <button
                                            onClick={() => handleReopenTicket(selectedTicket._id)}
                                            style={{ background: 'none', border: 'none', color: '#7C3AED', fontWeight: 800, cursor: 'pointer' }}
                                        >
                                            Reopen ticket
                                        </button>{' '}
                                        to continue the conversation.
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendReply}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                                            <textarea
                                                ref={replyInputRef}
                                                rows={2}
                                                placeholder={`Reply to ${selectedTicket.businessId?.displayName || 'merchant'}... (Ctrl+Enter to send)`}
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                        e.preventDefault();
                                                        handleSendReply();
                                                    }
                                                }}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 14px',
                                                    borderRadius: '12px',
                                                    border: '1.5px solid #E2E8F0',
                                                    background: '#F8FAFC',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 500,
                                                    fontFamily: 'inherit',
                                                    outline: 'none',
                                                    resize: 'none',
                                                    lineHeight: 1.45,
                                                    color: '#0F172A'
                                                }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={!replyText.trim() || processingId === selectedTicket._id}
                                                style={{
                                                    padding: '12px 18px',
                                                    borderRadius: '12px',
                                                    background: replyText.trim() && processingId !== selectedTicket._id ? '#7C3AED' : '#CBD5E1',
                                                    border: 'none',
                                                    color: '#FFFFFF',
                                                    cursor: replyText.trim() && processingId !== selectedTicket._id ? 'pointer' : 'default',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontWeight: 700,
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                {processingId === selectedTicket._id ? (
                                                    <RefreshCw size={16} className="spin-animation" />
                                                ) : (
                                                    <>
                                                        <Send size={16} />
                                                        Send
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 500 }}>
                                            {selectedTicket.source === 'whatsapp'
                                                ? 'Delivery: Reply will be sent directly to merchant\'s WhatsApp via Kreddy.'
                                                : 'Delivery: Reply will appear on merchant\'s dashboard and be sent to their email.'}
                                        </p>
                                    </form>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Resolve Confirmation Modal */}
            {resolveModal.show && createPortal(
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '20px', padding: '24px',
                        maxWidth: '380px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <Check size={22} />
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                            Mark Ticket Resolved?
                        </h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>
                            The ticket will be archived in the Resolved tab. If the merchant sends another message, it will automatically reopen.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setResolveModal({ show: false, ticketId: null })}
                                style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.82rem', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmResolve}
                                style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: '#15803D', fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
                            >
                                Confirm Resolve
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.show && createPortal(
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <div style={{
                        background: '#FFFFFF', borderRadius: '20px', padding: '24px',
                        maxWidth: '380px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <Trash2 size={22} />
                        </div>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                            Delete Ticket?
                        </h3>
                        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5 }}>
                            This will permanently remove this ticket from the system. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setDeleteModal({ show: false, ticketId: null })}
                                style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.82rem', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                style={{ padding: '9px 18px', borderRadius: '10px', border: 'none', background: '#EF4444', fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminSupport;
