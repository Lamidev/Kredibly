import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSales } from "../../context/SaleContext";
import { useAuth } from "../../context/AuthContext";
import { 
    Plus, Wallet, Clock, CheckCircle, ChevronRight, 
    TrendingUp, Users, MessagesSquare, Trash2, Shield, 
    ArrowUpRight, Activity, Zap, Sparkles, Copy, Mic
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { KREDDY_CONFIG } from "../../config";
import PlanLimitModal from "../../components/payment/PlanLimitModal";

import { createPortal } from "react-dom";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar, Legend 
} from 'recharts';
import { initiateSocketConnection, disconnectSocket, listenToEvent, stopListeningToEvent } from "../../utils/socket";


const Dashboard = () => {
    const { stats, sales, analytics, fetchSales, fetchStats, fetchAnalytics, loading, deleteSale } = useSales();
    const { user, profile, updateProfile, checkAuth } = useAuth();
    const navigate = useNavigate();
    const [whatsappInput, setWhatsappInput] = useState("");
    const [updatingWhatsapp, setUpdatingWhatsapp] = useState(false);
    const [activities, setActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [visibleSales, setVisibleSales] = useState(5);
    const [deleteModal, setDeleteModal] = useState({ show: false, sale: null });
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCopyDraft = (sale) => {
        const balance = sale.totalAmount - (sale.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
        const link = `${window.location.origin}/i/${sale.invoiceNumber}`;
        const tone = profile?.assistantSettings?.reminderTemplate || 'friendly';
        
        let draft = "";
        if (tone === 'formal') {
            draft = `Hi ${sale.customerName}, this is a formal reminder regarding your outstanding balance of ₦${balance.toLocaleString()} with ${profile?.displayName || 'us'}. You can view the details and pay securely here: ${link}`;
        } else {
            draft = `Hi ${sale.customerName}, just a friendly nudge from ${profile?.displayName || 'us'} regarding your balance of ₦${balance.toLocaleString()}. You can pay securely here: ${link} - Thank you!`;
        }

        navigator.clipboard.writeText(draft);
        toast.success(`Kreddy's ${tone} draft copied!`, {
            description: "Ready to paste and send on WhatsApp.",
            icon: <Copy size={16} />
        });
    };

    useEffect(() => {
        fetchSales();
        fetchStats();
        fetchAnalytics();
        fetchActivities();

        // 🔌 Real-time Socket Setup
        if (profile?._id) {
            initiateSocketConnection(profile._id);
            
            listenToEvent("sale_updated", (data) => {
                console.log("⚡ Real-time update received:", data);
                toast.success(`Money Received! #${data.invoiceNumber || 'Record'} updated: ₦${data.amount?.toLocaleString()} from ${data.customerName || 'Customer'}.`, {
                    duration: 5000,
                    icon: '💰'
                });
                
                // Live Refresh with short delay to allow DB consistency for stats/aggregations
                setTimeout(() => {
                    fetchSales();
                    fetchStats();
                    fetchAnalytics();
                    fetchActivities();
                }, 1000);
            });

            listenToEvent("activity_updated", (data) => {
                console.log("⚡ Activity update received:", data);
                fetchActivities();
            });

            // 🚀 Trigger Welcome Message if needed (after landing on dashboard)
            if (profile?.onboardingStep === 4 && profile?.welcomeSent === false) {
                const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
                axios.post(`${API_URL}/business/trigger-welcome`, {}, { withCredentials: true })
                     .then(() => {
                        // Refresh profile state from backend (now has welcomeSent: true)
                        if (checkAuth) checkAuth();
                     })
                     .catch(err => console.error("Welcome trigger failed", err));
            }
        }

        return () => {
            stopListeningToEvent("sale_updated");
            stopListeningToEvent("activity_updated");
            disconnectSocket();
        };
    }, [profile?._id]);

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



    const confirmDelete = async () => {
        try {
            await deleteSale(deleteModal.sale._id);
            toast.success("Record deleted successfully");
            setDeleteModal({ show: false, sale: null });
        } catch (err) {
            console.error("Delete record error:", err);
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
            console.error("WhatsApp update error:", err);
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

    // 'Kreddy Settlements' is now calculated purely by the backend for maximum accuracy
    const kreddySettlements = stats?.kreddyRevenue || 0;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px', position: 'relative' }}>
            {/* Executive Header */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2.5rem)', fontWeight: 950, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                        {greeting()}, <span className="premium-gradient">
                            {profile?.displayName || (user?.name && !user.name.includes('@') ? user.name.split(' ')[0] : 'Founder')}
                        </span>.
                    </h1>
                    <p className="mobile-hide" style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>
                        Here's your business overview.
                    </p>
                </div>

                {/* Plan Badge */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ 
                        padding: '12px 24px', 
                        borderRadius: '20px', 
                        background: profile?.planStatus === 'inactive' ? '#F1F5F9' :
                                    profile?.planStatus === 'past_due' ? '#FEF2F2' :
                                    profile?.plan === 'chairman' ? 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)' : 
                                    profile?.plan === 'oga' ? 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)' : 
                                    '#FFFFFF',
                        color: profile?.planStatus === 'inactive' ? '#64748B' : 
                               profile?.planStatus === 'past_due' ? '#EF4444' :
                               profile?.plan === 'hustler' ? '#64748B' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        cursor: 'pointer'
                    }}
                    onClick={() => navigate('/settings')}
                >
                    <div style={{ 
                        width: '32px', height: '32px', borderRadius: '10px', 
                        background: profile?.planStatus === 'past_due' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.2)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                        {profile?.planStatus === 'past_due' ? <Clock size={18} /> :
                         profile?.plan === 'chairman' ? <Shield size={18} /> : 
                         profile?.plan === 'oga' ? <Zap size={18} fill="white" /> : 
                         <Activity size={18} />}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em', marginBottom: '-2px' }}>
                            {profile?.planStatus === 'trialing' ? 'Active Trial' : 
                             profile?.planStatus === 'past_due' ? 'Plan Expired' : 
                             profile?.planStatus === 'inactive' ? 'Hustler Mode' : 'Account Status'}
                        </p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 900, letterSpacing: '0.02em' }}>
                            {profile?.plan?.toUpperCase() || 'HUSTLER'}
                            {profile?.isFoundingMember && <span style={{ marginLeft: '8px', fontSize: '0.7rem', color: '#4ADE80' }}>★</span>}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* 🚀 Grand Launch Urgency Banner - Refined Dark Theme */}

            {/* Premium Stats Bento Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '20px',
                marginBottom: '40px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Lifetime Total 1: Settled Cash */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    style={{ 
                        padding: '32px', 
                        borderRadius: '32px', 
                        border: '1px solid #E2E8F0', 
                        background: 'white', 
                        boxShadow: 'var(--shadow-premium)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ background: '#ECFDF5', color: '#10B981', padding: '10px', borderRadius: '14px' }}>
                            <Wallet size={20} strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748B', background: '#F1F5F9', padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.05em' }}>LIFETIME SETTLED</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>Settled Cash</p>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 950, color: '#0F172A', letterSpacing: '-0.04em', margin: 0 }}>
                        ₦{stats?.revenue?.toLocaleString() || 0}
                    </h2>
                </motion.div>

                {/* Lifetime Total 2: Outstanding Debt */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    onClick={() => navigate("/sales?status=outstanding")}
                    style={{ 
                        padding: '32px', 
                        borderRadius: '32px', 
                        border: '1px solid #E2E8F0', 
                        background: 'white', 
                        boxShadow: 'var(--shadow-premium)',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ background: '#FEF2F2', color: '#EF4444', padding: '10px', borderRadius: '14px' }}>
                            <Clock size={20} strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#64748B', background: '#F1F5F9', padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.05em' }}>OUTSTANDING</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>Uncollected Debt</p>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 950, color: '#EF4444', letterSpacing: '-0.04em', margin: 0 }}>
                        ₦{stats?.outstanding?.toLocaleString() || 0}
                    </h2>
                </motion.div>

                {/* Lifetime Total 3: Kreddy Settlements */}
                <motion.div 
                    whileHover={{ y: -5 }}
                    onClick={() => navigate("/sales?method=paystack")}
                    style={{ 
                        padding: '32px', 
                        borderRadius: '32px', 
                        border: '1px solid #E2E8F0', 
                        background: 'white', 
                        boxShadow: 'var(--shadow-premium)',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', background: 'var(--primary-glow)', filter: 'blur(30px)', opacity: 0.1 }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ background: '#F5F3FF', color: 'var(--primary)', padding: '10px', borderRadius: '14px' }}>
                            <Zap size={20} strokeWidth={2.5} fill="currentColor" />
                        </div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', background: '#F5F3FF', padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.05em' }}>KREDDY SETTLEMENTS</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>Invoice Settlements</p>
                    <h2 className="premium-gradient" style={{ fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>
                        ₦{kreddySettlements.toLocaleString()}
                    </h2>
                </motion.div>
            </div>

            {/* SIMPLIFIED WEEKLY BATTLE CHART */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)', 
                    padding: isMobile ? '24px' : '40px', 
                    borderRadius: '32px', 
                    border: '1px solid #E2E8F0', 
                    marginBottom: 'clamp(2rem, 5vw, 40px)',
                    boxShadow: 'var(--shadow-premium)',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Visual Flair */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'var(--primary-glow)', filter: 'blur(100px)', borderRadius: '50%', opacity: 0.1, pointerEvents: 'none' }} />

                <div className="battle-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '24px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                            <div style={{ background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '12px' }}>
                                <Activity size={20} strokeWidth={3} />
                            </div>
                            <h3 style={{ fontSize: '1.6rem', fontWeight: 950, color: '#0F172A', margin: 0, letterSpacing: '-0.04em' }}>This Week's Battle</h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 600, marginLeft: '40px' }}>Tracking your collection velocity vs. outstanding targets.</p>
                    </div>
                    
                    {analytics?.summary && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', background: '#F5F3FF', padding: '4px 12px', borderRadius: '100px', letterSpacing: '0.05em', marginBottom: '4px', display: 'inline-block' }}>WEEKLY MOMENTUM</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                                    <h4 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--primary)', margin: 0, lineHeight: 1 }}>
                                        {analytics.summary.collectionRate}%
                                    </h4>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid #F1F5F9', borderTopColor: 'var(--primary)', transform: `rotate(${(analytics.summary.collectionRate / 100) * 360}deg)` }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '40px' }}>
                    <div style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.04)', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Money In</span>
                        </div>
                        <h4 style={{ fontSize: '1.8rem', fontWeight: 950, color: '#0F172A', margin: 0 }}>₦{analytics?.summary?.moneyIn?.toLocaleString() || 0}</h4>
                    </div>
                    <div style={{ padding: '24px', background: 'rgba(239, 68, 68, 0.04)', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Money Outside</span>
                        </div>
                        <h4 style={{ fontSize: '1.8rem', fontWeight: 950, color: '#EF4444', margin: 0 }}>₦{analytics?.summary?.moneyOutside?.toLocaleString() || 0}</h4>
                    </div>
                </div>

                <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
                    {!analytics?.daily || analytics.daily.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', flexDirection: 'column', gap: '12px' }}>
                            <Activity size={48} strokeWidth={1} />
                            <p style={{ fontWeight: 600 }}>Analyzing battlefield data...</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.daily}>
                                <defs>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                                    tickFormatter={(val) => `₦${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                                />
                                <Tooltip 
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="glass-card" style={{ padding: '16px', border: '1px solid #E2E8F0', boxShadow: 'var(--shadow-premium)' }}>
                                                    <p style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>{label}</p>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>In: ₦{payload[0].value.toLocaleString()}</p>
                                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>Out: ₦{payload[1].value.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Money In" 
                                    stroke="var(--primary)" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorIn)" 
                                    animationDuration={2000}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Money Outside" 
                                    name="Collection Pipeline"
                                    stroke="#FCA5A5" 
                                    strokeWidth={3}
                                    strokeDasharray="8 5"
                                    fill="transparent"
                                    animationDuration={2500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </motion.div>

            <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '24px', 
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {/* Left Column: Priority Collection */}
                <div style={{ flex: '1 1 500px', minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px', paddingRight: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>Recovery Queue</h3>
                            <span style={{ padding: '4px 10px', background: '#FEF2F2', color: '#EF4444', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800 }}>{sales.filter(s => s.status !== 'paid').length} PENDING</span>
                        </div>
                        <Link to="/debtors" style={{ padding: '8px 16px', background: 'var(--background)', color: 'var(--primary)', textDecoration: 'none', borderRadius: '100px', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border)' }}>
                            View All Debtors <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sales.filter(s => s.status !== 'paid').length === 0 ? (
                            <div style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--background)', borderRadius: '32px', border: '2px dashed var(--border)', width: '100%' }}>
                                <div style={{ background: 'white', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: 'var(--shadow-premium)' }}>
                                    <CheckCircle size={32} color="var(--success)" />
                                </div>
                                <h4 style={{ fontWeight: 800, color: 'var(--text-muted)' }}>All caught up!</h4>
                                <p style={{ color: '#94A3B8', fontWeight: 500, marginTop: '8px' }}>Your collection is 100%. No active debtors detected.</p>
                            </div>
                        ) : (
                            sales.filter(s => s.status !== 'paid').slice(0, visibleSales).map(sale => (
                                <motion.div
                                    key={sale._id}
                                    whileHover={{ x: 4, scale: 1.01 }}
                                    className="dashboard-glass priority-item"
                                    style={{ 
                                        padding: '24px', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        justifyContent: 'space-between', 
                                        alignItems: 'flex-start', 
                                        cursor: 'pointer', 
                                        borderRadius: '28px', 
                                        border: '1px solid var(--border)',
                                        background: 'white',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                        position: 'relative',
                                        marginBottom: '12px'
                                    }}
                                    onClick={() => navigate(`/dashboard/invoice/${sale.invoiceNumber}`)}
                                >
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                padding: '12px',
                                                borderRadius: '16px',
                                                color: 'var(--warning)',
                                            }}>
                                                <Clock size={24} strokeWidth={2.5} />
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '2px' }}>Amount Due</p>
                                                <h4 style={{ fontSize: '1.4rem', fontWeight: 950, color: '#0F172A', margin: 0 }}>₦{(sale.totalAmount - (sale.payments?.reduce((sum, p) => sum + p.amount, 0) || 0)).toLocaleString()}</h4>
                                            </div>
                                        </div>
                                        
                                        <div style={{ marginBottom: '20px' }}>
                                            <p style={{ fontWeight: 900, color: '#1E293B', fontSize: '1.1rem', margin: '0 0 4px 0' }}>{sale.customerName || 'Customer'}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ color: 'var(--primary)', fontWeight: 800 }}>#{sale.invoiceNumber}</span>
                                                <span>•</span>
                                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sale.description || 'Order details...'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingTop: '12px', borderTop: '1px solid #F1F5F9', marginTop: 'auto' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {(sale.viewCount > 0) && (
                                                <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--primary)', background: '#F5F3FF', padding: '4px 10px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Sparkles size={10} fill="var(--primary)" /> VIEWED {sale.viewCount > 1 ? `(${sale.viewCount})` : ""}
                                                </span>
                                            )}
                                            {sale.status === 'partial' && (
                                                <span style={{ fontSize: '9px', fontWeight: 900, color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: '100px' }}>PARTIAL</span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCopyDraft(sale);
                                                }}
                                                style={{ 
                                                    width: '36px', height: '36px', borderRadius: '50%', 
                                                    background: '#F1F5F9', border: 'none', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                    color: 'var(--primary)', cursor: 'pointer' 
                                                }}
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                <ChevronRight size={18} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                        <button 
                            className="dashboard-glass" 
                            style={{ width: '100%', padding: '16px', borderRadius: '18px', border: '2px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            onClick={() => {
                                if (profile?.plan === 'hustler' && (stats?.monthlySalesCount || 0) >= 10) {
                                    setShowLimitModal(true);
                                } else {
                                    navigate('/sales/new');
                                }
                            }}
                        >
                            <Plus size={18} /> Record New Sale
                        </button>
                    </div>
                </div>

                {/* Right Column: Sidebar Widgets */}
                <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                                        Ready to record? Sync your first sale now.
                                    </p>
                                    <a 
                                        href={KREDDY_CONFIG.getLink() + "&text=Hi%20Kreddy!%20I'm%20ready%20to%20record."}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="hover-scale"
                                        style={{ 
                                            padding: '16px 32px', 
                                            borderRadius: '16px', 
                                            background: '#FFFFFF', 
                                            color: '#0F172A', 
                                            width: '100%', 
                                            justifyContent: 'center',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            fontWeight: 900,
                                            fontSize: '1rem',
                                            boxShadow: '0 10px 20px -5px rgba(255, 255, 255, 0.1)'
                                        }}
                                    >
                                        <MessagesSquare size={20} /> Say Hi to Kreddy
                                    </a>
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
                                    {activities.slice(0, 5).map((log, index) => (
                                        <div key={log._id + log.createdAt} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                            <div className="timeline-dot" style={{ borderColor: index === 0 ? 'var(--primary)' : '#E2E8F0', flexShrink: 0 }}></div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ 
                                                    fontSize: '0.85rem', 
                                                    fontWeight: 700, 
                                                    color: 'var(--text)', 
                                                    marginBottom: '4px', 
                                                    lineHeight: 1.4,
                                                    overflowWrap: 'anywhere',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {log.details.replace(/"/g, '')}
                                                </p>
                                                {log.originalText && (
                                                    <div style={{ 
                                                        background: 'var(--background)', 
                                                        padding: '8px 12px', 
                                                        borderRadius: '12px', 
                                                        marginBottom: '8px', 
                                                        borderLeft: '3px solid var(--primary)',
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-muted)',
                                                        fontStyle: 'italic',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        <Mic size={12} color="var(--primary)" />
                                                        <span>{log.originalText}</span>
                                                    </div>
                                                )}
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.action.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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
                        <p style={{ color: '#334155', marginBottom: '32px', lineHeight: 1.6, fontWeight: 600, fontSize: '0.95rem' }}>
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

            {showLimitModal && (
                <PlanLimitModal 
                    isOpen={showLimitModal} 
                    onClose={() => setShowLimitModal(false)} 
                    plan={profile?.plan}
                    feature="sales"
                />
            )}

            <style>{`
                .skeleton {
                    background: linear-gradient(90deg, #F1F5F9 25%, #F8FAFC 50%, #F1F5F9 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .dashboard-glass {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .dashboard-glass:hover {
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
                .priority-item:hover {
                    background: #F8FAFC !important;
                }
                .premium-gradient {
                    background: linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .timeline-track {
                    position: relative;
                    padding-left: 8px;
                }
                .timeline-track::before {
                    content: '';
                    position: absolute;
                    left: 11px;
                    top: 10px;
                    bottom: 10px;
                    width: 1px;
                    background: #E2E8F0;
                }
                .timeline-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: white;
                    border: 2px solid #E2E8F0;
                    position: relative;
                    z-index: 2;
                    margin-top: 6px;
                }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (max-width: 1024px) {
                    .dashboard-main-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                .btn-primary {
                    background: var(--primary);
                    color: white;
                    border: none;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .btn-secondary {
                    background: var(--background);
                    color: var(--text);
                    border: 1px solid var(--border);
                    cursor: pointer;
                }
                .hover-scale:hover {
                    transform: scale(1.02);
                }
                @media (max-width: 640px) {
                    .mobile-stack {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }
                    .priority-amount {
                        width: 100% !important;
                        justify-content: flex-start !important;
                        margin-top: 8px !important;
                        padding-top: 12px !important;
                        border-top: 1px solid var(--border) !important;
                        text-align: left !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
