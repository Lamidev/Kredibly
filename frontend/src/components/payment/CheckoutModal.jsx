import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Loader2, Tag, ShieldCheck, Lock } from 'lucide-react';
import { toast } from 'sonner';

const CheckoutModal = ({ plan, billingCycle, onClose, userEmail, onSuccess }) => {
    const [couponCode, setCouponCode] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [discount, setDiscount] = useState(null); 
    const [error, setError] = useState("");

    // Calculate Base Price
    let basePrice = 0;
    if (plan === 'oga') basePrice = billingCycle === 'yearly' ? 7000 * 12 * 0.9 : 7000;
    else if (plan === 'chairman') basePrice = billingCycle === 'yearly' ? 30000 * 12 * 0.9 : 30000;

    // Calculate Final Price
    let finalPrice = basePrice;
    if (discount) {
        if (discount.type === 'percentage') {
            finalPrice = basePrice * (1 - discount.value / 100);
        } else if (discount.type === 'fixed') {
            finalPrice = Math.max(0, basePrice - discount.value);
        }
    }

    // Lock body scroll when modal is open
    React.useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    const validateCoupon = async () => {
        if (!couponCode) return;
        setIsValidating(true);
        setError("");

        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.post(`${API_URL}/coupons/validate`, { code: couponCode }, { withCredentials: true });
            
            if (res.data.success) {
                setDiscount({
                    type: res.data.data.discountType,
                    value: res.data.data.discountValue,
                    code: res.data.data.code
                });
                toast.success(`Coupon Applied: ${res.data.data.description}`);
            }
        } catch (err) {
            setDiscount(null);
            setError(err.response?.data?.message || "Invalid coupon code");
        } finally {
            setIsValidating(false);
        }
    };

    const handlePaystackPayment = () => {
        if (finalPrice === 0) {
            // Bypass Paystack for 100% discount
            const freeReference = {
                reference: `FREE_${plan.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                status: 'success'
            };
            onSuccess(freeReference, plan, billingCycle, discount?.code);
            onClose();
            return;
        }

        if (!window.PaystackPop) {
            toast.error("Payment system is still loading. Please try again in a few seconds.");
            return;
        }

        const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
            email: userEmail,
            amount: Math.round(finalPrice * 100), // in kobo
            currency: 'NGN',
            ref: `SUB_${plan.toUpperCase()}_${Date.now()}`,
            metadata: {
                plan,
                billingCycle,
                couponCode: discount?.code
            },
            callback: function (response) {
                // response looks like { reference, status, trans, message, transaction }
                onSuccess(response, plan, billingCycle, discount?.code);
                onClose();
            },
            onClose: function () {
                toast.info("Payment window closed.");
            }
        });
        handler.openIframe();
    };

    return createPortal(
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            padding: '20px', overflowY: 'auto'
        }}>
            <div className="animate-scale-in" style={{
                background: 'white', width: '100%', maxWidth: '440px',
                borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                overflow: 'hidden', position: 'relative'
            }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 950, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Confirm Upgrade</h3>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#64748B', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className={plan === 'hustler' ? "plan-tag-hustler" : "plan-tag-bright"}>
                            {plan === 'oga' ? 'Oga Plan' : plan === 'chairman' ? 'Chairman Plan' : plan === 'hustler' ? 'Hustler Plan' : 'Custom Plan'}
                        </span>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900 }}>₦{basePrice.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                        <span>Billing Cycle</span>
                        <span style={{ textTransform: 'capitalize' }}>{billingCycle}</span>
                    </div>

                    {/* Discount Section */}
                    {discount ? (
                        <div style={{ background: '#F0FDF4', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', border: '1px solid #BBF7D0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Tag size={16} color="#16A34A" />
                                <span style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem' }}>{discount.code}</span>
                            </div>
                            <span style={{ fontWeight: 800, color: '#16A34A', fontSize: '0.9rem' }}>-₦{(basePrice - finalPrice).toLocaleString()}</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                            <input
                                placeholder="Discount code?"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                style={{ flex: 1, padding: '14px 16px', borderRadius: '14px', border: error ? '2px solid #EF4444' : '2px solid #E2E8F0', outline: 'none', fontSize: '0.95rem', fontWeight: 600, background: '#F8FAFC' }}
                            />
                            <button
                                onClick={validateCoupon}
                                disabled={!couponCode || isValidating}
                                style={{ background: '#F1F5F9', color: '#334155', border: 'none', borderRadius: '14px', padding: '0 20px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}
                            >
                                {isValidating ? <Loader2 className="spin" size={16} /> : "Apply"}
                            </button>
                        </div>
                    )}
                    {error && <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '-16px', marginBottom: '24px', fontWeight: 600 }}>{error}</p>}

                    <div style={{ borderTop: '2px dashed #F1F5F9', margin: '0 -24px 24px', padding: '0 24px' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 800, color: '#64748B' }}>Final Total</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: 950, color: 'var(--primary)', letterSpacing: '-0.04em' }}>₦{finalPrice.toLocaleString()}</span>
                    </div>

                    <button
                        onClick={handlePaystackPayment}
                        className="btn-primary"
                        style={{ width: '100%', height: '60px', borderRadius: '18px', fontSize: '1.1rem', justifyContent: 'center', fontWeight: 900, boxShadow: '0 10px 20px -5px var(--primary-glow)' }}
                    >
                        <Lock size={20} /> {finalPrice === 0 ? 'Activate Plan' : `Pay ₦${finalPrice.toLocaleString()}`}
                    </button>
                    
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', fontSize: '0.7rem', color: '#94A3B8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        <ShieldCheck size={16} /> Secured & Verified Payment
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CheckoutModal;
