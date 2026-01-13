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

    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setLoading(false);
      return toast.error("Password must be at least 8 characters, include uppercase, lowercase, number, and special character.");
    }

    try {
      await registerUser(formData.name, formData.email, formData.password);
      toast.success("Registration successful! Verify your email.");
      navigate("/auth/verify-email");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-form-card w-full shadow-2xl" style={{ background: 'white', borderRadius: '32px' }}>
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', color: '#000', letterSpacing: '-0.02em' }}>Create Account</h2>
        <p style={{ color: '#6B7280', fontWeight: 500, fontSize: '1.05rem' }}>Join the Kredibly revolution today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <input
            type="text"
            className="input-field"
            style={{ height: '56px', border: '1.5px solid #E5E7EB', borderRadius: '14px' }}
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Email Address</label>
          <input
            type="email"
            className="input-field"
            style={{ height: '56px', border: '1.5px solid #E5E7EB', borderRadius: '14px' }}
            placeholder="name@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Create Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              style={{ height: '56px', border: '1.5px solid #E5E7EB', borderRadius: '14px', paddingRight: '52px' }}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
          {loading ? "Creating account..." : "Get started now"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F3F4F6' }}>
        <p style={{ fontSize: '1rem', color: '#4B5563', fontWeight: 500 }}>
          Already using Kredibly? {" "}
          <Link to="/auth/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Log in here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
