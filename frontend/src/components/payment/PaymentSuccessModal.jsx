import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Download, X, Share2 } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccessModal = ({ 
    isOpen, 
    onClose, 
    amountPaid, 
    balanceRemaining, 
    onDownloadReceipt,
    shareUrl,
    shareText 
}) => {
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
                    background: 'rgba(15, 23, 42, 0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: 'white',
                        borderRadius: '32px',
                        maxWidth: '440px',
                        width: '100%',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        position: 'relative'
                    }}
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(255,255,255,0.9)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <X size={20} color="#64748B" />
                    </button>

                    {/* Success Header */}
                    <div style={{
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        padding: '48px 32px 40px',
                        textAlign: 'center',
                        color: 'white'
                    }}>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.1, damping: 15, stiffness: 200 }}
                        >
                            <CheckCircle2 
                                size={72} 
                                style={{ 
                                    margin: '0 auto 20px',
                                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
                                }} 
                            />
                        </motion.div>
                        <h2 style={{
                            fontSize: 'clamp(22px, 6vw, 28px)',
                            fontWeight: 900,
                            margin: '0 0 8px 0',
                            letterSpacing: '-0.02em'
                        }}>
                            Payment Successful!
                        </h2>
                        <p style={{
                            fontSize: '14px',
                            opacity: 0.9,
                            margin: 0,
                            fontWeight: 600
                        }}>
                            Your payment has been verified and recorded
                        </p>
                    </div>

                    {/* Payment Details */}
                    <div style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
                        <div style={{
                            background: '#F8FAFC',
                            borderRadius: '20px',
                            padding: '24px',
                            marginBottom: '24px',
                            border: '1px solid #E2E8F0'
                        }}>
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{
                                    fontSize: '11px',
                                    fontWeight: 900,
                                    color: '#94A3B8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    margin: '0 0 8px 0'
                                }}>
                                    You Paid
                                </p>
                                <p style={{
                                    fontSize: 'clamp(28px, 8vw, 36px)',
                                    fontWeight: 950,
                                    color: '#10B981',
                                    margin: 0,
                                    letterSpacing: '-0.03em'
                                }}>
                                    ₦{amountPaid.toLocaleString()}
                                </p>
                            </div>

                            {!isFullyPaid && (
                                <div style={{
                                    borderTop: '1px dashed #E2E8F0',
                                    paddingTop: '16px'
                                }}>
                                    <p style={{
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        color: '#94A3B8',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        margin: '0 0 8px 0'
                                    }}>
                                        Balance Left
                                    </p>
                                    <p style={{
                                        fontSize: '24px',
                                        fontWeight: 900,
                                        color: '#F59E0B',
                                        margin: 0,
                                        letterSpacing: '-0.02em'
                                    }}>
                                        ₦{balanceRemaining.toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {isFullyPaid && (
                                <div style={{
                                    borderTop: '1px dashed #E2E8F0',
                                    paddingTop: '16px',
                                    textAlign: 'center'
                                }}>
                                    <p style={{
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        color: '#10B981',
                                        margin: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}>
                                        <CheckCircle2 size={18} />
                                        Invoice Fully Settled
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Receipt Ready Message */}
                        <div style={{
                            background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
                            borderRadius: '16px',
                            padding: '16px',
                            marginBottom: '24px',
                            border: '1px solid #BAE6FD',
                            textAlign: 'center'
                        }}>
                            <p style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#0369A1',
                                margin: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}>
                                📄 Your receipt is ready to download
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={onDownloadReceipt}
                                    style={{
                                        flex: 2,
                                        padding: '16px',
                                        background: '#0F172A',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '14px',
                                        fontWeight: 900,
                                        fontSize: '15px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <Download size={18} />
                                    Download
                                </button>
                                <button
                                    onClick={async () => {
                                        const text = shareText || `I've just made a payment of ₦${amountPaid.toLocaleString()}! You can view my verified receipt here:`;
                                        const url = shareUrl || window.location.href;
                                        if (navigator.share) {
                                            try {
                                                await navigator.share({ title: 'Payment Receipt', text, url });
                                            } catch (err) {}
                                        } else {
                                            navigator.clipboard.writeText(`${text} ${url}`);
                                            toast.success("Link copied to clipboard!");
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '16px',
                                        background: '#F1F5F9',
                                        color: '#0F172A',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '14px',
                                        fontWeight: 800,
                                        fontSize: '15px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: 'white',
                                    color: '#64748B',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#F8FAFC';
                                    e.currentTarget.style.color = '#0F172A';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.color = '#64748B';
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default PaymentSuccessModal;
