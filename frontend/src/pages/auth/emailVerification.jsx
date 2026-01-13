import { useNavigate } from "react-router-dom";
import { Mail} from "lucide-react";

const EmailVerification = () => {
  const navigate = useNavigate();

  return (
    <div className="glass-card auth-form-card w-full shadow-2xl" style={{ background: 'white', borderRadius: '32px', textAlign: 'center' }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'rgba(16, 185, 129, 0.1)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px'
      }}>
        <Mail size={40} color="#10B981" />
      </div>

      <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px', color: '#000', letterSpacing: '-0.02em' }}>Check Your Inbox</h2>
      <p style={{ color: '#6B7280', fontWeight: 500, fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '32px' }}>
        We've sent a verification link to your email address. Please click the link to activate your account.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button
          onClick={() => window.open('https://mail.google.com', '_blank')}
          className="btn-primary"
          style={{ width: '100%', height: '58px', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, background: 'var(--primary)' }}
        >
          Open Email App
        </button>

        <button
          onClick={() => navigate('/auth/login')}
          style={{ width: '100%', height: '58px', borderRadius: '14px', fontSize: '1.1rem', fontWeight: 700, background: 'none', border: '1.5px solid #E5E7EB', color: '#374151', cursor: 'pointer' }}
        >
          Back to Login
        </button>
      </div>

      <p style={{ marginTop: '32px', color: '#9CA3AF', fontSize: '0.95rem', fontWeight: 500 }}>
        Didn't receive the link? <br />
        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', padding: '4px' }}>
          Resend link
        </button>
      </p>
    </div>
  );
};

export default EmailVerification;