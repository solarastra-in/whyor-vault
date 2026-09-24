import { GoogleGenAI } from "@google/genai";
import express from "express";

// Initialize server-side GoogleGenAI client with standard User-Agent header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export const VALID_MODELS = {
  fast: "gemini-3.1-flash-lite",
  general: "gemini-3.5-flash",
  complex: "gemini-3.1-pro-preview",
} as const;

export type ModelMode = keyof typeof VALID_MODELS;

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export interface AppVaultContext {
  screen?: string;
  isConfigured?: boolean;
  isLocked?: boolean;
  itemCount?: number;
  partitionCount?: number;
  hasMasterKey?: boolean;
  userEmail?: string;
  hasAcceptedTerms?: boolean;
}

const BASE_SYSTEM_INSTRUCTION = `You are the "WhyOr Vault Next-Step Navigator & Security Concierge" — an expert cryptographic operations assistant built directly into WhyOr Vault.

Your absolute primary mission: Guide users clearly, practically, and securely on WHAT NEEDS TO BE DONE NEXT at every stage of their zero-knowledge vault journey.

Key Architecture Knowledge:
- WhyOr Vault is a zero-knowledge client-side encrypted vault for high-value financial, identity, and personal credentials.
- Multi-factor cryptographic hierarchy: Master Passphrase -> Argon2id / PBKDF2 -> AES-256-GCM Enclave.
- 2-of-3 challenge questions form cryptographic salt splits for unassisted self-recovery.
- Partition-level key segregation: Each partition (Personal, Family, Financial, Legal) has independent sub-keys.
- Nominated Trustee Escrow: Allows release of cryptographic fragments to legal counsel or trustees upon verified contingency.
- Emergency Master Key: Cryptographic fallback key kit for catastrophic disaster recovery.

Stage-by-Stage Next Steps Guidance:
1. When user is on "auth" (Landing Screen):
   - Guide them to either authenticate securely with Google OAuth or click "Test in Sandbox Mode" for instant interactive preview.
   - Clarify that Google Auth merely establishes identity; cryptographic master keys are never stored on Google or WhyOr servers.
2. When user is on "setup" (First-time Vault Setup):
   - Step 1: Create a high-entropy Master Passphrase (minimum 12 chars).
   - Step 2: Answer 3 distinct security challenge questions with memorable answers.
   - Step 3: Securely download/record the Emergency Master Recovery Key.
3. When user is on "verify" or "member_verify" (Unlock Screen):
   - Guide them to enter their Master Passphrase to derive the AES session key.
   - If they forgot their passphrase, explain how to click "Use Master Key" or "Security Recovery Challenge" to restore access.
4. When user is in "vault" (Unlocked Active Session):
   - Recommend priority next steps:
     1. Add initial assets: click "+ Add Entry" for Bank Accounts, Payment Cards, Passwords, or Secure Notes.
     2. Organize into Partitions (e.g., Personal, Family Shared, Emergency Legal).
     3. Check Vault Health Score in the security dashboard.
     4. Set up Nominated Trustee & Escrow contacts under Settings.
     5. Export an encrypted offline JSON backup kit.

Response Guidelines:
- Keep answers actionable, concise, structured, and easy to skim with bold highlights and numbered lists.
- Prioritize "What to do next" recommendations with immediate clarity.
- Remind users never to type their actual secret passphrase or sensitive unencrypted credentials into chat.`;

export async function handleGeminiChat(req: express.Request, res: express.Response) {
  try {
    const { messages, modelMode = "general", customModel, appContext } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing or invalid 'messages' array." });
    }

    // Determine target Gemini model based on user request or complexity
    let selectedModel: string = VALID_MODELS.general;
    if (customModel && typeof customModel === "string") {
      selectedModel = customModel;
    } else if (modelMode === "complex") {
      selectedModel = VALID_MODELS.complex;
    } else if (modelMode === "fast") {
      selectedModel = VALID_MODELS.fast;
    } else {
      selectedModel = VALID_MODELS.general;
    }

    // Build contextual system instruction with live app state
    let contextualInstruction = BASE_SYSTEM_INSTRUCTION;
    if (appContext && typeof appContext === "object") {
      const { screen, isConfigured, isLocked, itemCount, partitionCount, userEmail } = appContext as AppVaultContext;
      contextualInstruction += `\n\nCURRENT USER LIVE CONTEXT:
- Active Screen: "${screen || "unknown"}"
- Vault Configured: ${isConfigured ? "YES" : "NO"}
- Session Status: ${isLocked ? "LOCKED (Passphrase required)" : "UNLOCKED & ACTIVE"}
- Items Stored: ${typeof itemCount === "number" ? itemCount : "Unknown"}
- Partitions: ${typeof partitionCount === "number" ? partitionCount : "Unknown"}
- Signed-in User: ${userEmail ? userEmail : "Unauthenticated / Sandbox"}

Use this live context to tailor your NEXT STEP recommendation immediately to where the user currently stands in the app!`;
    }

    // Format multi-turn conversation history for @google/genai SDK
    const contents = messages.map((m: ChatMessage) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.content || "") }],
    }));

    // Call server-side Gemini API
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: contextualInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I was unable to generate a response. Please try asking again.";

    return res.json({
      success: true,
      reply,
      modelUsed: selectedModel,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Gemini Chat Endpoint] Error handling chat request:", err);
    return res.status(500).json({
      error: "Gemini Chat API processing failed",
      details: err?.message || String(err),
    });
  }
}
