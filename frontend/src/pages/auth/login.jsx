import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

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
      toast.error(err.response?.data?.message || "Login failed. Please check your details.");
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
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.03em' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.05rem' }}>Login to your account to manage your business.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 700 }}>Email Address</label>
          <input
            type="email"
            className="input-field"
            style={{ 
                height: '56px', 
                border: '1px solid var(--border)', 
                borderRadius: '16px',
                background: 'var(--background)',
                fontSize: '1rem',
                fontWeight: 500 
            }}
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="input-label" style={{ margin: 0, fontWeight: 700 }}>Password</label>
            <Link to="/auth/forgot-password" style={{ color: 'var(--primary)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              style={{ 
                  height: '56px', 
                  border: '1px solid var(--border)', 
                  borderRadius: '16px', 
                  paddingRight: '56px',
                  background: 'var(--background)',
                  fontSize: '1rem',
                  fontWeight: 500  
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
              fontWeight: 700, 
              background: 'var(--primary)',
              boxShadow: '0 10px 20px -5px var(--primary-glow)' 
          }}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login to Dashboard"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          New to Kredibly? {" "}
          <Link to="/auth/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Create an Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
