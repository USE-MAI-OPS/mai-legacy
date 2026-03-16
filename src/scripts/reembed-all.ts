/**
 * Re-embed all existing entries.
 *
 * This script fetches every entry from the database (using the service role
 * key to bypass RLS), chunks their content, generates OpenAI embeddings, and
 * upserts the embedding rows.
 *
 * Usage:  npx tsx src/scripts/reembed-all.ts
 *
 * Requires these env vars in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually (no dotenv dependency)
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local not found, rely on existing env vars
  }
}
loadEnv();

// ---------- env ----------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
  console.error("Missing required env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY)");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- chunker (inline copy from src/lib/rag/chunker.ts) ----------
const CHARS_PER_TOKEN = 4;
const TARGET_CHUNK_TOKENS = 500;
const OVERLAP_TOKENS = 50;
const TARGET_CHUNK_CHARS = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN;
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN;

function splitParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function getOverlapParts(parts: string[]): string[] {
  const overlap: string[] = [];
  let length = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    const added = parts[i].length + (overlap.length > 0 ? 2 : 0);
    if (length + added > OVERLAP_CHARS) break;
    overlap.unshift(parts[i]);
    length += added;
  }
  return overlap;
}

function getOverlapSentences(sentences: string[]): string[] {
  const overlap: string[] = [];
  let length = 0;
  for (let i = sentences.length - 1; i >= 0; i--) {
    const added = sentences[i].length + (overlap.length > 0 ? 1 : 0);
    if (length + added > OVERLAP_CHARS) break;
    overlap.unshift(sentences[i]);
    length += added;
  }
  return overlap;
}

function chunkBySentences(paragraph: string): string[] {
  const sentences = splitSentences(paragraph);
  if (sentences.length === 0) return [paragraph];
  const chunks: string[] = [];
  let current: string[] = [];
  let currentLen = 0;
  for (const sentence of sentences) {
    const addition = currentLen > 0 ? sentence.length + 1 : sentence.length;
    if (currentLen + addition > TARGET_CHUNK_CHARS && current.length > 0) {
      chunks.push(current.join(" "));
      const overlap = getOverlapSentences(current);
      current = overlap;
      currentLen = current.join(" ").length;
    }
    current.push(sentence);
    currentLen += addition;
  }
  if (current.length > 0) {
    const text = current.join(" ").trim();
    if (text) chunks.push(text);
  }
  return chunks;
}

function chunkText(text: string): { text: string; index: number }[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= TARGET_CHUNK_CHARS) {
    return [{ text: trimmed, index: 0 }];
  }
  const paragraphs = splitParagraphs(trimmed);
  const chunks: { text: string; index: number }[] = [];
  let currentParts: string[] = [];
  let currentLength = 0;
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    if (paragraph.length > TARGET_CHUNK_CHARS) {
      if (currentParts.length > 0) {
        chunks.push({ text: currentParts.join("\n\n"), index: chunkIndex++ });
        currentParts = getOverlapParts(currentParts);
        currentLength = currentParts.reduce((sum, p) => sum + p.length, 0);
      }
      const sentenceChunks = chunkBySentences(paragraph);
      for (const sc of sentenceChunks) {
        chunks.push({ text: sc, index: chunkIndex++ });
      }
      currentParts = [];
      currentLength = 0;
      continue;
    }
    const newLength = currentLength + (currentParts.length > 0 ? 2 : 0) + paragraph.length;
    if (newLength > TARGET_CHUNK_CHARS && currentParts.length > 0) {
      chunks.push({ text: currentParts.join("\n\n"), index: chunkIndex++ });
      currentParts = getOverlapParts(currentParts);
      currentLength = currentParts.reduce((sum, p, i) => sum + p.length + (i > 0 ? 2 : 0), 0);
    }
    currentParts.push(paragraph);
    currentLength += (currentParts.length > 1 ? 2 : 0) + paragraph.length;
  }
  if (currentParts.length > 0) {
    const remaining = currentParts.join("\n\n").trim();
    if (remaining) chunks.push({ text: remaining, index: chunkIndex++ });
  }
  return chunks;
}

// ---------- embeddings ----------
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const BATCH_SIZE = 512;

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const allEmbeddings: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ input: batch, model: OPENAI_EMBEDDING_MODEL }),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI embeddings API error (${response.status}): ${error}`);
    }
    const json = await response.json() as {
      data: { index: number; embedding: number[] }[];
    };
    const sorted = json.data.sort((a, b) => a.index - b.index);
    allEmbeddings.push(...sorted.map((item) => item.embedding));
  }
  return allEmbeddings;
}

// ---------- main ----------
async function main() {
  console.log("🔍 Fetching all entries...");

  const { data: entries, error } = await supabase
    .from("entries")
    .select("id, family_id, title, content");

  if (error) {
    console.error("Failed to fetch entries:", error.message);
    process.exit(1);
  }

  if (!entries || entries.length === 0) {
    console.log("No entries found.");
    return;
  }

  console.log(`📝 Found ${entries.length} entries to embed.\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const entry of entries) {
    const label = `"${entry.title}" (${entry.id.slice(0, 8)}...)`;
    try {
      const fullText = `${entry.title}\n\n${entry.content ?? ""}`;
      const chunks = chunkText(fullText);

      if (chunks.length === 0) {
        console.log(`  ⏭  ${label} — no content, skipping`);
        continue;
      }

      // Generate embeddings
      const chunkTexts = chunks.map((c) => c.text);
      const embeddings = await generateEmbeddings(chunkTexts);

      // Delete existing embeddings
      const { error: delErr } = await supabase
        .from("entry_embeddings")
        .delete()
        .eq("entry_id", entry.id);

      if (delErr) {
        throw new Error(`Delete old embeddings failed: ${delErr.message}`);
      }

      // Insert new embeddings
      const rows = chunks.map((chunk, i) => ({
        entry_id: entry.id,
        family_id: entry.family_id,
        chunk_text: chunk.text,
        chunk_index: chunk.index,
        embedding: embeddings[i],
      }));

      const { error: insErr } = await supabase
        .from("entry_embeddings")
        .insert(rows);

      if (insErr) {
        throw new Error(`Insert embeddings failed: ${insErr.message}`);
      }

      console.log(`  ✅ ${label} — ${chunks.length} chunk(s)`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ ${label} — ${err instanceof Error ? err.message : err}`);
      errorCount++;
    }
  }

  console.log(`\n🏁 Done! ${successCount} succeeded, ${errorCount} failed.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
