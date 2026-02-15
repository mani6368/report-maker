
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Footer, PageNumber, PageBreak, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, SimpleField, BookmarkStart, BookmarkEnd } from "docx";
import { saveAs } from "file-saver";

// --- Helpers for Image Fetching ---
const fetchImage = async (query) => {
  try {
    // Use Pollinations.ai for AI-generated visuals matching the topic with random seed to prevent duplicates
    const seed = Math.floor(Math.random() * 100000);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}?width=600&height=400&nologo=true&seed=${seed}`;
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

  console.log(`parseContentWithImages: Found ${parts.length} parts in text`);
  console.log(`parseContentWithImages: imageMap has ${Object.keys(imageMap || {}).length} images`);

  for (const part of parts) {
    const imageMatch = part.match(/^\[IMAGE:(.*?)\]$/);
    if (imageMatch) {
      const tag = imageMatch[0]; // Full tag [IMAGE:...]
      const query = imageMatch[1].trim();

      console.log(`Found image tag: ${tag}`);

      // Use pre-fetched image if available, else try fetch (fallback)
      const imageBuffer = imageMap?.[tag] || await fetchImage(query);

      if (imageBuffer) {
        console.log(`✓ Image loaded for: ${query} (${imageBuffer.byteLength} bytes)`);
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
              color: "000000"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 }
        }));
      } else {
        console.warn(`✗ Failed to load image for: ${query}`);
      }
    } else if (part.trim()) {
      // Standard Text - split by newlines for paragraphs
      const lines = part.split('\n').filter(l => l.trim());
      lines.forEach(line => paragraphs.push(createBodyTextFunc(line)));
    }
  }
  console.log(`parseContentWithImages: Generated ${paragraphs.length} paragraphs total`);
  return paragraphs;
};

// --- Main Generator ---
export const generateDocx = async (data, contentFontSize = 14, chapterFontSize = 16) => {
  const { title, abstract, chapters, references, images } = data; // Destructure images

  console.log('generateDocx: Received data with images:', images ? Object.keys(images).length + ' images' : 'NO IMAGES');
  if (images) {
    console.log('Image tags:', Object.keys(images));
  }

  // Constants
  const BLACK_COLOR = "000000";
  const FONT_SIZE = contentFontSize * 2; // Convert pt to half-points (docx uses half-points)
  const CHAPTER_FONT_SIZE = chapterFontSize * 2; // Convert pt to half-points
  const LINE_SPACING = 276; // 1.15 lines
  const INDENT_FIRST_LINE = 720; // 0.5 inch

  // --- Helper Creators ---
  const createChapterTitle = (number, text, bookmarkId) => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 400 },
    pageBreakBefore: true,
    children: [
      new BookmarkStart(bookmarkId),
      new TextRun({
        text: `CHAPTER ${number}`,
        color: BLACK_COLOR,
        bold: true,
        size: CHAPTER_FONT_SIZE // Use dynamic chapter font size
      }),
      new TextRun({
        text: "\n" + text.toUpperCase(),
        color: BLACK_COLOR,
        bold: true,
        size: CHAPTER_FONT_SIZE, // Use dynamic chapter font size
      }),
      new BookmarkEnd(bookmarkId)
    ]
  });

  const createSubHeading = (text, bookmarkId) => new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 200 },
    children: [
      new BookmarkStart(bookmarkId),
      new TextRun({
        text: text,
        color: BLACK_COLOR,
        bold: true,
        size: FONT_SIZE
      }),
      new BookmarkEnd(bookmarkId)
    ]
  });

  const createBodyText = (text) => new Paragraph({
    children: [new TextRun({ text: text, size: FONT_SIZE, color: BLACK_COLOR })],
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: INDENT_FIRST_LINE },
    spacing: { line: LINE_SPACING, after: 200 },
  });

  const createListItem = (text) => new Paragraph({
    children: [new TextRun({ text: text, size: FONT_SIZE, color: BLACK_COLOR })],
    alignment: AlignmentType.JUSTIFIED, // Justified for references
    spacing: { after: 200, line: LINE_SPACING },
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
      spacing: { after: 1000 },
      children: [new TextRun({ text: "A PROJECT REPORT", size: 32, bold: true, color: BLACK_COLOR })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: "Generated by Report-maker.ai", size: 24, italics: true, color: "666666" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 3000 },
      children: [new TextRun({ text: new Date().toLocaleString(), size: 22, italics: true, color: "888888" })]
    })
  );

  // --- Bookmark ID Helpers ---
  // Using strictly alphanumeric IDs to ensure maximum compatibility
  const getAbstractBm = () => "BMABSTRACT";
  const getRefBm = () => "BMREFS";
  const getChapterBm = (index) => `BMCH${index}`;
  const getSubBm = (chIndex, subIndex) => `BMCH${chIndex}S${subIndex}`;

  // 2. Custom Table Based TOC
  docSections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      pageBreakBefore: true,
      spacing: { after: 400 },
      children: [new TextRun({ text: "TABLE OF CONTENT", bold: true, size: 32, color: BLACK_COLOR })]
    })
  );

  // Create TOC Table Rows
  const tocRows = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CHAPTER NO", bold: true, size: 24 })] })],
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TITLE", bold: true, size: 24 })] })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PAGE NO", bold: true, size: 24 })] })],
        }),
      ],
    })
  ];

  // Abstract TOC Entry
  tocRows.push(
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 24 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "ABSTRACT", bold: true, size: 24 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 24 })] })] }), // Empty Page No
      ]
    })
  );

  // Chapters TOC Entries (PRE-CALCULATION)
  (chapters || []).forEach((chapter, index) => {
    // Chapter Row
    tocRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${chapter.number}`, bold: true, size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: chapter.title.toUpperCase(), bold: true, size: 24 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 24 })] })] }), // Empty Page No
        ]
      })
    );

    // Subsections TOC Entries
    (chapter.subsections || []).forEach((sub, subIndex) => {
      const cleanTitle = sub.title.replace(/^(\d+(\.\d+)*\s+)/, "").trim();
      tocRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 24 })] })] }), // Empty Chapter No
            new TableCell({ children: [new Paragraph({ indent: { left: 720 }, children: [new TextRun({ text: `${chapter.number}.${subIndex + 1} ${cleanTitle}`, size: 24 })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 24 })] })] }), // Empty Page No
          ]
        })
      );
    });
  });

  // References TOC Entry
  tocRows.push(
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 24 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "REFERENCES", bold: true, size: 24 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 24 })] })] }), // Empty Page No
      ]
    })
  );


  // Add the Table
  docSections.push(
    new Table({
      rows: tocRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      }
    })
  );


  // 3. Abstract
  docSections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new BookmarkStart(getAbstractBm()),
        new BookmarkEnd(getAbstractBm()), // Point Bookmark
        new TextRun({ text: "ABSTRACT", color: BLACK_COLOR, bold: true, size: CHAPTER_FONT_SIZE })
      ],
      alignment: AlignmentType.CENTER,
      pageBreakBefore: true
    }),
    createBodyText(abstract)
  );

  // 4. Chapters Content Generation
  // RE-LOOPING with for..of to handle async await correctly for parseContentWithImages
  for (let i = 0; i < (chapters || []).length; i++) {
    const chapter = chapters[i];

    try {
      // Point bookmark logic update: Manual construction to control children order
      docSections.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 400 },
        pageBreakBefore: true,
        children: [
          new BookmarkStart(getChapterBm(i + 1)),
          new BookmarkEnd(getChapterBm(i + 1)), // Point Bookmark
          new TextRun({
            text: `CHAPTER ${chapter.number}`,
            color: BLACK_COLOR,
            bold: true,
            size: CHAPTER_FONT_SIZE
          }),
          new TextRun({
            text: chapter.title.toUpperCase(),
            break: 2,
            color: BLACK_COLOR,
            bold: true,
            size: CHAPTER_FONT_SIZE,
          })
        ]
      }));

      if (chapter.content) {
        const introParas = await parseContentWithImages(chapter.content, createBodyText, images);
        docSections.push(...introParas);
      }

      // Subsections
      for (let j = 0; j < (chapter.subsections || []).length; j++) {
        const sub = chapter.subsections[j];
        const cleanTitle = sub.title.replace(/^(\d+(\.\d+)*\s+)/, "").trim();
        const subId = getSubBm(i + 1, j + 1);

        // Manual Paragraph for Subsection to ensure Point Bookmark
        docSections.push(new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
          children: [
            new BookmarkStart(subId),
            new BookmarkEnd(subId), // Point Bookmark
            new TextRun({
              text: `${chapter.number}.${(j + 1)} ${cleanTitle}:`,
              color: BLACK_COLOR,
              bold: true,
              size: FONT_SIZE
            })
          ]
        }));

        if (sub.content) {
          const subParas = await parseContentWithImages(sub.content, createBodyText, images);
          docSections.push(...subParas);
        }
      }
    } catch (err) {
      console.error(`Error generating chapter ${i + 1}:`, err);
      docSections.push(createBodyText(`[ERROR GENERATING CHAPTER ${i + 1}: ${err.message}]`));
    }
  }

  // 5. References
  docSections.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new BookmarkStart(getRefBm()),
        new BookmarkEnd(getRefBm()), // Point Bookmark
        new TextRun({ text: "REFERENCES", color: BLACK_COLOR, bold: true, size: CHAPTER_FONT_SIZE })
      ],
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
