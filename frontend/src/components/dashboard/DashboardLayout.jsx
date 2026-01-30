import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
    LayoutDashboard,
    FileText,
    Users,
    BarChart3,
    ShieldCheck,
    Settings,
    Plus,
    Search,
    Bell,
    Menu,
    X,
    LogOut,
    User as UserIcon,
    MessagesSquare,
    RefreshCcw
} from 'lucide-react';
import { useSales } from '../../context/SaleContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import SupportHub from './SupportHub';

const getInitials = (name) => {
    if (!name) return "K";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { profile, logout } = useAuth();
    const { fetchSales, fetchStats } = useSales();
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        if (isSidebarOpen) {
            document.body.classList.add('lock-scroll');
        } else {
            document.body.classList.remove('lock-scroll');
        }
        return () => document.body.classList.remove('lock-scroll');
    }, [isSidebarOpen]);

    useEffect(() => {
        if (profile) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // 30s
            
            const handleRefresh = () => fetchNotifications();
            window.addEventListener('refreshNotifications', handleRefresh);
            
            return () => {
                clearInterval(interval);
                window.removeEventListener('refreshNotifications', handleRefresh);
            };
        }
    }, [profile]);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get(`${API_URL}/notifications`, { withCredentials: true });
            if (res.data.success) {
                setNotifications(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };
    
    const globalRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchSales(), fetchStats(), fetchNotifications()]);
            toast.success("Dashboard refreshed! 🚀");
        } catch (err) {
            toast.error("Failed to refresh data.");
        } finally {
            setIsRefreshing(false);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.delete(`${API_URL}/notifications/clear-all`, { withCredentials: true });
            setNotifications([]);
            setShowNotifications(false);
        } catch (err) {
            console.error(err);
        }
    };

    const clearOne = async (id) => {
        try {
            await axios.delete(`${API_URL}/notifications/${id}`, { withCredentials: true });
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, end: true },
        { label: 'Ledger (Sales)', path: '/sales', icon: FileText, activeIfMatch: ['/sales'] },
        { label: 'Money Outside', path: '/debtors', icon: Users, activeIfMatch: ['/debtors'] },
        { label: 'Reports', path: '/reports', icon: BarChart3 },
        { label: 'Verifiable Proofs', path: '/proofs', icon: ShieldCheck },
    ];

    return (
        <div className="dashboard-wrapper">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(4px)' }}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar sidebar-premium ${isSidebarOpen ? 'mobile-open' : ''}`} style={{ background: 'white', borderRight: '1px solid var(--border)' }}>
                <div className="sidebar-header" style={{ padding: '32px 24px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img 
                            src="/krediblyrevamped.png" 
                            alt="Kredibly" 
                            style={{ height: '35px', width: 'auto', filter: 'contrast(1.15) brightness(1.02)' }} 
                        />
                    </div>
                </div>

                <div style={{ padding: '0 16px 32px' }}>
                    <button
                        className="btn-primary"
                        style={{ 
                            width: '100%', 
                            padding: '16px', 
                            borderRadius: '16px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '10px',
                            fontWeight: 800,
                            letterSpacing: '-0.01em',
                            boxShadow: '0 10px 20px -5px var(--primary-glow)'
                        }}
                        onClick={() => {
                            navigate('/sales/new');
                            setIsSidebarOpen(false);
                        }}
                    >
                        <Plus size={20} strokeWidth={3} /> Create Sale
                    </button>
                </div>

                <nav className="sidebar-nav" style={{ flex: 1 }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => {
                                let isMatched = item.activeIfMatch 
                                    ? item.activeIfMatch.some(p => location.pathname.startsWith(p))
                                    : isActive;

                                // Special case for individual invoice view
                                if (location.pathname.startsWith('/dashboard/invoice')) {
                                    const from = location.state?.from || '/sales';
                                    if (item.path === from) {
                                        isMatched = true;
                                    } else {
                                        isMatched = false;
                                    }
                                }

                                return `nav-item-premium ${isMatched ? 'active' : ''}`;
                            }}
                            onClick={() => setIsSidebarOpen(false)}
                            style={{ margin: '4px 16px' }}
                        >
                            {({ isActive }) => {
                                const isMatched = item.activeIfMatch 
                                    ? item.activeIfMatch.some(p => location.pathname.startsWith(p))
                                    : isActive;
                                return (
                                    <>
                                        <item.icon size={20} strokeWidth={isMatched ? 2.5 : 2} />
                                        <span style={{ fontWeight: 700 }}>{item.label}</span>
                                    </>
                                );
                            }}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ borderTop: '1px solid #F1F5F9', padding: '16px 0 32px' }}>
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `nav-item-premium ${isActive ? 'active' : ''}`}
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ margin: '4px 16px' }}
                    >
                        <Settings size={20} /> <span style={{ fontWeight: 700 }}>Settings</span>
                    </NavLink>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="nav-item-premium"
                        style={{ 
                            width: 'calc(100% - 32px)', 
                            background: 'rgba(239, 68, 68, 0.05)', 
                            border: '1px solid rgba(239, 68, 68, 0.1)', 
                            cursor: 'pointer', 
                            margin: '8px 16px', 
                            color: '#EF4444',
                            borderRadius: '12px',
                            justifyContent: 'flex-start'
                        }}
                    >
                        <LogOut size={20} /> <span style={{ fontWeight: 700 }}>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content-layout">
                <header className="top-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                            className="lg:hidden"
                        >
                            <Menu size={24} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                            <button
                                onClick={globalRefresh}
                                disabled={isRefreshing}
                                style={{ background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '12px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Refresh Dashboard"
                            >
                                <RefreshCcw size={20} className={isRefreshing ? 'spin-animation' : ''} />
                            </button>

                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '12px', color: '#64748B', cursor: 'pointer', position: 'relative' }}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span style={{ 
                                        position: 'absolute', top: '-5px', right: '-5px', 
                                        minWidth: '20px', height: '20px', 
                                        background: '#EF4444', color: 'white',
                                        borderRadius: '50%', border: '2px solid white',
                                        fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, padding: '0 4px'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="glass-card" style={{
                                    position: 'absolute', top: '50px', right: '0', 
                                    width: 'calc(100vw - 32px)', maxWidth: '350px',
                                    background: 'white', border: '1px solid #E2E8F0', padding: '0',
                                    zIndex: 1000, borderRadius: '24px', overflow: 'hidden', 
                                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                    animation: 'slideDown 0.2s ease-out'
                                }}>
                                    <div style={{ padding: '20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900 }}>Alerts</h4>
                                        <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Clear All</button>
                                    </div>
                                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>
                                                <Bell size={24} style={{ opacity: 0.2, marginBottom: '12px' }} />
                                                <p style={{ margin: 0, fontWeight: 600 }}>No new notifications</p>
                                            </div>
                                        ) : (
                                            notifications.map(n => (
                                                <div 
                                                    key={n._id} 
                                                    onClick={() => {
                                                        if (n.title?.includes('Support')) {
                                                            window.dispatchEvent(new CustomEvent('openSupportHub'));
                                                        }
                                                        clearOne(n._id);
                                                        setShowNotifications(false);
                                                    }}
                                                    style={{ padding: '16px 20px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'flex-start', background: n.isRead ? 'transparent' : 'rgba(124, 58, 237, 0.02)' }}
                                                    className="notification-item-hover"
                                                >
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px', opacity: n.isRead ? 0 : 1 }} />
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#1E293B' }}>{n.title}</p>
                                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748B', lineHeight: 1.5 }}>{n.message}</p>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); clearOne(n._id); }}
                                                        style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '4px' }}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #E2E8F0', paddingLeft: '20px' }}>
                            <div style={{ textAlign: 'right' }} className="hidden sm:block">
                                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>{profile?.displayName || 'User'}</p>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>{profile?.entityType === 'business' ? 'Merchant' : 'Hustler'}</p>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontWeight: 800, fontSize: '0.9rem' }}>
                                {profile?.logoUrl ? (
                                    <img src={profile.logoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    getInitials(profile?.displayName || profile?.ownerId?.name)
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <section className="content-body">
                    <Outlet />
                </section>
            </main>
            {/* Support Hub Floating Chat */}
            <SupportHub />

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, padding: '20px' }}>
                    <div className="animate-scale-in" style={{ padding: '32px', maxWidth: '400px', width: '100%', background: 'white', borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ background: '#FEF2F2', color: '#EF4444', width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <LogOut size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#0F172A', marginBottom: '12px', letterSpacing: '-0.02em' }}>Ready to Leave?</h3>
                        <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: 1.6, fontWeight: 600, fontSize: '0.95rem' }}>You are about to sign out of your dashboard. Any unsaved changes might be lost.</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                className="btn-secondary" 
                                style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '0.95rem', border: '1px solid #E2E8F0' }} 
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Stay Here
                            </button>
                            <button 
                                style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }} 
                                onClick={logout}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default DashboardLayout;
