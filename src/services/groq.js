
export const fetchGroqReportContent = async (topic, apiKey, pageCount = 20, referenceText = "", imageCount = 4, existingData = null) => {
    if (!apiKey) throw new Error("Groq API Key is missing");

    // Helper for delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- 1. Generate Outline ---
    console.log("Generating Outline with Groq...");

    const outlineSystemPrompt = `
    You are an expert academic report generator.
    Your goal is to generate a detailed JSON outline for a Final Year Project Report.
    The report must vary in length based on the user's page count request (${pageCount} pages).
    
    CRITICAL REQUIREMENTS:
    1. Title: Use EXACTLY what the user provides as the topic. Do NOT expand, modify, or add extra words.
       - If user says "ece", title should be "ece"
       - If user says "AI in Healthcare", title should be "AI in Healthcare"
       - Do NOT add phrases like "Final Year Project Report in..." or "A comprehensive analysis of..."
    2. Abstract: Must be 200-250 words. One well-structured paragraph covering problem, approach, and key findings.
    3. References: Must be REAL, properly formatted academic citations in IEEE style.
       Format: Author, A. B. (Year). Title. Journal/Conference, Volume(Issue), Pages.
       Example: "Zhang, K., Zhang, Z., Li, Z., & Qiao, Y. (2016). Joint Face Detection and Alignment Using Multi-task Cascaded Convolutional Networks. IEEE Signal Processing Letters, 23(10), 1499–1503."
    
    Output Format: JSON only. Structure:
    {
      "title": "EXACT user topic without modification",
      "abstract": "200-250 word abstract covering problem, methodology, and findings...",
      "chapters": [
        { "number": 1, "title": "INTRODUCTION", "subsections": [{"title": "Problem Statement"}] },
        ...
        { "number": 5, "title": "CONCLUSION", "subsections": [] }
      ],
      "references": ["Full IEEE citation 1", "Full IEEE citation 2", ...]
    }
  `;

    // Detect if user wants to fill gaps/expand content (not create new report)
    const gapFillingKeywords = [
        'add content', 'fill this section', 'complete this part', 'add explanation',
        'write the missing content', 'expand this topic', 'elaborate this section',
        'continue writing', 'add details', 'improve this section', 'write properly',
        'make it complete', 'add suitable content', 'add technical explanation',
        'expand this', 'elaborate this part', 'explain in detail', 'add more details',
        'make this longer', 'explain more clearly', 'give detailed explanation',
        'extend this content', 'add more information', 'write more about this',
        'explain step by step', 'make it detailed',
        'fill', 'complete', 'expand', 'elaborate', 'add', 'improve', 'missing',
        'extend', 'explain', 'detail', 'longer'
    ];
    const isGapFilling = gapFillingKeywords.some(keyword =>
        topic.toLowerCase().includes(keyword.toLowerCase())
    );

    const outlineUserPrompt = `
    ${referenceText ? `
    ⚠️ CRITICAL: The user has uploaded a REFERENCE DOCUMENT. Your PRIMARY task is to ANALYZE this document first.
    
    UPLOADED DOCUMENT CONTENT:
    ${referenceText.slice(0, 15000)}
    
    ${isGapFilling ? `
    🔴 GAP-FILLING MODE DETECTED 🔴
    The user's request contains keywords indicating they want to FILL GAPS or EXPAND existing content:
    User Request: "${topic}"
    
    YOUR TASK:
    1. ANALYZE the uploaded document thoroughly - identify structure, chapters, and existing content
    2. IDENTIFY what is missing, incomplete, or needs expansion based on user request
    3. CAREFULLY READ USER INSTRUCTIONS - if they say "add X after Y", you MUST add X after Y in the outline
    4. PRESERVE all existing chapters and structure EXACTLY
    5. ONLY mark sections for enhancement where content is weak or missing
    6. DO NOT change chapter titles or restructure unless explicitly requested
    
    CRITICAL - ACKNOWLEDGEMENT PLACEMENT:
    - If user mentions "acknowledgement" without specifying location → Place it BEFORE Abstract (not after)
    - If user says "add acknowledgement after [location]" → Follow their specific instruction
    - Default order: Title → Acknowledgement (if present) → Abstract → TOC → Chapters
    - Extract acknowledgement content from uploaded document if present
    
    CRITICAL: If user says to "add [something] after [location]" (like "add Acknowledgement after Abstract"):
    - Extract the new content from the uploaded document
    - Insert it in the EXACT location specified
    - Do NOT ignore the instruction
    
    When generating the outline:
    - Use the EXACT chapter structure from the uploaded document
    - Use the EXACT chapter titles from the uploaded document
    - Add new sections ONLY where user explicitly requests (e.g., "add Acknowledgement")
    - Only add new chapters if explicitly requested
    - Focus on filling subsections that are missing or incomplete
    
    🔴 CRITICAL FOR CHAPTER REMOVAL:
    If user asks to "remove chapter X":
    - Remove that chapter from the outline
    - REDISTRIBUTE the word count to remaining chapters to maintain the SAME TOTAL PAGE COUNT
    - Example: 22-page report with 7 chapters, remove 1 chapter → remaining 6 chapters should expand to still fill 22 pages
    - DO NOT reduce the total report length just because a chapter was removed
    ` : `
    INSTRUCTIONS:
    1. FIRST: Carefully analyze the uploaded document structure, existing chapters, and content
    2. SECOND: Read the user's topic/request to understand what they want
    3. THIRD: Based on the user's request, either:
       - Fill in missing sections/chapters if they ask to "add content" or "complete"
       - Expand existing content if they ask to "expand" or "elaborate"
       - Add new sections if they specify (e.g., "add Acknowledgement after Abstract")
       - Restructure if they ask for changes
       - Remove chapters if requested, BUT redistribute content to maintain original page count
    
    CRITICAL: If user provides content and says "add [content] after [location]":
    - Identify the content from the uploaded document
    - Insert it at the specified location in the outline
    - Do NOT ignore this instruction
    
    CRITICAL FOR CHAPTER REMOVAL:
    If user asks to "remove chapter X":
    - Remove that chapter from the outline
    - REDISTRIBUTE the word count to remaining chapters to maintain the SAME TOTAL PAGE COUNT
    - The total report length should NOT decrease when removing chapters
    `}
    
    DO NOT create a brand new report from scratch. Use the uploaded document as the foundation.
    ` : ''}
    
    Topic/Request: "${topic}"
    Pages: ${pageCount}
    ${existingData ? `EDITING MODE: Keep existing structure unless changes requested.\nExisting: ${JSON.stringify(existingData.chapters.map(c => ({ n: c.number, t: c.title })))}` : ''}
    
    ${referenceText ? 'Based on the uploaded document and the user request above, generate the outline.' : 'CRITICAL: If the user specifies a number of chapters in their topic (e.g., "9 chapters", "8 chapter"), you MUST generate that exact number of chapters.\nOtherwise, generate a standard 5-chapter outline.\n\nAnalyze the topic carefully for chapter count keywords like "X chapters", "X chapter", "with X chapters", etc.'}
    
    IMPORTANT: 
    - Abstract must be 200-250 words (substantial but concise)
    - References must be real academic sources with full IEEE citations
    - Include at least 8-10 references
    Do NOT use dotted leaders.
  `;

    let outline;
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", // Groq's best model
                messages: [
                    { role: "system", content: outlineSystemPrompt },
                    { role: "user", content: outlineUserPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.json();
            const errorMessage = err.error?.message || "Groq API Error";
            console.error('[Groq Error]', {
                status: response.status,
                statusText: response.statusText,
                error: err
            });
            throw new Error(`[Groq] ${errorMessage}`);
        }

        const data = await response.json();
        outline = JSON.parse(data.choices[0].message.content);
    } catch (e) {
        console.error("Groq Outline Error:", e);
        throw e;
    }

    // --- 2. Generate Chapters ---
    console.log("Generating Chapters with Groq...");
    const fullChapters = [];

    // Word count logic - fine-tuned to match actual page output
    const reservedPages = 3; // Abstract, TOC, References
    const contentPages = Math.max(1, pageCount - reservedPages);

    // Calibrated word counts based on extensive testing:
    // - 23 pages with 8 chapters → 34 pages (too high)
    // - 24 pages with 9 chapters → 18 pages (too low with 280)
    // - 25 pages with 9 chapters → 36 pages (too high with 300)
    // Finding: More chapters/subsections = more actual content
    // Solution: Reduce to ~200 words/page for accurate targeting
    let wordsPerPage = pageCount <= 15 ? 180 : (pageCount <= 30 ? 200 : 250);
    const totalWords = contentPages * wordsPerPage;
    const wordsPerChapter = Math.round(totalWords / (outline.chapters.length || 5));

    for (const chapter of outline.chapters) {
        const isConclusion = chapter.title.toUpperCase().includes("CONCLUSION");

        const chapterSystemPrompt = `
      You are writing a chapter for an academic report.
      Topic: "${topic}"
      Chapter: ${chapter.number} - ${chapter.title}
      Context: ${outline.abstract}
      Target Word Count: ${isConclusion ? 150 : wordsPerChapter} words.
      
      CRITICAL INSTRUCTIONS:
      1. You MUST write AT LEAST ${isConclusion ? 150 : wordsPerChapter} words.
      2. Be comprehensive and detailed. Include examples, explanations, and thorough coverage.
      3. DO NOT repeat the chapter heading (Chapter X: Title) in the content - the heading already exists.
      4. Start directly with the chapter body content.
      
      Output JSON only:
      {
        "content": "Full chapter text WITHOUT repeating the chapter heading...",
        "subsections": [ { "title": "Sub Title", "content": "Detailed sub content..." } ]
      }
    `;

        const chapterUserPrompt = `
      ${referenceText ? `
      ⚠️ CRITICAL: User uploaded a document. ANALYZE IT FIRST before writing this chapter.
      
      UPLOADED CONTENT (relevant to this chapter):
      ${referenceText.slice(0, 5000)}
      
      ${isGapFilling ? `
      🔴 GAP-FILLING MODE 🔴
      User Request: "${topic}"
      
      TASK: Based on the uploaded document, write content ONLY for missing/weak sections in Chapter ${chapter.number}: ${chapter.title}
      
      CRITICAL RULES:
      - If uploaded document has good content for a subsection, KEEP IT EXACTLY AS IS
      - Only add new content where there are gaps, placeholder text, or very brief content
      - Match the writing style, tone, and technical level of the uploaded document
      - Do NOT rewrite sections that are already complete
      - Focus on "filling in the blanks" rather than starting fresh
      ` : `
      TASK: Based on the uploaded document and user request "${topic}", write content for Chapter ${chapter.number}: ${chapter.title}
      
      - If the uploaded document already has content for this chapter, USE IT and BUILD UPON IT
      - Only add new content where there are gaps or missing sections
      - Match the writing style and tone of the uploaded document
      `}
      ` : `
      Write the content for Chapter ${chapter.number}: ${chapter.title}.
      `}
      
      CRITICAL: Do NOT start with "Chapter ${chapter.number}: ${chapter.title}" or any similar heading - this already exists in the document.
      Start DIRECTLY with the body content of this chapter.
      
      ${isConclusion ? 'Write a comprehensive conclusion with summary, findings, and future work. Maximum 150 words (HALF PAGE ONLY).' : `Include detailed sections for: ${JSON.stringify(chapter.subsections)}\n\nFor EACH subsection, write at least ${Math.round(wordsPerChapter / (chapter.subsections?.length || 3))} words.`}
      Professional academic tone. Be thorough and detailed. No markdown formatting (bold/italic is okay, no # headers).
      REMEMBER: Write AT LEAST ${isConclusion ? 150 : wordsPerChapter} words total for this chapter.
    `;

        let chapterData;
        let retries = 5; // Increased from 3 for better reliability
        while (retries > 0 && !chapterData) {
            try {
                const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: chapterSystemPrompt },
                            { role: "user", content: chapterUserPrompt }
                        ],
                        response_format: { type: "json_object" },
                        temperature: 0.7
                    })
                });

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(`API Error ${res.status}: ${errorData.error?.message || res.statusText}`);
                }
                const data = await res.json();
                chapterData = JSON.parse(data.choices[0].message.content);
            } catch (e) {
                console.error(`Error generating Chapter ${chapter.number} (${retries} retries left):`, e.message);
                retries--;
                if (retries > 0) {
                    await delay(2000); // Increased delay from 1000ms to 2000ms
                }
            }
        }

        fullChapters.push({
            ...chapter,
            content: chapterData ? chapterData.content : "Generation failed.",
            subsections: chapterData ? (chapterData.subsections || []) : []
        });
    }

    // --- 3. Image Logic (same as Gemini, basically just pass-through if we implemented it there) ---
    // The original gemini.js had "extractAndFetch" for pollingations.ai images.
    // We can replicate that if needed, or just return text for now. 
    // For consistency with existing code, let's keep it simple.

    return {
        ...outline,
        chapters: fullChapters,
        provider: "groq"
    };
};
