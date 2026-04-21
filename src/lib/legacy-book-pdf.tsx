/**
 * Legacy Book PDF — rendered server-side with @react-pdf/renderer.
 *
 * Produces a paginated keepsake PDF with:
 *   - Cover page
 *   - Table of contents
 *   - One section per entry (title, author, date, content)
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LegacyBookEntry {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  authorName: string;
  date: string;
}

export interface LegacyBookOptions {
  entries: LegacyBookEntry[];
  generatedAt?: string;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BRAND_COLOR = "#1a1a2e";
const ACCENT_COLOR = "#c8a96e";
const TEXT_COLOR = "#2d2d2d";
const MUTED_COLOR = "#6b6b6b";
const PAGE_PADDING = 48;

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    color: TEXT_COLOR,
    paddingTop: PAGE_PADDING,
    paddingBottom: PAGE_PADDING + 20,
    paddingLeft: PAGE_PADDING,
    paddingRight: PAGE_PADDING,
    backgroundColor: "#faf9f7",
  },

  // ── Cover ──────────────────────────────────────────────────────────────────
  coverPage: {
    fontFamily: "Helvetica",
    backgroundColor: BRAND_COLOR,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  coverDecorLine: {
    width: 80,
    height: 3,
    backgroundColor: ACCENT_COLOR,
    marginBottom: 32,
  },
  coverTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 36,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 16,
  },
  coverSubtitle: {
    fontSize: 16,
    color: ACCENT_COLOR,
    textAlign: "center",
    marginBottom: 48,
    letterSpacing: 0.5,
  },
  coverDate: {
    fontSize: 11,
    color: "#999999",
    textAlign: "center",
  },

  // ── Table of Contents ──────────────────────────────────────────────────────
  tocHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    marginBottom: 6,
    color: BRAND_COLOR,
  },
  tocDivider: {
    height: 2,
    backgroundColor: ACCENT_COLOR,
    marginBottom: 24,
    width: 40,
  },
  tocRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  tocEntryTitle: {
    fontSize: 11,
    flex: 1,
    paddingRight: 8,
    color: TEXT_COLOR,
  },
  tocEntryMeta: {
    fontSize: 9,
    color: MUTED_COLOR,
    textAlign: "right",
  },

  // ── Entry section ──────────────────────────────────────────────────────────
  entryPage: {
    fontFamily: "Helvetica",
    backgroundColor: "#faf9f7",
    paddingTop: PAGE_PADDING,
    paddingBottom: PAGE_PADDING + 20,
    paddingLeft: PAGE_PADDING,
    paddingRight: PAGE_PADDING,
  },
  entryTypeBadge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: ACCENT_COLOR,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  entryTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 20,
    color: BRAND_COLOR,
    marginBottom: 4,
    lineHeight: 1.3,
  },
  entryMeta: {
    fontSize: 10,
    color: MUTED_COLOR,
    marginBottom: 16,
  },
  entryDivider: {
    height: 1,
    backgroundColor: "#e0d9d0",
    marginBottom: 20,
  },
  entryContent: {
    fontSize: 11,
    lineHeight: 1.75,
    color: TEXT_COLOR,
  },
  entryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 20,
  },
  entryTag: {
    fontSize: 8,
    color: MUTED_COLOR,
    backgroundColor: "#ede9e3",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#aaa",
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CoverPage({ entryCount, generatedAt }: { entryCount: number; generatedAt: string }) {
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverDecorLine} />
      <Text style={styles.coverTitle}>MAI</Text>
      <Text style={styles.coverSubtitle}>Legacy Book</Text>
      <Text style={[styles.coverDate, { marginBottom: 12 }]}>{entryCount} {entryCount === 1 ? "memory" : "memories"}</Text>
      <Text style={styles.coverDate}>Generated {formatDate(generatedAt)}</Text>
    </Page>
  );
}

function TableOfContents({ entries }: { entries: LegacyBookEntry[] }) {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.tocHeading}>Contents</Text>
      <View style={styles.tocDivider} />
      {entries.map((entry) => (
        <View key={entry.id} style={styles.tocRow}>
          <Text style={styles.tocEntryTitle}>{entry.title}</Text>
          <Text style={styles.tocEntryMeta}>
            {capitalize(entry.type)} · {entry.authorName}
          </Text>
        </View>
      ))}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{entries.length > 0 ? `${entries[0].title.slice(0, 0)}` : ""}</Text>
        <Text style={styles.footerText}>MAI Legacy</Text>
      </View>
    </Page>
  );
}

function EntryPage({ entry, index }: { entry: LegacyBookEntry; index: number }) {
  return (
    <Page size="A4" style={styles.entryPage}>
      <Text style={styles.entryTypeBadge}>{capitalize(entry.type)}</Text>
      <Text style={styles.entryTitle}>{entry.title}</Text>
      <Text style={styles.entryMeta}>
        By {entry.authorName} · {formatDate(entry.date)}
      </Text>
      <View style={styles.entryDivider} />
      <Text style={styles.entryContent}>{entry.content}</Text>
      {entry.tags.length > 0 && (
        <View style={styles.entryTags}>
          {entry.tags.map((tag) => (
            <Text key={tag} style={styles.entryTag}>{tag}</Text>
          ))}
        </View>
      )}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{entry.authorName}</Text>
        <Text style={styles.footerText}>{index + 1}</Text>
      </View>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

function LegacyBookDocument({ entries, generatedAt }: LegacyBookOptions) {
  const ts = generatedAt ?? new Date().toISOString();
  return (
    <Document
      title="MAI Legacy Book"
      author="MAI Legacy"
      subject="Family Legacy Keepsake"
    >
      <CoverPage entryCount={entries.length} generatedAt={ts} />
      <TableOfContents entries={entries} />
      {entries.map((entry, i) => (
        <EntryPage key={entry.id} entry={entry} index={i} />
      ))}
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Export: generate PDF buffer
// ---------------------------------------------------------------------------

export async function generateLegacyBookPdf(options: LegacyBookOptions): Promise<Uint8Array> {
  const doc = React.createElement(LegacyBookDocument, options) as Parameters<typeof pdf>[0];
  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
