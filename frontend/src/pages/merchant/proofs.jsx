import React, { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSales } from '../../context/SaleContext';
import { ShieldCheck, Download, Share2, Award, CheckCircle2, QrCode, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const ProofsPage = () => {
    const { profile } = useAuth();
    const { stats, sales } = useSales();
    
    // Calculate some "Badge Worthy" stats
    const totalVolume = stats?.revenue || 0;
    const trustScore = stats?.trustScore || 85;
    const joinDate = new Date(profile?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const verifiedTransactions = sales.filter(s => s.status === 'paid').length;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                    <ShieldCheck size={16} /> Verifiable Credibility
                </div>
                <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                    Merchant Proofs.
                </h1>
                <p style={{ color: 'var(--text-muted)', fontWeight: 600, marginTop: '8px', fontSize: '0.95rem', maxWidth: '600px' }}>
                    Digital assets you can share to prove your business legitimacy to customers, banks, and suppliers.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '32px' }}>
                
                {/* 1. The "Instagram Flex" Trust Badge */}
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px' }}>Social Trust Badge</h3>
                    <div className="dashboard-glass" style={{ padding: '32px', background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', borderRadius: '32px', color: 'white', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {/* Decorative Background */}
                        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.5, borderRadius: '50%' }}></div>
                        
                        <div style={{ position: 'relative', zIndex: 2 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>
                                        {profile?.displayName?.charAt(0) || 'K'}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{profile?.displayName}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8, fontWeight: 600 }}>Verified by Kredibly</p>
                                    </div>
                                </div>
                                <ShieldCheck size={32} color="#4ade80" />
                            </div>

                            <div style={{ marginBottom: '32px' }}>
                                <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.7, marginBottom: '4px', letterSpacing: '0.1em' }}>Trust Score</p>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                    <h2 style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, lineHeight: 1 }}>{trustScore}%</h2>
                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#4ade80' }}>Excellent</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 600, marginBottom: '2px' }}>Verified Sales</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{verifiedTransactions}+</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', opacity: 0.7, fontWeight: 600, marginBottom: '2px' }}>Member Since</p>
                                    <p style={{ fontSize: '1.1rem', fontWeight: 800 }}>{joinDate}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button className="btn-secondary" style={{ flex: 1, padding: '12px', fontSize: '0.9rem', borderRadius: '14px', background: 'white' }}>
                            <Share2 size={16} /> Share Status
                        </button>
                        <button className="btn-secondary" style={{ flex: 1, padding: '12px', fontSize: '0.9rem', borderRadius: '14px', background: 'white' }}>
                            <Download size={16} /> Save Image
                        </button>
                    </div>
                </div>

                {/* 2. Official Letter of Good Standing */}
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px' }}>Letter of Good Standing</h3>
                    <div className="dashboard-glass" style={{ padding: '32px', background: 'white', borderRadius: '32px', border: '1px solid var(--border)', height: 'fit-content' }}>
                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', background: '#F8FAFC', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Award size={32} color="var(--primary)" />
                            </div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text)', marginBottom: '8px' }}>Official Reference</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                Start applications with a verified ledger report. Useful for loans, visa applications, and supplier contracts.
                            </p>
                        </div>

                        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', border: '1px dashed #CBD5E1', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <CheckCircle2 size={16} color="var(--success)" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Identity Verified</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <CheckCircle2 size={16} color="var(--success)" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>{verifiedTransactions} Verified Transactions</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <CheckCircle2 size={16} color="var(--success)" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>No Fraud Reports</span>
                            </div>
                        </div>

                        <button className="btn-primary" style={{ width: '100%', borderRadius: '16px', fontWeight: 800 }}>
                            <Download size={18} /> Download PDF
                        </button>
                    </div>
                </div>

                {/* 3. Merchant Digital Passport */}
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px' }}>Digital Passport</h3>
                    <div className="dashboard-glass" style={{ padding: '0', background: 'white', borderRadius: '32px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <div style={{ background: 'var(--primary)', padding: '24px', color: 'white', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Kredibly Merchant ID</p>
                        </div>
                        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                             <div style={{ background: 'white', padding: '16px', borderRadius: '24px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                                <QrCode size={120} color="var(--text)" />
                             </div>
                             <p style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text)', marginBottom: '4px' }}>{profile?.displayName}</p>
                             <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '24px' }}>{profile?.email}</p>
                             
                             <div style={{ background: '#F0FDF4', color: '#166534', padding: '8px 16px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={14} /> ACTIVE & VERIFIED
                             </div>
                        </div>
                        <div style={{ background: '#F8FAFC', padding: '16px', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', fontFamily: 'monospace' }}>ID: {profile?._id}</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProofsPage;
