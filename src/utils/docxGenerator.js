
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, PageNumber, PageBreak, TableOfContents, ImageRun } from "docx";
import { saveAs } from "file-saver";

// --- Helpers for Image Fetching ---
const fetchImage = async (query) => {
  try {
    // Use Pollinations.ai for AI-generated visuals matching the topic
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}?width=600&height=400&nologo=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Image load failed');
    return await response.arrayBuffer();
  } catch (e) {
    console.warn("Failed to fetch image for:", query, e);
    return null; // Graceful fallback
  }
};

const parseContentWithImages = async (text, createBodyTextFunc, imageMap) => {
  const paragraphs = [];
  // Split by [IMAGE:Query] tags
  const parts = text.split(/(\[IMAGE:.*?\])/g);

  for (const part of parts) {
    const imageMatch = part.match(/^\[IMAGE:(.*?)\]$/);
    if (imageMatch) {
      const tag = imageMatch[0]; // Full tag [IMAGE:...]
      const query = imageMatch[1].trim();

      // Use pre-fetched image if available, else try fetch (fallback)
      const imageBuffer = imageMap?.[tag] || await fetchImage(query);

      if (imageBuffer) {
        paragraphs.push(new Paragraph({
          children: [
            new ImageRun({
              data: imageBuffer,
              transformation: { width: 400, height: 266 }, // 600x400 ratio scaled
            }),
            new TextRun({
              text: `\nFigure: ${query}`,
              bold: true,
              size: 20, // 10pt caption
              color: "666666"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }));
      }
    } else if (part.trim()) {
      // Standard Text - split by newlines for paragraphs
      const lines = part.split('\n').filter(l => l.trim());
      lines.forEach(line => paragraphs.push(createBodyTextFunc(line)));
    }
  }
  return paragraphs;
};

// --- Main Generator ---
export const generateDocx = async (data) => {
  const { title, abstract, chapters, references, images } = data; // Destructure images

  // Constants
  const BLACK_COLOR = "000000";
  const FONT_SIZE = 28; // 14pt
  const LINE_SPACING = 276; // 1.15 lines
  const INDENT_FIRST_LINE = 720; // 0.5 inch

  // --- Helper Creators ---
  const createChapterTitle = (number, text) => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 400 },
    pageBreakBefore: true,
    children: [
      new TextRun({
        text: `CHAPTER ${number}`,
        color: BLACK_COLOR,
        bold: true,
        size: 32 // 16pt
      }),
      new TextRun({
        text: text.toUpperCase(),
        color: BLACK_COLOR,
        bold: true,
        size: 32, // 16pt
        break: 1 // Break line for TOC formatting
      })
    ]
  });

  const createSubHeading = (text) => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 200 },
    children: [new TextRun({
      text: text,
      color: BLACK_COLOR,
      bold: true,
      size: FONT_SIZE
    })]
  });

  const createBodyText = (text) => new Paragraph({
    children: [new TextRun({ text: text, size: FONT_SIZE, color: BLACK_COLOR })],
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: INDENT_FIRST_LINE },
    spacing: { line: LINE_SPACING, after: 200 },
  });

  const createListItem = (text) => new Paragraph({
    children: [new TextRun({ text: text, size: FONT_SIZE, color: BLACK_COLOR })],
    spacing: { after: 100 },
    bullet: { level: 0 }
  });

  // --- Process Content ---
  const docSections = [];

  // 1. Title Page
  docSections.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 3000, after: 1000 },
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 48, color: BLACK_COLOR })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 3000 },
      children: [new TextRun({ text: "A PROJECT REPORT", size: 32, bold: true, color: BLACK_COLOR })]
    })
  );

  // 2. Table of Contents
  docSections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      pageBreakBefore: true,
      children: [new TextRun({ text: "TABLE OF CONTENT", bold: true, size: 32, color: BLACK_COLOR })]
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "CHAPTER NO", bold: true, size: 24, color: BLACK_COLOR }),
        new TextRun({ text: "\t\t\tTITLE", bold: true, size: 24, color: BLACK_COLOR }),
        new TextRun({ text: "\t\t\t\t\tPAGE NO", bold: true, size: 24, color: BLACK_COLOR }),
      ],
      tabStops: [
        { position: 4000, type: "center" },
        { position: 9000, type: "right" }
      ],
      spacing: { before: 400, after: 200 }
    }),
    new TableOfContents(" ", { hyperlink: true, headingStyleRange: "1-5" })
  );

  // 3. Abstract
  docSections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "ABSTRACT", color: BLACK_COLOR, bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
      pageBreakBefore: true
    }),
    createBodyText(abstract) // Abstract is usually plain text
  );

  // 4. Chapters
  for (const chapter of (chapters || [])) {
    // Title
    docSections.push(createChapterTitle(chapter.number, chapter.title));

    // Content
    if (chapter.content) {
      const introParas = await parseContentWithImages(chapter.content, createBodyText, images);
      docSections.push(...introParas);
    }

    // Subsections
    for (const sub of (chapter.subsections || [])) {
      const cleanTitle = sub.title.replace(/^(\d+(\.\d+)*\s+)/, "").trim();
      docSections.push(createSubHeading(`${chapter.number}.${(chapter.subsections.indexOf(sub) + 1)} ${cleanTitle}:`));

      if (sub.content) {
        const subParas = await parseContentWithImages(sub.content, createBodyText, images);
        docSections.push(...subParas);
      }
    }
  }

  // 5. References
  docSections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "REFERENCES", color: BLACK_COLOR, bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
      pageBreakBefore: true
    })
  );
  references?.forEach(ref => docSections.push(createListItem(ref)));


  // --- Final Document ---
  const doc = new Document({
    sections: [{
      properties: {},
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT], size: 28, color: BLACK_COLOR })],
            }),
          ],
        })
      },
      children: docSections,
    }],
    features: { updateFields: true } // Auto-update TOC
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.docx`);
};
