import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Zap, RefreshCw, Play, XCircle, Trash2, ArrowUpRight, 
    CreditCard, TrendingUp, Clock, AlertCircle, CheckCircle2,
    Activity, Shield, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const AdminMissionControl = () => {
    const [feed, setFeed] = useState([]);
    const [stats, setStats] = useState({ pending: 0, completed: 0, failed: 0, processing: 0 });
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        fetchMissionControlData();
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchMissionControlData(false, true);
            }
        }, 30000); // 30s refresh for Mission Control
        return () => clearInterval(interval);
    }, []);

    const fetchMissionControlData = async (manual = false, silent = false) => {
        if (!manual && !silent) setLoading(true);
        if (manual) setIsRefreshing(true);

        try {
            const res = await axios.get(`${API_URL}/admin/mission-control/feed`, { withCredentials: true });
            if (res.data.success) {
                setFeed(res.data.feed);
                setStats(res.data.stats);
            }
        } catch (err) {
            console.error("Mission Control Sync Error:", err);
            if (!silent) toast.error("Failed to sync Mission Control.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleJobAction = async (jobId, action) => {
        const loadingToast = toast.loading(`Performing ${action}...`);
        try {
            let res;
            if (action === 'retry') {
                res = await axios.post(`${API_URL}/admin/background-jobs/${jobId}/retry`, {}, { withCredentials: true });
            } else if (action === 'cancel') {
                res = await axios.patch(`${API_URL}/admin/background-jobs/${jobId}/cancel`, {}, { withCredentials: true });
            } else if (action === 'delete') {
                res = await axios.delete(`${API_URL}/admin/background-jobs/${jobId}`, { withCredentials: true });
            }

            if (res.data.success) {
                toast.success(res.data.message, { id: loadingToast });
                fetchMissionControlData(false, true);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Action failed", { id: loadingToast });
        }
    };

    if (loading && feed.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '24px' }} />
                    ))}
                </div>
                <div className="skeleton" style={{ height: '500px', borderRadius: '32px' }} />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 950, color: '#0F172A', letterSpacing: '-0.04em', margin: 0 }}>Mission Control</h1>
                    <p style={{ color: '#64748B', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>Real-time platform pulse & operational oversight.</p>
                </div>
                <button 
                    onClick={() => fetchMissionControlData(true)} 
                    disabled={isRefreshing}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', 
                        padding: '12px 20px', borderRadius: '16px', background: 'white', 
                        border: '1px solid #E2E8F0', cursor: 'pointer', fontWeight: 800,
                        fontSize: '0.85rem', color: '#1E293B', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                >
                    <RefreshCw size={16} className={isRefreshing ? 'spin-animation' : ''} /> Sync Systems
                </button>
            </div>

            {/* STATUS HERO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <div className="dashboard-glass" style={{ padding: '24px', borderRadius: '28px', background: 'white', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ padding: '10px', background: '#F0F9FF', borderRadius: '14px', color: '#0EA5E9' }}><Activity size={20} /></div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A' }}>{stats.pending + stats.processing}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Active Tasks</p>
                </div>
                <div className="dashboard-glass" style={{ padding: '24px', borderRadius: '28px', background: 'white', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ padding: '10px', background: '#ECFDF5', borderRadius: '14px', color: '#10B981' }}><CheckCircle2 size={20} /></div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A' }}>{stats.completed}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Daily Success</p>
                </div>
                <div className="dashboard-glass" style={{ padding: '24px', borderRadius: '28px', background: 'white', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ padding: '10px', background: '#FEF2F2', borderRadius: '14px', color: '#EF4444' }}><AlertCircle size={20} /></div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#EF4444' }}>{stats.failed}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Attention Required</p>
                </div>
                <div className="dashboard-glass" style={{ padding: '24px', borderRadius: '28px', background: '#0F172A', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '14px' }}><Shield size={20} /></div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>HEALTH: 100%</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>System Integrity</p>
                </div>
            </div>

            {/* UNIFIED FEED */}
            <div className="dashboard-glass" style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', minHeight: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Terminal size={22} color="var(--primary)" /> Platform Pulse Feed
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                         <span style={{ fontSize: '0.7rem', fontWeight: 900, background: '#F1F5F9', padding: '4px 10px', borderRadius: '100px' }}>14 DAY AUDIT ACTIVE</span>
                    </div>
                </div>

                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '16px', 
                    maxHeight: '700px', 
                    overflowY: 'auto', 
                    paddingRight: '12px',
                    scrollbarWidth: 'thin'
                }}>
                    <AnimatePresence mode="popLayout">
                        {feed.map((item) => (
                            <motion.div 
                                layout
                                key={item._id + item.timestamp}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                style={{ 
                                    padding: '20px', 
                                    borderRadius: '20px', 
                                    background: '#F8FAFC', 
                                    border: `1px solid ${item.status === 'failed' ? '#FEE2E2' : '#E2E8F0'}`,
                                    display: 'flex',
                                    gap: '20px',
                                    alignItems: 'center'
                                }}
                            >
                                {/* EVENT ICON */}
                                <div style={{ 
                                    width: '52px', height: '52px', borderRadius: '16px', 
                                    background: item.color === 'purple' ? '#F5F3FF' : (item.color === 'green' ? '#ECFDF5' : (item.color === 'blue' ? '#F0F9FF' : '#F1F5F9')),
                                    color: item.color === 'purple' ? '#8B5CF6' : (item.color === 'green' ? '#10B981' : (item.color === 'blue' ? '#0EA5E9' : '#64748B')),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    {item.type === 'JOB' ? <Zap size={24} /> : (item.type === 'SALE' ? <TrendingUp size={24} /> : (item.type === 'SUB' ? <CreditCard size={24} /> : <Activity size={24} />))}
                                </div>

                                {/* CONTENT */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                        <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: '#1E293B' }}>
                                            {item.merchant} 
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, marginLeft: '12px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.03)', color: '#64748B' }}>
                                                {item.event.replace(/_/g, ' ')}
                                            </span>
                                        </h4>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8' }}>
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 650, color: item.status === 'failed' ? '#EF4444' : '#475569' }}>
                                            {item.details}
                                        </p>
                                        
                                        {/* ACTION BUTTONS FOR JOBS */}
                                        {item.type === 'JOB' && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {item.status === 'failed' && (
                                                    <button onClick={() => handleJobAction(item._id, 'retry')} style={actionBtnStyle('#10B981')} title="Retry Operation">
                                                        <Play size={14} fill="currentColor" />
                                                    </button>
                                                )}
                                                {item.status === 'pending' && (
                                                    <button onClick={() => handleJobAction(item._id, 'cancel')} style={actionBtnStyle('#F97316')} title="Cancel Task">
                                                        <XCircle size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => handleJobAction(item._id, 'delete')} style={actionBtnStyle('#EF4444')} title="Purge Record">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <style>{`
                .spin-animation { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
};

const actionBtnStyle = (color) => ({
    background: 'white',
    border: '1px solid #E2E8F0',
    color: color,
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
});

export default AdminMissionControl;
