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
            {/* Background Aesthetic Elements & Security Watermark */}
            <div style={{ 
                position: 'absolute', 
                inset: '-50%', 
                width: '200%', 
                height: '200%',
                opacity: 0.04, 
                pointerEvents: 'none',
                backgroundImage: 'url("/krediblyrevamped.png")',
                backgroundSize: '100px',
                backgroundRepeat: 'repeat',
                transform: 'rotate(-15deg)',
                zIndex: 0
            }} />
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)', borderRadius: '50%', zIndex: 1 }} />
            
            {/* Main Content Layer */}
            <div style={{ position: 'relative', zIndex: 10 }}>
                {/* Header / Status */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ 
                        width: '56px', 
                        height: '56px', 
                        background: '#ECFDF5', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 16px',
                        border: '1px solid #D1FAE5'
                    }}>
                        <CheckCircle2 size={28} color="#10B981" />
                    </div>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Transaction Successful</h2>
                    <p style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, marginTop: '4px' }}>Verified Digital Receipt</p>
                </div>

                {/* Amount Section */}
                <div style={{ textAlign: 'center', marginBottom: '32px', background: '#F8FAFC', padding: '24px 20px', borderRadius: '24px', border: '1px solid #F1F5F9' }}>
                    <p style={{ fontSize: '10px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Amount Paid</p>
                    <h1 style={{ fontSize: '38px', fontWeight: 950, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                        <span style={{ fontSize: '20px', fontWeight: 800, marginRight: '4px' }}>₦</span>{amount?.toLocaleString()}
                    </h1>
                </div>

                {/* Details Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Beneficiary</span>
                        <div style={{ textAlign: 'right', maxWidth: '60%' }}>
                            <p style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{businessName}</p>
                            <p style={{ fontSize: '10px', color: '#64748B', margin: '2px 0 0' }}>Verified Merchant</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Payer</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{customerName || 'Customer'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Reference</span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#4C1D95', fontFamily: 'monospace' }}>{reference}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Date & Time</span>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{date ? new Date(date).toLocaleString() : new Date().toLocaleString()}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px dashed #E2E8F0', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Status</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
                            <div style={{ width: '5px', height: '5px', background: '#10B981', borderRadius: '50%' }} />
                            <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>Completed</span>
                        </div>
                    </div>
                </div>

                {/* Balance Footer */}
                <div style={{ 
                    background: isFullyPaid ? 'linear-gradient(135deg, #065F46, #047857)' : '#F8FAFC', 
                    padding: '16px', 
                    borderRadius: '20px', 
                    textAlign: 'center',
                    border: isFullyPaid ? 'none' : '1px solid #E2E8F0',
                    marginBottom: '32px'
                }}>
                    {isFullyPaid ? (
                        <div>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.1em' }}>INVOICE FULLY SETTLED</p>
                            <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>This debt has been cleared from the ledger</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>REMAINING BALANCE</span>
                            <span style={{ fontSize: '14px', fontWeight: 950, color: '#0F172A' }}>₦{balance?.toLocaleString()}</span>
                        </div>
                    )}
                </div>

                {/* Footer Branding */}
                <div style={{ borderTop: '2px solid #F1F5F9', paddingTop: '20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                        <img src="/krediblyrevamped.png" alt="Kredibly" style={{ height: '12px', opacity: 0.8 }} />
                        <div style={{ width: '1px', height: '10px', background: '#CBD5E1' }} />
                        <span style={{ fontSize: '8px', fontWeight: 900, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secured Ledger</span>
                    </div>
                    <p style={{ fontSize: '8px', color: '#94A3B8', fontWeight: 600, margin: 0, lineHeight: 1.4, opacity: 0.8 }}>
                        This transaction is digitally verified and permanently logged.<br />
                        Powered by Kredibly Infrastructure.
                    </p>
                </div>
            </div>

            {/* Security Pattern (Bottom) */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'repeating-linear-gradient(45deg, #F1F5F9, #F1F5F9 10px, #FFFFFF 10px, #FFFFFF 20px)' }} />
        </div>
    );
};

export default TransactionSlip;
