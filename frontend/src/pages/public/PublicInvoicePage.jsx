import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import {
    ShieldCheck,
    Clock,
    Wallet,
    Calendar,
    FileText,
    Copy,
    CheckCircle2,
    ExternalLink,
    AlertCircle,
    Loader2,
    Share2,
    Building2,
    CheckCircle,
    HelpCircle,
    Instagram,
    Twitter,
    Facebook
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";

const PublicInvoicePage = () => {
    const { id } = useParams();
    const [sale, setSale] = useState(null);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [paymentMode, setPaymentMode] = useState("full"); // "full" or "partial"
    const [customAmount, setCustomAmount] = useState("");

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    useEffect(() => {
        if (sale) {
            // Strategic SEO & Browser Tab updates
            const pageTitle = `Invoice Issued: ₦${sale.totalAmount.toLocaleString()} from ${sale.businessId?.displayName}`;
            document.title = pageTitle;

            // Attempt to update meta tags for smarter crawlers
            const updateMeta = (property, content) => {
                let meta = document.querySelector(`meta[property="${property}"]`) || 
                           document.querySelector(`meta[name="${property}"]`);
                if (meta) meta.setAttribute('content', content);
            };

            const invoiceDesc = `An official invoice has been issued to you by ${sale.businessId?.displayName} for ${sale.description}. Total: ₦${sale.totalAmount.toLocaleString()}.`;
            
            updateMeta('og:title', pageTitle);
            updateMeta('og:description', invoiceDesc);
            updateMeta('og:image', 'https://usekredibly.com/og-receipt-preview.png');
            updateMeta('twitter:title', pageTitle);
            updateMeta('twitter:description', invoiceDesc);
            updateMeta('twitter:image', 'https://usekredibly.com/og-receipt-preview.png');
        }
    }, [sale]);

    const fetchInvoice = async () => {
        try {
            const res = await axios.get(`${API_BASE}/payments/invoice/${id}`);
            if (res.data.success) {
                setSale(res.data.data);
            }
        } catch (err) {
            toast.error("Invoice not found or expired");
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                const shareUrl = `${API_BASE}/payments/share/${sale.invoiceNumber}`;
                await navigator.share({
                    title: `Official Invoice from ${sale?.business?.displayName}`,
                    text: `This is a verified payment request of ₦${sale?.totalAmount.toLocaleString()} from ${sale?.business?.displayName}. Click to safely view details and pay:`,
                    url: shareUrl,
                });
            } catch (err) {
                // User cancelled or share failed
            }
        } else {
            const shareUrl = `${API_BASE}/payments/share/${sale?.invoiceNumber}`;
            navigator.clipboard.writeText(shareUrl);
            toast.success("Secure link copied to clipboard!");
        }
    };

    const handlePaystackPayment = () => {
        if (!sale) return;
        
        if (!window.PaystackPop) {
            toast.error("Payment system still loading. Please wait a second and try again.");
            return;
        }

        const balance = sale.totalAmount - sale.paidAmount;
        let finalAmount = balance;

        if (paymentMode === "partial") {
            const parsed = parseFloat(customAmount);
            if (!parsed || parsed < 100) {
                toast.error("Minimum payment is ₦100");
                return;
            }
            if (parsed > balance) {
                toast.error(`Amount exceeds balance (₦${balance.toLocaleString()})`);
                return;
            }
            finalAmount = parsed;
        }

        const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder', 
            email: sale.customerEmail || 'customer@usekredibly.com',
            amount: Math.round(finalAmount * 100), // in kobo
            currency: 'NGN',
            ref: `KRED_${sale.invoiceNumber}_${Date.now()}`,
            metadata: {
                invoiceNumber: sale.invoiceNumber,
                customerName: sale.customerName,
                custom_fields: [
                    {
                        display_name: "Invoice Number",
                        variable_name: "invoice_number",
                        value: sale.invoiceNumber
                    }
                ]
            },
            callback: function (response) {
                toast.success("Payment Received! Updating ledger...");
                setVerifying(true);
                setTimeout(() => {
                    fetchInvoice();
                    setVerifying(false);
                }, 3000);
            },
            onClose: function () {
                toast.info("Payment window closed.");
            }
        });
        handler.openIframe();
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FDFCFE' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px', marginBottom: '24px' }}>
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    style={{ position: 'absolute', inset: 0, border: '4px solid #F3E8FF', borderRadius: '50%', borderTopColor: '#7C3AED' }}
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
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>Invoice Unavailable</h1>
            <p style={{ color: '#64748B', maxWidth: '320px', margin: '0 auto', lineHeight: 1.6 }}>This invoice might have been settled, archived, or the link is simply incorrect.</p>
            <Link to="/home" style={{ marginTop: '32px', padding: '12px 32px', background: '#0F172A', color: 'white', borderRadius: '100px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Return Home</Link>
        </div>
    );

    const balance = sale.totalAmount - sale.paidAmount;
    const isPaid = sale.status === 'paid' || balance <= 0;
    const isOverdue = !isPaid && sale.dueDate && new Date(sale.dueDate) < new Date();
    const isDebtRecovery = !isPaid && (sale.status === 'partial' || isOverdue);

    // STYLE OBJECTS FOR PURE CSS
    const containerStyle = { minHeight: '100vh', background: '#FAFAFC', color: '#1A1A1A', paddingBottom: '80px', overflowX: 'hidden', position: 'relative' };
    const maxW2xl = { maxWidth: '672px', margin: '0 auto' };
    const flexBtw = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
    
    return (
        <div style={containerStyle}>
            {/* Background elements */}
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '500px', background: 'linear-gradient(to bottom, rgba(245, 243, 255, 0.5), transparent)', pointerEvents: 'none' }} />

            {/* Navbar */}
            <nav style={{ ...maxW2xl, position: 'relative', zIndex: 10, padding: '24px', ...flexBtw }}>
                <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '24px' }} />
                <button 
                    onClick={handleShare}
                    style={{ padding: '12px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', borderRadius: '50%', border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer' }}
                >
                    <Share2 size={18} color="#475569" />
                </button>
            </nav>

            <main style={{ ...maxW2xl, position: 'relative', zIndex: 10, padding: '0 16px' }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    
                    {/* Status Pill */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <div style={{ 
                            padding: '6px 16px', borderRadius: '100px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid',
                            backgroundColor: isPaid ? '#ECFDF5' : 'white',
                            color: isPaid ? '#059669' : '#7C3AED',
                            borderColor: isPaid ? '#D1FAE5' : '#F3E8FF'
                        }}>
                             <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isPaid ? '#10B981' : isOverdue ? '#EF4444' : '#8B5CF6' }} />
                             {isPaid ? 'Settled on Ledger' : isOverdue ? 'Overdue Payment' : 'Payment Awaiting'}
                        </div>
                    </div>

                    {/* HERO SECTION */}
                    <header style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '52px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ color: '#94A3B8', fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
                                {isPaid ? 'Total Amount' : isDebtRecovery ? 'Outstanding Balance' : 'Amount Due'}
                            </span>
                            <span style={{ background: isOverdue ? 'linear-gradient(to right, #DC2626, #991B1B)' : 'linear-gradient(to right, #0F172A, #4C1D95)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                ₦{isPaid ? sale.totalAmount.toLocaleString() : balance.toLocaleString()}
                            </span>
                        </h1>
                        <p style={{ color: '#94A3B8', fontWeight: 500, maxWidth: '320px', margin: '0 auto', fontSize: '14px', lineHeight: 1.6 }}>
                            {isPaid 
                                ? `Invoice #${sale.invoiceNumber} has been fully settled. Thank you for your business!` 
                                : `This payment for #${sale.invoiceNumber} is requested by ${sale.businessId?.displayName}.`
                            }
                        </p>
                    </header>

                    {/* MAIN CONTENT CARD */}
                    <div style={{ background: 'white', borderRadius: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.04), 0 10px 10px -5px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                        
                        {/* Merchant Banner */}
                        <div style={{ padding: '32px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: '20px' }}>
                             <div style={{ width: '64px', height: '64px', background: 'linear-gradient(to bottom right, #7C3AED, #4338CA)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '2px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                {sale.businessId?.logoUrl ? <img src={sale.businessId.logoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={32} />}
                             </div>
                             <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>{sale.businessId?.displayName}</h3>
                                    <CheckCircle size={10} color="#3B82F6" style={{ fill: '#3B82F6' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 900, background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', color: '#64748B' }}>Verified Merchant</span>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>• {sale.businessId?.entityType || 'Business'}</span>
                                </div>
                             </div>
                        </div>

                        {/* Breakdown */}
                        <div style={{ padding: '32px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Customer</label>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{sale.customerName}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <label style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>Ref Number</label>
                                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>#{sale.invoiceNumber}</p>
                                </div>
                            </div>

                            <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '24px', border: '1px solid #F1F5F9', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <FileText size={14} color="#94A3B8" />
                                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Description</span>
                                </div>
                                <p style={{ fontSize: '15px', fontWeight: 600, color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>"{sale.description}"</p>
                            </div>

                            <div style={{ ...flexBtw, padding: '16px 0', borderTop: '1px solid #F8FAFC', borderBottom: '1px solid #F8FAFC', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '8px', background: '#F5F3FF', borderRadius: '8px' }}><Calendar size={14} color="#7C3AED" /></div>
                                    <div>
                                        <p style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Issued</p>
                                        <p style={{ fontSize: '11px', fontWeight: 700 }}>{new Date(sale.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                {sale.dueDate && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>
                                        <div>
                                            <p style={{ fontSize: '9px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>Due Date</p>
                                            <p style={{ fontSize: '11px', fontWeight: 700 }}>{new Date(sale.dueDate).toLocaleDateString()}</p>
                                        </div>
                                        <div style={{ padding: '8px', background: '#FEF2F2', borderRadius: '8px' }}><Clock size={14} color="#EF4444" /></div>
                                    </div>
                                )}
                            </div>

                            {!isPaid ? (
                                <div>
                                    {/* Payment Mode Selector */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                                        <button 
                                            onClick={() => setPaymentMode('full')}
                                            style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '1.5px solid', borderColor: paymentMode === 'full' ? '#7C3AED' : '#E2E8F0', background: paymentMode === 'full' ? '#F5F3FF' : 'white', cursor: 'pointer', transition: '0.2s' }}
                                        >
                                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: paymentMode === 'full' ? '#7C3AED' : '#94A3B8', textTransform: 'uppercase' }}>Full Balance</p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: 800, color: paymentMode === 'full' ? '#7C3AED' : '#475569' }}>₦{balance.toLocaleString()}</p>
                                        </button>
                                        <button 
                                            onClick={() => setPaymentMode('partial')}
                                            style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '1.5px solid', borderColor: paymentMode === 'partial' ? '#7C3AED' : '#E2E8F0', background: paymentMode === 'partial' ? '#F5F3FF' : 'white', cursor: 'pointer', transition: '0.2s' }}
                                        >
                                            <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: paymentMode === 'partial' ? '#7C3AED' : '#94A3B8', textTransform: 'uppercase' }}>Other Amount</p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '15px', fontWeight: 800, color: paymentMode === 'partial' ? '#7C3AED' : '#475569' }}>Installment</p>
                                        </button>
                                    </div>

                                    {/* Custom Amount Input */}
                                    <AnimatePresence>
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
                                                        type="number"
                                                        value={customAmount}
                                                        onChange={(e) => setCustomAmount(e.target.value)}
                                                        placeholder="e.g. 20000"
                                                        style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '24px', fontWeight: 900, color: '#0F172A', outline: 'none' }}
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button 
                                        onClick={handlePaystackPayment}
                                        disabled={verifying}
                                        style={{ width: '100%', padding: '20px', background: isOverdue ? '#DC2626' : '#1e144d', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 900, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 15px -3px rgba(30, 20, 77, 0.2)' }}
                                    >
                                        {verifying ? <Loader2 size={20} className="spin-animation" /> : <><Wallet size={20} /> <span>{isOverdue ? 'Clear Outstanding Now' : 'Secure Checkout'}</span></>}
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShieldCheck size={14} color="#10B981" /> SSL Encrypted Payment
                                        </p>
                                        <img src="https://paystack.com/assets/img/login/paystack-logo.png" style={{ height: '12px', opacity: 0.3 }} />
                                    </div>
                                </div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    style={{ background: '#F8FAFC', borderRadius: '24px', overflow: 'hidden', border: '1px dashed #10B981' }}
                                >
                                    <div style={{ background: '#10B981', padding: '24px', textAlign: 'center', color: 'white' }}>
                                        <CheckCircle2 size={32} color="white" style={{ margin: '0 auto 12px' }} />
                                        <h3 style={{ fontSize: '18px', fontWeight: 900 }}>Payment Received!</h3>
                                        <p style={{ fontSize: '10px', fontWeight: 700, opacity: 0.9, textTransform: 'uppercase' }}>Verified Official Receipt</p>
                                    </div>
                                    
                                    <div style={{ padding: '24px' }}>
                                        <div style={{ marginBottom: '20px' }}>
                                            <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Total Settled</p>
                                            <p style={{ fontSize: '24px', fontWeight: 900, color: '#0F172A' }}>₦{sale.paidAmount.toLocaleString()}</p>
                                        </div>

                                        <div style={{ borderTop: '1px solid #EDF2F7', paddingTop: '16px', marginBottom: '24px' }}>
                                            <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '12px' }}>Payment History</p>
                                            {sale.payments.map((p, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{new Date(p.date).toLocaleDateString()}</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>₦{p.amount.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button 
                                            onClick={() => {
                                                const text = `Hello! I've just made a payment of ₦${sale.paidAmount.toLocaleString()} to ${sale.businessId?.displayName} for ${sale.description}. You can verify my receipt here: ${window.location.href}`;
                                                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                                                window.open(whatsappUrl, '_blank');
                                            }}
                                            style={{ width: '100%', padding: '16px', background: 'white', border: '2px solid #10B981', color: '#10B981', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            <Share2 size={18} /> Share Confirmation
                                        </button>
                                        
                                        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                                            This link serves as your permanent proof of payment.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Powered by Kredibly Badge */}
                            <div style={{ marginTop: '32px', textAlign: 'center', borderTop: '1px solid #F8FAFC', paddingTop: '24px' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#F8FAFC', borderRadius: '100px', border: '1px solid #F1F5F9' }}>
                                    <img src="/krediblyrevamped.png" style={{ height: '14px', filter: 'brightness(1.1) contrast(1.1)' }} alt="Kredibly" />
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Powered by Kredibly</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Reassurance */}
                    <div style={{ marginTop: '48px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '40px' }}>
                            {[
                                { i: ShieldCheck, l: "Trust Score", v: "+12 pts" },
                                { i: CheckCircle, l: "Verified", v: "On Chain" },
                                { i: Building2, l: "Settlement", v: "Direct" }
                            ].map((item, idx) => (
                                <div key={idx} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                                    <item.i size={16} color="#7C3AED" style={{ margin: '0 auto 8px' }} />
                                    <p style={{ fontSize: '8px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase' }}>{item.l}</p>
                                    <p style={{ fontSize: '10px', fontWeight: 900 }}>{item.v}</p>
                                </div>
                            ))}
                        </div>

                        <footer style={{ textAlign: 'center', padding: '40px 0', borderTop: '1px solid #F1F5F9' }}>
                            <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '22px', filter: 'grayscale(0.5) contrast(1.2)', margin: '0 auto 24px' }} />
                            <p style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', lineHeight: 1.8, maxWidth: '400px', margin: '0 auto' }}>
                                Kredibly is a decentralized financial trust ledger. Every record is secured to ensure merchant and customer transparency. © 2026.
                            </p>
                        </footer>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default PublicInvoicePage;
