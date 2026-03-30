import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Loader2, Tag, ShieldCheck, Lock, CheckCircle2, Sparkles, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const CheckoutModal = ({ plan, billingCycle, onClose, userEmail, onSuccess }) => {
    const [couponCode, setCouponCode] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [discount, setDiscount] = useState(null); 
    const [error, setError] = useState("");
    
    const [status, setStatus] = useState('billing'); // 'billing', 'verifying', 'success'

    // Pioneer Offering: Subsizided Launch Rates (3000 & 4500)
    // These rates cover the first 2 months for merchants who join during the launch window.
    let basePrice = (plan === 'oga') ? 3000 : (plan === 'chairman' ? 4500 : 0);
    
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
    useEffect(() => {
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

    const triggerCelebration = () => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 20000
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    const handleInternalSuccess = async (response) => {
        setStatus('verifying');
        try {
            await onSuccess(response, plan, billingCycle, discount?.code);
            setStatus('success');
            triggerCelebration();
        } catch (err) {
            setStatus('billing');
            // Error is handled by parent's toast
        }
    };

    const handlePaystackPayment = () => {
        if (finalPrice <= 0) {
            const freeReference = {
                reference: `FREE_${plan.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                status: 'success'
            };
            handleInternalSuccess(freeReference);
            return;
        }

        if (!window.PaystackPop) {
            toast.error("Payment system is still loading. Please try again in a few seconds.");
            return;
        }

        if (!userEmail) {
            toast.error("User email is missing. Please refresh and try again.");
            return;
        }

        const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
            email: userEmail,
            amount: Math.round(finalPrice * 100), // in kobo
            currency: 'NGN',
            ref: `SUB_${plan.toUpperCase()}_${Date.now()}`,
            metadata: {
                paymentType: 'subscription',
                plan,
                billingCycle,
                couponCode: discount?.code
            },
            callback: function (response) {
                handleInternalSuccess(response);
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
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            padding: '20px', overflowY: 'auto'
        }}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: 'white', width: '100%', maxWidth: '440px',
                    borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    border: '2px solid var(--primary-glow)',
                    overflow: 'hidden', position: 'relative', minHeight: '300px'
                }}
            >
                <AnimatePresence mode="wait">
                    {status === 'billing' && (
                        <motion.div 
                            key="billing"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
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
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 950 }}>₦{basePrice.toLocaleString()}</span>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#16A34A', background: '#F0FDF4', padding: '2px 8px', borderRadius: '4px', marginTop: '4px' }}>PIONEER SUBSIDY APPLIED</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                                    <span>Billing Cycle</span>
                                    <span style={{ textTransform: 'capitalize', color: 'var(--primary)', fontWeight: 800 }}>
                                        Pioneer Offer (2 Months Slash)
                                    </span>
                                </div>

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
                        </motion.div>
                    )}

                    {status === 'verifying' && (
                        <motion.div 
                            key="verifying"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ padding: '60px 40px', textAlign: 'center' }}
                        >
                            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 32px' }}>
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    style={{ 
                                        position: 'absolute', inset: 0, 
                                        borderRadius: '50%', border: '4px solid #F1F5F9',
                                        borderTopColor: 'var(--primary)'
                                    }}
                                />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                    <ShieldCheck size={40} />
                                </div>
                            </div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#0F172A', marginBottom: '12px', letterSpacing: '-0.03em' }}>Verifying Payment</h3>
                            <p style={{ color: '#64748B', fontWeight: 600, fontSize: '1rem', lineHeight: 1.6 }}>Hold tight! We're securing your spot on the <span style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{plan}</span> ledger...</p>
                            
                            <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} />
                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} />
                                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%' }} />
                            </div>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ padding: '60px 40px', textAlign: 'center' }}
                        >
                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.1 }}
                                style={{ 
                                    width: '100px', height: '100px', background: '#F0FDF4', 
                                    borderRadius: '50%', display: 'flex', alignItems: 'center', 
                                    justifyContent: 'center', margin: '0 auto 32px', color: '#16A34A',
                                    boxShadow: '0 20px 40px -10px rgba(22, 163, 74, 0.2)'
                                }}
                            >
                                <CheckCircle2 size={50} />
                            </motion.div>
                            
                            <div style={{ position: 'relative' }}>
                                <Sparkles size={24} color="#FBBF24" style={{ position: 'absolute', top: '-10px', left: '20%' }} />
                                <PartyPopper size={24} color="var(--primary)" style={{ position: 'absolute', top: '10px', right: '15%' }} />
                                <h3 style={{ fontSize: '2rem', fontWeight: 950, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.04em' }}>Welcome, Oga!</h3>
                            </div>
                            
                            <p style={{ color: '#64748B', fontWeight: 700, margin: '16px 0 32px', fontSize: '1.1rem' }}>Your business has officially leveled up to <span style={{ color: 'var(--primary)', textTransform: 'uppercase' }}>{plan}</span> status. 🚀</p>
                            
                            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '20px', border: '1px solid #E2E8F0', marginBottom: '32px' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Refreshing your workspace...</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>,
        document.body
    );
};

export default CheckoutModal;
