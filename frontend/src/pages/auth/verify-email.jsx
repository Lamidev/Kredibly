import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { RefreshCcw, Loader2 } from "lucide-react";

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyEmail(code);
            toast.success("Email verified successfully!");
            navigate("/onboarding");
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

    return (
        <div className="glass-card animate-fade-in" style={{ 
            padding: 'clamp(24px, 6vw, 48px)', 
            borderRadius: 'clamp(20px, 4vw, 32px)', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '500px'
        }}>
            <div style={{ textAlign: 'left', marginBottom: '32px' }}>
                <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.03em', color: '#000000' }}>Verify Account</h2>
                <p style={{ color: '#6B7280', fontWeight: 400, fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}>Enter the 6-digit code we sent you</p>
                <p style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '8px', fontWeight: 500 }}>
                    ⚠️ Not seeing it? Check your Spam folder.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="input-group" style={{ marginBottom: '40px' }}>
                    <label className="input-label" style={{ fontWeight: 500 }}>Verification Code</label>
                    <input
                        type="text"
                        className="input-field verify-code-input text-center tracking-[0.5em] font-bold"
                        style={{ height: '70px', border: '1.5px solid #E5E7EB', borderRadius: '14px', fontSize: '1.5rem', fontWeight: 600 }}
                        placeholder="000000"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        autoComplete="one-time-code"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ 
                        width: '100%', 
                        height: '60px', 
                        borderRadius: '16px', 
                        fontSize: '1.1rem', 
                        fontWeight: 600, 
                        background: 'var(--primary)', 
                        marginTop: '8px',
                        boxShadow: '0 10px 20px -5px var(--primary-glow)' 
                    }}
                    disabled={loading}
                >
                    {loading ? "Verifying..." : "Confirm Verification"}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F3F4F6' }}>
                <button
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: cooldown > 0 ? '#94A3B8' : '#000000',
                        fontWeight: 600, 
                        cursor: cooldown > 0 || resending ? 'not-allowed' : 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        margin: '0 auto',
                        opacity: cooldown > 0 ? 0.6 : 1,
                        transition: 'all 0.2s'
                    }}
                    onClick={handleResend}
                    disabled={cooldown > 0 || resending}
                >
                    {resending 
                        ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</>
                        : cooldown > 0
                            ? `Resend in ${cooldown}s`
                            : <><RefreshCcw size={18} /> Resend verification code</>
                    }
                </button>
                <Link to="/auth/login" style={{ display: 'block', marginTop: '16px', color: '#6B7280', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                    Sign in with another account
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
