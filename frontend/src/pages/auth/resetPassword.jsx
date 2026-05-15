import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, Key, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    code: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setLoading(false);
      return toast.error("Password must be at least 8 characters long and include at least one number and one special character (e.g. !@#$%^&*).");
    }

    setLoading(true);
    try {
      await resetPassword(formData.code, formData.password);
      toast.success("Password reset successful! You can now login.");
      navigate("/auth/login");
    } catch (err) {
      console.error("Reset Password Error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Reset failed. Please try again.";
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
        <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.04em', color: '#000000' }}>Reset Password</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}>Securely update your credentials.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Security Code</label>
          <div style={{ position: 'relative' }}>
             <Key size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input
               type="text"
               className="input-field security-code-input"
               style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', background: 'var(--background)', fontWeight: 700, fontSize: '1.2rem' }}
               placeholder="Enter 6-digit code"
               value={formData.code}
               onChange={(e) => setFormData({ ...formData, code: e.target.value })}
               autoComplete="one-time-code"
               maxLength={6}
               required
             />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>New Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', paddingRight: '52px', background: 'var(--background)', fontWeight: 500 }}
              placeholder="8+ chars, 1 number & 1 symbol"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 600 }}>Must include a number and a special character (e.g. !@#)</p>
        </div>

        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="password"
              className="input-field"
              style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', background: 'var(--background)', fontWeight: 500 }}
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              marginTop: '8px',
              boxShadow: '0 10px 20px -5px var(--primary-glow)' 
          }}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
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

const styles = `
  @media (max-width: 640px) {
    .input-field {
      height: 52px !important;
      font-size: 0.95rem !important;
    }
    .security-code-input {
      font-size: 1rem !important;
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

export default ResetPassword;