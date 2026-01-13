import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Share2, MessageCircle, Mail, Download, CheckCircle, Clock, ArrowLeft, ShieldCheck, Copy, ExternalLink, Loader2, Home, Edit2, PlusCircle, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSales } from "../context/SaleContext";

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
                    totalAmount: res.data.data.totalAmount
                });
            }
        } catch (err) {
            toast.error("Could not load document");
        } finally {
            setLoading(false);
        }
    };

    const isOwner = profile?._id === sale?.businessId?._id;

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
                const text = `Hi ${sale.customerName || 'there'}, friendly reminder about your balance of ₦${(sale.totalAmount - sale.payments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()} for ${sale.businessId.displayName}. View details here: ${window.location.href}`;
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
            const updated = await addPayment(id, { amount: parseFloat(paymentAmount), method: "Cash" });
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

    const shareOnWhatsApp = () => {
        const text = `Hi ${sale.customerName || 'there'}, here is your document from ${sale.businessId.displayName}:\n${window.location.href}`;
        window.open(`https://wa.me/${sale.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
    };

    if (loading) return (
        <div className="container" style={{ textAlign: 'center', paddingTop: '100px', display: 'flex', justifyContent: 'center' }}>
            <div className="spinner"></div>
        </div>
    );

    if (!sale) return <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>Record not found.</div>;

    const paidAmount = sale.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = sale.totalAmount - paidAmount;

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '100px', paddingTop: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header / Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: '0.2s' }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    {isOwner && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            style={{ background: 'var(--primary)', border: 'none', color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', transition: '0.2s' }}
                        >
                            <Home size={20} />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {isOwner && (
                        <button
                            onClick={() => setShowEditModal(true)}
                            style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '10px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                    <button
                        onClick={copyLink}
                        style={{ background: 'white', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', padding: '10px 16px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Copy size={16} /> Link
                    </button>
                </div>
            </div>

            <div className="desktop-grid" style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Main Document Card - Left Column */}
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px', background: 'white', border: '1px solid #E5E7EB', boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)' }}>
                    {/* Brand Header */}
                    <div style={{ background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)', padding: '32px 24px', textAlign: 'center', borderBottom: '1px solid #E2E8F0' }}>
                        {sale.businessId.logoUrl ? (
                            <img src={sale.businessId.logoUrl} alt="Logo" style={{ width: '80px', height: '80px', borderRadius: '20px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', objectFit: 'cover', background: 'white' }} />
                        ) : (
                            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'white', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                {sale.businessId.displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em', marginBottom: '4px' }}>{sale.businessId.displayName}</h2>
                        <p style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 500 }}>SALE #{sale._id.slice(-6).toUpperCase()}</p>
                    </div>

                    {/* Content Section */}
                    <div style={{ padding: '32px 24px' }}>

                        {/* Status Pill */}
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '100px',
                                background: sale.status === 'paid' ? '#DCFCE7' : '#FFEDD5',
                                color: sale.status === 'paid' ? '#166534' : '#9A3412',
                                fontSize: '0.9rem',
                                fontWeight: 700
                            }}>
                                {sale.status === 'paid' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                {sale.status.toUpperCase()}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid #F1F5F9' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase' }}>To Customer</p>
                                <p style={{ fontWeight: 600, fontSize: '1.1rem', color: '#334155' }}>{sale.customerName || 'Walk-in Customer'}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '6px', textTransform: 'uppercase' }}>Issued Date</p>
                                <p style={{ fontWeight: 600, fontSize: '1.1rem', color: '#334155' }}>{new Date(sale.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '12px', textTransform: 'uppercase' }}>Description of Service/Item</p>
                            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', fontSize: '1rem', lineHeight: '1.6', color: '#475569', border: '1px solid #F1F5F9' }}>
                                {sale.description}
                            </div>
                        </div>

                        {/* Financials */}
                        <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '24px', border: '1px solid #F1F5F9', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ color: '#64748B' }}>Total Value</span>
                                <span style={{ fontWeight: 600, color: '#334155' }}>₦{sale.totalAmount.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ color: '#64748B' }}>Amount Paid</span>
                                <span style={{ fontWeight: 600, color: '#10B981' }}>₦{paidAmount.toLocaleString()}</span>
                            </div>
                            <div style={{ height: '1px', background: '#E2E8F0', marginBottom: '16px' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: '#334155' }}>Balance Due</span>
                                <span style={{ fontWeight: 800, fontSize: '1.4rem', color: balance > 0 ? '#EA580C' : '#10B981' }}>
                                    ₦{balance.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Payment History */}
                        {sale.payments && sale.payments.length > 0 && (
                            <div style={{ marginBottom: '32px' }}>
                                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', marginBottom: '12px', textTransform: 'uppercase' }}>Payment History</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {sale.payments.map((payment, index) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#FAFAFA', borderRadius: '12px', border: '1px solid #F1F5F9' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ background: '#DCFCE7', color: '#166534', padding: '6px', borderRadius: '8px' }}>
                                                    <CheckCircle size={14} />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{payment.method || 'Payment'}</p>
                                                    <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{new Date(payment.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <p style={{ fontWeight: 700, color: '#10B981' }}>+₦{payment.amount.toLocaleString()}</p>
                                        </div>
                                    )).reverse()}
                                </div>
                            </div>
                        )}

                        {/* Customer Confirmation Action */}
                        <div style={{ marginTop: '32px' }}>
                            {!sale.confirmed ? (
                                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '20px', padding: '24px', textAlign: 'center', background: '#FAFAFA' }}>
                                    <p style={{ fontSize: '0.95rem', color: '#475569', marginBottom: '16px', fontWeight: 500 }}>Confirm you have received this order</p>
                                    <button
                                        onClick={handleConfirm}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1rem', borderRadius: '14px' }}
                                        disabled={confirming}
                                    >
                                        {confirming ? <Loader2 className="animate-spin" /> : <>Confirm Receipt <CheckCircle size={18} /></>}
                                    </button>
                                </div>
                            ) : (
                                <div style={{ background: '#F0FDF4', borderRadius: '20px', padding: '24px', textAlign: 'center', color: '#166534', border: '1px solid #DCFCE7' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px', fontWeight: 800, fontSize: '1.1rem' }}>
                                        <ShieldCheck size={28} /> CONFIRMED
                                    </div>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>Digital Proof Verified on {new Date(sale.confirmedAt).toLocaleDateString()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Actions - Right Column */}
                <div className="desktop-only-sticky">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="glass-card" style={{ padding: '24px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '24px' }}>
                            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '16px', color: '#1E293B' }}>Actions</h3>

                            <button
                                onClick={shareOnWhatsApp}
                                className="btn-primary"
                                style={{ width: '100%', background: '#25D366', color: 'white', borderRadius: '16px', padding: '16px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}
                            >
                                <MessageCircle size={20} /> Share to WhatsApp
                            </button>

                            {isOwner && balance > 0 && (
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="btn-primary"
                                    style={{ width: '100%', background: '#111827', color: 'white', borderRadius: '16px', padding: '16px', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}
                                >
                                    <PlusCircle size={20} /> Record Payment
                                </button>
                            )}

                            {isOwner && balance > 0 && (
                                <button
                                    onClick={handleReminder}
                                    style={{
                                        width: '100%',
                                        background: 'white',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '16px',
                                        padding: '16px',
                                        cursor: 'pointer',
                                        color: '#475569',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                                    }}
                                    disabled={reminding}
                                >
                                    <Clock size={20} /> {reminding ? 'Sending...' : 'Send Reminder'}
                                </button>
                            )}
                        </div>

                        <div className="glass-card" style={{ padding: '24px', background: 'var(--primary-glow)', border: '1px solid var(--primary)', borderRadius: '24px', color: 'var(--primary)' }}>
                            <h4 style={{ fontWeight: 800, marginBottom: '8px', fontSize: '0.9rem' }}>SECURITY PROOF</h4>
                            <p style={{ fontSize: '0.85rem', lineHeight: 1.5, fontWeight: 500 }}>
                                This document is a legally binding record of the transaction between {sale.businessId.displayName} and {sale.customerName || 'the customer'}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: '48px', fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600 }}>
                Powered by Kredibly
            </p>

            {/* Modal Components */}
            {showEditModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card animate-fade-in" style={{ background: 'white', padding: '24px', width: '90%', maxWidth: '400px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Edit Invoice</h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#9CA3AF" /></button>
                        </div>
                        <form onSubmit={handleUpdateSale} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#4B5563', marginBottom: '6px' }}>Customer Name</label>
                                <input className="input-field" value={editForm.customerName} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#4B5563', marginBottom: '6px' }}>Description</label>
                                <textarea className="input-field" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', width: '100%', minHeight: '80px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#4B5563', marginBottom: '6px' }}>Total Amount</label>
                                <input type="number" className="input-field" value={editForm.totalAmount} onChange={e => setEditForm({ ...editForm, totalAmount: e.target.value })} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', width: '100%' }} />
                            </div>
                            <button type="submit" disabled={processing} className="btn-primary" style={{ padding: '14px', borderRadius: '12px', marginTop: '8px' }}>
                                {processing ? 'Updating...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showPaymentModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-card animate-fade-in" style={{ background: 'white', padding: '24px', width: '90%', maxWidth: '360px', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Record Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} color="#9CA3AF" /></button>
                        </div>
                        <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: '#4B5563', marginBottom: '6px' }}>Amount Received (₦)</label>
                                <input type="number" className="input-field" autoFocus value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E5E7EB', width: '100%', fontSize: '1.2rem', fontWeight: 'bold' }} required />
                            </div>
                            <button type="submit" disabled={processing} className="btn-primary" style={{ padding: '14px', borderRadius: '12px', marginTop: '8px' }}>
                                {processing ? 'Recording...' : 'Confirm Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoicePage;
