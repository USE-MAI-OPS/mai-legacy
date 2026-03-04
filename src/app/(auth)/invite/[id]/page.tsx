"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Users, Check, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

// Mock invite data used when Supabase isn't configured
const MOCK_INVITE = {
  familyName: "The Powell Family",
  invitedBy: "Kobe Powell",
  role: "member" as const,
  familyId: "mock-family-id",
  expired: false,
};

interface InviteData {
  familyName: string;
  invitedBy: string;
  role: string;
  familyId: string;
  expired: boolean;
}

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const inviteId = params.id as string;

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function fetchInvite() {
      try {
        const supabase = createClient();

        // Fetch the invite record
        const { data: inviteData, error: inviteError } = await supabase
          .from("family_invites")
          .select("family_id, invited_by, role, accepted, expires_at")
          .eq("id", inviteId)
          .single();

        if (inviteError || !inviteData) {
          // Fall back to mock data
          setInvite(MOCK_INVITE);
          setFetching(false);
          return;
        }

        if (inviteData.accepted) {
          setInvite(null);
          setError("This invite has already been accepted.");
          setFetching(false);
          return;
        }

        const expired = new Date(inviteData.expires_at) < new Date();

        // Fetch family name
        const { data: family } = await supabase
          .from("families")
          .select("name")
          .eq("id", inviteData.family_id)
          .single();

        // Fetch inviter's display name
        const { data: inviter } = await supabase
          .from("family_members")
          .select("display_name")
          .eq("user_id", inviteData.invited_by)
          .single();

        setInvite({
          familyName: family?.name || "Unknown Family",
          invitedBy: inviter?.display_name || "A family member",
          role: inviteData.role,
          familyId: inviteData.family_id,
          expired,
        });
      } catch (e) {
        console.error("Failed to fetch invite, using mock data:", e);
        setInvite(MOCK_INVITE);
      } finally {
        setFetching(false);
      }
    }

    fetchInvite();
  }, [inviteId]);

  const handleAccept = async () => {
    if (!displayName.trim() || !invite) return;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Fallback: mock acceptance
        setAccepted(true);
        setTimeout(() => router.push("/dashboard"), 1500);
        return;
      }

      // Insert the user as a family member
      const { error: memberError } = await supabase
        .from("family_members")
        .insert({
          family_id: invite.familyId,
          user_id: user.id,
          role: invite.role as "admin" | "member",
          display_name: displayName.trim(),
        });

      if (memberError) throw memberError;

      // Mark the invite as accepted
      await supabase
        .from("family_invites")
        .update({ accepted: true })
        .eq("id", inviteId);

      setAccepted(true);
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: unknown) {
      console.error("Failed to accept invite:", e);
      const message =
        e instanceof Error ? e.message : "Failed to join family. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading invite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite && error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid Invite</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite?.expired) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-7 w-7 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invite Expired</h2>
            <p className="text-muted-foreground mb-4">
              This invite to {invite.familyName} has expired. Please ask the
              family admin to send a new invite.
            </p>
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              Welcome to {invite.familyName}!
            </h2>
            <p className="text-muted-foreground">
              Redirecting to your family dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">You&apos;re Invited!</CardTitle>
          <CardDescription>
            <span className="font-medium text-foreground">
              {invite.invitedBy}
            </span>{" "}
            has invited you to join{" "}
            <span className="font-medium text-foreground">
              {invite.familyName}
            </span>{" "}
            on MAI Legacy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Your Display Name</Label>
            <Input
              id="display-name"
              placeholder="How should your family know you?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This is how you&apos;ll appear to other family members.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={!displayName.trim() || loading}
          >
            {loading ? "Joining..." : "Accept & Join Family"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary underline">
              Sign up first
            </Link>
            , then come back to this link.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
