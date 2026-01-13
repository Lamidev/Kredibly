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
            toast.error(err.response?.data?.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card auth-form-card w-full shadow-2xl" style={{ background: 'white', borderRadius: '32px' }}>
            <div style={{ textAlign: 'left', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', color: '#000', letterSpacing: '-0.02em' }}>Verify Account</h2>
                <p style={{ color: '#6B7280', fontWeight: 500, fontSize: '1.05rem' }}>Enter the 6-digit code we sent you</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="input-group">
                    <label className="input-label">Verification Code</label>
                    <input
                        type="text"
                        className="input-field text-center tracking-[0.5em] font-bold"
                        style={{ height: '70px', border: '1.5px solid #E5E7EB', borderRadius: '14px', fontSize: '1.5rem' }}
                        placeholder="000000"
                        maxLength={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', height: '58px', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, background: 'var(--primary)' }}
                    disabled={loading}
                >
                    {loading ? "Verifying..." : "Confirm Verification"}
                </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F3F4F6' }}>
                <button
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '0 auto' }}
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
