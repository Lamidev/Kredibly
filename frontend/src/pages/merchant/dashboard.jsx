import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSales } from "../../context/SaleContext";
import { useAuth } from "../../context/AuthContext";
import { 
    Plus, Wallet, Clock, CheckCircle, ChevronRight, 
    TrendingUp, Users, MessagesSquare, Trash2, Shield, 
    ArrowUpRight, Activity, Zap, Sparkles
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { KREDDY_CONFIG } from "../../config/kreddy";

import { createPortal } from "react-dom";

const Dashboard = () => {
    const { stats, sales, fetchSales, fetchStats, loading, deleteSale } = useSales();
    const { profile, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [whatsappInput, setWhatsappInput] = useState("");
    const [updatingWhatsapp, setUpdatingWhatsapp] = useState(false);
    const [activities, setActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [visibleSales, setVisibleSales] = useState(5);
    const [deleteModal, setDeleteModal] = useState({ show: false, sale: null });

    useEffect(() => {
        fetchSales();
        fetchStats();
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.get(`${API_URL}/business/activity-logs`, { withCredentials: true });
            if (res.data.success) setActivities(res.data.data);
        } catch (err) {
            console.error("Failed to fetch activities");
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleDelete = async (e, sale) => {
        e.stopPropagation();
        setDeleteModal({ show: true, sale });
    };

    const confirmDelete = async () => {
        try {
            await deleteSale(deleteModal.sale._id);
            toast.success("Record deleted successfully");
            setDeleteModal({ show: false, sale: null });
        } catch (err) {
            toast.error("Failed to delete record");
            setDeleteModal({ show: false, sale: null });
        }
    };

    const handleUpdateWhatsapp = async () => {
        if (!whatsappInput || whatsappInput.length < 10) {
            return toast.error("Please enter a valid WhatsApp number (e.g. 23480...)");
        }

        setUpdatingWhatsapp(true);
        try {
            await updateProfile({ ...profile, whatsappNumber: whatsappInput });
            toast.success("WhatsApp number linked! Opening chat...");
            setWhatsappInput("");
            
            // Auto-redirect to WhatsApp to start the conversation
            setTimeout(() => {
                window.open(KREDDY_CONFIG.getLink(), '_blank');
            }, 1000);
            
        } catch (err) {
            toast.error("Failed to update WhatsApp number");
        } finally {
            setUpdatingWhatsapp(false);
        }
    };

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    if (loading && !sales.length) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px', position: 'relative' }}>
            {/* Floating WhatsApp Button */}
            <a 
                href={KREDDY_CONFIG.getLink()}
                target="_blank" 
                rel="noreferrer"
                style={{
                    position: 'fixed',
                    bottom: '90px',
                    right: '25px',
                    width: '60px',
                    height: '60px',
                    background: '#25D366',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 40px -10px rgba(37, 211, 102, 0.5)',
                    zIndex: 2500,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                }}
                className="hover-scale"
                title="Chat with Kreddy"
            >
                <MessagesSquare size={28} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '14px', height: '14px', background: 'red', border: '2px solid white', borderRadius: '50%' }}></div>
            </a>

            {/* Executive Header */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', marginBottom: '4px', letterSpacing: '-0.04em' }}>
                        {greeting()}, {profile?.displayName?.split(' ')[0] || 'Founder'}.
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
                        Here's your business overview.
                    </p>
                </div>

                {/* Plan Badge */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ 
                        padding: '10px 20px', 
                        borderRadius: '16px', 
                        background: profile?.plan === 'chairman' ? 'linear-gradient(135deg, #0F172A 0%, #334155 100%)' : 
                                    profile?.plan === 'oga' ? 'linear-gradient(135deg, #B45309 0%, #D97706 100%)' : 
                                    '#F1F5F9',
                        color: profile?.plan === 'hustler' ? '#64748B' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)',
                        border: '1px solid rgba(0,0,0,0.05)'
                    }}
                >
                    <div style={{ 
                        width: '32px', height: '32px', borderRadius: '10px', 
                        background: 'rgba(255,255,255,0.2)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                        {profile?.plan === 'chairman' ? <Shield size={18} /> : 
                         profile?.plan === 'oga' ? <Zap size={18} fill="white" /> : 
                         <Activity size={18} />}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em', marginBottom: '-2px' }}>Account Status</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.02em' }}>
                            {profile?.plan?.toUpperCase() || 'HUSTLER'}
                            {profile?.isFoundingMember && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#4ADE80' }}>★ FOUNDER</span>}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Premium Stats Bento Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '20px',
                marginBottom: '40px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="dashboard-glass stat-card-premium" 
                    style={{ padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', background: 'white' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '10px', borderRadius: '14px' }}>
                            <Wallet size={20} strokeWidth={2.5} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 10px', borderRadius: '100px' }}>LIVE</span>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>Revenue</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>
                            ₦{stats?.revenue?.toLocaleString() || 0}
                        </h2>
                    </div>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="dashboard-glass stat-card-premium" 
                    style={{ padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', background: 'white' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '10px', borderRadius: '14px' }}>
                            <Clock size={20} strokeWidth={2.5} />
                        </div>
                        <ArrowUpRight size={18} color="var(--warning)" />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>Unpaid</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--warning)', letterSpacing: '-0.03em' }}>
                        ₦{stats?.outstanding?.toLocaleString() || 0}
                    </h2>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="stat-card-premium" 
                    style={{ 
                        padding: '24px', 
                        borderRadius: '28px', 
                        background: 'linear-gradient(135deg, var(--primary) 0%, #6D28D9 100%)',
                        color: 'white',
                        boxShadow: '0 20px 40px -10px var(--primary-glow)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '14px' }}>
                            <Shield size={20} strokeWidth={2.5} />
                        </div>
                        <Zap size={18} color="white" fill="white" />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, marginBottom: '4px' }}>Trust Score</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 950, letterSpacing: '-0.03em' }}>{stats?.trustScore || 85}%</h2>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '100px' }}>Good</span>
                    </div>
                </motion.div>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', 
                gap: '20px', 
                width: '100%',
                boxSizing: 'border-box'
            }} className="dashboard-main-grid">
                {/* Left Column: Recent Activity */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px', paddingRight: '4px' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>Recent Activity</h3>
                        <Link to="/sales" style={{ padding: '8px 16px', background: 'var(--background)', color: 'var(--primary)', textDecoration: 'none', borderRadius: '100px', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border)' }}>
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sales.length === 0 ? (
                            <div style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--background)', borderRadius: '32px', border: '2px dashed var(--border)' }}>
                                <div style={{ background: 'white', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: 'var(--shadow-premium)' }}>
                                    <Activity size={32} color="#CBD5E1" />
                                </div>
                                <h4 style={{ fontWeight: 800, color: 'var(--text-muted)' }}>The ledger is empty.</h4>
                                <p style={{ color: '#94A3B8', fontWeight: 500, marginTop: '8px' }}>Record your first sale to start building your trust score.</p>
                            </div>
                        ) : (
                            sales.slice(0, visibleSales).map(sale => (
                                <motion.div
                                    key={sale._id}
                                    whileHover={{ x: 4, scale: 1.01 }}
                                    className="dashboard-glass"
                                    style={{ 
                                        padding: '16px 20px', 
                                        display: 'flex', 
                                        flexDirection: 'row',
                                        justifyContent: 'space-between', 
                                        alignItems: 'center', 
                                        cursor: 'pointer', 
                                        borderRadius: '18px', 
                                        border: '1px solid var(--border)',
                                        background: 'white',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        marginBottom: '12px'
                                    }}
                                    onClick={() => navigate(`/dashboard/invoice/${sale.invoiceNumber}`)}
                                >
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 2 }}>
                                        <div style={{
                                            background: sale.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            padding: '10px',
                                            borderRadius: '12px',
                                            color: sale.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                                            flexShrink: 0
                                        }}>
                                            {sale.status === 'paid' ? <CheckCircle size={20} strokeWidth={2.5} /> : <Clock size={20} strokeWidth={2.5} />}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <p style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.95rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sale.customerName || 'Standard Order'}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>#{sale.invoiceNumber}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                            <p style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '2px' }}>₦{sale.totalAmount.toLocaleString()}</p>
                                            <span className="premium-badge" style={{ 
                                                background: sale.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: sale.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                                                textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800,
                                                padding: '2px 8px', borderRadius: '6px'
                                            }}
                                            >
                                                {sale.status === 'paid' ? 'PAID' : sale.status === 'partial' ? 'PARTIAL' : 'UNPAID'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={(e) => handleDelete(e, sale)}
                                                style={{ background: 'white', color: 'var(--error)', border: '1px solid #FEE2E2', padding: '6px', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Delete Record"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Column: Sidebar Widgets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Kreddy AI Status Card */}
                    {!profile?.whatsappNumber ? (
                        <div className="dashboard-glass" style={{ padding: '24px', borderRadius: '28px', background: 'white', border: '1px solid var(--primary)' }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', padding: '16px', borderRadius: '20px' }}>
                                    <MessagesSquare size={32} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px' }}>Activate Kreddy AI</h3>
                                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '24px', lineHeight: 1.5 }}>
                                        Link your WhatsApp to start recording sales.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <input
                                            type="tel"
                                            placeholder="23480..."
                                            value={whatsappInput}
                                            onChange={(e) => setWhatsappInput(e.target.value)}
                                            style={{ padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '1rem', fontWeight: 600 }}
                                        />
                                        <button
                                            onClick={handleUpdateWhatsapp}
                                            disabled={updatingWhatsapp}
                                            className="btn-primary"
                                            style={{ padding: '16px', borderRadius: '16px', width: '100%', justifyContent: 'center' }}
                                        >
                                            {updatingWhatsapp ? "Syncing..." : "Connect Now"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="dashboard-glass" style={{ padding: '24px', borderRadius: '28px', background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)' }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '20px' }}>
                                    <Sparkles size={32} color="#4ade80" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Kreddy is Online</h3>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#4ade80', color: '#064e3b', padding: '4px 12px', borderRadius: '100px', textTransform: 'uppercase' }}>Active</span>
                                    </div>
                                    <p style={{ opacity: 0.8, fontWeight: 500, marginBottom: '24px', fontSize: '0.85rem' }}>
                                        Ready to record? Just say "Hi".
                                    </p>
                                    <button
                                        onClick={() => window.open(KREDDY_CONFIG.getLink(), '_blank')}
                                        className="btn-primary"
                                        style={{ background: '#25D366', border: 'none', width: '100%', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <MessagesSquare size={20} /> Chat
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="dashboard-glass" style={{ padding: '24px', borderRadius: '28px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h4 style={{ fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Activity size={20} color="var(--primary)" /> Activity Feed
                            </h4>
                            <div style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }}></div>
                        </div>

                        <div className="timeline-track">
                            {loadingActivities ? (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Analyzing stream...</p>
                            ) : activities.length === 0 ? (
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No live activity detected.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {activities.slice(0, 5).map((log, i) => (
                                        <div key={log._id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                            <div className="timeline-dot" style={{ borderColor: i === 0 ? 'var(--primary)' : '#E2E8F0' }}></div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ 
                                                    fontSize: '0.9rem', 
                                                    fontWeight: 700, 
                                                    color: 'var(--text)', 
                                                    marginBottom: '4px', 
                                                    lineHeight: 1.4,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: '220px'
                                                }}>
                                                    {log.details.replace(/"/g, '')}
                                                </p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <span style={{ textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em' }}>{log.action.replace(/_/g, ' ')}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ 
                        padding: '24px', 
                        background: '#0F172A', 
                        borderRadius: '28px', 
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <h4 style={{ fontWeight: 900, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Shield size={20} color="var(--primary)" /> Security Guard
                            </h4>
                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: '20px' }}>
                                Your business records are safe and guarded. Every sale you record helps your business grow.
                            </p>
                            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase' }}>Security Key</p>
                                <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', fontWeight: 600 }}>KR-SEC-***-{profile?._id?.slice(-4)}</p>
                            </div>
                        </div>
                        <Shield size={120} style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.05, color: 'white' }} />
                    </div>
                </div>
            </div>

            {deleteModal.show && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }}>
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="animate-scale-in" 
                        style={{ padding: '40px', maxWidth: '440px', width: '100%', background: 'white', borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                    >
                        <div style={{ background: '#FEF2F2', color: '#EF4444', width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#0F172A', marginBottom: '12px', letterSpacing: '-0.02em' }}>Delete Recording?</h3>
                        <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: 1.6, fontWeight: 600, fontSize: '0.95rem' }}>
                            You are about to remove the entry for <b>{deleteModal.sale?.customerName}</b>. This will correct your balance but the action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-secondary" style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '0.95rem' }} onClick={() => setDeleteModal({ show: false, sale: null })}>Keep it</button>
                            <button style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }} onClick={confirmDelete}>Delete Record</button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}

            <style>{`
                @media (max-width: 1024px) {
                    .dashboard-main-grid {
                        grid-template-columns: 1fr !important;
                        gap: 20px !important;
                    }
                    .dashboard-glass {
                        padding: 24px !important;
                        border-radius: 24px !important;
                    }
                    .stat-card-premium {
                        padding: 24px !important;
                        border-radius: 24px !important;
                    }
                }
                .dashboard-glass {
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    width: 100%;
                }
                .dashboard-glass:hover {
                    border-color: var(--primary) !important;
                    box-shadow: var(--shadow-premium) !important;
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
