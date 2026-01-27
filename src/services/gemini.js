import { GoogleGenerativeAI } from "@google/generative-ai";

export const fetchReportContent = async (topic, apiKey, pageCount = 20) => {
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

    INPUT INTERPRETATION INSTRUCTIONS:
    1. **If the INPUT is a simple title** (e.g., "Electric Vehicles"), use it as the Project Title and generate a standard academic structure.
    2. **If the INPUT is a set of instructions** (e.g., "Make a report on EVs with headings Introduction, Battery, Future"), extract a professional Project Title from it and use the specific headings/subheadings requested by the user.
    
    The report must be VERY LONG (aiming for ${pageCount}+ pages total).
    
    Return JSON structure:
    {
      "title": "Extracted Project Title",
      "abstract": "Detailed abstract (approx 150-200 words, fit on half page)...",
      "chapters": [
        { "number": 1, "title": "INTRODUCTION", "subsections": [{"title": "Problem Statement"}, {"title": "Scope"}] },
        { "number": 2, "title": "CUSTOM HEADINGS FROM USER", "subsections": [ ... ] }
      ],
      "references": [
         "Author, A.A., & Author, B.B. (Year). Title of article.",
         "Make sure to generate at least 8-10 academic references."
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
  // OPTIMIZED: 180 words/page based on user feedback (33 pages vs 25 requested). 14pt double spaced takes lot of room.
  const totalWords = contentPages * 180;

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
  let imagesRequested = 0;

  for (const chapter of outline.chapters) {
    const isConclusion = chapter.title.toUpperCase().includes("CONCLUSION");
    const isIntro = chapter.title.toUpperCase().includes("INTRODUCTION");

    // Logic for Images: user wants exactly 4 images total.
    // We will distribute them: 1 per chapter for the first 4 chapters that are NOT Conclusion.
    let requestImage = false;
    if (!isConclusion && imagesRequested < 4) {
      requestImage = true;
      imagesRequested++;
    }

    // Length Logic
    let currentTargetWords = wordsPerChapter;
    if (isConclusion) {
      currentTargetWords = 250; // Half page max for Conclusion
    }

    const chapterPrompt = `
      Write DETAILED, VERBOSE, ACADEMIC content for Chapter ${chapter.number}: "${chapter.title}" for the project "${topic}".
      Context: ${outline.abstract}
      
      Subsections to cover: ${JSON.stringify(chapter.subsections)}
      
      REQUIREMENTS:
      1.  **LENGTH**: The content of this chapter MUST be approximately ${currentTargetWords} words. ${isConclusion ? "Keep it short (half page)." : "DO NOT EXCEED significantly."}
      2.  **FORMAT**: Use full paragraphs. NO bullet points. NO asterisks.
      3.  **SUBSECTIONS**: Ensure you generate content for every subsection listed.
      4.  **TITLES**: Do NOT include numbering in the "title" field of the subsection (e.g., just "Overview", NOT "1.1 Overview").
      ${requestImage ? `5.  **IMAGES**: Include EXACTLY 1 IMAGE in this chapter. Use this format: "[IMAGE: detailed keyword for image search]" (e.g., "[IMAGE: Electric Vehicle Battery Diagram]"). Place it near the relevant text.` : `5.  **IMAGES**: DO NOT include any images or placeholders in this chapter.`}
      6.  **TONE**: Professional, technical, engineering-style academic writing.
      
      Return JSON:
      {
        "content": "Introductory text for the chapter...",
        "subsections": [
           { "title": "Subsection Title", "content": "Content..." }
        ]
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

  return {
    ...outline,
    chapters: fullChapters
  };
};
