"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Link2, Loader2, Mail, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { sendInvite, createInviteLink } from "../settings/actions";
import type { FamilyRole } from "@/types/database";

interface InviteEntry {
  email: string;
  role: FamilyRole;
}

interface InviteClientProps {
  familyId: string;
  familyName: string;
}

export function InviteClient({ familyId, familyName }: InviteClientProps) {
  const [invites, setInvites] = useState<InviteEntry[]>([
    { email: "", role: "member" },
  ]);
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);

  const addRow = () => {
    setInvites([...invites, { email: "", role: "member" }]);
  };

  const removeRow = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof InviteEntry, value: string) => {
    const updated = [...invites];
    updated[index] = { ...updated[index], [field]: value };
    setInvites(updated as InviteEntry[]);
  };

  const handleSend = async () => {
    const validInvites = invites.filter((inv) => inv.email.trim());
    if (validInvites.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    setSending(true);
    let successCount = 0;
    let failedEmails: string[] = [];

    for (const inv of validInvites) {
      const result = await sendInvite(familyId, inv.email.trim(), inv.role);
      if (result.success) {
        successCount++;
      } else {
        failedEmails.push(inv.email);
        toast.error(`Failed to invite ${inv.email}: ${result.error}`);
      }
    }

    setSending(false);

    if (successCount > 0) {
      toast.success(
        `${successCount} invitation${successCount > 1 ? "s" : ""} sent successfully!`
      );
      // Clear successful rows, keep failed ones
      if (failedEmails.length > 0) {
        setInvites(
          invites.filter((inv) => failedEmails.includes(inv.email.trim()))
        );
      } else {
        setInvites([{ email: "", role: "member" }]);
      }
    }
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const result = await createInviteLink(familyId);
      if (!result.success || !result.url) {
        toast.error(result.error || "Failed to create invite link");
        return;
      }
      setInviteLink(result.url);
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Failed to create invite link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/family/settings"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Family Settings
        </Link>
        <h1 className="text-3xl font-serif font-bold">Invite Family Members</h1>
        <p className="text-muted-foreground mt-1">
          Invite members to <strong>{familyName}</strong> via email or a shareable link.
        </p>
      </div>

      {/* Shareable Invite Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-[#C17B54]" />
            Share Invite Link
          </CardTitle>
          <CardDescription>
            Generate a link anyone can use to join your family. Each link expires in 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {inviteLink ? (
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteLink}
                className="font-mono text-xs"
              />
              <Button variant="outline" onClick={handleCopyLink}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleGenerateLink}
              disabled={generatingLink}
              className="bg-[#C17B54] hover:bg-[#C17B54]/90 text-white"
            >
              {generatingLink ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Generate Invite Link
            </Button>
          )}
          {inviteLink && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateLink}
              disabled={generatingLink}
            >
              {generatingLink ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : null}
              Generate New Link
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Anyone with this link can join as a member. Links expire after 7 days.
          </p>
        </CardContent>
      </Card>

      {/* Email Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#C17B54]" />
            Send Email Invitations
          </CardTitle>
          <CardDescription>
            Add email addresses for family members you&apos;d like to invite.
            They&apos;ll receive a magic link to join your family.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invites.map((invite, index) => (
            <div key={index} className="flex gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor={`email-${index}`} className="text-xs mb-1 block">
                  Email
                </Label>
                <Input
                  id={`email-${index}`}
                  type="email"
                  placeholder="family@example.com"
                  value={invite.email}
                  onChange={(e) =>
                    updateRow(index, "email", e.target.value)
                  }
                />
              </div>
              <div className="w-32">
                <Label className="text-xs mb-1 block">Role</Label>
                <Select
                  value={invite.role}
                  onValueChange={(v) => updateRow(index, "role", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {invites.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(index)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          <button
            onClick={addRow}
            className="text-sm font-medium text-[#C17B54] hover:text-[#C17B54]/80 flex items-center gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Another
          </button>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-[#C17B54] hover:bg-[#C17B54]/90 text-white rounded-full px-6"
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              {sending ? "Sending..." : "Send Invitations"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* What happens next */}
      <Card>
        <CardHeader>
          <CardTitle>What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C17B54] text-white text-xs font-bold">
              1
            </div>
            <p>
              They&apos;ll receive an email with a secure magic link to join the family circle.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C17B54] text-white text-xs font-bold">
              2
            </div>
            <p>
              New members will be guided through a quick account creation or sign-in process.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C17B54] text-white text-xs font-bold">
              3
            </div>
            <p>
              They&apos;ll be automatically added to the <strong>{familyName}</strong> legacy records and archives.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
