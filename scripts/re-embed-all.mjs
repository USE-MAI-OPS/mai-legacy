/**
 * One-time script: Re-embed all entries using Gemini text-embedding-004.
 * Run with: node scripts/re-embed-all.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !GOOGLE_AI_API_KEY) {
  console.error("Missing env vars. Run with: node --env-file=.env.local scripts/re-embed-all.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const GEMINI_MODEL = "gemini-embedding-001";
const GEMINI_DIMS = 768;

async function embedTexts(texts) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:batchEmbedContents?key=${GOOGLE_AI_API_KEY}`;

  const BATCH = 100;
  const all = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: batch.map((text) => ({
          model: `models/${GEMINI_MODEL}`,
          content: { parts: [{ text }] },
          taskType: "RETRIEVAL_DOCUMENT",
          outputDimensionality: GEMINI_DIMS,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    const json = await res.json();
    all.push(...json.embeddings.map((e) => e.values));
  }

  return all;
}

function chunkText(text, maxLen = 500) {
  const words = text.split(/\s+/);
  const chunks = [];
  let current = [];
  let len = 0;

  for (const word of words) {
    if (len + word.length + 1 > maxLen && current.length > 0) {
      chunks.push(current.join(" "));
      current = [];
      len = 0;
    }
    current.push(word);
    len += word.length + 1;
  }

  if (current.length > 0) {
    chunks.push(current.join(" "));
  }

  return chunks;
}

async function main() {
  console.log("Fetching all entries...");

  const { data: entries, error } = await supabase
    .from("entries")
    .select("id, family_id, title, content");

  if (error) {
    console.error("Failed to fetch entries:", error.message);
    process.exit(1);
  }

  console.log(`Found ${entries.length} entries.`);

  if (entries.length === 0) {
    console.log("Nothing to embed.");
    return;
  }

  // Clear old embeddings
  console.log("Clearing old embeddings...");
  const { error: delErr } = await supabase.from("entry_embeddings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) {
    console.error("Failed to clear embeddings:", delErr.message);
    process.exit(1);
  }

  let totalChunks = 0;

  for (const entry of entries) {
    const fullText = `${entry.title}\n\n${entry.content}`;
    const chunks = chunkText(fullText);

    if (chunks.length === 0) continue;

    console.log(`  Embedding "${entry.title}" (${chunks.length} chunks)...`);

    const embeddings = await embedTexts(chunks);

    const rows = chunks.map((text, i) => ({
      entry_id: entry.id,
      family_id: entry.family_id,
      chunk_text: text,
      chunk_index: i,
      embedding: JSON.stringify(embeddings[i]),
    }));

    const { error: insertErr } = await supabase.from("entry_embeddings").insert(rows);

    if (insertErr) {
      console.error(`  Failed to insert for "${entry.title}":`, insertErr.message);
      continue;
    }

    totalChunks += chunks.length;
  }

  console.log(`\nDone! Embedded ${entries.length} entries (${totalChunks} total chunks).`);
}

main().catch(console.error);
