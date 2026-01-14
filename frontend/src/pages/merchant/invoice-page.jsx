import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
    Share2,
    MessageCircle,
    Download,
    CheckCircle,
    Clock,
    ArrowLeft,
    ShieldCheck,
    Copy,
    ExternalLink,
    Loader2,
    Edit2,
    PlusCircle,
    X,
    FileText,
    ChevronRight,
    History,
    QrCode,
    Database,
    MoreHorizontal,
    Info,
    Wallet,
    Calendar,
    User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useSales } from "../../context/SaleContext";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

const InvoicePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { updateSale, addPayment } = useSales();

    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [reminding, setReminding] = useState(false);

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Forms
    const [editForm, setEditForm] = useState({});
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Transfer");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchSale();
    }, [id]);

    const fetchSale = async () => {
        try {
            const res = await axios.get(`${API_URL}/sales/${id}`);
            if (res.data.success) {
                setSale(res.data.data);
                setEditForm({
                    customerName: res.data.data.customerName,
                    customerPhone: res.data.data.customerPhone,
                    description: res.data.data.description,
                    totalAmount: res.data.data.totalAmount,
                    dueDate: res.data.data.dueDate ? new Date(res.data.data.dueDate).toISOString().split('T')[0] : ""
                });
            }
        } catch (err) {
            toast.error("Could not load document");
        } finally {
            setLoading(false);
        }
    };

    const isOwner = profile?._id === sale?.businessId?._id;
    const isInternal = window.location.pathname.startsWith('/dashboard');

    const handleConfirm = async () => {
        setConfirming(true);
        try {
            await axios.post(`${API_URL}/sales/${id}/confirm`);
            toast.success("Service confirmed! Proof updated.");
            fetchSale();
        } catch (err) {
            toast.error("Confirmation failed");
        } finally {
            setConfirming(false);
        }
    };

    const handleReminder = async () => {
        setReminding(true);
        try {
            await axios.post(`${API_URL}/sales/${id}/remind`, {}, { withCredentials: true });
            toast.success("Reminder logged and shared!");
            if (sale.customerPhone) {
                const text = `Hi ${sale.customerName || 'there'}, friendly reminder about your balance of ₦${(sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()} for ${sale.businessId.displayName}. View details here: ${window.location.origin}/i/${sale.invoiceNumber}`;
                window.open(`https://wa.me/${sale.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
            }
        } catch (err) {
            toast.error("Failed to send reminder");
        } finally {
            setReminding(false);
        }
    };

    const handleUpdateSale = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const updated = await updateSale(id, editForm);
            setSale(updated.data);
            setShowEditModal(false);
            toast.success("Invoice updated successfully");
        } catch (err) {
            toast.error("Failed to update invoice");
        } finally {
            setProcessing(false);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const updated = await addPayment(id, { amount: parseFloat(paymentAmount), method: paymentMethod });
            setSale(updated.data);
            setShowPaymentModal(false);
            setPaymentAmount("");
            toast.success("Payment recorded!");
        } catch (err) {
            toast.error("Failed to record payment");
        } finally {
            setProcessing(false);
        }
    };

    const copyLink = () => {
        const url = `${window.location.origin}/i/${sale.invoiceNumber}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
    };

    if (loading) return (
        <div style={{ textAlign: 'center', paddingTop: '100px', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner"></div>
        </div>
    );

    if (!sale) return <div style={{ textAlign: 'center', paddingTop: '100px' }}>Record not found.</div>;

    const paidAmount = sale.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = sale.totalAmount - paidAmount;

    return (
        <div className="animate-fade-in" style={{
            padding: isInternal ? '0' : '40px 20px',
            maxWidth: isInternal ? '100%' : '1200px',
            margin: '0 auto',
            minHeight: '100vh',
            background: isInternal ? 'transparent' : '#F8FAFC'
        }}>
            {/* Minimal Public Header if not internal */}
            {!isInternal && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                    <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '32px' }} />
                </div>
            )}

            {/* Breadcrumb & Top Actions Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
                        <Link to={isInternal ? "/sales" : "/"} style={{ color: 'inherit', textDecoration: 'none' }}>Invoices</Link>
                        <ChevronRight size={14} />
                        <span>{new Date(sale.createdAt).getFullYear()}-Q{Math.floor(new Date(sale.createdAt).getMonth() / 3) + 1}</span>
                        <ChevronRight size={14} />
                        <span style={{ color: '#1E293B' }}>{sale.invoiceNumber}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1E293B', margin: 0, letterSpacing: '-0.03em' }}>
                            Invoice {sale.invoiceNumber}
                        </h1>
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: '100px',
                            background: sale.confirmed ? '#DCFCE7' : '#EFF6FF',
                            color: sale.confirmed ? '#10B981' : '#3B82F6',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: `1px solid ${sale.confirmed ? '#10B98133' : '#3B82F633'}`
                        }}>
                            {sale.confirmed ? <ShieldCheck size={14} /> : <Clock size={14} />}
                            {sale.confirmed ? 'VERIFIED' : 'PENDING'}
                        </span>
                    </div>
                    <p style={{ color: '#64748B', fontWeight: 500, marginTop: '8px' }}>
                        Last updated on {new Date(sale.updatedAt).toLocaleDateString()} • Issued to <span style={{ color: '#1E293B', fontWeight: 700 }}>{sale.customerName}</span>
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={copyLink}
                        className="btn-primary"
                        style={{ padding: '12px 24px', borderRadius: '14px', background: 'var(--primary)' }}
                    >
                        <Share2 size={18} /> Share Link
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) 340px',
                gap: '32px',
                alignItems: 'start'
            }} className="invoice-grid-responsive">

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Stats Summary Bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div className="glass-card" style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Total Amount</p>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1E293B', margin: 0 }}>₦{sale.totalAmount.toLocaleString()}</h3>
                        </div>
                        <div className="glass-card" style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Amount Paid</p>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', margin: 0 }}>₦{paidAmount.toLocaleString()}</h3>
                        </div>
                        <div className="glass-card" style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Balance Due</p>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: balance > 0 ? '#F97316' : '#94A3B8', margin: 0 }}>₦{balance.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Transaction Details Card */}
                    <div className="glass-card" style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <FileText size={20} color="var(--primary)" />
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>Sale Description</h3>
                        </div>

                        <p style={{ fontSize: '1.05rem', color: '#1E293B', lineHeight: 1.6, background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #F1F5F9', margin: 0 }}>
                            {sale.description}
                        </p>

                        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Merchant</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F5F3FF', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                        {sale.businessId?.displayName?.[0] || 'B'}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, color: '#1E293B', margin: 0 }}>{sale.businessId.displayName}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Verified Merchant</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Date Recorded</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, color: '#1E293B', margin: 0 }}>{new Date(sale.createdAt).toLocaleDateString()}</p>
                                        <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bank Info for Customers */}
                    {balance > 0 && !isInternal && (
                        <div style={{ background: '#F5F3FF', borderRadius: '32px', padding: '32px', border: '1px solid #DDD6FE' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Wallet size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1E293B', margin: 0 }}>Payment Information</h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase', marginBottom: '4px' }}>Bank Name</p>
                                    <p style={{ fontWeight: 800, color: '#1E293B', fontSize: '1.1rem' }}>{sale.businessId.bankDetails?.bankName || 'Not Set'}</p>

                                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase', marginBottom: '4px', marginTop: '16px' }}>Account Number</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <p style={{ fontWeight: 800, color: '#1E293B', fontSize: '1.5rem', letterSpacing: '0.05em', margin: 0 }}>{sale.businessId.bankDetails?.accountNumber || '—'}</p>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(sale.businessId.bankDetails.accountNumber);
                                                toast.success("Copied!");
                                            }}
                                            style={{ background: 'white', border: '1px solid #DDD6FE', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
                                            <Copy size={16} color="#6D28D9" />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={confirming || sale.confirmed}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#10B981', fontSize: '1rem' }}
                                    >
                                        {sale.confirmed ? 'Confirmed Receipt' : confirming ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Payment'}
                                    </button>
                                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748B', marginTop: '12px' }}>
                                        Clicking confirm receipt verifies this transaction on our cryptographically secure ledger.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Right */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Merchant Actions Bar */}
                    {isOwner && (
                        <div className="glass-card" style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '24px' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px' }}>Merchant Portal</p>

                            {balance > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '16px', borderRadius: '16px' }}
                                    >
                                        <PlusCircle size={18} /> Record Payment
                                    </button>
                                    <button
                                        onClick={handleReminder}
                                        className="btn-secondary"
                                        style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #25D366', color: '#25D366' }}
                                    >
                                        <MessageCircle size={18} /> {reminding ? 'Sending...' : 'WhatsApp Reminder'}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ background: '#F0FDF4', padding: '16px', borderRadius: '16px', border: '1px solid #DCFCE7', textAlign: 'center' }}>
                                    <p style={{ margin: 0, color: '#166534', fontWeight: 800 }}>Invoice Fully Paid</p>
                                </div>
                            )}

                            <button
                                onClick={() => setShowEditModal(true)}
                                style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: '#64748B', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}
                            >
                                <Edit2 size={14} /> Correct Details
                            </button>
                        </div>
                    )}

                    {/* Transaction History Timeline */}
                    <div className="glass-card" style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '24px' }}>
                        <h4 style={{ fontWeight: 800, color: '#111827', marginBottom: '24px', fontSize: '1rem' }}>TRANSACTION LOG</h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div style={{ background: '#F5F3FF', color: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle size={16} />
                                    </div>
                                    <div style={{ width: '2px', flex: 1, background: '#F1F5F9', marginTop: '4px' }}></div>
                                </div>
                                <div style={{ paddingBottom: '4px' }}>
                                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', margin: '0 0 2px 0' }}>Record Created</p>
                                    <p style={{ fontSize: '0.75rem', color: '#64748B' }}>{new Date(sale.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {sale.payments.map((payment, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ background: '#ECFDF5', color: '#10B981', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Wallet size={16} />
                                        </div>
                                        <div style={{ width: '2px', flex: 1, background: '#F1F5F9', marginTop: '4px' }}></div>
                                    </div>
                                    <div style={{ paddingBottom: '4px' }}>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', margin: '0 0 2px 0' }}>Payment Received</p>
                                        <p style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700 }}>+ ₦{payment.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}

                            {sale.confirmed && (
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ background: '#F5F3FF', color: 'var(--primary)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ShieldCheck size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', margin: '0 0 2px 0' }}>Client Confirmed</p>
                                        <p style={{ fontSize: '0.75rem', color: '#64748B' }}>{new Date(sale.confirmedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showEditModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ background: 'white', padding: '32px', width: '90%', maxWidth: '450px', borderRadius: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h3 style={{ fontWeight: 900, fontSize: '1.4rem' }}>Edit Document</h3>
                                <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#9CA3AF" /></button>
                            </div>
                            <form onSubmit={handleUpdateSale} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label className="input-label">Customer Name</label>
                                    <input className="input-field" value={editForm.customerName} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} />
                                </div>
                                <div>
                                    <label className="input-label">Description</label>
                                    <textarea className="input-field" style={{ minHeight: '100px', resize: 'none' }} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                                </div>
                                <div>
                                    <label className="input-label">Total Amount (₦)</label>
                                    <input type="number" className="input-field" value={editForm.totalAmount} onChange={e => setEditForm({ ...editForm, totalAmount: e.target.value })} />
                                </div>
                                <button type="submit" disabled={processing} className="btn-primary" style={{ padding: '16px', borderRadius: '16px', marginTop: '12px' }}>
                                    {processing ? 'Updating...' : 'Save Changes'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showPaymentModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ background: 'white', padding: '32px', width: '90%', maxWidth: '380px', borderRadius: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h3 style={{ fontWeight: 900, fontSize: '1.4rem' }}>Record Payment</h3>
                                <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#9CA3AF" /></button>
                            </div>
                            <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label className="input-label">Amount Received (₦)</label>
                                    <input type="number" className="input-field" autoFocus value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} style={{ fontSize: '1.4rem', fontWeight: 900 }} required />
                                </div>
                                <div>
                                    <label className="input-label">Payment Method</label>
                                    <select
                                        className="input-field"
                                        value={paymentMethod}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                        style={{ fontWeight: 600 }}
                                    >
                                        <option value="Transfer">Bank Transfer</option>
                                        <option value="Cash">Cash</option>
                                        <option value="POS">POS Terminal</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <button type="submit" disabled={processing} className="btn-primary" style={{ padding: '16px', borderRadius: '16px', marginTop: '12px' }}>
                                    {processing ? 'Recording...' : 'Confirm Payment'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .invoice-grid-responsive {
                    grid-template-columns: minmax(0, 2fr) 340px;
                }
                @media (max-width: 1024px) {
                    .invoice-grid-responsive {
                        grid-template-columns: 1fr !important;
                    }
                    .invoice-grid-responsive > div:last-child {
                        order: -1;
                    }
                }
                @media (max-width: 640px) {
                    .invoice-grid-responsive {
                        gap: 16px !important;
                    }
                    h1 {
                        font-size: 1.5rem !important;
                    }
                    .glass-card {
                        padding: 20px !important;
                        border-radius: 20px !important;
                    }
                    .btn-primary, .btn-secondary {
                        padding: 14px !important;
                        font-size: 0.9rem !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default InvoicePage;
