"use client";

import { useState } from "react";
import { FileText, Mic, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InterviewGuide } from "./interview-guide";

interface FamilyMember {
  id: string;
  display_name: string;
}

interface TranscriptInputProps {
  familyMembers: FamilyMember[];
  preselectedMemberId?: string;
  onSubmit: (transcript: string, memberId: string, memberName: string) => void;
  isProcessing: boolean;
}

export function TranscriptInput({
  familyMembers,
  preselectedMemberId,
  onSubmit,
  isProcessing,
}: TranscriptInputProps) {
  const [transcript, setTranscript] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(
    preselectedMemberId || ""
  );

  const selectedMember = familyMembers.find((m) => m.id === selectedMemberId);
  const wordCount = transcript
    .split(/\s+/)
    .filter(Boolean).length;
  const canSubmit = transcript.trim().length > 50 && selectedMemberId && !isProcessing;

  function handleSubmit() {
    if (!canSubmit || !selectedMember) return;
    onSubmit(transcript, selectedMemberId, selectedMember.display_name);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Mic className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Import Interview
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Sit down with a family member, record the conversation, and paste the
          transcript here. We&apos;ll pull out the stories, recipes, lessons,
          and more.
        </p>
        <div className="pt-2">
          <InterviewGuide />
        </div>
      </div>

      {/* Family Member Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Who was interviewed?</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedMemberId}
            onValueChange={setSelectedMemberId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a family member..." />
            </SelectTrigger>
            <SelectContent>
              {familyMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Transcript Input */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Interview Transcript
            </CardTitle>
            {wordCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {wordCount.toLocaleString()} words
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Paste your interview transcript here...&#10;&#10;Supports plain text, Google Meet transcripts with speaker labels, voice memo transcriptions, and more."
            className="w-full min-h-[300px] p-4 text-sm bg-muted/30 border border-border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
            disabled={isProcessing}
          />
          {wordCount > 0 && wordCount < 20 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
              The transcript seems very short. Longer conversations produce
              better results.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="lg"
          className="gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Extract Entries
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
