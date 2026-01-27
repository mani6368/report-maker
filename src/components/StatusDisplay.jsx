import { Loader2, CheckCircle, FileText } from 'lucide-react';

const StatusDisplay = ({ status, message }) => {
    if (status === 'idle') return null;

    return (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '500px', margin: '2rem auto 0', textAlign: 'center' }}>

            {status === 'generating' || status === 'formatting' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Loader2 className="spin" size={48} color="var(--color-accent-primary)" style={{ animation: 'spin 2s linear infinite' }} />
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>Working on it...</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>{message}</p>
                    </div>
                </div>
            ) : null}

            {status === 'complete' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <CheckCircle size={48} color="#22c55e" />
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>Success!</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Your report has been generated and downloaded.</p>
                    </div>
                </div>
            )}

            {status === 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '3rem' }}>😕</div>
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>Oops!</h3>
                        <p style={{ margin: 0, color: '#ef4444' }}>{message}</p>
                    </div>
                </div>
            )}

            <style>
                {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
};

export default StatusDisplay;
