import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
    LayoutDashboard,
    Users,
    Ticket,
    ShieldCheck,
    Menu,
    X,
    LogOut,
    CreditCard,
    Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { logout } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (isSidebarOpen) {
            document.body.classList.add('lock-scroll');
        } else {
            document.body.classList.remove('lock-scroll');
        }
        return () => document.body.classList.remove('lock-scroll');
    }, [isSidebarOpen]);

    const navItems = [
        { label: 'Platform Overview', path: '/admin', icon: LayoutDashboard, end: true },
        { label: 'Merchant Directory', path: '/admin/merchants', icon: Users },
        { label: 'Waitlist Pipeline', path: '/admin/waitlist', icon: Globe },
        { label: 'Support Tickets', path: '/admin/support', icon: Ticket },
        { label: 'Revenue & Subs', path: '/admin/revenue', icon: CreditCard },
        { label: 'Coupons & Promo', path: '/admin/coupons', icon: ShieldCheck },
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

            {/* Admin Sidebar */}
            <aside className={`sidebar sidebar-premium ${isSidebarOpen ? 'mobile-open' : ''}`} style={{ background: '#0F172A', borderRight: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                <div className="sidebar-header" style={{ padding: '32px 24px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
                        <img 
                            src="/krediblyrevamped.png" 
                            alt="Kredibly" 
                            style={{ height: '34px', width: 'auto', filter: 'brightness(0) invert(1)', flexShrink: 0 }} 
                        />
                        <span style={{ 
                            background: 'rgba(255, 255, 255, 0.1)', 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            fontSize: '8px', 
                            fontWeight: 900, 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            border: '1px solid rgba(255,255,255,0.05)',
                            flexShrink: 0
                        }}>Control</span>
                    </div>
                </div>

                <nav className="sidebar-nav" style={{ flex: 1 }}>
                    <p style={{ padding: '0 24px', fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Main Menu</p>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => `nav-item-premium admin-nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => {
                                if (window.innerWidth <= 1024) setIsSidebarOpen(false);
                            }}
                            style={{ margin: '2px 16px', color: 'rgba(255,255,255,0.7)', padding: '14px 20px' }}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} color={isActive ? 'var(--primary)' : 'currentColor'} />
                                    <span style={{ fontWeight: 800 }}>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 0 32px' }}>
                    <button
                        onClick={() => setShowLogoutConfirm(true)}
                        className="nav-item-premium"
                        style={{ 
                            width: 'calc(100% - 32px)', 
                            background: 'rgba(239, 68, 68, 0.1)', 
                            border: '1px solid rgba(239, 68, 68, 0.2)', 
                            cursor: 'pointer', 
                            margin: '8px 16px', 
                            color: '#FCA5A5',
                            borderRadius: '12px',
                            justifyContent: 'flex-start'
                        }}
                    >
                        <LogOut size={20} /> <span style={{ fontWeight: 700 }}>Exit System</span>
                    </button>
                    <div style={{ padding: '20px 24px 0', textAlign: 'center' }}>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>KREDDY ADMIN v2.0.1</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-content-layout" style={{ background: '#F8FAFC' }}>
                <header className="top-header" style={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    backdropFilter: 'blur(20px)', 
                    borderBottom: '1px solid #E2E8F0', 
                    padding: '0 24px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '80px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            style={{ border: 'none', cursor: 'pointer', color: '#1E293B', padding: '8px', borderRadius: '12px', background: '#F1F5F9' }}
                            className="lg:hidden"
                        >
                            <Menu size={20} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src="/krediblyrevamped.png" alt="logo" style={{ height: '34px' }} className="lg:hidden" />
                            <h2 className="hidden sm:block" style={{ fontSize: 'clamp(0.9rem, 4vw, 1.1rem)', fontWeight: 900, color: '#0F172A', margin: 0, whiteSpace: 'nowrap' }}>Command Center</h2>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div className="hidden sm:flex" style={{ alignItems: 'center', gap: '10px', background: '#F1F5F9', padding: '6px 12px', borderRadius: '12px' }}>
                             <div className="pulse-dot" style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }}></div>
                             <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>SYSTEM LIVE</span>
                        </div>
                        
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#0F172A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem', border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                            AD
                        </div>
                    </div>
                </header>

                <section className="content-body">
                    <Outlet />
                </section>
            </main>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20000, padding: '20px' }}>
                    <div className="animate-scale-in" style={{ padding: '40px', maxWidth: '400px', width: '100%', background: 'white', borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ background: '#FEF2F2', color: '#EF4444', width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <LogOut size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#0F172A', marginBottom: '12px', letterSpacing: '-0.02em' }}>Shutting Down?</h3>
                        <p style={{ color: '#64748B', marginBottom: '32px', lineHeight: 1.6, fontWeight: 600, fontSize: '0.95rem' }}>Are you sure you want to end your administration session?</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-secondary" style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: 800 }} onClick={() => setShowLogoutConfirm(false)}>Stay Active</button>
                            <button style={{ flex: 1, background: '#0F172A', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 800, cursor: 'pointer' }} onClick={logout}>Exit Admin</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                .admin-nav-item.active {
                    background: rgba(255,255,255,0.05) !important;
                    color: var(--primary) !important;
                    border-color: rgba(255,255,255,0.1) !important;
                }
                .admin-nav-item:hover {
                    background: rgba(255,255,255,0.03) !important;
                    color: white !important;
                }
                .pulse-dot {
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .sidebar-premium {
                    backdrop-filter: blur(20px);
                    box-shadow: 20px 0 50px rgba(0,0,0,0.2);
                }
                @media (max-width: 1024px) {
                    .main-content-layout { margin-left: 0 !important; }
                }
            `}</style>
        </div>
    );
};

export default AdminLayout;
