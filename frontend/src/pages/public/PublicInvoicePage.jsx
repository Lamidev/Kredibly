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
            email: sale.customerEmail || 'customer@kredibly.com',
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFCFE]">
            <div className="relative w-24 h-24 mb-6">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-purple-100 rounded-full border-t-purple-600"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/krediblyrevamped.png" alt="" className="h-6 opacity-30" />
                </div>
            </div>
            <p className="text-sm font-bold text-purple-900/40 uppercase tracking-[0.2em]">Secure Connection</p>
        </div>
    );

    if (!sale) return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-[#FDFCFE]">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Invoice Unavailable</h1>
            <p className="text-slate-500 max-w-xs mx-auto leading-relaxed">This invoice might have been settled, archived, or the link is simply incorrect.</p>
            <Link to="/" className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-full font-bold text-sm transition-transform active:scale-95 shadow-lg">Return Home</Link>
        </div>
    );

    const balance = sale.totalAmount - sale.paidAmount;
    const isPaid = sale.status === 'paid' || balance <= 0;
    const isOverdue = !isPaid && sale.dueDate && new Date(sale.dueDate) < new Date();
    const isDebtRecovery = !isPaid && (sale.status === 'partial' || isOverdue);

    return (
        <div className="min-h-screen bg-[#FAFAFC] text-[#1A1A1A] font-sans selection:bg-purple-100 pb-20 overflow-x-hidden">
            {/* Ambient Background Elements */}
            <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-50/50 to-transparent pointer-events-none" />
            <div className="fixed -top-20 -right-20 w-80 h-80 bg-purple-200/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="fixed -bottom-20 -left-20 w-80 h-80 bg-blue-100/20 blur-[100px] rounded-full pointer-events-none" />

            {/* Navbar */}
            <nav className="relative z-10 p-6 flex justify-between items-center max-w-2xl mx-auto">
                <img src="/krediblyrevamped.png" alt="Kredibly" className="h-6" />
                <button 
                    onClick={handleShare}
                    className="p-3 bg-white/80 backdrop-blur-md rounded-full border border-slate-200 shadow-sm transition-all hover:bg-white active:scale-90"
                >
                    <Share2 size={18} className="text-slate-600" />
                </button>
            </nav>

            <main className="relative z-10 px-4 max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                    {/* Status Pill */}
                    <div className="flex justify-center mb-6">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-2 shadow-sm border ${
                            isPaid 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-white text-purple-600 border-purple-100'
                        }`}>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${isPaid ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-purple-500'}`} />
                            {isPaid ? 'Settled on Ledger' : isOverdue ? 'Overdue Payment' : 'Payment Awaiting'}
                        </div>
                    </div>

                    {/* HERO SECTION */}
                    <header className="text-center mb-10">
                        <h1 className="text-[52px] leading-tight font-black tracking-tight mb-4 flex flex-col items-center">
                            <span className="text-slate-400 text-xl font-bold mb-1">
                                {isPaid ? 'Total Amount' : isDebtRecovery ? 'Outstanding Balance' : 'Amount Due'}
                            </span>
                            <span className={`bg-gradient-to-tr bg-clip-text text-transparent ${isOverdue ? 'from-red-600 via-red-800' : 'from-slate-900 via-slate-800'} to-purple-900`}>
                                ₦{isPaid ? sale.totalAmount.toLocaleString() : balance.toLocaleString()}
                            </span>
                        </h1>
                        <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                            {isPaid 
                                ? `Invoice #${sale.invoiceNumber} has been fully settled. Thank you for your business!` 
                                : `This payment for #${sale.invoiceNumber} is requested by ${sale.business?.displayName}.`
                            }
                        </p>
                    </header>

                    {/* MAIN CONTENT CARD */}
                    <div className="bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
                        
                        {/* Merchant Profile Banner */}
                        <div className="p-8 border-b border-slate-50 relative overflow-hidden group">
                           <div className="absolute inset-0 bg-gradient-to-r from-purple-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           <div className="flex items-center gap-5 relative z-10">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden border-2 border-white">
                                    {sale.business?.logoUrl ? (
                                        <img src={sale.business.logoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 size={32} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-lg font-black text-slate-900">{sale.business?.displayName}</h3>
                                        <div className="bg-blue-50 p-0.5 rounded-full border border-blue-100">
                                            <CheckCircle size={10} className="text-blue-500 fill-blue-500" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-black text-slate-500 rounded uppercase tracking-wider uppercase">Verified Merchant</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                        <span className="text-[11px] font-bold text-slate-400 capitalize">{sale.business?.entityType || 'Business'}</span>
                                    </div>
                                </div>
                           </div>
                        </div>

                        {/* Invoice Breakdown */}
                        <div className="p-8 space-y-8">
                            
                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Customer</label>
                                    <p className="text-sm font-bold text-slate-700">{sale.customerName}</p>
                                </div>
                                <div className="text-right">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Reference Code</label>
                                    <p className="text-sm font-bold text-slate-700">#{sale.invoiceNumber}</p>
                                </div>
                            </div>

                            {/* Line Items / Description */}
                            <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Description</span>
                                </div>
                                <p className="text-[15px] font-semibold text-slate-600 leading-relaxed italic">
                                    "{sale.description}"
                                </p>
                            </div>

                            {/* Timeline Info */}
                            <div className="flex items-center justify-between py-4 border-y border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 rounded-lg">
                                        <Calendar size={14} className="text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date Issued</p>
                                        <p className="text-[11px] font-bold text-slate-700">{new Date(sale.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                {sale.dueDate && (
                                    <div className="flex items-center gap-3 text-right">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Due Date</p>
                                            <p className="text-[11px] font-bold text-slate-700">{new Date(sale.dueDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                        <div className="p-2 bg-red-50 rounded-lg">
                                            <Clock size={14} className="text-red-600" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Payment Actions */}
                            {!isPaid ? (
                                <div className="space-y-6 pt-2">
                                    <motion.button 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handlePaystackPayment}
                                        disabled={verifying}
                                        className="w-full relative group"
                                    >
                                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-[20px] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                                        <div className="relative w-full bg-[#1e144d] hover:bg-[#150e35] text-white font-black py-5 rounded-[20px] transition-all flex items-center justify-center gap-4 text-lg shadow-xl shadow-purple-900/10">
                                            {verifying ? (
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="animate-spin" size={20} />
                                                    <span className="text-sm uppercase tracking-widest">Verifying Transaction...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Wallet size={22} className="text-purple-300" />
                                                    <span>Secure Checkout</span>
                                                </>
                                            )}
                                        </div>
                                    </motion.button>
                                    
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <ShieldCheck size={14} className="text-emerald-500" />
                                            SSL Encrypted Payment System
                                        </div>
                                        <div className="flex items-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all">
                                            <p className="text-[8px] font-bold text-slate-500">SECURELY POWERED BY</p>
                                            <img src="https://paystack.com/assets/img/login/paystack-logo.png" alt="Paystack" className="h-2.5" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <motion.div 
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-emerald-500 rounded-[24px] p-8 text-center text-white relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <CheckCircle2 size={120} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30 backdrop-blur-sm">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h3 className="text-2xl font-black mb-1">Payment Successful!</h3>
                                        <p className="text-emerald-50/70 font-bold text-sm uppercase tracking-widest">Ledger Updated Automatically</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Footer Reassurance */}
                    <div className="mt-12 space-y-10">
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { icon: ShieldCheck, label: "Trust Score", val: "+12 pts" },
                                { icon: CheckCircle, label: "Verified", val: "On Chain" },
                                { icon: Building2, label: "Settlement", val: "Direct" }
                            ].map((item, i) => (
                                <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                                    <item.icon size={16} className="mx-auto mb-2 text-purple-600" />
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{item.label}</p>
                                    <p className="text-[10px] font-black text-slate-900">{item.val}</p>
                                </div>
                            ))}
                        </div>

                        {/* Customer Support Block */}
                        <div className="text-center space-y-4">
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Need help with this invoice?</p>
                            <div className="flex justify-center gap-4">
                                <button className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full border border-slate-200 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
                                    <HelpCircle size={14} />
                                    Support Center
                                </button>
                                <button className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full border border-slate-200 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all">
                                    <ExternalLink size={14} />
                                    Verify Merchant
                                </button>
                            </div>
                        </div>

                        {/* Legal & Branding */}
                        <footer className="pt-20 border-t border-slate-100 flex flex-col items-center gap-8 text-center pb-20">
                            <div className="flex items-center gap-6">
                                <Instagram size={18} className="text-slate-300 hover:text-purple-600 cursor-pointer transition-colors" />
                                <Twitter size={18} className="text-slate-300 hover:text-purple-600 cursor-pointer transition-colors" />
                                <Facebook size={18} className="text-slate-300 hover:text-purple-600 cursor-pointer transition-colors" />
                            </div>
                            <div className="space-y-4">
                                <img src="/krediblyrevamped.png" alt="Kredibly" className="h-5 opacity-40 mx-auto" />
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed max-w-sm">
                                    Kredibly is a decentralized financial trust ledger. Every record is cryptographically secured to ensure merchant and customer transparency. 
                                    <br />
                                    © 2026 Kredibly Infrastructure. All rights reserved.
                                </p>
                            </div>
                        </footer>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default PublicInvoicePage;

