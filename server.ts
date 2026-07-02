import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini SDK to prevent startup crashes if key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined in Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API endpoint for luxury fragrance AI curation
app.post("/api/curate", async (req, res) => {
  try {
    const { name, email, preference } = req.body;

    if (!name || !preference) {
      return res.status(400).json({ error: "Name and olfactory preference are required." });
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are a legendary master perfumer for AETHERIA, a prestigious high-fashion luxury digital fragrance house.
AETHERIA targets a highly discerning, sophisticated audience that values silent luxury, extreme negative space, structural minimalism, and poetic emotional narratives.
Your job is to craft a highly customized, bespoke luxury perfume match based on the wearer's personal details.
Return a structured JSON object containing a unique perfume name, three high-fashion ingredients notes, an atmospheric story, a description of the personality this fits, and a specific wear scenario.`;

    const userPrompt = `Wearer Name: ${name}
Olfactory Family Preference: ${preference}

Design a custom bespoke Aetheria fragrance for them. Ensure the response format strictly adheres to the requested JSON structure.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [userPrompt],
      config: {
        systemInstruction: systemPrompt,
        temperature: 1.0,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "The name of the custom bespoke fragrance (e.g. 'Santal Concrete', 'Citrus Obscura').",
            },
            notes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly three raw luxury ingredients / notes (e.g., 'Bergamot peel', 'Charcoal ash', 'Midnight Amber').",
            },
            story: {
              type: Type.STRING,
              description: "A gorgeous, high-fashion poetic 2-3 sentence narrative describing the scent's atmosphere and emotional texture.",
            },
            personality: {
              type: Type.STRING,
              description: "A description of the wearer's inner archetype (e.g., 'The quiet intellectual who speaks through absolute restraint').",
            },
            wearScenario: {
              type: Type.STRING,
              description: "An exact, elegant scenario for wearing this fragrance (e.g., 'Sprayed sparingly onto heavyweight raw linen before a midnight stroll in Kyoto').",
            },
            price: {
              type: Type.INTEGER,
              description: "A luxury price point in USD, typically between 200 and 280.",
            },
          },
          required: ["name", "notes", "story", "personality", "wearScenario", "price"],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response text received from the AI model.");
    }

    const curatedData = JSON.parse(resultText.trim());
    return res.json(curatedData);
  } catch (error: any) {
    console.error("Gemini Curation Error:", error);
    // If the key is missing or there's a problem, we fall back to a beautiful, pre-curated template
    // rather than failing completely, so the user always has a perfect experience!
    const fallbackScents: Record<string, any> = {
      "Woody & Warm": {
        name: "Santal Concrete",
        notes: ["Australian Sandalwood", "Brushed Metal", "Crushed Cardamom"],
        story: "A quiet study of density. Cold structural cement meets the buttery, ancient cream of pure sandalwood, suspended in a state of absolute, elegant stasis.",
        personality: "The quiet intellectual who speaks in low tones and appreciates physical materials.",
        wearScenario: "Sprayed on a heavy charcoal cashmere scarf before a gallery opening in Tribeca.",
        price: 220
      },
      "Fresh & Citrus": {
        name: "Citrus Obscura",
        notes: ["Charred Grapefruit", "Salted Vetiver", "Petrichor"],
        story: "A flash of white light. A hyper-sharp opening of carbonized citrus peel falling onto wet volcanic stones after a midsummer storm.",
        personality: "The modern purist who thrives in stark daylight and demands ultimate geometric clarity.",
        wearScenario: "Worn on a crisp, white poplin collar for high-intensity afternoon sessions.",
        price: 210
      },
      "Floral & Airy": {
        name: "Aether Iris",
        notes: ["Powdery Iris Root", "Crisp Aldehydes", "White Suede"],
        story: "The weightless texture of a clean canvas. Fine, rooty iris powder layered over high-altitude aldehydes that mimic cold mountain air.",
        personality: "The fluid visionary whose work exists on the threshold between physical form and ether.",
        wearScenario: "Sprayed onto bare shoulders or silk shirts for quiet dinners overlooking the city.",
        price: 230
      },
      "Dark & Spicy": {
        name: "Saffron Noir",
        notes: ["Midnight Saffron", "Aged Laphroaig Oak", "Burnt Incense"],
        story: "An immersive inkwell. Dark saffron fibers steeped in peat-rich oak casks, releasing a smoky warmth that curls into the night.",
        personality: "The nocturnal creator who commands the room through absolute silence.",
        wearScenario: "Sparsely misted onto black wool coats prior to high-stakes late-night conversations.",
        price: 240
      }
    };

    const preference = req.body.preference || "Woody & Warm";
    const fallback = fallbackScents[preference] || fallbackScents["Woody & Warm"];
    
    // Customize fallback name slightly if provided
    const userName = req.body.name || "Seeker";
    fallback.story = `${userName}'s signature. ${fallback.story}`;

    return res.json({
      ...fallback,
      isFallback: true,
      errorDetail: error.message
    });
  }
});

// Serve static assets and handle routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
