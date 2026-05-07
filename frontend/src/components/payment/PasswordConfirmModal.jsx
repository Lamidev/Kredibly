import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, X, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';

const PasswordConfirmModal = ({ isOpen, onClose, onConfirm }) => {
    const [password, setPassword] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password) {
            setError("Password is required");
            return;
        }

        setError("");
        setVerifying(true);
        try {
            await onConfirm(password);
            // On success, close automatically or let parent handle
            setPassword("");
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Incorrect password";
            setError(errorMsg);
            setVerifying(false);
        }
    };

    const handleClose = () => {
        setPassword("");
        setError("");
        setVerifying(false);
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={handleClose}
                style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(8px)' }}
            />
            
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 10 }} 
                animate={{ scale: 1, opacity: 1, y: 0 }} 
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', margin: '16px' }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ background: '#F8FAFC', padding: 'clamp(20px, 5vw, 24px)', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
                    <div style={{ width: '56px', height: '56px', background: '#F0F9FF', color: '#0EA5E9', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Shield size={28} />
                    </div>
                    <h3 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.25rem)', fontWeight: 900, color: '#0F172A', marginBottom: '8px' }}>Security Check</h3>
                    <p style={{ color: '#64748B', fontSize: 'clamp(0.8rem, 3.5vw, 0.9rem)', lineHeight: 1.5, margin: 0 }}>
                        For your security, please confirm your password to update sensitive bank details.
                    </p>
                </div>

                <div style={{ padding: 'clamp(20px, 5vw, 24px)' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 900, color: '#94A3B8', marginBottom: '8px', letterSpacing: '0.05em' }}>
                                Confirm Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '14px 16px', paddingLeft: '44px', borderRadius: '12px', border: error ? '1px solid #EF4444' : '1px solid #E2E8F0', background: error ? '#FEF2F2' : '#F8FAFC', fontSize: '1rem', fontWeight: 600, outline: 'none', transition: 'all 0.2s' }}
                                    autoFocus
                                />
                                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: error ? '#EF4444' : '#94A3B8' }} />
                            </div>
                            {error && <p style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>{error}</p>}
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                type="button" 
                                onClick={handleClose}
                                style={{ flex: 1, padding: '14px', borderRadius: '14px', background: 'transparent', border: '1px solid #E2E8F0', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}
                                disabled={verifying}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                style={{ flex: 1.5, padding: '14px', borderRadius: '14px', background: '#0F172A', border: 'none', fontWeight: 700, color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                disabled={verifying || !password}
                            >
                                {verifying ? <Loader2 size={18} className="spin-animation" /> : "Verify & Save"}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>,
        document.body
    );
};

export default PasswordConfirmModal;
