"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Users, Check, AlertCircle, Loader2, LogIn } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptInvite, updateMemberProfile } from "../../actions";
import { fetchInviteDetails } from "./actions";

interface InviteData {
  familyName: string;
  invitedBy: string;
  role: string;
  familyId: string;
  expired: boolean;
}

export default function AcceptInvitePage() {
  const params = useParams();
  const inviteId = params.id as string;

  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [profileStep, setProfileStep] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [birthday, setBirthday] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvite() {
      try {
        const result = await fetchInviteDetails(inviteId);

        if (!result.ok) {
          setInvite(null);
          setError(result.error);
          setFetching(false);
          return;
        }

        if (result.alreadyMember) {
          window.location.href = "/dashboard";
          return;
        }

        setIsLoggedIn(result.isLoggedIn);
        setInvite(result.invite);
      } catch (e) {
        console.error("Failed to fetch invite:", e);
        setInvite(null);
        setError("Something went wrong loading this invite.");
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
      const result = await acceptInvite(inviteId, displayName.trim());

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.alreadyMember) {
        setAccepted(true);
        setTimeout(() => (window.location.href = "/dashboard"), 1500);
        return;
      }

      setMemberId(result.memberId ?? null);
      setAccepted(true);
      // Show mini profile step instead of immediate redirect
      setTimeout(() => setProfileStep(true), 1000);
    } catch (e: unknown) {
      console.error("Failed to accept invite:", e);
      const message =
        e instanceof Error
          ? e.message
          : "Failed to join family. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  // --- Loading state ---
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

  // --- Error state (invalid / already accepted) ---
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

  // --- Expired state ---
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
              This invite to {invite.familyName} has expired. Ask{" "}
              <span className="font-medium text-foreground">{invite.invitedBy}</span>{" "}
              to send you a new one.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline">
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  // --- Mini profile step (after accepting) ---
  if (accepted && profileStep) {
    const handleSaveProfile = async () => {
      setSavingProfile(true);
      try {
        if (memberId) {
          await updateMemberProfile(memberId, { occupation, birthday, city, state });
        }
      } catch (e) {
        console.error("Failed to save profile:", e);
      }
      window.location.href = "/dashboard";
    };

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              Welcome to {invite.familyName}!
            </CardTitle>
            <CardDescription>
              Tell us a little about yourself. This is optional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                placeholder="e.g. Teacher, Nurse, Retired"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g. Atlanta"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="e.g. GA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { window.location.href = "/dashboard"; }}
              >
                Skip
              </Button>
              <Button
                className="flex-1 bg-[#C17B54] hover:bg-[#A8654A]"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Success state (brief flash before profile step) ---
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
              Setting up your profile...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Not logged in: show login/signup prompt ---
  if (!isLoggedIn) {
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
          <CardContent className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              You need an account to accept this invite. Sign up or log in, then
              come back to this page.
            </p>
            <Button className="w-full" asChild>
              <Link href={`/signup?redirect=/invite/${inviteId}`}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign Up to Join
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/login?redirect=/invite/${inviteId}`}>
                Already have an account? Log In
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Logged in: show accept form ---
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
        </CardContent>
      </Card>
    </div>
  );
}
