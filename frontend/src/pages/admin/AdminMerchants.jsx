import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Trash2, ChevronRight, ShieldOff, Snowflake, ShieldCheck, Users, Building2, MoreVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    active:   { label: 'Active',   bg: '#DCFCE7', color: '#15803D', dot: '#22C55E' },
    frozen:   { label: 'Frozen',   bg: '#DBEAFE', color: '#1D4ED8', dot: '#3B82F6' },
    blocked:  { label: 'Blocked',  bg: '#FEE2E2', color: '#B91C1C', dot: '#EF4444' },
};

const PLAN_CONFIG = {
    hustler:  { bg: '#F1F5F9', color: '#475569' },
    oga:      { bg: '#DCFCE7', color: '#15803D' },
    chairman: { bg: '#EEF2FF', color: '#4338CA' },
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status = 'active' }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '100px', background: cfg.bg, color: cfg.color, fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
};

// ─── Action Menu ──────────────────────────────────────────────────────────────
const ActionMenu = ({ user, onStatusChange, onDelete, onView }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const currentStatus = user.accountStatus || 'active';
    const actions = [
        { label: 'View Details', icon: ChevronRight, fn: () => { onView(); setOpen(false); } },
        ...(currentStatus !== 'frozen'  ? [{ label: 'Freeze Account',      icon: Snowflake,  fn: () => { onStatusChange(user, 'frozen');  setOpen(false); } }] : []),
        ...(currentStatus !== 'blocked' ? [{ label: 'Block Account',        icon: ShieldOff,  fn: () => { onStatusChange(user, 'blocked'); setOpen(false); } }] : []),
        ...(currentStatus !== 'active'  ? [{ label: 'Reactivate Account',   icon: ShieldCheck,fn: () => { onStatusChange(user, 'active');  setOpen(false); } }] : []),
        { label: 'Purge Merchant', icon: Trash2, fn: () => { onDelete(); setOpen(false); }, danger: true },
    ];

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
                style={{ padding: '7px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', transition: 'all 0.15s' }}
            >
                <MoreVertical size={16} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: -6 }}
                        transition={{ duration: 0.12 }}
                        style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 8px 32px -4px rgba(15,23,42,0.14)', zIndex: 100, minWidth: '185px', overflow: 'hidden', padding: '6px' }}
                    >
                        {actions.map((a, i) => (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); a.fn(); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800, color: a.danger ? '#EF4444' : '#1E293B', textAlign: 'left', transition: 'background 0.12s' }}
                                onMouseEnter={e => e.currentTarget.style.background = a.danger ? '#FEF2F2' : '#F8FAFC'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <a.icon size={14} style={{ flexShrink: 0 }} /> {a.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Merchant Card ────────────────────────────────────────────────────────────
const MerchantCard = ({ u, onView, onStatusChange, onDelete }) => {
    const plan = u.business?.plan;
    const planCfg = PLAN_CONFIG[plan] || { bg: '#FFF7ED', color: '#C2410C' };
    const initial = (u.business?.displayName || u.name || '?').charAt(0).toUpperCase();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            whileHover={{ y: -2, boxShadow: '0 12px 40px -8px rgba(15,23,42,0.12)' }}
            transition={{ duration: 0.18 }}
            onClick={onView}
            style={{ background: 'white', border: '1px solid #E8EDF5', borderRadius: '24px', padding: '22px', cursor: 'pointer', position: 'relative', transition: 'box-shadow 0.2s' }}
        >
            {/* Top Row: Avatar + Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 1 }}>
                    {u.business?.logoUrl ? (
                        <img src={u.business.logoUrl} alt={u.business.displayName}
                            style={{ width: '44px', height: '44px', borderRadius: '14px', objectFit: 'cover', border: '1px solid #F1F5F9', flexShrink: 0 }}
                            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                        />
                    ) : null}
                    <div style={{ display: u.business?.logoUrl ? 'none' : 'flex', width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)', color: 'white', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '1.1rem', flexShrink: 0 }}>
                        {initial}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: '0 0 2px 0', fontWeight: 900, fontSize: '0.95rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {u.business?.displayName || u.name}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {u.name} · {u.email}
                        </p>
                    </div>
                </div>
                <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0, marginLeft: '8px' }}>
                    <ActionMenu user={u} onView={onView} onStatusChange={onStatusChange} onDelete={onDelete} />
                </div>
            </div>

            {/* Badges Row */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <StatusBadge status={u.accountStatus || 'active'} />
                <span style={{ padding: '3px 9px', borderRadius: '100px', background: planCfg.bg, color: planCfg.color, fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {plan || 'Incomplete'}
                </span>
                {u.business?.isKreddyConnected && (
                    <span style={{ padding: '3px 9px', borderRadius: '100px', background: '#DCFCE7', color: '#15803D', fontSize: '0.65rem', fontWeight: 900 }}>WA Active</span>
                )}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: '#F1F5F9', margin: '0 0 14px 0' }} />

            {/* Footer: Joined date + chevron */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>
                    Joined {new Date(u.business?.createdAt || u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <ChevronRight size={14} style={{ color: '#CBD5E1' }} />
            </div>
        </motion.div>
    );
};

// ─── Moderation Confirm Modal ─────────────────────────────────────────────────
const ModerationModal = ({ target, onConfirm, onClose }) => {
    const [reason, setReason] = useState('');
    if (!target) return null;
    const { user, newStatus } = target;
    const cfg = STATUS_CONFIG[newStatus] || STATUS_CONFIG.active;
    const Icon = newStatus === 'frozen' ? Snowflake : newStatus === 'blocked' ? ShieldOff : ShieldCheck;

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                style={{ background: 'white', padding: '36px', borderRadius: '28px', maxWidth: '420px', width: '100%' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
                        <Icon size={24} />
                    </div>
                    <button onClick={onClose} style={{ padding: '8px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', color: '#64748B' }}>
                        <X size={16} />
                    </button>
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontWeight: 950, fontSize: '1.25rem', color: '#0F172A' }}>
                    {newStatus === 'active' ? 'Reactivate Account' : newStatus === 'frozen' ? 'Freeze Account' : 'Block Account'}
                </h3>
                <p style={{ margin: '0 0 20px 0', color: '#64748B', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    {newStatus === 'active'
                        ? `This will restore full access for ${user.name || user.email}.`
                        : newStatus === 'frozen'
                        ? `${user.name || user.email} will be able to view their dashboard but cannot create or modify anything.`
                        : `${user.name || user.email} will be immediately locked out of all platform access.`}
                </p>
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Reason (optional)
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder={newStatus === 'active' ? 'Investigation concluded, access restored.' : 'e.g. Suspected fraudulent activity — under review.'}
                        rows={3}
                        style={{ width: '100%', borderRadius: '14px', border: '1px solid #E2E8F0', padding: '12px', fontSize: '0.85rem', fontWeight: 600, resize: 'none', outline: 'none', fontFamily: 'inherit', color: '#0F172A', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer', fontSize: '0.88rem' }}>Cancel</button>
                    <button
                        onClick={() => onConfirm(reason)}
                        style={{ padding: '14px', borderRadius: '14px', border: 'none', background: cfg.color, color: 'white', fontWeight: 900, cursor: 'pointer', fontSize: '0.88rem' }}
                    >
                        Confirm {newStatus === 'active' ? 'Reactivate' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ targetId, onConfirm, onClose }) => {
    if (!targetId) return null;
    return createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(10px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: 'white', padding: '36px', borderRadius: '28px', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#EF4444' }}>
                    <Trash2 size={28} />
                </div>
                <h3 style={{ margin: '0 0 8px 0', fontWeight: 950, fontSize: '1.3rem' }}>Purge Merchant?</h3>
                <p style={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '28px' }}>
                    This permanently deletes the merchant and all associated data. This action cannot be undone.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '14px', borderRadius: '14px', border: '1px solid #E2E8F0', background: 'white', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                    <button onClick={onConfirm} style={{ padding: '14px', borderRadius: '14px', border: 'none', background: '#EF4444', color: 'white', fontWeight: 900, cursor: 'pointer' }}>Purge</button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const FILTER_TABS = [
    { key: 'all',     label: 'All' },
    { key: 'active',  label: 'Active' },
    { key: 'frozen',  label: 'Frozen' },
    { key: 'blocked', label: 'Blocked' },
];

const ITEMS_PER_PAGE = 12;

const AdminMerchants = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Moderation modal state
    const [moderationTarget, setModerationTarget] = useState(null); // { user, newStatus }

    // Delete modal state
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => { fetchUsers(); }, []);
    useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTab]);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_URL}/admin/users`, { withCredentials: true });
            if (res.data.success) setUsers(res.data.data);
        } catch (err) {
            if (err.response?.status === 401 || err.response?.status === 403) return;
            toast.error("Failed to fetch merchants.");
        } finally {
            setLoading(false);
        }
    };

    // ── Filtering ──────────────────────────────────────────────────────────────
    const filtered = users.filter(u => {
        const matchesSearch =
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.business?.displayName?.toLowerCase().includes(searchTerm.toLowerCase());

        const status = u.accountStatus || 'active';
        const matchesFilter = filterTab === 'all' || status === filterTab;

        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // ── Summary Counts ─────────────────────────────────────────────────────────
    const counts = {
        total:   users.length,
        active:  users.filter(u => (u.accountStatus || 'active') === 'active').length,
        frozen:  users.filter(u => u.accountStatus === 'frozen').length,
        blocked: users.filter(u => u.accountStatus === 'blocked').length,
    };

    // ── Actions ────────────────────────────────────────────────────────────────
    const handleStatusChange = (user, newStatus) => {
        setModerationTarget({ user, newStatus });
    };

    const confirmStatusChange = async (reason) => {
        const { user, newStatus } = moderationTarget;
        try {
            await axios.patch(`${API_URL}/admin/merchants/${user._id}/account-status`,
                { status: newStatus, reason },
                { withCredentials: true }
            );
            toast.success(`Account ${newStatus === 'active' ? 'reactivated' : newStatus} successfully.`);
            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, accountStatus: newStatus } : u));
        } catch {
            toast.error("Failed to update account status.");
        } finally {
            setModerationTarget(null);
        }
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${API_URL}/admin/users/${deleteTargetId}`, { withCredentials: true });
            toast.success("Merchant purged.");
            setUsers(prev => prev.filter(u => u._id !== deleteTargetId));
        } catch {
            toast.error("Purge failed.");
        } finally {
            setDeleteTargetId(null);
        }
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '20px' }} />)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: '160px', borderRadius: '24px' }} />)}
                </div>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* ── Summary Stats Bar ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
                {[
                    { label: 'Total Merchants', value: counts.total,   icon: Users,      bg: 'linear-gradient(135deg, #F0F4FF 0%, #E8EDFF 100%)', color: '#4338CA' },
                    { label: 'Active',          value: counts.active,  icon: ShieldCheck,bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', color: '#15803D' },
                    { label: 'Frozen',          value: counts.frozen,  icon: Snowflake,  bg: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', color: '#1D4ED8' },
                    { label: 'Blocked',         value: counts.blocked, icon: ShieldOff,  bg: 'linear-gradient(135deg, #FFF1F2 0%, #FEE2E2 100%)', color: '#B91C1C' },
                ].map(({ label, value, icon: Icon, bg, color }) => (
                    <div key={label} style={{ background: bg, borderRadius: '18px', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{label}</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 950, color, lineHeight: 1 }}>{value}</div>
                        </div>
                        <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                            <Icon size={18} />
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Main Panel ── */}
            <div className="dashboard-glass" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '28px', padding: '28px' }}>

                {/* Header row: Title + Search */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
                    <div>
                        <h2 style={{ margin: 0, fontWeight: 950, fontSize: '1.3rem', color: '#0F172A' }}>Merchant Directory</h2>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 600 }}>
                            {filtered.length} merchant{filtered.length !== 1 ? 's' : ''} · Page {currentPage} of {totalPages}
                        </p>
                    </div>
                    <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '340px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            type="text"
                            placeholder="Search name, email, business..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: '14px', border: '1px solid #E2E8F0', background: '#F8FAFC', fontWeight: 700, fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '6px', background: '#F8FAFC', padding: '5px', borderRadius: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    {FILTER_TABS.map(tab => {
                        const active = filterTab === tab.key;
                        const cfg = STATUS_CONFIG[tab.key];
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setFilterTab(tab.key)}
                                style={{ padding: '7px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.8rem', transition: 'all 0.15s',
                                    background: active ? (cfg ? cfg.color : '#1E293B') : 'transparent',
                                    color: active ? 'white' : '#64748B',
                                }}
                            >
                                {tab.label}
                                {tab.key !== 'all' && counts[tab.key] > 0 && (
                                    <span style={{ marginLeft: '6px', padding: '1px 6px', borderRadius: '100px', background: active ? 'rgba(255,255,255,0.25)' : '#E2E8F0', fontSize: '0.65rem', fontWeight: 900 }}>
                                        {counts[tab.key]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Card Grid */}
                {paginated.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '52px 20px', background: '#F8FAFC', borderRadius: '20px', border: '1px dashed #CBD5E1' }}>
                        <Building2 size={40} style={{ color: '#CBD5E1', marginBottom: '12px' }} />
                        <h4 style={{ margin: '0 0 6px 0', fontWeight: 900, color: '#475569' }}>No Merchants Found</h4>
                        <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>No results match your current filters.</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                            {paginated.map(u => (
                                <MerchantCard
                                    key={u._id}
                                    u={u}
                                    onView={() => navigate(`/admin/merchants/${u._id}`)}
                                    onStatusChange={handleStatusChange}
                                    onDelete={() => setDeleteTargetId(u._id)}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '12px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}
                                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: currentPage === 1 ? '#F8FAFC' : 'white', fontWeight: 800, fontSize: '0.8rem', color: currentPage === 1 ? '#CBD5E1' : '#0F172A', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                                Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1).map((n, idx, arr) => (
                                <>
                                    {idx > 0 && arr[idx-1] !== n - 1 && <span key={`ellipsis-${n}`} style={{ padding: '8px 4px', fontSize: '0.8rem', color: '#CBD5E1', alignSelf: 'center' }}>…</span>}
                                    <button key={n} onClick={() => setCurrentPage(n)}
                                        style={{ padding: '8px 12px', borderRadius: '10px', border: n === currentPage ? 'none' : '1px solid #E2E8F0', background: n === currentPage ? 'var(--primary)' : 'white', color: n === currentPage ? 'white' : '#0F172A', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                                        {n}
                                    </button>
                                </>
                            ))}
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}
                                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #E2E8F0', background: currentPage === totalPages ? '#F8FAFC' : 'white', fontWeight: 800, fontSize: '0.8rem', color: currentPage === totalPages ? '#CBD5E1' : '#0F172A', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {moderationTarget && (
                    <ModerationModal
                        target={moderationTarget}
                        onConfirm={confirmStatusChange}
                        onClose={() => setModerationTarget(null)}
                    />
                )}
                {deleteTargetId && (
                    <DeleteModal
                        targetId={deleteTargetId}
                        onConfirm={confirmDelete}
                        onClose={() => setDeleteTargetId(null)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminMerchants;
