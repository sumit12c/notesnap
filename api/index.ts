import { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Health check
  if (req.method === "GET" && req.url?.includes("/health")) {
    return res.json({ status: "healthy", timestamp: new Date().toISOString() });
  }

  // Process session endpoint
  if (req.method === "POST" && req.url?.includes("/process-session")) {
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

      console.log("API Key present:", !!apiKey);
      console.log("Model:", modelName || "gemini-3.5-flash");

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

      const selectedModel = modelName || "gemini-2.0-flash";

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

      console.log("Calling Gemini API with model:", selectedModel);
      
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
      });

      const markdownResult = response.text;
      
      console.log("Gemini response received, length:", markdownResult?.length);
      
      if (!markdownResult) {
        console.error("Empty response from Gemini");
        return res.status(500).json({ error: "Empty response received from Gemini. The API may have rate-limited or had an issue." });
      }

      return res.json({ markdown: markdownResult });
    } catch (error: any) {
      console.error("API Error:", error);
      const errorMessage = error?.message || error?.toString() || "Unknown error occurred";
      return res.status(500).json({ 
        error: errorMessage,
        details: error?.error?.message || "No additional details available"
      });
    }
  }

  return res.status(404).json({ error: "Not found" });
}
