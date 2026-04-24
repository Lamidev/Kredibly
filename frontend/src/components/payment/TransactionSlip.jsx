import React from 'react';
import { CheckCircle2, ShieldCheck, Globe, Building2 } from 'lucide-react';

const TransactionSlip = ({ 
    amount, 
    businessName, 
    customerName, 
    reference, 
    date, 
    balance, 
    isFullyPaid,
    logoUrl 
}) => {
    const slipId = "transaction-slip-target";

    return (
        <div 
            id={slipId}
            style={{ 
                width: '400px', 
                background: 'white', 
                padding: '40px', 
                fontFamily: "'Inter', sans-serif",
                color: '#0F172A',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Background Aesthetic Elements */}
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
            
            {/* Header / Status */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                {logoUrl ? (
                    <div style={{ marginBottom: '16px' }}>
                        <img src={logoUrl} alt="Merchant Logo" style={{ height: '48px', maxWidth: '180px', objectFit: 'contain' }} />
                    </div>
                ) : (
                    <div style={{ 
                        width: '64px', 
                        height: '64px', 
                        background: '#ECFDF5', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 16px',
                        border: '1px solid #D1FAE5'
                    }}>
                        <CheckCircle2 size={32} color="#10B981" />
                    </div>
                )}
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Transaction Successful</h2>
                <p style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '4px' }}>Verified Digital Receipt</p>
            </div>

            {/* Amount Section */}
            <div style={{ textAlign: 'center', marginBottom: '40px', background: '#F8FAFC', padding: '32px 20px', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
                <p style={{ fontSize: '11px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Amount Paid</p>
                <h1 style={{ fontSize: '42px', fontWeight: 950, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                    <span style={{ fontSize: '24px', fontWeight: 800, marginRight: '4px' }}>₦</span>{amount?.toLocaleString()}
                </h1>
            </div>

            {/* Details Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Beneficiary</span>
                    <div style={{ textAlign: 'right', maxWidth: '60%' }}>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{businessName}</p>
                        <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0' }}>Verified Merchant</p>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Payer</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{customerName || 'Customer'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Reference</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#4C1D95', fontFamily: 'monospace' }}>{reference}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Date & Time</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{date ? new Date(date).toLocaleString() : new Date().toLocaleString()}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px dashed #E2E8F0', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Status</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
                        <div style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }} />
                        <span style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase' }}>Completed</span>
                    </div>
                </div>
            </div>

            {/* Balance Footer */}
            <div style={{ 
                background: isFullyPaid ? 'linear-gradient(135deg, #065F46, #047857)' : '#F8FAFC', 
                padding: '20px', 
                borderRadius: '20px', 
                textAlign: 'center',
                border: isFullyPaid ? 'none' : '1px solid #E2E8F0',
                marginBottom: '40px'
            }}>
                {isFullyPaid ? (
                    <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>INVOICE FULLY SETTLED</p>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>This debt has been cleared from the ledger</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>REMAINING BALANCE</span>
                        <span style={{ fontSize: '16px', fontWeight: 950, color: '#0F172A' }}>₦{balance?.toLocaleString()}</span>
                    </div>
                )}
            </div>

            {/* Footer Branding */}
            <div style={{ borderTop: '2px solid #F1F5F9', paddingTop: '24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                    <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '16px', opacity: 0.8 }} />
                    <div style={{ width: '1px', height: '12px', background: '#CBD5E1' }} />
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secured Ledger</span>
                </div>
                <p style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                    This transaction is digitally verified and permanently logged.<br />
                    Powered by Kredibly — The Intelligent Commerce Ledger.
                </p>
            </div>

            {/* Security Pattern (Bottom) */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'repeating-linear-gradient(45deg, #F1F5F9, #F1F5F9 10px, #FFFFFF 10px, #FFFFFF 20px)' }} />
        </div>
    );
};

export default TransactionSlip;
