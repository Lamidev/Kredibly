import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Users,
    TrendingUp,
    CreditCard,
    Activity,
    ShieldAlert,
    ChevronRight,
    Search,
    X,
    LayoutDashboard,
    MessageSquare,
    RefreshCw,
    Terminal,
    ArrowUpRight,
    Zap,
    ShieldCheck,
    Globe,
    LogOut,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [users, setUsers] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [waitlist, setWaitlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'tickets', 'waitlist'
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleActivities, setVisibleActivities] = useState(10);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('waitlist'); // 'waitlist' or 'user'
    const { logout } = useAuth();

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
            const [statsRes, usersRes, ticketsRes, waitlistRes] = await Promise.all([
                axios.get(`${API_URL}/admin/stats`, { withCredentials: true }),
                axios.get(`${API_URL}/admin/users`, { withCredentials: true }),
                axios.get(`${API_URL}/support/tickets/all`, { withCredentials: true }),
                axios.get(`${API_URL}/admin/waitlist`, { withCredentials: true })
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
                setActivities(statsRes.data.activities);
            }
            if (usersRes.data.success) {
                setUsers(usersRes.data.data);
            }
            if (ticketsRes.data.success) {
                setTickets(ticketsRes.data.data.map(t => ({ ...t, replyText: '' })));
            }
            if (waitlistRes.data.success) {
                setWaitlist(waitlistRes.data.data);
            }
            if (manual) toast.success("System Data Synced");
        } catch (err) {
            console.error("Failed to fetch admin data", err);
            if (manual) toast.error("Sync failed");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleReply = async (ticket) => {
        if (!ticket.replyText?.trim()) return;
        try {
            await axios.patch(`${API_URL}/support/tickets/${ticket._id}/reply`, { 
                message: ticket.replyText 
            }, { withCredentials: true });
            toast.success("Response sent");
            fetchAdminData(false, true);
        } catch (err) {
            toast.error("Failed to reply");
        }
    };

    const handleResolve = async (ticketId) => {
        try {
            await axios.patch(`${API_URL}/support/tickets/${ticketId}/resolve`, {}, { withCredentials: true });
            toast.success("Resolved successfully");
            fetchAdminData(false, true);
        } catch (err) {
            toast.error("Action failed");
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const endpoint = deleteType === 'waitlist' ? `/admin/waitlist/${itemToDelete}` : `/admin/users/${itemToDelete}`;
        try {
            await axios.delete(`${API_URL}${endpoint}`, { withCredentials: true });
            toast.success(deleteType === 'waitlist' ? "Entry deleted" : "User and data purged");
            
            if (deleteType === 'waitlist') {
                setWaitlist(waitlist.filter(w => w._id !== itemToDelete));
            } else {
                setUsers(users.filter(u => u._id !== itemToDelete));
            }
            
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        } catch (err) {
            toast.error("Failed to delete entry");
        }
    };

    const handleDeleteClick = (id, type = 'waitlist') => {
        setItemToDelete(id);
        setDeleteType(type);
        setShowDeleteConfirm(true);
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const filteredUsers = users.filter(u => {
        const name = (u.business?.displayName || u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const search = searchTerm.toLowerCase().trim();
        return !search || name.includes(search) || email.includes(search);
    });

    const statCards = [
        { label: 'Total Members', value: stats?.totalUsers || 0, icon: Users, color: '#6366F1', trend: '+12%' },
        { label: 'Platform Volume', value: `₦${stats?.totalRevenue?.toLocaleString()}`, icon: TrendingUp, color: '#10B981', trend: '+8%' },
        { label: 'Money Outside', value: `₦${stats?.totalOutstanding?.toLocaleString()}`, icon: CreditCard, color: '#F59E0B', trend: '+24%' },
        { label: 'Ledger Records', value: stats?.totalSalesCount || 0, icon: Activity, color: '#8B5CF6', trend: '+15%' },
    ];

    return (
        <div className="animate-fade-in admin-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 20px', minHeight: '100vh' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                        <ShieldAlert size={14} /> Kredibly Core • Restricted Access
                    </div>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em', margin: 0, lineHeight: 1.1 }}>
                        Control Center
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: '8px', fontSize: '0.95rem' }}>Global oversight and management for the Kredibly network.</p>
                </div>

                <div className="admin-actions-header" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => fetchAdminData(true)}
                        disabled={isRefreshing}
                        style={{
                            background: 'white', border: '1px solid var(--border)', padding: '12px 20px', borderRadius: '16px',
                            color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                            fontWeight: 700, fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                        <span className="hidden sm:block">{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        style={{
                            background: '#FEF2F2', border: '1px solid #FEE2E2', padding: '12px 20px', borderRadius: '16px',
                            color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                            fontWeight: 700, fontSize: '0.85rem'
                        }}
                    >
                        <LogOut size={18} />
                        <span className="hidden md:block">Logout</span>
                    </button>
                    
                    <div style={{ display: 'flex', background: 'white', padding: '6px', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        {[
                            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                            { id: 'users', label: 'Members', icon: Users },
                            { id: 'waitlist', label: 'Waitlist', icon: Zap }, // Using Zap for Waitlist
                            { id: 'tickets', label: 'Support', icon: MessageSquare }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        padding: '10px 16px', borderRadius: '14px', fontSize: '0.8rem', fontWeight: 800, border: 'none',
                                        background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                        color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <Icon size={16} />
                                    <span className="hidden md:block">{tab.label}</span>
                                    {tab.id === 'tickets' && tickets.filter(t => t.status === 'open').length > 0 && (
                                        <span style={{ background: '#EF4444', color: 'white', padding: '2px 6px', borderRadius: '8px', fontSize: '0.65rem' }}>
                                            {tickets.filter(t => t.status === 'open').length}
                                        </span>
                                    )}
                                    {tab.id === 'waitlist' && waitlist.length > 0 && (
                                        <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '8px', fontSize: '0.65rem', opacity: 0.8 }}>
                                            {waitlist.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        {/* Stats Bento Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                            {statCards.map((stat, i) => (
                                <div key={i} className="glass-card" style={{ padding: '24px', background: 'white', borderRadius: '28px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{ background: `${stat.color}10`, color: stat.color, width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <stat.icon size={22} strokeWidth={2.5} />
                                        </div>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#10B981', background: '#ECFDF5', padding: '4px 8px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <ArrowUpRight size={12} /> {stat.trend}
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{stat.label}</p>
                                        <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.04em' }}>{loading ? '...' : stat.value}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="overview-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                            {/* Live Ledger Activity */}
                            <div className="glass-card" style={{ padding: '32px 24px', background: 'white', border: '1px solid var(--border)', borderRadius: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <div>
                                        <h3 style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                            <Terminal size={22} color="var(--primary)" /> Network Activity
                                        </h3>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', fontWeight: 800, color: '#10B981', background: '#ECFDF5', padding: '6px 12px', borderRadius: '100px' }}>
                                        <span style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                                        LIVE
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {loading ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '16px', marginBottom: '12px' }}></div>) : (
                                        <>
                                            {activities.slice(0, visibleActivities).map((log, i) => (
                                                <div key={log._id} className="row-hover" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', borderRadius: '16px' }}>
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.action.includes('SALE') ? 'var(--success)' : log.action.includes('USER') ? 'var(--primary)' : '#94A3B8', flexShrink: 0 }}></div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <p style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details}</p>
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>{log.action.replace(/_/g, ' ')} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {activities.length > visibleActivities && (
                                                <button 
                                                    onClick={() => setVisibleActivities(prev => prev + 10)}
                                                    style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '14px', borderRadius: '16px', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', marginTop: '16px', fontSize: '0.85rem' }}
                                                >
                                                    View Morer
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* System Context Cards */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="glass-card" style={{ padding: '28px', background: 'white', border: '1px solid var(--border)', borderRadius: '32px' }}>
                                    <h4 style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}> <Globe size={18} color="var(--primary)" /> Network Adoption</h4>
                                    <div style={{ width: '100%', height: '10px', background: '#F1F5F9', borderRadius: '10px', marginBottom: '16px', overflow: 'hidden' }}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (stats?.totalBusinesses / (stats?.totalUsers || 1)) * 100)}%` }}
                                            style={{ height: '100%', background: 'var(--primary)', borderRadius: '10px' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>Conversion</p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>{Math.round((stats?.totalBusinesses / (stats?.totalUsers || 1)) * 100)}%</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, margin: 0 }}>Active Brands</p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>{stats?.totalBusinesses || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card" style={{ padding: '28px', background: '#1E1B4B', border: 'none', borderRadius: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'relative', zIndex: 2 }}>
                                        <h4 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '20px', color: 'white' }}>Founder Actions</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                            <button onClick={() => setActiveTab('users')} style={{ flex: '1 1 140px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', padding: '12px', borderRadius: '16px', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}>
                                                Manage Users
                                            </button>
                                            <button style={{ flex: '1 1 140px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', borderRadius: '16px', color: '#94A3B8', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'not-allowed', fontWeight: 800, fontSize: '0.85rem' }}>
                                                System Alert
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'users' && (
                    <motion.div key="users" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <div className="glass-card" style={{ padding: '32px 20px', background: 'white', border: '1px solid var(--border)', borderRadius: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
                                <h3 style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text)', margin: 0 }}>Founders Log: Members</h3>
                                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                                    <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search members..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ padding: '14px 44px', borderRadius: '16px', border: '1px solid var(--border)', fontSize: '0.95rem', width: '100%', background: '#F8FAFC', outline: 'none', fontWeight: 600 }}
                                    />
                                </div>
                            </div>

                            {/* Tablet/Desktop Table */}
                            <div style={{ overflowX: 'auto' }} className="hidden md:block no-scrollbar">
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Member</th>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Hub</th>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Date</th>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Security</th>
                                            <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((u) => (
                                            <tr key={u._id} className="row-hover" style={{ background: 'white' }}>
                                                <td style={{ padding: '16px 20px', borderRadius: '16px 0 0 16px', border: '1px solid #F1F5F9', borderRight: 'none' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem' }}>
                                                            {(u.business?.displayName || u.name || 'K').charAt(0)}
                                                        </div>
                                                        <div style={{ minWidth: 0 }}>
                                                            <p style={{ fontWeight: 800, margin: 0, fontSize: '0.95rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.business?.displayName || u.name}</p>
                                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>{u.business?.whatsappNumber || 'N/A'}</p>
                                                </td>
                                                <td style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                                    <span style={{
                                                        padding: '6px 12px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 900,
                                                        background: u.isVerified ? '#ECFDF5' : '#FEF2F2',
                                                        color: u.isVerified ? '#059669' : '#DC2626'
                                                    }}>
                                                        {u.isVerified ? 'VERIFIED' : 'PENDING'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 20px', borderRadius: '0 16px 16px 0', border: '1px solid #F1F5F9', borderLeft: 'none', textAlign: 'right' }}>
                                                    <button 
                                                        onClick={() => handleDeleteClick(u._id, 'user')}
                                                        style={{ background: '#FDF2F2', border: '1px solid #FEE2E2', width: '36px', height: '36px', borderRadius: '10px', color: '#EF4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile List */}
                            <div className="md:hidden flex flex-col gap-12">
                                {filteredUsers.map((u) => (
                                    <div key={u._id} style={{ padding: '20px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #EDF2F7' }}>
                                        <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                                {(u.business?.displayName || u.name || 'K').charAt(0)}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontWeight: 800, color: 'var(--text)', margin: 0 }}>{u.business?.displayName || u.name}</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                                            <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, background: u.isVerified ? '#DCFCE7' : '#FEE2E2', color: u.isVerified ? '#15803D' : '#B91C1C' }}>
                                                {u.isVerified ? 'VERIFIED' : 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'waitlist' && (
                    <motion.div key="waitlist" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <div className="glass-card" style={{ padding: '32px 20px', background: 'white', border: '1px solid var(--border)', borderRadius: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h3 style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text)', margin: 0 }}>Founding 100: Waitlist</h3>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(76, 29, 149, 0.05)', padding: '8px 16px', borderRadius: '100px' }}>
                                    {waitlist.length} Signups Captured
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }} className="no-scrollbar">
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Prospect</th>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Industry</th>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Contact</th>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Date</th>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Referrals</th>
                                            <th style={{ textAlign: 'right', padding: '12px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {waitlist.filter(w => !searchTerm || w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.email.toLowerCase().includes(searchTerm.toLowerCase())).map((w) => (
                                            <tr key={w._id} className="row-hover" style={{ background: 'white' }}>
                                                <td style={{ padding: '16px 20px', borderRadius: '16px 0 0 16px', border: '1px solid #F1F5F9', borderRight: 'none' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 800, margin: 0, fontSize: '0.95rem', color: 'var(--text)' }}>{w.name}</p>
                                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0, fontWeight: 600 }}>{w.email}</p>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                                    <span style={{ padding: '4px 10px', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>{w.industry}</span>
                                                </td>
                                                <td style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                                    <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>{w.whatsappNumber}</p>
                                                </td>
                                                <td style={{ padding: '16px 20px', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
                                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(w.createdAt).toLocaleDateString()}</p>
                                                </td>
                                                <td style={{ padding: '16px 20px', borderRadius: '0 16px 16px 0', border: '1px solid #F1F5F9', borderLeft: 'none' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: w.referralCount > 0 ? 'var(--primary-glow)' : '#F1F5F9', color: w.referralCount > 0 ? 'var(--primary)' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                                                            {w.referralCount}
                                                        </div>
                                                        {w.referralCount >= 3 && <span style={{ fontSize: '10px', fontWeight: 900, color: '#10B981', textTransform: 'uppercase' }}>Top Tier</span>}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 20px', borderRadius: '0 16px 16px 0', border: '1px solid #F1F5F9', borderLeft: 'none', textAlign: 'right' }}>
                                                    <button 
                                                        onClick={() => handleDeleteClick(w._id, 'waitlist')}
                                                        className="delete-btn-hover"
                                                        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', width: '36px', height: '36px', borderRadius: '10px', color: '#EF4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'tickets' && (
                    <motion.div key="tickets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {tickets.length === 0 ? (
                                <div className="glass-card" style={{ padding: '100px 40px', textAlign: 'center', background: 'white', borderRadius: '32px' }}>
                                    <MessageSquare size={60} style={{ marginBottom: '24px', opacity: 0.1, color: 'var(--primary)' }} />
                                    <h3 style={{ fontWeight: 900, color: 'var(--text)' }}>No active requests.</h3>
                                </div>
                            ) : (
                                tickets.map((t) => (
                                    <motion.div
                                        key={t._id}
                                        className="glass-card"
                                        style={{ padding: '32px 24px', background: 'white', borderRadius: '32px', border: '1px solid var(--border)', opacity: t.status === 'resolved' ? 0.7 : 1 }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                <div style={{ width: '48px', height: '48px', background: 'var(--primary)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white' }}>
                                                    {(t.businessId?.displayName || t.userId?.name || 'K').charAt(0)}
                                                 </div>
                                                 <div>
                                                     <h4 style={{ margin: 0, fontWeight: 900, color: 'var(--text)', fontSize: '1.1rem' }}>{t.businessId?.displayName || 'Merchant'}</h4>
                                                     <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t.userId?.email}</p>
                                                 </div>
                                            </div>
                                            <span style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900, background: '#F1F5F9', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.status}</span>
                                        </div>

                                        <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '20px', fontSize: '1rem', color: 'var(--text)', lineHeight: 1.6, fontWeight: 500, border: '1px solid #EDF2F7', marginBottom: '24px' }}>
                                            {t.message}
                                        </div>

                                        {t.status !== 'resolved' && (
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Founder response..."
                                                    id={`reply-${t._id}`}
                                                    value={t.replyText || ''}
                                                    onChange={(e) => {
                                                        const newTickets = [...tickets];
                                                        const idx = tickets.findIndex(item => item._id === t._id);
                                                        newTickets[idx].replyText = e.target.value;
                                                        setTickets(newTickets);
                                                    }}
                                                    style={{ flex: 1, padding: '14px 20px', borderRadius: '16px', border: '1px solid #E2E8F0', outline: 'none', fontWeight: 600 }}
                                                />
                                                <button onClick={() => handleReply(t)} disabled={!t.replyText?.trim()} className="btn-primary" style={{ padding: '0 24px', borderRadius: '16px' }}>Send</button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.15)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }} className="animate-fade-in">
                    <div className="glass-card" style={{ padding: '32px', maxWidth: '400px', width: '100%', background: 'white', borderRadius: '28px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ background: '#FEF2F2', color: '#EF4444', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <LogOut size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1E293B', marginBottom: '12px', letterSpacing: '-0.02em' }}>Ready to Leave?</h3>
                        <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: 1.6, fontWeight: 500 }}>You are about to sign out of the founder's dashboard. Ensure all sensitive data is synced.</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                className="btn-secondary" 
                                style={{ flex: 1, padding: '14px', borderRadius: '16px', fontWeight: 700, fontSize: '0.95rem', background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer' }} 
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Stay Here
                            </button>
                            <button 
                                style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }} 
                                onClick={logout}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.15)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '20px' }} className="animate-fade-in">
                    <div className="glass-card" style={{ padding: '32px', maxWidth: '400px', width: '100%', background: 'white', borderRadius: '28px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ background: '#FEF2F2', color: '#EF4444', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Trash2 size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1E293B', marginBottom: '12px', letterSpacing: '-0.02em' }}>Confirm Deletion?</h3>
                        <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: 1.6, fontWeight: 500 }}>
                            {deleteType === 'waitlist' 
                                ? 'You are about to remove this entry from the waitlist. This action is irreversible.' 
                                : 'CRITICAL: You are about to purge this user and ALL their business data (invoices, sales, logs). This cannot be undone.'}
                        </p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                className="btn-secondary" 
                                style={{ flex: 1, padding: '14px', borderRadius: '16px', fontWeight: 700, fontSize: '0.95rem', background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer' }} 
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setItemToDelete(null);
                                }}
                            >
                                Cancel
                            </button>
                             <button 
                                style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }} 
                                onClick={confirmDelete}
                             >
                                {deleteType === 'user' ? 'Purge User' : 'Delete Forever'}
                             </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .skeleton {
                    background: linear-gradient(90deg, #F8FAFC 25%, #F1F5F9 50%, #F8FAFC 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .row-hover:hover {
                    background: #F8FAFC !important;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                @media (max-width: 640px) {
                    .admin-container { padding: 40px 16px !important; }
                    .admin-actions-header { width: 100%; margin-top: 10px; }
                    .admin-actions-header > div { width: 100%; }
                    .admin-actions-header button { flex: 1; }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
