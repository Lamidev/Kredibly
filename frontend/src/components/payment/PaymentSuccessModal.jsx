import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Download, X, Share2, Sparkles, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../../context/AuthContext';

const PaymentSuccessModal = ({ 
    isOpen, 
    onClose, 
    amountPaid, 
    balanceRemaining, 
    onDownloadReceipt,
    onDownloadImage,
    onWhatsAppShare,
    shareUrl,
    shareText 
}) => {
    const { profile } = useAuth();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isFullyPaid = (balanceRemaining || 0) <= 0;

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    key="modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 10001,
                        background: 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        key="modal-content"
                        initial={{ scale: 0.95, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 40 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: isMobile ? '32px' : '40px',
                            maxWidth: '480px',
                            width: '100%',
                            maxHeight: isMobile ? '90vh' : 'auto',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            boxShadow: '0 40px 100px -20px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                            position: 'relative',
                            border: '1px solid rgba(255, 255, 255, 0.5)'
                        }}
                    >
                        {/* Floating Success Glow */}
                        <div style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '24px',
                                right: '24px',
                                background: '#F8FAFC',
                                border: 'none',
                                borderRadius: '16px',
                                width: '44px',
                                height: '44px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 10,
                                color: '#64748B',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <X size={20} />
                        </button>
                        
                        {/* Success Header Area */}
                        <div style={{ padding: isMobile ? '40px 24px 24px' : '56px 40px 32px', textAlign: 'center' }}>
                            <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 28px' }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', damping: 15, delay: 0.1 }}
                                    style={{
                                        position: 'absolute', inset: 0,
                                        background: 'linear-gradient(135deg, #10B981, #059669)',
                                        borderRadius: '35%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 15px 30px -10px rgba(16, 185, 129, 0.4)',
                                        transform: 'rotate(10deg)'
                                    }}
                                >
                                    <CheckCircle2 size={48} color="white" strokeWidth={2.5} />
                                </motion.div>
                                
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], x: [0, 20, 0], y: [0, -20, 0] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                    style={{ position: 'absolute', top: -10, right: -10, color: '#FCD34D' }}
                                >
                                    <Sparkles size={28} fill="currentColor" />
                                </motion.div>
                            </div>

                            <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: 950, color: '#0F172A', marginBottom: '10px', letterSpacing: '-0.05em', fontFamily: 'Outfit', lineHeight: 1 }}>
                                {isFullyPaid ? "Receipt Ready!" : "Partial Payment!"}
                            </h2>
                            <p style={{ color: '#64748B', fontWeight: 600, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                                {isFullyPaid ? "Your balance is now fully settled." : "We've secured your partial payment."}
                            </p>
                        </div>

                        <div style={{ padding: isMobile ? '0 24px 32px' : '0 40px 40px' }}>
                            {/* Highlights Card */}
                            <div style={{ background: '#F8FAFC', borderRadius: '32px', padding: '28px', border: '1px solid #F1F5F9', marginBottom: '28px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: !isFullyPaid ? '24px' : '0' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Confirmed Amount</p>
                                        <p style={{ fontSize: '32px', fontWeight: 950, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'baseline', gap: '4px', letterSpacing: '-0.03em' }}>
                                            <span style={{ fontSize: '20px', fontWeight: 800, color: '#10B981' }}>₦</span>{amountPaid.toLocaleString()}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'white', borderRadius: '100px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                            <ShieldCheck size={14} color="#10B981" />
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase' }}>Verified</span>
                                        </div>
                                    </div>
                                </div>

                                {!isFullyPaid && (
                                    <div style={{ paddingTop: '24px', borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 750, color: '#64748B' }}>Remaining Balance</span>
                                        <span style={{ fontSize: '18px', fontWeight: 950, color: '#F59E0B' }}>₦{balanceRemaining.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Grid */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                                <button
                                    onClick={onDownloadImage}
                                    style={{
                                        padding: isMobile ? '18px' : '22px', background: '#4C1D95', color: 'white', borderRadius: '24px', border: 'none',
                                        fontWeight: 900, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                        boxShadow: '0 15px 35px -10px rgba(76, 29, 149, 0.4)', transition: 'transform 0.2s ease'
                                    }}
                                >
                                    <Download size={22} strokeWidth={2.5} />
                                    Save Receipt as Image
                                </button>
                                <button
                                    onClick={onDownloadReceipt}
                                    style={{
                                        padding: '20px', background: 'white', color: '#0F172A', borderRadius: '24px', border: '2px solid #F1F5F9',
                                        fontWeight: 850, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                                    }}
                                >
                                    <FileText size={20} color="#64748B" />
                                    Download PDF Document
                                </button>
                            </div>

                            {/* Viral Loop / Promo Section */}
                            {!profile && isFullyPaid && (
                                <motion.div 
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => window.open('/', '_blank')}
                                    style={{ 
                                        padding: '24px', borderRadius: '32px', background: 'linear-gradient(135deg, #F5F3FF 0%, #F0F9FF 100%)', 
                                        border: '1px solid #DDD6FE', textAlign: 'center', cursor: 'pointer',
                                        marginBottom: '16px', position: 'relative', overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: -10, left: -10, width: '60px', height: '60px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '50%' }} />
                                    <p style={{ fontSize: '11px', fontWeight: 900, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
                                        Secure your business
                                    </p>
                                    <p style={{ fontSize: '1rem', fontWeight: 800, color: '#1E1B4B', margin: '0 0 12px 0', lineHeight: 1.3 }}>
                                        Automate your debt recovery with Kredibly.
                                    </p>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 900, color: '#4C1D95' }}>
                                        Get Started Free <ArrowRight size={16} />
                                    </div>
                                </motion.div>
                            )}

                            <button 
                                onClick={onClose}
                                style={{ width: '100%', background: 'transparent', border: 'none', color: '#94A3B8', fontWeight: 800, fontSize: '14px', cursor: 'pointer', padding: '10px' }}
                            >
                                Back to Invoice
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default PaymentSuccessModal;
