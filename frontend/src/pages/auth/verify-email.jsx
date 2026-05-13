import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, RefreshCcw } from "lucide-react";

const VerifyEmail = () => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const { verifyEmail } = useAuth();
    const navigate = useNavigate();

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

    return (
        <div className="glass-card" style={{ 
            padding: '48px', 
            borderRadius: '32px', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'
        }}>
            <div style={{ textAlign: 'left', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.04em', color: '#000000' }}>Verify Account</h2>
                <p style={{ color: '#6B7280', fontWeight: 500, fontSize: '1.05rem' }}>Enter the 6-digit code we sent you</p>
                <p style={{ fontSize: '0.85rem', color: '#EF4444', marginTop: '8px', fontWeight: 600 }}>
                    ⚠️ Not seeing it? Check your Spam or Promotions folder.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="input-group" style={{ marginBottom: '40px' }}>
                    <label className="input-label">Verification Code</label>
                    <input
                        type="text"
                        className="input-field text-center tracking-[0.5em] font-bold"
                        style={{ height: '70px', border: '1.5px solid #E5E7EB', borderRadius: '14px', fontSize: '1.5rem' }}
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
                        fontWeight: 700, 
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
                    style={{ background: 'none', border: 'none', color: '#000000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto' }}
                    onClick={() => toast.info("New code sent!")}
                >
                    <RefreshCcw size={18} /> Resend verification code
                </button>
                <Link to="/auth/login" style={{ display: 'block', marginTop: '16px', color: '#6B7280', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                    Sign in with another account
                </Link>
            </div>
        </div>
    );
};

export default VerifyEmail;
