import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../../context/SaleContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { 
    User, FileText, Check, Loader2, Sparkles, 
    ArrowRight, Wallet, Calendar, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PlanLimitModal from "../../components/payment/PlanLimitModal";

const CreateSale = () => {
    const [formData, setFormData] = useState({
        customerName: "",
        customerPhone: "",
        description: "",
        totalAmount: "",
        amountPaid: "",
        dueDate: "",
        invoiceType: "billing" // "billing" or "record"
    });
    const [loading, setLoading] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const { createSale } = useSales();
    const { profile } = useAuth();
    const navigate = useNavigate();

    const balance = (parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.amountPaid) || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.description || !formData.totalAmount) {
            return toast.error("Description and Total Amount are required");
        }

        setLoading(true);
        try {
            const res = await createSale({
                ...formData,
                totalAmount: parseFloat(formData.totalAmount),
                amountPaid: parseFloat(formData.amountPaid) || 0
            });
            toast.success("Transaction Secured! 🚀");
            navigate(`/dashboard/invoice/${res.data.invoiceNumber}`, { state: { showSuccessModal: true } }); 
        } catch (err) {
            if (err.response?.data?.code === 'LIMIT_REACHED') {
                setShowLimitModal(true);
            } else {
                toast.error(err.response?.data?.message || "Failed to commit transaction to ledger");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '100px' }}>
            {/* Contextual Header */}
            <div style={{ marginBottom: '48px', textAlign: 'center' }}>
                <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    background: 'rgba(76, 29, 149, 0.05)', 
                    padding: '8px 20px', 
                    borderRadius: '100px',
                    marginBottom: '16px'
                }}>
                    <Sparkles size={16} color="var(--primary)" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Entry</span>
                </div>
                <h1 style={{ fontSize: 'clamp(1.5rem, 8vw, 2.5rem)', fontWeight: 900, color: 'var(--text)', marginBottom: '12px', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                    {formData.invoiceType === 'record' ? 'Record Past Payment' : 'Create New Invoice'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '1.1rem' }}>
                    {formData.invoiceType === 'record' 
                        ? 'Log a payment already made outside Kredibly to keep your ledger balanced.' 
                        : 'Enter details to generate an official payment link for your client.'}
                </p>
            </div>

            {/* Implementation Type Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                <div style={{ background: '#F1F5F9', padding: '6px', borderRadius: '20px', display: 'flex', gap: '8px', border: '1px solid #E2E8F0' }}>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, invoiceType: 'billing' })}
                        style={{
                            padding: '12px 24px', borderRadius: '14px', fontSize: '0.9rem', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
                            background: formData.invoiceType === 'billing' ? 'white' : 'transparent',
                            color: formData.invoiceType === 'billing' ? 'var(--primary)' : '#64748B',
                            boxShadow: formData.invoiceType === 'billing' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Official Invoice
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, invoiceType: 'record', amountPaid: formData.totalAmount })}
                        style={{
                            padding: '12px 24px', borderRadius: '14px', fontSize: '0.9rem', fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
                            background: formData.invoiceType === 'record' ? 'white' : 'transparent',
                            color: formData.invoiceType === 'record' ? 'var(--primary)' : '#64748B',
                            boxShadow: formData.invoiceType === 'record' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        Past Record (Receipt)
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '32px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                    {/* Left Side: Client & Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {/* Transaction Content */}
                        <div className="dashboard-glass" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', background: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(76, 29, 149, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--primary)' }}>
                                    <FileText size={20} strokeWidth={2.5} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>Sale Details</h3>
                            </div>

                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Transaction Description</label>
                                    <textarea
                                        className="input-field"
                                        style={{ 
                                            borderRadius: '16px', padding: '16px', border: '1px solid var(--border)', 
                                            background: 'var(--background)', minHeight: '120px', resize: 'none',
                                            fontSize: '1rem', fontWeight: 600
                                        }}
                                        placeholder="What are you selling? (e.g. 2x Designer Handbags)"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="input-group">
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Customer Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                        <input
                                            type="text"
                                            className="input-field"
                                            style={{ borderRadius: '16px', padding: '14px 14px 14px 48px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '1rem', fontWeight: 600 }}
                                            placeholder="Walk-in Customer"
                                            value={formData.customerName}
                                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Financials */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="dashboard-glass" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--border)', background: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--success)' }}>
                                    <Wallet size={20} strokeWidth={2.5} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)' }}>Financial Split</h3>
                            </div>

                            <div style={{ display: 'grid', gap: '24px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Total Amount to Pay</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text)', fontWeight: 800, fontSize: '1.1rem' }}>₦</span>
                                        <input
                                            type="number"
                                            className="input-field"
                                            style={{ borderRadius: '16px', padding: '16px 16px 16px 40px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}
                                            placeholder="0.00"
                                            value={formData.totalAmount}
                                            onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Amount Paid Now</label>
                                    <div style={{ position: 'relative' }}>
                                        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', fontWeight: 800 }}>₦</span>
                                        <input
                                            type="number"
                                            className="input-field"
                                            style={{ borderRadius: '16px', padding: '14px 14px 14px 32px', border: '1px solid var(--border)', background: 'var(--background)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}
                                            placeholder="0.00"
                                            value={formData.amountPaid}
                                            onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {balance > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            style={{ padding: '24px', background: 'rgba(249, 115, 22, 0.05)', borderRadius: '24px', border: '1px solid rgba(249, 115, 22, 0.1)' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
                                                    <AlertCircle size={18} />
                                                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Remaining Balance</span>
                                                </div>
                                                <span style={{ fontWeight: 900, color: 'var(--warning)', fontSize: 'clamp(1.1rem, 4vw, 1.3rem)' }}>₦{balance.toLocaleString()}</span>
                                            </div>

                                            <div className="input-group">
                                                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.8rem', marginBottom: '8px', color: 'var(--warning)', opacity: 0.8 }}>When should the balance be paid?</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--warning)' }} />
                                                    <input
                                                        type="date"
                                                        className="input-field"
                                                        style={{ borderRadius: '12px', padding: '12px 12px 12px 40px', border: '1px solid rgba(249, 115, 22, 0.2)', background: 'white', color: 'var(--warning)', fontWeight: 700 }}
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
                    </div>
                </div>

                <div style={{ 
                    marginTop: '20px', 
                    display: 'flex', 
                    justifyContent: 'center' 
                }}>
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ 
                            padding: 'clamp(16px, 4vw, 20px) 20px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '12px', 
                            fontSize: 'clamp(1rem, 4vw, 1.2rem)', 
                            borderRadius: '24px', 
                            fontWeight: 900,
                            boxShadow: '0 20px 40px -10px var(--primary-glow)',
                            width: '100%',
                            maxWidth: '430px',
                            opacity: loading ? 0.7 : 1
                        }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            formData.invoiceType === 'record' 
                                ? <>Finalize & Issue Receipt <ArrowRight size={20} strokeWidth={3} /></>
                                : <>Record & Send Invoice <ArrowRight size={20} strokeWidth={3} /></>
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
