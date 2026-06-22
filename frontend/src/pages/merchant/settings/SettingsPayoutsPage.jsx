import React from 'react';
import { CreditCard, Building2, Shield, CheckCircle, Clock, Search, Loader2, Save } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';

const SettingsPayoutsPage = () => {
    const navigate = useNavigate();
    const {
        form, setForm,
        banks, fetchingBanks,
        resolving,
        isEditingPayout, setIsEditingPayout,
        isPayoutSaving, setShowPasswordModal,
        lockCountdown,
        profile,
        saving, handleSave,
    } = useSettings();

    return (
        <div style={{ display: 'grid', gap: '32px' }}>
            <div style={{ marginBottom: '4px' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 950, color: '#0F172A', marginBottom: '6px', letterSpacing: '-0.03em' }}>
                    Payouts
                </h1>
                <p style={{ color: '#64748B', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    Set where you receive money from debtors.
                </p>
            </div>

            <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(76, 29, 149, 0.05) 0%, transparent 70%)', zIndex: 0 }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: 'rgba(76, 29, 149, 0.08)', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Payout Destination</h2>
                            <p className="mobile-hide" style={{ fontSize: '0.8rem', color: '#64748B', margin: 0 }}>Set where you receive money from debtors.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        {profile?.bankDetails?.accountNumber && (
                            <div style={{ background: 'rgba(76, 29, 149, 0.08)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle size={12} /> AUTOMATED PAYOUTS ACTIVE
                            </div>
                        )}
                        {lockCountdown && (
                            <div style={{ background: '#FFF1F2', color: '#E11D48', padding: '4px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={10} /> SECURITY LOCK: {lockCountdown}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    {!isEditingPayout ? (
                        <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Active Destination Account</p>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1E293B', margin: 0 }}>{form.accountName || profile?.bankDetails?.accountName}</h3>
                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: '#64748B', margin: '4px 0 0 0' }}>
                                        {form.bankName || profile?.bankDetails?.bankName} • {form.accountNumber || profile?.bankDetails?.accountNumber}
                                    </p>
                                </div>
                                <div style={{ background: '#F0F9FF', color: '#0EA5E9', padding: '12px', borderRadius: '14px' }}>
                                    <Building2 size={24} />
                                </div>
                            </div>

                            {lockCountdown && (
                                <div style={{ marginTop: '8px', padding: 'clamp(12px, 4vw, 20px)', background: '#FFF7ED', borderRadius: '16px', border: '1px solid #FB923C', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ background: '#FB923C', color: 'white', padding: '8px', borderRadius: '10px' }}>
                                            <Shield size={16} />
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: '#9A3412', fontWeight: 700, margin: 0, maxWidth: '280px' }}>
                                            Payouts are locked for safety. Re-verify BVN to unlock instantly.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/settings/verification')}
                                        style={{ background: '#FB923C', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer' }}
                                        className="hover-scale"
                                    >
                                        Unlock Now
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setIsEditingPayout(true)}
                                style={{ marginTop: '8px', background: 'white', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer' }}
                                className="hover-scale"
                            >
                                Change Payout Details
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '24px' }}>
                            <div className="input-group">
                                <label className="input-label">Select Bank</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        className="input-field"
                                        value={form.bankCode}
                                        onChange={(e) => {
                                            const selectedBank = banks.find(b => b.code === e.target.value);
                                            setForm({ ...form, bankCode: e.target.value, bankName: selectedBank?.name || '' });
                                        }}
                                        style={{ background: '#F8FAFC', appearance: 'none', paddingRight: '40px' }}
                                    >
                                        <option value="">{fetchingBanks ? 'Loading banks...' : 'Choose a bank...'}</option>
                                        {banks.map(bank => (
                                            <option key={bank.code} value={bank.code}>{bank.name}</option>
                                        ))}
                                    </select>
                                    <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748B' }}>
                                        <Building2 size={18} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid-2-col-responsive" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.5fr)' }}>
                                <div className="input-group">
                                    <label className="input-label">Account Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            className="input-field"
                                            value={form.accountNumber}
                                            maxLength={10}
                                            onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })}
                                            placeholder="10 digit account number"
                                            style={{ background: '#F8FAFC', paddingRight: '40px' }}
                                        />
                                        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}>
                                            {resolving ? <Loader2 size={18} className="spin-animation" /> : <Search size={18} />}
                                        </div>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Account Name</label>
                                    <div style={{
                                        padding: '14px', background: form.accountName ? 'rgba(76, 29, 149, 0.04)' : '#F1F5F9',
                                        borderRadius: '12px', border: '1.5px solid',
                                        borderColor: form.accountName ? 'rgba(76, 29, 149, 0.2)' : '#E5E7EB',
                                        height: '54px', display: 'flex', alignItems: 'center',
                                        color: form.accountName ? 'var(--primary)' : '#94A3B8',
                                        fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.3s ease'
                                    }}>
                                        {form.accountName || 'Type account number...'}
                                        {form.accountName && <CheckCircle size={16} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                {profile?.bankDetails?.accountNumber && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingPayout(false);
                                            setForm(prev => ({
                                                ...prev,
                                                bankName: profile?.bankDetails?.bankName || '',
                                                accountNumber: profile?.bankDetails?.accountNumber || '',
                                                accountName: profile?.bankDetails?.accountName || '',
                                            }));
                                        }}
                                        style={{ flex: 1, padding: '16px', borderRadius: '14px', border: '1.5px solid #E2E8F0', background: 'white', fontWeight: 700, color: '#64748B', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(true)}
                                    disabled={isPayoutSaving || !form.bankCode || form.accountNumber.length !== 10 || !form.accountName}
                                    style={{
                                        flex: 2, padding: '16px', borderRadius: '14px', background: 'var(--primary)',
                                        color: 'white', fontWeight: 800, fontSize: '0.95rem', border: 'none',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        boxShadow: '0 10px 15px -3px rgba(76, 29, 149, 0.25)', transition: 'all 0.3s ease'
                                    }}
                                    className="hover-scale"
                                >
                                    {isPayoutSaving
                                        ? <><Loader2 size={20} className="spin-animation" /> Verifying...</>
                                        : profile?.bankDetails?.accountNumber ? 'Confirm New Details' : 'Setup Secure Payouts'
                                    }
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Fee Toggle */}
                <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #F1F5F9', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px', flexWrap: 'nowrap' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <p style={{ fontWeight: 800, color: '#1E293B', margin: 0 }}>Transaction Fee Recovery</p>
                                <span style={{ fontSize: '10px', fontWeight: 900, background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase' }}>Smart</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0, fontWeight: 600, lineHeight: 1.4 }}>
                                {form.prefersGatewayFeeAbsorption
                                    ? 'You are absorbing all gateway fees. Customers pay exactly the invoice amount.'
                                    : 'Customers cover the gateway fee. You receive exactly the invoice amount.'}
                            </p>
                        </div>
                        <div style={{ position: 'relative', display: 'inline-block', width: '56px', height: '30px', flexShrink: 0 }}>
                            <input
                                type="checkbox" id="fee-toggle"
                                checked={!form.prefersGatewayFeeAbsorption}
                                onChange={(e) => setForm({ ...form, prefersGatewayFeeAbsorption: !e.target.checked })}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <label htmlFor="fee-toggle" style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: !form.prefersGatewayFeeAbsorption ? 'var(--primary)' : '#CBD5E1', borderRadius: '34px', transition: '.4s'
                            }}>
                                <span style={{
                                    position: 'absolute', height: '22px', width: '22px', left: '4px', bottom: '4px',
                                    backgroundColor: 'white', borderRadius: '50%', transition: '.4s',
                                    transform: !form.prefersGatewayFeeAbsorption ? 'translateX(26px)' : 'translateX(0)',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }} />
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '40px' }}>
                <button
                    className="btn-primary mobile-full-width"
                    style={{ padding: '16px 40px', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '16px' }}
                    disabled={saving}
                    onClick={handleSave}
                >
                    {saving ? 'Saving...' : <><Save size={20} /> Save Changes</>}
                </button>
            </div>
        </div>
    );
};

export default SettingsPayoutsPage;
