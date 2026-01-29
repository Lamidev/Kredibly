import React, { useState } from 'react';
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

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div className="animate-scale-in" style={{
                background: 'white', width: '100%', maxWidth: '480px',
                borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>Confirm Upgrade</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155' }}>
                            {plan === 'oga' ? 'Oga Plan' : plan === 'chairman' ? 'Chairman Plan' : 'Custom Plan'}
                        </span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>₦{basePrice.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '0.9rem', color: '#64748B' }}>
                        <span>Billing Cycle</span>
                        <span style={{ textTransform: 'capitalize' }}>{billingCycle}</span>
                    </div>

                    {/* Discount Section */}
                    {discount ? (
                        <div style={{ background: '#F0FDF4', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', border: '1px solid #BBF7D0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Tag size={16} color="#16A34A" />
                                <span style={{ fontWeight: 700, color: '#166534' }}>{discount.code}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: '#16A34A' }}>-₦{(basePrice - finalPrice).toLocaleString()}</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                            <input
                                placeholder="Have a discount code?"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: error ? '1px solid #EF4444' : '1px solid #E2E8F0', outline: 'none', fontSize: '0.95rem' }}
                            />
                            <button
                                onClick={validateCoupon}
                                disabled={!couponCode || isValidating}
                                style={{ background: '#F1F5F9', color: '#334155', border: 'none', borderRadius: '12px', padding: '0 20px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                {isValidating ? <Loader2 className="spin" size={18} /> : "Apply"}
                            </button>
                        </div>
                    )}
                    {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '-16px', marginBottom: '24px', fontWeight: 500 }}>{error}</p>}

                    <div style={{ borderTop: '2px dashed #E2E8F0', margin: '0 -32px 24px', padding: '0 32px' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>Total Amount</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)' }}>₦{finalPrice.toLocaleString()}</span>
                    </div>

                    <button
                        onClick={handlePaystackPayment}
                        className="btn-primary"
                        style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '1.1rem', justifyContent: 'center' }}
                    >
                        <Lock size={18} /> Pay {finalPrice === 0 ? 'Nothing' : `₦${finalPrice.toLocaleString()}`}
                    </button>
                    
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '6px', alignItems: 'center', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                        <ShieldCheck size={14} /> Secured by Paystack
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
