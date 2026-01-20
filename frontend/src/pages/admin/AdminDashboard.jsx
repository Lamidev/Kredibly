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
    X
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [users, setUsers] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleActivities, setVisibleActivities] = useState(10);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        fetchAdminData();

        // 🟢 Real-time polling every 60 seconds (optimized from 10s)
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                fetchAdminData();
            }
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const fetchAdminData = async (manual = false) => {
        if (!stats && !manual) setLoading(true); // Only show loader on initial page load
        if (manual) setIsRefreshing(true);

        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const [statsRes, usersRes, ticketsRes] = await Promise.all([
                axios.get(`${API_URL}/admin/stats`, { withCredentials: true }),
                axios.get(`${API_URL}/admin/users`, { withCredentials: true }),
                axios.get(`${API_URL}/support/tickets/all`, { withCredentials: true })
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
        } catch (err) {
            console.error("Failed to fetch admin data", err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const statsLoading = stats === null;

    const statCards = [
        { label: 'Total Registrations', value: stats?.totalUsers || 0, icon: Users, color: '#3B82F6', bg: '#EFF6FF' },
        { label: 'Platform Revenue', value: `₦${stats?.totalRevenue?.toLocaleString()}`, icon: TrendingUp, color: '#10B981', bg: '#ECFDF5' },
        { label: 'Total Outstanding', value: `₦${stats?.totalOutstanding?.toLocaleString()}`, icon: CreditCard, color: '#F59E0B', bg: '#FFFBEB' },
        { label: 'Active Records', value: stats?.totalSalesCount, icon: Activity, color: '#8B5CF6', bg: '#F5F3FF' },
    ];

    const filteredUsers = users.filter(u => {
        const name = (u.name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const bizName = (u.business?.displayName || "").toLowerCase();
        const search = searchTerm.toLowerCase().trim();
        
        if (!search) return true;
        
        return name.includes(search) || 
               email.includes(search) || 
               bizName.includes(search);
    });

    const LoadingSkeleton = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '48px' }}>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '24px' }}></div>
            ))}
        </div>
    );

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
            {/* Admin Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                        <ShieldAlert size={14} /> Founder Controls • Restricted Access
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1E293B', letterSpacing: '-0.03em' }}>
                        God View <span style={{ fontWeight: 400, color: '#94A3B8' }}>/ Analytics</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={() => fetchAdminData(true)}
                        disabled={isRefreshing}
                        style={{
                            background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '12px',
                            color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                            fontWeight: 700, fontSize: '0.85rem'
                        }}
                    >
                        <Activity size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        {isRefreshing ? 'Syncing...' : 'Refresh'}
                    </button>
                    <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
                        <button
                            onClick={() => setActiveTab('overview')}
                            style={{
                                padding: '8px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, border: 'none',
                                background: activeTab === 'overview' ? 'white' : 'transparent',
                                color: activeTab === 'overview' ? 'var(--primary)' : '#64748B',
                                boxShadow: activeTab === 'overview' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('users')}
                            style={{
                                padding: '8px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, border: 'none',
                                background: activeTab === 'users' ? 'white' : 'transparent',
                                color: activeTab === 'users' ? 'var(--primary)' : '#64748B',
                                boxShadow: activeTab === 'users' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab('tickets')}
                            style={{
                                padding: '8px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, border: 'none',
                                background: activeTab === 'tickets' ? 'white' : 'transparent',
                                color: activeTab === 'tickets' ? 'var(--primary)' : '#64748B',
                                boxShadow: activeTab === 'tickets' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Tickets {tickets.filter(t => t.status === 'open').length > 0 && <span style={{ background: '#EF4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.65rem', marginLeft: '4px' }}>{tickets.filter(t => t.status === 'open').length}</span>}
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {loading ? <LoadingSkeleton /> : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '48px' }}>
                            {statCards.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-card"
                                    style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                                >
                                    <div style={{ background: stat.bg, color: stat.color, width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                        <stat.icon size={20} />
                                    </div>
                                    <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{stat.label}</p>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1E293B' }}>{stat.value}</h3>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                        {/* Main Feed */}
                        <div>
                            <div className="glass-card" style={{ padding: '32px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                        <Activity size={20} color="var(--primary)" /> Platform Live Feed
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3B82F6', background: '#EFF6FF', padding: '4px 10px', borderRadius: '20px' }}>REAL-TIME</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {loading ? [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '12px', marginBottom: '10px' }}></div>) : activities.length === 0 ? (
                                        <p style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>No logs yet.</p>
                                    ) : (
                                        <>
                                            {activities.slice(0, visibleActivities).map((log, i) => (
                                                <div key={log._id} style={{
                                                    padding: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    borderBottom: i === activities.slice(0, visibleActivities).length - 1 ? 'none' : '1px solid #F1F5F9',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    <div style={{
                                                        width: '8px', height: '8px', borderRadius: '50%',
                                                        background: log.action.includes('SALE') ? '#10B981' : log.action.includes('USER') ? '#3B82F6' : '#94A3B8'
                                                    }}></div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{log.details}</p>
                                                        <p style={{ fontSize: '0.75rem', color: '#94A3B8', margin: '4px 0 0 0' }}>{log.action.replace(/_/g, ' ')} • {new Date(log.createdAt).toLocaleString()}</p>
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: '#F8FAFC', color: '#64748B' }}>
                                                        {log.entityType}
                                                    </div>
                                                </div>
                                            ))}
                                            {activities.length > visibleActivities && (
                                                <button 
                                                    onClick={() => setVisibleActivities(prev => prev + 10)}
                                                    style={{ width: '100%', background: '#F8FAFC', border: 'none', padding: '12px', borderRadius: '12px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', marginTop: '12px' }}
                                                >
                                                    Load more activities
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Context */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="glass-card" style={{ padding: '24px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px' }}>
                                <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: '16px' }}>Hustler Onboarding</h4>
                                <div style={{ width: '100%', height: '12px', background: '#F1F5F9', borderRadius: '6px', marginBottom: '16px', overflow: 'hidden' }}>
                                    <div style={{ width: Math.min(100, (stats?.totalBusinesses / 10) * 100) + '%', height: '100%', background: 'var(--primary)', borderRadius: '6px' }}></div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                                    <span style={{ color: '#64748B' }}>Business Adoption</span>
                                    <span style={{ color: 'var(--primary)' }}>{stats?.totalBusinesses || 0} / {stats?.totalUsers || 0} Profiles</span>
                                </div>
                            </div>

                            <div className="glass-card" style={{ padding: '24px', background: '#1E293B', border: '1px solid #334155', borderRadius: '24px', color: 'white' }}>
                                <h4 style={{ fontWeight: 800, color: 'white', marginBottom: '16px' }}>Terminal Operations</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button onClick={() => setActiveTab('users')} style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none', padding: '12px', borderRadius: '12px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 700 }}>
                                        Registered Users <ChevronRight size={16} />
                                    </button>
                                    <button style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', padding: '12px', borderRadius: '12px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'not-allowed', fontWeight: 700 }}>
                                        Broadcast Alert <ShieldAlert size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : activeTab === 'users' ? (
                <div className="glass-card" style={{ padding: '32px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '32px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontWeight: 800, color: '#1E293B', margin: 0 }}>All Kredibly Members ({filteredUsers.length})</h3>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="text"
                                placeholder="Search Name, Email or Biz..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '12px 40px 12px 40px', borderRadius: '14px', border: '1px solid #E2E8F0', fontSize: '0.9rem', width: '320px', background: '#F8FAFC' }}
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }} className="no-scrollbar">
                        {loading ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: '12px', marginBottom: '12px' }}></div>) : filteredUsers.length === 0 ? (
                            <div style={{ padding: '80px', textAlign: 'center', color: '#94A3B8' }}>
                                <Users size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                <p style={{ fontWeight: 700 }}>No hustlers found matching your search.</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                                        <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>MEMBER / BRAND</th>
                                        <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>EMAIL</th>
                                        <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>WHATSAPP HUB</th>
                                        <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>ONBOARDED</th>
                                        <th style={{ textAlign: 'left', padding: '16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u, i) => (
                                        <tr key={u._id} className="row-hover" style={{ borderBottom: '1px solid #F1F5F9' }}>
                                            <td style={{ padding: '16px' }}>
                                                <p style={{ fontWeight: 800, margin: 0, fontSize: '1rem', color: '#1E293B' }}>{u.business?.displayName || u.name}</p>
                                                <p style={{ color: '#94A3B8', fontSize: '0.8rem', margin: 0 }}>ID: {u.name || u.email}</p>
                                            </td>
                                            <td style={{ padding: '16px', color: '#64748B', fontWeight: 600 }}>{u.email}</td>
                                            <td style={{ padding: '16px', color: '#64748B', fontWeight: 600 }}>{u.business?.whatsappNumber || 'Not Linked'}</td>
                                            <td style={{ padding: '16px', color: '#94A3B8', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{
                                                    padding: '6px 12px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900,
                                                    background: u.isVerified ? '#DCFCE7' : '#FEE2E2',
                                                    color: u.isVerified ? '#15803D' : '#B91C1C'
                                                }}>
                                                    {u.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {tickets.length === 0 ? (
                        <div className="glass-card" style={{ padding: '80px', textAlign: 'center', background: 'white' }}>
                            <h3 style={{ fontWeight: 800 }}>No Support Tickets</h3>
                            <p style={{ color: '#64748B' }}>Every hustler is currently happy!</p>
                        </div>
                    ) : (
                        tickets.map((t) => (
                            <motion.div
                                key={t._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-card"
                                style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', opacity: t.status === 'resolved' ? 0.6 : 1 }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', background: '#F0F9FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)' }}>
                                            {(t.businessId?.displayName || t.userId?.name || 'K').charAt(0)}
                                         </div>
                                         <div>
                                             <h4 style={{ margin: 0, fontWeight: 800, color: '#1E293B' }}>{t.businessId?.displayName || 'Personal Hustle'}</h4>
                                             <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>{t.userId?.name} • {t.userId?.email}</p>
                                         </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {t.status !== 'resolved' && (
                                            <button
                                                onClick={async () => {
                                                    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
                                                    await axios.patch(`${API_URL}/support/tickets/${t._id}/resolve`, {}, { withCredentials: true });
                                                    fetchAdminData();
                                                }}
                                                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', background: '#10B981', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                Mark Resolved
                                            </button>
                                        )}
                                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, background: t.status === 'open' ? '#EEF2FF' : '#F1F5F9', color: t.status === 'open' ? 'var(--primary)' : '#64748B' }}>
                                            {t.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', fontSize: '0.95rem', color: '#1E293B', lineHeight: 1.6 }}>
                                    {t.message}
                                </div>

                                {t.replies && t.replies.length > 0 && (
                                    <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {t.replies.map((reply, idx) => (
                                            <div key={idx} style={{
                                                alignSelf: reply.sender === 'admin' ? 'flex-end' : 'flex-start',
                                                background: reply.sender === 'admin' ? 'var(--primary)' : '#F1F5F9',
                                                color: reply.sender === 'admin' ? 'white' : '#1E293B',
                                                padding: '10px 16px',
                                                borderRadius: '12px',
                                                maxWidth: '80%',
                                                fontSize: '0.9rem'
                                            }}>
                                                {reply.message}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {t.status !== 'resolved' && (
                                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            placeholder="Write a response..."
                                            value={t.replyText || ''}
                                            onChange={(e) => {
                                                const newTickets = [...tickets];
                                                newTickets[tickets.indexOf(t)].replyText = e.target.value;
                                                setTickets(newTickets);
                                            }}
                                            style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!t.replyText) return;
                                                const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
                                                await axios.patch(`${API_URL}/support/tickets/${t._id}/reply`, { message: t.replyText }, { withCredentials: true });
                                                fetchAdminData();
                                            }}
                                            style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Reply
                                        </button>
                                    </div>
                                )}

                                <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#94A3B8' }}>
                                    Submitted {new Date(t.createdAt).toLocaleString()}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .skeleton {
                    background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s infinite;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .row-hover:hover {
                    background: #F8FAFC !important;
                    transition: background 0.2s;
                }
                @media (max-width: 768px) {
                    h1 { font-size: 1.8rem !important; }
                    .glass-card { padding: 20px !important; }
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;
