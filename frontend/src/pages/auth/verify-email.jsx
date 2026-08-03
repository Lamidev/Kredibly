import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { RefreshCcw, Loader2, Mail } from "lucide-react";

const VerifyEmail = () => {
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [locked, setLocked] = useState(false);
    const { verifyEmail, resendVerificationCode } = useAuth();
    const navigate = useNavigate();
    const inputs = useRef([]);

    // Cooldown countdown
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleChange = (index, value) => {
        // Accept only digits
        const digit = value.replace(/\D/g, "").slice(-1);
        const newDigits = [...digits];
        newDigits[index] = digit;
        setDigits(newDigits);
        // Auto-advance
        if (digit && index < 5) {
            inputs.current[index + 1]?.focus();
        }
        // Auto-submit when last box filled — flash first then submit
        if (digit && index === 5) {
            const code = [...newDigits].join("");
            if (code.length === 6) {
                setLocked(true);
                setTimeout(() => {
                    setLocked(false);
                    submitCode(code);
                }, 380);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 6) {
            setDigits(pasted.split(""));
            inputs.current[5]?.focus();
            submitCode(pasted);
        }
    };

    const submitCode = async (code) => {
        setLoading(true);
        try {
            await verifyEmail(code);
            navigate("/activate", { state: { verified: true } });
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Invalid or expired code.";
            toast.error(msg);
            setDigits(["", "", "", "", "", ""]);
            inputs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const code = digits.join("");
        if (code.length < 6) return toast.error("Enter the full 6-digit code.");
        submitCode(code);
    };

    const handleResend = async () => {
        if (cooldown > 0 || resending) return;
        const email = localStorage.getItem("kredibly_pending_email");
        if (!email) {
            toast.error("We couldn't find your email. Please register again.");
            return;
        }
        setResending(true);
        try {
            await resendVerificationCode(email);
            toast.success("New code sent! Check your inbox.");
            setCooldown(60);
            setDigits(["", "", "", "", "", ""]);
            inputs.current[0]?.focus();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to resend. Try again shortly.");
        } finally {
            setResending(false);
        }
    };

    const pendingEmail = localStorage.getItem("kredibly_pending_email") || "your email";

    return (
        <div className="glass-card animate-fade-in" style={{
            padding: 'clamp(28px, 5vw, 44px)',
            borderRadius: 'clamp(20px, 4vw, 28px)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '420px',
            textAlign: 'center'
        }}>
            {/* Mail badge */}
            <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(76, 29, 149, 0.08)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
            }}>
                <Mail size={28} />
            </div>

            <h2 style={{ fontSize: 'clamp(1.35rem, 4vw, 1.8rem)', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.03em', color: '#0F172A' }}>
                Check your email
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.88rem', fontWeight: 500, lineHeight: 1.5, marginBottom: '28px' }}>
                We sent a 6-digit code to <strong style={{ color: '#0F172A' }}>{pendingEmail}</strong>
            </p>

            <form onSubmit={handleSubmit}>
                {/* 6 digit boxes */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '24px' }} onPaste={handlePaste}>
                    {digits.map((d, i) => (
                        <input
                            key={i}
                            ref={el => inputs.current[i] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={d}
                            autoFocus={i === 0}
                            onChange={e => handleChange(i, e.target.value)}
                            onKeyDown={e => handleKeyDown(i, e)}
                            style={{
                                width: 'clamp(40px, 12vw, 52px)',
                                height: 'clamp(48px, 13vw, 60px)',
                                textAlign: 'center',
                                fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
                                fontWeight: 700,
                                border: locked ? '2px solid #10B981' : d ? '2px solid var(--primary)' : '1.5px solid #E2E8F0',
                                borderRadius: '12px',
                                background: locked ? 'rgba(16,185,129,0.07)' : d ? 'rgba(76,29,149,0.04)' : '#FAFAFA',
                                color: locked ? '#10B981' : '#0F172A',
                                outline: 'none',
                                transition: 'border 0.15s, background 0.15s, color 0.15s, transform 0.15s, box-shadow 0.15s',
                                caretColor: 'var(--primary)',
                                transform: locked ? 'scale(1.08)' : 'scale(1)',
                                boxShadow: locked ? '0 0 0 3px rgba(16,185,129,0.18)' : 'none',
                                animation: locked ? 'otp-lock 0.38s ease' : 'none',
                            }}
                        />
                    ))}
                </div>

                <button
                    type="submit"
                    disabled={loading || digits.join("").length < 6}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        height: '48px',
                        borderRadius: '14px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        background: digits.join("").length < 6 ? '#F1F5F9' : 'var(--primary)',
                        color: digits.join("").length < 6 ? '#94A3B8' : 'white',
                        border: 'none',
                        cursor: digits.join("").length < 6 || loading ? 'not-allowed' : 'pointer',
                        boxShadow: digits.join("").length < 6 ? 'none' : '0 8px 16px -4px var(--primary-glow)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    {loading
                        ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
                        : "Verify Email →"
                    }
                </button>
            </form>

            {/* Resend + Back */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || resending}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: cooldown > 0 ? '#94A3B8' : 'var(--primary)',
                        fontWeight: 600,
                        fontSize: '0.83rem',
                        cursor: cooldown > 0 || resending ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: 0
                    }}
                >
                    {resending
                        ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                        : cooldown > 0
                            ? `Resend in ${cooldown}s`
                            : <><RefreshCcw size={13} /> Resend code</>
                    }
                </button>
                <Link to="/auth/login" style={{ color: '#94A3B8', textDecoration: 'none', fontWeight: 600, fontSize: '0.83rem' }}>
                    Back to Login
                </Link>
            </div>
            <style>{`
                @keyframes otp-lock {
                    0%   { transform: scale(1); }
                    35%  { transform: scale(1.12); }
                    65%  { transform: scale(1.06); }
                    100% { transform: scale(1.08); }
                }
            `}</style>
        </div>
    );
};

export default VerifyEmail;
