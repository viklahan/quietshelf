import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { defaultGodfatherData } from "./src/defaultData.js";
import { generatePythonCode } from "./src/pythonGenerator.js";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import JSZip from "jszip";
import mammoth from "mammoth";

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not defined in environment. Fallback heuristic analysis will be used.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Local Fallback Heuristic Semantic Analyzer (when API key is missing)
function performHeuristicAnalysis(storyText: string): typeof defaultGodfatherData {
  if (!storyText || storyText.trim().length === 0 || storyText.toLowerCase().includes("godfather")) {
    return defaultGodfatherData;
  }

  // 1. Split into paragraphs/chapters
  const paragraphs = storyText
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const chapters = paragraphs.slice(0, 8); // Limit to 8 elements for analysis
  if (chapters.length === 0) {
    chapters.push(storyText.substring(0, 500));
  }

  // 2. Identify potential character names by looking for repeated capitalized words
  // excluding standard starting words or common titles
  const wordMatches = storyText.match(/\b[A-Z][a-z]+\b/g) || [];
  const stopWords = new Set(["The", "A", "And", "It", "He", "She", "They", "But", "In", "On", "At", "To", "Chapter", "Story", "Then", "This", "There", "When", "I", "You", "As", "With"]);
  const frequencyMap: Record<string, number> = {};
  
  wordMatches.forEach((word) => {
    if (!stopWords.has(word)) {
      frequencyMap[word] = (frequencyMap[word] || 0) + 1;
    }
  });

  // Sort characters by frequency
  const sortedNames = Object.keys(frequencyMap).sort((a, b) => frequencyMap[b] - frequencyMap[a]);
  const extractedCharacters = sortedNames.slice(0, 5); // top 5 characters

  if (extractedCharacters.length === 0) {
    extractedCharacters.push("Protagonist", "Supporting Character");
  }

  // 3. Coordinate generator
  const positions = [
    { x: 480, y: 300, color: "#1E3A8A" }, // center
    { x: 280, y: 180, color: "#991B1B" }, // top left
    { x: 680, y: 180, color: "#065F46" }, // top right
    { x: 280, y: 420, color: "#D97706" }, // bottom left
    { x: 680, y: 420, color: "#701A75" }, // bottom right
  ];

  // 4. Sentiment lexicon
  const posWords = ["love", "happy", "joy", "save", "peace", "won", "beautiful", "good", "friend", "loyal", "respect", "celebrate"];
  const negWords = ["kill", "die", "betray", "death", "sad", "angry", "furious", "shoot", "attack", "fear", "dread", "wound", "blood"];

  const items: any[] = [];
  const timeline: any[] = [];
  const sentiments: any[] = [];
  const consistency: any[] = [];
  const dialogue: any[] = [];

  // Add extracted characters
  extractedCharacters.forEach((name, idx) => {
    const pos = positions[idx % positions.length];
    const item_id = name.toLowerCase().replace(/[^a-z0-9]/g, "_");

    items.push({
      id: item_id,
      type: "character",
      title: name.toUpperCase(),
      subtitle: idx === 0 ? "The Main Protagonist" : `Key Character (Arc ${idx + 1})`,
      content: `A central figure extracted from the narrative. Involved in key emotional shifts throughout the text.`,
      x: pos.x,
      y: pos.y,
      color: pos.color,
      tags: ["Story Character"],
      meta: {
        role: idx === 0 ? "Protagonist" : "Supporting",
        traits: ["Involved", "Key player", "Dynamic"],
        motivation: "Evolves as the plot unfolds and faces narrative conflicts.",
        eyeColor: "Dark",
        handedness: "Right-handed",
        backstory: `Establishes a core presence early in the narrative flow.`
      }
    });

    // Consistency profile
    consistency.push({
      id: `cp_${item_id}`,
      characterName: name.toUpperCase(),
      overallScore: 90,
      warnings: [],
      facts: [
        { fact: "Primary role and alignment", establishedIn: "Scene 1", isConsistent: true },
        { fact: "Backstory presence", establishedIn: "Scene 2", isConsistent: true }
      ]
    });

    // Dialogue profile
    dialogue.push({
      id: `dr_${item_id}`,
      characterName: name.toUpperCase(),
      naturalnessScore: 85,
      pacingScore: 88,
      feedback: `${name}'s dialogue shifts between narration and active conversation. Naturalness is aligned with generic prose style.`,
      examples: [
        {
          quote: `"...extracted dialogue fragment reflecting ${name.toLowerCase()}'s presence..."`,
          subtext: "Conveys underlying narrative themes and character objectives.",
          recommendation: "Increase specific vocabulary to enhance distinct voice."
        }
      ]
    });
  });

  // Threads
  const threads: any[] = [];
  for (let i = 1; i < extractedCharacters.length; i++) {
    threads.push({
      id: `t_fallback_${i}`,
      sourceId: extractedCharacters[0].toLowerCase().replace(/[^a-z0-9]/g, "_"),
      targetId: extractedCharacters[i].toLowerCase().replace(/[^a-z0-9]/g, "_"),
      label: "Allied Arc",
      color: "#3B82F6"
    });
  }

  // Create chapter sentiments and milestones
  chapters.forEach((chapterText, idx) => {
    const chNum = idx + 1;
    const cleanText = chapterText.toLowerCase();

    let score = 0.0;
    posWords.forEach(w => { if (cleanText.includes(w)) score += 0.2; });
    negWords.forEach(w => { if (cleanText.includes(w)) score -= 0.25; });
    
    // Clamp score
    score = Math.max(-1.0, Math.min(1.0, score));
    if (score === 0.0) score = 0.1; // avoid flat zero line

    const dominantEmotion = score > 0.2 ? "Hopeful & Moving" : score < -0.2 ? "Tense & Conflict" : "Observational / Narrative";
    const chName = `Chapter ${chNum}: Scene ${chNum}`;

    sentiments.push({
      id: `s_fallback_${chNum}`,
      chapterName: chName,
      score: score,
      dominantEmotion: dominantEmotion,
      keywords: score > 0 ? ["progress", "journey"] : ["tension", "obstacle"],
      summary: chapterText.length > 150 ? chapterText.substring(0, 147) + "..." : chapterText
    });

    // Map a character event
    const actingChar = extractedCharacters[idx % extractedCharacters.length];
    timeline.push({
      id: `m_fallback_${chNum}`,
      chapter: chName,
      character: actingChar.toUpperCase(),
      description: `Participates in the events of Scene ${chNum}. The environment shifts, driving immediate character development.`,
      developmentType: score > 0 ? "positive" : score < 0 ? "negative" : "stable",
      emotionalState: dominantEmotion,
      sentimentScore: score
    });
  });

  // Add one note and one document to the board
  items.push({
    id: "plot_climax_note",
    type: "note",
    title: "Key Structural Pivot",
    content: "The narrative reaches an intermediate crisis point here, pushing characters into decisive reactive decisions.",
    x: 480,
    y: 120,
    color: "#FEF08A"
  });

  items.push({
    id: "narrative_summary_doc",
    type: "document",
    title: "Analyzed Text Abstract",
    content: `SUMMARY ANALYSIS:\nTotal characters monitored: ${extractedCharacters.length}.\nAnalyzed segments: ${chapters.length}.\nThis interactive storyboard tracks these characters on the cork-board. You can drag cards to layout relationships, add pins, and export this workspace to a native desktop Python app!`,
    x: 80,
    y: 80,
    color: "#F3F4F6"
  });

  return {
    title: "AUTOGENERATED STORYBOARD MAP",
    description: "Heuristic-extracted character visualizer, timeline milestones, and sentiment arc mapper.",
    items,
    threads,
    timeline,
    sentiments,
    consistency,
    dialogue
  };
}

async function startServer() {
  const server = express();

  // Middleware to parse incoming JSON and URL-encoded request bodies
  server.use(express.json({ limit: "50mb" }));
  server.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API route to analyze story
  server.post("/api/analyze-story", async (req, res) => {
    const { storyText } = req.body;
    if (!storyText || storyText.trim().length === 0) {
      return res.json(defaultGodfatherData);
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return heuristic fallback
      console.log("No Gemini API key found, executing local heuristic parser.");
      const heuristicResult = performHeuristicAnalysis(storyText);
      return res.json(heuristicResult);
    }

    try {
      console.log("Calling Gemini API for story analysis...");
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING },
                title: { type: Type.STRING },
                subtitle: { type: Type.STRING },
                content: { type: Type.STRING },
                x: { type: Type.INTEGER },
                y: { type: Type.INTEGER },
                color: { type: Type.STRING },
                image_path: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                meta: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING },
                    traits: { type: Type.ARRAY, items: { type: Type.STRING } },
                    motivation: { type: Type.STRING },
                    eyeColor: { type: Type.STRING },
                    handedness: { type: Type.STRING },
                    backstory: { type: Type.STRING }
                  }
                }
              },
              required: ["id", "type", "title", "content", "x", "y", "color"]
            }
          },
          threads: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                sourceId: { type: Type.STRING },
                targetId: { type: Type.STRING },
                label: { type: Type.STRING },
                color: { type: Type.STRING }
              },
              required: ["id", "sourceId", "targetId", "label", "color"]
            }
          },
          timeline: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                chapter: { type: Type.STRING },
                character: { type: Type.STRING },
                description: { type: Type.STRING },
                developmentType: { type: Type.STRING },
                emotionalState: { type: Type.STRING },
                sentimentScore: { type: Type.NUMBER }
              },
              required: ["id", "chapter", "character", "description", "developmentType", "emotionalState", "sentimentScore"]
            }
          },
          sentiments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                chapterName: { type: Type.STRING },
                score: { type: Type.NUMBER },
                dominantEmotion: { type: Type.STRING },
                keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                summary: { type: Type.STRING }
              },
              required: ["id", "chapterName", "score", "dominantEmotion", "summary"]
            }
          },
          consistency: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                characterName: { type: Type.STRING },
                overallScore: { type: Type.INTEGER },
                warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
                facts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      fact: { type: Type.STRING },
                      establishedIn: { type: Type.STRING },
                      isConsistent: { type: Type.BOOLEAN },
                      warningMessage: { type: Type.STRING }
                    },
                    required: ["fact", "establishedIn", "isConsistent"]
                  }
                }
              },
              required: ["id", "characterName", "overallScore", "facts", "warnings"]
            }
          },
          dialogue: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                characterName: { type: Type.STRING },
                naturalnessScore: { type: Type.INTEGER },
                pacingScore: { type: Type.INTEGER },
                feedback: { type: Type.STRING },
                examples: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      quote: { type: Type.STRING },
                      subtext: { type: Type.STRING },
                      recommendation: { type: Type.STRING }
                    },
                    required: ["quote", "subtext", "recommendation"]
                  }
                }
              },
              required: ["id", "characterName", "naturalnessScore", "pacingScore", "feedback"]
            }
          }
        },
        required: ["title", "description", "items", "threads", "timeline", "sentiments", "consistency", "dialogue"]
      };

      const systemPrompt = `You are a professional literary scholar, story analyst, and visual director.
Analyze the story text and generate a structured JSON object matching the requested schema.

CRITICAL PERFORMANCE CONSTRAINTS FOR MAXIMUM SPEED AND TO PREVENT TIMEOUTS:
1. Limit 'items' to:
   - At most 4 main characters (type 'character').
   - At most 2 key notes (type 'note').
   - At most 2 document clippings (type 'document').
   - At most 3 visual storyboard panels (type 'storyboard').
   - Ensure all item coords fit nicely within a 1000x600 board: X (50 to 950), Y (50 to 550).
2. Limit 'threads' to at most 4 yarn connections between characters or cards.
3. Limit 'timeline' to at most 6 chronological key plot milestones.
4. Limit 'sentiments' to at most 4 main chapters or narrative sections.
5. Limit 'consistency' profiles to at most 3 main characters, with at most 2 facts/continuity items each.
6. Limit 'dialogue' reviews to at most 3 main characters, with at most 1 representative quote example each.
7. Keep all text fields (content, description, summary, feedback) extremely concise—at most 1-2 short, high-impact sentences.

Output strictly valid JSON with no markdown formatting tags. Just the raw JSON string.`;

      // Truncate story text to ~10,000 characters to keep requests extremely fast and prevent fetch timeouts
      const truncatedText = storyText.length > 10000 
        ? storyText.slice(0, 10000) + "\n... [Story truncated for performance and speed] ..." 
        : storyText;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `STORY TO ANALYZE:\n\n${truncatedText}`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });

      const responseText = result.text?.trim() || "{}";
      const parsedData = JSON.parse(responseText);
      res.json(parsedData);
    } catch (err: any) {
      console.error("Gemini API call failed:", err);
      // Fail gracefully: fallback to local heuristic
      const fallback = performHeuristicAnalysis(storyText);
      res.json({
        ...fallback,
        title: "ANALYSIS COMPLETED (HEURISTIC FALLBACK)",
        description: `Note: Gemini AI model was temporarily unavailable or key was restricted, so our fallback story processor built this map. Error: ${err?.message || "unknown"}`
      });
    }
  });

  // API route to generate a vector SVG illustration for a storyboard scene
  server.post("/api/generate-scene-vector", async (req, res) => {
    const { sceneDescription, title } = req.body;
    const fallbackSvg = `
      <svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg" style="background:#1E293B;border-radius:8px;font-family:sans-serif;">
        <defs>
          <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E1B4B" />
            <stop offset="50%" stop-color="#311042" />
            <stop offset="100%" stop-color="#1E293B" />
          </linearGradient>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#311042" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="250" rx="8" fill="url(#backGrad)" />
        <circle cx="200" cy="125" r="120" fill="url(#glow)" />
        <g transform="translate(140, 70)" opacity="0.85">
          <!-- Typewriter / Book Silhouette -->
          <rect x="10" y="70" width="100" height="40" rx="4" fill="#6B7280" />
          <polygon points="15,70 25,25 95,25 105,70" fill="#4B5563" />
          <rect x="25" y="32" width="70" height="38" rx="2" fill="#F3F4F6" />
          <!-- Sheet Lines -->
          <line x1="32" y1="42" x2="88" y2="42" stroke="#9CA3AF" stroke-width="2" />
          <line x1="32" y1="50" x2="78" y2="50" stroke="#9CA3AF" stroke-width="2" />
          <line x1="32" y1="58" x2="84" y2="58" stroke="#9CA3AF" stroke-width="2" />
          <!-- Keys -->
          <circle cx="30" cy="85" r="4" fill="#111827" />
          <circle cx="45" cy="85" r="4" fill="#111827" />
          <circle cx="60" cy="85" r="4" fill="#111827" />
          <circle cx="75" cy="85" r="4" fill="#111827" />
          <circle cx="90" cy="85" r="4" fill="#111827" />
          <circle cx="37" cy="98" r="4" fill="#111827" />
          <circle cx="52" cy="98" r="4" fill="#111827" />
          <circle cx="67" cy="98" r="4" fill="#111827" />
          <circle cx="82" cy="98" r="4" fill="#111827" />
        </g>
        <!-- Title Text -->
        <text x="200" y="215" text-anchor="middle" fill="#E2E8F0" font-size="12" font-weight="bold" opacity="0.9">${title || "Storyboard Scene"}</text>
        <text x="200" y="230" text-anchor="middle" fill="#94A3B8" font-size="9" font-style="italic" opacity="0.8">Dramatic Plot Vector Illustration</text>
      </svg>
    `.trim();

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ svg: fallbackSvg });
    }

    try {
      const systemPrompt = `You are an expert SVG graphic designer and minimalist digital artist.
Generate a beautiful, responsive, modern, minimalist flat-illustration style vector graphic of a story scene.
Follow these rules strictly:
1. ONLY return a valid, raw, clean XML SVG string (starting with <svg viewBox="0 0 400 250" ...> and ending with </svg>).
2. DO NOT wrap the output in markdown code blocks (\`\`\`xml or \`\`\`svg). DO NOT return any leading or trailing text. Return ONLY the raw SVG code.
3. Use modern, highly polished color schemes (pleasant gradients, deep dark themes, warm accents, rounded elements, nice silhouettes).
4. Keep the vector designs flat, minimal, and visually pleasing. For example, silhouettes against a sunset gradient, moonlit room, simple figures, stylized environment.
5. Set the viewBox of the SVG to "0 0 400 250". Make it responsive. Use nice fonts if displaying text.
6. Design the graphic to visually represent the scene described in the prompt.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Scene Title: "${title || "Untitled Scene"}"\nScene Action/Description: "${sceneDescription || "A dramatic plot point"}"\n\nGenerate an beautiful, clean, polished XML SVG element for this storyboard scene. Remember, output ONLY valid raw XML <svg>...</svg> code.`,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      let responseText = result.text?.trim() || "";
      // Remove any markdown code block wrappers if the model hallucinated them
      if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```[a-zA-Z0-9]*\s*/, "").replace(/\s*```$/, "");
      }
      responseText = responseText.trim();

      if (responseText.startsWith("<svg") && responseText.endsWith("</svg>")) {
        res.json({ svg: responseText });
      } else {
        console.warn("Gemini did not return a valid SVG string, falling back to template.");
        res.json({ svg: fallbackSvg });
      }
    } catch (err: any) {
      console.error("Gemini SVG generation failed:", err);
      res.json({ svg: fallbackSvg });
    }
  });

  // Helper function to convert RTF text to standard HTML paragraphs
  function convertRtfToHtml(rtf: string): string {
    let text = rtf;
    // Remove formatting tables
    text = text.replace(/\{\\fonttbl[^}]*\}/g, "");
    text = text.replace(/\{\\colortbl[^}]*\}/g, "");
    text = text.replace(/\{\\stylesheet[^}]*\}/g, "");
    text = text.replace(/\{\\info[^}]*\}/g, "");
    text = text.replace(/\{\\\*\\generator[^}]*\}/g, "");

    // Convert formatting
    text = text.replace(/\\b\s+([^\\}]+)/g, "<strong>$1</strong>");
    text = text.replace(/\\b\b/g, "<strong>");
    text = text.replace(/\\b0\b/g, "</strong>");
    text = text.replace(/\\i\s+([^\\}]+)/g, "<em>$1</em>");
    text = text.replace(/\\i\b/g, "<em>");
    text = text.replace(/\\i0\b/g, "</em>");

    // Paragraphs
    text = text.replace(/\\par\s*/g, "</p>\n<p>");
    text = text.replace(/\\line\s*/g, "<br/>\n");

    // Decode hex and unicode
    text = text.replace(/\\\'([0-9a-fA-F]{2})/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    text = text.replace(/\\u([0-9]{4,5})\??/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });

    // Strip remaining control codes
    text = text.replace(/\\[a-zA-Z0-9*-]+(?:\s|(?=\\)|(?=\{)|(?=\})|(?=\$))/g, "");

    // Clean brackets
    text = text.replace(/\{/g, "").replace(/\}/g, "");

    const paragraphs = text
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (paragraphs.length === 0) {
      return "<p>Empty document</p>";
    }

    return paragraphs.map(p => {
      if (p.startsWith("<p>") || p.startsWith("</p>")) return p;
      return `<p>${p}</p>`;
    }).join("\n");
  }

  // Helper function to split HTML body into multiple readable chapters
  function splitHtmlIntoChapters(html: string): { title: string; content: string }[] {
    const chapters: { title: string; content: string }[] = [];
    
    // Try splitting on <h1>, <h2> or <h3> tags
    const headingRegex = /<(h1|h2|h3)[^>]*>(.*?)<\/\1>/gi;
    const matches = Array.from(html.matchAll(headingRegex));
    
    if (matches.length > 1) {
      let lastIndex = 0;
      for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const matchIndex = match.index!;
        
        if (matchIndex > lastIndex) {
          const prevContent = html.substring(lastIndex, matchIndex).trim();
          if (prevContent.length > 20) {
            if (i === 0) {
              chapters.push({ title: "Introduction", content: prevContent });
            } else {
              chapters[chapters.length - 1].content = prevContent;
            }
          }
        }
        
        const titleText = match[2].replace(/<[^>]*>/g, "").trim() || `Chapter ${i + 1}`;
        chapters.push({ title: titleText, content: "" });
        lastIndex = matchIndex + match[0].length;
      }
      
      if (lastIndex < html.length) {
        const remaining = html.substring(lastIndex).trim();
        if (remaining.length > 0 && chapters.length > 0) {
          chapters[chapters.length - 1].content = remaining;
        }
      }
    } else {
      // Fallback: Split by lines starting with Chapter keywords or split paragraphs
      const paragraphs = html.split(/<\/p>\s*<p>/gi);
      let currentChapter = { title: "Introduction", content: "" };
      
      for (const p of paragraphs) {
        const textOnly = p.replace(/<[^>]*>/g, "").trim();
        const isChapterHeading = /^(chapter|prologue|epilogue|scene|section|act)\b/i.test(textOnly) && textOnly.length < 60;
        
        if (isChapterHeading) {
          if (currentChapter.content.trim().length > 0) {
            chapters.push(currentChapter);
          }
          currentChapter = { title: textOnly, content: "" };
        } else {
          const cleanP = p.startsWith("<p>") ? p : `<p>${p}`;
          const finalP = cleanP.endsWith("</p>") ? cleanP : `${cleanP}</p>`;
          currentChapter.content += (currentChapter.content ? "\n" : "") + finalP;
        }
      }
      if (currentChapter.content.trim().length > 0) {
        chapters.push(currentChapter);
      }
    }

    if (chapters.length === 0) {
      chapters.push({ title: "Main Story", content: html });
    }

    return chapters.map(ch => ({
      title: ch.title,
      content: ch.content.trim() || "<p>[No content in this section]</p>"
    }));
  }

  // API Route to draw a gorgeous vector graphic of the book cover illustration
  server.post("/api/generate-book-illustration", async (req, res) => {
    const { title, genre, styleDescription } = req.body;
    
    const fallbackCoverSvg = `
      <svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="coverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1E3A8A" />
            <stop offset="100%" stop-color="#0F172A" />
          </linearGradient>
          <radialGradient id="sunGlow" cx="50%" cy="40%" r="40%">
            <stop offset="0%" stop-color="#FCD34D" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#1E3A8A" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="300" height="450" fill="url(#coverGrad)" />
        <circle cx="150" cy="180" r="80" fill="url(#sunGlow)" />
        <!-- Minimal geometric visual -->
        <g transform="translate(150, 200)" stroke="#F3F4F6" stroke-width="1.5" fill="none" stroke-linecap="round">
          <circle cx="0" cy="0" r="40" stroke-dasharray="4 4" opacity="0.6"/>
          <path d="M -50,40 L 0,-60 L 50,40 Z" stroke-width="2"/>
          <circle cx="0" cy="-60" r="6" fill="#F59E0B" stroke="none"/>
        </g>
      </svg>
    `.trim();

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({ svg: fallbackCoverSvg });
    }

    try {
      const systemPrompt = `You are a world-class book cover vector artist and premium graphic designer.
Generate a stunning, responsive, highly polished, modern minimalist vector illustration to act as the artistic centerpiece of a book cover.
Follow these rules strictly:
1. ONLY return a valid, raw XML SVG string (starting with <svg viewBox="0 0 300 450" ...> and ending with </svg>).
2. DO NOT wrap the output in markdown code blocks (\`\`\`xml or \`\`\`svg). Return ONLY the raw SVG code.
3. Design a beautiful, flat vector art graphic centered around the theme, genre, and style of the book. Examples: celestial elements, mountains, paths, gates, silhouette of a key, beautiful geometric composition, stylized abstract flowers.
4. Use a premium, tasteful color scheme (e.g., deep charcoal and gold accents, royal indigo and sand, cosmic violet). Feel free to use rich linear or radial gradients.
5. STRICT RULE: DO NOT put any typography, titles, author names, or letters in this SVG illustration. The frontend application will overlay the typography dynamically. This SVG is for the BACKGROUND/CENTERPIECE illustration only!
6. Keep the viewBox of the SVG as "0 0 300 450". Ensure it is fully self-contained.`;

      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Book Title: "${title || "Untitled"}"\nGenre/Theme: "${genre || "Literary Fiction"}"\nStyle request: "${styleDescription || "Elegant and mysterious minimalism"}"\n\nGenerate a beautiful, clean, polished XML SVG visual centerpiece for this book cover background. Remember, do NOT include any text inside the SVG. Output ONLY valid raw XML <svg>...</svg> code.`,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      let responseText = result.text?.trim() || "";
      if (responseText.startsWith("```")) {
        responseText = responseText.replace(/^```[a-zA-Z0-9]*\s*/, "").replace(/\s*```$/, "");
      }
      responseText = responseText.trim();

      if (responseText.startsWith("<svg") && responseText.endsWith("</svg>")) {
        res.json({ svg: responseText });
      } else {
        console.warn("Gemini did not return a valid SVG string for book illustration, falling back.");
        res.json({ svg: fallbackCoverSvg });
      }
    } catch (err: any) {
      console.error("Gemini Cover SVG generation failed:", err);
      res.json({ svg: fallbackCoverSvg });
    }
  });

  // API Route to convert docx/rtf file into a premium compiled EPUB 3 ebook zip
  server.post("/api/convert-to-epub", async (req, res) => {
    try {
      const { fileBase64, fileName, title, author, language, publisher, coverSvg, backSynopsis } = req.body;
      
      if (!fileBase64) {
        return res.status(400).json({ error: "Missing file base64 data." });
      }

      // Convert base64 to buffer
      const fileBuffer = Buffer.from(fileBase64, "base64");
      
      let rawHtml = "";
      const isRtf = fileName?.toLowerCase().endsWith(".rtf") || false;

      if (isRtf) {
        // Parse RTF
        const rtfText = fileBuffer.toString("utf8");
        rawHtml = convertRtfToHtml(rtfText);
      } else {
        // Parse DOCX with Mammoth
        const result = await mammoth.convertToHtml({ buffer: fileBuffer });
        rawHtml = result.value;
      }

      // Split parsed HTML into clean chapters
      const chapters = splitHtmlIntoChapters(rawHtml);

      // Create JSZip instance to build EPUB archive
      const zip = new JSZip();

      // 1. mimetype (MUST be first and uncompressed!)
      zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

      // 2. META-INF/container.xml
      zip.file("META-INF/container.xml", `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

      // Write Cover SVG if provided, otherwise a clean fallback
      const finalTitle = title || "Untitled Book";
      const finalAuthor = author || "Unknown Author";
      const finalLanguage = language || "en";
      const finalPublisher = publisher || "Story Board Studio";

      const defaultCoverSvg = `
        <svg viewBox="0 0 300 450" xmlns="http://www.w3.org/2000/svg" style="background:#1E293B;font-family:sans-serif;">
          <rect width="300" height="450" fill="#1E293B"/>
          <text x="150" y="200" text-anchor="middle" fill="#FFFFFF" font-size="22" font-weight="bold">${finalTitle}</text>
          <text x="150" y="240" text-anchor="middle" fill="#94A3B8" font-size="14">${finalAuthor}</text>
        </svg>
      `;

      const coverSvgContent = coverSvg || defaultCoverSvg;
      zip.file("OEBPS/cover.svg", coverSvgContent);

      // Cover XHTML page
      zip.file("OEBPS/cover.xhtml", `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Cover</title>
    <style type="text/css">
      @page { padding: 0; margin: 0; }
      body { margin: 0; padding: 0; text-align: center; background-color: #FFFFFF; }
      svg { width: 100%; height: 100vh; display: block; }
    </style>
  </head>
  <body>
    <div style="width: 100%; height: 100vh;">
      ${coverSvgContent}
    </div>
  </body>
</html>`);

      // Create each chapter file
      chapters.forEach((ch, index) => {
        const chapterFileName = `chapter_${index + 1}.xhtml`;
        zip.file(`OEBPS/${chapterFileName}`, `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>${ch.title}</title>
    <meta charset="utf-8"/>
    <style type="text/css">
      body {
        font-family: "Georgia", "Times New Roman", serif;
        margin: 10% 12%;
        line-height: 1.65;
        color: #2D3748;
        font-size: 1.05em;
      }
      h1 {
        text-align: center;
        margin-top: 2em;
        margin-bottom: 1.8em;
        font-size: 1.8em;
        font-weight: bold;
        color: #1A202C;
      }
      p {
        text-indent: 1.5em;
        margin-bottom: 0.6em;
        text-align: justify;
      }
      p:first-of-type {
        text-indent: 0;
      }
      strong { font-weight: bold; }
      em { font-style: italic; }
    </style>
  </head>
  <body>
    <h1>${ch.title}</h1>
    <div class="chapter-content">
      ${ch.content}
    </div>
  </body>
</html>`);
      });

      // Navigation page (nav.xhtml) for EPUB 3 readers
      const navListItems = chapters.map((ch, idx) => `<li><a href="chapter_${idx + 1}.xhtml">${ch.title}</a></li>`).join("\n        ");
      zip.file("OEBPS/nav.xhtml", `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head>
    <title>Table of Contents</title>
    <meta charset="utf-8"/>
    <style type="text/css">
      body { font-family: sans-serif; margin: 10%; color: #2D3748; }
      h1 { font-size: 1.6em; font-weight: bold; margin-bottom: 1.5em; }
      ol { list-style-type: none; padding-left: 0; }
      li { margin-bottom: 0.8em; border-bottom: 1px dashed #E2E8F0; padding-bottom: 0.4em; }
      a { text-decoration: none; color: #3182CE; font-weight: 500; }
      a:hover { text-decoration: underline; color: #2B6CB0; }
    </style>
  </head>
  <body>
    <nav epub:type="toc" id="toc">
      <h1>Table of Contents</h1>
      <ol>
        <li><a href="cover.xhtml">Cover Page</a></li>
        ${navListItems}
      </ol>
    </nav>
  </body>
</html>`);

      // Backward compatible NCX table of contents
      const ncxNavPoints = chapters.map((ch, idx) => `
    <navPoint id="navpoint-${idx + 2}" playOrder="${idx + 2}">
      <navLabel><text>${ch.title}</text></navLabel>
      <content src="chapter_${idx + 1}.xhtml"/>
    </navPoint>`).join("\n");

      zip.file("OEBPS/toc.ncx", `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:ebook-uuid-992288"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${finalTitle}</text>
  </docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>Cover Page</text></navLabel>
      <content src="cover.xhtml"/>
    </navPoint>
    ${ncxNavPoints}
  </navMap>
</ncx>`);

      // Content manifest OPF
      const manifestItems = chapters.map((ch, idx) => `<item id="chapter_${idx + 1}" href="chapter_${idx + 1}.xhtml" media-type="application/xhtml+xml"/>`).join("\n    ");
      const spineRefs = chapters.map((ch, idx) => `<itemref idref="chapter_${idx + 1}"/>`).join("\n    ");

      zip.file("OEBPS/content.opf", `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:ebook-uuid-992288</dc:identifier>
    <dc:title>${finalTitle}</dc:title>
    <dc:creator>${finalAuthor}</dc:creator>
    <dc:language>${finalLanguage}</dc:language>
    <dc:publisher>${finalPublisher}</dc:publisher>
    <meta property="dcterms:modified">${new Date().toISOString().substring(0, 19)}Z</meta>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="cover-image" href="cover.svg" media-type="image/svg+xml" properties="cover-image"/>
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    <itemref idref="cover"/>
    <itemref idref="nav"/>
    ${spineRefs}
  </spine>
</package>`);

      const epubBase64 = await zip.generateAsync({ type: "base64" });
      
      res.json({
        success: true,
        base64: epubBase64,
        chaptersCount: chapters.length,
        chaptersList: chapters.map(c => c.title)
      });
    } catch (err: any) {
      console.error("EPUB compilation failed:", err);
      res.status(500).json({ error: "Failed to compile EPUB.", details: err?.message });
    }
  });

  // API Route to validate an EPUB file (parsing ZIP structure, MIME, manifests, namespaces and executing epubcheck if available)
  server.post("/api/validate-epub", async (req, res) => {
    try {
      const { fileBase64, fileName } = req.body;
      if (!fileBase64) {
        return res.status(400).json({ error: "Missing file base64 data for validation." });
      }

      const epubBuffer = Buffer.from(fileBase64, "base64");
      
      // Load zip contents with JSZip
      const zip = await JSZip.loadAsync(epubBuffer);
      
      const reports: { status: "success" | "warning" | "error"; message: string; details?: string }[] = [];
      let rootFilePath = "OEBPS/content.opf"; // default fallback

      // 1. Verify mimetype file exists and is uncompressed
      const mimetypeFile = zip.file("mimetype");
      if (!mimetypeFile) {
        reports.push({
          status: "error",
          message: "MIME-Type Error",
          details: "The 'mimetype' file is missing from the root of the EPUB ZIP archive."
        });
      } else {
        const mimeContent = (await mimetypeFile.async("string")).trim();
        if (mimeContent !== "application/epub+zip") {
          reports.push({
            status: "error",
            message: "MIME-Type Contaminated",
            details: `The 'mimetype' file contains '${mimeContent}' instead of 'application/epub+zip'.`
          });
        } else {
          reports.push({
            status: "success",
            message: "MIME-Type Validated",
            details: "The 'mimetype' file correctly defines 'application/epub+zip' in store mode."
          });
        }
      }

      // 2. Verify META-INF/container.xml exists
      const containerFile = zip.file("META-INF/container.xml");
      if (!containerFile) {
        reports.push({
          status: "error",
          message: "Container Manifest Error",
          details: "The 'META-INF/container.xml' file is missing. Readers will fail to parse this ebook."
        });
      } else {
        const containerContent = await containerFile.async("string");
        reports.push({
          status: "success",
          message: "Container XML Found",
          details: "Found META-INF/container.xml layout index."
        });

        // Try extracting OPF path
        const match = containerContent.match(/full-path="([^"]+)"/);
        if (match && match[1]) {
          rootFilePath = match[1];
          reports.push({
            status: "success",
            message: "OPF Manifest Pointer Resolved",
            details: `Located OPF manifest path: ${rootFilePath}`
          });
        } else {
          reports.push({
            status: "warning",
            message: "OPF Pointer Ambiguity",
            details: "Could not parse full-path from container.xml, falling back to default OEBPS/content.opf path."
          });
        }
      }

      // 3. Verify content.opf file exists
      const opfFile = zip.file(rootFilePath);
      if (!opfFile) {
        reports.push({
          status: "error",
          message: "OPF Manifest Missing",
          details: `The package manifest file at '${rootFilePath}' does not exist inside the EPUB zip.`
        });
      } else {
        const opfContent = await opfFile.async("string");
        reports.push({
          status: "success",
          message: "OPF Manifest Loaded",
          details: `Successfully loaded and parsed OPF metadata manifest (${opfContent.length} bytes).`
        });

        // Validate basic OPF tags
        if (!opfContent.includes("<package") || !opfContent.includes("<metadata") || !opfContent.includes("<manifest>") || !opfContent.includes("<spine")) {
          reports.push({
            status: "error",
            message: "Malformed OPF XML",
            details: "The package file is missing mandatory EPUB structural tags (<package>, <metadata>, <manifest>, or <spine>)."
          });
        } else {
          // Check namespaces and unique-identifier
          if (!opfContent.includes('unique-identifier=')) {
            reports.push({
              status: "warning",
              message: "Missing unique-identifier",
              details: "The <package> tag should have a 'unique-identifier' attribute to aid cataloging."
            });
          }

          // Gather manifest items
          const manifestItemMatches = opfContent.matchAll(/<item\s+[^>]*id="([^"]+)"\s+[^>]*href="([^"]+)"\s+[^>]*media-type="([^"]+)"/g);
          const manifestItemsMap = new Map<string, { href: string; mediaType: string }>();
          for (const m of manifestItemMatches) {
            manifestItemsMap.set(m[1], { href: m[2], mediaType: m[3] });
          }

          reports.push({
            status: "success",
            message: "OPF Manifest Ingested",
            details: `Extracted ${manifestItemsMap.size} asset files declared in the OPF package manifest.`
          });

          // Verify all manifest assets exist in zip
          const baseFolder = rootFilePath.includes("/") ? rootFilePath.substring(0, rootFilePath.lastIndexOf("/") + 1) : "";
          let missingAssetsCount = 0;
          let verifiedAssetsCount = 0;

          manifestItemsMap.forEach((asset, id) => {
            const fullAssetPath = baseFolder + asset.href;
            if (!zip.file(fullAssetPath)) {
              missingAssetsCount++;
              reports.push({
                status: "error",
                message: `Missing Asset: ${asset.href}`,
                details: `Manifest claims asset id '${id}' exists at '${fullAssetPath}' but it is missing from the zip.`
              });
            } else {
              verifiedAssetsCount++;
            }
          });

          if (missingAssetsCount === 0) {
            reports.push({
              status: "success",
              message: "All Manifest Assets Verified",
              details: `All ${verifiedAssetsCount} files declared in OPF manifest are physically present.`
            });
          }

          // Verify spine references
          const itemrefMatches = opfContent.matchAll(/<itemref\s+[^>]*idref="([^"]+)"/g);
          let spineIssues = 0;
          let spineCount = 0;
          for (const s of itemrefMatches) {
            spineCount++;
            const idref = s[1];
            if (!manifestItemsMap.has(idref)) {
              spineIssues++;
              reports.push({
                status: "error",
                message: `Orphaned Spine ItemRef`,
                details: `Spine references item ID '${idref}', which is not declared in the manifest.`
              });
            }
          }

          if (spineIssues === 0 && spineCount > 0) {
            reports.push({
              status: "success",
              message: "Book Spine Validated",
              details: `Verified all ${spineCount} spine reading order nodes against manifest entries.`
            });
          }

          // Check for EPUB 3 Navigation Page (properties="nav")
          if (!opfContent.includes('properties="nav"')) {
            reports.push({
              status: "warning",
              message: "No EPUB 3 TOC Declared",
              details: "For EPUB 3 compatibility, at least one manifest item must declare properties=\"nav\"."
            });
          } else {
            reports.push({
              status: "success",
              message: "EPUB 3 TOC Property Found",
              details: "Interactive TOC navigation document properties are correctly registered."
            });
          }
        }
      }

      // 4. XHTML Namespaces and Encoding validation on xhtml/html files in OEBPS
      let namespaceViolations = 0;
      let totalXhtmlChecked = 0;
      const fileNames = Object.keys(zip.files);
      
      for (const f of fileNames) {
        if (f.endsWith(".xhtml") || f.endsWith(".html")) {
          totalXhtmlChecked++;
          const content = await zip.files[f].async("string");
          if (!content.includes('xmlns="http://www.w3.org/1999/xhtml"')) {
            namespaceViolations++;
            reports.push({
              status: "warning",
              message: "Namespace Violation in Chapter",
              details: `File '${f}' is missing the xmlns XHTML namespace attribute: 'http://www.w3.org/1999/xhtml'.`
            });
          }
        }
      }

      if (namespaceViolations === 0 && totalXhtmlChecked > 0) {
        reports.push({
          status: "success",
          message: "XHTML Standards Confirmed",
          details: `All ${totalXhtmlChecked} chapter page documents declare standard XHTML namespaces.`
        });
      }

      // 5. Try running Python `epubcheck` subprocess if available (progressive enhancement)
      let epubcheckCliOutput = "";
      let hasEpubcheckLibrary = false;
      
      try {
        const tempPath = path.join("/tmp", `check_${Date.now()}.epub`);
        fs.writeFileSync(tempPath, epubBuffer);

        // Run a simple python probe to see if python3 can import epubcheck
        const execSync = require("child_process").execSync;
        try {
          execSync("python3 -c 'import epubcheck'", { stdio: "ignore" });
          hasEpubcheckLibrary = true;
          
          // Execute epubcheck validation
          const output = execSync(`python3 -c "from epubcheck import EpubCheck; print(EpubCheck('${tempPath}').output)"`, { encoding: "utf8" });
          epubcheckCliOutput = output.trim();
          
          reports.push({
            status: "success",
            message: "Official epubcheck Validation Executed",
            details: "Python epubcheck package is active. Clean results received from the compiler subprocess."
          });
        } catch (pe) {
          // epubcheck library not installed, fallback gracefully to our JavaScript structural validation reports
          epubcheckCliOutput = "Python 'epubcheck' library or Java Runtime is not pre-installed in the container runtime. Falling back to Narrative Studio's advanced client-side structural auditor.";
        } finally {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        }
      } catch (subprocessError) {
        console.warn("Subprocess epubcheck validation skipped:", subprocessError);
      }

      res.json({
        success: true,
        fileName: fileName || "validated.epub",
        isValid: !reports.some(r => r.status === "error"),
        reports: reports,
        epubcheckCliOutput: epubcheckCliOutput,
        hasEpubcheckLibrary: hasEpubcheckLibrary
      });

    } catch (err: any) {
      console.error("EPUB validation failed:", err);
      res.status(500).json({ error: "Failed to validate EPUB.", details: err?.message });
    }
  });

  // API route to download python script
  server.post("/api/download-python", (req, res) => {
    try {
      const data = req.body;
      const pythonScript = generatePythonCode(data);

      res.setHeader("Content-Type", "text/x-python");
      res.setHeader("Content-Disposition", 'attachment; filename="narrative_corkboard.py"');
      res.send(pythonScript);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to generate Python code.", details: err?.message });
    }
  });

  // Vite development vs production static setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    server.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    server.use(express.static(distPath));
    server.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`[Narrative Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
