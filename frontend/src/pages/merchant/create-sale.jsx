import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../../context/SaleContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { 
    User, FileText, Check, Loader2, Sparkles, 
    ArrowRight, Wallet, Calendar, AlertCircle, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlanLimitModal from "../../components/payment/PlanLimitModal";

const CreateSale = () => {
    const { createSale, loading: globalLoading } = useSales();
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        description: "",
        totalAmount: "",
        amountPaid: "",
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    });

    const [loading, setLoading] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);

    // Smart Calculations
    const total = parseFloat(formData.totalAmount) || 0;
    const paid = parseFloat(formData.amountPaid) || 0;
    const balance = Math.max(0, total - paid);
    
    const isFullReceipt = paid >= total && total > 0;
    const isPartial = paid > 0 && balance > 0;
    const isFreshInvoice = paid === 0 && total > 0;

    const formatNaira = (amt) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amt || 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.description || !formData.totalAmount) {
            return toast.error("Description and Total Amount are required");
        }

        setLoading(true);
        try {
            // Smart Type Logic: Ensure we send clean decimals to backend
            const invoiceType = isFullReceipt ? 'record' : 'billing';

            const res = await createSale({
                ...formData,
                invoiceType,
                totalAmount: total,
                amountPaid: paid
            });
            
            if (res.success) {
                toast.success(isFullReceipt ? "Receipt Issued! 🎉" : "Invoice Secured! 🚀");
                
                // 300ms Delay for action smoothness: Let the user feel the victory
                setTimeout(() => {
                    navigate(`/sales/${res.data._id}`); 
                }, 300);
            }
        } catch (err) {
            if (err.response?.data?.errorCode === 'LIMIT_REACHED') {
                setShowLimitModal(true);
            } else {
                toast.error(err.response?.data?.message || "Failed to finalize sale");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px' }}>
            
            {/* Actionable Header */}
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'rgba(76, 29, 149, 0.05)', 
                    padding: '8px 20px', 
                    borderRadius: '100px',
                    marginBottom: '16px'
                }}>
                    <Sparkles size={16} color="#4C1D95" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Entry</span>
                </div>
                <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 950, color: '#0F172A', letterSpacing: '-0.05em', marginBottom: '8px' }}>
                    Record New Sale
                </h1>
                <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.95rem' }}>
                    Capture a past sale or send a fresh bill to a customer instantly.
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
                    
                    {/* Left Panel: Transaction & Customer */}
                    <div className="dashboard-glass" style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                            <div style={{ background: 'rgba(76, 29, 149, 0.1)', color: '#4C1D95', padding: '10px', borderRadius: '12px' }}>
                                <FileText size={20} strokeWidth={2.5} />
                            </div>
                            <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Sale Identity</h3>
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#64748B', marginBottom: '8px' }}>Transaction Memo</label>
                            <textarea 
                                className="input-field" 
                                style={{ minHeight: '120px', resize: 'none', borderRadius: '16px', padding: '16px', fontSize: '1rem', fontWeight: 600 }} 
                                placeholder="What are you selling? (e.g. 2 x Leather Boots)" 
                                required
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#64748B', marginBottom: '8px' }}>Customer Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                <input 
                                    className="input-field" 
                                    style={{ borderRadius: '16px', padding: '14px 14px 14px 48px', fontSize: '1rem', fontWeight: 600 }}
                                    placeholder="e.g. Samuel Mills" 
                                    value={formData.customerName}
                                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Financial Logic */}
                    <div className="dashboard-glass" style={{ background: 'white', borderRadius: '32px', border: '1px solid #E2E8F0', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '10px', borderRadius: '12px' }}>
                                <Wallet size={20} strokeWidth={2.5} />
                            </div>
                            <h3 style={{ fontWeight: 800, fontSize: '0.9rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Payment Status</h3>
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#64748B', marginBottom: '4px' }}>Total Amount to Pay (₦)</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                style={{ fontSize: '1.6rem', fontWeight: 950, color: '#0F172A', background: '#F8FAFC', borderRadius: '20px', padding: '20px', border: 'none' }}
                                placeholder="0.00" 
                                required
                                value={formData.totalAmount}
                                onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                            />
                            {total > 0 && <p style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, margin: '4px 0 0 4px', letterSpacing: '0.02em' }}>{formatNaira(total)}</p>}
                        </div>

                        <div className="input-group">
                            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#64748B', marginBottom: '4px' }}>How much did they pay already? (₦)</label>
                            <input 
                                type="number" 
                                className="input-field" 
                                style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981', background: '#F0FDF4', borderRadius: '16px', padding: '16px', border: 'none' }}
                                placeholder="0.00" 
                                value={formData.amountPaid}
                                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', padding: '0 4px' }}>
                                <p style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>{formatNaira(paid)}</p>
                                {isFullReceipt && (
                                    <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 900, color: '#10B981', display: 'flex', alignItems: 'center', gap: '3px', textTransform: 'uppercase' }}>
                                        <Check size={12} strokeWidth={4} /> FULL RECEIPT
                                    </p>
                                )}
                            </div>
                        </div>

                        <AnimatePresence>
                            {balance > 0 && total > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }} 
                                    animate={{ opacity: 1, height: 'auto' }} 
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ borderTop: '1px solid #F1F5F9', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                                >
                                    <div style={{ padding: '16px', background: '#FFF7ED', borderRadius: '20px', border: '1px solid #FFEDD5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9A3412' }}>
                                            <AlertCircle size={16} />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Owed Balance</span>
                                        </div>
                                        <span style={{ fontWeight: 950, color: '#EA580C', fontSize: '1.25rem' }}>{formatNaira(balance)}</span>
                                    </div>

                                    <div className="input-group">
                                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#64748B', marginBottom: '8px' }}>Payment Deadline</label>
                                        <div style={{ position: 'relative' }}>
                                            <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                            <input
                                                type="date"
                                                className="input-field"
                                                style={{ paddingLeft: '40px', borderRadius: '12px', fontWeight: 700 }}
                                                value={formData.dueDate}
                                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button
                        type="submit"
                        className={`btn-primary ${loading ? 'loading-pulse' : ''}`}
                        style={{ 
                            padding: '24px 40px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '12px', 
                            fontSize: '1.25rem', 
                            borderRadius: '32px', 
                            fontWeight: 950,
                            boxShadow: '0 25px 50px -12px rgba(76, 29, 149, 0.4)',
                            width: '100%',
                            maxWidth: '450px',
                            opacity: (loading || !formData.totalAmount) ? 0.7 : 1, 
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: (loading || !formData.totalAmount) ? 'not-allowed' : 'pointer'
                        }}
                        disabled={loading || !formData.totalAmount}
                    >
                        {loading ? <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Loader2 className="animate-spin" /> <span>Securing Ledger...</span></div> : (
                            isFullReceipt 
                                ? <>Issue Full Receipt <ArrowRight size={22} strokeWidth={3} /></>
                                : isPartial 
                                ? <>Record & Track Debt <ArrowRight size={22} strokeWidth={3} /></>
                                : <>Send Payment Link <ArrowRight size={22} strokeWidth={3} /></>
                        )}
                    </button>
                </div>
            </form>

            <PlanLimitModal 
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                onUpgrade={() => navigate('/settings')}
            />
        </div>
    );
};

export default CreateSale;
