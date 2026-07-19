import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
    ArrowLeft, Search, Trash2, FileText, CreditCard, 
    Wallet, Clock, Activity, Building2, ShieldCheck, 
    Phone, Mail, Calendar, CheckCircle2, AlertCircle, 
    User, ExternalLink, Zap, Users, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const AdminMerchantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'banking' | 'tasks' | 'logs'
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Responsive State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        if (id) fetchMerchantDetails();
    }, [id]);

    const fetchMerchantDetails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/merchants/${id}/details`, { withCredentials: true });
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            toast.error("Failed to load merchant details.");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        try {
            const res = await axios.delete(`${API_URL}/admin/users/${data?.user?._id || id}`, { withCredentials: true });
            if (res.data.success) {
                toast.success("Merchant purged successfully.");
                navigate('/admin/merchants');
            }
        } catch (err) {
            toast.error("Purge failed.");
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    if (loading) {
        return (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
            >
                {/* Top Back Action Bar Skeleton */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div className="skeleton" style={{ width: '180px', height: '44px', borderRadius: '14px' }} />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div className="skeleton" style={{ width: '110px', height: '44px', borderRadius: '14px' }} />
                        <div className="skeleton" style={{ width: '140px', height: '44px', borderRadius: '14px' }} />
                    </div>
                </div>

                {/* Hero Header Card Skeleton */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '32px', padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="skeleton" style={{ width: '72px', height: '72px', borderRadius: '24px' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="skeleton" style={{ width: '220px', height: '28px', borderRadius: '8px' }} />
                            <div className="skeleton" style={{ width: '320px', height: '18px', borderRadius: '6px' }} />
                        </div>
                    </div>
                    <div className="skeleton" style={{ width: '150px', height: '60px', borderRadius: '20px' }} />
                </div>

                {/* 4 Stat Cards Grid Skeleton */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="skeleton" style={{ height: '130px', borderRadius: '28px' }} />
                    ))}
                </div>

                {/* Main Content Area Skeleton */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '32px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div className="skeleton" style={{ width: '180px', height: '44px', borderRadius: '16px' }} />
                        <div className="skeleton" style={{ width: '160px', height: '44px', borderRadius: '16px' }} />
                        <div className="skeleton" style={{ width: '190px', height: '44px', borderRadius: '16px' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton" style={{ height: '54px', borderRadius: '16px' }} />
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    }

    if (!data) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '32px', border: '1px solid var(--border)' }}>
                <AlertCircle size={48} style={{ color: '#EF4444', marginBottom: '16px' }} />
                <h3 style={{ fontWeight: 900, margin: '0 0 8px 0' }}>Merchant Not Found</h3>
                <p style={{ color: '#64748B', marginBottom: '24px' }}>The requested merchant profile could not be located.</p>
                <Link to="/admin/merchants" style={{ padding: '12px 24px', borderRadius: '16px', background: 'var(--primary)', color: 'white', textDecoration: 'none', fontWeight: 800 }}>
                    Back to Merchant Directory
                </Link>
            </div>
        );
    }

    const { user, business, stats, sales = [], activityLogs = [], backgroundJobs = [], reminders = [] } = data;

    const filteredSales = sales.filter(s => 
        (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase())) ||
        (s.customerName && s.customerName.toLowerCase().includes(invoiceSearch.toLowerCase())) ||
        (s.description && s.description.toLowerCase().includes(invoiceSearch.toLowerCase()))
    );

    const joinedDate = business?.createdAt ? new Date(business.createdAt) : (user?.createdAt ? new Date(user.createdAt) : new Date());

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Top Navigation & Back Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '16px' }}>
                <button 
                    onClick={() => navigate('/admin/merchants')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '8px', border: 'none', background: '#F1F5F9', padding: '12px 18px', borderRadius: '14px', fontWeight: 800, color: '#475569', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                    <ArrowLeft size={18} /> Back to Directory
                </button>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
                    <button 
                        onClick={fetchMerchantDetails}
                        style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid #E2E8F0', background: 'white', padding: '12px 16px', borderRadius: '14px', fontWeight: 800, color: '#64748B', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                    <button 
                        onClick={() => setShowDeleteConfirm(true)}
                        style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: 'none', background: '#FEF2F2', padding: '12px 16px', borderRadius: '14px', fontWeight: 800, color: '#EF4444', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        <Trash2 size={16} /> Purge Merchant
                    </button>
                </div>
            </div>

            {/* Hero Merchant Header Card */}
            <div className="dashboard-glass" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '32px', padding: isMobile ? '20px' : '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'flex-start', flexDirection: isMobile ? 'column' : 'row', gap: '24px' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {business?.logoUrl ? (
                            <img 
                                src={business.logoUrl} 
                                alt={business?.displayName || user?.name} 
                                style={{ width: isMobile ? '56px' : '72px', height: isMobile ? '56px' : '72px', borderRadius: '24px', objectFit: 'cover', border: '2px solid #E2E8F0', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }} 
                                onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
                            />
                        ) : null}
                        <div style={{ 
                            display: business?.logoUrl ? 'none' : 'flex', 
                            width: isMobile ? '56px' : '72px', height: isMobile ? '56px' : '72px', borderRadius: '24px', 
                            background: 'var(--primary)', color: 'white', 
                            alignItems: 'center', justifyContent: 'center', 
                            fontWeight: 950, fontSize: isMobile ? '1.4rem' : '1.8rem', 
                            boxShadow: '0 10px 25px -5px rgba(76, 29, 149, 0.3)' 
                        }}>
                            {business?.displayName?.charAt(0) || user?.name?.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <h1 style={{ margin: 0, fontWeight: 950, fontSize: isMobile ? '1.3rem' : '1.6rem', color: '#0F172A', wordBreak: 'break-word' }}>
                                    {business?.displayName || user?.name}
                                </h1>
                                <span style={{ 
                                    padding: '4px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900,
                                    background: (business?.plan || 'hustler') === 'hustler' ? '#E2E8F0' : (business?.plan) === 'oga' ? '#ECFDF5' : (business?.plan) === 'chairman' ? '#EEF2FF' : '#FFF7ED',
                                    color: (business?.plan || 'hustler') === 'hustler' ? '#64748B' : (business?.plan) === 'oga' ? '#10B981' : (business?.plan) === 'chairman' ? '#6366F1' : '#EA580C',
                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                }}>
                                    {business?.plan || 'INCOMPLETE'}
                                </span>
                                {business?.isKreddyConnected && (
                                    <span style={{ background: '#DCFCE7', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <CheckCircle2 size={12} /> WA ACTIVE
                                    </span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Owner: {user?.name || 'N/A'}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', wordBreak: 'break-all' }}><Mail size={14} /> {user?.email}</span>
                                {business?.whatsappNumber && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16A34A', fontWeight: 800 }}>
                                        <Phone size={14} /> +{business.whatsappNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ background: '#F8FAFC', padding: '12px 20px', borderRadius: '20px', border: '1px solid #F1F5F9', textAlign: isMobile ? 'left' : 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Merchant Since</div>
                        <div style={{ fontSize: '1rem', fontWeight: 950, color: '#0F172A', marginTop: '2px' }}>
                            {joinedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Metrics Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                {/* Metric 1 */}
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '28px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 850, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoices Sent</span>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F3E8FF', color: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FileText size={20} />
                        </div>
                    </div>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: 950, color: '#0F172A' }}>
                        {stats?.totalInvoices || 0}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#64748B' }}>
                        ₦{(stats?.totalInvoiceAmountRecorded || 0).toLocaleString()} recorded
                    </p>
                </div>

                {/* Metric 2 */}
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '28px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 850, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nomba / Gateway</span>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: 950, color: '#14532D' }}>
                        ₦{(stats?.totalCollectedNombaOnline || 0).toLocaleString()}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#15803D' }}>
                        Verified online collections
                    </p>
                </div>

                {/* Metric 3 */}
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '28px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 850, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cash Collected</span>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#DBEAFE', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Wallet size={20} />
                        </div>
                    </div>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: 950, color: '#1E3A8A' }}>
                        ₦{(stats?.totalCollectedCash || 0).toLocaleString()}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#1D4ED8' }}>
                        Manual cash recorded
                    </p>
                </div>

                {/* Metric 4 */}
                <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '28px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 850, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding</span>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFEDD5', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Clock size={20} />
                        </div>
                    </div>
                    <h2 style={{ margin: '0 0 6px 0', fontSize: '1.8rem', fontWeight: 950, color: '#7C2D12' }}>
                        ₦{(stats?.totalOutstanding || 0).toLocaleString()}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#C2410C' }}>
                        Unpaid customer balance
                    </p>
                </div>
            </div>

            {/* Main Tabs Container */}
            <div className="dashboard-glass" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '32px', padding: '32px' }}>
                {/* Navigation Tabs Header */}
                <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #F1F5F9', paddingBottom: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
                    <button 
                        onClick={() => setActiveTab('invoices')}
                        style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: activeTab === 'invoices' ? 'var(--primary)' : '#F8FAFC', color: activeTab === 'invoices' ? 'white' : '#64748B', fontWeight: 850, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}
                    >
                        <FileText size={16} /> Invoices & Ledger ({sales.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('banking')}
                        style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: activeTab === 'banking' ? 'var(--primary)' : '#F8FAFC', color: activeTab === 'banking' ? 'white' : '#64748B', fontWeight: 850, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}
                    >
                        <Building2 size={16} /> Bank & Verification
                    </button>
                    <button 
                        onClick={() => setActiveTab('tasks')}
                        style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: activeTab === 'tasks' ? 'var(--primary)' : '#F8FAFC', color: activeTab === 'tasks' ? 'white' : '#64748B', fontWeight: 850, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}
                    >
                        <Zap size={16} /> Tasks & Automation ({backgroundJobs.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        style={{ padding: '12px 24px', borderRadius: '16px', border: 'none', background: activeTab === 'logs' ? 'var(--primary)' : '#F8FAFC', color: activeTab === 'logs' ? 'white' : '#64748B', fontWeight: 850, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease' }}
                    >
                        <Activity size={16} /> Activity Stream ({activityLogs.length})
                    </button>
                </div>

                {/* TAB 1: INVOICES & LEDGER */}
                {activeTab === 'invoices' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', color: '#0F172A' }}>Invoices Ledger</h3>
                            <div style={{ position: 'relative', minWidth: '260px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input 
                                    type="text" 
                                    placeholder="Filter by invoice # or customer..."
                                    value={invoiceSearch}
                                    onChange={(e) => setInvoiceSearch(e.target.value)}
                                    style={{ padding: '10px 14px 10px 40px', width: '100%', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                                />
                            </div>
                        </div>

                        {filteredSales.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#F8FAFC', borderRadius: '24px', border: '1px dashed #CBD5E1' }}>
                                <FileText size={40} style={{ color: '#94A3B8', marginBottom: '12px' }} />
                                <h4 style={{ margin: '0 0 6px 0', fontWeight: 900, color: '#334155' }}>No Invoices Found</h4>
                                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>No invoice records matched the criteria for this merchant.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: '700px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>INVOICE</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>CUSTOMER</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>DESCRIPTION</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>TOTAL AMOUNT</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>PAYMENTS RECORDED</th>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>STATUS</th>
                                            <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '0.75rem', color: '#64748B', fontWeight: 800 }}>DATE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSales.map((sale) => (
                                            <tr key={sale._id} style={{ background: '#F8FAFC' }}>
                                                <td style={{ padding: '14px 16px', borderRadius: '16px 0 0 16px', fontWeight: 950, fontSize: '0.9rem', color: 'var(--primary)' }}>
                                                    #{sale.invoiceNumber || 'N/A'}
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                                                    {sale.customerName || 'Walk-in Customer'}
                                                    {sale.customerPhone && <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{sale.customerPhone}</div>}
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569', fontWeight: 600, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {sale.description || 'Sales Order'}
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: '0.95rem', fontWeight: 950, color: '#0F172A' }}>
                                                    ₦{(sale.totalAmount || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '14px 16px', fontSize: '0.8rem' }}>
                                                    {sale.payments && sale.payments.length > 0 ? (
                                                        sale.payments.map((p, idx) => (
                                                            <div key={idx} style={{ fontSize: '0.75rem', fontWeight: 800, color: ['Nomba', 'Paystack', 'Squad', 'Kredibly Online'].includes(p.method) ? '#16A34A' : '#475569' }}>
                                                                ₦{p.amount.toLocaleString()} ({p.method || 'Cash'})
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700 }}>Unpaid</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '14px 16px' }}>
                                                    <span style={{ 
                                                        padding: '4px 12px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900,
                                                        background: sale.status === 'paid' ? '#DCFCE7' : sale.status === 'partial' ? '#FEF9C3' : '#FEE2E2',
                                                        color: sale.status === 'paid' ? '#166534' : sale.status === 'partial' ? '#854D0E' : '#991B1B',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {sale.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '14px 16px', borderRadius: '0 16px 16px 0', textAlign: 'right', fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>
                                                    {new Date(sale.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 2: BANK & VERIFICATION */}
                {activeTab === 'banking' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                        {/* Payout Bank Card */}
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '28px', padding: '28px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Building2 size={20} style={{ color: 'var(--primary)' }} /> Bank Payout Account
                                </h3>
                                <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, background: business?.bankDetails?.accountNumber ? '#DCFCE7' : '#FEE2E2', color: business?.bankDetails?.accountNumber ? '#166534' : '#991B1B' }}>
                                    {business?.bankDetails?.accountNumber ? 'ATTACHED' : 'UNATTACHED'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Bank Name</div>
                                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                                        {business?.bankDetails?.bankName || 'Not Attached'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Account Number</div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 950, color: 'var(--primary)', letterSpacing: '0.05em', marginTop: '2px' }}>
                                        {business?.bankDetails?.accountNumber || 'N/A'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Account Name (Verified)</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                                        {business?.bankDetails?.accountName || 'Not Verified'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* KYC & Identity Card */}
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '28px', padding: '28px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ShieldCheck size={20} style={{ color: 'var(--primary)' }} /> Account & Identity
                                </h3>
                                <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, background: business?.kyc?.status === 'verified' ? '#DCFCE7' : '#FEF9C3', color: business?.kyc?.status === 'verified' ? '#166534' : '#854D0E' }}>
                                    Tier {business?.kyc?.tier || 1} {business?.kyc?.status || 'Pending'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>WhatsApp Workspace</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>
                                        +{business?.whatsappNumber || 'Not Linked'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Entity & Selling Mode</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', marginTop: '2px', textTransform: 'capitalize' }}>
                                        {business?.entityType || 'Individual'} • Mode: {business?.sellMode || 'Both'}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Staff Team Members</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>
                                        {business?.staffNumbers && business.staffNumbers.length > 0 ? (
                                            `${business.staffNumbers.length} staff added (${business.staffNumbers.join(', ')})`
                                        ) : (
                                            'Solo Merchant (0 staff)'
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: TASKS & AUTOMATION */}
                {activeTab === 'tasks' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', color: '#0F172A' }}>Background Tasks & Reminders</h3>

                        {backgroundJobs.length === 0 && reminders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#F8FAFC', borderRadius: '24px', border: '1px dashed #CBD5E1' }}>
                                <Zap size={40} style={{ color: '#94A3B8', marginBottom: '12px' }} />
                                <h4 style={{ margin: '0 0 6px 0', fontWeight: 900, color: '#334155' }}>No Active Tasks</h4>
                                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>No automated background tasks or reminders currently queued for this merchant.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {backgroundJobs.map((job) => (
                                    <div key={job._id} style={{ background: '#F8FAFC', padding: '20px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: 950, fontSize: '0.95rem', color: '#0F172A' }}>{job.jobType}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px' }}>
                                                Job ID: #{job._id} • Created: {new Date(job.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <span style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, background: job.status === 'completed' ? '#DCFCE7' : '#F1F5F9', color: job.status === 'completed' ? '#166534' : '#475569', textTransform: 'uppercase' }}>
                                            {job.status}
                                        </span>
                                    </div>
                                ))}

                                {reminders.map((rem) => (
                                    <div key={rem._id} style={{ background: '#FFF7ED', padding: '20px', borderRadius: '20px', border: '1px solid #FFEDD5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: 950, fontSize: '0.95rem', color: '#7C2D12' }}>Automated Payment Reminder</div>
                                            <div style={{ fontSize: '0.8rem', color: '#C2410C', marginTop: '4px' }}>
                                                Due: {new Date(rem.dueDate).toLocaleString()} • Sent: {rem.remindersSentCount || 0} times
                                            </div>
                                        </div>
                                        <span style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900, background: '#FFEDD5', color: '#C2410C', textTransform: 'uppercase' }}>
                                            {rem.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 4: ACTIVITY STREAM */}
                {activeTab === 'logs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', color: '#0F172A' }}>Merchant Activity Audit Trail</h3>

                        {activityLogs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#F8FAFC', borderRadius: '24px', border: '1px dashed #CBD5E1' }}>
                                <Activity size={40} style={{ color: '#94A3B8', marginBottom: '12px' }} />
                                <h4 style={{ margin: '0 0 6px 0', fontWeight: 900, color: '#334155' }}>No Activity Recorded</h4>
                                <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>Activity stream is clear for this merchant.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {activityLogs.map((log) => (
                                    <div key={log._id} style={{ background: '#F8FAFC', padding: '16px 20px', borderRadius: '18px', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                        <div>
                                            <div style={{ fontWeight: 850, fontSize: '0.9rem', color: '#0F172A' }}>{log.details}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>Action: <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{log.action}</span></div>
                                        </div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94A3B8' }}>
                                            {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteConfirm && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '40px', borderRadius: '32px', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
                        <div style={{ width: '80px', height: '80px', background: '#FEF2F2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#EF4444' }}>
                            <Trash2 size={40} />
                        </div>
                        <h3 style={{ fontWeight: 950, fontSize: '1.5rem', marginBottom: '12px' }}>Purge Merchant</h3>
                        <p style={{ color: '#64748B', fontWeight: 600, lineHeight: 1.6, marginBottom: '32px' }}>Are you sure you want to permanently delete <strong>{business?.displayName || user?.name}</strong> and all associated data? This action cannot be undone.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '16px', borderRadius: '16px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ padding: '16px', borderRadius: '16px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 900, cursor: 'pointer' }}>Confirm Purge</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default AdminMerchantDetail;
