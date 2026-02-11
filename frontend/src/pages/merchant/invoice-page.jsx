import { useState, useEffect } from "react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import {
    Share2,
    Image as ImageIcon,
    MessageCircle,
    Download,
    CheckCircle,
    Clock,
    ArrowLeft,
    ShieldCheck,
    Copy,
    Edit2,
    PlusCircle,
    X,
    FileText,
    ChevronRight,
    Wallet,
    Calendar,
    Trash2,
    Zap,
    Lock,
    QrCode,
    User,
    AlertCircle,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { useAuth } from "../../context/AuthContext";
import { useSales } from "../../context/SaleContext";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

const InvoicePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { profile } = useAuth();
    const { updateSale, addPayment, deleteSale } = useSales();

    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [reminding, setReminding] = useState(false);

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [generating, setGenerating] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ show: false, sale: null });

    // Forms
    const [editForm, setEditForm] = useState({});
    const [paymentAmount, setPaymentAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Transfer");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchSale();
        if (location.state?.showSuccessModal) {
            setShowSuccessModal(true);
            setShowCelebration(true);
            // Clear state so refresh doesn't show it again
            window.history.replaceState({}, document.title);
        }
    }, [id]);

    const fetchSale = async () => {
        setSale(null);
        setLoading(true);
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
            toast.success("Payment Confirmed Successfully!");
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

            const frontendUrl = window.location.origin;
            const shareUrl = `${frontendUrl}/i/${sale.invoiceNumber}`;
            const paid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
            const balance = sale.totalAmount - paid;
            
            let text = "";
            if (balance <= 0) {
                text = `Hi ${sale.customerName || 'Customer'},\n\nThank you for your payment! Your invoice (#${sale.invoiceNumber}) from *${sale.businessId.displayName}* is now fully settled.\n\nYou can view and download your official receipt here: ${shareUrl}\n\nWe appreciate your business!`;
            } else {
                const tone = sale.businessId.assistantSettings?.reminderTemplate || 'friendly';
                if (tone === 'formal') {
                    text = `Dear ${sale.customerName || 'Customer'},\n\nThis is a formal update regarding your invoice (#${sale.invoiceNumber}) from *${sale.businessId.displayName}*.\n\nTotal Paid: ₦${paid.toLocaleString()}\nOutstanding Balance: *₦${balance.toLocaleString()}*\n\nPlease view the updated invoice and settle the balance here: ${shareUrl}\n\nThank you.`;
                } else {
                    text = `Hi ${sale.customerName || 'Friend'},\n\nFriendly update from *${sale.businessId.displayName}* regarding your invoice (#${sale.invoiceNumber}).\n\nYou've paid ₦${paid.toLocaleString()}, leaving a balance of *₦${balance.toLocaleString()}*.\n\nCheck the details and pay here: ${shareUrl}\n\nThanks!`;
                }
            }

            if (sale.customerPhone) {
                window.open(`https://wa.me/${sale.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
                toast.success("Opening WhatsApp...");
            } else {
                navigator.clipboard.writeText(text);
                toast.success("Message Copied! Paste it anywhere to send.");
            }
        } catch (err) {
            toast.error("Failed to initiate reminder");
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
            toast.success("Invoice Updated Successfully");
        } catch (err) {
            toast.error("Validation Error");
        } finally {
            setProcessing(false);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        const amount = parseFloat(paymentAmount);
        
        if (isNaN(amount) || amount < 100) {
            return toast.error("Minimum payment amount is ₦100");
        }

        if (amount > balance) {
            return toast.error(`Payment exceeds balance. Remaining: ₦${balance.toLocaleString()}`);
        }

        setProcessing(true);
        try {
            const updated = await addPayment(id, { amount, method: paymentMethod });
            setSale(updated.data);
            setShowPaymentModal(false);
            setPaymentAmount("");
            toast.success("Payment Recorded Successfully");
            setShowCelebration(false);
            setShowSuccessModal(true);
        } catch (err) {
            toast.error("Failed to record payment");
        } finally {
            setProcessing(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await deleteSale(sale._id);
            toast.success("Invoice Deleted");
            setDeleteModal({ show: false, sale: null });
            navigate("/sales");
        } catch (err) {
            toast.error("Destruction Failed");
        }
    };

    const handleShare = async () => {
        const frontendUrl = window.location.origin;
        const shareUrl = `${frontendUrl}/i/${sale.invoiceNumber}`;
        const paid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = sale.totalAmount - paid;
        const tone = sale.businessId.assistantSettings?.reminderTemplate || 'friendly';
        
        let text = "";
        if (tone === 'formal') {
            text = `Dear ${sale.customerName || 'Customer'},\n\nThis is a formal payment notice from *${sale.businessId.displayName}*.\n\nReference: Invoice #${sale.invoiceNumber}\nOutstanding Balance: *₦${balance.toLocaleString()}*\n\nPlease arrange for settlement using this secure link: ${shareUrl}\n\nThank you.`;
        } else {
            text = `Hi ${sale.customerName || 'Friend'},\n\nThis is a friendly reminder from *${sale.businessId.displayName}* regarding your invoice (#${sale.invoiceNumber}).\n\nThere is an outstanding balance of *₦${balance.toLocaleString()}*.\n\nYou can view the full details and pay here: ${shareUrl}\n\nThank you for your business!`;
        }

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice from ${sale.businessId.displayName}`,
                    text: text,
                    url: shareUrl,
                });
                // Optional: Track share as a reminder?
            } catch (err) {
                // Share cancelled
            }
        } else {
            navigator.clipboard.writeText(text);
            toast.success("Invoice Message Copied!");
        }
    };

    const handleDownloadPDF = async () => {
        if (generating) return;
        const receiptElement = document.getElementById('receipt-download-target');
        if (!receiptElement) return;

        setGenerating('pdf');
        const toastId = toast.loading("Preparing official PDF...");
        
        try {
            const html2canvas = (await import('html2canvas')).default;
            
            // Create a dedicated container for capture
            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '600px';
            document.body.appendChild(container);

            // Clone into the container
            const clone = receiptElement.cloneNode(true);
            clone.style.position = 'relative';
            clone.style.display = 'block';
            clone.style.width = '600px'; 
            clone.style.height = 'auto'; // expanded height
            clone.style.background = 'white';
            clone.style.overflow = 'visible';
            container.appendChild(clone);

            // Wait for images
            const images = clone.getElementsByTagName('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(r => { img.onload = r; img.onerror = r; });
            }));
            
            await new Promise(resolve => setTimeout(resolve, 500)); // slight buffer

            const canvas = await html2canvas(clone, {
                scale: 3, 
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                allowTaint: true,
                height: clone.scrollHeight,
                windowHeight: clone.scrollHeight,
                scrollY: 0
            });

            document.body.removeChild(container);

            const imgData = canvas.toDataURL('image/png');
            if (imgData === 'data:,') throw new Error("Blank canvas generated");

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Handle multi-page if receipt is very long, otherwise single page
            if (pdfHeight > 297) {
                let heightLeft = pdfHeight;
                let position = 0;
                let pageHeight = 297;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - pdfHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                    heightLeft -= pageHeight;
                }
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            }

            pdf.save(`Invoice_${sale.invoiceNumber}.pdf`);
            
            toast.dismiss(toastId);
            toast.success("PDF Downloaded!");
        } catch (err) {
            console.error("PDF generation failed:", err);
            toast.dismiss(toastId);
            toast.error("Could not generate PDF document.");
        } finally {
            setGenerating(null);
        }
    };

    const handleDownloadImage = async () => {
        if (generating) return;
        const receiptElement = document.getElementById('receipt-download-target');
        if (!receiptElement) return;

        setGenerating('image');
        const toastId = toast.loading("Generating receipt image...");
        
        try {
            const html2canvas = (await import('html2canvas')).default;

            const container = document.createElement('div');
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '600px';
            document.body.appendChild(container);

            const clone = receiptElement.cloneNode(true);
            clone.style.position = 'relative';
            clone.style.display = 'block';
            clone.style.width = '600px'; 
            clone.style.height = 'auto';
            clone.style.background = 'white';
            clone.style.overflow = 'visible';
            container.appendChild(clone);

            const images = clone.getElementsByTagName('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(r => { img.onload = r; img.onerror = r; });
            }));
            
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(clone, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true,
                height: clone.scrollHeight,
                windowHeight: clone.scrollHeight,
                scrollY: 0
            });

            document.body.removeChild(container);

            const image = canvas.toDataURL("image/png");
            if (image === 'data:,') throw new Error("Blank image generated");

            const link = document.createElement('a');
            link.href = image;
            link.download = `Invoice_${sale.invoiceNumber}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.dismiss(toastId);
            toast.success("Receipt image downloaded!");
        } catch (err) {
            console.error("Image generation failed:", err);
            toast.dismiss(toastId);
            toast.error("Could not generate receipt image.");
        } finally {
            setGenerating(null);
        }
    };


    if (loading) return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner"></div>
        </div>
    );

    if (!sale) return <div style={{ textAlign: 'center', paddingTop: '100px' }}>Immutable record not found.</div>;

    const paidAmount = sale.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = sale.totalAmount - paidAmount;

    return (
        <div className="animate-fade-in" style={{
            padding: isInternal ? '0' : '60px 20px',
            maxWidth: isInternal ? '100%' : '1100px',
            margin: '0 auto',
            minHeight: '100vh',
            background: isInternal ? 'transparent' : 'var(--background)'
        }}>
            {/* Minimalist Professional Header */}
            {!isInternal && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white' }}>K</div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.04em' }}>Kredibly</span>
                    </div>
                </div>
            )}

            {/* Strategic Layout Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Link to={isInternal ? "/sales" : "/"} style={{ color: 'inherit', textDecoration: 'none' }}>Records</Link>
                        <ChevronRight size={12} />
                        <span style={{ color: 'var(--primary)' }}>Invoice {sale.invoiceNumber}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 950, color: 'var(--text)', margin: 0, letterSpacing: '-0.05em' }}>
                            {sale.totalAmount.toLocaleString()} <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', color: 'var(--text-muted)', fontWeight: 700 }}>NGN</span>
                        </h1>
                        <span style={{
                            padding: '8px 16px',
                            borderRadius: '100px',
                            background: (paidAmount >= sale.totalAmount || sale.confirmed) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(76, 29, 149, 0.1)',
                            color: (paidAmount >= sale.totalAmount || sale.confirmed) ? 'var(--success)' : 'var(--primary)',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            letterSpacing: '0.05em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: '1px solid currentColor'
                        }}>
                            {paidAmount >= sale.totalAmount ? (
                                <><CheckCircle size={14} /> FULLY PAID</>
                            ) : sale.confirmed ? (
                                <><ShieldCheck size={14} /> VERIFIED</>
                            ) : (
                                <><Zap size={14} /> WAITING FOR PAYMENT</>
                            )}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setShowSuccessModal(true)}
                        className="btn-primary"
                        style={{ padding: '14px 24px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '0.95rem', boxShadow: '0 10px 25px -5px var(--primary-glow)' }}
                    >
                        <Share2 size={18} strokeWidth={3} /> Share Receipt
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 2fr) 360px',
                gap: '40px'
            }} className="invoice-grid-responsive">

                {/* Left Column: Core Data */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* High-Impact Info Cards */}
                    {/* High-Impact Info Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
                        <div className="dashboard-glass" style={{ padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', background: 'white' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Billed To</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    <User size={16} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
                                    {sale.customerName || 'Walk-in Customer'}
                                </h3>
                            </div>
                        </div>
                        <div className="dashboard-glass" style={{ padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', background: 'white' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Paid Amount</p>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--success)', margin: 0 }}>₦{paidAmount.toLocaleString()}</h3>
                        </div>
                        <div className="dashboard-glass" style={{ padding: '20px', borderRadius: '24px', border: '1px solid var(--border)', background: 'white' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Balance</p>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: balance > 0 ? 'var(--warning)' : 'var(--text-muted)', margin: 0 }}>₦{balance.toLocaleString()}</h3>
                        </div>
                    </div>

                    {/* Official Description */}
                    <div className="dashboard-glass" style={{ background: 'white', borderRadius: '28px', border: '1px solid var(--border)', padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                            <FileText size={18} color="var(--primary)" strokeWidth={2.5} />
                            <h3 style={{ fontWeight: 800, fontSize: '1rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transaction Details</h3>
                        </div>

                        <div style={{ fontSize: '1rem', color: 'var(--text)', lineHeight: 1.6, background: 'var(--background)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', position: 'relative' }}>
                            <span style={{ position: 'absolute', top: '12px', right: '12px', opacity: 0.1 }}><Edit2 size={32} /></span>
                            {sale.description}
                        </div>

                        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px' }}>
                            <div>
                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Merchant</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem' }}>
                                        {sale.businessId?.displayName?.[0]}
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, color: 'var(--text)', margin: 0, fontSize: '0.9rem' }}>{sale.businessId.displayName}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700, margin: 0 }}>Verified Seller</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>Issued On</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--background)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p style={{ fontWeight: 800, color: 'var(--text)', margin: 0, fontSize: '0.9rem' }}>{new Date(sale.createdAt).toLocaleDateString()}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cryptographic Payment Block (Public View Only) */}
                    {balance > 0 && !isInternal && (
                        <div style={{ background: '#0F172A', borderRadius: '40px', padding: '40px', color: 'white', boxShadow: '0 30px 60px -15px rgba(15, 23, 42, 0.3)' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', width: '48px', height: '48px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>How to Pay</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 600 }}>Please pay using the details below</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
                                <div>
                                    <div style={{ marginBottom: '24px' }}>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.1em' }}>Bank Name</p>
                                        <p style={{ fontWeight: 900, fontSize: '1.3rem' }}>{sale.businessId.bankDetails?.bankName || 'Bank'}</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.1em' }}>Account Number</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <p style={{ fontWeight: 900, fontSize: '1.8rem', letterSpacing: '0.1em', margin: 0, fontFamily: 'monospace' }}>{sale.businessId.bankDetails?.accountNumber || '—'}</p>
                                            <button onClick={() => { navigator.clipboard.writeText(sale.businessId.bankDetails.accountNumber); toast.success("Securely Copied"); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '10px', borderRadius: '12px', cursor: 'pointer', color: 'white' }}>
                                                <Copy size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <button onClick={handleConfirm} disabled={confirming || sale.confirmed} className="btn-primary" style={{ padding: '20px', borderRadius: '20px', background: 'var(--primary)', fontSize: '1.1rem', fontWeight: 900 }}>
                                        {sale.confirmed ? 'PAYMENT CONFIRMED' : confirming ? <Loader2 size={24} className="animate-spin" /> : 'YES, I HAVE PAID'}
                                    </button>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                        <Lock size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <p>Confirming payment notifies the seller. Only click this if you have truly sent the money.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Ledger Control */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* Founder Management Panel */}
                    {isOwner && (
                        <div className="dashboard-glass" style={{ background: 'white', borderRadius: '32px', border: '1px solid var(--border)', padding: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                <Zap size={18} color="var(--primary)" fill="var(--primary)" />
                                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Info</span>
                            </div>

                            {balance > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <button
                                        onClick={() => setShowPaymentModal(true)}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '18px', borderRadius: '18px', fontWeight: 800, fontSize: '1rem' }}
                                    >
                                        <PlusCircle size={20} strokeWidth={2.5} /> Record Payment
                                    </button>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={handleReminder}
                                            disabled={reminding}
                                            className="btn-secondary"
                                            style={{ flex: 3, padding: '18px', borderRadius: '18px', border: '1px solid #25D366', color: '#25D366', fontWeight: 800, background: 'rgba(37, 211, 102, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                        >
                                            <MessageCircle size={20} /> {reminding ? '...' : 'WhatsApp'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const shareUrl = `${window.location.origin}/i/${sale.invoiceNumber}`;
                                                navigator.clipboard.writeText(shareUrl);
                                                toast.success("Link copied! Paste anywhere.");
                                            }}
                                            className="btn-secondary"
                                            style={{ flex: 1, padding: '18px', borderRadius: '18px', border: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: 800, background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Copy Invoice Link"
                                        >
                                            <Copy size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '24px', borderRadius: '24px', border: '1px solid var(--success)', textAlign: 'center' }}>
                                    <CheckCircle size={32} color="var(--success)" style={{ marginBottom: '12px' }} />
                                    <p style={{ margin: 0, color: 'var(--success)', fontWeight: 900, fontSize: '1.1rem' }}>Paid in Full</p>
                                </div>
                            )}

                            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button onClick={() => setShowEditModal(true)} style={{ width: '100%', padding: '14px', background: 'var(--background)', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 800, borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Edit2 size={16} /> Edit Invoice
                                </button>
                                <button onClick={() => setDeleteModal({ show: true, sale })} style={{ width: '100%', padding: '14px', background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: 'var(--error)', fontSize: '0.9rem', fontWeight: 800, borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Trash2 size={16} /> Delete Invoice
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Imprints & Integrity Timeline */}
                    <div className="dashboard-glass" style={{ background: 'white', borderRadius: '32px', border: '1px solid var(--border)', padding: '32px' }}>
                        <h4 style={{ fontWeight: 900, color: 'var(--text)', marginBottom: '32px', fontSize: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Recent History</h4>

                        <div className="timeline-track">
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <div className="timeline-dot" style={{ background: 'var(--primary)' }}></div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px 0' }}>Created</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                            </div>

                            {sale.payments.map((payment, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div className="timeline-dot" style={{ background: 'var(--success)' }}></div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px 0' }}>Payment Recorded</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 900, marginBottom: '4px' }}>+ ₦{payment.amount.toLocaleString()}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                            {new Date(payment.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(payment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {sale.confirmed && (
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div className="timeline-dot" style={{ background: 'var(--primary)' }}></div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text)', margin: '0 0 4px 0' }}>Customer Confirmed</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Payment verified by customer</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Overlays */}
            {showEditModal && createPortal(
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        className="animate-scale-in" 
                        style={{ background: 'white', padding: '40px', width: '100%', maxWidth: '440px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <h3 style={{ fontWeight: 950, fontSize: '1.6rem', letterSpacing: '-0.04em', color: '#0F172A' }}>Edit Invoice</h3>
                            <button onClick={() => setShowEditModal(false)} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '12px', display: 'flex' }}><X size={20} color="#334155" /></button>
                        </div>
                        <form onSubmit={handleUpdateSale} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Identity</label>
                                <input className="input-field" style={{ borderRadius: '16px', background: '#F8FAFC', fontWeight: 700 }} value={editForm.customerName} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 800, fontSize: '0.85rem', marginBottom: '8px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Memo Change</label>
                                <textarea className="input-field" style={{ minHeight: '120px', resize: 'none', borderRadius: '16px', background: '#F8FAFC', fontWeight: 600 }} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                            </div>
                            <button type="submit" disabled={processing} className="btn-primary" style={{ padding: '18px', borderRadius: '18px', fontWeight: 900, fontSize: '1rem' }}>
                                {processing ? 'Saving...' : 'Update Details'}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>,
                document.body
            )}

            {showPaymentModal && createPortal(
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        className="animate-scale-in" 
                        style={{ background: 'white', padding: '40px', width: '100%', maxWidth: '440px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                            <h3 style={{ fontWeight: 950, fontSize: '1.6rem', letterSpacing: '-0.04em', color: '#0F172A' }}>Record Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', padding: '10px', borderRadius: '12px', display: 'flex' }}><X size={20} color="#334155" /></button>
                        </div>
                        <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                                    <label style={{ fontWeight: 800, fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount to Record (₦)</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setPaymentAmount(balance.toString())}
                                        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 14px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}
                                    >
                                        Full Payment
                                    </button>
                                </div>
                                <input 
                                    type="number" 
                                    className="input-field" 
                                    autoFocus 
                                    placeholder="0.00"
                                    value={paymentAmount} 
                                    onChange={e => setPaymentAmount(e.target.value)} 
                                    style={{ fontSize: '2rem', fontWeight: 950, borderRadius: '16px', background: '#F8FAFC', color: 'var(--success)', border: '2px solid #E2E8F0' }} 
                                    required 
                                />
                                {paymentAmount && !isNaN(parseFloat(paymentAmount)) && (
                                    <p style={{ marginTop: '12px', fontSize: '1rem', fontWeight: 800, color: 'var(--success)' }}>
                                        ₦{parseFloat(paymentAmount).toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <button type="submit" disabled={processing} className="btn-primary" style={{ padding: '18px', borderRadius: '18px', fontWeight: 900, fontSize: '1rem' }}>
                                {processing ? 'Recording...' : 'Confirm Payment'}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>,
                document.body
            )}

            {deleteModal.show && createPortal(
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        className="animate-scale-in" 
                        style={{ background: 'white', padding: '40px', width: '100%', maxWidth: '440px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}
                    >
                        <div style={{ background: '#FEF2F2', color: '#EF4444', width: '72px', height: '72px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#0F172A', marginBottom: '12px', letterSpacing: '-0.02em' }}>Delete Invoice?</h3>
                        <p style={{ color: '#334155', marginBottom: '32px', lineHeight: 1.6, fontWeight: 600, fontSize: '0.95rem' }}>This will permanently remove the transaction record and cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-secondary" style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '0.95rem', border: '1px solid #E2E8F0' }} onClick={() => setDeleteModal({ show: false, sale: null })}>Cancel</button>
                            <button style={{ flex: 1, background: '#EF4444', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }} onClick={confirmDelete}>Delete Forever</button>
                        </div>
                    </motion.div>
                </motion.div>,
                document.body
            )}

            {/* Success Action Modal */}
            {showSuccessModal && createPortal(
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)', padding: '20px' }}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        className="animate-scale-in" 
                        style={{ background: 'white', padding: '40px', width: '100%', maxWidth: '480px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center' }}
                    >
                        <div style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setShowSuccessModal(false)}
                                style={{ position: 'absolute', top: '-24px', right: '-24px', background: '#F1F5F9', border: 'none', borderRadius: '12px', padding: '8px', cursor: 'pointer', color: '#334155' }}
                            >
                                <X size={20} />
                            </button>
                            {showCelebration ? (
                                <div style={{ background: '#F0FDF4', color: '#16A34A', width: '80px', height: '80px', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative' }}>
                                    <CheckCircle size={40} strokeWidth={3} />
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1.2 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        style={{ position: 'absolute', top: -5, right: -5, background: '#16A34A', border: '4px solid white', width: '24px', height: '24px', borderRadius: '50%' }} 
                                    />
                                </div>
                            ) : (
                                <div style={{ background: 'rgba(76, 29, 149, 0.1)', color: 'var(--primary)', width: '80px', height: '80px', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <FileText size={40} strokeWidth={2.5} />
                                </div>
                            )}
                        </div>
                        
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 950, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.03em' }}>
                            Receipt & Sharing
                        </h3>
                        <p style={{ color: '#334155', marginBottom: '32px', lineHeight: 1.6, fontWeight: 600, fontSize: '0.95rem' }}>
                            {showCelebration ? "Transaction secured! Share the link or download the receipt." : "View, share, or download the latest version of this invoice."}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <button 
                                onClick={handleShare}
                                style={{ padding: '20px', background: '#0F172A', color: 'white', borderRadius: '20px', fontWeight: 900, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(15, 23, 42, 0.2)' }}
                            >
                                <Share2 size={22} />
                                Share Invoice Link
                            </button>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button 
                                    onClick={handleDownloadPDF}
                                    disabled={!!generating}
                                    style={{ padding: '20px', background: 'var(--primary)', color: 'white', borderRadius: '20px', fontWeight: 900, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: generating ? 'not-allowed' : 'pointer', border: 'none', boxShadow: '0 10px 20px -5px var(--primary-glow)', opacity: generating ? 0.7 : 1 }}
                                >
                                    {generating === 'pdf' ? <Loader2 size={18} className="spin-animation" /> : <FileText size={18} />} 
                                    {generating === 'pdf' ? '...' : 'PDF'}
                                </button>
                                <button 
                                    onClick={handleDownloadImage}
                                    disabled={!!generating}
                                    style={{ padding: '20px', background: 'white', color: 'var(--primary)', border: '2.5px solid var(--primary)', borderRadius: '20px', fontWeight: 900, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.7 : 1 }}
                                >
                                    {generating === 'image' ? <Loader2 size={18} className="spin-animation" /> : <ImageIcon size={18} />}
                                    {generating === 'image' ? '...' : 'Image'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>,
                document.body
            )}

            <style>{`
                @media (max-width: 1024px) {
                    .invoice-grid-responsive {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
            
            {/* Hidden Receipt Template for Image/PDF Generation */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <div id="receipt-download-target" className="printable-receipt" style={{ width: '600px', background: 'white', padding: '48px', fontFamily: "'Inter', sans-serif" }}>
                    {/* Receipt Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '2px solid #F1F5F9', paddingBottom: '32px' }}>
                        <div>
                            <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '32px' }} />
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                            {sale?.businessId?.logoUrl ? (
                                <img src={sale.businessId.logoUrl} alt="Merchant Logo" style={{ height: '48px', objectFit: 'contain', marginBottom: '8px' }} />
                            ) : (
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>{sale?.businessId?.displayName}</h3>
                            )}
                            <p style={{ margin: 0, fontSize: '12px', color: '#334155', fontWeight: 600 }}>Invoice #{sale?.invoiceNumber}</p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div style={{ background: '#F8FAFC', padding: '32px', borderRadius: '24px', marginBottom: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Customer</p>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{sale?.customerName || 'Walk-in Customer'}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</p>
                                <p style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A', margin: 0 }}>₦{sale?.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '20px', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Total Paid</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>₦{paidAmount.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A' }}>Balance Due</span>
                                <span style={{ fontSize: '18px', fontWeight: 950, color: balance > 0 ? '#EF4444' : '#10B981' }}>₦{balance.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div style={{ marginBottom: '40px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Payment Timeline</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px dashed #E2E8F0' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Invoice Issued</span>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{new Date(sale?.createdAt).toLocaleDateString()}</span>
                            </div>
                            {(sale?.payments || []).map((p, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px dashed #E2E8F0' }}>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Payment Received</p>
                                        <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{new Date(p.date).toLocaleDateString()} ({p.method})</p>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>+ ₦{p.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Details */}
                    <div style={{ marginBottom: '40px' }}>
                         <p style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Description</p>
                         <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155', margin: 0, lineHeight: 1.5 }}>{sale?.description}</p>
                    </div>

                    {/* Footer */}
                    <div style={{ borderTop: '2px solid #F1F5F9', paddingTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <p style={{ fontSize: '11px', color: '#334155', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={14} color="#334155" /> Secured by Kredibly • KR-{sale?.invoiceNumber}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoicePage;
