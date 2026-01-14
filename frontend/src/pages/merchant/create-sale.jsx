import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSales } from "../../context/SaleContext";
import { toast } from "sonner";
import { ArrowLeft, User, Phone, FileText, Banknote, Calendar, Check, Loader2 } from "lucide-react";

const CreateSale = () => {
    const [formData, setFormData] = useState({
        customerName: "",
        customerPhone: "",
        description: "",
        totalAmount: "",
        amountPaid: "",
        dueDate: ""
    });
    const [loading, setLoading] = useState(false);
    const { createSale } = useSales();
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
            toast.success("Sale recorded successfully!");
            navigate(`/invoice/${res.data._id}`);
        } catch (err) {
            toast.error("Failed to record sale");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E293B', marginBottom: '4px', letterSpacing: '-0.02em' }}>Record Sale</h1>
                <p style={{ color: '#64748B', fontWeight: 500 }}>Enter the transaction details to generate a secure record.</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Customer Section */}
                <div className="glass-card" style={{ padding: '24px', background: 'white', borderRadius: '20px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ background: '#EEF2FF', padding: '8px', borderRadius: '10px', color: 'var(--primary)' }}>
                            <User size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1F2937' }}>Customer Details</h3>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div className="input-group">
                            <label className="input-label" style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '6px', color: '#4B5563' }}>Customer Name (Optional)</label>
                            <input
                                type="text"
                                className="input-field"
                                style={{ borderRadius: '12px', padding: '14px', border: '1px solid #E5E7EB', background: '#F9FAFB' }}
                                placeholder="e.g. Adebayo Kunle"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '6px', color: '#4B5563' }}>Phone Number (Optional)</label>
                            <input
                                type="tel"
                                className="input-field"
                                style={{ borderRadius: '12px', padding: '14px', border: '1px solid #E5E7EB', background: '#F9FAFB' }}
                                placeholder="080 1234 5678"
                                value={formData.customerPhone}
                                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Sale Details Section */}
                <div className="glass-card" style={{ padding: '24px', background: 'white', borderRadius: '20px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ background: '#FFF7ED', padding: '8px', borderRadius: '10px', color: '#F97316' }}>
                            <FileText size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1F2937' }}>Transaction Details</h3>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div className="input-group">
                            <label className="input-label" style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '6px', color: '#4B5563' }}>Description <span style={{ color: 'red' }}>*</span></label>
                            <textarea
                                className="input-field"
                                style={{ borderRadius: '12px', padding: '14px', border: '1px solid #E5E7EB', background: '#F9FAFB', minHeight: '100px', resize: 'none' }}
                                placeholder="Describe the item or service sold..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid-2-col-responsive">
                            <div className="input-group">
                                <label className="input-label" style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '6px', color: '#4B5563' }}>Total Amount <span style={{ color: 'red' }}>*</span></label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontWeight: 600 }}>₦</span>
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ borderRadius: '12px', padding: '14px 14px 14px 32px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontWeight: '600' }}
                                        placeholder="0.00"
                                        value={formData.totalAmount}
                                        onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-label" style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '6px', color: '#4B5563' }}>Amount Paid</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontWeight: 600 }}>₦</span>
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ borderRadius: '12px', padding: '14px 14px 14px 32px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontWeight: '600' }}
                                        placeholder="0.00"
                                        value={formData.amountPaid}
                                        onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {balance > 0 && (
                            <div className="animate-fade-in" style={{ marginTop: '8px', padding: '16px', background: '#FFF7ED', borderRadius: '12px', border: '1px solid #FFEDD5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: '#9A3412', fontSize: '0.9rem' }}>Balance Remaining:</span>
                                    <span style={{ fontWeight: 800, color: '#EA580C', fontSize: '1.2rem' }}>₦{balance.toLocaleString()}</span>
                                </div>

                                <div className="input-group">
                                    <label className="input-label" style={{ fontWeight: 500, fontSize: '0.85rem', marginBottom: '4px', color: '#9A3412' }}>Expected Payment Date</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        style={{ borderRadius: '8px', padding: '10px', border: '1px solid #FFEDD5', background: 'white' }}
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ position: 'sticky', bottom: '20px', zIndex: 10 }}>
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1.1rem', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Generate Invoice <Check size={20} /></>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateSale;
