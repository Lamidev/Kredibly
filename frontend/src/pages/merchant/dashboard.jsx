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
                    bottom: '40px',
                    right: '40px',
                    width: '64px',
                    height: '64px',
                    background: '#25D366',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 40px -10px rgba(37, 211, 102, 0.5)',
                    zIndex: 100,
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                }}
                className="hover-scale"
                title="Chat with Kreddy"
            >
                <MessagesSquare size={32} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '16px', height: '16px', background: 'red', border: '2px solid white', borderRadius: '50%' }}></div>
            </a>

            {/* Executive Header */}
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.04em' }}>
                    {greeting()}, {profile?.displayName?.split(' ')[0] || 'Founder'}.
                </h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1.1rem' }}>
                    Welcome to your dashboard. Here's how your business is doing today.
                </p>
            </div>

            {/* Premium Stats Bento Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                marginBottom: '48px'
            }}>
                {/* Revenue Card */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="dashboard-glass stat-card-premium" 
                    style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--border)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '12px', borderRadius: '16px' }}>
                            <Wallet size={24} strokeWidth={2.5} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '100px', textTransform: 'uppercase' }}>Live Stats</span>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>Total Revenue</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>
                            ₦{stats?.revenue?.toLocaleString() || 0}
                        </h2>
                    </div>
                </motion.div>

                {/* Outstanding Card */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="dashboard-glass stat-card-premium" 
                    style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--border)' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '12px', borderRadius: '16px' }}>
                            <Clock size={24} strokeWidth={2.5} />
                        </div>
                        <ArrowUpRight size={20} color="var(--warning)" />
                    </div>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>Unpaid Invoices</p>
                    <h2 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--warning)', letterSpacing: '-0.03em' }}>
                        ₦{stats?.outstanding?.toLocaleString() || 0}
                    </h2>
                </motion.div>

                {/* Performance Card */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="stat-card-premium" 
                    style={{ 
                        padding: '32px', 
                        borderRadius: '32px', 
                        background: 'linear-gradient(135deg, var(--primary) 0%, #6D28D9 100%)',
                        color: 'white',
                        boxShadow: '0 20px 40px -10px var(--primary-glow)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px' }}>
                            <Shield size={24} strokeWidth={2.5} />
                        </div>
                        <Zap size={20} color="white" fill="white" />
                    </div>
                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, marginBottom: '8px' }}>Business Health</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <h2 style={{ fontSize: '2.4rem', fontWeight: 950, letterSpacing: '-0.03em' }}>{stats?.trustScore || 85}%</h2>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '100px' }}>Good</span>
                    </div>
                </motion.div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '40px' }} className="dashboard-main-grid">
                {/* Left Column: Recent Activity */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text)' }}>Recent Business Activity</h3>
                        <Link to="/sales" style={{ padding: '10px 20px', background: 'var(--background)', color: 'var(--primary)', textDecoration: 'none', borderRadius: '100px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)' }}>
                            View All <ChevronRight size={18} />
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
                                    whileHover={{ x: 8 }}
                                    className="dashboard-glass"
                                    style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderRadius: '24px', border: '1px solid var(--border)' }}
                                    onClick={() => navigate(`/dashboard/invoice/${sale.invoiceNumber}`)}
                                >
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div style={{
                                            background: sale.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                            padding: '14px',
                                            borderRadius: '18px',
                                            color: sale.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                                        }}>
                                            {sale.status === 'paid' ? <CheckCircle size={24} strokeWidth={2.5} /> : <Clock size={24} strokeWidth={2.5} />}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1.1rem', marginBottom: '4px' }}>{sale.customerName || 'Standard Order'}</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>#{sale.invoiceNumber} • {new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--text)', marginBottom: '4px' }}>₦{sale.totalAmount.toLocaleString()}</p>
                                            <span className="premium-badge" style={{ 
                                                background: sale.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: sale.status === 'paid' ? 'var(--success)' : 'var(--warning)',
                                                textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 900
                                            }}>
                                                {sale.status === 'paid' ? 'PAID' : sale.status === 'partial' ? 'PARTIAL' : 'UNPAID'}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDelete(e, sale)}
                                            style={{ background: 'white', color: 'var(--error)', border: '1px solid #FEE2E2', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
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
                        <div className="dashboard-glass" style={{ padding: '32px', borderRadius: '32px', background: 'white', border: '1px solid var(--primary)' }}>
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
                        <div className="dashboard-glass" style={{ padding: '32px', borderRadius: '32px', background: 'linear-gradient(135deg, #0F172A, #1E1B4B)', color: 'white', boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.3)' }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '20px' }}>
                                    <Sparkles size={32} color="#4ade80" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900 }}>Kreddy is Online</h3>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#4ade80', color: '#064e3b', padding: '4px 12px', borderRadius: '100px', textTransform: 'uppercase' }}>Active</span>
                                    </div>
                                    <p style={{ opacity: 0.8, fontWeight: 500, marginBottom: '24px' }}>
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

                    <div className="dashboard-glass" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--border)' }}>
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
                                                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px', lineHeight: 1.4 }}>{log.details}</p>
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
                        padding: '32px', 
                        background: '#0F172A', 
                        borderRadius: '32px', 
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

            {deleteModal.show && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.15)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="dashboard-glass" 
                        style={{ padding: '40px', maxWidth: '440px', width: '90%', background: 'white', borderRadius: '32px', textAlign: 'center' }}
                    >
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.02em' }}>Delete this record?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6, fontWeight: 500 }}>
                            You are about to remove the entry for <b>{deleteModal.sale?.customerName}</b>. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button className="btn-secondary" style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: 800 }} onClick={() => setDeleteModal({ show: false, sale: null })}>Keep it</button>
                            <button className="btn-primary" style={{ flex: 1, background: 'var(--error)', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 800 }} onClick={confirmDelete}>Delete Record</button>
                        </div>
                    </motion.div>
                </div>
            )}

            <style>{`
                @media (max-width: 1024px) {
                    .dashboard-main-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                .dashboard-glass {
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
