import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft, Key, Eye, EyeOff } from "lucide-react";
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
      return toast.error("Passwords do not match");
    }

    setLoading(true);
    try {
      await resetPassword(formData.code, formData.password);
      toast.success("Password reset successful! You can now sign in.");
      navigate("/auth/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card auth-form-card w-full shadow-2xl" style={{ background: 'white', borderRadius: '32px' }}>
      <div style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', color: '#000', letterSpacing: '-0.02em' }}>Set New Password</h2>
        <p style={{ color: '#6B7280', fontWeight: 500, fontSize: '1.05rem' }}>Enter the code sent to your email</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="input-group">
          <label className="input-label">Security Code</label>
          <input
            type="text"
            className="input-field"
            style={{ height: '56px', border: '1.5px solid #E5E7EB', borderRadius: '14px' }}
            placeholder="Enter 6-digit code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? "text" : "password"}
              className="input-field"
              style={{ height: '56px', border: '1.5px solid #E5E7EB', borderRadius: '14px', paddingRight: '52px' }}
              placeholder="Minimum 8 characters"
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

        <div className="input-group">
          <label className="input-label">Confirm Password</label>
          <input
            type="password"
            className="input-field"
            style={{ height: '56px', border: '1.5px solid #E5E7EB', borderRadius: '14px' }}
            placeholder="Repeat new password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', height: '58px', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, background: 'var(--primary)' }}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F3F4F6' }}>
        <Link to="/auth/login" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: '#6B7280',
          fontWeight: 700,
          textDecoration: 'none',
          fontSize: '0.95rem'
        }}>
          <ArrowLeft size={20} /> Back to Sign in
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;