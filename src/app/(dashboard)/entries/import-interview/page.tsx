"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TranscriptInput } from "@/components/interview/transcript-input";
import { ExtractionReview } from "@/components/interview/extraction-review";
import { createClient } from "@/lib/supabase/client";
import { saveTranscriptRecord, saveExtractedEntries } from "./actions";
import type {
  ExtractionResult,
  ReviewableEntry,
  ExtractedProfileUpdates,
} from "@/lib/interview/types";
import type { LifeStory } from "@/types/database";

type Step = "input" | "processing" | "review" | "success";

interface FamilyMember {
  id: string;
  display_name: string;
  life_story: LifeStory | null;
}

export default function ImportInterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4 max-w-3xl">
          <div className="space-y-4">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
      }
    >
      <ImportInterviewContent />
    </Suspense>
  );
}

function ImportInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedMemberId = searchParams.get("member") || undefined;

  const [step, setStep] = useState<Step>("input");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Processing state
  const [processingMessage, setProcessingMessage] = useState(
    "Reading through the conversation..."
  );
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [subjectMemberId, setSubjectMemberId] = useState("");
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    entriesCreated: number;
    profileUpdated: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load family members on mount
  useEffect(() => {
    async function loadMembers() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setFamilyMembers([]);
          setLoadingMembers(false);
          return;
        }

        // Get family
        const { data: membership } = await supabase
          .from("family_members")
          .select("family_id")
          .eq("user_id", user.id)
          .single();

        if (!membership) {
          setFamilyMembers([]);
          setLoadingMembers(false);
          return;
        }

        // Get all family members
        const { data: members } = await supabase
          .from("family_members")
          .select("id, display_name, life_story")
          .eq("family_id", membership.family_id)
          .order("display_name");

        setFamilyMembers(members || []);
      } catch (err) {
        console.error("Failed to load family members:", err);
      } finally {
        setLoadingMembers(false);
      }
    }

    loadMembers();
  }, []);

  // Handle transcript submission
  async function handleSubmit(
    transcript: string,
    memberId: string,
    memberName: string
  ) {
    setSubjectName(memberName);
    setSubjectMemberId(memberId);
    setStep("processing");
    setError(null);

    try {
      // Save transcript record
      const saveResult = await saveTranscriptRecord(transcript, memberId);
      if (saveResult.error || !saveResult.data) {
        throw new Error(saveResult.error || "Failed to save transcript record");
      }
      const tId = saveResult.data.id;
      setTranscriptId(tId);

      // Get member's existing profile
      const member = familyMembers.find((m) => m.id === memberId);
      const existingProfile = member?.life_story || null;

      // Call extraction API
      setProcessingMessage("Reading through the conversation...");

      const response = await fetch("/api/interview/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript_id: tId,
          transcript,
          subject_member_id: memberId,
          subject_member_name: memberName,
          existing_profile: existingProfile,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Extraction failed");
      }

      setExtractionResult(result.data);
      setStep("review");
    } catch (err) {
      console.error("Extraction failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to process transcript"
      );
      setStep("input");
    }
  }

  // Handle save
  async function handleSave(
    entries: ReviewableEntry[],
    profileUpdates: ExtractedProfileUpdates,
    selectedProfileKeys: Record<string, boolean>
  ) {
    setIsSaving(true);

    try {
      const result = await saveExtractedEntries(
        entries,
        profileUpdates,
        selectedProfileKeys,
        subjectMemberId,
        transcriptId || undefined
      );

      if (result.error) {
        throw new Error(result.error);
      }

      setSaveResult(result.data!);
      setStep("success");
    } catch (err) {
      console.error("Save failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save entries"
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    if (
      confirm(
        "Are you sure you want to discard the extracted entries? This cannot be undone."
      )
    ) {
      router.push("/entries");
    }
  }

  // Loading state
  if (loadingMembers) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/entries">
            <ArrowLeft className="w-4 h-4" />
            Back to Entries
          </Link>
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-3xl mx-auto mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 underline text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step: Input */}
      {step === "input" && (
        <TranscriptInput
          familyMembers={familyMembers}
          preselectedMemberId={preselectedMemberId}
          onSubmit={handleSubmit}
          isProcessing={false}
        />
      )}

      {/* Step: Processing */}
      {step === "processing" && (
        <div className="max-w-3xl mx-auto text-center py-20 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
          <p className="text-lg font-medium text-foreground">
            {processingMessage}
          </p>
          <p className="text-sm text-muted-foreground">
            This may take a minute for longer transcripts.
          </p>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && extractionResult && (
        <ExtractionReview
          result={extractionResult}
          subjectName={subjectName}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isSaving}
        />
      )}

      {/* Step: Success */}
      {step === "success" && saveResult && (
        <div className="max-w-3xl mx-auto text-center py-20 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Saved!</h2>
          <p className="text-muted-foreground">
            {saveResult.entriesCreated}{" "}
            {saveResult.entriesCreated === 1 ? "entry" : "entries"} saved
            {saveResult.profileUpdated &&
              ` and ${subjectName}'s profile updated`}
            . {subjectName}&apos;s stories are now searchable by the Griot.
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="outline" asChild>
              <Link href="/entries">View Entries</Link>
            </Button>
            <Button onClick={() => { setStep("input"); setExtractionResult(null); setError(null); }}>
              Import Another Interview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
