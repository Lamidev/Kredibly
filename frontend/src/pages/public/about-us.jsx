import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import { Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const AboutUs = () => {
    return (
        <div className="auth-pattern" style={{ minHeight: '100vh', background: '#F8FAFC' }}>
            <PublicNavbar />

            <div style={{ paddingTop: '160px', maxWidth: '1000px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>
                <header style={{ textAlign: 'center', marginBottom: '80px' }}>
                    <h1 className="hero-title" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '24px' }}>
                        We are building the <span className="premium-gradient">OS for African Commerce</span>.
                    </h1>
                    <p style={{ fontSize: '1.25rem', color: '#64748B', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
                        Kredibly bridges the gap between informal chat-based sales and formal financial credibility.
                    </p>
                </header>

                <div className="glass-card" style={{ padding: '60px', borderRadius: '32px', background: 'white', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px' }}>Our Mission</h2>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: '#475569', marginBottom: '32px' }}>
                        For millions of African vendors, business happens on WhatsApp. Sales are negotiated, deals are struck, and money changes hands—all in chat. But this data is lost. It doesn't build a credit score. It doesn't help you get a loan.
                        <br /><br />
                        Kredibly changes that. We built <b>Kreddy</b>, an AI assistant that lives where you sell. It turns your casual chats into verifiable financial records, professional invoices, and a credit-worthy reputation.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px' }}>
                        <Users size={32} color="var(--primary)" style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>For the Hustlers</h3>
                        <p style={{ color: '#64748B', lineHeight: 1.6 }}>We design for the solopreneurs, the IG vendors, and the market traders who run the economy.</p>
                    </div>
                    <div className="glass-card" style={{ padding: '40px', background: 'white', borderRadius: '24px' }}>
                        <ShieldCheck size={32} color="#10B981" style={{ marginBottom: '20px' }} />
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>Trust First</h3>
                        <p style={{ color: '#64748B', lineHeight: 1.6 }}>Our goal isn't just tools; it's trust. We verify your business so you can sell with confidence.</p>
                    </div>
                </div>
                <section style={{ marginTop: '120px', paddingBottom: '80px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <div style={{ display: 'inline-flex', padding: '10px 24px', background: 'rgba(76, 29, 149, 0.05)', borderRadius: '100px', marginBottom: '24px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>THE MISSION MAP</div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '16px' }}>Our Journey & Vision</h2>
                        <p style={{ color: '#64748B', fontWeight: 500, fontSize: '1.2rem' }}>Building the future of African commerce, one milestone at a time.</p>
                    </div>

                    <div style={{ position: 'relative', paddingLeft: '40px', maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ position: 'absolute', left: '7px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, #E2E8F0 0%, var(--primary) 30%, var(--primary) 70%, #E2E8F0 100%)' }} />

                        {[
                            { date: "JULY '25", title: "The Genesis", desc: "Concept & Research Phase. Identifying the 'Trust Gap' in African commerce.", status: "completed" },
                            { date: "SEPT '25", title: "Strategic Architecture", desc: "Core blueprinting of the Kredibly ledger and AI interface flow.", status: "completed" },
                            { date: "DEC '25", title: "Kreddy AI Core", desc: "Intelligence engine development. Teaching Kreddy to understand merchant slang and complex debts.", status: "completed" },
                            { date: "JAN '26 - PRESENT", title: "Founding Member Waitlist", desc: "Onboarding our first 1,000 pioneers. Early access rewards and lifetime status for active participants.", status: "active" },
                            { date: "FEBRUARY", title: "Premium Ledger UX", desc: "Rollout of smart telemetry, professional document generators, and cross-device syncing.", status: "building" },
                            { date: "Q2 2026", title: "Global Marketplace Launch", desc: "Opening the ecosystem for public merchant registration and global transactions.", status: "future" },
                            { date: "Q3 2026", title: "Kredibly Mobile (Native)", desc: "The full ledger in your pocket. Offline-first, biometric security, and instant push intelligence.", status: "future" }
                        ].map((m, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                style={{ marginBottom: '64px', position: 'relative' }}
                            >
                                <div style={{ 
                                    position: 'absolute', 
                                    left: '-41px', 
                                    top: '4px', 
                                    width: '16px', 
                                    height: '16px', 
                                    borderRadius: '50%', 
                                    background: m.status === 'active' ? 'var(--primary)' : m.status === 'completed' ? '#10B981' : 'white',
                                    border: m.status === 'future' ? '2px solid #E2E8F0' : 'none',
                                    zIndex: 2
                                }}>
                                    {m.status === 'active' && <div className="pulse-dot-about" />}
                                </div>

                                <div style={{ opacity: m.status === 'completed' ? 0.7 : 1 }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 900, color: m.status === 'active' ? 'var(--primary)' : '#94A3B8', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>{m.date}</span>
                                    <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1E293B', marginBottom: '10px' }}>{m.title}</h4>
                                    <p style={{ color: '#64748B', fontWeight: 500, lineHeight: 1.6 }}>{m.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </div>
            <PublicFooter />
            <style>{`
                .pulse-dot-about {
                    position: absolute;
                    inset: -4px;
                    border-radius: 50%;
                    background: var(--primary);
                    opacity: 0.3;
                    animation: pulse-ring-about 2s infinite;
                }
                @keyframes pulse-ring-about {
                    0% { transform: scale(1); opacity: 0.3; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default AboutUs;
