"use client";

import { useState } from "react";
import {
  Users,
  Mail,
  Shield,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateFamilyName, sendInvite, createInviteLink, removeMember } from "./actions";
import type { FamilyRole } from "@/types/database";

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
}

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
}: FamilySettingsClientProps) {
  const [familyName, setFamilyName] = useState(initialFamilyName);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<FamilyRole>("member");
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);

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

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the family?`)) return;
    const result = await removeMember(memberId);
    if (!result.success) {
      alert(result.error || "Failed to remove member");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Family Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your family, members, and invitations.
        </p>
      </div>

      {/* Family Name */}
      <Card>
        <CardHeader>
          <CardTitle>Family Name</CardTitle>
          <CardDescription>
            This is how your family appears across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      {/* Invite Members */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Members</CardTitle>
          <CardDescription>
            Invite family members via email or share an invite link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="invite-email" className="sr-only">
                Email address
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as FamilyRole)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleInvite} disabled={inviting}>
              <Mail className="mr-2 h-4 w-4" />
              {inviting ? "Sending..." : "Send Invite"}
            </Button>
          </div>

          <Separator />

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

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members ({members.length})
          </CardTitle>
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
    </div>
  );
}
