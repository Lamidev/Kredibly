import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Zap, RefreshCw, Play, XCircle, Trash2, ArrowUpRight, 
    CreditCard, TrendingUp, Clock, AlertCircle, CheckCircle2,
    Activity, Shield, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { API_BASE_URL } from '../../config';

const AdminMissionControl = () => {
    const [stats, setStats] = useState({ pending: 0, completed: 0, failed: 0, processing: 0 });
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Kreddy Growth Engine State
    const [advice, setAdvice] = useState("");
    const [adviceStatus, setAdviceStatus] = useState("pending");
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    
    const API_URL = API_BASE_URL;

    useEffect(() => {
        console.log(`🛰️ Mission Control pointing to: ${API_URL}`);
        fetchMissionControlData();
        fetchDailyAdvice();
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchMissionControlData(false, true);
            }
        }, 30000); 
        return () => clearInterval(interval);
    }, []);

    const fetchDailyAdvice = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/daily-advice`, { withCredentials: true });
            const value = res.data?.value;
            setAdvice(value?.adviceText || value || "");
            setAdviceStatus(res.data?.status || "pending");
        } catch (err) {
            console.error("Daily Advice Sync Error:", err);
        }
    };

    const handleRegenerateAdvice = async () => {
        setIsRegenerating(true);
        try {
            const res = await axios.post(`${API_URL}/admin/daily-advice/regenerate`, { tone: "English" }, { withCredentials: true });
            setAdvice(res.data.advice);
            setAdviceStatus("pending");
            toast.success(`New lesson drafted!`);
        } catch (err) {
            toast.error("Failed to regenerate advice.");
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleApproveAndSend = async () => {
        if (!advice.trim()) return toast.error("Advice cannot be empty!");
        
        setIsApproving(true);
        try {
            const res = await axios.post(`${API_URL}/admin/daily-advice/approve`, { 
                editedAdvice: advice,
                tone: "English"
            }, { withCredentials: true });
            setAdviceStatus("approved");
            toast.success(res.data.message);
            fetchMissionControlData(true);
        } catch (err) {
            toast.error("Failed to approve batch.");
        } finally {
            setIsApproving(false);
        }
    };


    const fetchMissionControlData = async (manual = false, silent = false) => {
        if (!manual && !silent) setLoading(true);
        if (manual) setIsRefreshing(true);

        try {
            const res = await axios.get(`${API_URL}/admin/mission-control/feed`, { withCredentials: true });
            if (res.data.success) {
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

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '24px' }} />
                    ))}
                </div>
                <div className="skeleton" style={{ height: '400px', borderRadius: '32px' }} />
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div style={{ 
                marginBottom: '32px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'clamp(12px, 3vw, 20px)'
            }}>
                <div style={{ flex: '1 1 300px' }}>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 950, color: '#0F172A', letterSpacing: '-0.04em', margin: 0 }}>Mission Control</h1>
                    <p style={{ color: '#64748B', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>Real-time platform pulse & operational oversight.</p>
                </div>
                <button 
                    onClick={() => fetchMissionControlData(true)} 
                    disabled={isRefreshing}
                    style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', 
                        padding: '12px 20px', borderRadius: '16px', background: 'white', 
                        border: '1px solid #E2E8F0', cursor: 'pointer', fontWeight: 800,
                        fontSize: '0.85rem', color: '#1E293B', transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#E2E8F0'}
                >
                    <RefreshCw size={16} className={isRefreshing ? 'spin-animation' : ''} /> Sync Systems
                </button>
            </div>

            {/* STATUS HERO */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                gap: 'clamp(12px, 3vw, 20px)', 
                marginBottom: '32px' 
            }}>
                <div className="dashboard-glass" style={{ padding: 'clamp(16px, 4vw, 20px)', borderRadius: '24px', background: 'white', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: '#F0F9FF', borderRadius: '12px', color: '#0EA5E9' }}><Activity size={18} /></div>
                        <span style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 900, color: '#0F172A' }}>{stats.pending + stats.processing}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Active Tasks</p>
                </div>
                <div className="dashboard-glass" style={{ padding: 'clamp(16px, 4vw, 20px)', borderRadius: '24px', background: 'white', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: '#ECFDF5', borderRadius: '12px', color: '#10B981' }}><CheckCircle2 size={18} /></div>
                        <span style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 900, color: '#0F172A' }}>{(stats.wa_sent || 0) + (stats.email_sent || 0)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Daily Success</p>
                </div>
                <div className="dashboard-glass" style={{ padding: 'clamp(16px, 4vw, 20px)', borderRadius: '24px', background: 'white', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ padding: '8px', background: '#FEF2F2', borderRadius: '12px', color: '#EF4444' }}><AlertCircle size={18} /></div>
                        <span style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', fontWeight: 900, color: '#EF4444' }}>{stats.failed}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Attention Required</p>
                </div>
            </div>

            {/* KREDDY GROWTH ENGINE: Review & Approval Workflow */}
            <div className="dashboard-glass" style={{ background: '#0F172A', borderRadius: '32px', border: '1px solid #1E293B', padding: 'clamp(16px, 5vw, 32px)', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
                {/* Visual Flair */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        marginBottom: '24px',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div style={{ flex: '1 1 300px' }}>
                            <h3 style={{ margin: 0, fontWeight: 950, fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Shield size={22} color="#818CF8" /> Kreddy Growth Engine
                            </h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Manage the daily street-smart advice and morning report dispatch.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ 
                                padding: '6px 14px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, 
                                background: adviceStatus === 'pending' ? '#FEF3C7' : '#DCFCE7', 
                                color: adviceStatus === 'pending' ? '#92400E' : '#166534',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                {adviceStatus === 'pending' ? 'REVIEW' : 'APPROVED'}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Today's Drafted Business Tip
                            </label>
                            <textarea 
                                value={advice}
                                onChange={(e) => setAdvice(e.target.value)}
                                style={{ 
                                    width: '100%', background: 'transparent', border: 'none', color: 'white', 
                                    fontSize: 'clamp(0.95rem, 3vw, 1.1rem)', fontWeight: 700, lineHeight: '1.6', minHeight: '150px', 
                                    resize: 'none', outline: 'none'
                                }}
                                placeholder="Loading daily advice..."
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Queue Micro-Monitor */}
                            <div style={{ background: '#000000', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Batch Progress</span>
                                    <motion.div animate={{ opacity: stats.pending > 0 ? [1, 0.5, 1] : 1 }} transition={{ repeat: Infinity, duration: 2 }}>
                                        <Zap size={14} color={stats.pending > 0 ? "#FACC15" : "rgba(255,255,255,0.2)"} />
                                    </motion.div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 950, color: 'white' }}>{stats.pending}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>QUEUED</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 950, color: '#4ADE80' }}>{stats.wa_sent || 0}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>WA</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 950, color: '#60A5FA' }}>{stats.email_sent || 0}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>EMAIL</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 950, color: '#F87171' }}>{stats.failed}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>FAIL</div>
                                    </div>
                                </div>
                            </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                            <button 
                                onClick={handleRegenerateAdvice}
                                disabled={isRegenerating}
                                style={{ 
                                    width: '100%', padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', 
                                    border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer',
                                    fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                            >
                                <RefreshCw size={16} className={isRegenerating ? 'spin-animation' : ''} />
                                {isRegenerating ? 'Thinking...' : 'Regenerate Tip'}
                            </button>
                            <button 
                                onClick={handleApproveAndSend}
                                disabled={isApproving || !advice.trim()}
                                style={{ 
                                    width: '100%', padding: '16px', borderRadius: '18px', 
                                    background: isApproving ? 'rgba(255,255,255,0.1)' : 'var(--primary)', 
                                    color: 'white', cursor: isApproving ? 'default' : 'pointer',
                                    fontWeight: 950, fontSize: '0.9rem', border: 'none',
                                    boxShadow: isApproving ? 'none' : '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                }}
                            >
                                <Zap size={18} fill="white" />
                                {isApproving ? 'Queueing Batch...' : 'Approve & Send Batch'}
                            </button>
                            <p style={{ textAlign: 'center', margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                *Sends Batch Summary/Growth to all users.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>


            <style>{`
                .spin-animation { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </motion.div>
    );
};

export default AdminMissionControl;
