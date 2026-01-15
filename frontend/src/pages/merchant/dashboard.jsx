import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSales } from "../../context/SaleContext";
import { useAuth } from "../../context/AuthContext";
import { Plus, Wallet, Clock, CheckCircle, ChevronRight, LayoutDashboard, Settings, LogOut, X, TrendingUp, Users, MessageCircle, Trash2, RefreshCcw, Bell, Shield } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const Dashboard = () => {
    const { stats, sales, fetchSales, fetchStats, loading, deleteSale, migrateInvoices } = useSales();
    const { profile, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [whatsappInput, setWhatsappInput] = useState("");
    const [updatingWhatsapp, setUpdatingWhatsapp] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ show: false, sale: null });
    const [activities, setActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [visibleSales, setVisibleSales] = useState(5);
    const [visibleActivities, setVisibleActivities] = useState(5);

    useEffect(() => {
        fetchSales();
        fetchStats();
        fetchActivities();
    }, []);

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

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchSales(), fetchStats(), fetchActivities()]);
            toast.success("Dashboard updated");
        } catch (err) {
            toast.error("Failed to refresh");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleDelete = async (e, sale) => {
        e.stopPropagation();
        setDeleteModal({ show: true, sale });
    };

    const confirmDelete = async () => {
        try {
            await deleteSale(deleteModal.sale._id);
            toast.success("Record deleted successfully");
            setDeleteModal({ show: false, sale: null });
        } catch (err) {
            toast.error("Failed to delete record");
            setDeleteModal({ show: false, sale: null });
        }
    };

    const handleUpdateWhatsapp = async () => {
        if (!whatsappInput || whatsappInput.length < 10) {
            return toast.error("Please enter a valid WhatsApp number (e.g. 234...)");
        }

        setUpdatingWhatsapp(true);
        try {
            await updateProfile({ ...profile, whatsappNumber: whatsappInput });
            toast.success("WhatsApp number linked successfully!");
            setWhatsappInput("");
        } catch (err) {
            toast.error("Failed to update WhatsApp number");
        } finally {
            setUpdatingWhatsapp(false);
        }
    };

    if (loading && !sales.length) {
        return (
            <div style={{ textAlign: 'center', paddingTop: '100px', display: 'flex', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Page Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E293B', marginBottom: '4px', letterSpacing: '-0.02em' }}>Mission Control</h1>
                    <p style={{ color: '#64748B', fontWeight: 500 }}>Real-time performance tracking.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Redundant refresh removed since it's now in the top header */}
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <div className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ background: '#F0FDF4', color: '#10B981', padding: '10px', borderRadius: '12px' }}>
                            <Wallet size={24} />
                        </div>
                        <TrendingUp size={20} color="#10B981" />
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>Total Revenue</p>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em' }}>₦{stats?.revenue?.toLocaleString() || 0}</h2>
                </div>

                <div className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ background: '#FFF7ED', color: '#F97316', padding: '10px', borderRadius: '12px' }}>
                            <Clock size={24} />
                        </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>Outstanding Balance</p>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#F97316', letterSpacing: '-0.03em' }}>₦{stats?.outstanding?.toLocaleString() || 0}</h2>
                </div>

                <div className="glass-card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ background: '#F5F3FF', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                            <Users size={24} />
                        </div>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 600, marginBottom: '8px' }}>Total Records</p>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.03em' }}>{sales.length || 0}</h2>
                </div>
            </div>

            <div className="desktop-grid">
                <div>
                    {(!profile?.whatsappNumber && !stats?.isKreddyConnected) && (
                        <div className="glass-card animate-fade-in" style={{ padding: '24px', background: 'linear-gradient(135deg, var(--primary), #6366F1)', color: 'white', borderRadius: '24px', marginBottom: '32px', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                                    <MessageCircle size={24} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Step 1: Link your WhatsApp</h3>
                            </div>
                            <p style={{ fontSize: '0.9rem', marginBottom: '20px', opacity: 0.9 }}>Enter your number below to link your WhatsApp and start using Kreddy AI Assistant.</p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <input
                                    type="tel"
                                    placeholder="e.g. 2348012345678"
                                    value={whatsappInput}
                                    onChange={(e) => setWhatsappInput(e.target.value)}
                                    style={{ flex: 1, minWidth: '200px', padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                                />
                                <button
                                    onClick={handleUpdateWhatsapp}
                                    disabled={updatingWhatsapp}
                                    className="btn-primary"
                                    style={{ background: '#25D366' }}
                                >
                                    {updatingWhatsapp ? "Saving..." : "Link Now"}
                                </button>
                            </div>
                        </div>
                    )}


                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: 0 }}>Recent Activity</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select 
                                value={visibleSales} 
                                onChange={(e) => setVisibleSales(Number(e.target.value))}
                                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.85rem', fontWeight: 700, background: 'white' }}
                            >
                                <option value={5}>Show 5</option>
                                <option value={10}>Show 10</option>
                                <option value={20}>Show 20</option>
                            </select>
                            <Link to="/sales" style={{ textDecoration: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
                                Full List <ChevronRight size={20} />
                            </Link>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {sales.length === 0 ? (
                            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '24px', border: '2px dashed #E2E8F0', background: 'transparent' }}>
                                <h4 style={{ color: '#64748B', fontWeight: 600 }}>No sales recorded yet.</h4>
                            </div>
                        ) : (
                            <>
                                {[...sales]
                                    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                                    .slice(0, visibleSales)
                                    .map(sale => (
                                    <div
                                        key={sale._id}
                                        className="glass-card record-card"
                                        style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderRadius: '20px', background: 'white', border: '1px solid #F1F5F9', gap: '12px' }}
                                        onClick={() => navigate(`/dashboard/invoice/${sale.invoiceNumber}`)}
                                    >
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                            <div style={{
                                                background: sale.status === 'paid' ? '#F0F9FF' : '#FFF7ED',
                                                padding: '12px',
                                                borderRadius: '16px',
                                                color: sale.status === 'paid' ? '#0EA5E9' : '#F97316',
                                            }}>
                                                {sale.status === 'paid' ? <CheckCircle size={24} /> : <Clock size={24} />}
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 800, color: '#1E293B', margin: '0 0 4px' }}>{sale.customerName || 'Walk-in'}</p>
                                                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>#{sale.invoiceNumber} • {new Date(sale.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1E293B', margin: '0 0 4px' }}>₦{sale.totalAmount.toLocaleString()}</p>
                                                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: sale.status === 'paid' ? '#10B981' : '#F97316' }}>{sale.status}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDelete(e, sale)}
                                                style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}
                                                className="delete-hover"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {sales.length > visibleSales && (
                                    <button 
                                        onClick={() => setVisibleSales(prev => prev + 10)}
                                        style={{ background: '#F1F5F9', border: 'none', padding: '12px', borderRadius: '12px', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', marginTop: '8px', width: '100%' }}
                                    >
                                        Load more records
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="desktop-only-sticky">
                    <div className="glass-card" style={{ padding: '24px', background: '#F5F3FF', border: '1px solid var(--primary)', borderRadius: '24px', marginBottom: '24px' }}>
                        <div style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                            <Shield size={20} />
                        </div>
                        <h4 style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>Verifiable Trust Score</h4>
                        <p style={{ fontSize: '0.85rem', color: '#4C1D95', lineHeight: 1.5, marginBottom: '16px' }}>Your business credibility rating based on transparent ledger records.</p>
                        <div style={{ height: '8px', background: 'rgba(76,29,149,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${stats?.trustScore || 60}%`, height: '100%', background: 'var(--primary)', transition: 'width 1s ease' }}></div>
                        </div>
                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '8px', textAlign: 'right' }}>{stats?.trustScore || 60}/100</p>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px' }}>
                        <h4 style={{ fontWeight: 800, color: '#1E293B', marginBottom: '12px' }}>Kreddy (AI Assistant)</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981', fontWeight: 700, fontSize: '0.9rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#10B981', borderRadius: '50%' }}></div>
                            Online & Ready
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '12px', lineHeight: 1.5 }}>Kreddy is tracking {sales.filter(s => s.status !== 'paid').length} outstanding records for you.</p>
                        <a
                            href={`https://wa.me/15556525630?text=CONNECT`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#25D366', fontWeight: 700, fontSize: '0.85rem', marginTop: '16px', textDecoration: 'none' }}
                        >
                            <MessageCircle size={16} /> Open Kreddy in WhatsApp
                        </a>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '24px', marginTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                                <LayoutDashboard size={18} color="var(--primary)" /> Ledger Activity
                            </h4>
                            <select 
                                value={visibleActivities} 
                                onChange={(e) => setVisibleActivities(Number(e.target.value))}
                                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #F1F5F9', fontSize: '0.7rem', fontWeight: 700, background: '#F8FAFC' }}
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {loadingActivities ? (
                                <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Loading feed...</p>
                            ) : activities.length === 0 ? (
                                <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>No recent activity.</p>
                            ) : (
                                activities.slice(0, visibleActivities).map(log => (
                                    <div key={log._id} style={{ display: 'flex', gap: '12px', borderLeft: '2px solid #F1F5F9', paddingLeft: '16px', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-5px', top: '0', width: '8px', height: '8px', background: '#E2E8F0', borderRadius: '50%' }}></div>
                                        <div>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B', margin: '0 0 2px 0', lineHeight: 1.4 }}>{log.details}</p>
                                            <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: 0 }}>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {log.action.replace(/_/g, ' ')}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {activities.length > visibleActivities && (
                                <button 
                                    onClick={() => setVisibleActivities(prev => prev + 5)}
                                    style={{ background: 'transparent', border: '1px solid #E2E8F0', padding: '8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}
                                >
                                    See more logs
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {deleteModal.show && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="glass-card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '90%', background: 'white', borderRadius: '24px', textAlign: 'center' }}>
                        <div style={{ background: '#FEE2E2', color: '#EF4444', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Trash2 size={28} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Delete Record?</h3>
                        <p style={{ color: '#64748B', marginBottom: '24px' }}>This will permanently remove the record for {deleteModal.sale?.customerName}.</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDeleteModal({ show: false, sale: null })}>Cancel</button>
                            <button className="btn-primary" style={{ flex: 1, background: '#EF4444' }} onClick={confirmDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @media (max-width: 640px) {
                    .record-card {
                        padding: 12px 16px !important;
                        gap: 8px !important;
                    }
                    .record-card h4, .record-card p {
                        font-size: 0.85rem !important;
                    }
                    h2 {
                        font-size: 1.8rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
