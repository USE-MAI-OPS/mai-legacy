/**
 * AI client abstraction for interview transcript extraction.
 *
 * Supports two providers:
 *   1. Ollama (self-hosted, primary)
 *   2. OpenRouter (cloud fallback)
 *
 * The client tries Ollama first. If it's unavailable or times out,
 * it automatically falls back to OpenRouter.
 */

import type { AIProvider } from "./types";

const OLLAMA_TIMEOUT_MS = 10_000; // 10 seconds to detect if Ollama is up
const OLLAMA_REQUEST_TIMEOUT_MS = 60_000; // 60 seconds per chunk

interface AIClientOptions {
  provider?: AIProvider;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

/**
 * Get the configured AI provider settings.
 */
function getConfig(options?: AIClientOptions) {
  return {
    provider: (options?.provider ||
      process.env.TRANSCRIPT_AI_PROVIDER ||
      "ollama") as AIProvider,
    ollamaBaseUrl:
      options?.ollamaBaseUrl ||
      process.env.OLLAMA_BASE_URL ||
      "http://localhost:11434",
    ollamaModel: options?.ollamaModel || process.env.OLLAMA_MODEL || "llama3.2",
    openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
    openrouterModel: "meta-llama/llama-3.1-8b-instruct:free",
  };
}

/**
 * Check if Ollama is available by pinging its API.
 */
async function isOllamaAvailable(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Call Ollama's generate endpoint with JSON mode.
 */
async function callOllama(
  prompt: string,
  baseUrl: string,
  model: string
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    OLLAMA_REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        format: "json",
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 4096,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama error (${response.status}): ${error}`);
    }

    const json = (await response.json()) as { response: string };
    return json.response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

/**
 * Call OpenRouter's chat completions endpoint.
 */
async function callOpenRouter(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        "X-Title": "MAI Legacy - Interview Extraction",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${error}`);
  }

  const json = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  return json.choices[0]?.message?.content || "";
}

/**
 * Send a prompt to the AI and get a JSON response string.
 *
 * Tries Ollama first, falls back to OpenRouter if Ollama is unavailable.
 * Returns the raw JSON string and which provider was used.
 */
export async function queryAI(
  prompt: string,
  options?: AIClientOptions
): Promise<{ response: string; provider: AIProvider }> {
  const config = getConfig(options);

  // If explicitly set to openrouter, skip Ollama
  if (config.provider === "openrouter") {
    if (!config.openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY is required when using OpenRouter provider");
    }
    const response = await callOpenRouter(
      prompt,
      config.openrouterApiKey,
      config.openrouterModel
    );
    return { response, provider: "openrouter" };
  }

  // Try Ollama first
  const ollamaUp = await isOllamaAvailable(config.ollamaBaseUrl);

  if (ollamaUp) {
    try {
      const response = await callOllama(
        prompt,
        config.ollamaBaseUrl,
        config.ollamaModel
      );
      return { response, provider: "ollama" };
    } catch (error) {
      console.warn(
        "[interview] Ollama call failed, falling back to OpenRouter:",
        error
      );
    }
  } else {
    console.warn(
      "[interview] Ollama not available, falling back to OpenRouter"
    );
  }

  // Fallback to OpenRouter
  if (!config.openrouterApiKey) {
    throw new Error(
      "Ollama is unavailable and OPENROUTER_API_KEY is not set. Cannot process transcript."
    );
  }

  const response = await callOpenRouter(
    prompt,
    config.openrouterApiKey,
    config.openrouterModel
  );
  return { response, provider: "openrouter" };
}
