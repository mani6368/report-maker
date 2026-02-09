import { useState, useRef } from 'react';
import { BookOpen, ArrowRight, FileText, Key, Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const TopicInput = ({ onGenerate, isLoading, errorMessage = '', isMobile = false }) => {
    const [topic, setTopic] = useState('');
    const [pageCount, setPageCount] = useState(20);
    const [imageCount] = useState(0); // Images disabled - set to 0
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');

    // Font Size State
    const [contentFontSize, setContentFontSize] = useState(14); // Default 14pt
    const [chapterFontSize, setChapterFontSize] = useState(16); // Default 16pt

    // File Upload State
    const [file, setFile] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setIsProcessingFile(true);
        setError('');
        setExtractedText('');

        try {
            let text = '';
            const fileType = selectedFile.name.split('.').pop().toLowerCase();

            if (fileType === 'pdf') {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                // Limit parsing to first 20 pages to avoid browser freeze on huge docs
                const maxPages = Math.min(pdf.numPages, 20);
                for (let i = 1; i <= maxPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                text = fullText;
            }
            else if (fileType === 'docx') {
                const arrayBuffer = await selectedFile.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;
            }
            else if (fileType === 'txt') {
                text = await selectedFile.text();
            }
            else {
                throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
            }

            if (!text.trim()) {
                throw new Error("Could not extract text from file. It might be empty or scanned images.");
            }

            setExtractedText(text);
        } catch (err) {
            console.error(err);
            setError(err.message || "Failed to process file.");
            setFile(null); // Reset file on error
        } finally {
            setIsProcessingFile(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        setExtractedText('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Topic is optional if we have a file, but usually users want both.
        // Let's require at least one.
        if (!topic.trim() && !extractedText) {
            setError('Please provide a topic OR upload a reference report.');
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
        // Pass all parameters including font sizes
        onGenerate(topic, pageCount, apiKey, extractedText, imageCount, contentFontSize, chapterFontSize);
    };

    return (
        <div className="glass-panel responsive-container">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem' }}>

                {/* API Key Input */}
                <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: isMobile ? '0.35rem' : '0.5rem', fontSize: isMobile ? '0.8rem' : '1.1rem', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Key size={isMobile ? 14 : 18} /> AI API Key
                        </div>
                    </label>
                    <input
                        type="password"
                        placeholder="Paste your API Key here"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        disabled={isLoading}
                    />
                    <div style={{ fontSize: isMobile ? '0.7rem' : '0.9rem', marginTop: '0.4rem', color: 'var(--color-accent-primary)' }}>
                        Don't have one? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'white' }}>Get it here</a> <span style={{ color: 'white' }}>(Free)</span>
                    </div>
                    {/* Show API key error inline */}
                    {errorMessage && (
                        <div style={{
                            color: '#ef4444',
                            fontSize: '0.85rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            marginTop: '0.5rem',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                            ⚠️ {errorMessage}
                        </div>
                    )}
                </div>

                {/* FILE UPLOAD SECTION */}
                <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: isMobile ? '0.35rem' : '0.5rem', fontSize: isMobile ? '0.8rem' : '1.1rem', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Upload size={isMobile ? 14 : 18} /> Upload Reference Report (Optional)
                        </div>
                    </label>

                    {!file ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                border: '2px dashed rgba(255,255,255,0.2)',
                                borderRadius: '8px',
                                padding: '1.5rem',
                                textAlign: 'center',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                background: 'rgba(0,0,0,0.2)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-accent-primary)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.docx,.txt"
                                style={{ display: 'none' }}
                                disabled={isLoading}
                            />
                            <p style={{ margin: 0, fontSize: isMobile ? '0.8rem' : '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                                Click to upload PDF, DOCX, or TXT
                            </p>
                            <p style={{ margin: '0.2rem 0 0', fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                                We'll analyze it to match the style & content.
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            padding: '0.8rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', overflow: 'hidden' }}>
                                {isProcessingFile ? (
                                    <Loader2 size={20} className="animate-spin" color="#e25a83" />
                                ) : (
                                    <CheckCircle size={20} color="#4ade80" />
                                )}
                                <div style={{ overflow: 'hidden' }}>
                                    <div style={{ fontSize: '0.9rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {file.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                                        {isProcessingFile ? 'Extracting text...' : `${(file.size / 1024).toFixed(1)} KB • Ready`}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={clearFile}
                                disabled={isProcessingFile || isLoading}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.6)',
                                    cursor: 'pointer',
                                    padding: '0.4rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: isMobile ? '0.35rem' : '0.5rem', fontSize: isMobile ? '0.8rem' : '1.1rem', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={isMobile ? 14 : 18} /> Enter Report Topic or Detailed Prompt
                        </div>
                    </label>
                    <input
                        type="text"
                        placeholder="Give a detailed prompt is preferable to make best report"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: isMobile ? '0.35rem' : '0.5rem', fontSize: isMobile ? '0.8rem' : '1.1rem', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={isMobile ? 14 : 18} /> Approx. Number of Pages
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


                {/* Content Font Size Section */}
                <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: isMobile ? '0.35rem' : '0.5rem', fontSize: isMobile ? '0.8rem' : '1.1rem', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={isMobile ? 14 : 18} /> Content Font Size (10-18pt)
                        </div>
                    </label>
                    <input
                        type="number"
                        min="10"
                        max="18"
                        value={contentFontSize}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                                setContentFontSize('');
                            } else {
                                const num = parseInt(val);
                                if (!isNaN(num)) {
                                    setContentFontSize(num);
                                }
                            }
                        }}
                        onBlur={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseInt(val) < 10) {
                                setContentFontSize(14);
                            } else if (parseInt(val) > 18) {
                                setContentFontSize(18);
                            }
                        }}
                        disabled={isLoading}
                        placeholder="14"
                    />
                    <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', marginTop: '0.3rem', color: 'rgba(255,255,255,0.5)' }}>
                        Default: 14pt - Sets the font size for all content text
                    </div>
                </div>

                {/* Chapter Font Size Section */}
                <div style={{ textAlign: 'left' }}>
                    <label style={{ display: 'block', marginBottom: isMobile ? '0.35rem' : '0.5rem', fontSize: isMobile ? '0.8rem' : '1.1rem', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={isMobile ? 14 : 18} /> Chapter Title Font Size (12-20pt)
                        </div>
                    </label>
                    <input
                        type="number"
                        min="12"
                        max="20"
                        value={chapterFontSize}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                                setChapterFontSize('');
                            } else {
                                const num = parseInt(val);
                                if (!isNaN(num)) {
                                    setChapterFontSize(num);
                                }
                            }
                        }}
                        onBlur={(e) => {
                            const val = e.target.value;
                            if (val === '' || parseInt(val) < 12) {
                                setChapterFontSize(16);
                            } else if (parseInt(val) > 20) {
                                setChapterFontSize(20);
                            }
                        }}
                        disabled={isLoading}
                        placeholder="16"
                    />
                    <div style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', marginTop: '0.3rem', color: 'rgba(255,255,255,0.5)' }}>
                        Default: 16pt - Sets the font size for chapter titles
                    </div>
                </div>

                {error && (
                    <div style={{ color: '#ef4444', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isLoading || isProcessingFile}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: isMobile ? '1rem' : '1.1rem' }}
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
