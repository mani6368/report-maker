import { useState, useEffect } from 'react';

import { Sparkles, Menu, Plus } from 'lucide-react'; // Added Menu and Plus icons
import TopicInput from './components/TopicInput';
import StatusDisplay from './components/StatusDisplay';
import ReportPreview from './components/ReportPreview';
import Sidebar from './components/Sidebar'; // [NEW] Link Sidebar
import { fetchReportContent } from './services/gemini';
import { generateDocx } from './utils/docxGenerator';

import Orb from './components/Orb';

// Hardcoded API Key REMOVED - User provides it
// const API_KEY = ""; 

function App() {
  const [status, setStatus] = useState('idle'); // idle, generating, formatting, preview, complete, error
  const [message, setMessage] = useState('');
  const [reportData, setReportData] = useState(null);
  const [historyTrigger, setHistoryTrigger] = useState(0);

  // Mobile & Sidebar State
  const [isMobile, setIsMobile] = useState(false); // Default to false, update in effect
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    const handleMobileChange = (e) => {
      const mobile = e.matches;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false); // Close sidebar when switching to mobile
      } else {
        setSidebarOpen(true); // Open sidebar when switching to desktop
      }
    };

    // Initial check
    setIsMobile(mediaQuery.matches);
    if (mediaQuery.matches) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }

    // Listen for changes
    mediaQuery.addEventListener('change', handleMobileChange);
    return () => mediaQuery.removeEventListener('change', handleMobileChange);
  }, []);

  const handleGenerate = async (topic, pageCount, apiKey, fileContent) => {
    // [NEW] Save to History
    try {
      const historyItem = { topic, date: new Date().toISOString() };
      const existingHistory = JSON.parse(localStorage.getItem('generation_history') || '[]');
      const newHistory = [historyItem, ...existingHistory]; // Add to top
      localStorage.setItem('generation_history', JSON.stringify(newHistory));
      setHistoryTrigger(prev => prev + 1); // Trigger sidebar update
    } catch (e) {
      console.error("Failed to save history", e);
    }

    setStatus('generating');
    setMessage(`Our AI is writing your report...`);
    setReportData(null);

    try {
      // 1. Fetch Content
      const data = await fetchReportContent(topic, apiKey, pageCount, fileContent);

      // 2. Show Preview
      setReportData(data);
      setStatus('preview');
      setMessage('Report generated! Preview it below.');

    } catch (err) {
      console.error(err);
      setStatus('error');
      // Simplify error message for API key issues
      const errorMsg = err.message || 'Something went wrong.';
      if (errorMsg.includes('API key') || errorMsg.includes('API_KEY_INVALID')) {
        setMessage('Your API key is invalid');
      } else {
        setMessage(errorMsg);
      }
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
      <div style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : (isSidebarOpen ? '280px' : '60px'),
        width: isMobile ? '100%' : `calc(100% - ${isSidebarOpen ? '280px' : '60px'})`,
        height: '100%',
        zIndex: 0
      }}>
        <Orb
          hoverIntensity={0}
          rotateOnHover
          hue={0}
          baseColor="#e75b73"
          forceHoverState
          backgroundColor="#000000"
        />
      </div>

      {/* Sidebar [NEW] */}
      <Sidebar
        historyTrigger={historyTrigger}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onToggle={() => setSidebarOpen(!isSidebarOpen)}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile Top Bar */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
          zIndex: 90,
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <Menu size={24} />
          </button>

          <h2 style={{ fontSize: '1.2rem', fontWeight: '600', margin: 0, color: 'white' }}>
            Report-maker.ai
          </h2>

          <button
            onClick={() => window.location.reload()}
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Content Layer [UPDATED Layout] */}
      <div className="container animate-fade-in" style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : (isSidebarOpen ? '280px' : '60px'),
        width: isMobile ? '100%' : `calc(100% - ${isSidebarOpen ? '280px' : '60px'})`,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'left 0.3s ease, width 0.3s ease',
        zIndex: 1,
        padding: isMobile ? '1rem' : '2rem',
        boxSizing: 'border-box'
      }}>
        <header style={{ textAlign: 'center', paddingTop: isMobile ? '1rem' : '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>

          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '4rem', // Responsive font size
            margin: '0',
            lineHeight: 1.2,
            color: '#ffffff',
            whiteSpace: 'nowrap'
          }}>
            Report-maker.ai
          </h1>
          <p style={{ color: '#e25a83', fontSize: '1.4rem', margin: '0', fontStyle: 'italic', fontWeight: '500', textShadow: '0 0 10px rgba(226, 90, 131, 0.4)', whiteSpace: 'nowrap' }}>
            Designed to Save Your Valuable Time
          </p>
        </header>

        <main style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          width: '100%',
          maxWidth: '2000px'
        }}>
          {status === 'idle' || status === 'error' ? (
            <div>
              {/* Pass error message to TopicInput instead of showing StatusDisplay */}
              <TopicInput
                onGenerate={handleGenerate}
                isLoading={status === 'generating'}
                errorMessage={status === 'error' ? message : ''}
              />
            </div>
          ) : null}

          {status === 'complete' && (
            <StatusDisplay status={'complete'} message={message} onReset={() => setStatus('idle')} />
          )}

          {status === 'generating' && (
            <StatusDisplay status={status} message={message} />
          )}

          {status === 'preview' && reportData && (
            <ReportPreview data={reportData} onDownload={handleDownload} />
          )}


        </main>

        <footer style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '0.9rem',
          textAlign: 'center',
          paddingBottom: isMobile ? '1rem' : '2rem',
          zIndex: 2,
          whiteSpace: 'nowrap'
        }}>
          <span>© {new Date().getFullYear()} Report-maker.ai.</span>
        </footer>
      </div>
    </div>
  );
}

export default App;
