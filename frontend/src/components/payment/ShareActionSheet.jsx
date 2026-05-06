import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ImageIcon, FileText, Link2, Share2 } from 'lucide-react';
import { Download } from 'lucide-react';

const ShareActionSheet = ({ 
    isOpen, 
    onClose, 
    onShareImage, 
    onDownloadPDF, 
    onCopyLink,
    title = "Share Official Document",
    subtitle = "Choose how you'd like to share or save this record",
}) => {
    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="sharesheet-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.5)',
                            backdropFilter: 'blur(12px)',
                            zIndex: 10000,
                        }}
                    />

                    {/* Centered Modal */}
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10001,
                            padding: '20px',
                        }}
                    >
                        <motion.div
                            key="sharesheet-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                background: 'white',
                                borderRadius: '32px',
                                padding: '40px',
                                width: '100%',
                                maxWidth: '440px',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                                position: 'relative',
                            }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    padding: '8px',
                                    background: '#F1F5F9',
                                    borderRadius: '50%',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <X size={20} color="#64748B" />
                            </button>

                            {/* Icon Header */}
                            <div style={{
                                width: '72px',
                                height: '72px',
                                background: 'rgba(76, 29, 149, 0.08)',
                                borderRadius: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px',
                            }}>
                                <Share2 size={32} color="#4C1D95" />
                            </div>

                            {/* Title */}
                            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                <h3 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 950,
                                    color: '#0F172A',
                                    margin: '0 0 8px',
                                    letterSpacing: '-0.02em',
                                }}>
                                    {title}
                                </h3>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#64748B',
                                    fontWeight: 600,
                                    margin: 0,
                                    lineHeight: 1.5,
                                }}>
                                    {subtitle}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                {/* Save Image */}
                                <button
                                    onClick={() => { onShareImage(true); onClose(); }}
                                    style={{
                                        width: '100%',
                                        padding: '18px 24px',
                                        background: '#F0FDF4',
                                        color: '#166534',
                                        borderRadius: '20px',
                                        border: '1.5px solid #DCFCE7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Download size={20} color="#10B981" />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#166534' }}>Save as Image</p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#4ADE80', fontWeight: 600 }}>Download PNG to your device</p>
                                    </div>
                                </button>

                                {/* Download PDF */}
                                <button
                                    onClick={() => { onDownloadPDF(); onClose(); }}
                                    style={{
                                        width: '100%',
                                        padding: '18px 24px',
                                        background: '#F8FAFC',
                                        color: '#0F172A',
                                        borderRadius: '20px',
                                        border: '1.5px solid #E2E8F0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: '#F1F5F9',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <FileText size={20} color="#64748B" />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>Export as PDF</p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Official document for records</p>
                                    </div>
                                </button>

                                {/* Copy Link */}
                                <button
                                    onClick={() => { onCopyLink(); onClose(); }}
                                    style={{
                                        width: '100%',
                                        padding: '18px 24px',
                                        background: 'rgba(76, 29, 149, 0.04)',
                                        color: '#4C1D95',
                                        borderRadius: '20px',
                                        border: '1.5px solid rgba(76, 29, 149, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div style={{
                                        width: '40px', height: '40px',
                                        background: 'rgba(76, 29, 149, 0.08)',
                                        borderRadius: '12px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        <Link2 size={20} color="#4C1D95" />
                                    </div>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#4C1D95' }}>Copy Invoice Link</p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#7C3AED', fontWeight: 600 }}>Paste and send via any channel</p>
                                    </div>
                                </button>

                            </div>

                            {/* Footer */}
                            <p style={{
                                textAlign: 'center',
                                fontSize: '11px',
                                color: '#CBD5E1',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginTop: '24px',
                                marginBottom: 0,
                            }}>
                                🔒 Secured Verified Sharing
                            </p>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ShareActionSheet;
