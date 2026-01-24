import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function AuthLayout() {
  const navigate = useNavigate();

  return (
    <div className="auth-pattern" style={{ 
      minHeight: '100vh', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Dynamic Background Overlays */}
      <div className="pattern-dots" style={{ opacity: 0.05 }}></div>
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0) 0%, rgba(248, 250, 252, 0.4) 100%)',
        pointerEvents: 'none'
      }}></div>

      {/* Persistent Logo Header */}
      <div
        onClick={() => navigate('/')}
        className="auth-logo-header animate-fade-in"
        style={{ 
          padding: '40px',
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          width: 'fit-content'
        }}
      >
        <img 
          src="/krediblyrevamped.png" 
          alt="Kredibly" 
          style={{ height: '40px', width: 'auto' }} 
        />
      </div>

      {/* Main Form Container */}
      <main className="auth-main-container" style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Outlet />
          </motion.div>
          
          <div style={{ 
            marginTop: '40px', 
            textAlign: 'center', 
            color: '#000000', 
            fontSize: '0.85rem', 
            fontWeight: 700,
            opacity: 1 
          }}>
            <p>© {new Date().getFullYear()} Kredibly. All records are safe and secure.</p>
          </div>
        </div>
      </main>

      <style>{`
        .auth-pattern {
          background-image: url('/Krediblypattern.png');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          background-color: var(--background);
        }
        @media (max-width: 640px) {
          .auth-main-container {
            padding: 0 12px 40px !important; /* Removed top padding to pull up */
            align-items: flex-start !important; /* Align to top instead of center */
          }
          .dashboard-glass {
            padding: 24px 20px !important;
            border-radius: 24px !important;
            margin-top: 10px; /* Slight margin from logo */
          }
          .auth-logo-header {
            padding: 24px 20px 10px !important; /* Reduced bottom padding */
          }
        }
      `}</style>
    </div>
  );
}

export default AuthLayout;