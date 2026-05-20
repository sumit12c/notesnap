import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  PageBreak,
  HeightRule,
  Header,
  Footer
} from "docx";

// Inline markdown helper that parses lines to TextRun tokens (handles **bold**, *italic*, and `code`)
function parseInlineFormatting(text: string, options?: { size?: number; color?: string; font?: string }): TextRun[] {
  const runs: TextRun[] = [];
  let i = 0;
  let currentText = "";
  let isBold = false;
  let isItalic = false;
  let isCode = false;

  const baseFont = options?.font || "Calibri";
  const sizeValue = options?.size || 23; // 23/2 = 11.5pt
  const baseColor = options?.color || "2D3748"; // slate-800

  const pushCurrent = () => {
    if (currentText) {
      runs.push(
        new TextRun({
          text: currentText,
          bold: isBold,
          italics: isItalic,
          font: isCode ? "Courier New" : baseFont,
          size: sizeValue,
          color: isCode ? "C7254E" : baseColor,
          shading: isCode ? { fill: "F7F7F7" } : undefined,
        })
      );
      currentText = "";
    }
  };

  while (i < text.length) {
    if (text.startsWith("**", i)) {
      pushCurrent();
      isBold = !isBold;
      i += 2;
    } else if (text.startsWith("*", i)) {
      pushCurrent();
      isItalic = !isItalic;
      i += 1;
    } else if (text.startsWith("`", i)) {
      pushCurrent();
      isCode = !isCode;
      i += 1;
    } else {
      currentText += text[i];
      i++;
    }
  }
  pushCurrent();
  return runs;
}

interface DocMetadata {
  title: string;
  date: string;
  totalDuration: string;
  activeTime: string;
  screenshotsCount: number;
  totalWords: number;
  windowName: string;
}

export async function generateDocxBlob(markdownText: string, metadata: DocMetadata): Promise<Blob> {
  const children: any[] = [];

  // ==========================================
  // PAGE 1: TITLE PAGE
  // ==========================================

  // Document Title
  children.push(new Paragraph({ text: "", spacing: { before: 800 } })); // spacer
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: metadata.title.toUpperCase() || "STUDY SESSION NOTES",
          bold: true,
          font: "Segoe UI",
          size: 64, // 32pt
          color: "1A365D", // Dark Blue
        }),
      ],
    })
  );

  // Subtitle / Banner
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [
        new TextRun({
          text: "AI-Generated Personalized Study Guide from NotesNap",
          italics: true,
          font: "Segoe UI",
          size: 26, // 13pt
          color: "4A5568",
        }),
      ],
    })
  );

  // Decorative Horizontal Line (using table or borders)
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [],
              shading: { fill: "3182CE" }, // Bright Accent Blue
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                right: { style: BorderStyle.NONE, size: 0, color: "auto" },
              },
            }),
          ],
        }),
      ],
    })
  );
  children.push(new Paragraph({ text: "", spacing: { after: 600 } }));

  // Session Statistics Section
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: "STUDY SESSION INFORMATION",
          bold: true,
          font: "Segoe UI",
          size: 28,
          color: "2B6CB0",
        }),
      ],
    })
  );

  const statsItems = [
    { label: "Date of Session", value: metadata.date },
    { label: "Study Stream Source", value: metadata.windowName || "Selected Screen Capture" },
    { label: "Total Session Hour", value: metadata.totalDuration },
    { label: "Active Focus Time", value: metadata.activeTime },
    { label: "Screenshots Captured", value: `${metadata.screenshotsCount} captures` },
    { label: "Total Extract Vocabulary", value: `${metadata.totalWords} words processed` },
  ];

  statsItems.forEach((stat) => {
    children.push(
      new Paragraph({
        spacing: { after: 120, line: 360 },
        children: [
          new TextRun({
            text: `•  ${stat.label}: `,
            bold: true,
            font: "Calibri",
            size: 23,
            color: "4A5568",
          }),
          new TextRun({
            text: stat.value,
            font: "Calibri",
            size: 23,
            color: "1A202C",
          }),
        ],
      })
    );
  });

  children.push(new Paragraph({ text: "", spacing: { after: 2400 } })); // big spacing push to footer info

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "Generated with NotesNap Secure Edge Platform",
          font: "Segoe UI Semibold",
          size: 20,
          color: "A0AEC0",
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Timestamp UTC: ${new Date().toISOString().replace("T", " ").substring(0, 19)}`,
          font: "Courier New",
          size: 16,
          color: "CBD5E0",
        }),
      ],
    })
  );

  // Page break after Title Page
  children.push(new PageBreak());

  // ==========================================
  // PAGE 2: TABLE OF CONTENTS (SIMULATED FOR FLEXIBILITY)
  // ==========================================
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 300 },
      children: [
        new TextRun({
          text: "TABLE OF CONTENTS",
          bold: true,
          font: "Segoe UI",
          size: 32,
          color: "1A365D",
        }),
      ],
    })
  );

  // Scan Markdown to extract Heading Level 1 and 2 items
  const lines = markdownText.split("\n");
  const headingList: { text: string; level: number }[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      headingList.push({ text: trimmed.replace("## ", "").replace(/\*/g, ""), level: 1 });
    } else if (trimmed.startsWith("### ")) {
      headingList.push({ text: trimmed.replace("### ", "").replace(/\*/g, ""), level: 2 });
    }
  });

  if (headingList.length > 0) {
    headingList.forEach((h) => {
      const indent = h.level === 2 ? "      " : "";
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: `${indent}${h.level === 1 ? "■  " : "•  "}${h.text}`,
              font: h.level === 1 ? "Segoe UI Semibold" : "Calibri",
              size: h.level === 1 ? 24 : 22,
              color: h.level === 1 ? "2B6CB0" : "4A5568",
              bold: h.level === 1,
            }),
            new TextRun({
              text: "  ........................................................................................  [Ref]",
              font: "Calibri",
              size: 20,
              color: "CBD5E0",
            }),
          ],
        })
      );
    });
  } else {
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: "General Summary Outline is organized chronologically inside.",
            italics: true,
            font: "Calibri",
            size: 22,
            color: "718096",
          }),
        ],
      })
    );
  }

  children.push(new PageBreak());

  // ==========================================
  // MAIN BODY PARSER
  // ==========================================
  let insideCodeBlock = false;
  let codeBlockLines: string[] = [];
  let isInsideTable = false;
  let tableRowsData: string[][] = [];

  const commitTable = () => {
    if (tableRowsData.length === 0) return;

    const rowObjects = tableRowsData.map((rowCells, rowIndex) => {
      const cellObjects = rowCells.map((cellText) => {
        // Check if header row (index 0)
        const isHeader = rowIndex === 0;
        return new TableCell({
          children: [
            new Paragraph({
              spacing: { before: 80, after: 80 },
              alignment: AlignmentType.LEFT,
              children: parseInlineFormatting(cellText.trim(), {
                size: isHeader ? 22 : 20,
                color: isHeader ? "FFFFFF" : "2D3748",
                font: isHeader ? "Segoe UI Semibold" : "Calibri",
              }),
            }),
          ],
          shading: isHeader ? { fill: "2B6CB0" } : { fill: rowIndex % 2 === 0 ? "F7FAFC" : "FFFFFF" },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
          },
        });
      });

      return new TableRow({ children: cellObjects });
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rowObjects,
      })
    );

    // spacer
    children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

    tableRowsData = [];
    isInsideTable = false;
  };

  const commitCodeBlock = () => {
    if (codeBlockLines.length === 0) return;

    // Output code block grouped in a nice shaded bounding Table for formatting reasons
    const codeParagraphs = codeBlockLines.map((line) => {
      return new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text: line,
            font: "Courier New",
            size: 18,
            color: "2D3748",
          }),
        ],
      });
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: codeParagraphs,
                shading: { fill: "F7FAFC" },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 8, color: "CBD5E0" },
                  bottom: { style: BorderStyle.SINGLE, size: 8, color: "CBD5E0" },
                  left: { style: BorderStyle.SINGLE, size: 12, color: "2B6CB0" }, // Accent left border
                  right: { style: BorderStyle.SINGLE, size: 8, color: "CBD5E0" },
                },
              }),
            ],
          }),
        ],
      })
    );

    children.push(new Paragraph({ text: "", spacing: { after: 120 } }));

    codeBlockLines = [];
    insideCodeBlock = false;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();

    // Code Block detection
    if (trimmed.startsWith("```")) {
      if (insideCodeBlock) {
        commitCodeBlock();
      } else {
        // If we were parsing a table, commit it first
        if (isInsideTable) commitTable();
        insideCodeBlock = true;
      }
      continue;
    }

    if (insideCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Markdown Table Detection
    if (trimmed.startsWith("|")) {
      if (isInsideTable) {
        // check if separator row (containing ---)
        if (trimmed.includes("---") || trimmed.includes("-:-")) {
          // ignore separator row
          continue;
        }

        // Parse cells
        const cells = trimmed.split("|").slice(1, -1);
        tableRowsData.push(cells);
      } else {
        // If it was another table or block, let's clear it
        isInsideTable = true;
        const cells = trimmed.split("|").slice(1, -1);
        tableRowsData.push(cells);
      }
      continue;
    } else {
      if (isInsideTable) {
        commitTable();
      }
    }

    // Standard markdown element checks
    if (trimmed === "") {
      // Avoid inserting excessive redundant blank spacing
      if (children.length > 0 && children[children.length - 1] instanceof Paragraph) {
        // just add a slight spacing below instead of a separate paragraph
        continue;
      }
      children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
      continue;
    }

    // Heading 1: `# Title` or `## Head` (Gemini's prompt requests '##' headings)
    if (trimmed.startsWith("# ") || trimmed.startsWith("## ")) {
      const headingText = trimmed.replace(/^#{1,2}\s+/, "").replace(/\*/g, "");
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 180 },
          children: [
            new TextRun({
              text: headingText,
              bold: true,
              font: "Segoe UI Semibold",
              size: 28, // 14pt
              color: "1A365D",
            }),
          ],
        })
      );
      continue;
    }

    // Heading 2: `### Head`
    if (trimmed.startsWith("### ")) {
      const headingText = trimmed.replace(/^###\s+/, "").replace(/\*/g, "");
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 120 },
          children: [
            new TextRun({
              text: headingText,
              bold: true,
              font: "Segoe UI Semibold",
              size: 24, // 12pt
              color: "2B6CB0",
            }),
          ],
        })
      );
      continue;
    }

    // Heading 3: `#### Head`
    if (trimmed.startsWith("#### ")) {
      const headingText = trimmed.replace(/^####\s+/, "").replace(/\*/g, "");
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 100 },
          children: [
            new TextRun({
              text: headingText,
              bold: true,
              italics: true,
              font: "Segoe UI Semibold",
              size: 22, // 11pt
              color: "4A5568",
            }),
          ],
        })
      );
      continue;
    }

    // Bullet Points
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const bulletText = trimmed.replace(/^[\*\-•]\s+/, "");
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          bullet: { level: 0 },
          children: parseInlineFormatting(bulletText),
        })
      );
      continue;
    }

    // Numbered lists e.g., "1. List content"
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (match) {
        const num = match[1];
        const textValue = match[2];
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            // Represent numbered list directly via spaced paragraph to prevent numbering layout bugs in some Word viewers
            children: [
              new TextRun({ text: `${num}.  `, bold: true, font: "Segoe UI", size: 22, color: "1A365D" }),
              ...parseInlineFormatting(textValue),
            ],
          })
        );
        continue;
      }
    }

    // Standard regular paragraph
    children.push(
      new Paragraph({
        spacing: { after: 140, line: 310 }, // comfortable 1.3x spacing
        children: parseInlineFormatting(trimmed),
      })
    );
  }

  // Safety commit any trailing lists/tables/blocks
  if (isInsideTable) commitTable();
  if (insideCodeBlock) commitCodeBlock();

  // Create the final Word document object
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${metadata.title} | NotesNap AI Guide`,
                    font: "Segoe UI",
                    size: 16,
                    color: "A0AEC0",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Generated dynamically on NotesNap secure client portal. Document contains proprietary study models.",
                    font: "Segoe UI",
                    size: 14,
                    color: "CBD5E0",
                  }),
                ],
              }),
            ],
          }),
        },
        children: children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
