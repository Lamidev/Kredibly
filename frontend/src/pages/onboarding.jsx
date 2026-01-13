import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Store, Briefcase, ShoppingBag, ArrowRight, User, Plus } from "lucide-react";
import axios from "axios";

const Onboarding = () => {
    const [displayName, setDisplayName] = useState("");
    const [entityType, setEntityType] = useState("individual");
    const [sellMode, setSellMode] = useState("both");
    const [logoUrl, setLogoUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const { updateProfile } = useAuth();
    const navigate = useNavigate();

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("logo", file);

        setUploading(true);
        try {
            const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
            const res = await axios.post(`${API_URL}/common/upload-logo`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                withCredentials: true,
            });
            if (res.data.success) {
                setLogoUrl(res.data.url);
                toast.success("Logo uploaded!");
            }
        } catch (err) {
            toast.error("Upload failed. Try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!displayName) return toast.error("Please enter a business or display name");

        setLoading(true);
        try {
            await updateProfile({ displayName, entityType, sellMode, logoUrl });
            toast.success("Profile setup complete!");
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to set up profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-pattern" style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div className="pattern-dots"></div>

            {/* Logo - Top Left on Desktop */}
            <div style={{ position: 'absolute', top: '40px', left: '40px', zIndex: 10 }} className="hidden md:block">
                <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '40px' }} />
            </div>

            <div className="container animate-fade-in" style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
                <div className="glass-card" style={{ padding: '40px 30px' }}>
                    <div style={{ textAlign: 'left', marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Setup your profile</h1>
                        <p style={{ color: 'var(--text-muted)' }}>This info will appear on your invoices.</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Logo Upload Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                            <div
                                className="glass-card"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    background: 'var(--surface)',
                                    border: logoUrl ? '2px solid var(--primary)' : '2px dashed var(--border)'
                                }}
                                onClick={() => document.getElementById('logoInput').click()}
                            >
                                {logoUrl ? (
                                    <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                        <Plus size={24} style={{ marginBottom: '4px' }} />
                                        <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>LOGO</div>
                                    </div>
                                )}
                                {uploading && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div className="spinner"></div>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                id="logoInput"
                                hidden
                                accept="image/*"
                                onChange={handleLogoUpload}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                                {logoUrl ? "Tap to change logo" : "Upload your business logo"}
                            </p>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Name on Invoices</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="e.g. Kola's Custom Furniture"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">How do you operate?</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div
                                    className={`glass-card ${entityType === 'individual' ? 'selected' : ''}`}
                                    style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: entityType === 'individual' ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                                    onClick={() => setEntityType('individual')}
                                >
                                    <User size={24} style={{ marginBottom: '8px', color: entityType === 'individual' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Individual</div>
                                </div>
                                <div
                                    className={`glass-card ${entityType === 'business' ? 'selected' : ''}`}
                                    style={{ padding: '16px', textAlign: 'center', cursor: 'pointer', border: entityType === 'business' ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                                    onClick={() => setEntityType('business')}
                                >
                                    <Store size={24} style={{ marginBottom: '8px', color: entityType === 'business' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Business</div>
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">What do you sell?</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <div
                                    className="glass-card"
                                    style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', border: sellMode === 'product' ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                                    onClick={() => setSellMode('product')}
                                >
                                    <ShoppingBag size={20} style={{ marginBottom: '4px', color: sellMode === 'product' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Products</div>
                                </div>
                                <div
                                    className="glass-card"
                                    style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', border: sellMode === 'service' ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                                    onClick={() => setSellMode('service')}
                                >
                                    <Briefcase size={20} style={{ marginBottom: '4px', color: sellMode === 'service' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Services</div>
                                </div>
                                <div
                                    className="glass-card"
                                    style={{ padding: '12px', textAlign: 'center', cursor: 'pointer', border: sellMode === 'both' ? '2px solid var(--primary)' : '1px solid var(--border)' }}
                                    onClick={() => setSellMode('both')}
                                >
                                    <ArrowRight size={20} style={{ marginBottom: '4px', rotate: '-45deg', color: sellMode === 'both' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Both</div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            disabled={loading}
                        >
                            {loading ? "Saving..." : <>Complete Setup <ArrowRight size={18} /></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
