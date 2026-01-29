import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Zap, 
    MessageCircle, 
    ShieldCheck, 
    BarChart3, 
    ArrowRight, 
    CheckCircle2, 
    Copy, 
    Share2,
    Rocket,
    Smartphone,
    TrendingUp,
    Users,
    Lock,
    CheckCircle,
    ArrowDown,
    FileText,
    Smile
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { isValidNigerianPhone, formatPhoneForDB } from "../../utils/validation";

const Waitlist = () => {
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        whatsappNumber: "",
        industry: ""
    });
    const [loading, setLoading] = useState(false);
    const [joined, setJoined] = useState(false);
    const [referralData, setReferralData] = useState(null);
    const [stats, setStats] = useState(0);

    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:7050/api";
    const referredBy = searchParams.get("ref");

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/waitlist/stats`);
            if (res.data.success) {
                setStats(res.data.total);
            }
        } catch (err) {
            console.error("Stats fail", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isValidNigerianPhone(formData.whatsappNumber)) {
            return toast.error("Please enter a valid Nigerian WhatsApp number (e.g. 080...)");
        }

        const formattedData = {
            ...formData,
            whatsappNumber: formatPhoneForDB(formData.whatsappNumber)
        };

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/waitlist/join`, {
                ...formattedData,
                referredBy
            });

            if (res.data.success) {
                setJoined(true);
                setReferralData(res.data.data);
                toast.success("Welcome to the inner circle!");
                fetchStats();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        const link = `${window.location.origin}/waitlist?ref=${referralData.referralCode}`;
        navigator.clipboard.writeText(link);
        toast.success("Referral link copied!");
    };

    const shareToWhatsApp = () => {
        const link = `${window.location.origin}/waitlist?ref=${referralData.referralCode}`;
        const text = `Hey! I just joined the waitlist for Kreddy AI. It's the smart assistant that handles sales and bookkeeping inside WhatsApp. Check it out: ${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const scrollToJoin = () => {
        const element = document.getElementById('join-form');
        element?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="waitlist-page" style={{ 
            minHeight: '100vh', 
            background: '#FFFFFF', 
            color: '#1E293B', 
            fontFamily: 'var(--font-body)',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            {/* Subtle Premium Background Gradients */}
            <div style={{ position: 'absolute', top: '0', right: '0', width: '60%', height: '60%', background: 'radial-gradient(circle, rgba(76, 29, 149, 0.03) 0%, transparent 70%)', filter: 'blur(100px)', zIndex: 0 }} />
            
            {/* Nav */}
            <nav className="waitlist-nav" style={{ 
                padding: '32px 40px', 
                position: 'relative', 
                zIndex: 10, 
                maxWidth: '1200px', 
                margin: '0 auto',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
            }}>
                <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '40px', filter: 'contrast(1.15) brightness(1.02)' }} className="nav-logo" />
                <div>
                     {/* Links removed for public as per strategy */}
                </div>
            </nav>

            {/* 1. Hero Section */}
            <section className="hero-section" style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', padding: '80px 24px 120px', textAlign: 'center' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                    <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', border: '1px solid rgba(76, 29, 149, 0.1)', borderRadius: '100px', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 800, marginBottom: '40px' }}>
                        JOIN THE FUTURE OF AFRICAN COMMERCE
                    </div>

                    <h1 className="hero-title" style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)', fontWeight: 950, lineHeight: 0.95, letterSpacing: '-0.05em', marginBottom: '32px', color: '#0F172A' }}>
                        The smart assistant <br />
                        <span className="premium-gradient">for your business.</span>
                    </h1>

                    <p className="hero-subtext" style={{ fontSize: 'clamp(1.2rem, 2vw, 1.45rem)', color: '#64748B', lineHeight: 1.5, marginBottom: '56px', maxWidth: '850px', margin: '0 auto 56px', fontWeight: 500 }}>
                        No more notebooks. No more confusing math. We help you track sales and collect your money inside the WhatsApp you already use.
                    </p>

                    <div className="hero-button-group" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '80px' }}>
                        <button onClick={scrollToJoin} className="btn-primary" style={{ padding: '24px 56px', fontSize: '1.25rem', borderRadius: '24px', background: 'var(--primary)', color: 'white', boxShadow: '0 20px 40px -10px rgba(76, 29, 149, 0.3)' }}>
                            Join the Waitlist <ArrowRight size={22} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '12px 24px', borderRadius: '100px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', marginLeft: '8px' }}>
                                {[1,2,3].map(i => (
                                    <div key={i} style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', background: '#F1F5F9', marginLeft: '-10px', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary)' }}>{i}</div>
                                ))}
                            </div>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748B' }}>Join <span style={{ color: '#0F172A', fontWeight: 900 }}>{stats + 480}+</span> innovative merchants</span>
                        </div>
                    </div>

                    <div className="scroll-indicator" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.4 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.15em', color: '#0F172A' }}>EXPLORE EXPERIENCE</span>
                        <ArrowDown size={20} className="bounce" color="#0F172A" />
                    </div>
                </motion.div>
            </section>

            {/* 2. Meet Kreddy Section */}
            <section style={{ padding: '120px 24px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
                <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ background: 'rgba(76, 29, 149, 0.1)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
                            <Smartphone color="var(--primary)" size={32} />
                        </div>
                        <h2 style={{ fontSize: '3rem', fontWeight: 950, marginBottom: '24px', letterSpacing: '-0.03em', color: '#0F172A' }}>
                            <span style={{ color: 'var(--primary)' }}>Kreddy talks to you.</span>
                        </h2>
                        <p style={{ fontSize: '1.2rem', color: '#64748B', lineHeight: 1.6, marginBottom: '40px', fontWeight: 500 }}>
                            Talk to Kreddy AI on WhatsApp like you're talking to a partner. Record transactions, check inventory, and let him handle your bookkeeping while you sleep.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {[
                                { t: "No more paper notebooks", d: "Record your sales in 2 seconds. Kreddy handles the math so you don't have to." },
                                { t: "Simple for everyone", d: "If you can send a message on WhatsApp, you can use Kredibly. It's built for you." }
                            ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                    <div style={{ background: 'white', borderRadius: '50%', padding: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginTop: '4px' }}>
                                        <CheckCircle size={18} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1E293B', display: 'block', marginBottom: '4px' }}>{item.t}</span>
                                        <span style={{ color: '#64748B', fontWeight: 500 }}>{item.d}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Mockup */}
                    <div className="chat-mockup" style={{
                        background: '#FFF',
                        borderRadius: '40px',
                        padding: '12px',
                        boxShadow: '0 40px 80px -12px rgba(0,0,0,0.08)',
                        border: '1px solid #E2E8F0'
                    }}>
                        <div style={{ background: '#E5DDD5', borderRadius: '32px', overflow: 'hidden', height: '520px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: '#075E54', padding: '36px 20px 14px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '32px', height: '32px', background: 'white', borderRadius: '50%', color: '#075E54', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>K</div>
                                <span style={{ fontWeight: 800 }}>Kreddy AI</span>
                            </div>
                            <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ alignSelf: 'flex-end', background: '#DCF8C6', padding: '12px 18px', borderRadius: '16px 0 16px 16px', fontSize: '0.85rem', color: '#111', fontWeight: 500, maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                    Kreddy, sold 5 bags to Sarah for 50k. She's paid 20k deposit.
                                </div>
                                <div style={{ alignSelf: 'flex-start', background: 'white', padding: '16px', borderRadius: '0 16px 16px 16px', fontSize: '0.85rem', color: '#111', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                    <p style={{ margin: 0, fontWeight: 900, color: '#075E54', fontSize: '0.7rem', marginBottom: '6px' }}>Kreddy AI</p>
                                    <p style={{ fontWeight: 600, margin: 0 }}>Done! ✅ I've recorded the 50k sale.</p>
                                    <p style={{ fontWeight: 600, margin: '8px 0' }}>💰 Owed: 30k</p>
                                    <p style={{ fontWeight: 600, margin: 0 }}>I've sent Sarah her branded invoice link.</p>
                                </div>
                            </div>
                            <div style={{ padding: '15px', background: '#f0f0f0', display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1, height: '38px', background: 'white', borderRadius: '20px' }}></div>
                                <div style={{ width: '38px', height: '38px', background: '#075E54', borderRadius: '50%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. The Pillars Section */}
            <section style={{ padding: '120px 24px', background: 'white' }}>
                <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ background: 'rgba(76, 29, 149, 0.05)', width: '64px', height: '64px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                        <BarChart3 color="var(--primary)" size={32} />
                    </div>
                    <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 950, marginBottom: '24px', letterSpacing: '-0.04em', color: '#0F172A' }}>
                        <span style={{ color: 'var(--primary)' }}>Kredibly tracks for you.</span>
                    </h2>
                    <p style={{ fontSize: '1.2rem', color: '#64748B', lineHeight: 1.6, marginBottom: '72px', maxWidth: '750px', margin: '0 auto 72px', fontWeight: 500 }}>
                        Your premium command center. Get deep insights into your growth, reconcile accounts, and manage your entire empire in one place.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
                        {[
                            { icon: Users, t: "Staff Monitoring", d: "See exactly what your staff are selling from anywhere. Keep your money safe." },
                            { icon: FileText, t: "Beautiful Receipts", d: "Send professional receipts to customers on WhatsApp. Build trust instantly." },
                            { icon: Lock, t: "Get Paid Faster", d: "Friendly automatic reminders that help you collect your money without stress." },
                            { icon: TrendingUp, t: "Daily Reports", d: "See how much you made today with simple, clear numbers. No accounting needed." }
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '48px 40px', borderRadius: '32px', background: '#FFFFFF', border: '1px solid #F1F5F9', textAlign: 'left', transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }} className="hover-card-light">
                                <div style={{ color: 'var(--primary)', marginBottom: '24px', background: 'rgba(76, 29, 149, 0.05)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><item.icon size={28} /></div>
                                <h4 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '12px', color: '#0F172A' }}>{item.t}</h4>
                                <p style={{ color: '#64748B', lineHeight: 1.6, fontSize: '1rem', fontWeight: 500 }}>{item.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Security & Trust Section */}
            <section style={{ padding: '80px 24px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', padding: '64px 48px', borderRadius: '40px', border: '1.5px dashed #E2E8F0', background: 'white' }}>
                    <div style={{ color: '#10B981', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}><Lock size={36} /></div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '16px', color: '#0F172A' }}>Bank-Grade Security for Every Business.</h3>
                    <p style={{ color: '#64748B', lineHeight: 1.6, fontWeight: 500, fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                        Your data is encrypted and private. We use industry-standard security to ensure your financial records stay yours.
                    </p>
                    <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '40px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }} /> 256-BIT ENCRYPTION
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.15em', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }} /> CLOUD BACKED
                        </span>
                    </div>
                </div>
            </section>

            {/* 5. Join the Waitlist Form */}
            <section id="join-form" style={{ padding: '120px 24px', background: 'white' }}>
                <div className="container" style={{ maxWidth: '640px', margin: '0 auto' }}>
                    <AnimatePresence mode="wait">
                        {!joined ? (
                            <motion.div 
                                key="form"
                                className="form-card"
                                initial={{ opacity: 0, scale: 0.98 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                style={{ 
                                    padding: '64px 48px', 
                                    borderRadius: '48px',
                                    background: '#FFFFFF', 
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.1)',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{ display: 'inline-flex', padding: '8px 20px', borderRadius: '100px', background: 'rgba(244, 114, 182, 0.1)', color: '#F472B6', fontSize: '0.8rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '0.05em' }}>
                                    LIMITED FOUNDING SPOTS
                                </div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '12px', letterSpacing: '-0.03em', color: '#0F172A' }}>The "Pioneer Council"</h3>
                                <p style={{ color: '#64748B', marginBottom: '48px', fontWeight: 500, fontSize: '1.2rem', lineHeight: 1.5 }}>
                                    Join the inner circle. Founding members get an exclusive <span style={{ color: '#0F172A', fontWeight: 800 }}>Lifetime Pioneer Badge</span> + <span style={{ color: '#0F172A', fontWeight: 800 }}>Exclusive Lifetime Pricing</span> for being part of the journey.
                                </p>

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <input 
                                        type="text" 
                                        className="waitlist-input-light" 
                                        placeholder="Full Name" 
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        required 
                                    />
                                    <input 
                                        type="email" 
                                        className="waitlist-input-light" 
                                        placeholder="Business Email" 
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        required 
                                    />
                                    <input 
                                        type="tel" 
                                        className="waitlist-input-light" 
                                        placeholder="WhatsApp Number" 
                                        value={formData.whatsappNumber}
                                        onChange={e => setFormData({...formData, whatsappNumber: e.target.value})}
                                        required 
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <select 
                                            className="waitlist-input-light"
                                            value={formData.industry}
                                            onChange={e => setFormData({...formData, industry: e.target.value})}
                                            required
                                        >
                                            <option value="" disabled>Select Your Industry</option>
                                            {["Fashion & Lifestyle", "Food & Groceries", "Electronics & Gadgets", "Beauty & Wellness", "Professional Services", "Mobile Money Agent", "Commercial Enterprise"].map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={loading}
                                        className="btn-primary" 
                                        style={{ 
                                            width: '100%', 
                                            height: '72px', 
                                            borderRadius: '24px', 
                                            background: 'var(--primary)', 
                                            fontSize: '1.25rem', 
                                            marginTop: '16px',
                                            boxShadow: '0 20px 40px -10px rgba(76, 29, 149, 0.4)'
                                        }}
                                    >
                                        {loading ? 'Securing Spot...' : 'Claim My Access'}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="success"
                                className="form-card"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{ 
                                    padding: '80px 48px', 
                                    borderRadius: '48px',
                                    background: 'white', 
                                    border: '1.5px solid #22C55E',
                                    textAlign: 'center',
                                    boxShadow: '0 40px 100px -20px rgba(0,0,0,0.1)'
                                }}
                            >
                                <div style={{ width: '84px', height: '84px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                                    <CheckCircle2 size={48} color="#22C55E" />
                                </div>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '16px', letterSpacing: '-0.02em', color: '#0F172A' }}>Welcome, {referralData?.name.split(" ")[0]}!</h3>
                                <p style={{ color: '#64748B', marginBottom: '48px', fontWeight: 600, fontSize: '1.2rem', lineHeight: 1.6 }}>
                                    You are officially a **Kredibly Founder.** <br />
                                    <span style={{ color: '#0F172A' }}>Want to jump the queue?</span> Refer 3 fellow business owners to move to the top batch instantly.
                                </p>

                                <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', marginBottom: '40px' }}>
                                    <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#94A3B8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>YOUR ACCESS LINK</p>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <input 
                                            readOnly 
                                            value={`${window.location.origin}/?ref=${referralData.referralCode}`} 
                                            style={{ flex: 1, background: 'none', border: 'none', color: '#0F172A', fontSize: '1rem', fontWeight: 800, outline: 'none' }}
                                        />
                                        <button onClick={copyLink} style={{ background: 'var(--primary)', border: 'none', width: '48px', height: '48px', borderRadius: '16px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(76, 29, 149, 0.2)' }}><Copy size={20} /></button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    <button onClick={shareToWhatsApp} className="btn-secondary" style={{ flex: 1, background: '#25D366', color: 'white', border: 'none', height: '68px', borderRadius: '24px', fontSize: '1.1rem', minWidth: '240px' }}>
                                        <MessageCircle size={22} /> Share to WhatsApp Status
                                    </button>
                                    <button onClick={copyLink} className="btn-secondary" style={{ flex: 1, height: '68px', borderRadius: '24px', fontSize: '1.1rem', minWidth: '180px' }}>
                                        <Share2 size={22} /> Other Channels
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </section>

            {/* 6. Footer */}
            <footer style={{ padding: '80px 40px', textAlign: 'center', color: '#1E293B', borderTop: '1px solid #F1F5F9', background: 'white' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '32px', marginBottom: '32px' }} />
                    <p style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>© 2026 Kredibly Technologies Inc. All Rights Reserved.</p>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748B' }}>Building the Financial OS for African Merchants.</p>
                </div>
            </footer>

            <style>{`
                .waitlist-input-light {
                    width: 100%;
                    height: 64px;
                    background: #F8FAFC;
                    border: 1.5px solid #E2E8F0;
                    border-radius: 18px;
                    padding: 0 24px;
                    color: #0F172A;
                    font-size: 1.1rem;
                    font-weight: 500;
                    outline: none;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .waitlist-input-light:focus {
                    border-color: var(--primary);
                    background: #FFFFFF;
                    box-shadow: 0 0 0 4px rgba(76, 29, 149, 0.08);
                }
                .premium-gradient {
                    background: linear-gradient(135deg, var(--primary) 0%, #F472B6 100%);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .hover-card-light:hover {
                    background: #FFFFFF !important;
                    transform: translateY(-10px);
                    border-color: #E2E8F0 !important;
                    box-shadow: 0 20px 40px -12px rgba(0,0,0,0.08) !important;
                }
                .bounce {
                    animation: bounce 2s infinite;
                }
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
                    40% {transform: translateY(-8px);}
                    60% {transform: translateY(-4px);}
                }
                @media (max-width: 640px) {
                    .waitlist-page { padding-top: 5px; }
                    .waitlist-input-light { height: 60px !important; }
                    .btn-primary { height: 64px !important; }
                    #join-form { padding: 60px 16px !important; }
                    .form-card { padding: 40px 24px !important; border-radius: 32px !important; }
                    .hero-section { padding-top: 40px !important; padding-bottom: 60px !important; }
                    .hero-badge { margin-bottom: 24px !important; padding: 8px 16px !important; gap: 4px !important; }
                    .hero-title { margin-bottom: 24px !important; line-height: 1.05 !important; }
                    .hero-subtext { margin-bottom: 32px !important; font-size: 1.1rem !important; }
                    .hero-button-group { margin-bottom: 40px !important; }
                    .waitlist-nav { padding: 24px 20px !important; }
                    .nav-logo { height: 32px !important; }
                }
            `}</style>
        </div>
    );
};

const Sparkles = ({ size }) => (
    <Rocket size={size} className="Sparkles" />
);

export default Waitlist;
