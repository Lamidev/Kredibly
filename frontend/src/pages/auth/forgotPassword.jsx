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
    <div className="glass-card animate-fade-in" style={{ 
      padding: 'clamp(24px, 6vw, 48px)', 
      borderRadius: 'clamp(20px, 4vw, 32px)', 
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '500px'
    }}>
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.03em', color: '#000000' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}>Enter your email to receive a 6-digit security code.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 500 }}>Email Address</label>
          <div style={{ position: 'relative' }}>
             <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input
               type="email"
               className="input-field"
               style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', background: 'var(--background)', fontWeight: 400 }}
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
              fontWeight: 600, 
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
          fontWeight: 500,
          textDecoration: 'none',
          fontSize: '0.95rem'
        }}>
          <ArrowLeft size={18} /> Back to login
        </Link>
      </div>
    </div>
  );
};

const styles = `
  @media (max-width: 640px) {
    .input-field {
      height: 52px !important;
      font-size: 0.95rem !important;
    }
    .btn-primary {
      height: 56px !important;
      font-size: 1rem !important;
    }
  }
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default ForgotPassword;