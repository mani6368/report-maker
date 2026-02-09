
import React from 'react';
import { Sparkles } from 'lucide-react';

const CreditHeader = ({ credits, isMobile }) => {
    const isOutOfCredits = credits === 0;

    return (
        <div style={{
            position: 'absolute',
            top: isMobile ? '4rem' : '1rem', // Moved up from 4.5rem to 4rem per request
            right: isMobile ? '1rem' : '2rem', // Align with content padding
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            padding: isMobile ? '0.25rem 0.75rem' : '0.5rem 1rem', // Smaller padding on mobile
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 90, // Lower z-index to not overlap mobile menu if it expands (though menu is likely higher)
            transition: 'all 0.3s ease',
            transform: isMobile ? 'scale(0.85)' : 'scale(1)', // Slightly smaller on mobile
            transformOrigin: 'right center'
        }}>
            <Sparkles
                size={20}
                color={isOutOfCredits ? '#ef4444' : '#e25a83'}
                fill={isOutOfCredits ? '#ef4444' : '#e25a83'}
                style={{ opacity: 0.9 }}
            />
            <span style={{
                color: isOutOfCredits ? '#ef4444' : '#ffffff',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontWeight: '700',
                fontSize: '1rem',
                letterSpacing: '0.5px'
            }}>
                {credits} credits
            </span>
        </div>
    );
};

export default CreditHeader;
