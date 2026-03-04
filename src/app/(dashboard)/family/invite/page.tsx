"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Plus, X } from "lucide-react";
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

interface InviteEntry {
  email: string;
  role: string;
}

export default function InviteMembersPage() {
  const [invites, setInvites] = useState<InviteEntry[]>([
    { email: "", role: "member" },
  ]);
  const [sending, setSending] = useState(false);

  const addRow = () => {
    setInvites([...invites, { email: "", role: "member" }]);
  };

  const removeRow = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof InviteEntry, value: string) => {
    const updated = [...invites];
    updated[index] = { ...updated[index], [field]: value };
    setInvites(updated);
  };

  const handleSend = async () => {
    const validInvites = invites.filter((inv) => inv.email.trim());
    if (validInvites.length === 0) return;

    setSending(true);
    // Simulated delay
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    alert(
      `Invites sent to: ${validInvites.map((i) => i.email).join(", ")}`
    );
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
        <h1 className="text-3xl font-bold">Invite Family Members</h1>
        <p className="text-muted-foreground mt-1">
          Send email invitations to bring your family onto MAI Legacy.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Invitations</CardTitle>
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

          <Button variant="outline" size="sm" onClick={addRow}>
            <Plus className="mr-2 h-3 w-3" />
            Add Another
          </Button>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSend} disabled={sending}>
              <Mail className="mr-2 h-4 w-4" />
              {sending ? "Sending..." : "Send Invitations"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What happens next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <Badge className="shrink-0 mt-0.5">1</Badge>
            <p>
              Each person receives an email with a magic link to join your family.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="shrink-0 mt-0.5">2</Badge>
            <p>
              They click the link, create an account (or sign in), and
              they&apos;re automatically added to your family.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="shrink-0 mt-0.5">3</Badge>
            <p>
              They can immediately start adding entries, browsing knowledge,
              and chatting with the Griot.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
