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
  
  // Registration disabled until April 1st, 2026
  const isRegistrationOpen = new Date() >= new Date('2026-04-01T00:00:00Z');
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isRegistrationOpen) {
      return toast.error("Registration opens April 1st. Please join the waitlist!");
    }

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
      console.error("Registration Error details:", err); // Log for debugging
      // Show specific error from backend if available
      const errorMessage = err.response?.data?.message || err.message || "Registration failed. Please try again.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ 
      padding: '48px', 
      borderRadius: '32px', 
      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)'
    }}>
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h2 className="premium-gradient" style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '8px', letterSpacing: '-0.04em' }}>Create Account</h2>
        <p style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.05rem' }}>Join Kredibly and start growing your business today.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Full Name</label>
          <div style={{ position: 'relative' }}>
             <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
             <input
               type="text"
               className="input-field"
               style={{ height: '56px', border: '1px solid var(--border)', borderRadius: '16px', paddingLeft: '48px', background: 'var(--background)', fontWeight: 500 }}
               placeholder="e.g. John Doe"
               value={formData.name}
               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
               required
             />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label" style={{ fontWeight: 600 }}>Email Address</label>
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
          <label className="input-label" style={{ fontWeight: 600 }}>Password</label>
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
          disabled={loading || !isRegistrationOpen}
          style={{ 
              width: '100%', 
              height: '60px', 
              borderRadius: '16px', 
              fontSize: '1.1rem', 
              fontWeight: 700, 
              background: isRegistrationOpen ? 'var(--primary)' : '#94A3B8',
              marginTop: '8px',
              cursor: isRegistrationOpen ? 'pointer' : 'not-allowed',
              boxShadow: isRegistrationOpen ? '0 10px 20px -5px var(--primary-glow)' : 'none' 
          }}
        >
          {loading ? "Creating account..." : (isRegistrationOpen ? "Start Free Trial" : "Opens April 1st")}
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
