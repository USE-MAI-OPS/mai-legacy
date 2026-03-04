#!/usr/bin/env tsx
/**
 * MAI Legacy -- Database seed script.
 *
 * Populates Supabase with a realistic test family, members, and 25 entries
 * spanning all six entry types so the RAG pipeline has high-quality content
 * to retrieve against.
 *
 * Usage:
 *   npx tsx src/scripts/seed.ts            # seed family, members & entries
 *   npx tsx src/scripts/seed.ts --embed    # also generate embeddings (needs OPENAI_API_KEY)
 *   npx tsx src/scripts/seed.ts --clean    # delete seed data before re-seeding
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY          (only when --embed is passed)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { seedEntries, type SeedEntry } from "./seed-data";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing required environment variables:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL\n" +
      "  SUPABASE_SERVICE_ROLE_KEY\n\n" +
      "Make sure your .env or .env.local file is configured."
  );
  process.exit(1);
}

// Service-role client bypasses RLS.
const supabase: SupabaseClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Seed identifiers -- deterministic UUIDs so re-runs are idempotent.
// ---------------------------------------------------------------------------

const FAMILY_ID = "a0000000-0000-4000-8000-000000000001";

/**
 * Test users.  We create them in Supabase Auth (admin API) so that the
 * auth.users FK constraints on families / family_members / entries are
 * satisfied.
 */
const TEST_USERS = {
  james: {
    id: "b0000000-0000-4000-8000-000000000001",
    email: "james@powell-test.local",
    displayName: "James Powell Jr.",
    role: "admin" as const,
  },
  mae: {
    id: "b0000000-0000-4000-8000-000000000002",
    email: "mae@powell-test.local",
    displayName: "Mae Powell",
    role: "admin" as const,
  },
  tanya: {
    id: "b0000000-0000-4000-8000-000000000003",
    email: "tanya@powell-test.local",
    displayName: "Tanya Powell-Davis",
    role: "member" as const,
  },
  ray: {
    id: "b0000000-0000-4000-8000-000000000004",
    email: "ray@powell-test.local",
    displayName: "Ray Powell",
    role: "member" as const,
  },
} as const;

type UserKey = keyof typeof TEST_USERS;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function log(msg: string) {
  console.log(`[seed] ${msg}`);
}

function err(msg: string) {
  console.error(`[seed] ERROR: ${msg}`);
}

// ---------------------------------------------------------------------------
// Clean
// ---------------------------------------------------------------------------

async function clean() {
  log("Cleaning existing seed data...");

  // Delete in dependency order: embeddings -> entries -> family_members -> families
  // Auth users are handled separately.

  const { error: embErr } = await supabase
    .from("entry_embeddings")
    .delete()
    .eq("family_id", FAMILY_ID);
  if (embErr) err(`entry_embeddings: ${embErr.message}`);

  const { error: tutErr } = await supabase
    .from("skill_tutorials")
    .delete()
    .eq("family_id", FAMILY_ID);
  if (tutErr) err(`skill_tutorials: ${tutErr.message}`);

  const { error: convErr } = await supabase
    .from("griot_conversations")
    .delete()
    .eq("family_id", FAMILY_ID);
  if (convErr) err(`griot_conversations: ${convErr.message}`);

  const { error: entErr } = await supabase
    .from("entries")
    .delete()
    .eq("family_id", FAMILY_ID);
  if (entErr) err(`entries: ${entErr.message}`);

  const { error: invErr } = await supabase
    .from("family_invites")
    .delete()
    .eq("family_id", FAMILY_ID);
  if (invErr) err(`family_invites: ${invErr.message}`);

  const { error: memErr } = await supabase
    .from("family_members")
    .delete()
    .eq("family_id", FAMILY_ID);
  if (memErr) err(`family_members: ${memErr.message}`);

  const { error: famErr } = await supabase
    .from("families")
    .delete()
    .eq("id", FAMILY_ID);
  if (famErr) err(`families: ${famErr.message}`);

  // Remove auth users
  for (const user of Object.values(TEST_USERS)) {
    const { error: authErr } =
      await supabase.auth.admin.deleteUser(user.id);
    if (authErr && !authErr.message.includes("not found")) {
      err(`auth user ${user.email}: ${authErr.message}`);
    }
  }

  log("Clean complete.");
}

// ---------------------------------------------------------------------------
// Create auth users
// ---------------------------------------------------------------------------

async function createAuthUsers() {
  log("Creating test auth users...");

  for (const user of Object.values(TEST_USERS)) {
    // The Supabase Admin API accepts `id` to set a deterministic user UUID,
    // but the TypeScript SDK types don't expose it.  We use a type assertion.
    const attrs = {
      id: user.id,
      email: user.email,
      password: "testpassword123",
      email_confirm: true,
      user_metadata: { display_name: user.displayName },
    };
    const { error } = await supabase.auth.admin.createUser(
      attrs as unknown as Parameters<typeof supabase.auth.admin.createUser>[0]
    );

    if (error) {
      // If user already exists, that's fine for idempotency.
      if (error.message.includes("already been registered") || error.message.includes("already exists")) {
        log(`  ${user.displayName} already exists, skipping.`);
      } else {
        throw new Error(`Failed to create user ${user.email}: ${error.message}`);
      }
    } else {
      log(`  Created ${user.displayName} (${user.email})`);
    }
  }
}

// ---------------------------------------------------------------------------
// Create family
// ---------------------------------------------------------------------------

async function createFamily() {
  log("Creating family: The Powell Family...");

  const { error } = await supabase.from("families").upsert(
    {
      id: FAMILY_ID,
      name: "The Powell Family",
      created_by: TEST_USERS.james.id,
      plan_tier: "roots",
    },
    { onConflict: "id" }
  );

  if (error) throw new Error(`Failed to create family: ${error.message}`);
  log("  Family created.");
}

// ---------------------------------------------------------------------------
// Create family members
// ---------------------------------------------------------------------------

async function createFamilyMembers() {
  log("Adding family members...");

  const members = Object.values(TEST_USERS).map((user) => ({
    family_id: FAMILY_ID,
    user_id: user.id,
    role: user.role,
    display_name: user.displayName,
  }));

  // Upsert on the unique(family_id, user_id) constraint.
  const { error } = await supabase.from("family_members").upsert(members, {
    onConflict: "family_id,user_id",
  });

  if (error) throw new Error(`Failed to create family members: ${error.message}`);
  log(`  Added ${members.length} members.`);
}

// ---------------------------------------------------------------------------
// Create entries
// ---------------------------------------------------------------------------

async function createEntries(): Promise<string[]> {
  log(`Inserting ${seedEntries.length} entries...`);

  const rows = seedEntries.map((entry: SeedEntry) => ({
    family_id: FAMILY_ID,
    author_id: TEST_USERS[entry.authorKey].id,
    title: entry.title,
    content: entry.content,
    type: entry.type,
    tags: entry.tags,
  }));

  const { data, error } = await supabase
    .from("entries")
    .insert(rows)
    .select("id, title");

  if (error) throw new Error(`Failed to insert entries: ${error.message}`);

  const entryIds = (data ?? []).map((e: { id: string; title: string }) => {
    log(`  + ${e.title}`);
    return e.id;
  });

  log(`  Inserted ${entryIds.length} entries.`);
  return entryIds;
}

// ---------------------------------------------------------------------------
// Embed entries (optional -- requires OPENAI_API_KEY)
// ---------------------------------------------------------------------------

async function embedEntries(entryIds: string[]) {
  // We do the embedding directly using the chunker + embeddings lib rather
  // than calling the API route, since the API route requires an auth session.

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    err(
      "OPENAI_API_KEY is not set. Skipping embedding generation.\n" +
        "Set the key in .env and re-run with --embed to generate embeddings."
    );
    return;
  }

  // Dynamically import the RAG utilities so we don't blow up when --embed
  // isn't passed and OPENAI_API_KEY is missing.
  const { chunkText } = await import("../lib/rag/chunker");
  const { generateEmbeddings } = await import("../lib/rag/embeddings");

  log(`Generating embeddings for ${entryIds.length} entries...`);

  for (const entryId of entryIds) {
    // Fetch the entry we just created.
    const { data: entry, error: fetchErr } = await supabase
      .from("entries")
      .select("id, family_id, title, content")
      .eq("id", entryId)
      .single();

    if (fetchErr || !entry) {
      err(`Could not fetch entry ${entryId}: ${fetchErr?.message}`);
      continue;
    }

    const fullText = `${entry.title}\n\n${entry.content}`;
    const chunks = chunkText(fullText);
    if (chunks.length === 0) continue;

    const chunkTexts = chunks.map((c) => c.text);
    let embeddings: number[][];

    try {
      embeddings = await generateEmbeddings(chunkTexts);
    } catch (embError) {
      err(
        `Embedding failed for "${entry.title}": ${
          embError instanceof Error ? embError.message : String(embError)
        }`
      );
      continue;
    }

    // Delete any existing embeddings for this entry (idempotent).
    await supabase
      .from("entry_embeddings")
      .delete()
      .eq("entry_id", entryId);

    // Insert new embeddings.
    const embRows = chunks.map((chunk, i) => ({
      entry_id: entryId,
      family_id: entry.family_id,
      chunk_text: chunk.text,
      chunk_index: chunk.index,
      embedding: embeddings[i],
    }));

    const { error: insErr } = await supabase
      .from("entry_embeddings")
      .insert(embRows);

    if (insErr) {
      err(`Failed to insert embeddings for "${entry.title}": ${insErr.message}`);
    } else {
      log(`  Embedded "${entry.title}" (${chunks.length} chunk${chunks.length > 1 ? "s" : ""})`);
    }

    // Small delay to avoid rate-limiting the OpenAI API.
    await new Promise((r) => setTimeout(r, 250));
  }

  log("Embedding generation complete.");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const shouldEmbed = args.includes("--embed");
  const shouldClean = args.includes("--clean");

  console.log("\n========================================");
  console.log("  MAI Legacy -- Database Seed Script");
  console.log("========================================\n");

  try {
    if (shouldClean) {
      await clean();
      console.log();
    }

    await createAuthUsers();
    await createFamily();
    await createFamilyMembers();
    const entryIds = await createEntries();

    if (shouldEmbed) {
      console.log();
      await embedEntries(entryIds);
    } else {
      log(
        "\nSkipping embedding generation. Run with --embed to generate embeddings."
      );
    }

    console.log("\n========================================");
    console.log("  Seed complete!");
    console.log("========================================");
    console.log(`\n  Family:  The Powell Family (${FAMILY_ID})`);
    console.log(`  Members: ${Object.keys(TEST_USERS).length}`);
    console.log(`  Entries: ${entryIds.length}`);
    if (shouldEmbed) {
      console.log("  Embeddings: generated");
    }
    console.log("\n  Test login credentials:");
    for (const user of Object.values(TEST_USERS)) {
      console.log(`    ${user.email} / testpassword123  (${user.role})`);
    }
    console.log();
  } catch (error) {
    console.error(
      "\nSeed failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main();
