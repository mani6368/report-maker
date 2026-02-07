import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, generating, formatting, preview, complete, error
  const [message, setMessage] = useState('');
  const [reportData, setReportData] = useState(null);
  const [historyTrigger, setHistoryTrigger] = useState(0);
  const [currentReportId, setCurrentReportId] = useState(null); // Track current report ID

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

  // [NEW] Listen for report selection from sidebar
  useEffect(() => {
    const handleLoadReport = (event) => {
      const report = event.detail;
      if (report && report.reportData) {
        setReportData(report.reportData);
        // For edited versions, track the parent ID for regenerationç
        const reportId = report.isEditedVersion && report.parentId ? report.parentId : report.id;
        setCurrentReportId(reportId);
        setStatus('preview');
        setMessage(`Viewing report: ${report.topic}`);
        console.log('Loaded report - ID:', reportId, 'isEdited:', report.isEditedVersion);
      }
    };

    window.addEventListener('loadReport', handleLoadReport);
    return () => window.removeEventListener('loadReport', handleLoadReport);
  }, []);

  const handleGenerate = async (topic, pageCount, apiKey, fileContent, imageCount, contentFontSize, chapterFontSize) => {
    setStatus('generating');
    setMessage(`Our AI is writing your report...`);
    setReportData(null);

    try {
      // 1. Fetch Content
      const data = await fetchReportContent(topic, apiKey, pageCount, fileContent, imageCount);

      // 2. Show Preview
      setReportData({ ...data, fontSizes: { content: contentFontSize, chapter: chapterFontSize } });
      setStatus('preview');
      setMessage('Report generated! Preview it below.');

      // 3. Save full report to History
      try {
        const reportId = Date.now().toString(); // Unique ID
        const historyItem = {
          id: reportId,
          topic,
          date: new Date().toISOString(),
          reportData: { ...data, fontSizes: { content: contentFontSize, chapter: chapterFontSize } }, // Store full report content
          pageCount, // Store page count for editing
          editedVersions: [] // Initialize empty edited versions array
        };
        const existingHistory = JSON.parse(localStorage.getItem('generation_history') || '[]');
        const newHistory = [historyItem, ...existingHistory]; // Add to top
        localStorage.setItem('generation_history', JSON.stringify(newHistory));
        setHistoryTrigger(prev => prev + 1); // Trigger sidebar update
        setCurrentReportId(reportId); // Store the current report ID for editing
      } catch (e) {
        console.error("Failed to save history", e);
      }

    } catch (err) {
      console.error(err);
      setStatus('error');
      // Check for quota/rate limit errors first
      const errorMsg = err.message || 'Something went wrong.';
      if (errorMsg.includes('429') ||
        errorMsg.includes('quota') ||
        errorMsg.includes('Quota') ||
        errorMsg.includes('exceeded') ||
        errorMsg.includes('rate limit')) {
        setMessage('Your API quota has been exceeded! Please enter a new API key to continue.');
      } else if (errorMsg.includes('API key') || errorMsg.includes('API_KEY_INVALID')) {
        setMessage('Your API key is invalid');
      } else {
        setMessage(errorMsg);
      }
    }
  };

  const handleDownload = async () => {
    if (!reportData) return;
    try {
      await generateDocx(reportData, reportData.fontSizes?.content || 14, reportData.fontSizes?.chapter || 16);
      // Keep preview open, just update message
      // setStatus('complete'); 
      setMessage('Download started! You can continue previewing or generate a "New Report".');
    } catch (err) {
      console.error(err);
      alert("Failed to create document");
    }
  };

  const handleEditReport = () => {
    // Toggle edit mode
    setStatus(status === 'editing' ? 'preview' : 'editing');
  };

  const handleRegenerateReport = async ({ apiKey, pageCount, contentFontSize, chapterFontSize, editPrompt }) => {
    try {
      setStatus('generating');
      setMessage('Regenerating report with your changes...');

      // Get the original topic from current report
      const history = JSON.parse(localStorage.getItem('generation_history') || '[]');
      const currentReport = history.find(r => r.id === currentReportId);

      if (!currentReport) {
        throw new Error('Original report not found');
      }

      const originalTopic = currentReport.topic;

      // Build the modified topic/prompt
      let modifiedTopic = originalTopic;
      if (editPrompt) {
        modifiedTopic = `${originalTopic}\n\nADDITIONAL EDITING INSTRUCTIONS: ${editPrompt}`;
      }

      // Regenerate the report with existing data context
      const data = await fetchReportContent(modifiedTopic, apiKey, pageCount, null, 0, currentReport.reportData);

      // Update preview with new data
      setReportData({ ...data, fontSizes: { content: contentFontSize, chapter: chapterFontSize } });
      setStatus('preview');
      setMessage('Report regenerated successfully!');

      // Save as edited version under the original report
      const editedVersionId = `${currentReportId}_edit_${Date.now()}`;
      const editedVersion = {
        id: editedVersionId,
        topic: originalTopic,
        date: new Date().toISOString(),
        reportData: { ...data, fontSizes: { content: contentFontSize, chapter: chapterFontSize } },
        pageCount,
        editPrompt: editPrompt || 'Modified settings',
        isEditedVersion: true,
        parentId: currentReportId
      };

      // Update history: add edited version to parent's editedVersions array
      const updatedHistory = history.map(report => {
        if (report.id === currentReportId) {
          return {
            ...report,
            editedVersions: [...(report.editedVersions || []), editedVersion]
          };
        }
        return report;
      });

      localStorage.setItem('generation_history', JSON.stringify(updatedHistory));
      setHistoryTrigger(prev => prev + 1); // Trigger sidebar update
      setCurrentReportId(editedVersionId); // Update to show we're viewing the edited version

      return { success: true };

    } catch (err) {
      console.error('Regeneration error:', err);
      // Stay in editing mode and return error message
      setStatus('editing');
      const errorMsg = err.message || 'Failed to regenerate report.';
      let userMessage = '';

      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota')) {
        userMessage = 'API quota exceeded! Please check your API key and try again.';
      } else if (errorMsg.includes('API key') || errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('Invalid')) {
        userMessage = 'Invalid API key provided. Please enter a valid Gemini API key.';
      } else {
        userMessage = errorMsg;
      }

      setMessage(userMessage);
      return { success: false, error: userMessage };
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Background Layer */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100%',
        zIndex: 0,
        transform: isMobile ? 'translateX(0)' : `translateX(${isSidebarOpen ? '170px' : '30px'})`
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
      <div className="animate-fade-in" style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : (isSidebarOpen ? '340px' : '60px'),
        width: isMobile ? '100%' : `calc(100% - ${isSidebarOpen ? '340px' : '60px'})`,
        // maxWidth: '1000px', // [REMOVED] To allow full-width centering
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'left 0.3s ease, width 0.3s ease',
        zIndex: 1,
        // [MO] extra top padding for mobile to clear nav bar
        padding: isMobile ? '6rem 0.5rem 1rem' : '2rem',
        boxSizing: 'border-box',
        overflowY: 'auto', // Enable vertical scrolling for the entire content area
        overflowX: 'hidden' // Prevent horizontal scroll
      }}>
        <header style={{ textAlign: 'center', paddingTop: isMobile ? '0' : '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <h1 style={{
            fontSize: isMobile ? '2.5rem' : '4rem',
            margin: '0',
            lineHeight: 1.2,
            color: '#ffffff',
            whiteSpace: 'nowrap'
          }}>
            Report-maker.ai
          </h1>
          <p style={{ color: '#e25a83', fontSize: isMobile ? '1rem' : '1.4rem', margin: '0', fontStyle: 'italic', fontWeight: '500', textShadow: '0 0 10px rgba(226, 90, 131, 0.4)', whiteSpace: 'nowrap' }}>
            Designed to Save Your Valuable Time
          </p>
        </header>


        <main style={{
          display: 'flex',
          alignItems: status === 'preview' ? 'flex-start' : 'center', // Fix scrolling: start at top for long content
          justifyContent: 'center',
          flex: 1,
          width: '100%',
          maxWidth: '2000px',
          overflowY: 'visible' // Ensure scroll works
        }}>
          {status === 'idle' || status === 'error' ? (
            <div style={{ width: '100%', maxWidth: '1000px' }}>
              {/* Pass error message to TopicInput instead of showing StatusDisplay */}
              <TopicInput
                onGenerate={handleGenerate}
                isLoading={status === 'generating'}
                errorMessage={status === 'error' ? message : ''}
                isMobile={isMobile}
              />
            </div>
          ) : null}

          {status === 'complete' && (
            <StatusDisplay status={'complete'} message={message} onReset={() => setStatus('idle')} />
          )}

          {status === 'generating' && (
            <StatusDisplay status={status} message={message} />
          )}

          {(status === 'preview' || status === 'editing') && reportData && (
            <ReportPreview
              data={reportData}
              onDownload={handleDownload}
              onEdit={handleEditReport}
              isEditMode={status === 'editing'}
              onRegenerate={handleRegenerateReport}
            />
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
