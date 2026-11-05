import React from "react";
import { motion } from "framer-motion";
import { Mail, Sparkles } from "lucide-react";
import SEO from "../../components/public/SEO";

const TransitionPage = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#070A12",
        color: "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: "32px 24px",
      }}
    >
      <SEO
        title="Kredibly is Evolving | A New Chapter"
        description="Kredibly is entering a new chapter. We are taking everything we've learned and reimagining what comes next."
      />

      {/* Ambient background glows */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(14, 165, 233, 0.08) 45%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-15%",
          right: "10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Subtle Grid Pattern Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000 60%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, #000 60%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Top Header / Logo */}
      <header
        style={{
          width: "100%",
          maxWidth: "1100px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1,
          paddingTop: "12px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <img
            src="/krediblyrevamped.png"
            alt="Kredibly"
            style={{
              height: "28px",
              width: "auto",
              filter: "brightness(0) invert(1)",
              opacity: 0.95,
            }}
          />
        </motion.div>
      </header>

      {/* Main Center Content */}
      <main
        style={{
          width: "100%",
          maxWidth: "680px",
          textAlign: "center",
          zIndex: 1,
          padding: "40px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Subtle pill tag */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "9999px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#94A3B8",
            fontSize: "0.82rem",
            fontWeight: 500,
            letterSpacing: "0.03em",
            marginBottom: "28px",
            backdropFilter: "blur(8px)",
          }}
        >
          <Sparkles size={14} style={{ color: "#38BDF8" }} />
          <span>A new chapter is underway</span>
        </motion.div>

        {/* Primary Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontSize: "clamp(2.5rem, 6vw, 3.75rem)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: "0 0 16px 0",
            background: "linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Kredibly is evolving.
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            fontSize: "clamp(1.15rem, 2.5vw, 1.45rem)",
            fontWeight: 400,
            color: "#94A3B8",
            margin: "0 0 28px 0",
            letterSpacing: "-0.01em",
          }}
        >
          We're building what's next.
        </motion.h2>

        {/* Narrative / Context paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            fontSize: "clamp(1rem, 2vw, 1.1rem)",
            lineHeight: 1.7,
            color: "#64748B",
            maxWidth: "560px",
            margin: "0 auto 36px auto",
          }}
        >
          Kredibly is entering a new chapter. We're taking everything we've
          learned and reimagining what comes next — with a renewed vision, a
          new direction, and something exciting in the works behind the scenes.
        </motion.p>

        {/* Enquiries Contact Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            padding: "16px 24px",
            borderRadius: "14px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "#64748B" }}>
            For enquiries or existing account support
          </span>
          <a
            href="mailto:hello@usekredibly.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "#F8FAFC",
              fontSize: "0.95rem",
              fontWeight: 500,
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#38BDF8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#F8FAFC")}
          >
            <Mail size={16} style={{ color: "#38BDF8" }} />
            <span>hello@usekredibly.com</span>
          </a>
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        style={{
          width: "100%",
          maxWidth: "1100px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1,
          paddingBottom: "8px",
        }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            fontSize: "0.82rem",
            color: "#475569",
            margin: 0,
            textAlign: "center",
          }}
        >
          &copy; {new Date().getFullYear()} Kredibly. A new chapter is underway.
        </motion.p>
      </footer>
    </div>
  );
};

export default TransitionPage;

