import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Search, Trash2, FileText, CreditCard,
    Wallet, Clock, Activity, Building2, ShieldCheck,
    Phone, Mail, CheckCircle2, AlertCircle,
    User, Zap, RefreshCw, ChevronLeft, ChevronRight,
    ShieldOff, Snowflake, X, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    active:  { label: 'Active',  bg: '#DCFCE7', color: '#15803D', border: '#BBF7D0', icon: ShieldCheck },
    frozen:  { label: 'Frozen',  bg: '#DBEAFE', color: '#1D4ED8', border: '#BFDBFE', icon: Snowflake   },
    blocked: { label: 'Blocked', bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA', icon: ShieldOff   },
};

const PLAN_CONFIG = {
    hustler:  { bg: '#F1F5F9', color: '#475569' },
    oga:      { bg: '#DCFCE7', color: '#15803D' },
    chairman: { bg: '#EEF2FF', color: '#4338CA' },
};

const ITEMS_PER_PAGE = 10;

// ─── Pagination Controls Helper ────────────────────────────────────────────────
const PaginationBar = ({ page, total, perPage, onPage }) => {
    if (total <= perPage) return null;
    const totalPages = Math.ceil(total / perPage);
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                Showing <strong>{(page - 1) * perPage + 1}</strong>–<strong>{Math.min(page * perPage, total)}</strong> of <strong>{total}</strong>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button disabled={page === 1} onClick={() => onPage(p => Math.max(1, p - 1))}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', background: page === 1 ? '#F8FAFC' : 'white', color: page === 1 ? '#CBD5E1' : '#0F172A', fontWeight: 800, fontSize: '0.8rem', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>
                    <ChevronLeft size={16} /> Prev
                </button>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', padding: '0 6px' }}>
                    {page} / {totalPages}
                </span>
                <button disabled={page === totalPages} onClick={() => onPage(p => Math.min(totalPages, p + 1))}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #E2E8F0', background: page === totalPages ? '#F8FAFC' : 'white', color: page === totalPages ? '#CBD5E1' : '#0F172A', fontWeight: 800, fontSize: '0.8rem', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

// ─── Moderation Modal ─────────────────────────────────────────────────────────
const ModerationModal = ({ target, onConfirm, onClose }) => {
    const [reason, setReason] = useState('');
    if (!target) return null;
    const { merchantName, newStatus } = target;
    const cfg = STATUS_CONFIG[newStatus] || STATUS_CONFIG.active;
    const Icon = cfg.icon;

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                style={{ background: 'white', padding: '36px', borderRadius: '28px', maxWidth: '440px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: cfg.bg, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                        <Icon size={24} />
                    </div>
                    <button onClick={onClose} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', color: '#64748B' }}><X size={16} /></button>
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontWeight: 950, fontSize: '1.25rem', color: '#0F172A' }}>
                    {newStatus === 'active' ? 'Reactivate Account' : newStatus === 'frozen' ? 'Freeze Account' : 'Block Account'}
                </h3>
                <p style={{ margin: '0 0 20px 0', color: '#64748B', fontSize: '0.88rem', lineHeight: 1.7 }}>
                    {newStatus === 'active'
                        ? `This will restore full access for ${merchantName}.`
                        : newStatus === 'frozen'
                        ? `${merchantName} will retain read access but cannot create invoices, record payments, or modify any data.`
                        : `${merchantName} will be immediately and completely locked out of the platform.`}
                </p>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Reason (optional)
                    </label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                        placeholder={newStatus === 'active' ? 'e.g. Investigation concluded, account cleared.' : 'e.g. Suspected fraudulent activity under review.'}
                        style={{ width: '100%', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '12px', fontSize: '0.85rem', fontWeight: 600, resize: 'none', outline: 'none', fontFamily: 'inherit', color: '#0F172A', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}>Cancel</button>
                    <button onClick={() => onConfirm(reason)} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: cfg.color, color: 'white', fontWeight: 900, cursor: 'pointer', fontSize: '0.88rem' }}>
                        Confirm {newStatus === 'active' ? 'Reactivation' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminMerchantDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('invoices');
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [logFilter, setLogFilter] = useState('key');
    const [moderationTarget, setModerationTarget] = useState(null);
    const [accountStatus, setAccountStatus] = useState('active');

    // Pagination
    const [invoicePage, setInvoicePage] = useState(1);
    const [taskPage, setTaskPage] = useState(1);
    const [logPage, setLogPage] = useState(1);
    useEffect(() => { setInvoicePage(1); }, [invoiceSearch]);
    useEffect(() => { setLogPage(1); }, [logFilter]);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const h = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', h);
        return () => window.removeEventListener('resize', h);
    }, []);

    useEffect(() => { if (id) fetchMerchantDetails(); }, [id]);

    const fetchMerchantDetails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/merchants/${id}/details`, { withCredentials: true });
            if (res.data.success) {
                setData(res.data.data);
                setAccountStatus(res.data.data.user?.accountStatus || 'active');
            }
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) return;
            toast.error("Failed to load merchant details.");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_URL}/admin/users/${data?.user?._id || id}`, { withCredentials: true });
            toast.success("Merchant purged successfully.");
            navigate('/admin/merchants');
        } catch {
            toast.error("Purge failed.");
        } finally {
            setShowDeleteConfirm(false);
        }
    };

    const handleModeration = (newStatus) => {
        setModerationTarget({ merchantName: data?.business?.displayName || data?.user?.name, newStatus });
    };

    const confirmModeration = async (reason) => {
        const { newStatus } = moderationTarget;
        try {
            await axios.patch(`${API_URL}/admin/merchants/${data?.user?._id || id}/account-status`,
                { status: newStatus, reason }, { withCredentials: true });
            setAccountStatus(newStatus);
            setData(prev => ({ ...prev, user: { ...prev.user, accountStatus: newStatus, accountStatusReason: reason, accountStatusUpdatedAt: new Date() } }));
            toast.success(`Account ${newStatus === 'active' ? 'reactivated' : newStatus} successfully.`);
        } catch {
            toast.error("Failed to update account status.");
        } finally {
            setModerationTarget(null);
        }
    };

    // ── Loading Skeleton ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton" style={{ width: '160px', height: '42px', borderRadius: '12px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="skeleton" style={{ width: '100px', height: '42px', borderRadius: '12px' }} />
                        <div className="skeleton" style={{ width: '130px', height: '42px', borderRadius: '12px' }} />
                    </div>
                </div>
                <div className="skeleton" style={{ height: '180px', borderRadius: '28px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '24px' }} />)}
                </div>
                <div className="skeleton" style={{ height: '400px', borderRadius: '28px' }} />
            </motion.div>
        );
    }

    if (!data) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '28px', border: '1px solid var(--border)' }}>
                <AlertCircle size={48} style={{ color: '#EF4444', marginBottom: '16px' }} />
                <h3 style={{ fontWeight: 900, margin: '0 0 8px 0' }}>Merchant Not Found</h3>
                <p style={{ color: '#64748B', marginBottom: '24px' }}>The requested merchant profile could not be located.</p>
                <Link to="/admin/merchants" style={{ padding: '12px 24px', borderRadius: '14px', background: 'var(--primary)', color: 'white', textDecoration: 'none', fontWeight: 800 }}>
                    Back to Directory
                </Link>
            </div>
        );
    }

    const { user, business, stats, sales = [], activityLogs = [], backgroundJobs = [], reminders = [] } = data;
    const filteredSales = sales.filter(s =>
        (s.invoiceNumber?.toLowerCase().includes(invoiceSearch.toLowerCase())) ||
        (s.customerName?.toLowerCase().includes(invoiceSearch.toLowerCase())) ||
        (s.description?.toLowerCase().includes(invoiceSearch.toLowerCase()))
    );

    const joinedDate = business?.createdAt ? new Date(business.createdAt) : (user?.createdAt ? new Date(user.createdAt) : new Date());
    const plan = business?.plan;
    const planCfg = PLAN_CONFIG[plan] || { bg: '#FFF7ED', color: '#C2410C' };
    const statusCfg = STATUS_CONFIG[accountStatus] || STATUS_CONFIG.active;
    const StatusIcon = statusCfg.icon;
    const initial = (business?.displayName || user?.name || '?').charAt(0).toUpperCase();

    const TABS = [
        { key: 'invoices', label: `Invoices (${sales.length})`,       icon: FileText   },
        { key: 'banking',  label: 'Bank & Identity',                   icon: Building2  },
        { key: 'tasks',    label: `Tasks (${backgroundJobs.length})`,  icon: Zap        },
        { key: 'logs',     label: `Activity (${activityLogs.length})`, icon: Activity   },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── Top Nav Bar ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                <button onClick={() => navigate('/admin/merchants')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start', gap: '8px', border: 'none', background: '#F1F5F9', padding: '11px 18px', borderRadius: '12px', fontWeight: 800, color: '#475569', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <ArrowLeft size={16} /> Back to Directory
                </button>
                <div style={{ display: 'flex', gap: '10px', justifyContent: isMobile ? 'space-between' : 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={fetchMerchantDetails}
                        style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid #E2E8F0', background: 'white', padding: '11px 16px', borderRadius: '12px', fontWeight: 800, color: '#64748B', cursor: 'pointer', fontSize: '0.82rem' }}>
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)}
                        style={{ flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: 'none', background: '#FEF2F2', padding: '11px 16px', borderRadius: '12px', fontWeight: 800, color: '#DC2626', cursor: 'pointer', fontSize: '0.82rem' }}>
                        <Trash2 size={14} /> Purge Merchant
                    </button>
                </div>
            </div>

            {/* ── Hero Card ── */}
            <div style={{ borderRadius: '28px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                {/* Dark banner */}
                <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #312E81 100%)', padding: isMobile ? '24px 20px' : '32px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ display: 'flex', gap: '18px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Avatar */}
                        {business?.logoUrl ? (
                            <img src={business.logoUrl} alt={business.displayName}
                                style={{ width: isMobile ? '56px' : '70px', height: isMobile ? '56px' : '70px', borderRadius: '20px', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.15)', flexShrink: 0 }}
                                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                            />
                        ) : null}
                        <div style={{ display: business?.logoUrl ? 'none' : 'flex', width: isMobile ? '56px' : '70px', height: isMobile ? '56px' : '70px', borderRadius: '20px', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', border: '2px solid rgba(255,255,255,0.15)', color: 'white', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: isMobile ? '1.4rem' : '1.8rem', flexShrink: 0 }}>
                            {initial}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                <h1 style={{ margin: 0, fontWeight: 950, fontSize: isMobile ? '1.3rem' : '1.7rem', color: 'white' }}>
                                    {business?.displayName || user?.name}
                                </h1>
                                {/* Status badge */}
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 12px', borderRadius: '100px', background: statusCfg.bg, color: statusCfg.color, fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                    <StatusIcon size={11} /> {statusCfg.label}
                                </span>
                                <span style={{ padding: '4px 12px', borderRadius: '100px', background: planCfg.bg, color: planCfg.color, fontSize: '0.68rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    {plan || 'Incomplete'}
                                </span>
                                {business?.isKreddyConnected && (
                                    <span style={{ padding: '4px 10px', borderRadius: '100px', background: '#DCFCE7', color: '#15803D', fontSize: '0.68rem', fontWeight: 900 }}>WA Active</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', fontWeight: 600 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={13} /> {user?.name}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', wordBreak: 'break-all' }}><Mail size={13} /> {user?.email}</span>
                                {business?.whatsappNumber && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ADE80', fontWeight: 800 }}><Phone size={13} /> +{business.whatsappNumber}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Merchant since */}
                    <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 18px', borderRadius: '16px', textAlign: isMobile ? 'left' : 'right' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Merchant Since</div>
                        <div style={{ fontSize: '1rem', fontWeight: 950, color: 'white', marginTop: '2px' }}>
                            {joinedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Moderation strip */}
                <div style={{ background: accountStatus === 'blocked' ? '#FFF1F2' : accountStatus === 'frozen' ? '#EFF6FF' : '#F8FAFC', borderTop: `1px solid ${statusCfg.border}`, padding: '14px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {accountStatus !== 'active' && (
                            <AlertTriangle size={15} style={{ color: statusCfg.color }} />
                        )}
                        <div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: statusCfg.color }}>
                                Account is {statusCfg.label}
                            </span>
                            {user?.accountStatusReason && (
                                <span style={{ fontSize: '0.75rem', color: '#64748B', marginLeft: '8px', fontWeight: 600 }}>
                                    — {user.accountStatusReason}
                                </span>
                            )}
                            {user?.accountStatusUpdatedAt && (
                                <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginLeft: '8px' }}>
                                    (updated {new Date(user.accountStatusUpdatedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })})
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {accountStatus !== 'frozen'  && <button onClick={() => handleModeration('frozen')}  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}><Snowflake size={13}/> Freeze</button>}
                        {accountStatus !== 'blocked' && <button onClick={() => handleModeration('blocked')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}><ShieldOff size={13}/> Block</button>}
                        {accountStatus !== 'active'  && <button onClick={() => handleModeration('active')}  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#15803D', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer' }}><ShieldCheck size={13}/> Reactivate</button>}
                    </div>
                </div>
            </div>

            {/* ── Stats Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                {[
                    { label: 'Invoices Sent', value: stats?.totalInvoices || 0, sub: `₦${(stats?.totalInvoiceAmountRecorded || 0).toLocaleString()} recorded`, bg: '#F5F3FF', border: '#EDE9FE', vColor: '#4C1D95', icon: FileText, iconBg: '#EDE9FE', iconColor: '#7C3AED' },
                    { label: 'Nomba / Gateway', value: `₦${(stats?.totalCollectedNombaOnline || 0).toLocaleString()}`, sub: 'Verified online collections', bg: '#F0FDF4', border: '#DCFCE7', vColor: '#14532D', icon: CreditCard, iconBg: '#DCFCE7', iconColor: '#16A34A' },
                    { label: 'Cash Collected', value: `₦${(stats?.totalCollectedCash || 0).toLocaleString()}`, sub: 'Manual cash recorded', bg: '#EFF6FF', border: '#DBEAFE', vColor: '#1E3A8A', icon: Wallet, iconBg: '#DBEAFE', iconColor: '#2563EB' },
                    { label: 'Outstanding', value: `₦${(stats?.totalOutstanding || 0).toLocaleString()}`, sub: 'Unpaid customer balance', bg: '#FFF7ED', border: '#FFEDD5', vColor: '#7C2D12', icon: Clock, iconBg: '#FFEDD5', iconColor: '#EA580C' },
                ].map(({ label, value, sub, bg, border, vColor, icon: Icon, iconBg, iconColor }) => (
                    <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '24px', padding: '22px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 850, color: vColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor }}>
                                <Icon size={18} />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 950, color: vColor, lineHeight: 1, marginBottom: '6px' }}>{value}</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: iconColor }}>{sub}</div>
                    </div>
                ))}
            </div>

            {/* ── Tabs Container ── */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '28px', padding: '28px' }}>
                {/* Tab Bar */}
                <div style={{ display: 'flex', gap: '6px', background: '#F8FAFC', padding: '5px', borderRadius: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
                    {TABS.map(({ key, label, icon: Icon }) => {
                        const active = activeTab === key;
                        return (
                            <button key={key} onClick={() => setActiveTab(key)}
                                style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px', borderRadius: '11px', border: 'none', background: active ? 'var(--primary)' : 'transparent', color: active ? 'white' : '#64748B', fontWeight: 850, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                                <Icon size={14} /> {label}
                            </button>
                        );
                    })}
                </div>

                {/* TAB 1: INVOICES */}
                {activeTab === 'invoices' && (() => {
                    const totalInvoicePages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
                    const paginatedSales = filteredSales.slice((invoicePage - 1) * ITEMS_PER_PAGE, invoicePage * ITEMS_PER_PAGE);
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.15rem', color: '#0F172A' }}>Invoices Ledger ({filteredSales.length})</h3>
                                <div style={{ position: 'relative', minWidth: '240px' }}>
                                    <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                    <input type="text" placeholder="Filter by invoice # or customer..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)}
                                        style={{ padding: '10px 13px 10px 38px', width: '100%', borderRadius: '12px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: '0.83rem', fontWeight: 700, outline: 'none', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            {filteredSales.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 20px', background: '#F8FAFC', borderRadius: '20px', border: '1px dashed #CBD5E1' }}>
                                    <FileText size={36} style={{ color: '#94A3B8', marginBottom: '10px' }} />
                                    <h4 style={{ margin: '0 0 4px 0', fontWeight: 900, color: '#334155' }}>No Invoices Found</h4>
                                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem' }}>No records matched your search criteria.</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', minWidth: '700px' }}>
                                            <thead>
                                                <tr>
                                                    {['INVOICE', 'CUSTOMER', 'DESCRIPTION', 'TOTAL', 'PAYMENTS', 'STATUS', 'DATE'].map(h => (
                                                        <th key={h} style={{ textAlign: h === 'DATE' ? 'right' : 'left', padding: '10px 14px', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800, letterSpacing: '0.05em' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedSales.map(sale => (
                                                    <tr key={sale._id} style={{ background: '#F8FAFC' }}>
                                                        <td style={{ padding: '13px 14px', borderRadius: '14px 0 0 14px', fontWeight: 950, fontSize: '0.88rem', color: 'var(--primary)' }}>#{sale.invoiceNumber || 'N/A'}</td>
                                                        <td style={{ padding: '13px 14px', fontSize: '0.83rem', fontWeight: 800, color: '#0F172A' }}>
                                                            {sale.customerName || 'Walk-in'}
                                                            {sale.customerPhone && <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>{sale.customerPhone}</div>}
                                                        </td>
                                                        <td style={{ padding: '13px 14px', fontSize: '0.82rem', color: '#475569', fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sale.description || 'Sales Order'}</td>
                                                        <td style={{ padding: '13px 14px', fontSize: '0.92rem', fontWeight: 950, color: '#0F172A' }}>₦{(sale.totalAmount || 0).toLocaleString()}</td>
                                                        <td style={{ padding: '13px 14px' }}>
                                                            {sale.payments?.length > 0
                                                                ? sale.payments.map((p, i) => (
                                                                    <div key={i} style={{ fontSize: '0.72rem', fontWeight: 800, color: ['Nomba','Paystack','Squad','Kredibly Online'].includes(p.method) ? '#16A34A' : '#475569' }}>
                                                                        ₦{p.amount.toLocaleString()} ({p.method || 'Cash'})
                                                                    </div>
                                                                ))
                                                                : <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>Unpaid</span>
                                                            }
                                                        </td>
                                                        <td style={{ padding: '13px 14px' }}>
                                                            <span style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '0.62rem', fontWeight: 900, textTransform: 'uppercase',
                                                                background: sale.status === 'paid' ? '#DCFCE7' : sale.status === 'partial' ? '#FEF9C3' : '#FEE2E2',
                                                                color: sale.status === 'paid' ? '#166534' : sale.status === 'partial' ? '#854D0E' : '#991B1B' }}>
                                                                {sale.status}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '13px 14px', borderRadius: '0 14px 14px 0', textAlign: 'right', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700 }}>
                                                            {new Date(sale.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <PaginationBar page={invoicePage} total={filteredSales.length} perPage={ITEMS_PER_PAGE} onPage={setInvoicePage} />
                                </>
                            )}
                        </div>
                    );
                })()}

                {/* TAB 2: BANK & VERIFICATION */}
                {activeTab === 'banking' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        {/* Bank Payout */}
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '26px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '9px' }}>
                                    <Building2 size={18} style={{ color: 'var(--primary)' }} /> Bank Payout Account
                                </h3>
                                <span style={{ padding: '3px 9px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, background: business?.bankDetails?.accountNumber ? '#DCFCE7' : '#FEE2E2', color: business?.bankDetails?.accountNumber ? '#166534' : '#991B1B' }}>
                                    {business?.bankDetails?.accountNumber ? 'ATTACHED' : 'UNATTACHED'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    { label: 'Bank Name', value: business?.bankDetails?.bankName || 'Not Attached' },
                                    { label: 'Account Number', value: business?.bankDetails?.accountNumber || 'N/A', large: true },
                                    { label: 'Account Name', value: business?.bankDetails?.accountName || 'Not Verified' },
                                ].map(({ label, value, large }) => (
                                    <div key={label}>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                                        <div style={{ fontSize: large ? '1.25rem' : '0.95rem', fontWeight: 900, color: large ? 'var(--primary)' : '#0F172A', marginTop: '2px', letterSpacing: large ? '0.05em' : 0 }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* KYC & Identity */}
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '24px', padding: '26px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '9px' }}>
                                    <ShieldCheck size={18} style={{ color: 'var(--primary)' }} /> Account & Identity
                                </h3>
                                <span style={{ padding: '3px 9px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, background: business?.kyc?.status === 'verified' ? '#DCFCE7' : '#FEF9C3', color: business?.kyc?.status === 'verified' ? '#166534' : '#854D0E' }}>
                                    Tier {business?.kyc?.tier || 1} · {business?.kyc?.status || 'Pending'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    { label: 'WhatsApp Workspace', value: `+${business?.whatsappNumber || 'Not Linked'}`, highlight: !!business?.whatsappNumber },
                                    { label: 'Entity & Selling Mode', value: `${business?.entityType || 'Individual'} · ${business?.sellMode || 'Both'}` },
                                    { label: 'Staff Members', value: business?.staffNumbers?.length > 0 ? `${business.staffNumbers.length} staff (${business.staffNumbers.join(', ')})` : 'Solo (0 staff)' },
                                ].map(({ label, value, highlight }) => (
                                    <div key={label}>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                                        <div style={{ fontSize: '0.92rem', fontWeight: 900, color: highlight ? '#16A34A' : '#0F172A', marginTop: '2px' }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: TASKS & AUTOMATION */}
                {activeTab === 'tasks' && (() => {
                    const allTaskItems = [
                        ...backgroundJobs.map(j => ({
                            id: j._id, itemType: 'job',
                            title: j.type ? j.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : (j.jobType || 'Background System Job'),
                            date: j.scheduledFor || j.createdAt,
                            status: j.status,
                        })),
                        ...reminders.map(r => ({
                            id: r._id, itemType: 'reminder',
                            title: r.description || (r.type === 'debt' ? 'Payment / Debt Reminder' : 'Scheduled Reminder'),
                            typeBadge: r.type || 'reminder',
                            recipientPhone: r.recipientPhone,
                            date: r.triggerDate || r.dueDate || r.createdAt,
                            status: r.status,
                        }))
                    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

                    const paginatedTasks = allTaskItems.slice((taskPage - 1) * ITEMS_PER_PAGE, taskPage * ITEMS_PER_PAGE);

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.15rem', color: '#0F172A' }}>Tasks & Automation ({allTaskItems.length})</h3>
                                <span style={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 700 }}>Background jobs & scheduled reminders</span>
                            </div>
                            {allTaskItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 20px', background: '#F8FAFC', borderRadius: '20px', border: '1px dashed #CBD5E1' }}>
                                    <Zap size={36} style={{ color: '#94A3B8', marginBottom: '10px' }} />
                                    <h4 style={{ margin: '0 0 4px 0', fontWeight: 900, color: '#334155' }}>No Active Tasks</h4>
                                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem' }}>No automated background tasks or reminders queued.</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {paginatedTasks.map(item => {
                                            const fmt = item.date && !isNaN(new Date(item.date))
                                                ? new Date(item.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                : 'Scheduled';

                                            if (item.itemType === 'job') return (
                                                <div key={item.id} style={{ background: '#F8FAFC', padding: '18px 20px', borderRadius: '18px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#0F172A' }}>{item.title}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '3px' }}>Job ID: #{item.id} · Created: {fmt}</div>
                                                    </div>
                                                    <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', background: item.status === 'completed' ? '#DCFCE7' : '#F1F5F9', color: item.status === 'completed' ? '#166534' : '#475569' }}>{item.status}</span>
                                                </div>
                                            );

                                            return (
                                                <div key={item.id} style={{ background: '#FFF7ED', padding: '18px 20px', borderRadius: '18px', border: '1px solid #FFEDD5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: 900, fontSize: '0.92rem', color: '#7C2D12', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {item.title}
                                                            <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '6px', background: '#FFEDD5', color: '#C2410C', textTransform: 'uppercase', fontWeight: 900 }}>{item.typeBadge}</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: '#C2410C', marginTop: '3px' }}>
                                                            Trigger: {fmt}{item.recipientPhone ? ` · +${item.recipientPhone}` : ''}
                                                        </div>
                                                    </div>
                                                    <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
                                                        background: item.status === 'delivered' ? '#DCFCE7' : item.status === 'cancelled' ? '#FEE2E2' : '#FFEDD5',
                                                        color: item.status === 'delivered' ? '#166534' : item.status === 'cancelled' ? '#991B1B' : '#C2410C' }}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <PaginationBar page={taskPage} total={allTaskItems.length} perPage={ITEMS_PER_PAGE} onPage={setTaskPage} />
                                </>
                            )}
                        </div>
                    );
                })()}

                {/* TAB 4: ACTIVITY STREAM */}
                {activeTab === 'logs' && (() => {
                    const filteredLogs = activityLogs.filter(log => logFilter === 'all' || !['WHATSAPP_MSG_RECEIVED', 'WHATSAPP_MSG_SENT'].includes(log.action));
                    const paginatedLogs = filteredLogs.slice((logPage - 1) * ITEMS_PER_PAGE, logPage * ITEMS_PER_PAGE);

                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.15rem', color: '#0F172A' }}>
                                    Activity Audit Trail ({filteredLogs.length})
                                </h3>
                                <div style={{ display: 'flex', gap: '6px', background: '#F1F5F9', padding: '4px', borderRadius: '12px' }}>
                                    {[{ key: 'key', label: 'Key Events' }, { key: 'all', label: 'All (Incl. Chat)' }].map(({ key, label }) => (
                                        <button key={key} onClick={() => setLogFilter(key)}
                                            style={{ padding: '6px 13px', borderRadius: '8px', border: 'none', background: logFilter === key ? 'white' : 'transparent', color: logFilter === key ? '#0F172A' : '#64748B', fontWeight: 800, fontSize: '0.76rem', cursor: 'pointer', boxShadow: logFilter === key ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {filteredLogs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 20px', background: '#F8FAFC', borderRadius: '20px', border: '1px dashed #CBD5E1' }}>
                                    <Activity size={36} style={{ color: '#94A3B8', marginBottom: '10px' }} />
                                    <h4 style={{ margin: '0 0 4px 0', fontWeight: 900, color: '#334155' }}>No Activity Recorded</h4>
                                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.82rem' }}>Activity stream is clear for this merchant.</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {paginatedLogs.map(log => (
                                            <div key={log._id} style={{ background: '#F8FAFC', padding: '14px 18px', borderRadius: '16px', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                                <div style={{ flex: 1, minWidth: '220px' }}>
                                                    <div style={{ fontWeight: 850, fontSize: '0.88rem', color: '#0F172A' }}>{log.details}</div>
                                                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '2px' }}>
                                                        Action: <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{log.action}</span>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#CBD5E1', whiteSpace: 'nowrap' }}>
                                                    {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <PaginationBar page={logPage} total={filteredLogs.length} perPage={ITEMS_PER_PAGE} onPage={setLogPage} />
                                </>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* Moderation Modal */}
            <AnimatePresence>
                {moderationTarget && (
                    <ModerationModal target={moderationTarget} onConfirm={confirmModeration} onClose={() => setModerationTarget(null)} />
                )}
            </AnimatePresence>

            {/* Delete Modal */}
            {showDeleteConfirm && createPortal(
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '40px', borderRadius: '28px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                        <div style={{ width: '70px', height: '70px', background: '#FEF2F2', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#EF4444' }}>
                            <Trash2 size={34} />
                        </div>
                        <h3 style={{ fontWeight: 950, fontSize: '1.4rem', marginBottom: '10px' }}>Purge Merchant</h3>
                        <p style={{ color: '#64748B', lineHeight: 1.65, marginBottom: '28px', fontSize: '0.88rem' }}>
                            Permanently delete <strong>{business?.displayName || user?.name}</strong> and all associated data. This cannot be undone.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={confirmDelete} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 900, cursor: 'pointer' }}>Confirm Purge</button>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}
        </motion.div>
    );
};

export default AdminMerchantDetail;
