import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Download, X, Share2, Sparkles, FileText, ArrowRight } from 'lucide-react';
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

    if (!isOpen) return null;

    const isFullyPaid = balanceRemaining <= 0;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10001,
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 30 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'white',
                        borderRadius: '32px',
                        maxWidth: '480px',
                        width: '100%',
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.3)',
                        position: 'relative'
                    }}
                >
                    {/* Premium Header Decoration */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #10B981, #059669)' }} />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(255,255,255,1)',
                            border: '1px solid #E2E8F0',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            color: '#64748B'
                        }}
                    >
                        <X size={20} />
                    </button>

                    {/* Success Content */}
                    <div style={{ padding: isMobile ? '32px 20px 24px' : '48px 32px 40px', textAlign: 'center' }}>
                        <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 24px' }}>
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                style={{
                                    position: 'absolute', inset: 0,
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <CheckCircle2 size={56} color="#10B981" />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5], rotate: 45 }}
                                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                                style={{ position: 'absolute', top: -5, right: -5, color: '#FCD34D' }}
                            >
                                <Sparkles size={24} fill="currentColor" />
                            </motion.div>
                        </div>

                        <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 950, color: '#0F172A', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                            {isFullyPaid ? "Invoice Settled!" : "Payment Confirmed!"}
                        </h2>
                        <p style={{ color: '#64748B', fontWeight: 600, fontSize: '0.95rem' }}>
                            Your transfer has been successfully verified.
                        </p>
                    </div>

                    <div style={{ padding: isMobile ? '0 20px 24px' : '0 32px 32px' }}>
                        {/* Highlights Card */}
                        <div style={{ background: '#F8FAFC', borderRadius: '24px', padding: '24px', border: '1px solid #F1F5F9', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: !isFullyPaid ? '20px' : '0' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Verified Payment</p>
                                    <p style={{ fontSize: '28px', fontWeight: 950, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                        <span style={{ fontSize: '18px', fontWeight: 800 }}>₦</span>{amountPaid.toLocaleString()}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#ECFDF5', borderRadius: '100px', border: '1px solid #D1FAE5' }}>
                                        <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }} />
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Success</span>
                                    </div>
                                </div>
                            </div>

                            {!isFullyPaid && (
                                <div style={{ paddingTop: '20px', borderTop: '1px dashed #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Balance Remaining</span>
                                    <span style={{ fontSize: '16px', fontWeight: 900, color: '#F59E0B' }}>₦{balanceRemaining.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                            <button
                                onClick={onWhatsAppShare}
                                style={{
                                    width: '100%', 
                                    padding: '20px', 
                                    background: 'linear-gradient(135deg, #10B981, #059669)', 
                                    color: 'white', 
                                    borderRadius: '20px', 
                                    border: 'none',
                                    fontWeight: 950, 
                                    fontSize: '1.1rem', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '12px',
                                    boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
                                    letterSpacing: '-0.01em'
                                }}
                            >
                                <Share2 size={22} />
                                Share Transaction Proof
                            </button>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button
                                    onClick={onDownloadReceipt}
                                    style={{
                                        padding: '16px', background: '#F8FAFC', color: '#0F172A', borderRadius: '18px', border: '1px solid #E2E8F0',
                                        fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <FileText size={16} />
                                    Full PDF
                                </button>
                                <button
                                    onClick={onDownloadImage}
                                    style={{
                                        padding: '16px', background: '#F8FAFC', color: '#0F172A', borderRadius: '18px', border: '1px solid #E2E8F0',
                                        fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Download size={16} />
                                    Save Image
                                </button>
                            </div>
                        </div>

                        {/* Viral Loop / Promo Section (Only for customers & after full settlement) */}
                        {!profile && isFullyPaid && (
                            <div 
                                onClick={() => window.open('/', '_blank')}
                                style={{ 
                                    padding: '20px', borderRadius: '24px', background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', 
                                    border: '1px solid #DDD6FE', textAlign: 'center', cursor: 'pointer',
                                    marginBottom: '12px'
                                }}
                            >
                                <p style={{ fontSize: '11px', fontWeight: 900, color: '#4C1D95', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                    Stop chasing payments manually
                                </p>
                                <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6D28D9', margin: '0 0 12px 0' }}>
                                    Kreddy can recover your debts automatically.
                                </p>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 850, color: '#4C1D95' }}>
                                    Learn How It Works <ArrowRight size={14} />
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={onClose}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#94A3B8', fontWeight: 750, fontSize: '14px', cursor: 'pointer' }}
                        >
                            Return to Invoice
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default PaymentSuccessModal;
