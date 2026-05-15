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

    // Standard monthly rates
    let basePrice = (plan === 'hustler') ? 2500 : (plan === 'oga' ? 5000 : (plan === 'chairman' ? 7500 : 0));
    
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

    const handleNombaPayment = async () => {
        if (finalPrice <= 0) {
            const freeReference = {
                reference: `FREE_${plan.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                status: 'success'
            };
            handleInternalSuccess(freeReference);
            return;
        }

        if (!userEmail) {
            toast.error("User email is missing. Please refresh and try again.");
            return;
        }

        setStatus('verifying');
        toast.loading("Generating secure checkout...", { id: 'checkout-gen' });

        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.post(`${API_URL}/payments/initialize-subscription`, {
                plan,
                billingCycle,
                couponCode: discount?.code
            }, { withCredentials: true });

            if (res.data.success && res.data.checkoutLink) {
                toast.dismiss('checkout-gen');
                // Redirect user to Nomba hosted checkout
                window.location.href = res.data.checkoutLink;
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (err) {
            console.error("Nomba Checkout Init Err:", err);
            toast.dismiss('checkout-gen');
            toast.error(err.response?.data?.message || "Failed to initialize secure checkout. Please try again.");
            setStatus('billing');
        }
    };

    return createPortal(
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(16px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            padding: 'clamp(12px, 3vw, 20px)', overflowY: 'auto'
        }}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                    background: 'white', width: '100%', maxWidth: '440px',
                    borderRadius: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    border: '2px solid var(--primary-glow)',
                    position: 'relative', 
                    maxHeight: 'min(90vh, 700px)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                <AnimatePresence mode="wait">
                    {status === 'billing' && (
                        <motion.div 
                            key="billing"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
                        >
                            {/* Header */}
                            <div style={{ 
                                padding: 'clamp(16px, 4vw, 24px)', 
                                borderBottom: '1px solid #F1F5F9', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                flexShrink: 0 
                            }}>
                                <h3 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.25rem)', fontWeight: 950, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Confirm Upgrade</h3>
                                <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#64748B', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{ 
                                padding: 'clamp(16px, 4vw, 24px)', 
                                overflowY: 'auto', 
                                flex: 1,
                                WebkitOverflowScrolling: 'touch' 
                            }}>
                                
                                {/* Plan Card Area */}
                                <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '20px', marginBottom: '24px', border: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Selected Plan</p>
                                            <span style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                padding: '8px 18px', 
                                                background: plan === 'hustler' ? '#F8FAFC' : 'rgba(76, 29, 149, 0.08)', 
                                                color: plan === 'hustler' ? '#64748B' : 'var(--primary)', 
                                                borderRadius: '100px', 
                                                fontSize: '0.8rem', 
                                                fontWeight: 900, 
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                border: `1px solid ${plan === 'hustler' ? '#E2E8F0' : 'rgba(76, 29, 149, 0.15)'}`,
                                                whiteSpace: 'nowrap',
                                                lineHeight: 1.2
                                            }}>
                                                {plan === 'oga' ? 'Oga Plan' : plan === 'chairman' ? 'Chairman Plan' : plan === 'hustler' ? 'Hustler Plan' : 'Custom Plan'}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                             <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Base Rate</p>
                                             <span style={{ fontSize: '1.25rem', fontWeight: 950, color: '#0F172A', lineHeight: 1 }}>₦{basePrice.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 0', borderTop: '1px dashed #CBD5E1' }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', fontWeight: 700 }}>Billing Cycle</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F0FDF4', padding: '6px 12px', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                                             <Sparkles size={14} color="#16A34A" />
                                             <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly</span>
                                        </div>
                                    </div>
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
                                    onClick={handleNombaPayment}
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
