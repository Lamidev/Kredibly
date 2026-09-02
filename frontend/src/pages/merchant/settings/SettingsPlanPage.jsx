import React from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';

const PLANS = [
    {
        id: 'hustler',
        label: 'HUSTLER',
        price: '₦3,000/mo',
        desc: 'Up to 50 sales/mo, 20 auto-reminders, and basic receipts.',
        color: '#64748B',
    },
    {
        id: 'oga',
        label: 'OGA PLAN',
        price: '₦6,000/mo',
        desc: 'Kreddy AI Voice, Proactive Reminders & 1 Staff member.',
        color: 'var(--primary)',
    },
    {
        id: 'chairman',
        label: 'CHAIRMAN',
        price: '₦9,000/mo',
        desc: 'Up to 3 Staff, AI Insights & Priority White-labeling.',
        color: '#8B5CF6',
    },
];

const planRank = { hustler: 1, oga: 2, chairman: 3 };

const SettingsPlanPage = () => {
    const { profile, setSelectedPlan, setShowCheckout } = useSettings();

    const currentRank = planRank[profile?.plan] || 0;
    const isFreeLaunchPromo = profile?.plan === 'chairman' && profile?.planStatus === 'trialing';

    const getPlanLabel = (targetPlan) => {
        if (profile?.plan === targetPlan) {
            return isFreeLaunchPromo ? 'Active (Launch Gift)' : 'Active Plan';
        }
        return planRank[targetPlan] > currentRank
            ? `Upgrade to ${targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}`
            : `Switch to ${targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}`;
    };

    return (
        <div style={{ display: 'grid', gap: '32px' }}>
            <div style={{ marginBottom: '4px' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 6vw, 2rem)', fontWeight: 950, color: '#0F172A', marginBottom: '6px', letterSpacing: '-0.03em' }}>
                    Plan
                </h1>
                <p style={{ color: '#64748B', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                    Manage your subscription and choose the right power level.
                </p>
            </div>

            <section className="glass-card" style={{ padding: 'clamp(20px, 5%, 32px)', background: 'white', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: '#FFF1F2', color: '#E11D48', padding: '10px', borderRadius: '12px' }}>
                        <Zap size={20} />
                    </div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Subscription & Plan</h2>
                </div>

                {/* Current plan card */}
                <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '20px', border: '1px solid #E2E8F0', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: '#64748B', marginBottom: '4px' }}>Current Plan</p>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 950, margin: 0, color: '#1E293B' }}>
                                {profile?.plan?.toUpperCase() || 'CHAIRMAN'}
                            </h3>
                            {isFreeLaunchPromo && (
                                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#6D28D9', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Sparkles size={14} /> 100% Free Launch Access through October 1, 2026
                                </p>
                            )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 900, color: '#64748B', marginBottom: '4px' }}>Status</p>
                            <span style={{ fontSize: '0.8rem', fontWeight: 800, background: '#DCFCE7', color: '#166534', padding: '6px 14px', borderRadius: '100px', display: 'inline-block' }}>
                                {isFreeLaunchPromo ? 'ACTIVE • LAUNCH FREE' : (profile?.planStatus?.toUpperCase() || 'ACTIVE')}
                            </span>
                        </div>
                    </div>
                </div>

                <p className="mobile-hide" style={{ fontSize: '0.75rem', fontWeight: 900, color: '#94A3B8', textAlign: 'center', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Choose Your Power Level
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    {PLANS.map(plan => {
                        const isActive = profile?.plan === plan.id;
                        const color = plan.color;
                        return (
                            <button
                                key={plan.id}
                                onClick={() => { setSelectedPlan(plan.id); setShowCheckout(true); }}
                                className="glass-card clickable-card"
                                style={{
                                    padding: '24px',
                                    border: isActive ? `2px solid ${color}` : '1px solid #E2E8F0',
                                    background: isActive ? 'rgba(76, 29, 149, 0.02)' : 'white',
                                    textAlign: 'left', position: 'relative',
                                    boxShadow: (!isActive && plan.id === 'oga') ? '0 10px 15px -3px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ fontWeight: 900, color, fontSize: '0.85rem' }}>{plan.label}</span>
                                    <span style={{ fontWeight: 900, color, fontSize: '1.1rem' }}>{plan.price}</span>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 20px 0', fontWeight: 600, lineHeight: 1.4 }}>
                                    {plan.desc}
                                </p>
                                <div style={{
                                    width: '100%', padding: '12px', borderRadius: '14px',
                                    background: isActive ? color : 'white',
                                    border: `1.5px solid ${isActive ? color : '#E2E8F0'}`,
                                    color: isActive ? 'white' : color,
                                    fontWeight: 900, fontSize: '0.85rem', textAlign: 'center'
                                }}>
                                    {getPlanLabel(plan.id)}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default SettingsPlanPage;

