"use client";

import { useState } from "react";
import {
  Users,
  Mail,
  Shield,
  Trash2,
  Copy,
  Check,
  CreditCard,
  Loader2,
  ArrowUpRight,
  Download,
  FileJson,
  FolderArchive,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  X,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { updateFamilyName, sendInvite, createInviteLink, removeMember } from "./actions";
import type { FamilyRole, PlanTier, SubscriptionStatus } from "@/types/database";

interface Member {
  id: string;
  name: string;
  email: string | null;
  initials: string;
  role: string;
  joined: string;
}

interface PendingInvite {
  email: string;
  sentAt: string;
  role: string;
}

interface FamilySettingsClientProps {
  familyId: string;
  initialFamilyName: string;
  members: Member[];
  pendingInvites: PendingInvite[];
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  isAdmin: boolean;
}

const TIER_LABELS: Record<PlanTier, string> = {
  seedling: "Seedling (Free)",
  roots: "Roots ($9/mo)",
  legacy: "Legacy ($19/mo)",
};

const STATUS_LABELS: Record<SubscriptionStatus, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  none: { label: "No subscription", variant: "outline" },
  active: { label: "Active", variant: "default" },
  past_due: { label: "Past due", variant: "destructive" },
  canceled: { label: "Canceled", variant: "secondary" },
  trialing: { label: "Trial", variant: "outline" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function FamilySettingsClient({
  familyId,
  initialFamilyName,
  members,
  pendingInvites,
  planTier,
  subscriptionStatus,
  isAdmin,
}: FamilySettingsClientProps) {
  const [familyName, setFamilyName] = useState(initialFamilyName);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<FamilyRole>("member");
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingZip, setExportingZip] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const [reindexJobId, setReindexJobId] = useState<string | null>(null);
  const [reindexStatus, setReindexStatus] = useState<"pending" | "processing" | "done" | "failed" | null>(null);

  // Multi-email invite rows
  const [inviteRows, setInviteRows] = useState<{email: string, role: FamilyRole}[]>([{email: "", role: "member"}]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCopyLink = async () => {
    setGeneratingLink(true);
    try {
      const result = await createInviteLink(familyId);
      if (!result.success || !result.url) {
        alert(result.error || "Failed to create invite link");
        return;
      }
      setInviteLink(result.url);
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to create invite link");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleSave = async () => {
    if (!familyName.trim()) return;
    setSaving(true);
    const result = await updateFamilyName(familyId, familyName.trim());
    setSaving(false);
    if (!result.success) {
      alert(result.error || "Failed to save");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    const result = await sendInvite(familyId, inviteEmail, inviteRole);
    setInviting(false);
    if (result.success) {
      setInviteEmail("");
    } else {
      alert(result.error || "Failed to send invite");
    }
  };

  const handleBulkInvite = async () => {
    const nonEmptyRows = inviteRows.filter(r => r.email.trim() !== "");
    if (nonEmptyRows.length === 0) return;
    setInviting(true);
    for (const row of nonEmptyRows) {
      const result = await sendInvite(familyId, row.email.trim(), row.role);
      if (!result.success) {
        alert(result.error || `Failed to send invite to ${row.email}`);
      }
    }
    setInviting(false);
    setInviteRows([{email: "", role: "member"}]);
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    const { id } = memberToRemove;
    setMemberToRemove(null);
    const result = await removeMember(id);
    if (!result.success) {
      alert(result.error || "Failed to remove member");
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    setReindexJobId(null);
    setReindexStatus(null);
    try {
      const res = await fetch("/api/entries/re-embed-all", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.jobId) {
        alert(data.error || "Failed to start re-indexing");
        return;
      }
      setReindexJobId(data.jobId);
      setReindexStatus("pending");

      // Poll job status every 5s until done or failed
      const poll = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/jobs/${data.jobId}`);
          const statusData = await statusRes.json();
          if (statusData.status === "done" || statusData.status === "failed") {
            setReindexStatus(statusData.status);
            clearInterval(poll);
            setReindexing(false);
          } else {
            setReindexStatus(statusData.status);
          }
        } catch {
          clearInterval(poll);
          setReindexing(false);
        }
      }, 5000);
    } catch {
      alert("Failed to start re-indexing");
      setReindexing(false);
    }
  };

  const handleExport = async (format: "json" | "zip") => {
    const setLoading = format === "json" ? setExportingJson : setExportingZip;
    setLoading(true);
    setExportError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, familyId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setExportError(data.error ?? "Export failed. Please try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match?.[1] ?? `family_export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-700/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Family Settings</h1>
          <p className="text-sm font-medium text-stone-500">
            Manage your family, members, and invitations.
          </p>
        </div>
      </div>

      {/* Family Name */}
      <Card className="border-stone-200 dark:border-[#2C3B2F] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-serif text-stone-900 dark:text-stone-100">Family Name</CardTitle>
          <CardDescription>
            This is how your family appears across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            Family Name
          </Label>
          <div className="flex gap-3">
            <Input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleSave} disabled={saving} className="bg-[#C17B54] hover:bg-[#C17B54]/90 text-white">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Billing & Plan */}
      <Card className="border-stone-200 dark:border-[#2C3B2F] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-serif text-stone-900 dark:text-stone-100">
            <CreditCard className="h-5 w-5 text-amber-700 dark:text-amber-500" />
            Plan & Billing
          </CardTitle>
          <CardDescription>
            Manage your family&apos;s subscription plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Current Plan</p>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-stone-900 dark:text-stone-100">{TIER_LABELS[planTier]}</p>
                <Badge className="bg-[#C17B54] text-white uppercase text-xs">{planTier}</Badge>
              </div>
            </div>
            {subscriptionStatus !== "none" && (
              <Badge variant={STATUS_LABELS[subscriptionStatus].variant}>
                {STATUS_LABELS[subscriptionStatus].label}
              </Badge>
            )}
          </div>

          {isAdmin && (
            <div className="flex gap-3">
              {planTier === "seedling" ? (
                <Link href="/pricing">
                  <Button>
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  Manage Billing
                </Button>
              )}
            </div>
          )}

          {!isAdmin && planTier === "seedling" && (
            <p className="text-sm text-muted-foreground">
              Ask a family admin to upgrade your plan for more features.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Members List */}
      <Card className="border-stone-200 dark:border-[#2C3B2F] shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                Family Members
              </Label>
              <CardTitle className="flex items-center gap-2 text-xl font-serif text-stone-900 dark:text-stone-100 mt-1">
                <Users className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                Members ({members.length})
              </CardTitle>
            </div>
            <a
              href="#invite-section"
              className="text-sm font-medium text-[#C17B54] hover:text-[#C17B54]/80 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Invite
            </a>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          {members.map((member, i) => (
            <div key={member.id}>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Joined {member.joined}
                  </span>
                  <Badge
                    variant={member.role === "admin" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {member.role === "admin" && (
                      <Shield className="mr-1 h-3 w-3" />
                    )}
                    {member.role}
                  </Badge>
                  {member.role !== "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRemoveMember(member.id, member.name)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
              {i < members.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invite Members */}
      <Card id="invite-section" className="border-stone-200 dark:border-[#2C3B2F] shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-serif text-stone-900 dark:text-stone-100">Invite Members</CardTitle>
          <CardDescription>
            Invite family members via email or share an invite link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Multi-email invite form */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Send Email Invitations
            </Label>
            {inviteRows.map((row, index) => (
              <div key={index} className="flex gap-3 items-center">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={row.email}
                    onChange={(e) => {
                      const updated = [...inviteRows];
                      updated[index] = { ...updated[index], email: e.target.value };
                      setInviteRows(updated);
                    }}
                  />
                </div>
                <Select
                  value={row.role}
                  onValueChange={(v) => {
                    const updated = [...inviteRows];
                    updated[index] = { ...updated[index], role: v as FamilyRole };
                    setInviteRows(updated);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {inviteRows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => {
                      setInviteRows(inviteRows.filter((_, i) => i !== index));
                    }}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setInviteRows([...inviteRows, { email: "", role: "member" }])}
              className="text-sm font-medium text-[#C17B54] hover:text-[#C17B54]/80 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Another
            </button>
            <Button
              onClick={handleBulkInvite}
              disabled={inviting || inviteRows.every(r => r.email.trim() === "")}
              className="bg-[#C17B54] hover:bg-[#C17B54]/90 text-white w-full rounded-full"
            >
              {inviting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitations
                </>
              )}
            </Button>
          </div>

          {/* What Happens Next */}
          <div className="space-y-4 pt-2">
            <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              What Happens Next
            </Label>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C17B54] text-white text-xs font-bold">1</div>
                <p className="text-sm text-muted-foreground leading-relaxed pt-1">They&apos;ll receive an email with a secure magic link to join the family circle.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C17B54] text-white text-xs font-bold">2</div>
                <p className="text-sm text-muted-foreground leading-relaxed pt-1">New members will be guided through a quick account creation or sign-in process.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C17B54] text-white text-xs font-bold">3</div>
                <p className="text-sm text-muted-foreground leading-relaxed pt-1">They&apos;ll be automatically added to the family legacy records and archives.</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Share invite link */}
          <div>
            <p className="text-sm font-medium mb-2">Or share an invite link</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={inviteLink || "Click to generate a shareable link..."}
                className="font-mono text-xs"
                placeholder="Click to generate a shareable link..."
              />
              <Button variant="outline" onClick={handleCopyLink} disabled={generatingLink}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Each link is unique and expires in 7 days.
            </p>
          </div>

          {/* Pending invites */}
          {pendingInvites.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Pending Invites</p>
              {pendingInvites.map((invite) => (
                <div
                  key={invite.email}
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{invite.email}</span>
                    <Badge variant="outline" className="text-xs">
                      {invite.role}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Sent {invite.sentAt}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Data */}
      <Card className="border-stone-200 dark:border-[#2C3B2F] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-serif text-stone-900 dark:text-stone-100">
            <Download className="h-5 w-5 text-amber-700 dark:text-amber-500" />
            Your Data
          </CardTitle>
          <CardDescription>
            Download a full export of your family&apos;s stories, entries, and media. Limited to once every 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportError && (
            <p className="text-sm text-destructive">{exportError}</p>
          )}
          <div className="flex flex-wrap gap-3">
            <div title={!isAdmin ? "Only family admins can export data" : undefined}>
              <Button
                variant="outline"
                onClick={() => handleExport("json")}
                disabled={!isAdmin || exportingJson || exportingZip}
              >
                {exportingJson ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileJson className="mr-2 h-4 w-4" />
                )}
                Export as JSON
              </Button>
            </div>
            <div title={!isAdmin ? "Only family admins can export data" : undefined}>
              <Button
                variant="outline"
                onClick={() => handleExport("zip")}
                disabled={!isAdmin || exportingJson || exportingZip}
              >
                {exportingZip ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FolderArchive className="mr-2 h-4 w-4" />
                )}
                Export as ZIP (with media)
              </Button>
            </div>
          </div>
          {!isAdmin && (
            <p className="text-sm text-muted-foreground">
              Ask a family admin to export your family&apos;s data.
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Exports include entries, stories, family tree, events, traditions, and conversations. Raw user IDs and internal metadata are excluded.
          </p>
        </CardContent>
      </Card>

      {/* Knowledge Base */}
      {isAdmin && (
        <Card className="border-stone-200 dark:border-[#2C3B2F] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-serif text-stone-900 dark:text-stone-100">
              <Database className="h-5 w-5 text-amber-700 dark:text-amber-500" />
              Knowledge Base
            </CardTitle>
            <CardDescription>
              Re-index all entries to refresh the AI search index. Use this if
              Griot seems to be missing recent stories.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={handleReindex}
              disabled={reindexing || reindexStatus === "pending" || reindexStatus === "processing"}
            >
              {reindexing || reindexStatus === "pending" || reindexStatus === "processing" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {reindexing || reindexStatus === "pending" || reindexStatus === "processing"
                ? "Re-indexing..."
                : "Re-index Knowledge Base"}
            </Button>
            {reindexStatus === "pending" || reindexStatus === "processing" ? (
              <p className="text-sm text-muted-foreground">
                Re-indexing in the background. This may take a few minutes.
              </p>
            ) : reindexStatus === "done" ? (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Re-indexing complete.
              </p>
            ) : reindexStatus === "failed" ? (
              <p className="text-sm text-destructive flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                Re-indexing failed. Please try again.
              </p>
            ) : null}
            {reindexJobId && (
              <p className="text-xs text-muted-foreground font-mono">
                Job ID: {reindexJobId}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => { if (!open) setMemberToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {memberToRemove?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {memberToRemove?.name} from your family. They will lose access to all shared stories, entries, and memories. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
