import { useState } from 'react';
import { Sparkles, Linkedin, Github } from 'lucide-react';
import TopicInput from './components/TopicInput';
import StatusDisplay from './components/StatusDisplay';
import ReportPreview from './components/ReportPreview';
import { fetchReportContent } from './services/gemini';
import { generateDocx } from './utils/docxGenerator';

import Orb from './components/Orb';

// Hardcoded API Key REMOVED - User provides it
// const API_KEY = ""; 

function App() {
  const [status, setStatus] = useState('idle'); // idle, generating, formatting, preview, complete, error
  const [message, setMessage] = useState('');
  const [reportData, setReportData] = useState(null);

  const handleGenerate = async (topic, pageCount, apiKey) => {
    setStatus('generating');
    setMessage(`Our AI is writing your report...`);
    setReportData(null);

    try {
      // 1. Fetch Content
      const data = await fetchReportContent(topic, apiKey, pageCount);

      // 2. Show Preview
      setReportData(data);
      setStatus('preview');
      setMessage('Report generated! Preview it below.');

    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage(err.message || 'Something went wrong.');
    }
  };

  const handleDownload = async () => {
    if (!reportData) return;
    try {
      await generateDocx(reportData);
      setStatus('complete');
    } catch (err) {
      console.error(err);
      alert("Failed to create document");
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background Layer */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Orb
          hoverIntensity={0}
          rotateOnHover
          hue={360}
          forceHoverState
          backgroundColor="#000000"
        />
      </div>

      {/* Content Layer */}
      <div className="container animate-fade-in" style={{ padding: '4rem 1rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '3rem' }}>

          <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0', lineHeight: 1.2, color: '#ffffff' }}>
            Report-maker.ai
          </h1>
          <p style={{ color: '#60a5fa', fontSize: '1.4rem', maxWidth: '600px', margin: '0 auto', fontStyle: 'italic', fontWeight: '500', textShadow: '0 0 10px rgba(59, 130, 246, 0.4)' }}>
            Designed to Save Students' Time
          </p>
        </header>

        <main>
          {status === 'idle' || status === 'complete' || status === 'error' ? (
            <div>
              {status === 'complete' && (
                <StatusDisplay status={'complete'} message={message} onReset={() => setStatus('idle')} />
              )}
              {status === 'error' && (
                <StatusDisplay status={'error'} message={message} />
              )}

              {/* Always show input if idle or complete (below success msg) */}
              <TopicInput onGenerate={handleGenerate} isLoading={status === 'generating'} />
            </div>
          ) : null}

          {status === 'generating' && (
            <StatusDisplay status={status} message={message} />
          )}

          {status === 'preview' && reportData && (
            <ReportPreview data={reportData} onDownload={handleDownload} />
          )}


        </main>

        <footer style={{ marginTop: '1rem', color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
            <span>© {new Date().getFullYear()} Report-maker.ai.</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Developed by Manikandan
              <a
                href="https://www.linkedin.com/in/manikandan-d-246972395/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}
                aria-label="LinkedIn Profile"
              >
                <Linkedin size={16} />
              </a>
              <a
                href="https://github.com/mani6368"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}
                aria-label="GitHub Profile"
              >
                <Github size={16} />
              </a>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
