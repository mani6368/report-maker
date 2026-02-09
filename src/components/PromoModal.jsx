
import React, { useState } from 'react';
import { Sparkles, X, ArrowRight } from 'lucide-react';

const PromoModal = ({ isOpen, onClose, onProceed, onNoCode }) => {
    const [code, setCode] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onProceed(code);
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
                maxWidth: '450px',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative'
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

                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '12px',
                        borderRadius: '50%',
                        background: 'rgba(226, 90, 131, 0.1)',
                        marginBottom: '1rem'
                    }}>
                        <Sparkles size={32} color="#e25a83" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Have a Promo Code?</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                        Enter your code below to use special features.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Enter your promo code"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '1.1rem',
                            textAlign: 'center',
                            letterSpacing: '1px',
                            outline: 'none'
                        }}
                        autoFocus
                    />

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1.1rem',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginTop: '0.5rem'
                        }}
                    >
                        Proceed <ArrowRight size={20} />
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <button
                    onClick={onNoCode}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                        padding: '0.8rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        transition: 'all 0.2s',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    I don't have a code <span style={{ color: '#ef4444', fontWeight: 'bold' }}>(-10 Credits)</span>
                </button>
            </div>
        </div>
    );
};

export default PromoModal;
