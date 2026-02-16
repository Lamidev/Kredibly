import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, CheckCircle2, Trophy, Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatusTicker = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    // Determine verification status
    // A merchant is "Verified" if they have a business name, WhatsApp number, and bank details
    const isVerified = 
        profile?.displayName && 
        profile?.whatsappNumber && 
        profile?.bankDetails?.accountNumber;

    // Ticker Content Configuration
    const content = isVerified ? {
        theme: 'success',
        bg: '#1E1B4B', // Deep Navy/Purple (Brand aligned)
        text: '#EEF2FF',
        accent: '#4C1D95',
        icon: <CheckCircle2 size={14} fill="#4ADE80" color="#1E1B4B" />,
        messages: [
            `✅ ${profile?.plan?.toUpperCase()} ACCOUNT: VERIFIED`,
            "STATUS: ACTIVE",
            "TRUST SCORE: HIGH",
            "🚀 DOWNLOAD OFFICIAL TRUST BADGE",
            "PAYOUTS: ENABLED",
            "KREDIBLY SECURED",
            "OGA VIBES ONLY"
        ],
        action: () => navigate('/settings')
    } : {
        theme: 'warning',
        bg: '#451A03', // Dark Amber (Brand aligned)
        text: '#FEF3C7',
        accent: '#F59E0B',
        icon: <AlertTriangle size={14} fill="#F59E0B" color="#451A03" />,
        messages: [
            `⚠️ ${profile?.plan?.toUpperCase()} ACCOUNT: UNVERIFIED`,
            "COMPLETE SETUP TO UNLOCK BADGE",
            "PAYOUTS: RESTRICTED",
            "TRUST SCORE: LOW",
            "⚠️ ACTION REQUIRED: FINISH PROFILE",
            "DO PEOPLE OWE YOU MONEY? VERIFY NOW"
        ],
        action: () => navigate('/settings')
    };

    // Duplicate messages to ensure smooth infinite scroll
    const scrollingItems = [...content.messages, ...content.messages, ...content.messages, ...content.messages];

    return (
        <div 
            onClick={content.action}
            style={{
                background: content.bg,
                color: content.text,
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                borderBottom: `1px solid ${content.accent}40`,
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                userSelect: 'none',
                marginBottom: '24px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
        >
            {/* The infinite scrolling track */}
            <div className="ticker-track">
                {scrollingItems.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', paddingRight: '40px' }}>
                        {content.icon}
                        <span>{msg}</span>
                    </div>
                ))}
            </div>

            <style>{`
                .ticker-track {
                    display: flex;
                    animation: ticker-scroll 30s linear infinite;
                    min-width: 100%;
                    width: max-content;
                }
                
                @keyframes ticker-scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }

                .ticker-track:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default StatusTicker;
