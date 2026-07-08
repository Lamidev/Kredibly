import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSales } from "../../context/SaleContext";
import { 
    Search, User, Plus, X, Bot, Pin, Save, Trash2,
    MessageCircle, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { KREDDY_CONFIG } from "../../config";

// ─── Responsive hook ─────────────────────────────────────────────────────────
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 640px)").matches);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 640px)");
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return isMobile;
};


const fmt = (n) => `₦${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtShort = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const getInitials = (name) => {
    if (!name) return 'K';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getAvatarGradient = (name) => {
    return 'var(--primary)';
};

export default function Customers() {
    const isMobile = useIsMobile();
    const { sales, fetchSales, deleteSale } = useSales();
    const [searchTerm, setSearchTerm] = useState("");
    const [visibleCount, setVisibleCount] = useState(8);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [drawerTab, setDrawerTab] = useState("invoices");
    const [newNote, setNewNote] = useState("");

    // Reused Invoice Detail Drawer states from Workspace
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceTab, setInvoiceTab] = useState("activity");

    useEffect(() => {
        fetchSales();
    }, []);

    useEffect(() => {
        setVisibleCount(8);
    }, [searchTerm]);

    const [invoiceToDelete, setInvoiceToDelete] = useState(null);

    const confirmDeleteSale = async () => {
        if (!invoiceToDelete) return;
        try {
            await deleteSale(invoiceToDelete._id);
            setSelectedInvoice(null);
            
            if (selectedCustomer) {
                const updatedCustomerSales = sales.filter(s => s.customerName === selectedCustomer.name && s._id !== invoiceToDelete._id);
                if (updatedCustomerSales.length === 0) {
                    setSelectedCustomer(null);
                } else {
                    const paid = updatedCustomerSales.reduce((sum, s) => sum + (s.payments ? s.payments.reduce((pSum, p) => pSum + p.amount, 0) : 0), 0);
                    const total = updatedCustomerSales.reduce((sum, s) => sum + s.totalAmount, 0);
                    setSelectedCustomer(prev => ({
                        ...prev,
                        invoicesCount: updatedCustomerSales.length,
                        outstanding: total - paid,
                        totalPaid: paid,
                        invoices: updatedCustomerSales
                    }));
                }
            }
            setInvoiceToDelete(null);
            toast.success("Invoice deleted successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete invoice");
        }
    };

    // Notes are stored locally per session (in a real V3 build they'd be persisted via API)
    const [customerNotes, setCustomerNotes] = useState({});

    // Extract unique customers from real sales ledger
    const customerList = useMemo(() => {
        const list = {};
        sales.forEach(sale => {
            const name = sale.customerName;
            if (!name) return;
            const paid = sale.payments ? sale.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
            const balance = sale.totalAmount - paid;

            if (!list[name]) {
                list[name] = {
                    name,
                    phone: sale.customerPhone || null,
                    outstanding: 0,
                    totalPaid: 0,
                    invoicesCount: 0,
                    paidCount: 0,
                    lastActivity: new Date(sale.createdAt),
                    invoices: [],
                };
            }
            list[name].outstanding += Math.max(0, balance);
            list[name].totalPaid += paid;
            list[name].invoicesCount += 1;
            if (sale.status === 'paid' || sale.lifecycleStatus === 'PAID') {
                list[name].paidCount += 1;
            }
            list[name].invoices.push(sale);
            const saleDate = new Date(sale.updatedAt || sale.createdAt);
            if (saleDate > list[name].lastActivity) {
                list[name].lastActivity = saleDate;
            }
        });

        return Object.values(list).map(c => ({
            ...c,
            // Risk purely from outstanding balance — real data
            risk: c.outstanding > 500000 ? 'High' : c.outstanding > 100000 ? 'Medium' : c.outstanding === 0 ? 'Clear' : 'Low',
            riskColor: c.outstanding > 500000 ? '#EF4444' : c.outstanding > 100000 ? '#F59E0B' : c.outstanding === 0 ? '#10B981' : '#6366F1',
        }));
    }, [sales]);

    const filteredCustomers = customerList.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getNotes = (name) => customerNotes[name] || [];

    const handleAddNote = () => {
        if (!newNote.trim() || !selectedCustomer) return;
        const updated = [
            ...getNotes(selectedCustomer.name),
            { id: Date.now(), text: newNote.trim(), pinned: false }
        ];
        setCustomerNotes(prev => ({ ...prev, [selectedCustomer.name]: updated }));
        setNewNote("");
        toast.success("Note saved to Kreddy's memory!");
    };

    const handleDeleteNote = (id) => {
        const updated = getNotes(selectedCustomer.name).filter(n => n.id !== id);
        setCustomerNotes(prev => ({ ...prev, [selectedCustomer.name]: updated }));
        toast.success("Note removed.");
    };

    const handleTogglePin = (id) => {
        const updated = getNotes(selectedCustomer.name).map(n =>
            n.id === id ? { ...n, pinned: !n.pinned } : n
        );
        setCustomerNotes(prev => ({ ...prev, [selectedCustomer.name]: updated }));
    };

    return (
        <div style={{ paddingBottom: '60px' }} className="animate-fade-in">
            {/* Page Title */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--text)', marginBottom: '4px', letterSpacing: '-0.04em' }}>
                    Customers CRM
                </h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
                    Observe trust ratios, outstanding balances, and Kreddy's relationship memory logs.
                </p>
            </div>

            {/* Quick Search */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '10px 16px', maxWidth: '320px', marginBottom: '32px' }}>
                <Search size={18} color="#64748B" style={{ marginRight: '10px' }} />
                <input 
                    type="text" 
                    placeholder="Search customers..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontSize: '0.85rem', width: '100%', outline: 'none', color: '#1E293B' }}
                />
            </div>

            {/* Customers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredCustomers.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: '#94A3B8' }}>
                    <User size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
                        {searchTerm ? `No customer named "${searchTerm}"` : 'No customers yet'}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94A3B8' }}>
                        Customers appear here automatically when Kreddy records an invoice.
                    </p>
                </div>
            )}
            {filteredCustomers.slice(0, visibleCount).map(customer => (
                <div
                    key={customer.name}
                    onClick={() => { setSelectedCustomer(customer); setDrawerTab("invoices"); }}
                    style={{
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '24px',
                        padding: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(76, 29, 149, 0.04)';
                        e.currentTarget.style.borderColor = 'rgba(76, 29, 149, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.02)';
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Gradient Avatar */}
                        <div style={{
                            width: '46px', height: '46px', borderRadius: '50%',
                            background: getAvatarGradient(customer.name),
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.95rem', fontWeight: 900, flexShrink: 0,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
                        }}>
                            {getInitials(customer.name)}
                        </div>

                        <div style={{ minWidth: 0, flex: 1 }}>
                            <h3 style={{ margin: '0 0 3px 0', fontSize: '0.96rem', fontWeight: 900, color: '#0F172A', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {customer.name}
                            </h3>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>
                                {customer.invoicesCount} invoice{customer.invoicesCount !== 1 ? 's' : ''}
                                {customer.phone ? ` · ${customer.phone}` : ''}
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                            fontSize: '0.68rem', fontWeight: 900, padding: '3px 9px',
                            borderRadius: '20px',
                            background: customer.riskColor + '12',
                            color: customer.riskColor,
                            border: `1px solid ${customer.riskColor}24`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: customer.riskColor }} />
                            {customer.risk === 'Clear' ? '✓ Cleared' : customer.risk === 'High' ? 'High Risk' : customer.risk === 'Medium' ? 'Medium Risk' : 'Low Risk'}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 750 }}>
                            Rating: {customer.outstanding === 0 ? 'Excellent' : customer.risk === 'High' ? 'Alert' : 'Good'}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px', marginTop: '4px' }}>
                        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                            <p style={{ margin: 0, fontSize: '0.62rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>Outstanding</p>
                            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', fontWeight: 900, color: customer.outstanding > 0 ? '#EF4444' : '#10B981' }}>
                                {customer.outstanding > 0 ? fmt(customer.outstanding) : 'All clear'}
                            </p>
                        </div>
                        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                            <p style={{ margin: 0, fontSize: '0.62rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>Total Paid</p>
                            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', fontWeight: 900, color: '#10B981' }}>
                                {fmt(customer.totalPaid)}
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>
                        <span>Last active</span>
                        <span style={{ color: '#64748B', fontWeight: 700 }}>
                            {customer.lastActivity.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                    </div>
                </div>
            ))}
            </div>

            {filteredCustomers.length > visibleCount && (
                <button
                    onClick={() => setVisibleCount(prev => prev + 8)}
                    style={{
                        background: "white",
                        border: "1px solid #E2E8F0",
                        color: "var(--primary)",
                        borderRadius: "14px",
                        padding: "12px 24px",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        margin: "32px auto 0",
                        display: "block",
                        transition: "all 0.2s"
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "var(--primary)";
                        e.currentTarget.style.background = "#F9F5FF";
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "#E2E8F0";
                        e.currentTarget.style.background = "white";
                    }}
                >
                    Load More Customers
                </button>
            )}

            {/* Customer Details Drawer */}
            {createPortal(
                <AnimatePresence>
                    {selectedCustomer && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCustomer(null)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: selectedInvoice ? 'transparent' : 'rgba(15,23,42,0.4)',
                                backdropFilter: selectedInvoice ? 'none' : 'blur(8px)',
                                zIndex: 10000,
                                display: 'flex',
                                justifyContent: isMobile ? 'center' : 'flex-end',
                                alignItems: isMobile ? 'flex-end' : 'stretch',
                                transition: 'background 0.3s ease, backdrop-filter 0.3s ease'
                            }}
                        >
                            <motion.div
                                key="crm-drawer"
                                initial={isMobile ? { y: '100%' } : { x: '100%' }}
                                animate={isMobile ? { y: 0 } : { x: 0 }}
                                exit={isMobile ? { y: '100%' } : { x: '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                                onClick={e => e.stopPropagation()}
                                className="details-drawer"
                                style={{
                                    height: isMobile ? '92dvh' : '100%',
                                    overflowY: 'hidden',
                                    borderRadius: isMobile ? '20px 20px 0 0' : 0,
                                    borderLeft: isMobile ? 'none' : '1px solid #E2E8F0',
                                    borderTop: isMobile ? '1px solid #E2E8F0' : 'none',
                                }}
                            >
                                {/* Drawer Header */}
                                <div className="details-drawer-header" style={{ flexShrink: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 2px', fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>
                                                {selectedCustomer.name}
                                            </h4>
                                            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                                                {selectedCustomer.invoicesCount} invoice{selectedCustomer.invoicesCount !== 1 ? 's' : ''}
                                                {selectedCustomer.phone ? ` · ${selectedCustomer.phone}` : ''}
                                            </span>
                                        </div>
                                        <button onClick={() => setSelectedCustomer(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', flexShrink: 0 }}>
                                            <X size={15} />
                                        </button>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="drawer-summary-grid">
                                        {[
                                            { label: 'Outstanding', value: selectedCustomer.outstanding > 0 ? fmt(selectedCustomer.outstanding) : 'All clear', color: selectedCustomer.outstanding > 0 ? '#EF4444' : '#10B981' },
                                            { label: 'Total Paid', value: fmt(selectedCustomer.totalPaid), color: '#10B981' },
                                            { label: 'Invoices', value: selectedCustomer.invoicesCount, color: '#0F172A' },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '10px 12px', border: '1px solid #E2E8F0' }}>
                                                <p style={{ margin: 0, fontSize: '0.62rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase' }}>{label}</p>
                                                <p style={{ margin: '3px 0 0', fontSize: '0.88rem', fontWeight: 900, color }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div style={{ display: 'flex', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
                                    {['invoices', 'notes'].map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setDrawerTab(tab)}
                                            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', fontWeight: 700, fontSize: '0.82rem', color: drawerTab === tab ? 'var(--primary)' : '#64748B', borderBottom: drawerTab === tab ? '2px solid var(--primary)' : '2px solid transparent', cursor: 'pointer', textTransform: 'capitalize' }}
                                        >
                                            {tab === 'invoices' ? 'Invoice History' : "Kreddy's Memory"}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="details-drawer-body" style={{ overflowY: 'auto' }}>
                                    {drawerTab === 'invoices' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {selectedCustomer.invoices
                                                .slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                                .map(inv => {
                                                    const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0);
                                                    const bal = inv.totalAmount - paid;
                                                    const nonZeroPayments = (inv.payments || []).filter(p => p.amount > 0);
                                                    return (
                                                        <div
                                                            key={inv._id}
                                                            onClick={() => { setSelectedInvoice(inv); setInvoiceTab("activity"); }}
                                                            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '14px 16px', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
                                                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
                                                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: nonZeroPayments.length ? '10px' : 0 }}>
                                                                <div>
                                                                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#1E293B' }}>{inv.invoiceNumber}</p>
                                                                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#94A3B8' }}>{fmtDate(inv.createdAt)}</p>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 900, color: bal > 0 ? '#EF4444' : '#10B981' }}>
                                                                        {bal > 0 ? `${fmt(bal)} owed` : '\u2713 Paid'}
                                                                    </p>
                                                                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#94A3B8' }}>of {fmt(inv.totalAmount)}</p>
                                                                </div>
                                                            </div>
                                                            {/* Inline payment entries */}
                                                            {nonZeroPayments.map((p, i) => (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: '#F0FDF4', border: '1px solid #BBFCD0', borderRadius: '9px', padding: '7px 10px', marginTop: '6px' }}>
                                                                    <span style={{ fontSize: '0.7rem', color: '#065F46', fontWeight: 700 }}>{p.method || p.channel || 'Cash'} · {fmtShort(p.date || inv.createdAt)}</span>
                                                                    <strong style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 900 }}>+{fmt(p.amount)}</strong>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        /* Kreddy Memory Notes */
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <p style={{ margin: '0 0 8px', fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5, fontWeight: 600 }}>
                                                Personal notes about this customer. These are only visible to you.
                                            </p>
                                            {getNotes(selectedCustomer.name).length === 0 && (
                                                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94A3B8', fontStyle: 'italic' }}>No notes yet.</p>
                                            )}
                                            {getNotes(selectedCustomer.name).map(note => (
                                                <div key={note.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                                    <span style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 600 }}>{note.text}</span>
                                                    <button onClick={() => handleDeleteNote(note.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Add a note..."
                                                    value={newNote}
                                                    onChange={e => setNewNote(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                                                    style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '11px', padding: '9px 12px', fontSize: '0.8rem', outline: 'none' }}
                                                />
                                                <button onClick={handleAddNote} style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '11px', padding: '9px 14px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer' }}>Save</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="details-drawer-footer" style={{ flexShrink: 0 }}>
                                    <button
                                        onClick={() => window.open(KREDDY_CONFIG.getLink(`Tell me about ${selectedCustomer.name} — their payment history and outstanding balance`), '_blank', 'noopener,noreferrer')}
                                        style={{
                                            width: '100%',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '14px',
                                            padding: '13px',
                                            fontWeight: 800,
                                            fontSize: '0.88rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'background 0.2s ease'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#3B1670'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
                                    >
                                        <MessageCircle size={17} /> Ask Kreddy about {selectedCustomer.name.split(' ')[0]}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Reused Invoice Details Drawer from Workspace */}
            {createPortal(
                <AnimatePresence>
                    {selectedInvoice && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedInvoice(null)}
                            style={{
                                position: "fixed", inset: 0,
                                background: "rgba(15,23,42,0.4)",
                                backdropFilter: "blur(8px)",
                                zIndex: 10001,
                                display: "flex",
                                justifyContent: isMobile ? "center" : "flex-end",
                                alignItems: isMobile ? "flex-end" : "stretch",
                            }}
                        >
                            <motion.div
                                key="invoice-drawer"
                                initial={isMobile ? { y: "100%" } : { x: "100%" }}
                                animate={isMobile ? { y: 0 } : { x: 0 }}
                                exit={isMobile ? { y: "100%" } : { x: "100%" }}
                                transition={{ type: "spring", damping: 28, stiffness: 240 }}
                                onClick={(e) => e.stopPropagation()}
                                className="details-drawer animate-slide-in"
                                style={{
                                    height: isMobile ? "92dvh" : "100%",
                                    overflowY: "auto",
                                    borderRadius: isMobile ? "20px 20px 0 0" : 0,
                                    borderLeft: isMobile ? "none" : "1px solid #E2E8F0",
                                    borderTop: isMobile ? "1px solid #E2E8F0" : "none",
                                }}
                            >
                                {/* Drawer Header */}
                                <div className="details-drawer-header">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <h4 style={{ margin: "0 0 2px", fontSize: "1.1rem", fontWeight: 900, color: "#0F172A" }}>
                                                {selectedInvoice.customerName || selectedCustomer.name}
                                            </h4>
                                            <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
                                                {selectedInvoice.invoiceNumber} · {fmtDate(selectedInvoice.createdAt)}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button onClick={() => setInvoiceToDelete(selectedInvoice)} style={{ background: "#FEF2F2", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#EF4444", flexShrink: 0 }} title="Delete Invoice">
                                                <Trash2 size={15} />
                                            </button>
                                            <button onClick={() => setSelectedInvoice(null)} style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#64748B", flexShrink: 0 }}>
                                                <X size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Amount summary */}
                                    <div className="drawer-summary-grid">
                                        {[
                                            { label: "Total", value: fmt(selectedInvoice.totalAmount), color: "#0F172A" },
                                            { label: "Paid", value: fmt((selectedInvoice.payments || []).reduce((s, p) => s + p.amount, 0)), color: "#10B981" },
                                            { label: "Balance", value: fmt(selectedInvoice.totalAmount - (selectedInvoice.payments || []).reduce((s, p) => s + p.amount, 0)), color: "#EF4444" },
                                        ].map(({ label, value, color }) => (
                                            <div key={label} style={{ background: "#F8FAFC", borderRadius: "12px", padding: "10px 12px", border: "1px solid #E2E8F0" }}>
                                                <p style={{ margin: 0, fontSize: "0.65rem", color: "#94A3B8", fontWeight: 800, textTransform: "uppercase" }}>{label}</p>
                                                <p style={{ margin: "3px 0 0", fontSize: "0.9rem", fontWeight: 900, color }}>{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div style={{ display: "flex", gap: "0", borderBottom: "1px solid #F1F5F9" }}>
                                    {["activity", "payments"].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setInvoiceTab(tab)}
                                            style={{ flex: 1, padding: "12px 16px", background: "none", border: "none", fontWeight: 700, fontSize: "0.82rem", color: invoiceTab === tab ? "var(--primary)" : "#64748B", borderBottom: invoiceTab === tab ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer", textTransform: "capitalize" }}
                                        >
                                            {tab === "activity" ? "Timeline" : "Payments"}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="details-drawer-body">
                                    {invoiceTab === "activity" ? (
                                        <div style={{ position: "relative", paddingLeft: "16px", borderLeft: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "18px" }}>
                                            {/* Created event always shows */}
                                            <DrawerEvent dot="#94A3B8" title="Invoice Created" sub={fmtDate(selectedInvoice.createdAt)} />

                                            {selectedInvoice.customerDeliveredAt && (
                                                <DrawerEvent dot="#6366F1" title="Sent to Customer" sub={fmtDate(selectedInvoice.customerDeliveredAt)} />
                                            )}
                                            {selectedInvoice.viewedAt && (
                                                <DrawerEvent dot="#3B82F6" title="Customer Viewed Invoice" sub={fmtDate(selectedInvoice.viewedAt)} />
                                            )}
                                            {selectedInvoice.extensionRequestedAt && (
                                                <DrawerEvent dot="#F59E0B" title={`Extension Requested${selectedInvoice.requestedExtensionDays ? ` (+${selectedInvoice.requestedExtensionDays} days)` : ""}`} sub={fmtDate(selectedInvoice.extensionRequestedAt)} />
                                            )}
                                            {selectedInvoice.extensionApprovedAt && (
                                                <DrawerEvent dot="#10B981" title="Extension Approved" sub={fmtDate(selectedInvoice.extensionApprovedAt)} />
                                            )}
                                            {(selectedInvoice.payments || []).map((p, i) => (
                                                <DrawerEvent key={i} dot="#10B981" title={`Payment: ${fmt(p.amount)}`} sub={`${fmtDate(p.date || selectedInvoice.createdAt)} · ${p.method || p.channel || "Cash"}`} />
                                            ))}
                                            {(selectedInvoice.status === "paid" || selectedInvoice.lifecycleStatus === "PAID") && (
                                                <DrawerEvent dot="#10B981" title="✓ Fully Settled" sub="" />
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            {(selectedInvoice.payments || []).length === 0 ? (
                                                <p style={{ textAlign: "center", color: "#94A3B8", fontSize: "0.83rem", padding: "32px 0", fontWeight: 600 }}>
                                                    No payments recorded yet.
                                                </p>
                                            ) : (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                    {selectedInvoice.payments.map((p, i) => (
                                                        <div key={i} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <div>
                                                                <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 800, color: "#1E293B" }}>{p.method || "Cash"}</p>
                                                                <p style={{ margin: "2px 0 0", fontSize: "0.7rem", color: "#94A3B8" }}>{fmtDate(p.date || selectedInvoice.createdAt)}</p>
                                                            </div>
                                                            <strong style={{ color: "#10B981", fontWeight: 900 }}>{fmt(p.amount)}</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* CTA */}
                                {selectedInvoice.status !== "paid" && selectedInvoice.lifecycleStatus !== "PAID" && (
                                    <div className="details-drawer-footer">
                                        <button
                                            onClick={() => {
                                                const msg = `Send reminder to ${selectedInvoice.customerName || selectedCustomer.name} for invoice ${selectedInvoice.invoiceNumber}`;
                                                window.open(KREDDY_CONFIG.getLink(msg), "_blank", "noopener,noreferrer");
                                            }}
                                            style={{
                                                width: "100%",
                                                background: "var(--primary)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "14px",
                                                padding: "13px",
                                                fontWeight: 800,
                                                fontSize: "0.88rem",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "8px",
                                                transition: "background 0.2s ease"
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = "#3B1670"}
                                            onMouseLeave={e => e.currentTarget.style.background = "var(--primary)"}
                                        >
                                            <MessageCircle size={17} /> Send Reminder via Kreddy
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {invoiceToDelete && createPortal(
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setInvoiceToDelete(null)}
                        style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.4)", backdropFilter: "blur(8px)", zIndex: 20000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ background: "white", borderRadius: "24px", padding: "28px", maxWidth: "380px", width: "100%", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)", border: "1px solid #E2E8F0" }}
                        >
                            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#FEF2F2", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                                <Trash2 size={24} />
                            </div>
                            <h4 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: 900, color: "#0F172A" }}>Delete Invoice?</h4>
                            <p style={{ margin: "0 0 24px", fontSize: "0.83rem", color: "#64748B", lineHeight: 1.5, fontWeight: 650 }}>
                                This will permanently delete invoice <strong style={{ color: "#0F172A" }}>{invoiceToDelete.invoiceNumber}</strong> for {invoiceToDelete.customerName || selectedCustomer?.name} and remove all associated payments.
                            </p>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button
                                    onClick={() => setInvoiceToDelete(null)}
                                    style={{ flex: 1, background: "#F1F5F9", color: "#475569", border: "none", borderRadius: "14px", padding: "12px", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDeleteSale}
                                    style={{ flex: 1, background: "#EF4444", color: "white", border: "none", borderRadius: "14px", padding: "12px", fontWeight: 800, fontSize: "0.85rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)" }}
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}

            <style>{`
                /* Responsive Details Drawer */
                .details-drawer {
                    width: 100%;
                    max-width: 440px;
                    height: 100%;
                    background: white;
                    border-left: 1px solid #E2E8F0;
                    display: flex;
                    flex-direction: column;
                }
                .details-drawer-header {
                    padding: 24px 24px 16px;
                    border-bottom: 1px solid #F1F5F9;
                }
                .details-drawer-body {
                    padding: 20px 24px;
                    flex: 1;
                    overflow: auto;
                }
                .details-drawer-footer {
                    padding: 16px 24px;
                    border-top: 1px solid #F1F5F9;
                }
                .drawer-summary-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 10px;
                    margin-top: 16px;
                }

                @media (max-width: 480px) {
                    .details-drawer {
                        max-width: 100% !important;
                    }
                    .details-drawer-header {
                        padding: 20px 16px 14px !important;
                    }
                    .details-drawer-body {
                        padding: 16px 16px !important;
                    }
                    .details-drawer-footer {
                        padding: 14px 16px !important;
                    }
                    .drawer-summary-grid {
                        grid-template-columns: 1fr !important;
                        gap: 8px !important;
                    }
                }
            `}</style>
        </div>
    );
}

function DrawerEvent({ dot, title, sub }) {
    return (
        <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: "-21px", top: "5px", width: "9px", height: "9px", borderRadius: "50%", background: dot, border: "2px solid white", boxShadow: "0 0 0 1px #E2E8F0" }} />
            <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 700, color: "#1E293B", lineHeight: 1.4 }}>{title}</p>
            {sub && <span style={{ fontSize: "0.7rem", color: "#94A3B8", fontWeight: 600 }}>{sub}</span>}
        </div>
    );
}
