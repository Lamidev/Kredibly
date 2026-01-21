import PublicNavbar from "../../components/public/PublicNavbar";
import PublicFooter from "../../components/public/PublicFooter";
import { Users, ShieldCheck } from "lucide-react";

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
            </div>
            <PublicFooter />
        </div>
    );
};

export default AboutUs;
