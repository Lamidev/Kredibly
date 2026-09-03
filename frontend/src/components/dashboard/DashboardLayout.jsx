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
    Bell,
    Menu,
    X,
    LogOut,
    User as UserIcon,
    MessagesSquare,
    MessageCircle,
    RefreshCcw,
    AlertTriangle,
    ArrowRight,
    CreditCard,
    Shield,
    Bot,
    Zap,
    UserCheck,
    Activity,
    CheckCircle,
    Wallet,
    Wifi
} from 'lucide-react';
import { KREDDY_CONFIG, API_URL } from '../../config';
import { useSales } from '../../context/SaleContext';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import SupportHub from './SupportHub';
import PlanLimitModal from '../payment/PlanLimitModal';

const getInitials = (name) => {
    if (!name) return "K";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

// 🔒 PLAN EXPIRED BANNER
// Shown at the top of the dashboard content area when planStatus is inactive/cancelled.
// It's a soft nudge — not a wall. Merchants can still read all their records.
const PlanExpiredBanner = ({ navigate }) => {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            style={{
                background: 'linear-gradient(135deg, #1E293B, #0F172A)',
                color: 'white',
                borderRadius: '20px',
                padding: '20px 24px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                boxShadow: '0 4px 24px rgba(239, 68, 68, 0.12)'
            }}
        >
            <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                <AlertTriangle size={20} color="#EF4444" />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: 'white' }}>
                    Your plan has ended
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500, lineHeight: 1.5 }}>
                    Your existing records and invoice payments are safe and still working. Reactivate to create new records.
                </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                <button
                    onClick={() => navigate('/settings/plan')}
                    style={{
                        background: '#EF4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px 20px',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                    }}
                >
                    Reactivate <ArrowRight size={14} strokeWidth={3} />
                </button>
                <button
                    onClick={() => setDismissed(true)}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Dismiss"
                >
                    <X size={16} />
                </button>
            </div>
        </motion.div>
    );
};

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { profile, logout } = useAuth();
    const { fetchSales, fetchStats, stats } = useSales();
    const navigate = useNavigate();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const location = useLocation();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);

    // V3 OS Cockpit States
    const [commandText, setCommandText] = useState("");
    const [showQuickCapture, setShowQuickCapture] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [kreddyLastSynced, setKreddyLastSynced] = useState(new Date());

    const PLACEHOLDERS = [
        "Create invoice...",
        "Who still owes me?",
        "Show today's collections",
        "Add fuel expense",
        "Find Rebecca",
        "Call David tomorrow..."
    ];

    // Context-aware prefill messages per page
    const KREDDY_CONTEXT_MESSAGES = {
        '/dashboard':  'Give me today\'s business summary.',
        '/customers':  'Show me customers that haven\'t paid this week.',
        '/workspace':  'Help me finish today\'s work.',
        '/tasks':      'What tasks need my attention today?',
        '/money':      'Show me this week\'s cashflow.',
        '/kreddy':     'Give me a morning brief for today.',
    };

    const talkToKreddy = (customText) => {
        const isFirstTime = !profile?.firstMerchantGreetingSent;
        const defaultGreeting = isFirstTime 
            ? "Hi Kreddy! I just signed up on Kredibly. How do I create my first invoice?" 
            : "Hi Kreddy, give me today's business summary.";

        const contextMsg = customText ||
            (isFirstTime ? defaultGreeting : (KREDDY_CONTEXT_MESSAGES[location.pathname] || defaultGreeting));
        const url = KREDDY_CONFIG.getLink(contextMsg);
        window.open(url, '_blank', 'noopener,noreferrer');
        setKreddyLastSynced(new Date());
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDERS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    // Update last-synced display every 30s
    useEffect(() => {
        const tick = setInterval(() => setKreddyLastSynced(prev => prev), 30000);
        return () => clearInterval(tick);
    }, []);

    // 🔒 Prevent background scroll when notifications pop-up is open
    useEffect(() => {
        if (showNotifications) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showNotifications]);

    const commandPlaceholder = `Ask or tell Kreddy: "${PLACEHOLDERS[placeholderIndex]}"`;

    const handleCommandSubmit = (e) => {
        if (e.key === 'Enter' && commandText.trim()) {
            // Hand off the typed command directly to Kreddy via WhatsApp
            talkToKreddy(commandText.trim());
            setCommandText("");
        }
    };



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
            toast.success("Dashboard refreshed!");
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

    const kycVerified = profile?.kyc?.verified === true;

    const navItems = [
        { label: 'Mission Control', path: '/dashboard', icon: LayoutDashboard, end: true },
        { label: 'Customers', path: '/customers', icon: Users, activeIfMatch: ['/customers'] },
        { label: 'Workspace', path: '/workspace', icon: FileText, activeIfMatch: ['/workspace'] },
        { label: 'Money', path: '/money', icon: Wallet, activeIfMatch: ['/money'] },
        { label: 'Tasks', path: '/tasks', icon: CheckCircle, activeIfMatch: ['/tasks'] },
        { label: 'Kreddy', path: '/kreddy', icon: Bot, activeIfMatch: ['/kreddy'] },
        { label: 'Payouts', path: '/settings/payouts', icon: CreditCard, activeIfMatch: ['/settings/payouts'] },
        { label: 'Verification', path: '/settings/verification', icon: Shield, activeIfMatch: ['/settings/verification'] },
        { label: 'Plan', path: '/settings/plan', icon: Zap, activeIfMatch: ['/settings/plan'] }
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
            <aside className={`sidebar sidebar-premium ${isSidebarOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <img 
                            src="/krediblyrevamped.png" 
                            alt="Kredibly" 
                            style={{ height: '20px', width: 'auto', filter: 'contrast(1.15) brightness(1.02)' }} 
                        />
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            right: '20px',
                            transform: 'translateY(-50%)',
                            background: '#F1F5F9',
                            border: '1px solid #E2E8F0',
                            borderRadius: '12px',
                            color: '#64748B',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        className="lg:hidden"
                    >
                        <X size={18} strokeWidth={3} />
                    </button>
                </div>



                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => {
                                if (item.path === '#') return 'nav-item-premium locked-item';
                                let isMatched = item.activeIfMatch 
                                    ? item.activeIfMatch.some(p => location.pathname.startsWith(p))
                                    : isActive;
                                return `nav-item-premium ${isMatched ? 'active' : ''}`;
                            }}
                            onClick={(e) => {
                                if (item.onClick) item.onClick(e);
                                if (!e.defaultPrevented) setIsSidebarOpen(false);
                            }}
                            style={{ textDecoration: 'none' }}
                        >
                            {({ isActive }) => {
                                const isMatched = item.activeIfMatch 
                                    ? item.activeIfMatch.some(p => location.pathname.startsWith(p))
                                    : isActive;
                                const isLocked = item.path === '#';
                                return (
                                    <>
                                        <item.icon size={20} strokeWidth={isMatched ? 2.5 : 2} style={{ opacity: isLocked ? 0.4 : 1 }} />
                                        <span style={{ fontWeight: 600, fontSize: 'clamp(0.9rem, 3.5vw, 1rem)', opacity: isLocked ? 0.4 : 1 }}>{item.label}</span>
                                        {isLocked && <ShieldCheck size={14} style={{ marginLeft: 'auto', color: '#94A3B8' }} />}
                                        {item.badge === 'unverified' && (
                                            <span style={{
                                                marginLeft: 'auto',
                                                width: '8px', height: '8px',
                                                borderRadius: '50%',
                                                background: '#EF4444',
                                                flexShrink: 0,
                                                boxShadow: '0 0 6px rgba(239,68,68,0.6)'
                                            }} />
                                        )}
                                        {item.planBadge && (
                                            <span style={{
                                                marginLeft: 'auto',
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                background: isMatched ? 'rgba(255,255,255,0.2)' : 'rgba(124,58,237,0.1)',
                                                color: isMatched ? 'white' : 'var(--primary)',
                                                padding: '2px 7px',
                                                borderRadius: '6px',
                                                flexShrink: 0
                                            }}>
                                                {item.planBadge}
                                            </span>
                                        )}
                                    </>
                                );
                            }}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <NavLink
                        to="/settings"
                        className={() => {
                            const isOnSettings = location.pathname === '/settings';
                            return `nav-item-premium footer-item ${isOnSettings ? 'active' : ''}`;
                        }}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <Settings size={20} /> <span style={{ fontWeight: 600, fontSize: 'clamp(0.9rem, 3.5vw, 1rem)' }}>Settings</span>
                    </NavLink>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="nav-item-premium footer-item nav-item-logout"
                    >
                        <LogOut size={20} /> <span style={{ fontWeight: 600, fontSize: 'clamp(0.9rem, 3.5vw, 1rem)' }}>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content-layout">
                <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                        {/* Mobile Logo */}
                        <div className="lg:hidden" style={{ marginRight: '8px' }}>
                            <img 
                                src="/krediblyrevamped.png" 
                                alt="Kredibly" 
                                style={{ height: '22px', width: 'auto', filter: 'contrast(1.15) brightness(1.02)' }} 
                            />
                        </div>

                        <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                            <button
                                onClick={globalRefresh}
                                disabled={isRefreshing}
                                style={{ background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '12px', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Refresh Dashboard"
                            >
                                <RefreshCcw size={18} className={isRefreshing ? 'spin-animation' : ''} />
                            </button>

                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ background: '#F1F5F9', border: 'none', padding: '10px', borderRadius: '12px', color: '#64748B', cursor: 'pointer', position: 'relative' }}
                            >
                                <Bell size={18} />
                                {unreadCount > 0 && (
                                    <span style={{ 
                                        position: 'absolute', top: '-5px', right: '-5px', 
                                        minWidth: '18px', height: '18px', 
                                        background: '#EF4444', color: 'white',
                                        borderRadius: '50%', border: '2px solid white',
                                        fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, padding: '0 4px'
                                    }}>
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && createPortal(
                                <>
                                    {/* Global Backdrop overlay for page blur and click-out (both mobile and desktop) */}
                                    <div 
                                        style={{ 
                                            position: 'fixed', 
                                            inset: 0, 
                                            background: 'rgba(15, 23, 42, 0.35)', 
                                            backdropFilter: 'blur(4px)', 
                                            WebkitBackdropFilter: 'blur(4px)',
                                            zIndex: 19999 
                                        }}
                                        onClick={() => setShowNotifications(false)}
                                    />
                                    <div className="glass-card notification-dropdown" style={{ zIndex: 20000 }}>
                                        <div style={{ padding: '20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Alerts</h4>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>Clear All</button>
                                                <button 
                                                    onClick={() => setShowNotifications(false)}
                                                    style={{ background: '#E2E8F0', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer' }}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
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
                                                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#1E293B' }}>{n.title}</p>
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
                                </>,
                                document.body
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #E2E8F0', paddingLeft: '20px' }}>
                            <div style={{ textAlign: 'right' }} className="hidden sm:block">
                                <p style={{ fontSize: 'clamp(0.85rem, 3vw, 0.95rem)', fontWeight: 600, color: '#1E293B' }}>{profile?.displayName || 'User'}</p>
                                <p style={{ fontSize: 'clamp(0.7rem, 2.5vw, 0.8rem)', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {profile?.plan || 'Hustler'}
                                </p>                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontWeight: 700, fontSize: '0.9rem' }}>
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
                    {/* Plan Expired Banner — only shown for inactive/cancelled plans */}
                    <AnimatePresence>
                        {(profile?.planStatus === 'inactive' || profile?.planStatus === 'cancelled') && (
                            <PlanExpiredBanner navigate={navigate} />
                        )}
                    </AnimatePresence>
                    <Outlet />
                </section>
            </main>
            {/* Support Hub Floating Chat */}
            <SupportHub />
            <style>{`
                .notification-dropdown {
                    position: fixed;
                    top: 75px;
                    right: 40px;
                    width: 360px;
                    background: white;
                    border: 1px solid #E2E8F0;
                    padding: 0;
                    z-index: 20000;
                    border-radius: 24px;
                    overflow: hidden;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
                    animation: slideDown 0.2s ease-out;
                }
                @media (max-width: 640px) {
                    .notification-dropdown {
                        position: fixed;
                        top: 80px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 95%;
                        max-width: 400px;
                        right: auto;
                    }
                }
            `}</style>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, padding: '20px' }}>
                    <div className="animate-scale-in" style={{ padding: '32px', maxWidth: '400px', width: '100%', background: 'white', borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ background: '#FEF2F2', color: '#EF4444', width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <LogOut size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '12px', letterSpacing: '-0.02em' }}>Ready to Leave?</h3>
                        <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: 1.6, fontWeight: 400, fontSize: '0.95rem' }}>You are about to sign out of your dashboard. Any unsaved changes might be lost.</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                className="btn-secondary" 
                                style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: 700, fontSize: '0.95rem', border: '1px solid #E2E8F0' }} 
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Stay Here
                            </button>
                            <button 
                                style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }} 
                                onClick={logout}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}



            <PlanLimitModal 
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                onUpgrade={() => {
                    setShowLimitModal(false);
                    navigate('/settings/plan');
                }}
            />
        </div>
    );
};

export default DashboardLayout;
