"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Loader2,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
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
import { PasswordInput } from "@/components/password-input";
import { PasswordStrengthBar } from "@/components/password-strength";
import {
  signupUser,
  verifyEmailCode,
  resendVerificationCode,
  createFamily,
} from "../actions";

// ---------------------------------------------------------------------------
// Progress bar — spans the entire flow
// ---------------------------------------------------------------------------
const TOTAL_STEPS = 5; // signup, verify, name, family, profile

function FlowProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
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
// Main unified flow
// ---------------------------------------------------------------------------
type FlowStep = "signup" | "verify" | "name" | "family" | "profile" | "done";

export function SignupFlow({ redirectTo }: { redirectTo?: string }) {
  // -- Flow state
  const [step, setStep] = useState<FlowStep>("signup");
  const stepIndex =
    step === "signup" ? 0
    : step === "verify" ? 1
    : step === "name" ? 2
    : step === "family" ? 3
    : step === "profile" ? 4
    : 5;

  // -- Signup fields
  const [displayNameField, setDisplayNameField] = useState("");
  const [emailField, setEmailField] = useState("");
  const [passwordField, setPasswordField] = useState("");
  const [confirmPasswordField, setConfirmPasswordField] = useState("");

  // -- Verify fields
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const [maskedEmail, setMaskedEmail] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // -- Onboarding fields
  const [displayName, setDisplayName] = useState("");
  const [nickname, setNickname] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [birthday, setBirthday] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // -- Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Auto-focus OTP first input when entering verify step
  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // -------------------------------------------------------------------
  // Step 1: Signup
  // -------------------------------------------------------------------
  async function handleSignup() {
    setLoading(true);
    setError(null);

    const result = await signupUser({
      email: emailField,
      password: passwordField,
      confirmPassword: confirmPasswordField,
      displayName: displayNameField,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Mask email for verification display
    const [name, domain] = emailField.split("@");
    const masked =
      name.length > 2
        ? name[0] + "*".repeat(name.length - 2) + name[name.length - 1]
        : name;
    setMaskedEmail(`${masked}@${domain}`);

    // Pre-fill display name for onboarding
    setDisplayName(displayNameField);

    setCooldown(60);
    setLoading(false);
    setStep("verify");
  }

  // -------------------------------------------------------------------
  // Step 2: Verify OTP
  // -------------------------------------------------------------------
  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5 && newDigits.every((d) => d)) {
      handleVerify(newDigits.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      handleVerify(pasted);
    }
  }

  async function handleVerify(code?: string) {
    const fullCode = code || digits.join("");
    if (fullCode.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await verifyEmailCode(fullCode);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("name");
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setLoading(true);
    setError(null);

    const result = await resendVerificationCode();

    if (result.error) {
      setError(result.error);
    } else {
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setCooldown(60);
    }
    setLoading(false);
  }

  // -------------------------------------------------------------------
  // Steps 3-5: Onboarding
  // -------------------------------------------------------------------
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

      setStep("done");

      // Brief success animation then redirect
      setTimeout(() => {
        window.location.href = redirectTo || "/dashboard";
      }, 1500);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div className="w-full max-w-md space-y-6">
      <FlowProgress current={stepIndex} />

      {/* ---- STEP: SIGNUP ---- */}
      {step === "signup" && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>
              Start preserving your family&apos;s legacy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                placeholder="Your name"
                value={displayNameField}
                onChange={(e) => setDisplayNameField(e.target.value)}
                autoComplete="name"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={emailField}
                onChange={(e) => setEmailField(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="At least 8 characters"
                value={passwordField}
                onChange={(e) => setPasswordField(e.target.value)}
                autoComplete="new-password"
              />
              <PasswordStrengthBar password={passwordField} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Re-enter your password"
                value={confirmPasswordField}
                onChange={(e) => setConfirmPasswordField(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer"
              />
              <span className="text-xs text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>

            <Button
              className="w-full"
              onClick={handleSignup}
              disabled={
                loading ||
                !displayNameField.trim() ||
                !emailField.trim() ||
                !passwordField ||
                !confirmPasswordField
              }
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{" "}
              <Link
                href={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP: VERIFY EMAIL ---- */}
      {step === "verify" && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C17B54]/10">
              <ShieldCheck className="h-7 w-7 text-[#C17B54]" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{maskedEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-14 w-12 text-center text-2xl font-mono font-bold"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            <Button
              className="w-full bg-[#C17B54] hover:bg-[#A8654A]"
              onClick={() => handleVerify()}
              disabled={loading || digits.some((d) => !d)}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={loading || cooldown > 0}
                className="text-muted-foreground"
              >
                <RotateCcw className="size-3.5 mr-1.5" />
                {cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend code"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP: YOUR NAME ---- */}
      {step === "name" && (
        <Card>
          <CardHeader>
            <CardTitle>What should we call you?</CardTitle>
            <CardDescription>
              This is how you&apos;ll appear to your family.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="onboardName">Your name</Label>
              <Input
                id="onboardName"
                placeholder="e.g. Grandma Rosa"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && displayName.trim() && setStep("family")
                }
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboardNickname">
                Nickname{" "}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="onboardNickname"
                placeholder="e.g. Nana"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && displayName.trim() && setStep("family")
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP: FAMILY NAME ---- */}
      {step === "family" && (
        <Card>
          <CardHeader>
            <CardTitle>What do you call your family?</CardTitle>
            <CardDescription>
              Give your family a name to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="onboardFamily">Family name</Label>
              <Input
                id="onboardFamily"
                placeholder="e.g. The Johnsons"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && familyName.trim() && setStep("profile")
                }
                autoFocus
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- STEP: ABOUT YOU ---- */}
      {step === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Tell us a little about yourself</CardTitle>
            <CardDescription>
              This helps personalize your family archive. All fields are optional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
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

      {/* ---- STEP: DONE ---- */}
      {step === "done" && (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">You&apos;re all set!</h2>
            <p className="text-muted-foreground">Taking you to your dashboard...</p>
          </CardContent>
        </Card>
      )}

      {/* ---- NAVIGATION (onboarding steps only) ---- */}
      {(step === "name" || step === "family" || step === "profile") && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              setError(null);
              if (step === "name") return; // Can't go back to verify
              if (step === "family") setStep("name");
              if (step === "profile") setStep("family");
            }}
            disabled={loading || step === "name"}
            className={step === "name" ? "invisible" : ""}
          >
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            {step === "profile" && (
              <Button
                variant="ghost"
                onClick={() => handleFinish(true)}
                disabled={loading}
              >
                Skip for now
              </Button>
            )}
            <Button
              onClick={() => {
                setError(null);
                if (step === "name") {
                  if (!displayName.trim()) {
                    setError("Please enter your name.");
                    return;
                  }
                  setStep("family");
                } else if (step === "family") {
                  if (!familyName.trim()) {
                    setError("Please enter a family name.");
                    return;
                  }
                  setStep("profile");
                } else if (step === "profile") {
                  handleFinish(false);
                }
              }}
              disabled={
                loading ||
                (step === "name" && !displayName.trim()) ||
                (step === "family" && !familyName.trim())
              }
            >
              {loading ? (
                "Saving..."
              ) : step === "profile" ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ArrowRight className="size-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
