import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSales } from "../context/SaleContext";
import { ArrowLeft, Search, Filter, ChevronRight, CheckCircle, Clock, MoreHorizontal } from "lucide-react";

// Helper for formatted date
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

const SalesList = () => {
    const { sales, fetchSales, loading } = useSales();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    // Sync filterStatus with URL changes
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const status = queryParams.get("status") || "all";
        setFilterStatus(status);
    }, [location.search]);

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
            } else if (filterStatus === "pending") {
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
            <div className="container" style={{ textAlign: 'center', paddingTop: '100px', display: 'flex', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{ background: '#FAFAFA', minHeight: '100vh', paddingBottom: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="container animate-fade-in" style={{ maxWidth: '1000px', padding: '24px 20px', width: '100%' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{
                                background: 'white',
                                border: '1px solid var(--border)',
                                color: 'var(--text)',
                                cursor: 'pointer',
                                padding: '10px',
                                borderRadius: '12px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                transition: '0.2s'
                            }}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>All Records</h1>
                    </div>
                    <Link to="/sales/new">
                        <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', borderRadius: '12px' }}>
                            + New Record
                        </button>
                    </Link>
                </div>

                {/* Search & Filter */}
                <div className="glass-card" style={{ padding: '16px', marginBottom: '24px', background: 'white', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                            type="text"
                            placeholder="Search by name, description or ID..."
                            style={{ width: '100%', padding: '12px 12px 12px 48px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '1rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {['all', 'paid', 'pending', 'partial', 'unpaid'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '100px',
                                    border: filterStatus === status ? 'none' : '1px solid #E5E7EB',
                                    background: filterStatus === status ? 'var(--primary)' : 'white',
                                    color: filterStatus === status ? 'white' : '#4B5563',
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                    cursor: 'pointer',
                                    transition: '0.2s',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {status === 'pending' ? 'Outstanding' : status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '16px'
                }}>
                    {filteredSales.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#6B7280', gridColumn: '1 / -1' }}>
                            <p>No records found matching your filters.</p>
                        </div>
                    ) : (
                        filteredSales.map(sale => (
                            <div
                                key={sale._id}
                                className="glass-card animate-fade-in"
                                style={{
                                    padding: '16px',
                                    background: 'white',
                                    borderRadius: '16px',
                                    border: '1px solid transparent',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                    cursor: 'pointer',
                                    transition: '0.2s',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                                onClick={() => navigate(`/invoice/${sale._id}`)}
                            >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{
                                        background: sale.status === 'paid' ? '#ECFDF5' : '#FFF7ED',
                                        padding: '12px',
                                        borderRadius: '14px',
                                        color: sale.status === 'paid' ? '#10B981' : '#F97316',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {sale.status === 'paid' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
                                            {sale.customerName || 'Walk-in Customer'}
                                        </h3>
                                        <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                            {formatDate(sale.createdAt)} • #{sale._id.slice(-4).toUpperCase()}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>
                                        ₦{sale.totalAmount.toLocaleString()}
                                    </p>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        color: sale.status === 'paid' ? '#10B981' : '#F97316'
                                    }}>
                                        {sale.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesList;
