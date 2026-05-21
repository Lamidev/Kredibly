import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success("Welcome back!");
      
      if (data.user.role === 'admin') {
        navigate("/admin");
      } else if (!data.profile) {
        navigate("/onboarding");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      console.error("Login Error:", err);
      // Show specific error from backend if available
      const errorMessage = err.response?.data?.message || err.message || "Login failed. Please check your details.";
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
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.03em', color: '#000000' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}>Login to your account to manage your business.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 500 }}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="email"
              className="input-field"
              style={{ 
                  height: '56px', 
                  border: '1px solid var(--border)', 
                  borderRadius: '16px',
                  background: 'var(--background)',
                  fontSize: '1rem',
                  fontWeight: 400,
                  paddingLeft: '48px'
              }}
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="input-label" style={{ margin: 0, fontWeight: 500 }}>Password</label>
            <Link to="/auth/forgot-password" style={{ color: '#000000', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              style={{ 
                  height: '56px', 
                  border: '1px solid var(--border)', 
                  borderRadius: '16px', 
                  paddingLeft: '48px',
                  paddingRight: '56px',
                  background: 'var(--background)',
                  fontSize: '1rem',
                  fontWeight: 400  
              }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {loading ? "Logging in..." : "Login to Dashboard"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          New to Kredibly? {" "}
          <Link to="/auth/register" style={{ color: '#000000', fontWeight: 600, textDecoration: 'none' }}>Create an Account</Link>
        </p>
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

export default Login;
