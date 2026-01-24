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
      console.error("Forgot Password Error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to send reset code. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-glass" style={{ 
      padding: '40px', 
      borderRadius: '32px', 
      background: 'white',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-premium)' 
    }}>
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.03em' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.05rem' }}>Enter your email to receive a password reset code.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 700 }}>Confirm Email</label>
          <div style={{ position: 'relative' }}>
             <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input
               type="email"
               className="input-field"
               style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', background: 'var(--background)', fontWeight: 500 }}
               placeholder="your@email.com"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               required
             />
          </div>
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
              boxShadow: '0 10px 20px -5px var(--primary-glow)' 
          }}
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <Link to="/auth/login" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--text-muted)',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '0.95rem'
        }}>
          <ArrowLeft size={18} /> Back to login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;