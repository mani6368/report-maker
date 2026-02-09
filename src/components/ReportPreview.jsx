import { FileDown } from 'lucide-react';
import { useState, useEffect } from 'react';

// Reusable Page Component
const Page = ({ children, pageNumber }) => (
    <div className="a4-page">
        <div style={{ flex: 1, paddingBottom: '1rem' }}>{children}</div>
        <div className="page-footer">
            {pageNumber}
        </div>
    </div>
);

const ReportPreview = ({ data, onDownload }) => {
    // We'll calculate pages on mount/change
    const [pages, setPages] = useState([]);

    useEffect(() => {
        if (!data) return;

        const generatedPages = [];
        let currentPageNum = 1;

        // Helper to add a page
        const addPage = (content) => {
            generatedPages.push({ content, pageNumber: currentPageNum });
            currentPageNum++;
        };

        // --- 1. Title Page ---
        addPage(
            <div style={{ textAlign: 'center', marginTop: '30%' }}>
                <h1 style={{ fontSize: '24pt', fontWeight: 'bold', color: 'white', marginBottom: '2rem' }}>
                    {data.title?.toUpperCase()}
                </h1>
                <p style={{ fontSize: '16pt', color: 'white' }}>A PROJECT REPORT</p>
            </div>
        );

        // --- 2. Table of Contents ---
        // (Simplified for preview - single page TOC assumption for now, can spill over if needed but keeping robust)
        const tocItems = [];
        let tocPageStart = currentPageNum;

        // Pre-calculate page numbers for chapters roughly. 
        // This is tricky because we haven't rendered chapters yet!
        // We will do a Two-Pass approach:
        // Pass 1: generate chapter content and count pages.
        // Pass 2: generate TOC based on counts.

        // Let's create the Chapter Pages first in a temp array
        const chapterPages = [];
        let tempPageNum = tocPageStart + 1; // +1 for TOC page itself assumption
        // Actually, let's just make abstract page 3 usually.

        const abstractStartPage = tempPageNum; // TOC is page 2

        // --- 3. Abstract ---
        // Abstract is usually 1 page
        const abstractChunks = splitContentIntoChunks(data.abstract || "", 350); // ~350 words per page
        const abstractPageCount = Math.max(1, abstractChunks.length);

        let currentChapterPage = abstractStartPage + abstractPageCount;

        data.chapters?.forEach(c => {
            tocItems.push({
                number: c.number,
                title: c.title.toUpperCase(),
                page: currentChapterPage
            });

            // Calculate how many pages this chapter takes
            // Title + Intro Text
            const introChunks = splitContentIntoChunks(c.content || "", 350); // first page has title so less text
            // Allow title to take up space, so first chunk only ~250 words
            const firstPageWords = 250;

            // Re-chunking logic for Chapter:
            let remainingText = c.content || "";
            let chapPages = 0;

            // First page of chapter (Heading + some text)
            // If just heading, still 1 page.
            chapPages++;
            let wordCount = getWordCount(remainingText);

            // Subsections
            let subContentTotal = "";
            c.subsections?.forEach(s => {
                subContentTotal += `\n\n${s.title}\n${s.content}`;
            });

            // Total Chapter Word Count approx
            const totalChapWords = getWordCount(c.content || "") + getWordCount(subContentTotal);

            // Estimate pages: First page (250 words) + Rest (350 words/page)
            if (totalChapWords > 250) {
                chapPages += Math.ceil((totalChapWords - 250) / 350);
            }

            currentChapterPage += chapPages;
        });

        // Add Reference Item
        tocItems.push({ number: '', title: 'REFERENCES', page: currentChapterPage });


        // --- REAL RENDERING PASS ---

        // 2. TOC Page Render
        addPage(
            <>
                <h2 className="chapter-title">TABLE OF CONTENT</h2>
                <div className="toc-container">
                    <div className="toc-header">
                        <div>CHAPTER NO</div>
                        <div>TITLE</div>
                        <div>PAGE NO</div>
                    </div>
                    {/* Abstract Link */}
                    <div className="toc-row">
                        <div className="toc-col-center"></div>
                        <div className="toc-col-left">ABSTRACT</div>
                        <div className="toc-col-center">{abstractStartPage}</div>
                    </div>
                    {tocItems.map((item, idx) => (
                        item.title !== 'REFERENCES' && (
                            <div key={idx}>
                                <div className="toc-row">
                                    <div className="toc-col-center">{item.number}</div>
                                    <div className="toc-col-left">{item.title}</div>
                                    <div className="toc-col-center">{item.page}</div>
                                </div>
                            </div>
                        )
                    ))}
                    <div className="toc-row">
                        <div className="toc-col-center"></div>
                        <div className="toc-col-left">REFERENCES</div>
                        <div className="toc-col-center">{currentChapterPage}</div>
                    </div>
                </div>
            </>
        );

        // 3. Abstract Render
        abstractChunks.forEach((chunk, i) => {
            addPage(
                <>
                    {i === 0 && <h2 className="chapter-title">ABSTRACT</h2>}
                    <p className="report-text" style={{ whiteSpace: 'pre-wrap' }}>{chunk}</p>
                </>
            );
        });


        // 4. Chapters Render
        data.chapters?.forEach(c => {
            // Flatten content for pagination
            // structure: [ {type: 'main-title', text: ...}, {type: 'text', text: ...}, {type: 'sub-title', text: ...}, {type: 'text', text: ...} ]
            const elements = [];

            // Title
            elements.push({ type: 'main-title', text: `CHAPTER ${c.number}: ${c.title?.toUpperCase()}` });

            // Intro Content
            if (c.content) {
                const paras = c.content.split('\n').filter(p => p.trim());
                paras.forEach(p => elements.push({ type: 'text', text: p }));
            }

            // Subsections
            c.subsections?.forEach((sub, sIdx) => {
                // Formatting Title cleanly
                const cleanTitle = sub.title.replace(/^(\d+(\.\d+)*\s+)/, "").trim();
                elements.push({ type: 'sub-title', text: `${c.number}.${sIdx + 1} ${cleanTitle}: ` });

                const paras = sub.content.split('\n').filter(p => p.trim());
                paras.forEach(p => elements.push({ type: 'text', text: p }));
            });

            // NOW PAGINATE ELEMENTS
            let currentPageContent = [];
            let currentWords = 0;
            const WORDS_PER_PAGE = 320; // Tuned for 14pt font

            elements.forEach((el, index) => {
                // If it's a title, it takes up "visual space" equivalent to ~50 words
                const elCost = el.type.includes('title') ? 60 : getWordCount(el.text);

                // Check if adding this fits
                if (currentWords + elCost > WORDS_PER_PAGE && currentPageContent.length > 0) {
                    // Push page
                    addPage(renderElements(currentPageContent));
                    currentPageContent = [];
                    currentWords = 0;
                }

                // If the element itself is huge (longer than a page), we need to split it (for huge paragraphs)
                // For simplicity, assuming nice paragraphs for now from Gemini. 
                // If paragraph is huge > 400 words, split it.
                if (el.type === 'text' && elCost > WORDS_PER_PAGE) {
                    // Force split long paragraph
                    const parts = splitContentIntoChunks(el.text, WORDS_PER_PAGE);
                    parts.forEach((part, pIdx) => {
                        if (currentWords + getWordCount(part) > WORDS_PER_PAGE && currentPageContent.length > 0) {
                            addPage(renderElements(currentPageContent));
                            currentPageContent = [];
                            currentWords = 0;
                        }
                        currentPageContent.push({ ...el, text: part });
                        currentWords += getWordCount(part);
                    })
                } else {
                    currentPageContent.push(el);
                    currentWords += elCost;
                }
            });

            // Flush last page of chapter
            if (currentPageContent.length > 0) {
                addPage(renderElements(currentPageContent));
            }
        });

        // 5. References
        const refChunks = [];
        let currentRefChunk = [];
        let currentRefWords = 0;

        data.references?.forEach(ref => {
            const w = getWordCount(ref);
            if (currentRefWords + w > 300) {
                refChunks.push(currentRefChunk);
                currentRefChunk = [];
                currentRefWords = 0;
            }
            currentRefChunk.push(ref);
            currentRefWords += w;
        });
        if (currentRefChunk.length > 0) refChunks.push(currentRefChunk);

        refChunks.forEach((chunk, i) => {
            addPage(
                <>
                    {i === 0 && <h2 className="chapter-title">REFERENCES</h2>}
                    <ul style={{ paddingLeft: '1.5rem', color: 'white' }}>
                        {chunk.map((ref, rIdx) => (
                            <li key={rIdx} style={{ marginBottom: '1rem', textAlign: 'justify' }}>
                                {ref}
                            </li>
                        ))}
                    </ul>
                </>
            );
        });


        setPages(generatedPages);

    }, [data]);

    if (!data) return null;

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>
            {/* Toolbar */}
            <div className="glass-panel" style={{
                maxWidth: '210mm', margin: '0 auto 1rem', padding: '1rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Print Layout Preview</h3>
                <button onClick={onDownload} className="btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: '#e25a83' }}>
                    <FileDown size={18} /> Download Word Doc
                </button>
            </div>

            {/* Disclaimer */}
            <div style={{ maxWidth: '210mm', margin: '0 auto 2rem', color: '#94a3b8', textAlign: 'center', fontSize: '0.9rem', fontStyle: 'italic', background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '8px' }}>
                "In this preview, the alignment may appear incorrect; however, the alignment will be correct in the Word document. Kindly review the topics below."
            </div>

            {/* Render Pages */}
            {pages.map((page, idx) => (
                <Page key={idx} pageNumber={page.pageNumber}>
                    {page.content}
                </Page>
            ))}
        </div>
    );
};

// Utils
function getWordCount(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).length;
}

function splitContentIntoChunks(text, wordsPerChunk) {
    const words = text.trim().split(/\s+/);
    const chunks = [];
    let currentChunk = [];

    for (let i = 0; i < words.length; i++) {
        currentChunk.push(words[i]);
        if (currentChunk.length >= wordsPerChunk) {
            chunks.push(currentChunk.join(" "));
            currentChunk = [];
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(" "));
    }
    return chunks;
}

function renderElements(elements) {
    return elements.map((el, idx) => {
        if (el.type === 'main-title') {
            const parts = el.text.split(':');
            return (
                <div key={idx}>
                    <h2 className="chapter-title" style={{ marginBottom: '0.5rem' }}>{parts[0]}</h2>
                    <h2 className="chapter-title" style={{ marginTop: '0' }}>{parts[1]}</h2>
                </div>
            );
        }
        if (el.type === 'sub-title') {
            return <h3 key={idx} className="section-title">{el.text}</h3>
        }
        return <p key={idx} className="report-text">{el.text}</p>
    });
}

export default ReportPreview;
