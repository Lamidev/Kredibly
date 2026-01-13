import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function AuthLayout() {
  const navigate = useNavigate();

  return (
    <div className="auth-pattern auth-layout-container">
      <div className="pattern-dots"></div>

      {/* Persistent Logo */}
      <div
        onClick={() => navigate('/')}
        className="auth-logo-wrapper"
      >
        <img
          src="/krediblyrevamped.png"
          alt="Kredibly"
          style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Robust Centering Container using Vanilla CSS */}
      <div className="auth-main-content">
        <div className="auth-form-wrapper">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;