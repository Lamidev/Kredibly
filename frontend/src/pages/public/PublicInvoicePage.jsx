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

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            const res = await axios.get(`${API_BASE}/payments/invoice/${id}`);
            setSale(res.data);
        } catch (err) {
            toast.error("Invoice not found or expired");
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Invoice from ${sale?.business?.displayName}`,
                    text: `Payment of ₦${sale?.totalAmount.toLocaleString()} is due for ${sale?.description}`,
                    url: window.location.href,
                });
            } catch (err) {
                // User cancelled or share failed
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied to clipboard!");
        }
    };

    const handlePaystackPayment = () => {
        if (!sale) return;
        
        if (!window.PaystackPop) {
            toast.error("Payment system still loading. Please wait a second and try again.");
            return;
        }

        const balance = sale.totalAmount - sale.paidAmount;

        const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder', 
            email: sale.customerEmail || 'customer@usekredibly.com',
            amount: Math.round(balance * 100), // in kobo
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
            <Link to="/" style={{ marginTop: '32px', padding: '12px 32px', background: '#0F172A', color: 'white', borderRadius: '100px', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}>Return Home</Link>
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
                                : `This payment for #${sale.invoiceNumber} is requested by ${sale.business?.displayName}.`
                            }
                        </p>
                    </header>

                    {/* MAIN CONTENT CARD */}
                    <div style={{ background: 'white', borderRadius: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.04), 0 10px 10px -5px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                        
                        {/* Merchant Banner */}
                        <div style={{ padding: '32px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: '20px' }}>
                             <div style={{ width: '64px', height: '64px', background: 'linear-gradient(to bottom right, #7C3AED, #4338CA)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '2px solid white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                {sale.business?.logoUrl ? <img src={sale.business.logoUrl} style={{ width: '100%', height: '100%', objectCover: 'cover' }} /> : <Building2 size={32} />}
                             </div>
                             <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#0F172A' }}>{sale.business?.displayName}</h3>
                                    <CheckCircle size={10} color="#3B82F6" style={{ fill: '#3B82F6' }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '9px', fontWeight: 900, background: '#F1F5F9', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', color: '#64748B' }}>Verified Merchant</span>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8' }}>• {sale.business?.entityType || 'Business'}</span>
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
                                    <button 
                                        onClick={handlePaystackPayment}
                                        disabled={verifying}
                                        style={{ width: '100%', padding: '20px', background: '#1e144d', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 900, fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxShadow: '0 10px 15px -3px rgba(30, 20, 77, 0.2)' }}
                                    >
                                        {verifying ? <Loader2 size={20} className="spin-animation" /> : <><Wallet size={20} /> <span>Secure Checkout</span></>}
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                                        <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <ShieldCheck size={14} color="#10B981" /> SSL Encrypted Payment
                                        </p>
                                        <img src="https://paystack.com/assets/img/login/paystack-logo.png" style={{ height: '12px', opacity: 0.3 }} />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ background: '#10B981', padding: '32px', borderRadius: '24px', textAlign: 'center', color: 'white' }}>
                                    <CheckCircle2 size={40} color="white" style={{ margin: '0 auto 16px' }} />
                                    <h3 style={{ fontSize: '20px', fontWeight: 900 }}>Payment Successful!</h3>
                                    <p style={{ fontSize: '12px', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', marginTop: '4px' }}>Ledger Updated Automatically</p>
                                </div>
                            )}
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
                            <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '20px', opacity: 0.3, margin: '0 auto 24px' }} />
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
