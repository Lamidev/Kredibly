import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { RefreshCcw, Loader2, MailCheck } from "lucide-react";

const VerifyEmail = () => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const { verifyEmail, resendVerificationCode } = useAuth();
    const navigate = useNavigate();

    // Tick the cooldown countdown
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    // Auto-verify if 1-click magic link is clicked from email (?code=XXXXXX)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const codeParam = params.get("code");
        if (codeParam && codeParam.trim().length === 6) {
            const cleanCode = codeParam.trim();
            setCode(cleanCode);
            setLoading(true);
            verifyEmail(cleanCode)
                .then(() => {
                    navigate("/activate", { state: { verified: true } });
                })
                .catch((err) => {
                    console.error("Auto Verification Error:", err);
                    const errorMessage = err.response?.data?.message || err.message || "Verification link invalid or expired";
                    toast.error(errorMessage);
                })
                .finally(() => setLoading(false));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyEmail(code);
            navigate("/activate", { state: { verified: true } });
        } catch (err) {
            console.error("Verification Error:", err);
            const errorMessage = err.response?.data?.message || err.message || "Verification failed";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0 || resending) return;

        // Email is saved to localStorage by register.jsx on successful registration
        const registeredEmail = localStorage.getItem("kredibly_pending_email");
        if (!registeredEmail) {
            toast.error("We couldn't find your email. Please go back and register again.");
            return;
        }

        setResending(true);
        try {
            await resendVerificationCode(registeredEmail);
            toast.success("New code sent! Check your inbox (and spam folder).");
            setCooldown(60);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to resend. Try again shortly.";
            toast.error(msg);
        } finally {
            setResending(false);
        }
    };

    const pendingEmail = localStorage.getItem("kredibly_pending_email") || "your email";

    return (
        <div className="glass-card animate-fade-in" style={{ 
            padding: 'clamp(24px, 4vw, 40px)', 
            borderRadius: 'clamp(20px, 4vw, 28px)', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '440px',
            textAlign: 'center'
        }}>
            {/* Animated Mail Badge */}
            <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'rgba(76, 29, 149, 0.08)', 
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px'
            }}>
                <MailCheck size={32} />
            </div>

            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.03em', color: '#000000' }}>
                Check your email
            </h2>
            
            <p style={{ color: '#475569', fontWeight: 500, fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px' }}>
                We sent a 1-tap activation link to <strong style={{ color: '#0F172A' }}>{pendingEmail}</strong>. Click the button in the email to activate your account.
            </p>

            <button
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="btn-primary"
                style={{ 
                    width: '100%', 
                    height: '48px', 
                    borderRadius: '14px', 
                    fontSize: '0.95rem', 
                    fontWeight: 700, 
                    background: cooldown > 0 ? '#F1F5F9' : 'var(--primary)', 
                    color: cooldown > 0 ? '#94A3B8' : 'white',
                    border: 'none',
                    cursor: cooldown > 0 || resending ? 'not-allowed' : 'pointer',
                    boxShadow: cooldown > 0 ? 'none' : '0 8px 16px -4px var(--primary-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                }}
            >
                {resending 
                    ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Resending...</>
                    : cooldown > 0
                        ? `Resend available in ${cooldown}s`
                        : <><RefreshCcw size={16} /> Resend Activation Link</>
                }
            </button>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                <Link to="/auth/login" style={{ color: '#64748B', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}>
                    ← Back to Login
                </Link>
            </div>
        </div>
    );
};

const styles = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @media (max-width: 640px) {
    .input-field { height: 52px !important; font-size: 0.95rem !important; }
    .verify-code-input { height: 60px !important; font-size: 1.2rem !important; }
    .btn-primary { height: 56px !important; font-size: 1rem !important; }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default VerifyEmail;
