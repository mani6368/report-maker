import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Key, FileText, BookOpen, Loader2 } from 'lucide-react';
import { generateDocx } from '../utils/docxGenerator';
import './EditReport.css';

const EditReport = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [reportData, setReportData] = useState(null);
    const [originalReportId, setOriginalReportId] = useState(null);

    // Editor state
    const [apiKey, setApiKey] = useState('');
    const [pageCount, setPageCount] = useState(20);
    const [contentFontSize, setContentFontSize] = useState(14);
    const [chapterFontSize, setChapterFontSize] = useState(16);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [editedChapters, setEditedChapters] = useState({});

    useEffect(() => {
        // Get report data from navigation state
        if (location.state?.reportData) {
            const data = location.state.reportData;
            setReportData(data);
            setOriginalReportId(location.state.originalReportId);

            // Initialize editor values from existing report
            setPageCount(location.state.pageCount || 20);
            setContentFontSize(data.fontSizes?.content || 14);
            setChapterFontSize(data.fontSizes?.chapter || 16);

            // Initialize edited chapters state
            const initialChapters = {};
            data.chapters?.forEach(chapter => {
                initialChapters[chapter.number] = {
                    content: chapter.content,
                    subsections: chapter.subsections || []
                };
            });
            setEditedChapters(initialChapters);
        } else {
            // No report data, redirect back to home
            navigate('/home');
        }
    }, [location, navigate]);

    const handleFontSizeChange = (type, value) => {
        const numValue = parseInt(value) || 0;
        if (type === 'content') {
            const clamped = Math.max(10, Math.min(18, numValue));
            setContentFontSize(clamped);
            // Instant update - just update reportData
            setReportData(prev => ({
                ...prev,
                fontSizes: { ...prev.fontSizes, content: clamped }
            }));
        } else {
            const clamped = Math.max(12, Math.min(20, numValue));
            setChapterFontSize(clamped);
            setReportData(prev => ({
                ...prev,
                fontSizes: { ...prev.fontSizes, chapter: clamped }
            }));
        }
    };

    const handleChapterContentChange = (chapterNumber, content) => {
        setEditedChapters(prev => ({
            ...prev,
            [chapterNumber]: {
                ...prev[chapterNumber],
                content
            }
        }));
    };

    const handleSubsectionContentChange = (chapterNumber, subsectionIndex, content) => {
        setEditedChapters(prev => ({
            ...prev,
            [chapterNumber]: {
                ...prev[chapterNumber],
                subsections: prev[chapterNumber].subsections.map((sub, idx) =>
                    idx === subsectionIndex ? { ...sub, content } : sub
                )
            }
        }));
    };

    const handleRegenerateFullReport = async () => {
        if (!apiKey) {
            alert('Please enter an API key to regenerate the report.');
            return;
        }

        setIsRegenerating(true);
        try {
            // Import gemini service dynamically
            const { fetchReportContent } = await import('../services/gemini');

            // Regenerate with new page count
            const newData = await fetchReportContent(
                reportData.title,
                apiKey,
                pageCount,
                '', // No reference text
                0 // No images
            );

            // Update report data with new content but keep current font sizes
            setReportData({
                ...newData,
                fontSizes: { content: contentFontSize, chapter: chapterFontSize }
            });

            // Update edited chapters
            const newChapters = {};
            newData.chapters?.forEach(chapter => {
                newChapters[chapter.number] = {
                    content: chapter.content,
                    subsections: chapter.subsections || []
                };
            });
            setEditedChapters(newChapters);

            alert('Report regenerated successfully!');
        } catch (error) {
            console.error('Regeneration failed:', error);
            const errorMsg = error.message || '';
            if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota')) {
                alert('⚠️ Your API quota has been exceeded! Please enter a new API key.');
            } else {
                alert(`Failed to regenerate report: ${error.message}`);
            }
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleSaveEditedReport = () => {
        // Update reportData with edited chapters
        const updatedReport = {
            ...reportData,
            chapters: reportData.chapters.map(chapter => ({
                ...chapter,
                content: editedChapters[chapter.number]?.content || chapter.content,
                subsections: editedChapters[chapter.number]?.subsections || chapter.subsections
            })),
            fontSizes: { content: contentFontSize, chapter: chapterFontSize }
        };

        // Save as edited version to history
        try {
            const existingHistory = JSON.parse(localStorage.getItem('generation_history') || '[]');

            // Find the original report
            const originalIndex = existingHistory.findIndex(item => item.id === originalReportId);

            if (originalIndex !== -1) {
                // Add edited version to original report
                const editedVersion = {
                    id: `edit-${Date.now()}`,
                    date: new Date().toLocaleString(),
                    reportData: updatedReport
                };

                if (!existingHistory[originalIndex].editedVersions) {
                    existingHistory[originalIndex].editedVersions = [];
                }
                existingHistory[originalIndex].editedVersions.push(editedVersion);

                localStorage.setItem('generation_history', JSON.stringify(existingHistory));
                alert('✅ Edited report saved to history!');

                // Navigate back to home with updated report
                navigate('/home', { state: { reportData: updatedReport } });
            }
        } catch (error) {
            console.error('Failed to save edited report:', error);
            alert('Failed to save edited report to history');
        }
    };

    const handleDownload = async () => {
        if (!reportData) return;

        // Create updated report with current edits
        const updatedReport = {
            ...reportData,
            chapters: reportData.chapters.map(chapter => ({
                ...chapter,
                content: editedChapters[chapter.number]?.content || chapter.content,
                subsections: editedChapters[chapter.number]?.subsections || chapter.subsections
            })),
            fontSizes: { content: contentFontSize, chapter: chapterFontSize }
        };

        await generateDocx(updatedReport);
    };

    if (!reportData) {
        return (
            <div className="edit-report-loading">
                <Loader2 className="spinner" size={48} />
                <p>Loading editor...</p>
            </div>
        );
    }

    return (
        <div className="edit-report-container">
            {/* Header */}
            <div className="edit-report-header">
                <button className="back-button" onClick={() => navigate('/home')}>
                    <ArrowLeft size={20} />
                    Back to Home
                </button>
                <h1 className="edit-report-title">✏️ Edit Your Report</h1>
                <div className="header-actions">
                    <button className="save-button" onClick={handleSaveEditedReport}>
                        Save Edited Version
                    </button>
                    <button className="download-button" onClick={handleDownload}>
                        <Download size={20} />
                        Download
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="edit-report-content">
                {/* Left Sidebar - Controls */}
                <div className="edit-controls">
                    <h2>Report Settings</h2>

                    {/* API Key */}
                    <div className="control-group">
                        <label>
                            <Key size={18} /> Fresh API Key
                        </label>
                        <input
                            type="text"
                            placeholder="Enter new API key for regeneration"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="control-input"
                        />
                    </div>

                    {/* Page Count */}
                    <div className="control-group">
                        <label>
                            <FileText size={18} /> Number of Pages
                        </label>
                        <input
                            type="number"
                            min="5"
                            max="100"
                            value={pageCount}
                            onChange={(e) => setPageCount(parseInt(e.target.value) || 20)}
                            className="control-input"
                        />
                        <button
                            className="regenerate-button"
                            onClick={handleRegenerateFullReport}
                            disabled={isRegenerating || !apiKey}
                        >
                            {isRegenerating ? (
                                <>
                                    <Loader2 className="spinner" size={16} />
                                    Regenerating...
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={16} />
                                    Regenerate Full Report
                                </>
                            )}
                        </button>
                    </div>

                    {/* Font Sizes */}
                    <div className="control-group">
                        <label>
                            <BookOpen size={18} /> Content Font Size (10-18pt)
                        </label>
                        <input
                            type="number"
                            min="10"
                            max="18"
                            value={contentFontSize}
                            onChange={(e) => handleFontSizeChange('content', e.target.value)}
                            onBlur={(e) => {
                                if (!e.target.value || parseInt(e.target.value) < 10) {
                                    handleFontSizeChange('content', '14');
                                }
                            }}
                            className="control-input"
                        />
                    </div>

                    <div className="control-group">
                        <label>
                            <BookOpen size={18} /> Chapter Font Size (12-20pt)
                        </label>
                        <input
                            type="number"
                            min="12"
                            max="20"
                            value={chapterFontSize}
                            onChange={(e) => handleFontSizeChange('chapter', e.target.value)}
                            onBlur={(e) => {
                                if (!e.target.value || parseInt(e.target.value) < 12) {
                                    handleFontSizeChange('chapter', '16');
                                }
                            }}
                            className="control-input"
                        />
                    </div>
                </div>

                {/* Right Side - Content Editor */}
                <div className="edit-content-area">
                    <h2>Edit Report Content</h2>
                    <p className="edit-hint">Click on any text area below to edit the content directly.</p>

                    {/* Report Title */}
                    <div className="content-section">
                        <h3 className="section-title">Report Title</h3>
                        <div className="title-display">{reportData.title}</div>
                    </div>

                    {/* Abstract */}
                    <div className="content-section">
                        <h3 className="section-title">Abstract</h3>
                        <textarea
                            className="content-editor"
                            value={reportData.abstract}
                            onChange={(e) => setReportData({ ...reportData, abstract: e.target.value })}
                            rows={6}
                        />
                    </div>

                    {/* Chapters */}
                    {reportData.chapters?.map((chapter, idx) => (
                        <div key={idx} className="content-section chapter-section">
                            <h3 className="section-title">
                                Chapter {chapter.number}: {chapter.title}
                            </h3>

                            {/* Chapter Introduction */}
                            <textarea
                                className="content-editor"
                                value={editedChapters[chapter.number]?.content || chapter.content}
                                onChange={(e) => handleChapterContentChange(chapter.number, e.target.value)}
                                rows={4}
                                placeholder="Chapter introduction..."
                            />

                            {/* Subsections */}
                            {chapter.subsections?.map((subsection, subIdx) => (
                                <div key={subIdx} className="subsection">
                                    <h4 className="subsection-title">{chapter.number}.{subIdx + 1} {subsection.title}</h4>
                                    <textarea
                                        className="content-editor subsection-editor"
                                        value={editedChapters[chapter.number]?.subsections[subIdx]?.content || subsection.content}
                                        onChange={(e) => handleSubsectionContentChange(chapter.number, subIdx, e.target.value)}
                                        rows={6}
                                        placeholder="Subsection content..."
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default EditReport;
