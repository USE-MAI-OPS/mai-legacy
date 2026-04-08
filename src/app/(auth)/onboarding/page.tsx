"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
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
import { createFamily } from "../actions";

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------
function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i < current
              ? "bg-primary"
              : i === current
              ? "bg-primary/40"
              : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main onboarding page
// ---------------------------------------------------------------------------
const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [birthday, setBirthday] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function canGoNext() {
    if (step === 0) return displayName.trim().length > 0;
    if (step === 1) return familyName.trim().length > 0;
    return true; // step 2 is skippable
  }

  async function handleNext() {
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    // Step 2: save and go to dashboard
    await handleFinish(false);
  }

  async function handleFinish(skip: boolean) {
    setLoading(true);
    setError(null);

    try {
      const profileInfo = skip
        ? undefined
        : { occupation, birthday, city, state };

      const result = await createFamily(
        familyName,
        displayName,
        nickname || undefined,
        profileInfo
      );
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Use full page reload to ensure cookies/session are picked up
      window.location.href = "/dashboard";
    } catch (e) {
      console.error("Onboarding error:", e);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <StepProgress current={step} total={TOTAL_STEPS} />

        {/* Step 0 — Your Name */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>What should we call you?</CardTitle>
              <CardDescription>
                This is how you&apos;ll appear to your family.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Your name</Label>
                <Input
                  id="displayName"
                  placeholder="e.g. Grandma Rosa"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canGoNext() && handleNext()}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">
                  Nickname{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <Input
                  id="nickname"
                  placeholder="e.g. Nana"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canGoNext() && handleNext()}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 1 — Name Your Family */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>What do you call your family?</CardTitle>
              <CardDescription>
                Give your family a name to get started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="familyName">Family name</Label>
                <Input
                  id="familyName"
                  placeholder="e.g. The Johnsons"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canGoNext() && handleNext()}
                  autoFocus
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2 — About You */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Tell us a little about yourself</CardTitle>
              <CardDescription>
                This helps personalize your family archive. All fields are optional.
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
                  autoFocus
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
            </CardContent>
          </Card>
        )}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={loading}
            >
              <ArrowLeft className="size-4 mr-1" />
              Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step === 2 && (
              <Button
                variant="ghost"
                onClick={() => handleFinish(true)}
                disabled={loading}
              >
                Skip for now
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canGoNext() || loading}
            >
              {loading
                ? "Saving…"
                : step === 2
                ? "Get Started"
                : (
                  <>
                    Next
                    <ArrowRight className="size-4 ml-1" />
                  </>
                )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
