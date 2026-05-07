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
    const { profile, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [whatsappInput, setWhatsappInput] = useState("");
    const [updatingWhatsapp, setUpdatingWhatsapp] = useState(false);
    const [activities, setActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [visibleSales, setVisibleSales] = useState(5);
    const [deleteModal, setDeleteModal] = useState({ show: false, sale: null });
    const [showLimitModal, setShowLimitModal] = useState(false);

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
                    <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 950, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        {greeting()}, <span className="premium-gradient">{profile?.displayName?.split(' ')[0] || 'Founder'}</span>.
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
            {(profile?.plan === 'hustler' || profile?.planStatus === 'trialing') && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ 
                        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', 
                        padding: '24px 32px', 
                        borderRadius: '28px', 
                        marginBottom: '40px',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '24px',
                        border: '1px solid rgba(124, 58, 237, 0.3)',
                        boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.4)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Sparkles size={28} className="text-secondary" fill="currentColor" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase' }}>Limited Time</span>
                                <h3 style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.25rem)', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                                    The May Takeover
                                </h3>
                            </div>
                            <p style={{ fontSize: 'clamp(0.8rem, 3.5vw, 0.9rem)', color: '#94A3B8', fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
                                {new Date() < new Date('2026-06-01') 
                                    ? "Pre-Launch Gift: Enjoy 100% free Chairman status and AI features until our June 1st launch!" 
                                    : "Claim your 50% Grand Launch discount before they expire. Don't pay full price later!"}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/settings')}
                        style={{ 
                            padding: '14px 32px', 
                            borderRadius: '16px', 
                            background: 'white', 
                            color: '#0F172A', 
                            fontWeight: 900, 
                            border: 'none', 
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            boxShadow: '0 10px 20px -5px rgba(0,0,0,0.2)'
                        }}
                        className="hover-scale"
                    >
                        Secure My Discount
                    </button>
                </motion.div>
            )}

            {/* 🛡️ SECURE ESCROW CARD (Held Funds / Security Lock) */}
            {(profile?.heldBalance > 0 || (profile?.bankDetails?.bankDetailsLockUntil && new Date(profile.bankDetails.bankDetailsLockUntil) > new Date())) && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ 
                        background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 100%)', 
                        padding: '24px clamp(16px, 5vw, 32px)', 
                        borderRadius: '32px', 
                        marginBottom: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '24px',
                        border: '1px solid #FB923C',
                        boxShadow: '0 20px 25px -5px rgba(251, 146, 60, 0.1)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#FB923C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white' }}>
                            <Shield size={28} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ background: '#FFEDD5', color: '#9A3412', fontSize: '10px', fontWeight: 900, padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase' }}>Security Escrow</span>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 950, color: '#1E293B', margin: 0 }}>
                                    ₦{(profile?.heldBalance || 0).toLocaleString()} Secured & Locked
                                </h4>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: '#9A3412', fontWeight: 700, margin: 0 }}>
                                {profile?.heldBalance > 0 && profile?.kyc?.status !== 'verified' 
                                    ? "Verification required to release funds to your bank account." 
                                    : "Payouts temporarily locked due to bank account update. Auto-releases soon."}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate(profile?.kyc?.status !== 'verified' ? '/settings?tab=kyc' : '/settings?tab=payout')}
                        style={{ 
                            padding: '14px 32px', 
                            borderRadius: '16px', 
                            background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)', 
                            color: 'white', 
                            fontWeight: 950, 
                            border: 'none', 
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            boxShadow: '0 10px 15px -3px rgba(76, 29, 149, 0.3)'
                        }}
                        className="hover-scale"
                    >
                        {profile?.heldBalance > 0 && profile?.kyc?.status !== 'verified' ? "Verify & Release Funds" : "Unlock Instantly"}
                    </button>
                </motion.div>
            )}

            {/* 🛡️ KYC Compliance Nudge (Only show if NO funds are held, otherwise the Escrow Card covers it) */}
            {profile?.kyc?.status !== 'verified' && profile?.heldBalance <= 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        background: 'white', 
                        padding: '24px clamp(16px, 5vw, 32px)', 
                        borderRadius: '32px', 
                        marginBottom: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '24px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Shield size={28} color="var(--primary)" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#1E293B', margin: '0 0 4px 0' }}>Trust & Verification Required</h4>
                            <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600, margin: 0 }}>
                                Complete your identity verification to unlock <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Instant Payouts</span> and higher limits.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/settings?tab=kyc')}
                        style={{ 
                            padding: '14px 32px', 
                            borderRadius: '16px', 
                            background: 'var(--primary)', 
                            color: 'white', 
                            fontWeight: 900, 
                            border: 'none', 
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            boxShadow: '0 10px 15px -3px rgba(76, 29, 149, 0.2)'
                        }}
                        className="hover-scale"
                    >
                        Complete Verification
                    </button>
                </motion.div>
            )}

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
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 10px', borderRadius: '100px' }}>TOTAL REVENUE</span>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>Cash Collected</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.03em' }}>
                        ₦{stats?.revenue?.toLocaleString() || 0}
                    </h2>
                </motion.div>
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="dashboard-glass stat-card-premium" 
                    style={{ padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}
                    onClick={() => navigate("/sales?status=outstanding")}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', padding: '10px', borderRadius: '14px' }}>
                            <Clock size={20} strokeWidth={2.5} />
                        </div>
                        <ArrowUpRight size={18} color="var(--warning)" />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>Cash Outside</p>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--warning)', letterSpacing: '-0.03em' }}>
                        ₦{stats?.outstanding?.toLocaleString() || 0}
                    </h2>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="dashboard-glass stat-card-premium" 
                    style={{ padding: '24px', borderRadius: '28px', border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}
                    onClick={() => navigate("/sales?method=paystack")}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ background: 'rgba(76, 29, 149, 0.1)', color: 'var(--primary)', padding: '10px', borderRadius: '14px' }}>
                            <Zap size={20} strokeWidth={2.5} fill="currentColor" />
                        </div>
                        <Sparkles size={18} color="var(--primary)" />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '4px' }}>Kreddy Settlements</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <h2 className="premium-gradient" style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.03em' }}>₦{kreddySettlements.toLocaleString()}</h2>
                    </div>
                </motion.div>
            </div>

            {/* SIMPLIFIED WEEKLY BATTLE CHART */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                    background: 'white', 
                    padding: '32px', 
                    borderRadius: '32px', 
                    border: '1px solid #E2E8F0', 
                    marginBottom: 'clamp(2rem, 5vw, 40px)',
                    boxShadow: 'var(--shadow-premium)'
                }}
            >
                <div className="weekly-battle-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>This Week's Battle</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginTop: '4px' }}>Money In vs. Collection Pipeline</p>
                    </div>
                    
                    {analytics?.summary && (
                        <div className="weekly-summary-cards" style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ padding: '12px 20px', background: '#F0FDF4', borderRadius: '16px', border: '1px solid #DCFCE7' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: '4px' }}>Money In</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#14532D' }}>₦{analytics.summary.moneyIn.toLocaleString()}</p>
                            </div>
                            <div style={{ padding: '12px 20px', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FEE2E2' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', marginBottom: '4px' }}>Collection Pipeline</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#7F1D1D' }}>₦{analytics.summary.moneyOutside.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Kreddy Insight Box */}
                {analytics?.summary && (
                    <div style={{ 
                        background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', 
                        padding: '16px 20px', 
                        borderRadius: '18px', 
                        marginBottom: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: '1px solid #E2E8F0'
                    }}>
                        <div style={{ background: 'var(--primary)', color: 'white', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Sparkles size={18} fill="white" />
                        </div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', margin: 0 }}>
                            {analytics.summary.collectionRate >= 70 
                                ? "Kreddy Says: Chief, your cash flow is strong! You've successfully recovered most of your receivables."
                                : analytics.summary.collectionRate >= 40
                                ? "Kreddy Says: Good progress! Send a few recovery links to bring more money in today."
                                : "Kreddy Says: A lot of cash is still outside. Let's start the automated recovery process."}
                        </p>
                    </div>
                )}

                <div style={{ width: '100%', height: 260 }}>
                    {!analytics?.daily || analytics.daily.length === 0 ? (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#CBD5E1', flexDirection: 'column', gap: '12px' }}>
                            <Activity size={48} strokeWidth={1} />
                            <p style={{ fontWeight: 600 }}>Analyzing this week's records...</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.daily}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }}
                                    tickFormatter={(val) => `₦${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                                />
                                <Tooltip 
                                    cursor={{ fill: '#F8FAFC' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                                    itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                                    labelStyle={{ fontWeight: 900, marginBottom: '4px', fontSize: '10px', color: '#94A3B8' }}
                                />
                                <Legend 
                                    verticalAlign="top" 
                                    align="right" 
                                    iconType="circle"
                                    wrapperStyle={{ paddingTop: '0', paddingBottom: '24px', fontSize: '11px', fontWeight: 700 }}
                                />
                                <Bar dataKey="Money In" fill="var(--success)" radius={[6, 6, 0, 0]} barSize={24} />
                                <Bar dataKey="Money Outside" name="Collection Pipeline" fill="#FCA5A5" radius={[6, 6, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </motion.div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', 
                gap: '20px', 
                width: '100%',
                boxSizing: 'border-box'
            }} className="dashboard-main-grid">
                {/* Left Column: Priority Collection */}
                <div>
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
                            <div style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--background)', borderRadius: '32px', border: '2px dashed var(--border)' }}>
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
                                    <div className="priority-info" style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 2 }}>
                                        <div style={{
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            padding: '10px',
                                            borderRadius: '12px',
                                            color: 'var(--warning)',
                                            flexShrink: 0
                                        }}>
                                            <Clock size={20} strokeWidth={2.5} />
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <p style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sale.customerName || 'Standard Order'}</p>
                                                {(() => {
                                                    const isViewed = (sale.viewCount > 0) || (sale.lastOpenedAt && sale.lastLinkSentAt 
                                                        ? new Date(sale.lastOpenedAt) > new Date(sale.lastLinkSentAt)
                                                        : sale.viewed);
                                                    
                                                    if (!isViewed) return null;

                                                    const lastSeenText = sale.lastOpenedAt 
                                                        ? `Last seen: ${new Date(sale.lastOpenedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`
                                                        : "Viewed by customer";

                                                    return (
                                                        <span 
                                                            title={lastSeenText}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--primary)', fontWeight: 800 }}
                                                        >
                                                            <Sparkles size={10} fill="var(--primary)" /> 
                                                            VIEWED {sale.viewCount > 1 ? `(${sale.viewCount})` : ""}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>#{sale.invoiceNumber} • {sale.description.slice(0, 30)}{sale.description.length > 30 ? '...' : ''}</p>
                                        </div>
                                    </div>
                                    <div className="priority-amount" style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                                        <div style={{ textAlign: 'right', minWidth: '80px' }}>
                                            <p style={{ fontWeight: 950, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '2px' }}>₦{(sale.totalAmount - (sale.payments?.reduce((sum, p) => sum + p.amount, 0) || 0)).toLocaleString()}</p>
                                            <span className="premium-badge" style={{ 
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                color: 'var(--warning)',
                                                textTransform: 'uppercase', fontSize: '0.6rem', fontWeight: 900,
                                                padding: '2px 8px', borderRadius: '6px'
                                            }}
                                            >
                                                {sale.status === 'partial' ? 'PARTIAL' : 'UNPAID'}
                                            </span>
                                        </div>
                                        <ChevronRight size={18} color="var(--text-muted)" />
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

            <PlanLimitModal 
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                onUpgrade={() => navigate('/settings')}
            />

            <style>{`
                .premium-gradient {
                    background: linear-gradient(135deg, var(--primary) 0%, #F472B6 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                @media (max-width: 1024px) {
                    .dashboard-main-grid {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
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
                
                @media (max-width: 640px) {
                    .weekly-battle-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }
                    .weekly-summary-cards {
                        width: 100% !important;
                        flex-direction: column !important;
                    }
                    .weekly-summary-cards > div {
                        width: 100% !important;
                    }
                    .dashboard-glass {
                        padding: 16px !important;
                    }
                    .priority-item {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 16px !important;
                    }
                    .priority-info {
                        width: 100% !important;
                    }
                    .priority-amount {
                        width: 100% !important;
                        justify-content: space-between !important;
                        padding-top: 12px !important;
                        border-top: 1px dashed #E2E8F0 !important;
                    }
                    .recharts-cartesian-axis-tick text {
                        font-size: 10px !important;
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
