import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users, TrendingUp, CreditCard, RefreshCw, Terminal, ArrowUpRight, Activity, ShieldCheck, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { initiateSocketConnection, disconnectSocket, listenToEvent, stopListeningToEvent } from "../../utils/socket";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleActivities, setVisibleActivities] = useState(20);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchAdminData();
        
        // 🔌 Real-time Mission Control Sync
        initiateSocketConnection("admin_mission_control"); 
        listenToEvent("admin_activity_updated", (data) => {
            console.log("🚀 Mission Control Update:", data);
            fetchAdminData(false, true); // Silent refresh
        });

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchAdminData(false, true);
            }
        }, 60000);
        return () => {
            clearInterval(interval);
            stopListeningToEvent("admin_activity_updated");
            disconnectSocket();
        };
    }, []);

    const fetchAdminData = async (manual = false, silent = false) => {
        if (!stats && !manual && !silent) setLoading(true);
        if (manual) setIsRefreshing(true);

        try {
            const statsRes = await axios.get(`${API_URL}/admin/stats`, { withCredentials: true });

            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
                setActivities(statsRes.data.activities);
            }

        } catch (err) {
            console.error("Admin Fetch Error:", err);
            if (err.response?.status === 401 || err.response?.status === 403) return;
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'clamp(16px, 3vw, 24px)', marginBottom: 'clamp(20px, 5vw, 40px)' }}>
                    <div className="admin-stats-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ p: '12px', background: '#F0F9FF', borderRadius: '16px', color: '#0EA5E9' }}>
                                <Users size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#10B981', background: '#ECFDF5', padding: '4px 10px', borderRadius: '100px' }}>LIVE</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>Total Merchants</p>
                        <h3 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: 950, color: 'var(--text)', letterSpacing: '-0.04em', margin: '4px 0 0' }}>
                            {stats?.totalBusinesses || 0}
                        </h3>
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#EA580C', margin: '0 0 4px' }}>
                            {stats?.totalIncomplete || 0} Incomplete Profiles
                        </p>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Founders & Business Owners</p>
                    </div>

                    <div className="admin-stats-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ p: '12px', background: '#FFF7ED', borderRadius: '16px', color: '#F97316' }}>
                                <CreditCard size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#F97316', background: '#FFF7ED', padding: '4px 10px', borderRadius: '100px' }}>REVENUE</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>Premium Liquidity</p>
                        <h3 className="premium-gradient" style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: 950, letterSpacing: '-0.04em', margin: '4px 0' }}>₦{stats?.totalRevenue?.toLocaleString() || 0}</h3>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Lifetime Subscriptions</p>
                    </div>

                    <div className="admin-stats-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ padding: '12px', background: '#F5F3FF', borderRadius: '16px', color: '#8B5CF6' }}>
                                <TrendingUp size={24} />
                            </div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#8B5CF6', background: '#F5F3FF', padding: '4px 10px', borderRadius: '100px' }}>PLATFORM GTV</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem' }}>Verified Cash Flow</p>
                        <h3 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.2rem)', fontWeight: 950, color: 'var(--text)', letterSpacing: '-0.04em', margin: '4px 0' }}>₦{stats?.totalVerifiedVolume?.toLocaleString() || 0}</h3>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Verified Online Transactions</p>
                    </div>


                </div>

                {/* ACTIVITIES & STREAM */}
                <div className="admin-grid-layout">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="dashboard-glass admin-card-padding" style={{ borderRadius: '32px', border: '1px solid var(--border)', background: 'white', padding: 'clamp(16px, 5vw, 32px)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ fontWeight: 900, fontSize: 'clamp(1rem, 4vw, 1.3rem)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'clamp(16px, 4vw, 32px)' }}>
                                    <Terminal size={20} color="var(--primary)" /> Global Activity Stream
                                </h3>
                                <button onClick={() => fetchAdminData(true)} disabled={isRefreshing} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <RefreshCw size={16} className={isRefreshing ? 'spin-animation' : ''} /> <span className="hidden-mobile">Sync</span>
                                </button>
                            </div>
                             <div style={{ 
                                 display: 'flex', 
                                 flexDirection: 'column', 
                                 gap: '24px', 
                                 maxHeight: '520px', 
                                 overflowY: 'auto', 
                                 paddingRight: '12px',
                                 scrollbarWidth: 'thin'
                             }}>
                                 {activities.slice(0, visibleActivities).map((log) => (
                                     <div key={log._id + log.createdAt} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                         <div style={{ 
                                             width: '40px', height: '40px', borderRadius: '12px', 
                                             background: log.type === 'SALE' ? '#ECFDF5' : (log.type === 'SUB' ? '#F0F9FF' : '#F8FAFC'), 
                                             border: '1px solid #E2E8F0', 
                                             display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                             color: log.type === 'SALE' ? '#10B981' : (log.type === 'SUB' ? '#0EA5E9' : 'var(--primary)'), 
                                             flexShrink: 0 
                                         }}>
                                             {log.type === 'SALE' ? <TrendingUp size={18} /> : (log.type === 'SUB' ? <CreditCard size={18} /> : <Zap size={18} />)}
                                         </div>
                                         <div style={{ flex: 1 }}>
                                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '8px' }}>
                                                 <div>
                                                     <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 850 }}>{log.details}</p>
                                                     <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>{log.merchant}</p>
                                                 </div>
                                                 <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap', textAlign: 'right' }}>
                                                     {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                 </span>
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
                    </div>


                </div>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
