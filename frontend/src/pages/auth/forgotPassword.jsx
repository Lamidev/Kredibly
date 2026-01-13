import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.success("Password reset code sent to your email!");
      navigate("/auth/reset-password");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-form-card w-full shadow-2xl" style={{ background: 'white', borderRadius: '32px' }}>
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', color: '#000', letterSpacing: '-0.02em' }}>Reset Password</h2>
        <p style={{ color: '#6B7280', fontWeight: 500, fontSize: '1.05rem' }}>We'll send a code to your email address</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="input-group">
          <label className="input-label">Confirm Email</label>
          <input
            type="email"
            className="input-field"
            style={{ height: '56px', border: '1.5px solid #E5E7EB', borderRadius: '14px' }}
            placeholder="yourname@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', height: '58px', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, background: 'var(--primary)' }}
          disabled={loading}
        >
          {loading ? "Sending link..." : "Send Reset Link"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F3F4F6' }}>
        <Link to="/auth/login" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: '#6B7280',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '0.95rem'
        }}>
          <ArrowLeft size={20} /> Back to Sign in
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;