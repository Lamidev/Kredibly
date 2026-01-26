import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSales } from "../../context/SaleContext";
import { 
    Search, Filter, CheckCircle, Clock, Plus, 
    FileText, Trash2, X, ArrowUpDown, ChevronRight 
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

const SalesList = ({ initialFilter }) => {
    const { sales, fetchSales, loading, deleteSale } = useSales();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState(initialFilter || "all");
    const [deleteModal, setDeleteModal] = useState({ show: false, sale: null });

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
            let matchesStatus = true;
            if (filterStatus === "all") {
                matchesStatus = true;
            } else if (filterStatus === "pending" || filterStatus === "outstanding") {
                matchesStatus = sale.status === "unpaid" || sale.status === "partial";
            } else if (filterStatus === "revenue") {
                matchesStatus = sale.status === "paid" || sale.status === "partial";
            } else {
                matchesStatus = sale.status === filterStatus;
            }

            const search = searchTerm.toLowerCase().trim();
            if (!search) return matchesStatus;

            const matchesSearch =
                (sale.customerName?.toLowerCase() || "").includes(search) ||
                (sale.description?.toLowerCase() || "").includes(search) ||
                (sale.invoiceNumber?.toLowerCase() || "").includes(search);

            return matchesSearch && matchesStatus;
        });
    }, [sales, searchTerm, filterStatus]);

    if (loading && !sales.length) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            {/* Executive Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.04em' }}>
                        {filterStatus === 'outstanding' ? 'Unpaid Bills' : 'All Sales'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1.1rem' }}>
                        {filterStatus === 'outstanding' 
                            ? 'Keep track of customers who haven\'t paid yet.' 
                            : 'See a list of all your sales and payments.'}
                    </p>
                </div>
                <Link to="/sales/new" style={{ textDecoration: 'none' }}>
                    <button className="btn-primary" style={{ padding: '16px 32px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, boxShadow: '0 10px 20px -5px var(--primary-glow)' }}>
                        <Plus size={20} strokeWidth={3} /> New Record
                    </button>
                </Link>
            </div>

            {/* Premium Filter & Search Bar */}
            <div className="dashboard-glass" style={{ padding: '24px', borderRadius: '32px', border: '1px solid var(--border)', marginBottom: '32px', background: 'white' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                        <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input
                            className="input-field"
                            style={{ 
                                paddingLeft: '56px', 
                                paddingRight: '48px', 
                                background: 'var(--background)',
                                border: '1px solid transparent',
                                borderRadius: '18px',
                                fontSize: '1rem',
                                fontWeight: 600
                            }}
                            placeholder="Find by name, invoice #, or details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94A3B8' }}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        <button onClick={() => setFilterStatus("all")} style={{ 
                            padding: '10px 24px', 
                            borderRadius: '100px', 
                            border: 'none', 
                            background: filterStatus === 'all' ? 'var(--primary)' : 'white',
                            color: filterStatus === 'all' ? 'white' : 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: '0.2s',
                            boxShadow: filterStatus === 'all' ? '0 10px 15px -3px var(--primary-glow)' : 'none'
                        }}>
                            All Sales
                        </button>
                        <button onClick={() => setFilterStatus("outstanding")} style={{ 
                            padding: '10px 24px', 
                            borderRadius: '100px', 
                            border: 'none', 
                            background: filterStatus === 'outstanding' ? 'var(--warning)' : 'white',
                            color: filterStatus === 'outstanding' ? 'white' : 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            transition: '0.2s',
                            boxShadow: filterStatus === 'outstanding' ? '0 10px 15px -3px rgba(245, 158, 11, 0.3)' : 'none'
                        }}>
                            Unpaid
                        </button>
                    </div>
                </div>
            </div>

            {/* Modern Table Layout */}
            <div className="dashboard-glass" style={{ borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden', background: 'white' }}>
                {filteredSales.length === 0 ? (
                    <div style={{ padding: '100px 20px', textAlign: 'center' }}>
                        <div style={{ background: 'var(--background)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <FileText size={32} color="#CBD5E1" />
                        </div>
                        <h4 style={{ fontWeight: 800, color: 'var(--text-muted)' }}>No records found.</h4>
                        <p style={{ color: '#94A3B8', fontWeight: 500 }}>Adjust your filters or start a new search.</p>
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'minmax(200px, 2.5fr) 1fr 100px 120px 60px', 
                            padding: '24px 32px', 
                            background: 'var(--background)', 
                            borderBottom: '1px solid var(--border)', 
                            fontSize: '0.8rem', 
                            fontWeight: 800, 
                            color: '#94A3B8', 
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em' 
                        }} className="hidden md:grid">
                            <span>Client / Description</span>
                            <span className="hidden lg:block">Invoice #</span>
                            <span>Status</span>
                            <span style={{ textAlign: 'right' }}>Amount</span>
                            <span></span>
                        </div>

                        {filteredSales.map(sale => (
                            <motion.div
                                key={sale._id}
                                whileHover={{ background: 'rgba(76, 29, 149, 0.02)' }}
                                style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'minmax(200px, 2.5fr) 1fr 100px 120px 60px', 
                                    padding: '24px 32px', 
                                    borderBottom: '1px solid var(--border)', 
                                    alignItems: 'center', 
                                    cursor: 'pointer' 
                                }}
                                className="sales-list-row md:grid hidden"
                                onClick={() => navigate(`/dashboard/invoice/${sale.invoiceNumber}`, { state: { from: location.pathname } })}
                            >
                                {/* Client Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                                    <div style={{ 
                                        background: sale.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                                        color: sale.status === 'paid' ? 'var(--success)' : 'var(--warning)', 
                                        padding: '12px', 
                                        borderRadius: '14px', 
                                        flexShrink: 0 
                                    }}>
                                        {sale.status === 'paid' ? <CheckCircle size={20} strokeWidth={2.5} /> : <Clock size={20} strokeWidth={2.5} />}
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <p style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {sale.customerName || 'Standard Sale'}
                                        </p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {sale.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Invoice ID */}
                                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem' }} className="hidden lg:block">
                                    #{sale.invoiceNumber}
                                </span>

                                {/* Status */}
                                <div>
                                    <span style={{
                                        padding: '6px 14px',
                                        borderRadius: '10px',
                                        fontSize: '0.7rem',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        background: sale.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        color: sale.status === 'paid' ? 'var(--success)' : 'var(--warning)'
                                    }}>
                                        {sale.status}
                                    </span>
                                </div>

                                {/* Amount */}
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)' }}>
                                        ₦{sale.totalAmount.toLocaleString()}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div style={{ textAlign: 'right' }}>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteModal({ show: true, sale });
                                        }}
                                        style={{ background: 'white', color: 'var(--error)', border: '1px solid #FEE2E2', padding: '10px', borderRadius: '12px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {/* Mobile List Layout */}
                        <div className="md:hidden flex flex-col">
                            {filteredSales.map(sale => (
                                <motion.div
                                    key={`mobile-${sale._id}`}
                                    onClick={() => navigate(`/dashboard/invoice/${sale.invoiceNumber}`, { state: { from: location.pathname } })}
                                    style={{ 
                                        padding: '20px 24px', 
                                        borderBottom: '1px solid var(--border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ 
                                            background: sale.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                                            color: sale.status === 'paid' ? 'var(--success)' : 'var(--warning)', 
                                            padding: '10px', 
                                            borderRadius: '12px' 
                                        }}>
                                            {sale.status === 'paid' ? <CheckCircle size={18} /> : <Clock size={18} />}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 800, color: 'var(--text)', fontSize: '1rem', margin: 0 }}>{sale.customerName || 'Standard Sale'}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>#{sale.invoiceNumber}</p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: 900, fontSize: '1.05rem', color: 'var(--text)', margin: 0 }}>₦{sale.totalAmount.toLocaleString()}</p>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: sale.status === 'paid' ? 'var(--success)' : 'var(--warning)', textTransform: 'uppercase' }}>{sale.status}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {deleteModal.show && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.15)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="dashboard-glass" 
                        style={{ padding: '40px', maxWidth: '440px', width: '90%', background: 'white', borderRadius: '32px', textAlign: 'center' }}
                    >
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '12px', letterSpacing: '-0.02em' }}>Remove record?</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6, fontWeight: 500 }}>
                            Deleting this will remove the transaction from your ledger permanently.
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button className="btn-secondary" style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: 800 }} onClick={() => setDeleteModal({ show: false, sale: null })}>Cancel</button>
                            <button className="btn-primary" style={{ flex: 1, background: 'var(--error)', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 800 }} onClick={confirmDelete}>Delete</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SalesList;
