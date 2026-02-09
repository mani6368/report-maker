import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, Gift } from 'lucide-react';

const ReferralModal = ({ isOpen, onClose, userEmail, onRedeemSuccess }) => {
    const [myCode, setMyCode] = useState('');
    const [redeemCode, setRedeemCode] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [hasRedeemed, setHasRedeemed] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && userEmail) {
            // 1. Get or Generate MY Referral Code
            let code = localStorage.getItem(`myReferralCode_${userEmail}`);
            if (!code) {
                // Generate a unique code: REF-[EMAIL_PREFIX]-[RANDOM]
                // Example: REF-MANIKANDAN-X92F
                const emailPrefix = userEmail.split('@')[0].toUpperCase().substring(0, 10).replace(/[^A-Z0-9]/g, '');
                const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
                code = `REF-${emailPrefix}-${randomPart}`;
                localStorage.setItem(`myReferralCode_${userEmail}`, code);
            }
            setMyCode(code);

            // 2. Check if user has already redeemed a code
            const redeemed = localStorage.getItem(`hasRedeemedRef_${userEmail}`);
            setHasRedeemed(redeemed === 'true');

            // Reset states
            setRedeemCode('');
            setError('');
            setSuccessMsg('');
        }
    }, [isOpen, userEmail]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(myCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRedeem = (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!redeemCode.trim()) {
            setError('Please enter a code.');
            return;
        }

        const cleanCode = redeemCode.trim().toUpperCase();

        // Validation 1: Cannot redeem own code
        if (cleanCode === myCode) {
            setError('You cannot redeem your own referral code!');
            return;
        }

        // Validation 2: Code format check (starts with REF-)
        if (!cleanCode.startsWith('REF-') || cleanCode.length < 8) {
            setError('Invalid code format. Code should start with REF-');
            return;
        }

        // Success!
        // In a real app, we'd check the backend if code exists. 
        // Here we trust the format for the MVP per user request context (local usage).

        // Mark as redeemed
        localStorage.setItem(`hasRedeemedRef_${userEmail}`, 'true');
        setHasRedeemed(true);

        // Trigger credit update in parent
        onRedeemSuccess(cleanCode);

        setSuccessMsg('Success! 50 Credits added to you & 10 to referrer!');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease-out'
        }}>
            <div className="glass-panel" style={{
                padding: '2rem',
                width: '90%',
                maxWidth: '500px',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '12px',
                        borderRadius: '50%',
                        background: 'rgba(34, 197, 94, 0.1)', // Greenish
                        marginBottom: '1rem'
                    }}>
                        <Gift size={32} color="#4ade80" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: 'white' }}>Refer & Earn</h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
                        Share your code with friends. They get access, you (and they) get rewards!
                    </p>
                </div>

                {/* Section 1: My Code */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                        Your Unique Referral Code
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{
                            flex: 1,
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            padding: '0.8rem',
                            fontFamily: 'monospace',
                            fontSize: '1.2rem',
                            color: '#4ade80',
                            textAlign: 'center',
                            letterSpacing: '2px',
                            fontWeight: 'bold'
                        }}>
                            {myCode}
                        </div>
                        <button
                            onClick={handleCopy}
                            style={{
                                background: copied ? '#4ade80' : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '8px',
                                width: '50px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                color: copied ? 'black' : 'white'
                            }}
                            title="Copy Code"
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                </div>

                {/* Section 2: Redeem Code */}
                <div>
                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                        Redeem a Friend's Code (+50 Credits)
                    </label>

                    {hasRedeemed ? (
                        <div style={{
                            padding: '1rem',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '12px',
                            color: '#4ade80',
                            textAlign: 'center',
                            fontSize: '0.95rem'
                        }}>
                            <Check size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            You have already redeemed a referral code.
                        </div>
                    ) : (
                        <form onSubmit={handleRedeem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    value={redeemCode}
                                    onChange={(e) => setRedeemCode(e.target.value)}
                                    placeholder="Paste code here (e.g. REF-123456)"
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        padding: '0.8rem',
                                        color: 'white',
                                        outline: 'none',
                                        fontSize: '1rem'
                                    }}
                                />
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{
                                        padding: '0 1.5rem',
                                        background: '#e25a83', // Brand color
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Redeem
                                </button>
                            </div>

                            {error && (
                                <div style={{ color: '#ef4444', fontSize: '0.9rem', paddingLeft: '0.5rem' }}>
                                    {error}
                                </div>
                            )}
                            {successMsg && (
                                <div style={{ color: '#4ade80', fontSize: '0.9rem', paddingLeft: '0.5rem' }}>
                                    {successMsg}
                                </div>
                            )}
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ReferralModal;
