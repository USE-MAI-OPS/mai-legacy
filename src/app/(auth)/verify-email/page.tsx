"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2, RotateCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyEmailCode, resendVerificationCode } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { getSafeRedirect } from "@/lib/safe-redirect";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch user email on mount
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        const e = user.email;
        const [name, domain] = e.split("@");
        const masked =
          name.length > 2
            ? name[0] + "*".repeat(name.length - 2) + name[name.length - 1]
            : name;
        setEmail(`${masked}@${domain}`);
      }
    });
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleDigitChange(index: number, value: string) {
    // Only allow single digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
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
      const newDigits = pasted.split("");
      setDigits(newDigits);
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

    setSuccess(true);

    // Redirect after brief success animation. getSafeRedirect rejects
    // absolute URLs / protocol-relative URLs so an attacker cannot craft
    // ?redirect=https://evil.com to phish verified users.
    setTimeout(() => {
      window.location.href = getSafeRedirect(redirectTo, "/onboarding");
    }, 1000);
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setResending(true);
    setError(null);

    const result = await resendVerificationCode();

    if (result.error) {
      setError(result.error);
    } else {
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setCooldown(60);
    }

    setResending(false);
  }

  if (success) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardContent className="pt-8 pb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <ShieldCheck className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Email Verified!</h2>
          <p className="text-muted-foreground">Setting up your account...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C17B54]/10">
          <ShieldCheck className="h-7 w-7 text-[#C17B54]" />
        </div>
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email"
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 6-digit input */}
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

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

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

        <div className="text-center space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-muted-foreground"
          >
            <RotateCcw className="size-3.5 mr-1.5" />
            {cooldown > 0
              ? `Resend code in ${cooldown}s`
              : resending
              ? "Sending..."
              : "Resend code"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Wrong email?{" "}
            <a href="/signup" className="text-[#C17B54] hover:underline">
              Sign up again
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
