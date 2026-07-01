import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

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
      toast.success("Account created! Please check your email for verification.");
      navigate("/auth/verify-email");
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
      padding: 'clamp(24px, 6vw, 48px)', 
      borderRadius: 'clamp(20px, 4vw, 32px)', 
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '500px'
    }}>
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.03em', color: '#000000' }}>Create Account</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}>Join Kredibly and start growing your business today.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 500 }}>Full Name</label>
          <div style={{ position: 'relative' }}>
             <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input
               type="text"
               className="input-field"
               style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', background: 'var(--background)', fontWeight: 400 }}
               placeholder="e.g. John Doe"
               value={formData.name}
               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
               required
             />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 500 }}>Email Address</label>
          <div style={{ position: 'relative' }}>
             <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input
               type="email"
               className="input-field"
               style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', background: 'var(--background)', fontWeight: 400 }}
               placeholder="your@email.com"
               value={formData.email}
               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
               required
             />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 500 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', paddingRight: '52px', background: 'var(--background)', fontWeight: 400 }}
              placeholder="8+ chars, 1 number & 1 symbol"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>Must include a number and a special character (e.g. !@#)</p>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ 
              width: '100%', 
              height: '60px', 
              borderRadius: '16px', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              background: 'var(--primary)',
              marginTop: '8px',
              cursor: 'pointer',
              boxShadow: '0 10px 20px -5px var(--primary-glow)' 
          }}
        >
          {loading ? "Creating account..." : "Start Free Trial"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          Already have an account? {" "}
          <Link to="/auth/login" style={{ color: '#000000', fontWeight: 600, textDecoration: 'none' }}>Login instead</Link>
        </p>
        <Link
          to="/"
          style={{
            fontSize: '0.85rem',
            color: '#64748B',
            textDecoration: 'none',
            fontWeight: 500,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#0F172A'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
        >
          ← Back to home
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
