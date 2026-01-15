import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Outlet } from 'react-router-dom';
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
    HelpCircle,
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

    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        if (profile) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // 30s
            return () => clearInterval(interval);
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

    const hasUnread = notifications.some(n => !n.isRead);

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Invoices', path: '/sales', icon: FileText },
        { label: 'Debtors', path: '/debtors', icon: Users },
        { label: 'Reports', path: '/reports', icon: BarChart3 },
        { label: 'Verifiable Proofs', path: '/proofs', icon: ShieldCheck },
        { label: 'Help & Support', path: '/help', icon: HelpCircle },
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
            <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '32px', cursor: 'pointer' }} onClick={() => navigate('/')} />
                </div>

                <div style={{ padding: '0 16px 24px' }}>
                    <button
                        className="btn-primary"
                        style={{ width: '100%', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => navigate('/sales/new')}
                    >
                        <Plus size={20} /> Create New Invoice
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive || (item.path === '/sales' && location.pathname.startsWith('/sales')) ? 'active' : ''}`}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <NavLink
                        to="/settings"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <Settings size={20} /> Settings
                    </NavLink>
                    <button
                        onClick={logout}
                        className="nav-item"
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', marginTop: '8px', textAlign: 'left', color: '#EF4444' }}
                    >
                        <LogOut size={20} /> Logout
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
                                style={{ background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '12px', color: '#64748B', cursor: 'pointer' }}
                            >
                                <Bell size={20} />
                                {hasUnread && (
                                    <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%', border: '2px solid white' }}></span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="glass-card" style={{
                                    position: 'absolute', top: '45px', right: '0', width: '300px',
                                    background: 'white', border: '1px solid #E2E8F0', padding: '0',
                                    zIndex: 100, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ padding: '16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Notifications</h4>
                                        <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Clear All</button>
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', fontSize: '0.85rem' }}>No new notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n._id} style={{ padding: '12px 16px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.85rem', color: '#1E293B' }}>{n.title}</p>
                                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>{n.message}</p>
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
        </div>
    );
};

export default DashboardLayout;
