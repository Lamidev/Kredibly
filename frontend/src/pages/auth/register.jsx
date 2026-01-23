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

    // Simple Password Validation
    if (formData.password.length < 8) {
      setLoading(false);
      return toast.error("Password must be at least 8 characters long.");
    }

    try {
      await registerUser(formData.name, formData.email, formData.password);
      toast.success("Account created! Please check your email for verification.");
      navigate("/auth/verify-email");
    } catch (err) {
      toast.error(err.message || "Registration failed. Please try again.");
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
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px', letterSpacing: '-0.03em' }}>Create Account</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.05rem' }}>Join Kredibly and start growing your business today.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 700 }}>Business or Full Name</label>
          <div style={{ position: 'relative' }}>
             <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input
               type="text"
               className="input-field"
               style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', background: 'var(--background)', fontWeight: 500 }}
               placeholder="e.g. John Doe or Acme Stores"
               value={formData.name}
               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
               required
             />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 700 }}>Email Address</label>
          <div style={{ position: 'relative' }}>
             <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input
               type="email"
               className="input-field"
               style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', background: 'var(--background)', fontWeight: 500 }}
               placeholder="your@email.com"
               value={formData.email}
               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
               required
             />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 700 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', paddingRight: '52px', background: 'var(--background)', fontWeight: 500 }}
              placeholder="At least 8 characters"
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
          {loading ? "Creating account..." : "Start Free Trial"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          Already have an account? {" "}
          <Link to="/auth/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Login instead</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
