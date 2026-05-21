import { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Health check
  if (req.method === "GET" && req.url === "/api/health") {
    return res.json({ status: "healthy", timestamp: new Date().toISOString() });
  }

  // Process session endpoint
  if (req.method === "POST" && req.url === "/api/process-session") {
    try {
      const { textPayload, metadata, customApiKey, modelName } = req.body;

      if (!textPayload || !Array.isArray(textPayload)) {
        return res.status(400).json({ error: "Missing or invalid 'textPayload' array." });
      }

      // Check for API key
      const apiKey = customApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        return res.status(400).json({
          error: "Gemini API Key is not configured. Please enter a valid API Key in the Settings panel."
        });
      }

      // Initialize Google GenAI
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Format captures into chronological text block
      const chronologicalText = textPayload
        .map((cap: any) => {
          const time = cap.timestamp ? `[Timestamp: ${cap.timestamp}]` : "[Captured]";
          return `${time}\n${cap.text}\n`;
        })
        .join("\n---\n\n");

      const selectedModel = modelName || "gemini-3.5-flash";

      const prompt = `You are an expert educational note-taker, visual organizer, and cognitive scientist.
I am providing you with text captured from multiple presentation screenshots during an active study class/session via OCR.

This OCR stream might contain noise, fragmented lines, and duplicate terms. Your primary goal is to transform this raw content into a high-retention, high-impact "Last-Minute Revision & Quick Recall" study guide.

Session Context:
- Active Study Window: ${metadata?.windowName || "N/A"}
- Captured Slide Snapshots: ${metadata?.count || 0}
- Raw Words Analyzed: ${metadata?.words || 0}

Your Output MUST strictly adhere to the following clean structure and layout rules:

1. **🚀 INSTANT RECALL EXECUTIVE SUMMARY (Max 3 Sentences)**
   - Provide a highly concentrated high-level synthesis of what this entire session covers.
   - Strip all fluff: get straight to the "Why it matters" and "Core objective."

2. **🔑 CORE TERMINOLOGY & ESSENTIALS (Fast Revision Grid)**
   - Display a Markdown table containing the absolute-essential terms, formulas, or rules.
   - Column 1: **Core Concept / Formula** (Bolded)
   - Column 2: **High-Yield Revision Explanation** (A single, direct, high-impact sentence of what they must know for an exam).

3. **📝 HIGH-YIELD COLLAPSED CHEATSHEET & STRUCTURED NOTES**
   - Clean up OCR errors, format code snippets in (\`\`\`) with specific language tags, and write out formulas natively or inside clean block formatting.
   - Organize notes with concise headings (##, ###).
   - Use bold highlights for high-importance tags and critical definitions.
   - Present information in highly scannable bullet points — avoid long paragraphs!

4. **🎯 ACTIVE RECALL SELF-TEST (Last-Minute Brain Workout)**
   - Provide 3-5 high-impact conceptual questions derived directly from the notes.
   - Immediately follow each question with a bulleted, highly crisp "Self-Check Answer Key".
   - This activates active cognitive retrieval to maximize student score potential on late-hour reviews.

Ensure the notes read as a masterfully crafted, professional cheat sheet optimized for instant last-minute study and revision.

Captured Text (Chronological Log of Slides):
${chronologicalText}
`;

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
      });

      const markdownResult = response.text;
      if (!markdownResult) {
        throw new Error("Empty response received from Gemini.");
      }

      res.json({ markdown: markdownResult });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error?.message || "Internal server error occurred while processing with Gemini AI." });
    }
  }

  res.status(404).json({ error: "Not found" });
}
