import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Store, MessageCircle, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { isValidNigerianPhone, formatPhoneForDB } from "../../utils/validation";

const Activate = () => {
    const { user, profile, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");

    // Detect if the stored displayName was auto-set by the migration script
    // (i.e. it exactly matches the registration name, not a deliberate invoice name)
    const wasAutoFilled =
        profile?.displayName &&
        user?.name &&
        profile.displayName.toLowerCase().trim() === user.name.toLowerCase().trim();

    useEffect(() => {
        if (profile?.displayName) {
            setDisplayName(profile.displayName);
        }
    }, [profile]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!displayName.trim()) {
            return toast.error("Please enter the name that should appear on your invoices.");
        }
        if (!whatsappNumber.trim()) {
            return toast.error("Your WhatsApp number is required so Kreddy can reach you.");
        }
        if (!isValidNigerianPhone(whatsappNumber)) {
            return toast.error("Enter a valid Nigerian WhatsApp number (e.g. 08012345678).");
        }

        setLoading(true);
        try {
            const savedLang = localStorage.getItem("kreddy_preferred_language") || "english";
            await updateProfile({
                displayName: displayName.trim(),
                whatsappNumber: formatPhoneForDB(whatsappNumber),
                onboardingStep: 4,
                assistantSettings: { preferredLanguage: savedLang },
            });
            toast.success("You're all set! Welcome to Kredibly.");
            navigate("/dashboard");
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="auth-pattern"
            style={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                overflowX: "hidden",
            }}
        >
            <div className="pattern-dots" style={{ opacity: 0.05 }} />
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0%, rgba(248,250,252,0.4) 100%)",
                    pointerEvents: "none",
                }}
            />

            {/* Logo */}
            <div
                onClick={() => navigate("/")}
                style={{
                    padding: "clamp(20px, 4vw, 40px) clamp(20px, 5vw, 40px) 12px",
                    cursor: "pointer",
                    zIndex: 100,
                    display: "flex",
                    alignItems: "center",
                    width: "fit-content",
                }}
            >
                <img
                    src="/krediblyrevamped.png"
                    alt="Kredibly"
                    style={{ height: "clamp(30px, 4vw, 40px)", width: "auto" }}
                />
            </div>

            {/* Main card */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px 24px 60px",
                    position: "relative",
                    zIndex: 10,
                }}
            >
                <div style={{ maxWidth: "500px", width: "100%" }}>
                    <div
                        className="glass-card"
                        style={{
                            padding: "clamp(28px, 6vw, 48px)",
                            borderRadius: "32px",
                            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)",
                        }}
                    >
                        {/* Header */}
                        <div style={{ textAlign: "center", marginBottom: "36px" }}>
                            <div
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    background: "linear-gradient(135deg, #7C3AED, #4C1D95)",
                                    borderRadius: "18px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    margin: "0 auto 16px",
                                    color: "white",
                                    boxShadow: "0 10px 20px rgba(76,29,149,0.2)",
                                }}
                            >
                                <Store size={28} />
                            </div>
                            <h1
                                style={{
                                    fontSize: "clamp(1.4rem, 5vw, 1.85rem)",
                                    fontWeight: 800,
                                    color: "#0F172A",
                                    marginBottom: "8px",
                                    letterSpacing: "-0.03em",
                                }}
                            >
                                Two quick things and you're in
                            </h1>
                            <p
                                style={{
                                    color: "#64748B",
                                    fontWeight: 500,
                                    fontSize: "0.95rem",
                                    margin: 0,
                                }}
                            >
                                These are the only details Kreddy needs to start working for you.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Field 1 — Invoice Name */}
                            <div className="input-group" style={{ marginBottom: "24px" }}>
                                <label
                                    className="input-label"
                                    style={{ fontWeight: 700, color: "#0F172A" }}
                                >
                                    What name should appear on your invoices?
                                </label>
                                <div style={{ position: "relative" }}>
                                    <Store
                                        size={20}
                                        style={{
                                            position: "absolute",
                                            left: "18px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: "var(--primary)",
                                        }}
                                    />
                                    <input
                                        type="text"
                                        className="input-field"
                                        style={{
                                            height: "58px",
                                            paddingLeft: "52px",
                                            fontSize: "1.05rem",
                                            fontWeight: 500,
                                        }}
                                        placeholder="e.g. Chioma Fabrics, Tunde Designs, Avilla Bakes, or just your name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        autoFocus={!profile?.displayName}
                                        required
                                    />
                                </div>

                                {/* Amber note — only shown when name was auto-filled */}
                                {wasAutoFilled ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "8px",
                                            marginTop: "8px",
                                            background: "#FFFBEB",
                                            border: "1px solid #FCD34D",
                                            borderRadius: "10px",
                                            padding: "10px 12px",
                                        }}
                                    >
                                        <AlertTriangle
                                            size={15}
                                            color="#D97706"
                                            style={{ flexShrink: 0, marginTop: "1px" }}
                                        />
                                        <p
                                            style={{
                                                fontSize: "0.78rem",
                                                color: "#92400E",
                                                margin: 0,
                                                fontWeight: 500,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            We used your registered name as a placeholder. This is different from your account name — it's what your customers will see on every invoice. Update it if you have a brand or hustle name.
                                        </p>
                                    </div>
                                ) : (
                                    <p
                                        style={{
                                            fontSize: "0.78rem",
                                            color: "#64748B",
                                            marginTop: "6px",
                                            fontWeight: 400,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        This is different from your account name — it's what your customers will see on every invoice and receipt. It can be your brand name, hustle name, or your own name — your call.
                                    </p>
                                )}
                            </div>

                            {/* Field 2 — WhatsApp Number */}
                            <div className="input-group" style={{ marginBottom: "36px" }}>
                                <label
                                    className="input-label"
                                    style={{ fontWeight: 700, color: "#0F172A" }}
                                >
                                    Your WhatsApp number
                                </label>
                                <div style={{ position: "relative" }}>
                                    <MessageCircle
                                        size={20}
                                        style={{
                                            position: "absolute",
                                            left: "18px",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            color: "var(--primary)",
                                        }}
                                    />
                                    <input
                                        type="tel"
                                        className="input-field"
                                        style={{
                                            height: "58px",
                                            paddingLeft: "52px",
                                            fontSize: "1.05rem",
                                            fontWeight: 500,
                                        }}
                                        placeholder="08012345678"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                        autoFocus={!!profile?.displayName}
                                        required
                                    />
                                </div>
                                <p
                                    style={{
                                        fontSize: "0.78rem",
                                        color: "#64748B",
                                        marginTop: "6px",
                                        fontWeight: 400,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Kreddy uses this to send you sales alerts, invoice confirmations, and payment updates. It won't be shared with anyone.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{
                                    width: "100%",
                                    height: "60px",
                                    fontSize: "1.1rem",
                                    fontWeight: 700,
                                    borderRadius: "16px",
                                    boxShadow: "0 10px 20px rgba(76,29,149,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                }}
                            >
                                {loading ? (
                                    <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                                ) : (
                                    "Set Up My Account →"
                                )}
                            </button>
                        </form>

                        <div style={{ textAlign: "center", marginTop: "24px" }}>
                            <p
                                style={{
                                    fontSize: "0.75rem",
                                    color: "#94A3B8",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px",
                                    margin: 0,
                                }}
                            >
                                <ShieldCheck size={14} color="#10B981" />
                                100% SECURE · YOUR DATA IS NEVER SOLD
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .auth-pattern {
                    background-image: url('/Krediblypattern-sm.jpg');
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                    background-color: var(--background);
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 640px) {
                    .glass-card { padding: 20px !important; border-radius: 20px !important; }
                    .input-field { height: 52px !important; font-size: 0.95rem !important; }
                    .btn-primary { height: 54px !important; font-size: 1rem !important; }
                    .input-label { font-size: 0.85rem !important; }
                }
            `}</style>
        </div>
    );
};

export default Activate;
