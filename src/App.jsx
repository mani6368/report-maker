import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import TopicInput from './components/TopicInput';
import StatusDisplay from './components/StatusDisplay';
import ReportPreview from './components/ReportPreview';
import { fetchReportContent } from './services/gemini';
import { generateDocx } from './utils/docxGenerator';

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
    <div className="container animate-fade-in" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <header style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <Sparkles size={32} color="var(--color-accent-primary)" />
        </div>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', lineHeight: 1.2 }}>
          <span className="text-gradient">Report-maker.ai</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Created for Reduce the Time for Student
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

      <footer style={{ marginTop: '4rem', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
        <p>© {new Date().getFullYear()} Report-maker.ai. Developed by Manikandan.</p>
      </footer>
    </div>
  );
}

export default App;
