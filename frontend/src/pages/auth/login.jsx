import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

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
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-form-card w-full shadow-2xl" style={{ background: 'white', borderRadius: '32px' }}>
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', color: '#000', letterSpacing: '-0.02em' }}>Sign In</h2>
        <p style={{ color: '#6B7280', fontWeight: 500, fontSize: '1.05rem' }}>Access your Kredibly dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input
            type="email"
            className="input-field"
            style={{ height: '56px', border: '1.5px solid #E5E7EB', borderRadius: '14px' }}
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label className="input-label" style={{ margin: 0 }}>Password</label>
            <Link to="/auth/forgot-password" style={{ color: '#9CA3AF', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}>Forgot Password?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              style={{ height: '56px', border: '1.5px solid #E5E7EB', borderRadius: '14px', paddingRight: '52px' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', height: '58px', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, background: 'var(--primary)' }}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in to account"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F3F4F6' }}>
        <p style={{ fontSize: '1rem', color: '#4B5563', fontWeight: 500 }}>
          Don't have an account? {" "}
          <Link to="/auth/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Sign up free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
