import { GoogleGenerativeAI } from "@google/generative-ai";

export const fetchReportContent = async (topic, apiKey, pageCount = 20, referenceText = "", imageCount = 4, existingData = null) => {
  if (!apiKey) throw new Error("API Key is missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  // User Requested long content, use Pro model if possible or Flash with high token output
  // Sticking to 2.5-flash as it is fast and has large context window.
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    // model: "gemini-1.5-pro", // better for reasoning if flash is too simple
    generationConfig: { responseMimeType: "application/json" }
  });

  // Helper for delay
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Step 1: Generate Detailed Outline
  console.log("Generating Outline...");
  const outlinePrompt = `
    You are an expert academic report generator.
    The user has provided the following INPUT for a Final Year Project Report:
    "${topic}"

    ${existingData ? `
    **CRITICAL: EDITING MODE**
    The user is editing an EXISTING REPORT. You must preserve the existing structure unless the editing instructions specifically ask to change it.
    
    EXISTING STRUCTURE (Use this as your baseline):
    ${JSON.stringify({
    title: existingData.title,
    abstract: existingData.abstract,
    chapters: existingData.chapters.map(c => ({
      number: c.number,
      title: c.title,
      subsections: c.subsections ? c.subsections.map(s => ({ title: s.title })) : []
    }))
  }, null, 2)}
    
    INSTRUCTIONS FOR EDITING:
    1. Analyze the INPUT/EDITING INSTRUCTIONS carefully.
    2. If the instructions ask to "add" a chapter, insert it logically.
    3. If the instructions ask to "remove" a chapter, remove it.
    4. If the instructions ask to change a specific section, modify only that part.
    5. **FOR ALL UNMENTIONED PARTS, KEEP THE EXISTING STRUCTURE EXACTLY THE SAME.** do not rename chapters or subsections simply for variety.
    ` : ''}

    ${referenceText ? `
    ⚠️ CRITICAL: The user has uploaded a REFERENCE DOCUMENT. Your PRIMARY task is to ANALYZE this document first.
    
    UPLOADED DOCUMENT CONTENT:
    """
    ${referenceText.slice(0, 50000)} 
    ...(content truncated if too long)
    """
    
    ${(() => {
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

        if (isGapFilling) {
          return `
    🔴 GAP-FILLING MODE DETECTED 🔴
    The user's request contains keywords indicating they want to FILL GAPS or EXPAND existing content:
    User Request: "${topic}"
    
    YOUR TASK:
    1. ANALYZE the uploaded document thoroughly - identify structure, chapters, and existing content
    2. IDENTIFY what is missing, incomplete, or needs expansion based on user request
    3. CAREFULLY READ USER INSTRUCTIONS - if they say "add X before/after Y", you MUST do it
    4. PRESERVE all existing chapters and structure EXACTLY
    5. ONLY mark sections for enhancement where content is weak, missing, or has placeholders
    6. DO NOT change chapter titles or restructure unless explicitly requested in the user input
    
    CRITICAL - ACKNOWLEDGEMENT PLACEMENT:
    - If user mentions "acknowledgement" without specifying location → Place it BEFORE Abstract (not after)
    - If user says "add acknowledgement before abstract" → Place it BEFORE Abstract
    - If user says "add acknowledgement after [location]" → Follow their specific instruction
    - Default order: Title → Acknowledgement (if present) → Abstract → TOC → Chapters
    - Extract acknowledgement content from uploaded document if present
    
    When generating the outline:
    - Use the EXACT chapter structure from the uploaded document
    - Use the EXACT chapter titles from the uploaded document  
    - Add new sections ONLY where user explicitly requests (e.g., "add Acknowledgement after Abstract")
    - Only add new chapters if the user explicitly requests it
    - Focus on identifying subsections that need content added
    
    🔴 CRITICAL FOR CHAPTER REMOVAL:
    If user asks to "remove chapter X":
    - Remove that chapter from the outline
    - REDISTRIBUTE the word count to remaining chapters to maintain the SAME TOTAL PAGE COUNT
    - Example: 22-page report with 7 chapters, remove 1 chapter → remaining 6 chapters should expand to still fill 22 pages
    - DO NOT reduce the total report length just because a chapter was removed
            `;
        } else {
          return `
    INSTRUCTIONS:
    1. FIRST: Carefully analyze the uploaded document structure, existing chapters, and content
    2. SECOND: Read the user's INPUT/request to understand what they want
    3. THIRD: Based on the user's request, either:
       - Fill in missing sections/chapters if they ask to "add content" or "complete"
       - Expand existing content if they ask to "expand" or "elaborate"
       - Add new sections if they specify (e.g., "add Acknowledgement before Abstract")
       - Restructure if they ask for changes
       - Remove chapters if requested, BUT redistribute content to maintain original page count
    
    CRITICAL - ACKNOWLEDGEMENT PLACEMENT:
    - If user mentions "acknowledgement" without specifying location → Place it BEFORE Abstract (not after)
    - If user says "add acknowledgement before abstract" → Place it BEFORE Abstract
    - If user says "add acknowledgement after [location]" → Follow their specific instruction  
    - Default order: Title → Acknowledgement (if present) → Abstract → TOC → Chapters
    - Extract acknowledgement content from uploaded document if present
    
    CRITICAL: If user provides content and says "add [content] after [location]":
    - Identify the content from the uploaded document
    - Insert it at the specified location in the outline
    - Do NOT ignore this instruction
    
    CRITICAL FOR CHAPTER REMOVAL:
    If user asks to "remove chapter X":
    - Remove that chapter from the outline
    - REDISTRIBUTE the word count to remaining chapters to maintain the SAME TOTAL PAGE COUNT
    - The total report length should NOT decrease when removing chapters
            `;
        }
      })()}
    
    DO NOT create a brand new report from scratch. Use the uploaded document as the foundation.
    ` : ''}

    INPUT INTERPRETATION INSTRUCTIONS:
    1. **If the INPUT is a simple title** (e.g., "Electric Vehicles"), use it as the Project Title and generate a standard academic structure with EXACTLY 5 CHAPTERS.
    2. **If the INPUT specifies chapters/subheadings** (e.g., "Make a report with 7 chapters: Intro, History..."), extract the Project Title and use the exact structure requested by the user.
    
    CRITICAL: Do not use Word's 'Table of Contents' field or dotted leaders in any output.
    Generate the following content as a Standard 3-Column Markdown Table if asked for structure.
    Column 1: CHAPTER NO
    Column 2: TITLE
    Column 3: PAGE NO
    
    CHAPTER STRUCTURE RULES:
    - **DEFAULT**: Generate exactly 5 chapters (unless user specifies otherwise)
    - **SUBSECTIONS**: Maximum 5 subsections per chapter (unless user requests more)
    - **CONCLUSION**: The final chapter should be titled "CONCLUSION" with NO subsections (it will be a single paragraph)
    
    The report must be VERY LONG (aiming for ${pageCount}+ pages total).
    
    Return JSON structure:
    {
      "title": "Extracted Project Title",
      "abstract": "Detailed abstract (approx 150-200 words, fit on half page)...",
      "chapters": [
        { "number": 1, "title": "INTRODUCTION", "subsections": [{"title": "Problem Statement"}, {"title": "Scope"}] },
        { "number": 2, "title": "CHAPTER TITLE", "subsections": [ ... max 5 subsections ... ] },
        { "number": 5, "title": "CONCLUSION", "subsections": [] }
      ],
      "references": [
        "Author, A.A., & Author, B.B. (Year). Title of article.",
        "Make sure to generate at least 8-10 academic references.",
        ${referenceText ? '"Include references found in the uploaded text if relevant."' : ''}
      ] 
    }
  `;

  let outline;
  let outlineRetries = 3;
  let outlineSuccess = false;

  while (outlineRetries > 0 && !outlineSuccess) {
    try {
      const result = await model.generateContent(outlinePrompt);
      outline = JSON.parse(result.response.text());
      outlineSuccess = true;
    } catch (e) {
      console.error("Outline generation error:", e);
      if (e.message.includes('429') || e.message.includes('Quota')) {
        console.log("Rate limit exceeded. Waiting 10 seconds...");
        await delay(10000); // 10s wait for 429
      } else {
        await delay(2000);
      }
      outlineRetries--;
      if (outlineRetries === 0) throw new Error(`Failed to generate outline after retries: ${e.message}`);
    }
  }

  // Step 2: Generate Content for each Chapter Sequentially
  console.log("Generating Chapters...");

  // --- LOGIC TO MATCH PAGE COUNT ---
  // Users wants "X pages" NOT including Title Page.
  // We have Static Pages that take space: TOC (1), Abstract (1), References (1) = 3 pages.
  // So Chapter Content should fill (UserRequest - 3) pages.
  // 14pt fonts with spacing = ~300 words/page.

  const reservedPages = 3; // TOC, Abstract, References
  const contentPages = Math.max(1, pageCount - reservedPages);

  // Calculate total words needed for the content chapters
  // UPDATED CALCULATION: 
  // - For smaller reports (< 15 pages): 250 words/page (more concise)
  // - For larger reports (15+ pages): 300-350 words/page (more detailed content needed)
  // This ensures larger page requests actually generate proportionally more content
  let wordsPerPage;
  if (pageCount <= 15) {
    wordsPerPage = 250; // Works well for shorter reports
  } else if (pageCount <= 30) {
    wordsPerPage = 320; // Medium reports need more detailed content
  } else {
    wordsPerPage = 380; // Large reports (30+) need very detailed content
  }

  const totalWords = contentPages * wordsPerPage;

  const wordsPerChapter = Math.round(totalWords / (outline.chapters.length || 5));

  // FORCE TITLE REMOVED - We usually rely on AI title now, BUT 
  // users complained about AI changing simple titles.
  // If user input is clearly short (< 50 chars), prefer User Input.
  // If user input is long (instructions), trust AI extracted title.
  if (topic.length < 50) {
    outline.title = topic;
  }
  // Else use outline.title from AI extraction.

  const fullChapters = [];
  let imagesPlaced = 0;

  for (const chapter of outline.chapters) {
    const isConclusion = chapter.title.toUpperCase().includes("CONCLUSION");
    const isIntro = chapter.title.toUpperCase().includes("INTRODUCTION");

    // Logic for Images: user requested imageCount total.
    // We will distribute them: 1 per chapter for the first N chapters that are NOT Conclusion.
    let requestImage = false;
    if (!isConclusion && imagesPlaced < imageCount) {
      requestImage = true;
      imagesPlaced++;
    }

    // Length Logic
    let currentTargetWords = wordsPerChapter;
    if (isConclusion) {
      currentTargetWords = 150; // Half page maximum for Conclusion (universal standard)
    }

    // Check if we have existing content for this chapter (if editing)
    let existingChapterContent = "";
    if (existingData && existingData.chapters) {
      const existingChapter = existingData.chapters.find(c => c.number === chapter.number || c.title === chapter.title);
      if (existingChapter) {
        existingChapterContent = existingChapter.content;
      }
    }

    // Detect gap-filling keywords inline
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

    const chapterPrompt = `
      ${referenceText ? `
      ⚠️ CRITICAL: User uploaded a document. ANALYZE IT FIRST before writing this chapter.
      
      UPLOADED CONTENT (relevant to this chapter):
      ${referenceText.slice(0, 8000)}
      
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
      Write DETAILED, VERBOSE, ACADEMIC content for Chapter ${chapter.number}: "${chapter.title}" for the project "${topic}".
      `}
      Context: ${outline.abstract}
      ${referenceText ? `\nREFERENCE CONTEXT (Use relevant info): """${referenceText.slice(0, 5000)}..."""\n` : ''}
      ${existingChapterContent ? `\nPREVIOUS CONTENT (For Context - Improve/Edit this as requested): """${existingChapterContent.slice(0, 3000)}..."""\n` : ''}
      
      ${isConclusion ? 'CONCLUSION CHAPTER - Write as a SINGLE COMPREHENSIVE PARAGRAPH (no subsections). Maximum 150 words (HALF PAGE ONLY). Summarize key findings and implications.' : `Subsections to cover: ${JSON.stringify(chapter.subsections)}`}
      
      REQUIREMENTS:
      1.  **LENGTH**: The content of this chapter MUST be approximately ${currentTargetWords} words. ${isConclusion ? "Keep it concise (one paragraph, HALF PAGE MAXIMUM - 150 words)." : "DO NOT EXCEED significantly."}
      2.  **FORMAT**: Use full paragraphs. NO bullet points. NO asterisks. ${isConclusion ? 'CONCLUSION must be ONE continuous paragraph.' : ''}
      3.  **SUBSECTIONS**: ${isConclusion ? 'NO SUBSECTIONS for conclusion.' : 'Ensure you generate content for every subsection listed.'}
      4.  **TITLES**: Do NOT include numbering in the "title" field of the subsection (e.g., just "Overview", NOT "1.1 Overview").
      ${requestImage ? `5.  **IMAGES**: Include EXACTLY 1 IMAGE in this chapter. Use this format: "[IMAGE: detailed keyword for image search]" (e.g., "[IMAGE: Electric Vehicle Battery Diagram]"). Place it near the relevant text.` : `5.  **IMAGES**: DO NOT include any images or placeholders in this chapter.`}
      6.  **TONE**: Professional, technical, engineering-style academic writing.
      
      Return JSON:
      {
        "content": ${isConclusion ? '"Single comprehensive concluding paragraph..."' : '"Introductory text for the chapter..."'},
        "subsections": ${isConclusion ? '[]' : '[ { "title": "Subsection Title", "content": "Content..." } ]'}
      }
    `;

    // RETRY LOGIC for robustness
    let retries = 3;
    let success = false;
    let chapterData = null;

    while (retries > 0 && !success) {
      try {
        await delay(2000 + (3 - retries) * 1000); // Backoff delay: 2s, 3s, 4s
        const result = await model.generateContent(chapterPrompt);
        chapterData = JSON.parse(result.response.text());
        success = true;
      } catch (error) {
        console.error(`Error generating chapter ${chapter.number}, retries left: ${retries - 1}`, error);
        retries--;
      }
    }

    if (success && chapterData) {
      fullChapters.push({
        ...chapter,
        content: chapterData.content || "",
        subsections: chapterData.subsections || []
      });
    } else {
      // Fallback if completely fails
      fullChapters.push({
        ...chapter,
        content: "Content generation failed after multiple attempts. Please try regenerating the report.",
        subsections: []
      });
    }
  }

  // Step 3: PRE-FETCH IMAGES (Performance Optimization)
  console.log("Pre-fetching images...");
  const imageMap = {};
  const imagePromises = [];

  const extractAndFetch = (text) => {
    if (!text) return;
    const matches = text.match(/\[IMAGE:(.*?)\]/g);
    if (matches) {
      matches.forEach(tag => {
        const query = tag.replace('[IMAGE:', '').replace(']', '').trim();
        if (!imageMap[tag]) {
          // Initiate fetch
          const promise = (async () => {
            try {
              const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}?width=600&height=400&nologo=true`;
              const response = await fetch(url);
              if (response.ok) {
                const buffer = await response.arrayBuffer();
                imageMap[tag] = buffer;
              }
            } catch (e) {
              console.warn(`Failed to pre-fetch image: ${query}`, e);
            }
          })();
          imagePromises.push(promise);
        }
      });
    }
  };

  fullChapters.forEach(ch => {
    extractAndFetch(ch.content);
    ch.subsections?.forEach(sub => extractAndFetch(sub.content));
  });

  if (imagePromises.length > 0) {
    await Promise.allSettled(imagePromises);
  }

  return {
    ...outline,
    chapters: fullChapters,
    images: imageMap
  };
};
