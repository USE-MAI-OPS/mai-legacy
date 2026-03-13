"use client";

import { useState } from "react";
import Link from "next/link";
import { signup } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import { PasswordInput } from "@/components/password-input";
import { PasswordStrengthBar } from "@/components/password-strength";

export function SignupForm() {
  const [password, setPassword] = useState("");

  return (
    <form action={signup} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          placeholder="Your name"
          required
          autoComplete="name"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          name="password"
          placeholder="At least 6 characters"
          required
          minLength={6}
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordStrengthBar password={password} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Re-enter your password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          name="terms"
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

      <SubmitButton className="w-full" loadingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
