import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    // Strong Password Validation
    const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setLoading(false);
      return toast.error("Password must be at least 8 characters long and include at least one number and one special character (e.g. !@#$%^&*).");
    }

    try {
      await registerUser(formData.name, formData.email, formData.password);
      localStorage.setItem("kredibly_pending_email", formData.email); // used by verify-email resend
      toast.success("Account created! Let's activate your account.");
      navigate("/activate");
    } catch (err) {
      console.error("Registration Error details:", err); // Log for debugging
      // Show specific error from backend if available
      const errorMessage = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ 
      padding: 'clamp(20px, 4vw, 36px)', 
      borderRadius: 'clamp(20px, 4vw, 28px)', 
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '460px'
    }}>
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.03em', color: '#000000' }}>Create your account</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.88rem', margin: 0 }}>Start managing your business in seconds.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Your Name</label>
          <div style={{ position: 'relative' }}>
             <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input
               type="text"
               className="input-field"
               style={{ height: '48px', border: '1px solid var(--border)', borderRadius: '14px', paddingLeft: '46px', background: 'var(--background)', fontWeight: 500, fontSize: '0.92rem' }}
               placeholder="e.g. Tosin Adebayo"
               value={formData.name}
               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
               required
             />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Email Address</label>
          <div style={{ position: 'relative' }}>
             <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input
               type="email"
               className="input-field"
               style={{ height: '48px', border: '1px solid var(--border)', borderRadius: '14px', paddingLeft: '46px', background: 'var(--background)', fontWeight: 500, fontSize: '0.92rem' }}
               placeholder="your@email.com"
               value={formData.email}
               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
               required
             />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '6px', display: 'block', color: '#1E293B' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              style={{ height: '48px', border: '1px solid var(--border)', borderRadius: '14px', paddingLeft: '46px', paddingRight: '48px', background: 'var(--background)', fontWeight: 500, fontSize: '0.92rem' }}
              placeholder="8+ chars (include number & symbol)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ 
              width: '100%', 
              height: '50px', 
              borderRadius: '14px', 
              fontSize: '1rem', 
              fontWeight: 700, 
              background: 'var(--primary)',
              marginTop: '6px',
              cursor: 'pointer',
              boxShadow: '0 8px 16px -4px var(--primary-glow)' 
          }}
        >
           {loading ? "Creating account..." : "Create Free Account →"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, margin: 0 }}>
          Have an account? {" "}
          <Link to="/auth/login" style={{ color: '#000000', fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
        </p>
        <Link
          to="/"
          style={{
            fontSize: '0.82rem',
            color: '#64748B',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#0F172A'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
        >
          ← Home
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

export default Register;
