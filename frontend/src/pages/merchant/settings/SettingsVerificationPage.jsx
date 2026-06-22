import React from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

const SettingsVerificationPage = () => {
    const { kycType, setKycType, idNumber, setIdNumber, dob, setDob, isVerifying, handleVerifyKYC, profile } = useSettings();

    return (
        <div style={{ display: 'grid', gap: '32px' }}>
            <div style={{ marginBottom: '4px' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 950, color: '#0F172A', marginBottom: '6px', letterSpacing: '-0.03em' }}>
                    Verification
                </h1>
                <p style={{ color: '#64748B', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    Protect your payouts and unlock high limits.
                </p>
            </div>

            <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: profile?.kyc?.status === 'verified' ? '#F0FDF4' : '#F5F3FF', color: profile?.kyc?.status === 'verified' ? '#22C55E' : 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Trust & Verification</h2>
                            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Protect your payouts and unlock high limits.</p>
                        </div>
                    </div>
                    <div style={{
                        background: profile?.kyc?.status === 'verified' ? '#F0FDF4' : '#F5F3FF',
                        color: profile?.kyc?.status === 'verified' ? '#166534' : 'var(--primary)',
                        padding: '6px 14px', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 900,
                        border: '1px solid', borderColor: profile?.kyc?.status === 'verified' ? '#DCFCE7' : 'rgba(76, 29, 149, 0.1)'
                    }}>
                        {profile?.kyc?.status === 'verified' ? `TIER ${profile.kyc.tier || 2} VERIFIED` : 'PIONEER TIER (ACTIVE)'}
                    </div>
                </div>

                {profile?.kyc?.status === 'verified' ? (
                    <div style={{ padding: '32px', background: '#F0FDF4', borderRadius: '20px', border: '1px solid #DCFCE7', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Shield size={32} color="#22C55E" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#166534', marginBottom: '8px' }}>Identity Verified</h3>
                        <p style={{ color: '#4ADE80', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                            Your account is fully verified. Payout limits are unlocked.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '32px' }}>
                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0' }}>
                            <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 700, color: '#475569', lineHeight: 1.5 }}>
                                To protect our platform and your money, we use <strong>BVN Matching</strong>. We confirm that the ID you provide matches your Payout Bank Account details.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>
                                <Shield size={14} /> 100% Secure & CBN Compliant
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '24px' }}>
                            <div className="input-group">
                                <label className="input-label">BVN Number</label>
                                <input
                                    className="input-field"
                                    placeholder="Enter 11-digit BVN"
                                    value={idNumber}
                                    maxLength={11}
                                    onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ''))}
                                    style={{ background: '#F8FAFC', width: '100%', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Date of Birth (Optional)</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={dob}
                                    onChange={(e) => setDob(e.target.value)}
                                    style={{ background: '#F8FAFC', width: '100%', boxSizing: 'border-box', WebkitAppearance: 'none', minHeight: '54px' }}
                                />
                                <p style={{ fontSize: '10px', color: '#64748B', margin: '4px 0 0 0' }}>Optional, but improves verification accuracy.</p>
                            </div>
                        </div>

                        <button
                            className="btn-primary"
                            onClick={handleVerifyKYC}
                            disabled={isVerifying || idNumber.length < 11}
                            style={{
                                height: '60px',
                                background: idNumber.length === 11 ? 'var(--primary)' : '#94A3B8',
                                boxShadow: idNumber.length === 11 ? '0 10px 15px -3px rgba(76, 29, 149, 0.25)' : 'none'
                            }}
                        >
                            {isVerifying ? <Loader2 className="spin-animation" size={24} /> : 'Complete Verification'}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94A3B8', fontWeight: 700, paddingBottom: '8px' }}>
                            Identity verification is currently <strong>FREE</strong>. By verifying, you agree to allow Kredibly confirm your details with NIBSS.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default SettingsVerificationPage;
