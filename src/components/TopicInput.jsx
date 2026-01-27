import { useState } from 'react';
import { BookOpen, ArrowRight, FileText, Key } from 'lucide-react';

const TopicInput = ({ onGenerate, isLoading }) => {
    const [topic, setTopic] = useState('');
    const [pageCount, setPageCount] = useState(20);
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!topic.trim()) {
            setError('Please provide a project topic.');
            return;
        }
        if (pageCount < 5 || pageCount > 60) {
            setError('Page count must be between 5 and 60.');
            return;
        }
        if (!apiKey.trim()) {
            setError('Please provide your Google Gemini API Key.');
            return;
        }

        setError('');
        onGenerate(topic, pageCount, apiKey);
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* API Key Input */}
                <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Key size={16} /> AI API Key
                        </div>
                    </label>
                    <input
                        type="password"
                        placeholder="Paste your API Key here"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        disabled={isLoading}
                    />
                    <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--color-accent-primary)' }}>
                        Don't have one? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'white' }}>Get it here</a> <span style={{ color: 'white' }}>(Free)</span>
                    </div>
                </div>

                <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={16} /> Enter Report Topic or Detailed Prompt
                        </div>
                    </label>
                    <input
                        type="text"
                        placeholder="Give a detailed prompt is preferable to make best report"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={isLoading}
                        autoFocus
                    />
                </div>

                <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={16} /> Approx. Number of Pages
                        </div>
                    </label>
                    <input
                        type="number"
                        min="5"
                        max="60"
                        value={pageCount}
                        onChange={(e) => setPageCount(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {error && (
                    <div style={{ color: '#ef4444', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                    {isLoading ? 'Generating...' : (
                        <>
                            Generate Report <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default TopicInput;
