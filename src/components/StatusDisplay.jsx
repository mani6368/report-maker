import { Loader2, CheckCircle, FileText } from 'lucide-react';
import GridLoader from './GridLoader';

const StatusDisplay = ({ status, message, onReset }) => {
    if (status === 'idle') return null;

    return (
        <div className="glass-panel animate-fade-in" style={{
            padding: '4rem 3rem',
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center',
            transform: 'translateY(-10vh)'
        }}>

            {(status === 'generating' || status === 'formatting') && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>

                    {/* Grid Loader with Logo and Pink Dot */}
                    <GridLoader />

                    <div>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.8rem' }}>Working on it...</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '1.2rem' }}>{message}</p>
                    </div>
                </div>
            )}

            {status === 'complete' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <CheckCircle size={48} color="#e25a83" />
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem 0' }}>Success!</h3>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Your report has been generated and downloaded.</p>
                    </div>
                    {onReset && (
                        <a href="#" onClick={(e) => { e.preventDefault(); onReset(); }} className="sparkle-btn">
                            <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M93.781 51.578C95 50.969 96 49.359 96 48c0-1.375-1-2.969-2.219-3.578 0 0-22.868-1.514-31.781-10.422-8.915-8.91-10.438-31.781-10.438-31.781C50.969 1 49.375 0 48 0s-2.969 1-3.594 2.219c0 0-1.5 22.87-10.406 31.781-8.908 8.913-31.781 10.422-31.781 10.422C1 45.031 0 46.625 0 48c0 1.359 1 2.969 2.219 3.578 0 0 22.873 1.51 31.781 10.422 8.906 8.911 10.406 31.781 10.406 31.781C45.031 95 46.625 96 48 96s2.969-1 3.562-2.219c0 0 1.523-22.871 10.438-31.781 8.913-8.908 31.781-10.422 31.781-10.422Z" fill="#000" /></svg>
                            <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M93.781 51.578C95 50.969 96 49.359 96 48c0-1.375-1-2.969-2.219-3.578 0 0-22.868-1.514-31.781-10.422-8.915-8.91-10.438-31.781-10.438-31.781C50.969 1 49.375 0 48 0s-2.969 1-3.594 2.219c0 0-1.5 22.87-10.406 31.781-8.908 8.913-31.781 10.422-31.781 10.422C1 45.031 0 46.625 0 48c0 1.359 1 2.969 2.219 3.578 0 0 22.873 1.51 31.781 10.422 8.906 8.911 10.406 31.781 10.406 31.781C45.031 95 46.625 96 48 96s2.969-1 3.562-2.219c0 0 1.523-22.871 10.438-31.781 8.913-8.908 31.781-10.422 31.781-10.422Z" fill="#000" /></svg>
                            <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M93.781 51.578C95 50.969 96 49.359 96 48c0-1.375-1-2.969-2.219-3.578 0 0-22.868-1.514-31.781-10.422-8.915-8.91-10.438-31.781-10.438-31.781C50.969 1 49.375 0 48 0s-2.969 1-3.594 2.219c0 0-1.5 22.87-10.406 31.781-8.908 8.913-31.781 10.422-31.781 10.422C1 45.031 0 46.625 0 48c0 1.359 1 2.969 2.219 3.578 0 0 22.873 1.51 31.781 10.422 8.906 8.911 10.406 31.781 10.406 31.781C45.031 95 46.625 96 48 96s2.969-1 3.562-2.219c0 0 1.523-22.871 10.438-31.781 8.913-8.908 31.781-10.422 31.781-10.422Z" fill="#000" /></svg>
                            <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M93.781 51.578C95 50.969 96 49.359 96 48c0-1.375-1-2.969-2.219-3.578 0 0-22.868-1.514-31.781-10.422-8.915-8.91-10.438-31.781-10.438-31.781C50.969 1 49.375 0 48 0s-2.969 1-3.594 2.219c0 0-1.5 22.87-10.406 31.781-8.908 8.913-31.781 10.422-31.781 10.422C1 45.031 0 46.625 0 48c0 1.359 1 2.969 2.219 3.578 0 0 22.873 1.51 31.781 10.422 8.906 8.911 10.406 31.781 10.406 31.781C45.031 95 46.625 96 48 96s2.969-1 3.562-2.219c0 0 1.523-22.871 10.438-31.781 8.913-8.908 31.781-10.422 31.781-10.422Z" fill="#000" /></svg>
                            <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M93.781 51.578C95 50.969 96 49.359 96 48c0-1.375-1-2.969-2.219-3.578 0 0-22.868-1.514-31.781-10.422-8.915-8.91-10.438-31.781-10.438-31.781C50.969 1 49.375 0 48 0s-2.969 1-3.594 2.219c0 0-1.5 22.87-10.406 31.781-8.908 8.913-31.781 10.422-31.781 10.422C1 45.031 0 46.625 0 48c0 1.359 1 2.969 2.219 3.578 0 0 22.873 1.51 31.781 10.422 8.906 8.911 10.406 31.781 10.406 31.781C45.031 95 46.625 96 48 96s2.969-1 3.562-2.219c0 0 1.523-22.871 10.438-31.781 8.913-8.908 31.781-10.422 31.781-10.422Z" fill="#000" /></svg>
                            <span>Generate Another Report</span>
                            <span aria-hidden="true">Generate Another Report</span>
                        </a>
                    )}
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
          /* Pink Ball CSS Loader */
          .loader {
            width: 120px;
            aspect-ratio: 2;
            background:
              radial-gradient(farthest-side, #e25a83 90%, #0000) 0 0/12px 12px,
              linear-gradient(#fff 0 0) 100% 0/45px 15px,
              linear-gradient(#fff 0 0) 0 100%/45px 15px,
              repeating-linear-gradient(90deg, #fff 0 15px, #0000 0 45px);
            background-repeat: no-repeat;
            animation: l6 2s infinite;
          }
          @keyframes l6 {
            0%    {background-position:left 1px bottom 1px,100% 0,0 100%,0 0}
            12.5% {background-position:left 50% bottom 1px,100% 0,0 100%,0 0}
            25%   {background-position:left 50% top 1px,100% 0,0 100%,0 0}
            37.5% {background-position:right 1px top 1px,100% 0,0 100%,0 0}
            50%   {background-position:right 1px bottom 1px,0 0,100% 100%,0 0}
            62.5% {background-position:right 50% bottom 1px,0 0,100% 100%,0 0}
            75%   {background-position:right 50% top 1px,0 0,100% 100%,0 0}
            87.5% {background-position:left 1px top 1px,0 0,100% 100%,0 0}
            100%  {background-position:left 1px bottom 1px,100% 0,0 100%,0 0}
          }

          /* Sparkle Button CSS */
          .sparkle-btn {
            --btn-font-size: 1rem;
            --color: #e25a83;
            --shadow: rgba(226, 90, 131, 0.4);
            --glare: rgba(255, 255, 255, 0.75);
            --hover: 0;
            --pos: 0;
            
            display: inline-block;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            text-decoration: none;
            color: transparent;
            position: relative;
            transition: background 0.2s;
            margin-top: 2rem;
            cursor: pointer;
            border: 1px solid rgba(255,255,255,0.1);
          }

          .sparkle-btn:hover {
            background: rgba(255, 255, 255, 0.05);
            --hover: 1;
            --pos: 1;
          }

          .sparkle-btn span {
            display: inline-block;
            font-size: var(--btn-font-size);
            font-weight: 600;
            transition: all 0.2s;
            text-decoration: none;
            pointer-events: none;
            text-shadow:
                calc(var(--hover) * (var(--btn-font-size) * -0)) calc(var(--hover) * (var(--btn-font-size) * 0)) var(--shadow),
                calc(var(--hover) * (var(--btn-font-size) * -0.02)) calc(var(--hover) * (var(--btn-font-size) * 0.02)) var(--shadow),
                calc(var(--hover) * (var(--btn-font-size) * -0.04)) calc(var(--hover) * (var(--btn-font-size) * 0.04)) var(--shadow),
                calc(var(--hover) * (var(--btn-font-size) * -0.06)) calc(var(--hover) * (var(--btn-font-size) * 0.06)) var(--shadow),
                calc(var(--hover) * (var(--btn-font-size) * -0.08)) calc(var(--hover) * (var(--btn-font-size) * 0.08)) var(--shadow),
                calc(var(--hover) * (var(--btn-font-size) * -0.10)) calc(var(--hover) * (var(--btn-font-size) * 0.10)) var(--shadow);
            transform: translate(calc(var(--hover) * (var(--btn-font-size) * 0.10)), calc(var(--hover) * (var(--btn-font-size) * -0.10)));
          }

        .sparkle-btn span:last-of-type {
            position: absolute;
            inset: 0.75rem 1.5rem; /* Match padding */
            background: linear-gradient(
                108deg,
                transparent 0 55%,
                var(--glare) 55% 60%,
                transparent 60% 70%,
                var(--glare) 70% 85%,
                transparent 85%
            ) calc(var(--pos) * -200%) 0% / 200% 100%, var(--color);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            color: transparent;
            z-index: 2;
            text-shadow: none;
            transform: translate(calc(var(--hover) * (var(--btn-font-size) * 0.10)), calc(var(--hover) * (var(--btn-font-size) * -0.10)));
            transition: transform 0.2s, background-position 0s;
        }

        .sparkle-btn:hover span:last-of-type {
            transition: transform 0.2s, background-position calc(var(--hover) * 1.5s) calc(var(--hover) * 0.25s);
        }

        .sparkle-btn:active {
            --hover: 0;
        }

        .sparkle-btn:active span:last-of-type {
            --hover: 0;
            --pos: 1;
        }

        /* Sparkles */
        .sparkle-btn svg {
            position: absolute;
            z-index: 3;
            width: calc(var(--btn-font-size) * 0.8);
            aspect-ratio: 1;
        }

        .sparkle-btn svg path {
            fill: var(--glare);
        }

        .sparkle-btn:hover svg {
            animation: sparkle 0.75s calc((var(--delay-step) * var(--d)) * 1s) both;
        }

        @keyframes sparkle {
            50% {
                transform: translate(-50%, -50%) scale(var(--s, 1));
            }
        }

        .sparkle-btn svg {
            --delay-step: 0.15;
            top: calc(var(--y, 50) * 1%);
            left:  calc(var(--x, 0) * 1%);
            transform: translate(-50%, -50%) scale(0);
        }

        .sparkle-btn svg:nth-of-type(1) { --x: 0; --y: 20; --s: 1.1; --d: 1; }
        .sparkle-btn svg:nth-of-type(2) { --x: 15; --y: 80; --s: 1.25; --d: 2; }
        .sparkle-btn svg:nth-of-type(3) { --x: 45; --y: 40; --s: 1.1; --d: 3; }
        .sparkle-btn svg:nth-of-type(4) { --x: 75; --y: 60; --s: 0.9; --d: 2; }
        .sparkle-btn svg:nth-of-type(5) { --x: 100; --y: 30; --s: 0.8; --d: 4; }
        `}
            </style>
        </div >
    );
};

export default StatusDisplay;
