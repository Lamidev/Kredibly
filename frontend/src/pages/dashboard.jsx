import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSales } from "../context/SaleContext";
import { useAuth } from "../context/AuthContext";
import { Plus, Wallet, Clock, CheckCircle, ChevronRight, LayoutDashboard, Settings, LogOut, X, TrendingUp, Users } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
    const { stats, sales, fetchSales, fetchStats, loading } = useSales();
    const { profile, logout } = useAuth();
    const navigate = useNavigate();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        fetchSales();
        fetchStats();
    }, []);

    const confirmLogout = async () => {
        await logout();
        navigate("/auth/login");
        toast.success("Logged out successfully");
    };

    if (loading && !sales.length) {
        return (
            <div className="container" style={{ textAlign: 'center', paddingTop: '100px', display: 'flex', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '100px', background: '#FAFAFA', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Header - Constrain width */}
            <div className="glass-nav" style={{ width: '100%', padding: '20px 24px', display: 'flex', justifyContent: 'center', background: 'rgba(255,255,255,0.95)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: '100%', maxWidth: '1200px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* User Profile / Logo */}
                        {profile?.logoUrl ? (
                            <img src={profile.logoUrl} alt="Logo" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                        ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary), #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(99,102,241,0.2)' }}>
                                {profile?.displayName?.charAt(0).toUpperCase() || 'K'}
                            </div>
                        )}
                        <div>
                            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#1f2937' }}>{profile?.displayName || 'Dashboard'}</h1>
                            <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>Overview</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => toast.info("Settings page coming soon!")}
                            style={{ padding: '10px', borderRadius: '12px', background: 'var(--background)', border: 'none', color: '#4b5563', cursor: 'pointer', transition: '0.2s' }}
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            style={{ padding: '10px', borderRadius: '12px', background: '#FEE2E2', border: 'none', color: '#EF4444', cursor: 'pointer', transition: '0.2s' }}
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="container animate-fade-in" style={{ padding: '24px', maxWidth: '1200px', width: '100%' }}>

                {/* Stats Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px',
                    marginBottom: '40px'
                }}>
                    <Link to="/sales?status=revenue" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="glass-card clickable-card" style={{ padding: '32px', background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(49, 46, 129, 0.3)', height: '100%', transition: 'all 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.15)', padding: '10px', borderRadius: '12px' }}>
                                    <Wallet size={24} />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#10B981', padding: '6px 12px', borderRadius: '100px' }}>Revenue</span>
                            </div>
                            <div style={{ fontSize: '0.95rem', opacity: 0.8, marginBottom: '4px', fontWeight: 500 }}>Total Revenue</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>₦{stats?.revenue?.toLocaleString() || 0}</div>
                        </div>
                    </Link>

                    <Link to="/sales?status=pending" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="glass-card clickable-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #F3F4F6', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', height: '100%', transition: 'all 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ background: '#FFF7ED', padding: '10px', borderRadius: '12px', color: '#F97316' }}>
                                    <Clock size={24} />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, background: '#FFEDD5', color: '#9A3412', padding: '6px 12px', borderRadius: '100px' }}>Outstanding</span>
                            </div>
                            <div style={{ fontSize: '0.95rem', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>Outstanding Balance</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.04em' }}>₦{stats?.outstanding?.toLocaleString() || 0}</div>
                        </div>
                    </Link>

                    <Link to="/sales" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="glass-card clickable-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #F3F4F6', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', height: '100%', transition: 'all 0.3s ease' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ background: '#EEF2FF', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                                    <Users size={24} />
                                </div>
                            </div>
                            <div style={{ fontSize: '0.95rem', color: '#6B7280', marginBottom: '4px', fontWeight: 500 }}>Total Records</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1F2937', letterSpacing: '-0.04em' }}>{sales.length || 0}</div>
                        </div>
                    </Link>
                </div>

                <div className="desktop-grid">
                    {/* Main Column */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Recent Activity</h3>
                            <Link to="/sales" style={{ fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                View All <ChevronRight size={18} />
                            </Link>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            {sales.length === 0 ? (
                                <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '24px', border: '2px dashed #E5E7EB', background: 'transparent', boxShadow: 'none' }}>
                                    <div style={{ background: '#F3F4F6', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#9CA3AF' }}>
                                        <TrendingUp size={24} />
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>No sales yet</h4>
                                    <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Record your first sale to start tracking.</p>
                                </div>
                            ) : (
                                sales.slice(0, 5).map(sale => (
                                    <div
                                        key={sale._id}
                                        className="glass-card"
                                        style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderRadius: '20px', border: '1px solid white', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                                        onClick={() => navigate(`/invoice/${sale._id}`)}
                                    >
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{
                                                background: sale.status === 'paid' ? '#ECFDF5' : '#FFF7ED',
                                                padding: '12px',
                                                borderRadius: '16px',
                                                color: sale.status === 'paid' ? '#10B981' : '#F97316'
                                            }}>
                                                {sale.status === 'paid' ? <CheckCircle size={24} /> : <Clock size={24} />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1F2937', marginBottom: '4px' }}>{sale.customerName || 'Walk-in Customer'}</div>
                                                <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{new Date(sale.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>₦{sale.totalAmount.toLocaleString()}</div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                color: sale.status === 'paid' ? '#10B981' : '#F97316',
                                                marginTop: '4px'
                                            }}>
                                                {sale.status}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="desktop-only-sticky">
                        <div style={{ marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginBottom: '16px', letterSpacing: '-0.01em' }}>Quick Actions</h3>
                            <Link to="/sales/new" style={{ textDecoration: 'none' }}>
                                <button className="btn-primary" style={{ width: '100%', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1.1rem', background: 'var(--primary)', boxShadow: '0 10px 25px -5px rgba(76, 29, 149, 0.3)' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '8px' }}><Plus size={20} /></div>
                                    Create New Invoice
                                </button>
                            </Link>
                        </div>

                        <div className="glass-card" style={{ padding: '24px', background: '#F8FAFC', borderRadius: '24px', border: '1px solid #E5E7EB' }}>
                            <h4 style={{ fontWeight: 700, marginBottom: '12px', fontSize: '1rem' }}>Business Tip</h4>
                            <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5 }}>
                                Send professional reminders to customers with outstanding balances to improve your cash flow.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '320px', width: '90%', borderRadius: '24px', textAlign: 'center', background: 'white' }}>
                        <div style={{ background: '#FEE2E2', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#EF4444' }}>
                            <LogOut size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: '#111827' }}>Log Out?</h3>
                        <p style={{ color: '#6B7280', marginBottom: '24px' }}>Are you sure you want to sign out of your account?</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                style={{ padding: '12px', borderRadius: '14px', border: '1px solid #E5E7EB', background: 'white', fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                style={{ padding: '12px', borderRadius: '14px', border: 'none', background: '#EF4444', fontWeight: 600, color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
