import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSales } from "../../context/SaleContext";
import { Search, Filter, ChevronRight, CheckCircle, Clock, MoreHorizontal, Plus, Wallet, FileText } from "lucide-react";

// Helper for formatted date
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

const SalesList = ({ initialFilter }) => {
    const { sales, fetchSales, loading } = useSales();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState(initialFilter || "all");

    // Sync filterStatus with URL changes and props
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const status = queryParams.get("status") || initialFilter || "all";
        setFilterStatus(status);
    }, [location.search, initialFilter]);

    useEffect(() => {
        fetchSales();
    }, []);

    const filteredSales = useMemo(() => {
        return sales.filter(sale => {
            const matchesSearch =
                (sale.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                (sale.description?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
                sale._id.includes(searchTerm);

            let matchesStatus = true;
            if (filterStatus === "all") {
                matchesStatus = true;
            } else if (filterStatus === "pending" || filterStatus === "outstanding") {
                // Outstanding/Pending: anything not fully paid
                matchesStatus = sale.status === "unpaid" || sale.status === "partial";
            } else if (filterStatus === "revenue") {
                // Revenue: anything with at least some payment
                matchesStatus = sale.status === "paid" || sale.status === "partial";
            } else {
                matchesStatus = sale.status === filterStatus;
            }

            return matchesSearch && matchesStatus;
        });
    }, [sales, searchTerm, filterStatus]);

    if (loading && !sales.length) {
        return (
            <div style={{ textAlign: 'center', paddingTop: '100px', display: 'flex', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E293B', marginBottom: '4px', letterSpacing: '-0.02em' }}>
                        {filterStatus === 'outstanding' ? 'Debt recovery' : 'Sales Records'}
                    </h1>
                    <p style={{ color: '#64748B', fontWeight: 500 }}>
                        {filterStatus === 'outstanding' ? 'Track and manage payments owed to you.' : 'A complete history of your transactions.'}
                    </p>
                </div>
                <Link to="/sales/new" style={{ textDecoration: 'none', width: 'auto' }}>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px' }}>
                        <Plus size={20} /> New Sale
                    </button>
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="glass-card" style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            className="input-field"
                            style={{ paddingLeft: '48px', background: '#F8FAFC' }}
                            placeholder="Search records..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['all', 'paid', 'outstanding', 'partial'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid ' + (filterStatus === status ? 'var(--primary)' : '#E2E8F0'),
                                    background: filterStatus === status ? 'var(--primary)' : 'white',
                                    color: filterStatus === status ? 'white' : '#64748B',
                                    fontWeight: 700,
                                    textTransform: 'capitalize',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Records List */}
            <div className="glass-card" style={{ padding: '0', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', background: 'white' }}>
                {filteredSales.length === 0 ? (
                    <div style={{ padding: '80px 20px', textAlign: 'center' }}>
                        <FileText size={48} style={{ color: '#E2E8F0', marginBottom: '16px' }} />
                        <p style={{ fontWeight: 600, color: '#64748B' }}>No matches found.</p>
                    </div>
                ) : (
                    <>
                        {/* List Header */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2.5fr) 1fr 120px 100px 120px', padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }} className="hidden md:grid">
                            <span>Customer & Service</span>
                            <span>Invoice ID</span>
                            <span>Date</span>
                            <span>Status</span>
                            <span style={{ textAlign: 'right' }}>Amount</span>
                        </div>

                        {filteredSales.map(sale => (
                            <div
                                key={sale._id}
                                className="record-row"
                                style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2.5fr) 1fr 120px 100px 120px', padding: '20px 24px', borderBottom: '1px solid #F1F5F9', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }}
                                onClick={() => navigate(`/dashboard/invoice/${sale.invoiceNumber}`)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                                    <div style={{ background: sale.status === 'paid' ? '#F0FDF4' : '#FFF7ED', color: sale.status === 'paid' ? '#10B981' : '#F97316', padding: '10px', borderRadius: '12px', flexShrink: 0 }}>
                                        {sale.status === 'paid' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                    </div>
                                    <div style={{ overflow: 'hidden', minWidth: 0 }}>
                                        <p style={{ fontWeight: 800, color: '#1E293B', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sale.customerName || 'Walk-in'}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sale.description}</p>
                                    </div>
                                </div>
                                <span style={{ fontWeight: 600, color: '#64748B', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hidden md:block">#{sale.invoiceNumber}</span>
                                <span style={{ color: '#64748B', fontSize: '0.9rem' }} className="hidden md:block">{formatDate(sale.createdAt)}</span>
                                <div className="hidden md:block">
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '8px',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        background: sale.status === 'paid' ? '#ECFDF5' : '#FFF7ED',
                                        color: sale.status === 'paid' ? '#10B981' : '#F97316'
                                    }}>
                                        {sale.status}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1E293B' }}>₦{sale.totalAmount.toLocaleString()}</p>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <style>{`
                .record-row:hover {
                    background: #F8FAFC;
                    transform: translateX(4px);
                }
                @media (max-width: 768px) {
                    .record-row {
                        grid-template-columns: 1fr auto !important;
                    }
                }
            `}</style>
        </div >
    );
};

export default SalesList;
