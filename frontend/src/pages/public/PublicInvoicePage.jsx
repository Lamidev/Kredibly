import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    Download, 
    Share2, 
    Calendar, 
    Clock, 
    Building2, 
    CheckCircle2, 
    ShieldCheck, 
    AlertCircle, 
    Loader2,
    FileText,
    Image as ImageIcon,
    ArrowRight,
    CheckCircle,
    CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PaymentSuccessModal from '../../components/payment/PaymentSuccessModal';

const PublicInvoicePage = () => {
    const { id } = useParams();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [paymentMode, setPaymentMode] = useState('full');
    const [customAmount, setCustomAmount] = useState('');
    const [customAmountDisplay, setCustomAmountDisplay] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastPaymentAmount, setLastPaymentAmount] = useState(0);
    const [recentPaymentDate, setRecentPaymentDate] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [generating, setGenerating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('nomba'); // Default to Nomba
    const [nombaData, setNombaData] = useState(null);
    const [loadingNomba, setLoadingNomba] = useState(false);
    const [verifyingPayment, setVerifyingPayment] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        
        const fetchSale = async () => {
            try {
                const res = await axios.get(`${API_URL}/sales/${id}`);
                
                if (res.data.success) {
                    setSale(res.data.data);
                } else {
                    setSale(null);
                }
                
                // Check if merchant is logged in (to hide viral loops)
                const storedProfile = localStorage.getItem('businessProfile');
                if (storedProfile) setProfile(JSON.parse(storedProfile));
            } catch (err) {
                console.error("Error fetching invoice:", err);
                setSale(null);
            } finally {
                setLoading(false);
            }
        };
        fetchSale();
        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

    // 🛡️ WEBHOOK POLLING: Automatically update UI when backend processing completes
    useEffect(() => {
        if (!sale || loading) return;
        
        const calcBalance = (s) => s.totalAmount - (s.paidAmount || s.payments?.reduce((sum, p) => sum + p.amount, 0) || 0);
        const currentBalance = calcBalance(sale);
        
        if (currentBalance <= 0) return; // Stop polling if fully paid

        const pollInterval = setInterval(async () => {
            try {
                const res = await axios.get(`${API_URL}/sales/${id}`);
                if (res.data.success) {
                    const latestSale = res.data.data;
                    const newBalance = calcBalance(latestSale);
                    
                    // If balance decreased dynamically
                    if (newBalance < currentBalance) {
                        setSale(latestSale);
                        if (newBalance <= 0 && !showSuccessModal) {
                            setLastPaymentAmount(currentBalance - newBalance);
                            setRecentPaymentDate(new Date());
                            setCustomAmount('');
                            setCustomAmountDisplay('');
                            setShowSuccessModal(true);
                        } else {
                            toast.success("Payment verified successfully on the ledger! 🛡️");
                        }
                    } else if (latestSale.updatedAt !== sale.updatedAt) {
                        // Only update state if something else changed (e.g. description)
                        setSale(latestSale);
                    }
                }
            } catch (err) {
                // Silent catch for background polling
            }
        }, 8000); // Poll every 8 seconds

        return () => clearInterval(pollInterval);
    }, [id, sale, loading, showSuccessModal]);

    // ⏱️ COUNTDOWN TIMER LOGIC
    useEffect(() => {
        if (!nombaData || !nombaData.expiresAt) return;

        const target = new Date(nombaData.expiresAt).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft("Expired");
                setNombaData(null); // Clear expired data
                return;
            }

            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [nombaData]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice from ${sale.businessId?.displayName}`,
                    text: `View invoice for ${sale.customerName} - KR-${sale.invoiceNumber}`,
                    url: window.location.href,
                });
            } catch (err) {
                console.error("Share failed:", err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copied to clipboard!');
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('receipt-download-target');
        if (!element) return;
        
        setGenerating('pdf');
        toast.loading('Preparing official PDF...', { id: 'pdf-gen' });
        
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#FFFFFF',
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('receipt-download-target');
                    if (el) el.style.position = 'static';
                }
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`Receipt_KR-${sale.invoiceNumber}.pdf`);
            toast.success('Official PDF saved!', { id: 'pdf-gen' });
        } catch (err) {
            console.error("PDF Generate Error:", err);
            toast.error("PDF generation failed: " + err.message, { id: 'pdf-gen' });
        } finally {
            setGenerating(false);
        }
    };

    const handleDownloadImage = async () => {
        const element = document.getElementById('receipt-download-target');
        if (!element) return;
        
        setGenerating('image');
        toast.loading('Capturing invoice image...', { id: 'image-gen' });
        
        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#FFFFFF',
                onclone: (clonedDoc) => {
                    const el = clonedDoc.getElementById('receipt-download-target');
                    if (el) el.style.position = 'static';
                }
            });
            
            const link = document.createElement('a');
            link.download = `Invoice_KR-${sale.invoiceNumber}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('Image saved to downloads!', { id: 'image-gen' });
        } catch (err) {
            console.error("Image Generate Error:", err);
            toast.error("Image capture failed: " + err.message, { id: 'image-gen' });
        } finally {
            setGenerating(false);
        }
    };

    const handleNombaInitialization = async () => {
        const amountToPay = paymentMode === 'full'
            ? (sale.totalAmount - (sale.paidAmount || 0))
            : parseFloat(customAmount);

        if (!amountToPay || amountToPay <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        try {
            setLoadingNomba(true);
            const res = await axios.post(`${API_URL}/payments/initialize-nomba-account`, {
                invoiceId: id,
                amount: amountToPay
            });

            if (res.data.success) {
                setNombaData(res.data.data);
            }
        } catch (err) {
            console.error('Nomba Initialization failed:', err);
            const msg = err.response?.data?.message || 'Bank transfer temporarily unavailable. Please use card payment below.';
            toast.error(msg);
        } finally {
            setLoadingNomba(false);
        }
    };

    // Derived State
    const balance = sale ? (sale.totalAmount - (sale.paidAmount || sale.payments?.reduce((s, p) => s + p.amount, 0) || 0)) : 0;
    const isPaid = sale ? balance <= 0 : false;
    const isOverdue = sale && !isPaid && sale.dueDate && new Date(sale.dueDate) < new Date();
    const isDebtRecovery = sale && !isPaid && (sale.status === 'partial' || isOverdue);

    // 🔄 AUTO-RESET: Clear Nomba data if user changes amount or mode
    useEffect(() => {
        if (nombaData) setNombaData(null);
    }, [paymentMode, customAmount]);

    const handleManualVerification = async () => {
        if (!nombaData || !nombaData.reference) return;
        setVerifyingPayment(true);
        try {
            const res = await axios.post(`${API_URL}/payments/verify-nomba-payment`, {
                accountRef: nombaData.reference,
                saleId: sale._id
            });
            
            if (res.data.success) {
                toast.success("Payment verified! Refreshing...");
                // Refresh sale data
                const saleRes = await axios.get(`${API_URL}/sales/${id}`);
                if (saleRes.data.success) {
                    setSale(saleRes.data.data);
                    if (saleRes.data.data.paidAmount >= saleRes.data.data.totalAmount) {
                        setShowSuccessModal(true);
                    }
                }
            } else {
                toast.error(res.data.message || "Payment not seen yet. Please wait a moment.");
            }
        } catch (err) {
            toast.error("Status check failed. Please try again or wait for automatic update.");
        } finally {
            setVerifyingPayment(false);
        }
    };

    const handlePaystackPayment = async (paymentChannel) => {
        const amountToPay = paymentMode === 'full' 
            ? (sale.totalAmount - (sale.paidAmount || 0)) 
            : parseFloat(customAmount);

        if (!amountToPay || amountToPay <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            setVerifying(true);
            
            // Robust Email Fallback: Strip special characters and spaces
            const safeName = (sale.customerName || "Guest").toLowerCase().replace(/[^a-z0-9]/g, '');
            const fallbackEmail = `${safeName || 'customer'}@usekredibly.com`;
            
            // Clean the customer email: strip spaces. If it doesn't look like an email, use fallback.
            let finalEmail = sale.customerEmail ? sale.customerEmail.trim() : "";
            if (!finalEmail.includes('@') || finalEmail.includes(' ')) {
                finalEmail = fallbackEmail;
            }

            const res = await axios.post(`${API_URL}/business/paystack/initialize`, {
                saleId: sale._id,
                amount: amountToPay,
                email: finalEmail,
                paymentChannel: paymentChannel
            });

            // Restrict channels so Paystack natively forces the right flow
            const channels = paymentChannel === 'card' ? ['card'] : ['bank', 'bank_transfer', 'ussd'];

            const handler = window.PaystackPop.setup({
                key: res.data.publicKey,
                email: res.data.email, // 💎 MUST MATCH BACKEND CHOICE
                amount: Math.round(amountToPay * 100), // 💎 BACKUP VALIDATOR (Kobo)
                accessCode: res.data.accessCode, // 💎 ALL-IN-ONE TOKEN (Fees, Settlements, Reference)
                callback: function(response) {
                    setVerifying(true);
                    
                    // 1. 🛡️ VERIFY ON BACKEND
                    axios.post(`${API_URL}/payments/verify-invoice`, {
                        reference: response.reference,
                        invoiceId: id
                    }).then(function(verifyRes) {
                        if (verifyRes.data.success) {
                            // 🏆 SUCCESS: Show modal FIRST to build trust immediately
                            setLastPaymentAmount(verifyRes.data.originalAmount || amountToPay);
                            setRecentPaymentDate(new Date());
                            setCustomAmount('');
                            setCustomAmountDisplay('');
                            setShowSuccessModal(true);
                            
                            // 2. 🔄 Refresh local sale data (Background Task)
                            axios.get(`${API_URL}/sales/${id}`).then(function(refreshRes) {
                                if (refreshRes.data.success) {
                                    setSale(refreshRes.data.data);
                                }
                            }).catch(function(refreshErr) {
                                console.warn("Background refresh lagged, but payment is confirmed.");
                            });
                        } else {
                            toast.error(verifyRes.data.message || "Payment verification failed. Please contact the merchant! 🛡️");
                        }
                    }).catch(function(err) {
                        console.error("Verification error:", err);
                        // 🚨 REASSURANCE: Don't panic the customer
                        toast.error("Verification taking longer than usual... 🛡️ Don't worry, we are securing your payment. Please refresh the page in 10 seconds!", { duration: 6000 });
                    }).finally(function() {
                        setVerifying(false);
                    });
                },
                onClose: function() {
                    setVerifying(false);
                    toast("Payment window closed", { icon: '🛡️' });
                }
            });
            handler.openIframe();
            
            setVerifying(true);
        } catch (err) {
            console.error("Paystack initialization failed:", err);
            setVerifying(false);
            toast.error(`Payment Error: ${err.message || "Failed to start"}`);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FDFCFE' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px', marginBottom: '24px' }}>
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ position: 'absolute', inset: 0, border: '4px solid #F3E8FF', borderRadius: '50%', borderTopColor: '#4C1D95' }}
                />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/krediblyrevamped.png" alt="" style={{ height: '24px', opacity: 0.3 }} />
                </div>
            </div>
            <p style={{ fontSize: '12px', fontWeight: 800, color: 'rgba(76, 29, 149, 0.4)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Secure Connection</p>
        </div>
    );

    if (!sale) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', textAlign: 'center', background: '#FDFCFE' }}>
            <div style={{ width: '80px', height: '80px', background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                <AlertCircle size={32} color="#EF4444" />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>Invoice Not Found</h2>
            <p style={{ color: '#64748B', maxWidth: '300px', marginBottom: '24px' }}>This link may have expired or the invoice record might have been removed.</p>
            <Link to="/" style={{ textDecoration: 'none', color: '#4C1D95', fontWeight: 700 }}>Return to Kredibly</Link>
        </div>
    );



    return (
        <div style={{ minHeight: '100vh', background: '#FDFCFE', color: '#0F172A', fontFamily: "'Inter', sans-serif", paddingBottom: '40px' }}>
            <div className="printable-receipt" style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                {/* This hidden copy is what actually gets captured for PDF/Image */}
                <div id="receipt-download-target" style={{ width: '600px', background: 'white', padding: '48px', fontFamily: "'Inter', sans-serif" }}>
                    {/* Receipt Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '2px solid #F1F5F9', paddingBottom: '32px', position: 'relative' }}>
                        {(isPaid || sale.invoiceType === 'record') && (
                            <div style={{ 
                                position: 'absolute', 
                                right: '-20px', 
                                top: '-20px', 
                                width: '130px',
                                height: '130px',
                                border: '6px double #10B981', 
                                borderRadius: '50%', 
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: 'rotate(-15deg)', 
                                opacity: 0.9,
                                background: 'rgba(255, 255, 255, 0.95)',
                                zIndex: 10,
                                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.1)'
                            }}>
                                <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>OFFICIALLY</span>
                                <span style={{ color: '#10B981', fontSize: '22px', fontWeight: 950, textTransform: 'uppercase', margin: '-4px 0' }}>SETTLED</span>
                                <div style={{ height: '2px', width: '70%', background: '#10B981', margin: '4px 0' }} />
                                <span style={{ color: '#10B981', fontSize: '9px', fontWeight: 800 }}>{new Date().toLocaleDateString()}</span>
                            </div>
                        )}
                        <div>
                            {sale?.businessId?.plan === 'chairman' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {sale?.businessId?.logoUrl ? (
                                        <img src={sale.businessId.logoUrl} alt={sale.businessId.displayName} style={{ height: '40px', objectFit: 'contain' }} />
                                    ) : (
                                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>{sale?.businessId?.displayName}</h3>
                                    )}
                                </div>
                            ) : (
                                <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '32px' }} />
                            )}
                        </div>
                        
                        <div style={{ textAlign: 'right' }}>
                            {sale?.businessId?.logoUrl && sale?.businessId?.plan === 'chairman' ? (
                                <img src={sale.businessId.logoUrl} alt="Merchant Logo" style={{ height: '48px', objectFit: 'contain', marginBottom: '8px' }} />
                            ) : sale?.businessId?.plan === 'oga' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    {sale?.businessId?.logoUrl && <img src={sale.businessId.logoUrl} alt="Merchant Logo" style={{ height: '40px', objectFit: 'contain', marginBottom: '4px' }} />}
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>{sale?.businessId?.displayName}</h3>
                                </div>
                            ) : sale?.businessId?.plan === 'chairman' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <div style={{ padding: '4px 12px', background: '#F8FAFC', borderRadius: '100px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <ShieldCheck size={12} color="#64748B" />
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Secured by Kredibly</span>
                                    </div>
                                </div>
                            ) : (
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>{sale?.businessId?.displayName}</h3>
                            )}
                            <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', fontWeight: 700, marginTop: '4px' }}>{sale?.invoiceType === 'record' ? 'Receipt' : 'Invoice'} #{sale?.invoiceNumber}</p>
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
                                <p style={{ fontSize: '15px', fontWeight: 900, color: '#0F172A', margin: 0 }}>₦{(sale?.totalAmount || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '20px', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>Total Paid</span>
                                <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>₦{(sale?.paidAmount || 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>Balance Due</span>
                                <span style={{ fontSize: '18px', fontWeight: 800, color: balance > 0 ? '#EF4444' : '#10B981' }}>₦{(balance || 0).toLocaleString()}</span>
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
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', margin: 0 }}>Payment Received</p>
                                        <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{new Date(p.date).toLocaleDateString()} ({p.method})</p>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>+ ₦{(p.amount || 0).toLocaleString()}</span>
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

            {/* Main Interactive UI */}
            <div className="no-print">
            {/* Background elements */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '500px', background: 'linear-gradient(to bottom, rgba(245, 243, 255, 0.5), transparent)', pointerEvents: 'none' }} />

            {/* Navbar */}
            <nav style={{ maxWidth: '42rem', margin: '0 auto', width: '100%', position: 'relative', zIndex: 10, padding: '24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   {sale?.businessId?.plan === 'chairman' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {sale?.businessId?.logoUrl ? (
                                <img src={sale.businessId.logoUrl} style={{ height: '32px', objectFit: 'contain' }} />
                            ) : (
                                <span style={{ fontSize: '18px', fontWeight: 900 }}>{sale?.businessId?.displayName}</span>
                            )}
                        </div>
                   ) : (
                        <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '24px' }} />
                   )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {sale.businessId && sale.businessId.plan !== 'hustler' && sale.businessId.plan !== 'chairman' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {sale?.businessId?.logoUrl ? (
                                <img src={sale.businessId.logoUrl} alt={sale.businessId.displayName} style={{ height: '32px', width: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                            ) : (
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>{sale?.businessId?.displayName}</span>
                            )}
                        </div>
                    )}
                    {sale.businessId?.plan === 'chairman' && (
                         <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)', borderRadius: '100px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <ShieldCheck size={12} color="#64748B" />
                            <span style={{ fontSize: '9px', fontWeight: 900, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified by Kredibly</span>
                        </div>
                    )}
                    <button 
                        onClick={handleShare}
                        title="Share this invoice link"
                        style={{ padding: '12px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: '50%', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                    >
                        <Share2 size={18} color="#475569" />
                    </button>
                </div>
            </nav>

            <main className="invoice-main-content" style={{ maxWidth: '42rem', margin: '0 auto', position: 'relative', zIndex: 10 }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    
                    {/* Status Pill */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', position: 'relative' }}>
                        <div style={{ 
                            padding: '6px 16px', borderRadius: '100px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid',
                            backgroundColor: isPaid ? '#ECFDF5' : 'white',
                            color: isPaid ? '#059669' : '#4C1D95',
                            borderColor: isPaid ? '#D1FAE5' : '#F3E8FF'
                        }}>
                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isPaid ? '#10B981' : isOverdue ? '#EF4444' : '#4C1D95' }} />
                             {isPaid ? 'Settled on Ledger' : isOverdue ? 'Overdue Payment' : (sale.invoiceType === 'record' ? 'Verified Receipt' : 'Payment Awaiting')}
                        </div>

                        {/* Verified Seal Overlay for Paid/Records */}
                        {(isPaid || sale.invoiceType === 'record') && (
                            <motion.div 
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: -15 }}
                                style={{
                                    position: 'absolute',
                                    right: isMobile ? '-10px' : '-40px',
                                    top: '-10px',
                                    width: '80px',
                                    height: '80px',
                                    border: '3px double #10B981',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#059669',
                                    background: 'rgba(209, 250, 229, 0.4)',
                                    backdropFilter: 'blur(4px)',
                                    zIndex: 20
                                }}
                            >
                                <CheckCircle size={20} />
                                <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', textAlign: 'center', lineHeight: 1 }}>Verified<br/>Ledger</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Recent Payment Banner */}
                    {!isPaid && recentPaymentDate && (() => {
                        const daysSincePayment = Math.floor((new Date() - new Date(recentPaymentDate)) / (1000 * 60 * 60 * 24));
                        const showBanner = daysSincePayment <= 7;
                        
                        const hasRecentPayments = sale.payments && sale.payments.length > 0;
                        const lastPayment = hasRecentPayments ? sale.payments[sale.payments.length - 1] : null;
                        const lastPaymentDays = lastPayment ? Math.floor((new Date() - new Date(lastPayment.date)) / (1000 * 60 * 60 * 24)) : null;
                        
                        if ((showBanner || (lastPaymentDays !== null && lastPaymentDays <= 7)) && balance > 0) {
                            const displayAmount = lastPaymentAmount || (lastPayment ? lastPayment.amount : 0);
                            const displayDate = recentPaymentDate || (lastPayment ? new Date(lastPayment.date) : new Date());
                            
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                                        border: '2px solid #10B981',
                                        borderRadius: '20px',
                                        padding: '16px 24px',
                                        marginBottom: '24px',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: '#10B981',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <CheckCircle2 size={24} color="white" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <p style={{
                                                fontSize: '14px',
                                                fontWeight: 800,
                                                color: '#065F46',
                                                margin: '0 0 4px 0',
                                                letterSpacing: '-0.01em'
                                            }}>
                                                💚 Recent Payment Received
                                            </p>
                                            <p style={{
                                                fontSize: '13px',
                                                fontWeight: 700,
                                                color: '#047857',
                                                margin: 0
                                            }}>
                                                ₦{(displayAmount || 0).toLocaleString()} paid on {displayDate.toLocaleDateString()} • Balance: ₦{(balance || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        }
                        return null;
                    })()}

                    <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 10vw, 52px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ color: '#94A3B8', fontSize: '14px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {isPaid ? 'Settled on Ledger' : isDebtRecovery ? 'Outstanding Balance' : 'Amount Due'}
                            </span>
                            <span style={{ 
                                background: isPaid 
                                    ? 'linear-gradient(135deg, #10B981, #059669)' 
                                    : isOverdue 
                                        ? 'linear-gradient(to right, #DC2626, #991B1B)' 
                                        : 'linear-gradient(135deg, #4C1D95, #2E1065)', 
                                WebkitBackgroundClip: 'text', 
                                WebkitTextFillColor: 'transparent' 
                            }}>
                                ₦{isPaid ? (sale.totalAmount || 0).toLocaleString() : (balance || 0).toLocaleString()}
                            </span>
                        </h1>
                        <p style={{ color: '#94A3B8', fontWeight: 500, maxWidth: '320px', margin: '0 auto', fontSize: '14px', lineHeight: 1.6 }}>
                            {isPaid 
                                ? `This transaction for #${sale.invoiceNumber} has been fully settled on the Kredibly ledger.` 
                                : sale.invoiceType === 'record'
                                    ? `This is a verified record of payment from ${sale.businessId?.displayName} for #${sale.invoiceNumber}.`
                                    : `This payment for #${sale.invoiceNumber} is requested by ${sale.businessId?.displayName}.`
                            }
                        </p>
                    </header>

                    {/* MAIN CONTENT CARD */}
                    <div className="glass-card" style={{ borderRadius: '32px', overflow: 'hidden' }}>
                        
                        {/* Merchant Banner */}
                        <div style={{ padding: '32px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: '20px' }}>
                             <div style={{ width: '64px', height: '64px', background: 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '2px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                {sale?.businessId?.logoUrl ? <img src={sale.businessId.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={32} />}
                             </div>
                          <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>{sale.businessId?.displayName}</h3>
                                    {sale.businessId?.plan !== 'hustler' && <CheckCircle size={10} color="#3B82F6" style={{ fill: '#3B82F6' }} />}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 900, background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', color: '#64748B' }}>
                                        {sale.businessId?.plan === 'hustler' ? 'Verified Merchant' : 'Official Merchant'}
                                    </span>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>• {sale.businessId?.entityType || 'Business'}</span>
                                </div>
                             </div>
                        </div>

                        {/* Breakdown */}
                        <div style={{ padding: isMobile ? '24px' : '32px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '16px' : '32px', marginBottom: '32px' }}>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Customer</label>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155', margin: 0 }}>{sale.customerName}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Ref Number</label>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155', margin: 0 }}>#{sale.invoiceNumber}</p>
                                </div>
                            </div>

                            <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: isMobile ? '16px' : '24px', border: '1px solid #F1F5F9', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <FileText size={14} color="#94A3B8" />
                                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Description</span>
                                </div>
                                <p style={{ fontSize: isMobile ? '14px' : '15px', fontWeight: 600, color: '#475569', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>"{sale.description}"</p>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid #F8FAFC', borderBottom: '1px solid #F8FAFC', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                     <div style={{ padding: '8px', background: 'rgba(124, 58, 237, 0.08)', borderRadius: '8px' }}><Calendar size={14} color="#7C3AED" /></div>
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', margin: 0 }}>Issued</p>
                                        <p style={{ fontSize: '11px', fontWeight: 700, margin: 0 }}>{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                                {sale.dueDate && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>
                                        <div>
                                            <p style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', margin: 0 }}>Due Date</p>
                                            <p style={{ fontSize: '11px', fontWeight: 700, margin: 0 }}>{new Date(sale.dueDate).toLocaleDateString()}</p>
                                        </div>
                                        <div style={{ padding: '8px', background: '#FEF2F2', borderRadius: '8px' }}><Clock size={14} color="#EF4444" /></div>
                                    </div>
                                )}
                            </div>

                            {/* Payment History (Timeline) - ALWAYS VISIBLE */}
                            {(sale?.payments?.length > 0 || sale?.invoiceType === 'record') && (
                                <div style={{ background: '#F8FAFC', borderRadius: '24px', padding: isMobile ? '20px' : '28px', border: '1px solid #F1F5F9', marginBottom: '32px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                        <div style={{ padding: '6px', background: '#ECFDF5', borderRadius: '8px' }}>
                                            <Clock size={14} color="#10B981" />
                                        </div>
                                        <span style={{ fontSize: '11px', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Payment Ledger</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px dashed #E2E8F0' }}>
                                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Invoice Created</span>
                                            <span style={{ fontSize: '13px', fontWeight: 700 }}>{new Date(sale.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {(sale?.payments || []).filter(p => p.amount > 0).map((p, idx, filteredArr) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: idx === (filteredArr.length - 1) ? 0 : '12px', borderBottom: idx === (filteredArr.length - 1) ? 'none' : '1px dashed #E2E8F0' }}>
                                                <div>
                                                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#10B981', margin: 0 }}>Verified Payment</p>
                                                    <p style={{ fontSize: '10px', color: '#64748B', margin: 0 }}>{new Date(p.date).toLocaleDateString()} via {p.method}</p>
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>+₦{p.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ACTION AREA */}
                        {!isPaid && sale.invoiceType !== 'record' ? (
                            <div style={{ padding: isMobile ? '0 24px 24px' : '0 32px 32px' }}>
                                {sale.businessId?.plan === 'hustler' && (
                                    <div style={{ padding: '12px 16px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '12px', marginBottom: '20px', border: '1px dashed #DDD6FE', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <ShieldCheck size={16} color="#7C3AED" />
                                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#6D28D9' }}>Secure transaction protected by Kredibly infrastructure.</p>
                                    </div>
                                )}

                                {/* Payment Mode Selector */}
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                    <button 
                                        onClick={() => setPaymentMode('full')}
                                        style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '1.5px solid', borderColor: paymentMode === 'full' ? 'var(--primary)' : '#E2E8F0', background: paymentMode === 'full' ? 'var(--primary-glow)' : 'white', cursor: 'pointer', transition: '0.2s' }}
                                    >
                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: paymentMode === 'full' ? 'var(--primary)' : '#94A3B8', textTransform: 'uppercase' }}>Full Balance</p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: 800, color: paymentMode === 'full' ? 'var(--primary)' : '#475569' }}>₦{(balance || 0).toLocaleString()}</p>
                                    </button>
                                    <button 
                                        onClick={() => setPaymentMode('partial')}
                                        style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '1.5px solid', borderColor: paymentMode === 'partial' ? 'var(--primary)' : '#E2E8F0', background: paymentMode === 'partial' ? 'var(--primary-glow)' : 'white', cursor: 'pointer', transition: '0.2s' }}
                                    >
                                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: paymentMode === 'partial' ? 'var(--primary)' : '#94A3B8', textTransform: 'uppercase' }}>Other Amount</p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: 800, color: paymentMode === 'partial' ? 'var(--primary)' : '#475569' }}>Installment</p>
                                    </button>
                                </div>

                                {/* Custom Amount Input */}
                                <AnimatePresence mode="wait">
                                    {paymentMode === 'partial' && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{ marginBottom: '24px', overflow: 'hidden' }}
                                        >
                                            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '18px', border: '1.5px solid #E2E8F0' }}>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Enter Amount (₦)</label>
                                                <input 
                                                    type="text"
                                                    value={customAmountDisplay}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                                        setCustomAmount(value);
                                                        setCustomAmountDisplay(value ? `₦${parseInt(value).toLocaleString()}` : '');
                                                    }}
                                                    placeholder="₦20,000"
                                                    style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '24px', fontWeight: 900, color: '#0F172A', outline: 'none' }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                        {/* ── NOMBA BANK TRANSFER (PRIMARY) ── */}
                                        <AnimatePresence mode="wait">
                                            {nombaData ? (
                                                <motion.div
                                                    key="nomba-details"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '2px dashed #10B981', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.1)' }}
                                                >
                                                    <p style={{ margin: 0, fontSize: '11px', fontWeight: 900, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Transfer exactly this amount</p>
                                                    <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#0F172A', margin: '4px 0 20px' }}>₦{(nombaData.amount || 0).toLocaleString()}</h2>

                                                    <div style={{ background: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #E2E8F0', marginBottom: '16px', position: 'relative' }}>
                                                        <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', alignItems: 'center', gap: '6px', background: '#FEF2F2', padding: '5px 10px', borderRadius: '100px', border: '1px solid #FEE2E2' }}>
                                                            <Clock size={12} color="#EF4444" />
                                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', letterSpacing: '0.5px' }}>{timeLeft || '29:59'}</span>
                                                        </div>
                                                        <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Account Number</p>
                                                        <p style={{ margin: 0, fontSize: isMobile ? '24px' : '32px', fontWeight: 900, color: '#4C1D95', letterSpacing: isMobile ? '1px' : '3px', userSelect: 'all', wordBreak: 'break-all', lineHeight: 1.2 }}>{nombaData.accountNumber}</p>
                                                        <p style={{ margin: '10px 0 2px', fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{nombaData.bankName}</p>
                                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#475569' }}>{nombaData.accountName}</p>
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(nombaData.accountNumber);
                                                            toast.success('Account number copied!');
                                                        }}
                                                        style={{ width: '100%', padding: '13px', background: '#4C1D95', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', marginBottom: '12px' }}
                                                    >
                                                        Copy Account Number
                                                    </button>

                                                    <motion.button
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={handleManualVerification}
                                                        disabled={verifyingPayment}
                                                        style={{
                                                            width: '100%',
                                                            padding: '13px',
                                                            background: '#F1F5F9',
                                                            color: '#475569',
                                                            borderRadius: '10px',
                                                            border: '1px solid #E2E8F0',
                                                            fontSize: '13px',
                                                            fontWeight: 800,
                                                            cursor: verifyingPayment ? 'not-allowed' : 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                            marginBottom: '12px'
                                                        }}
                                                    >
                                                        {verifyingPayment ? <Loader2 size={16} className="spin-animation" /> : <ShieldCheck size={16} />}
                                                        <span>{verifyingPayment ? 'Verifying...' : 'I have made the transfer'}</span>
                                                    </motion.button>

                                                    <div style={{ padding: '10px 16px', background: '#ECFDF5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                        <Loader2 size={15} className="spin-animation" color="#10B981" />
                                                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#047857' }}>Waiting for transfer... this page updates automatically</span>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.button
                                                    key="nomba-init"
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    onClick={handleNombaInitialization}
                                                    disabled={loadingNomba}
                                                    style={{
                                                        width: '100%',
                                                        padding: isMobile ? '18px' : '22px',
                                                        background: isOverdue ? 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)' : 'linear-gradient(135deg, #4C1D95 0%, #2E1065 100%)',
                                                        color: 'white',
                                                        borderRadius: '16px',
                                                        border: 'none',
                                                        fontWeight: 800,
                                                        fontSize: isMobile ? '16px' : '18px',
                                                        cursor: loadingNomba ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '12px',
                                                        boxShadow: isOverdue ? '0 12px 20px rgba(239, 68, 68, 0.25)' : '0 12px 20px rgba(76, 29, 149, 0.3)',
                                                        opacity: loadingNomba ? 0.7 : 1
                                                    }}
                                                >
                                                    {loadingNomba ? <Loader2 size={22} className="spin-animation" /> : <Building2 size={22} />}
                                                    <span>
                                                        {loadingNomba 
                                                            ? 'Generating Bank Details...' 
                                                            : `Pay ₦${(paymentMode === 'full' ? balance : (parseFloat(customAmount) || 0)).toLocaleString()} via Bank Transfer`}
                                                    </span>
                                                </motion.button>
                                            )}
                                        </AnimatePresence>

                                        {/* ── PAYSTACK CARD / FALLBACK (SECONDARY) ── */}
                                        <div style={{ position: 'relative', margin: '4px 0' }}>
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}><div style={{ width: '100%', borderTop: '1px solid #F1F5F9' }} /></div>
                                            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                                <span style={{ background: 'white', padding: '0 12px', fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>or pay with card</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handlePaystackPayment('card')}
                                            disabled={verifying}
                                            style={{
                                                width: '100%',
                                                padding: '14px',
                                                background: 'white',
                                                color: '#475569',
                                                borderRadius: '12px',
                                                border: '1.5px solid #E2E8F0',
                                                fontWeight: 700,
                                                fontSize: '14px',
                                                cursor: verifying ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            {verifying ? <Loader2 size={16} className="spin-animation" /> : <CreditCard size={16} color="#475569" />}
                                            <span>Pay with Card (Paystack)</span>
                                        </button>

                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <ShieldCheck size={16} color="#10B981" /> 100% Secure Instant Settlement
                                </div>

                                {verifying && (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', fontWeight: 600, marginTop: '16px' }}
                                    >
                                        Please don't refresh while we secure your transaction...
                                    </motion.p>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', opacity: 0.5 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShieldCheck size={14} color="#10B981" />
                                            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>Secure 256-bit SSL</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ textAlign: 'center', padding: isMobile ? '0 24px 32px' : '0 40px 48px' }}
                            >
                                <div style={{ 
                                    padding: isMobile ? '32px 16px' : '48px 24px', 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '24px'
                                }}>
                                    <div style={{ 
                                        width: '130px', 
                                        height: '130px', 
                                        border: '6px double #10B981', 
                                        borderRadius: '50%', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        transform: 'rotate(-15deg)', 
                                        opacity: 0.95, 
                                        background: 'rgba(255, 255, 255, 0.95)', 
                                        zIndex: 10,
                                        boxShadow: '0 4px 10px rgba(16, 185, 129, 0.1)',
                                        marginBottom: '32px'
                                    }}>
                                        <span style={{ color: '#10B981', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>OFFICIALLY</span>
                                        <span style={{ color: '#10B981', fontSize: '22px', fontWeight: 950, textTransform: 'uppercase', margin: '-4px 0' }}>SETTLED</span>
                                        <div style={{ height: '2px', width: '70%', background: '#10B981', margin: '4px 0' }} />
                                        <span style={{ color: '#10B981', fontSize: '9px', fontWeight: 800 }}>{new Date().toLocaleDateString()}</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <h4 style={{ margin: '0 0 8px 0', fontSize: isMobile ? '22px' : '28px', fontWeight: 950, color: '#0F172A', letterSpacing: '-0.02em' }}>Payment Fully Settled</h4>
                                        <p style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: 600, color: '#64748B', maxWidth: '320px', margin: '0 auto' }}>
                                            Your transaction has been verified and permanently logged on the Kredibly ledger.
                                        </p>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleDownloadPDF}
                                    disabled={!!generating}
                                    style={{ 
                                        width: '100%', 
                                        padding: '20px', 
                                        background: 'var(--primary)', 
                                        color: 'white', 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        fontWeight: 900, 
                                        fontSize: '18px', 
                                        cursor: generating ? 'not-allowed' : 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        gap: '12px',
                                        boxShadow: '0 10px 15px -3px var(--primary-glow)'
                                    }}
                                >
                                    {generating === 'pdf' ? <Loader2 size={18} className="spin-animation" /> : <Download size={18} />}
                                    <span>{generating === 'pdf' ? 'Preparing PDF...' : 'Download Official Receipt'}</span>
                                </button>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginTop: '12px' }}>
                                    <button 
                                        onClick={handleDownloadImage}
                                        disabled={!!generating}
                                        style={{ 
                                            width: '100%',
                                            padding: '18px', 
                                            background: 'white', 
                                            border: '1px solid var(--border)', 
                                            borderRadius: '16px', 
                                            fontSize: '16px', 
                                            fontWeight: 800, 
                                            color: '#000000', 
                                            cursor: 'pointer', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            gap: '10px' 
                                        }}
                                    >
                                        <ImageIcon size={18} /> Save as Image
                                    </button>
                                </div>
                                
                                <p style={{ fontSize: '11px', fontWeight: 750, color: '#94A3B8', marginTop: '24px' }}>Verified Settlement • Reference KR-{sale.invoiceNumber}</p>
                            </motion.div>
                        )}
                    </div>

                    {/* Powered by Kredibly Badge */}
                    <div style={{ marginTop: '16px', textAlign: 'center', borderTop: '1px solid #F8FAFC', paddingTop: '16px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#F8FAFC', borderRadius: '100px', border: '1px solid #F1F5F9' }}>
                            <img src="/krediblyrevamped.png" style={{ height: '14px', filter: 'brightness(1.1) contrast(1.1)' }} alt="Kredibly" />
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Powered by Kredibly</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '16px', textAlign: 'center', padding: '24px 0', borderTop: '1px solid #F1F5F9' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', lineHeight: 1.8, maxWidth: '400px', margin: '0 auto' }}>
                            Kredibly is the intelligent ledger for modern commerce. Secure, transparent, and built for scale. © 2026.
                        </p>
                    </div>
                </motion.div>
            </main>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .invoice-main-content { padding: 40px 16px 0; }
                @media (min-width: 768px) { .invoice-main-content { padding: 80px 16px 0; } }
                @media (max-width: 480px) { .spin-animation { width: 16px !important; height: 16px !important; } }
                .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05); }
                .hover-scale { transition: transform 0.2s; }
                .hover-scale:hover { transform: scale(1.02); }
            ` }} />
            </div>

            <PaymentSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                amountPaid={lastPaymentAmount}
                balanceRemaining={sale ? sale.totalAmount - sale.paidAmount : 0}
                onDownloadReceipt={handleDownloadPDF}
                shareUrl={window.location.origin + "/r/" + id}
                shareText={`I've just made a payment of ₦${lastPaymentAmount?.toLocaleString()} to ${sale?.businessId?.displayName}! View my verified receipt here:`}
            />
        </div>
    );
};

export default PublicInvoicePage;
