import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users, TrendingUp, CreditCard, RefreshCw, Terminal, ArrowUpRight, Activity, ShieldCheck, Globe, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * 👑 Admin Dashboard (Overview Component)
 * Now purely focused on the main platform metrics.
 */
const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleActivities, setVisibleActivities] = useState(10);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchAdminData();
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchAdminData(false, true);
            }
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchAdminData = async (manual = false, silent = false) => {
        if (!stats && !manual && !silent) setLoading(true);
        if (manual) setIsRefreshing(true);

        try {
            const [statsRes, waitlistRes] = await Promise.all([
                axios.get(`${API_URL}/admin/stats`, { withCredentials: true }),
                axios.get(`${API_URL}/admin/waitlist`, { withCredentials: true })
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
                setActivities(statsRes.data.activities);
            }
            if (waitlistRes.data.success) setWaitlist(waitlistRes.data.data);

        } catch (err) {
            console.error("Admin Fetch Error:", err);
            if (!silent) toast.error("Security alert: Failed to sync mission control.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    if (loading && !stats) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '28px' }} />
                    ))}
                </div>
                <div className="skeleton" style={{ height: '400px', borderRadius: '32px' }} />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
            <div className="admin-content-fade">
                {/* MAIN STATS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    <div className="admin-stats-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ p: '12px', background: '#F0F9FF', borderRadius: '16px', color: '#0EA5E9' }}>
                                <Users size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#10B981', background: '#ECFDF5', padding: '4px 10px', borderRadius: '100px' }}>LIVE</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>Total Merchants</p>
                        <h3 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: 950, color: 'var(--text)', letterSpacing: '-0.04em', margin: '4px 0' }}>{stats?.totalUsers || 0}</h3>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Founders & Business Owners</p>
                    </div>

                    <div className="admin-stats-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ p: '12px', background: '#F5F3FF', borderRadius: '16px', color: '#8B5CF6' }}>
                                <TrendingUp size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#8B5CF6', background: '#F5F3FF', padding: '4px 10px', borderRadius: '100px' }}>ACTIVE</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>Platform Activity</p>
                        <h3 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: 950, color: 'var(--text)', letterSpacing: '-0.04em', margin: '4px 0' }}>{stats?.totalSalesCount || 0}</h3>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Global Transactions Recorded</p>
                    </div>

                    <div className="admin-stats-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ p: '12px', background: '#FFF7ED', borderRadius: '16px', color: '#F97316' }}>
                                <CreditCard size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#F97316', background: '#FFF7ED', padding: '4px 10px', borderRadius: '100px' }}>REVENUE</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>Premium Liquidity</p>
                        <h3 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: 950, color: 'var(--text)', letterSpacing: '-0.04em', margin: '4px 0' }}>₦{stats?.totalRevenue?.toLocaleString() || 0}</h3>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Lifetime Subscriptions</p>
                    </div>

                    <div className="admin-stats-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ p: '12px', background: '#FEF2F2', borderRadius: '16px', color: '#EF4444' }}>
                                <Globe size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#EF4444', background: '#FEF2F2', padding: '4px 10px', borderRadius: '100px' }}>WAITING</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>Growth Pipeline</p>
                        <h3 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: 950, color: 'var(--text)', letterSpacing: '-0.04em', margin: '4px 0' }}>{waitlist.length}</h3>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Verified Waitlist Entries</p>
                    </div>
                </div>

                {/* ACTIVITIES & STREAM */}
                <div className="admin-grid-layout">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="dashboard-glass admin-card-padding" style={{ borderRadius: '32px', border: '1px solid var(--border)', background: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ fontWeight: 900, fontSize: 'clamp(1rem, 4vw, 1.3rem)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Terminal size={20} color="var(--primary)" /> Global Activity Stream
                                </h3>
                                <button onClick={() => fetchAdminData(true)} disabled={isRefreshing} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <RefreshCw size={16} className={isRefreshing ? 'spin-animation' : ''} /> <span className="hidden-mobile">Sync</span>
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {activities.slice(0, visibleActivities).map((log, i) => (
                                    <div key={log._id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                                            {log.action.includes('SALE') ? <TrendingUp size={18} /> : log.action.includes('USER') ? <Users size={18} /> : <Zap size={18} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '8px' }}>
                                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 850 }}>{log.details.replace(/"/g, '')}</p>
                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{log.action.replace(/_/g, ' ')}</p>
                                        </div>
                                    </div>
                                ))}
                                {activities.length > visibleActivities && (
                                    <button onClick={() => setVisibleActivities(v => v + 10)} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#F8FAFC', border: '1px dashed #E2E8F0', cursor: 'pointer', fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Load More History</button>
                                )}
                            </div>
                        </div>

                        {/* RECENT WAITLIST (NEW SECTION FOR VISIBILITY) */}
                        <div className="dashboard-glass admin-card-padding" style={{ borderRadius: '32px', border: '1px solid var(--border)', background: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Globe size={20} color="var(--primary)" /> Recent Early Birds
                                </h3>
                                <button onClick={() => navigate('/admin/waitlist')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>View Pipeline</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {waitlist.slice(0, 4).map((entry) => (
                                    <div key={entry._id} style={{ padding: '20px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                                        <p style={{ margin: 0, fontWeight: 850, fontSize: '0.95rem' }}>{entry.name || 'Anonymous'}</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{entry.email}</p>
                                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(79, 70, 229, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>{entry.industry || 'MERCHANT'}</span>
                                            <span style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 700 }}>{entry.whatsappNumber ? entry.whatsappNumber.slice(0, 10) + '...' : new Date(entry.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="admin-card-padding" style={{ background: '#0F172A', borderRadius: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                            <h4 style={{ fontWeight: 900, fontSize: '1.2rem', marginBottom: '16px', position: 'relative', zIndex: 2 }}>System Health</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 2 }}>
                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Database</p>
                                    <p style={{ margin: '4px 0 0', fontWeight: 900, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={14} color="#10B981" /> OPERATIONAL</p>
                                </div>
                                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Resources</p>
                                    <p style={{ margin: '4px 0 0', fontWeight: 900, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={14} color="#0EA5E9" /> STABLE</p>
                                </div>
                            </div>
                            <ArrowUpRight size={80} style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.05 }} />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
