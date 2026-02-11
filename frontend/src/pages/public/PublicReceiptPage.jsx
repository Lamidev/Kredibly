import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
    ShieldCheck,
    Calendar,
    FileText,
    AlertCircle,
    Loader2,
    Share2,
    Building2,
    CheckCircle,
    Image as ImageIcon,
    Download
} from "lucide-react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

const PublicReceiptPage = () => {
    const { id } = useParams();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(null);

    useEffect(() => {
        fetchReceipt();
    }, [id]);

    useEffect(() => {
        if (sale) {
            const pageTitle = `Receipt: ₦${sale.paidAmount.toLocaleString()} - ${sale.businessId?.displayName || 'Merchant'}`;
            document.title = pageTitle;
        }
    }, [sale]);

    const fetchReceipt = async () => {
        try {
            const res = await axios.get(`${API_BASE}/payments/invoice/${id}`);
            if (res.data.success) {
                setSale(res.data.data);
            }
        } catch (err) {
            toast.error("Receipt not found");
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        const shareUrl = window.location.href;
        const text = `Payment receipt for Invoice #${sale?.invoiceNumber} from ${sale?.businessId?.displayName}. Total paid: ₦${sale?.paidAmount.toLocaleString()}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Receipt - ${sale?.invoiceNumber}`,
                    text: text,
                    url: shareUrl,
                });
            } catch (err) {
                // User cancelled
            }
        } else {
            navigator.clipboard.writeText(`${text} ${shareUrl}`);
            toast.success("Receipt link copied to clipboard!");
        }
    };

    const handleDownloadPDF = async () => {
        if (generating) return;
        const receiptElement = document.getElementById('receipt-download-target');
        if (!receiptElement) return;

        setGenerating('pdf');
        const toastId = toast.loading("Preparing your PDF receipt...");
        
        try {
            const html2canvas = (await import('html2canvas')).default;
            
            const clone = receiptElement.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.zIndex = '-9999';
            clone.style.visibility = 'visible';
            clone.style.display = 'block';
            clone.style.width = '600px';
            clone.style.background = 'white';
            document.body.appendChild(clone);

            const images = clone.getElementsByTagName('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(r => { img.onload = r; img.onerror = r; });
            }));
            
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(clone, {
                scale: 3,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                allowTaint: true
            });

            document.body.removeChild(clone);

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

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Receipt_${sale.invoiceNumber}.pdf`);
            
            toast.dismiss(toastId);
            toast.success("PDF Downloaded!");
        } catch (err) {
            console.error("PDF generation failed:", err);
            toast.dismiss(toastId);
            toast.error("Could not generate PDF.");
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

            const clone = receiptElement.cloneNode(true);
            clone.style.position = 'fixed';
            clone.style.left = '0';
            clone.style.top = '0';
            clone.style.zIndex = '-9999';
            clone.style.visibility = 'visible';
            clone.style.display = 'block';
            clone.style.width = '600px';
            clone.style.background = 'white';
            document.body.appendChild(clone);

            const images = clone.getElementsByTagName('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(r => { img.onload = r; img.onerror = r; });
            }));
            
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(clone, {
                scale: 2,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true,
                allowTaint: true
            });

            document.body.removeChild(clone);

            const image = canvas.toDataURL("image/png");
            if (image === 'data:,') throw new Error("Blank image generated");

            const link = document.createElement('a');
            link.href = image;
            link.download = `Receipt_${sale.invoiceNumber}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.dismiss(toastId);
            toast.success("Receipt image downloaded!");
        } catch (err) {
            console.error("Image generation failed:", err);
            toast.dismiss(toastId);
            toast.error("Could not generate image.");
        } finally {
            setGenerating(null);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FDFCFE' }}>
            <Loader2 size={48} className="spin-animation" style={{ color: '#7C3AED', marginBottom: '16px' }} />
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#94A3B8' }}>Loading receipt...</p>
        </div>
    );

    if (!sale) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center', background: '#FDFCFE' }}>
            <AlertCircle size={48} color="#EF4444" style={{ marginBottom: '16px' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>Receipt Not Found</h1>
            <p style={{ color: '#64748B', maxWidth: '320px', margin: '0 auto' }}>This receipt might not exist or the link is incorrect.</p>
        </div>
    );

    const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = sale.totalAmount - totalPaid;
    const isPaid = sale.status === 'paid' || balance <= 0;

    return (
        <div style={{ minHeight: '100vh', background: '#FDFCFE', paddingBottom: '80px', fontFamily: "'Inter', sans-serif" }}>
            {/* Hidden Receipt for Download */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <div id="receipt-download-target" style={{ width: '600px', background: 'white', padding: '48px', fontFamily: "'Inter', sans-serif" }}>
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
                            <p style={{ margin: 0, fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Invoice #{sale?.invoiceNumber}</p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div style={{ background: '#F8FAFC', padding: '32px', borderRadius: '24px', marginBottom: '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <p style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Customer</p>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', margin: 0 }}>{sale?.customerName || 'Customer'}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Total Amount</p>
                                <p style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A', margin: 0 }}>₦{sale?.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '20px', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Total Paid</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>₦{totalPaid.toLocaleString()}</span>
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
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Invoice Issued</span>
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

            {/* Main Content */}
            <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '24px 16px' }}>
                {/* Header */}
                <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '24px' }} />
                    <button 
                        onClick={handleShare}
                        style={{ padding: '12px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: '50%', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                    >
                        <Share2 size={18} color="#475569" />
                    </button>
                </nav>

                {/* Receipt Badge */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{
                        padding: '8px 20px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #D1FAE5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <CheckCircle size={14} />
                        Official Receipt
                    </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: 'clamp(2rem, 8vw, 42px)', fontWeight: 900, marginBottom: '12px', color: '#0F172A' }}>
                        Payment Receipt
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>
                        Invoice #{sale.invoiceNumber} • {sale.businessId?.displayName}
                    </p>
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'white',
                        borderRadius: '32px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.04)',
                        border: '1px solid #F1F5F9',
                        overflow: 'hidden'
                    }}
                >
                    {/* Merchant Info */}
                    <div style={{ padding: '32px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', overflow: 'hidden' }}>
                            {sale.businessId?.logoUrl ? <img src={sale.businessId.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={32} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A', marginBottom: '4px' }}>{sale.businessId?.displayName}</h3>
                            <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>Verified Merchant</p>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div style={{ padding: '32px' }}>
                        <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '24px', marginBottom: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Customer</p>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155', margin: 0 }}>{sale.customerName}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Invoice Total</p>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155', margin: 0 }}>₦{sale.totalAmount.toLocaleString()}</p>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>Total Paid</span>
                                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#10B981' }}>₦{totalPaid.toLocaleString()}</span>
                                </div>
                                {balance > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>Balance Due</span>
                                        <span style={{ fontSize: '18px', fontWeight: 900, color: '#F59E0B' }}>₦{balance.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FileText size={14} color="#94A3B8" />
                                <span style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Description</span>
                            </div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#475569', margin: 0, lineHeight: 1.6 }}>"{sale.description}"</p>
                        </div>

                        {/* Payment History */}
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '16px' }}>Payment Timeline</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#F8FAFC', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Calendar size={14} color="#94A3B8" />
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Invoice Issued</span>
                                    </div>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>{new Date(sale.createdAt).toLocaleDateString()}</span>
                                </div>
                                {sale.payments.map((p, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#ECFDF5', borderRadius: '12px', border: '1px solid #D1FAE5' }}>
                                        <div>
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', margin: '0 0 2px 0' }}>Payment Received</p>
                                            <p style={{ fontSize: '11px', color: '#64748B', margin: 0 }}>{new Date(p.date).toLocaleDateString()} • {p.method}</p>
                                        </div>
                                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#10B981' }}>₦{p.amount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Download Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button
                                onClick={handleDownloadImage}
                                disabled={!!generating}
                                style={{
                                    padding: '16px',
                                    background: '#F8FAFC',
                                    color: '#0F172A',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '14px',
                                    fontWeight: 900,
                                    cursor: generating ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    opacity: generating ? 0.7 : 1
                                }}
                            >
                                {generating === 'image' ? <Loader2 size={18} className="spin-animation" /> : <ImageIcon size={18} />}
                                {generating === 'image' ? 'Generating...' : 'Download Image'}
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={!!generating}
                                style={{
                                    padding: '16px',
                                    background: '#0F172A',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '14px',
                                    fontWeight: 900,
                                    cursor: generating ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontSize: '14px',
                                    opacity: generating ? 0.7 : 1
                                }}
                            >
                                {generating === 'pdf' ? <Loader2 size={18} className="spin-animation" /> : <Download size={18} />}
                                {generating === 'pdf' ? 'Generating...' : 'Download PDF'}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '40px', padding: '20px' }}>
                    <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <ShieldCheck size={14} /> Secured by Kredibly
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicReceiptPage;
