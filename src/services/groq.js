
export const fetchGroqReportContent = async (topic, apiKey, pageCount = 20, referenceText = "", imageCount = 4, existingData = null) => {
    if (!apiKey) throw new Error("Groq API Key is missing");

    // Helper for delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Groq API helper — mirrors model.generateContent() from Gemini
    const groqGenerate = async (systemPrompt, userPrompt) => {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            const msg = err.error?.message || response.statusText || "Groq API Error";
            throw new Error(`[Groq] ${response.status}: ${msg}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    };

    // ─────────────────────────────────────────────────────────────────
    // STEP 1: Generate Detailed Outline  (identical logic to gemini.js)
    // ─────────────────────────────────────────────────────────────────
    console.log("Generating Outline with Groq...");

    const outlineSystemPrompt = `
You are an expert academic report generator integrated into a report generation website.

Your FIRST job before doing ANYTHING is to ANALYZE the user's input and classify what type of input it is.

═══════════════════════════════════════════
STEP 1 — ANALYZE THE INPUT TYPE
═══════════════════════════════════════════

Read the user's input carefully and identify which type it is:

TYPE A — SIMPLE TITLE
  • Input is short (e.g., "ERP System", "AI in Healthcare", "Smart Parking")
  • No chapter names, no numbered sections
  • Action: Generate a standard 5-chapter academic report structure

TYPE B — INSTRUCTION WITH CHAPTERS
  • Input says things like "make a report with chapters: Introduction, History, Analysis..."
  • Action: Use EXACTLY the chapters the user listed, nothing more, nothing less

TYPE C — FULL TABLE OF CONTENTS
  • Input contains numbered sections like "1.1", "2.3", "3.6.1", "Chapter 1:", etc.
  • This is the MOST IMPORTANT type — user is giving you a BLUEPRINT
  • Action: Follow the EXACT blueprint — every chapter, every subsection, every sub-subsection
  • FORBIDDEN: Do not invent new sections. Do not skip sections. Do not rename sections.

TYPE D — EDITING INSTRUCTION
  • Input says things like "add", "remove", "change", "expand", "fix chapter 3"
  • Action: Modify only what is asked. Keep everything else IDENTICAL.

═══════════════════════════════════════════
STEP 2 — EXECUTION RULES (apply to ALL types)
═══════════════════════════════════════════

RULE 1 — NEVER IGNORE THE USER'S STRUCTURE
If the user gives you a structure, that is LAW.
You are not allowed to simplify it, summarize it, or replace it with your own version.
Treat it like a contract — deliver exactly what was specified.

RULE 2 — NESTED SECTIONS MUST STAY NESTED
If the user's input has sub-subsections like:
  3.6 Feasibility Study
    3.6.1 Technical Feasibility
    3.6.2 Economic Feasibility
    3.6.3 Operational Feasibility

Then in your JSON output:
  - 3.6 must be a subsection with a "subSubsections" array
  - 3.6.1, 3.6.2, 3.6.3 must be INSIDE that "subSubsections" array
  - They must NEVER be flattened into the top-level subsections array

RULE 3 — TITLES MUST MATCH EXACTLY
Copy the user's section titles exactly as written.
Do NOT paraphrase, shorten, or rename them.
Example: If user wrote "Limitations of the Current System" — output must say "Limitations of the Current System", not "Current System Limitations" or "Existing Limitations".

RULE 4 — COUNT MUST MATCH EXACTLY
If the user gives 8 chapters — output must have exactly 8 chapters.
If the user gives 6 subsections in chapter 3 — output must have exactly 6 subsections in chapter 3.
Never add extra sections. Never drop sections.

RULE 5 — CONTENT MUST BE DETAILED
Every "content" field must be a minimum of 3 full paragraphs.
No bullet points. No asterisks. No markdown formatting inside content.
Write in formal, third-person, engineering academic style.
Exception: Conclusion chapter = single paragraph, maximum 150 words.

RULE 6 — JSON MUST BE VALID AND COMPLETE
Output raw JSON only — no explanation text, no markdown code blocks, no preamble.
Every chapter must have: number, title, content, subsections array.
Every subsection that has children must have a subSubsections array.
Do not leave any field empty or null.

═══════════════════════════════════════════
STEP 3 — JSON OUTPUT SCHEMA
═══════════════════════════════════════════

Always return this exact structure:

{
  "title": "Project Title exactly as user specified or reasonably inferred",
  "abstract": "200-250 words covering problem, approach, methodology, and key findings",
  "chapters": [
    {
      "number": 1,
      "title": "CHAPTER TITLE IN UPPERCASE",
      "subsections": [
        {
          "title": "Subsection Title",
          "content": "placeholder"
        },
        {
          "title": "Subsection With Children",
          "content": "placeholder",
          "subSubsections": [
            {
              "title": "Child Section Title"
            }
          ]
        }
      ]
    }
  ],
  "references": [
    "IEEE format reference 1",
    "IEEE format reference 2",
    "Minimum 8-10 real academic references"
  ]
}

═══════════════════════════════════════════
STEP 4 — SELF-CHECK BEFORE OUTPUTTING
═══════════════════════════════════════════

Before returning your JSON, ask yourself:

✓ Did I use the EXACT chapter titles the user gave?
✓ Did I include EVERY subsection the user listed?
✓ Did I keep sub-subsections (x.x.x) NESTED inside their parent — not flattened?
✓ Did I match the exact chapter COUNT the user specified?
✓ Is every "content" field detailed with full paragraphs (not bullet points)?
✓ Is my output pure valid JSON with no extra text outside it?

If the answer to ANY of these is NO — fix it before outputting.

═══════════════════════════════════════════
CRITICAL REMINDER
═══════════════════════════════════════════

The user's input is a BLUEPRINT — your job is to BUILD it, not redesign it.
If the user gives you a detailed structure, that means they know what they want.
Your creativity is only needed for the CONTENT inside the structure, not the structure itself.

The report must target ${pageCount}+ pages total.
Abstract must be 200-250 words. References must be real IEEE-style academic citations (minimum 8-10).
  `;

    const outlineUserPrompt = `
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
    ${referenceText.slice(0, 15000)} 
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
    3. **If the INPUT is a FULL TABLE OF CONTENTS** (contains lines like "Chapter X:" or "X.X SubsectionTitle"), you MUST:
       - Extract the title from context (or infer a reasonable title)
       - Use EVERY chapter listed EXACTLY as given — do NOT add or remove chapters
       - Use EVERY subsection listed EXACTLY as given — do NOT truncate, skip, or limit subsections
       - Preserve sub-subsections (e.g., 3.6.1, 4.5.2) — include them nested inside the parent subsection
       - Do NOT apply any chapter or subsection count limits
    
    CRITICAL: Do not use Word's 'Table of Contents' field or dotted leaders in any output.
    Generate the following content as a Standard 3-Column Markdown Table if asked for structure.
    Column 1: CHAPTER NO
    Column 2: TITLE
    Column 3: PAGE NO
    
    CHAPTER STRUCTURE RULES:
    - **DEFAULT**: Generate exactly 5 chapters (unless user specifies otherwise)
    - **SUBSECTIONS**: Use ALL subsections the user specifies. Only apply a "maximum 5" limit if the user did NOT provide a structure.
    - **CONCLUSION**: The final chapter should be titled "CONCLUSION" with NO subsections ONLY if the user did not specify subsections for it.
    
    🔴 CRITICAL — FULL TOC MODE:
    If the user's input contains numbered subsections (like "1.1", "2.3", "4.5.1"), treat this as an EXACT BLUEPRINT.
    You MUST include ALL of them in the outline. Skipping or limiting subsections is FORBIDDEN.
    
    The report must be VERY LONG (aiming for ${pageCount}+ pages total).
    
    Return JSON structure:
    {
      "title": "Extracted Project Title",
      "abstract": "Detailed abstract (approx 150-200 words)...",
      "chapters": [
        { "number": 1, "title": "INTRODUCTION", "subsections": [{"title": "Problem Statement"}, {"title": "Scope"}] },
        { "number": 2, "title": "CHAPTER TITLE", "subsections": [ ... ALL user-specified subsections ... ] },
        { "number": 5, "title": "CONCLUSION", "subsections": [] }
      ],
      "references": [
        "Author, A.A., & Author, B.B. (Year). Title of article.",
        "Make sure to generate at least 8-10 academic references."
        ${referenceText ? ', "Include references found in the uploaded text if relevant."' : ''}
      ] 
    }
  `;

    let outline;
    let outlineRetries = 3;
    let outlineSuccess = false;

    while (outlineRetries > 0 && !outlineSuccess) {
        try {
            const text = await groqGenerate(outlineSystemPrompt, outlineUserPrompt);
            outline = JSON.parse(text);
            outlineSuccess = true;
        } catch (e) {
            console.error("Groq Outline generation error:", e);
            if (e.message.includes('429') || e.message.includes('Quota') || e.message.includes('rate_limit')) {
                console.log("Rate limit exceeded. Waiting 10 seconds...");
                await delay(10000);
            } else {
                await delay(2000);
            }
            outlineRetries--;
            if (outlineRetries === 0) throw new Error(`Failed to generate outline after retries: ${e.message}`);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 2: Generate Content for each Chapter Sequentially
    // ─────────────────────────────────────────────────────────────────
    console.log("Generating Chapters with Groq...");

    // --- LOGIC TO MATCH PAGE COUNT ---
    // Users wants "X pages" NOT including Title Page.
    // Static Pages: TOC (1), Abstract (1), References (1) = 3 pages.
    // Chapter Content should fill (UserRequest - 3) pages.
    //
    // Groq needs ~2.6× more words than Gemini because Llama generates
    // more concise output and Word formatting creates the same overhead.
    //
    // Calibrated values (Groq-specific):
    const reservedPages = 3; // TOC, Abstract, References
    const contentPages = Math.max(1, pageCount - reservedPages);

    let wordsPerPage;
    if (pageCount <= 15) {
        wordsPerPage = 900;   // Gemini: 350 × 2.6 ≈ 900
    } else if (pageCount <= 30) {
        wordsPerPage = 1170;  // Gemini: 450 × 2.6 = 1170
    } else if (pageCount <= 60) {
        wordsPerPage = 1450;  // Gemini: 550 × 2.6 ≈ 1450
    } else {
        wordsPerPage = 1600;  // Gemini: 600 × 2.6 ≈ 1600
    }

    const totalWords = contentPages * wordsPerPage;
    const wordsPerChapter = Math.round(totalWords / (outline.chapters.length || 5));

    // If user input is clearly short (< 50 chars), prefer User Input as title.
    // If user input is long (instructions/TOC), trust AI extracted title.
    if (topic.length < 50) {
        outline.title = topic;
    }

    const fullChapters = [];
    let imagesPlaced = 0;

    // Gap-filling keyword detection (same list as gemini.js)
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

    for (const chapter of outline.chapters) {
        const isConclusion = chapter.title.toUpperCase().includes("CONCLUSION");

        // Logic for Images: distribute 1 per chapter for the first N non-Conclusion chapters
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

        const chapterSystemPrompt = `
      You are writing a chapter for an academic Final Year Project Report.
      Topic: "${topic}"
      Chapter: ${chapter.number} - ${chapter.title}
      Context: ${outline.abstract}
      Target Word Count: ${currentTargetWords} words.
      
      CRITICAL INSTRUCTIONS:
      1. You MUST write AT LEAST ${currentTargetWords} words.
      2. Be comprehensive and detailed. Include examples, explanations, and thorough coverage.
      3. DO NOT repeat the chapter heading (Chapter X: Title) in the content - the heading already exists.
      4. Start directly with the chapter body content.
      
      Output JSON only:
      {
        "content": ${isConclusion ? '"Single comprehensive concluding paragraph..."' : '"Introductory text for the chapter..."'},
        "subsections": ${isConclusion ? '[]' : '[ { "title": "Subsection Title", "content": "Content..." } ]'}
      }
    `;

        const chapterUserPrompt = `
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
      1.  **LENGTH**: The content of this chapter MUST be approximately ${currentTargetWords} words. ${isConclusion ? "Keep it concise (one paragraph, HALF PAGE MAXIMUM - 150 words)." : `DO NOT EXCEED significantly.\n\n🔴 ABSOLUTE REQUIREMENT: You MUST write AT LEAST ${Math.round(currentTargetWords / (chapter.subsections?.length || 3))} words for EACH subsection.\n🔴🔴🔴 CRITICAL: This ENTIRE chapter MUST contain a MINIMUM of ${currentTargetWords} words. DO NOT write less!`}
      2.  **FORMAT**: Use full paragraphs. NO bullet points. NO asterisks. ${isConclusion ? 'CONCLUSION must be ONE continuous paragraph.' : ''}
      3.  **SUBSECTIONS**: ${isConclusion ? 'NO SUBSECTIONS for conclusion.' : 'Ensure you generate content for every subsection listed.'}
      4.  **TITLES**: Do NOT include numbering in the "title" field of the subsection (e.g., just "Overview", NOT "1.1 Overview").
      ${requestImage ? `5.  **IMAGES**: Include EXACTLY 1 IMAGE in this chapter. Use this format: "[IMAGE: detailed keyword for image search]" (e.g., "[IMAGE: Electric Vehicle Battery Diagram]"). Place it near the relevant text.` : `5.  **IMAGES**: DO NOT include any images or placeholders in this chapter.`}
      6.  **TONE**: Professional, technical, engineering-style academic writing.
      
      🚨 FINAL REMINDER: Your response MUST be AT LEAST ${currentTargetWords} words. Count every word carefully!
      
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
                await delay(500);
                const text = await groqGenerate(chapterSystemPrompt, chapterUserPrompt);
                chapterData = JSON.parse(text);
                success = true;
            } catch (error) {
                console.error(`Error generating chapter ${chapter.number}, retries left: ${retries - 1}`, error);
                retries--;
                if (retries > 0) await delay(800);
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

    // ─────────────────────────────────────────────────────────────────
    // STEP 3: PRE-FETCH IMAGES (Performance Optimization)
    // ─────────────────────────────────────────────────────────────────
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
        images: imageMap,
        provider: "groq"
    };
};
