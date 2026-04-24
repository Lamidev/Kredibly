import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, FileText, Link2, Share2, Download } from 'lucide-react';

const ShareActionSheet = ({ 
    isOpen, 
    onClose, 
    onShareImage, 
    onDownloadPDF, 
    onCopyLink,
    title = "Share Official Document",
    subtitle = "Choose how you'd like to share or save this record"
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.4)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 50000
                        }}
                    />

                    {/* Action Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'white',
                            borderTopLeftRadius: '32px',
                            borderTopRightRadius: '32px',
                            padding: '32px 24px 48px',
                            zIndex: 50001,
                            maxWidth: '500px',
                            margin: '0 auto',
                            boxShadow: '0 -10px 25px -5px rgba(0,0,0,0.1)'
                        }}
                    >
                        {/* Handle for Mobile Drag (Visual only) */}
                        <div style={{ width: '40px', height: '4px', background: '#E2E8F0', borderRadius: '2px', margin: '-16px auto 24px' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0F172A', margin: 0 }}>{title}</h3>
                                <p style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, marginTop: '4px' }}>{subtitle}</p>
                            </div>
                            <button 
                                onClick={onClose}
                                style={{ padding: '8px', background: '#F1F5F9', borderRadius: '50%', border: 'none', cursor: 'pointer' }}
                            >
                                <X size={20} color="#64748B" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Share as Image (Primary) */}
                            <button
                                onClick={() => { onShareImage(); onClose(); }}
                                style={{
                                    width: '100%',
                                    padding: '18px',
                                    background: 'linear-gradient(135deg, #4C1D95, #2E1065)',
                                    color: 'white',
                                    borderRadius: '20px',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 20px -5px rgba(76, 29, 149, 0.2)'
                                }}
                            >
                                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                                    <Share2 size={20} color="white" />
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Share to Apps</p>
                                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>WhatsApp, Instagram, etc.</p>
                                </div>
                            </button>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {/* Save to Gallery */}
                                <button
                                    onClick={() => { onShareImage(true); onClose(); }}
                                    style={{
                                        padding: '16px',
                                        background: '#F0FDF4',
                                        color: '#166534',
                                        borderRadius: '20px',
                                        border: '1.5px solid #DCFCE7',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Download size={20} color="#10B981" />
                                    <span style={{ fontSize: '13px', fontWeight: 800 }}>Save Image</span>
                                </button>

                                {/* Download PDF */}
                                <button
                                    onClick={() => { onDownloadPDF(); onClose(); }}
                                    style={{
                                        padding: '16px',
                                        background: '#F8FAFC',
                                        color: '#0F172A',
                                        borderRadius: '20px',
                                        border: '1.5px solid #E2E8F0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <FileText size={20} color="#64748B" />
                                    <span style={{ fontSize: '13px', fontWeight: 800 }}>Save PDF</span>
                                </button>
                            </div>

                            {/* Copy Link */}
                            <button
                                onClick={() => { onCopyLink(); onClose(); }}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'white',
                                    color: '#475569',
                                    borderRadius: '16px',
                                    border: '1px solid #F1F5F9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    marginTop: '8px'
                                }}
                            >
                                <Link2 size={16} color="#94A3B8" />
                                <span style={{ fontSize: '13px', fontWeight: 700 }}>Copy Invoice Link</span>
                            </button>
                        </div>

                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Share2 size={10} style={{ marginRight: '4px' }} /> Secured Verified Sharing
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ShareActionSheet;
