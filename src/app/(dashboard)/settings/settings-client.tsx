"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Mail,
  Lock,
  Sun,
  Moon,
  Monitor,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "./actions";

interface SettingsClientProps {
  email: string;
  provider: string;
  createdAt: string;
}

type Theme = "light" | "dark" | "system";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return (localStorage.getItem("mai-theme") as Theme) ?? "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === "system") {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", theme === "dark");
  }

  localStorage.setItem("mai-theme", theme);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function SettingsClient({
  email,
  provider,
  createdAt,
}: SettingsClientProps) {
  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Theme
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const isOAuth = provider !== "email";

  function handleThemeChange(newTheme: Theme) {
    setTheme(newTheme);
    applyTheme(newTheme);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSuccess(true);
        setTimeout(() => setPasswordSuccess(false), 3000);
      } else {
        toast.error(result.error ?? "Failed to update password");
      }
    });
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-10">
      {/* Page header */}
      <div className="flex items-center gap-4 border-b border-stone-200 dark:border-stone-800 pb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-700/10 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500 items-center justify-center">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">Account Settings</h1>
          <p className="text-sm font-medium text-stone-500">
            Manage your account preferences and security
          </p>
        </div>
      </div>

      {/* Account Info */}
      <Card className="border-stone-200 dark:border-[#2C3B2F] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-serif text-stone-900 dark:text-stone-100">
            <Mail className="h-5 w-5 text-amber-700 dark:text-amber-500" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your account details and sign-in method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs tracking-widest uppercase font-semibold text-stone-500">
                Email Address
              </Label>
              <p className="text-base font-medium text-stone-900 dark:text-stone-100">{email || "Not available"}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs tracking-widest uppercase font-semibold text-stone-500">
                Sign-in Method
              </Label>
              <p className="text-base font-medium capitalize text-stone-900 dark:text-stone-100">
                {isOAuth ? `${provider} (OAuth)` : "Email & Password"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs tracking-widest uppercase font-semibold text-stone-500">
                Account Created
              </Label>
              <p className="text-base font-medium text-stone-900 dark:text-stone-100">{formatDate(createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="border-stone-200 dark:border-[#2C3B2F] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-serif text-stone-900 dark:text-stone-100">
            <Lock className="h-5 w-5 text-amber-700 dark:text-amber-500" />
            Change Password
          </CardTitle>
          <CardDescription>
            {isOAuth
              ? `You signed in with ${provider}. Password management is handled by your ${provider} account.`
              : "Update your password to keep your account secure"}
          </CardDescription>
        </CardHeader>
        {!isOAuth && (
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current password */}
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrent ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                />
                {confirmPassword &&
                  newPassword &&
                  confirmPassword !== newPassword && (
                    <p className="text-xs text-destructive">
                      Passwords do not match
                    </p>
                  )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={
                    isPending ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : passwordSuccess ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Updated!
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Appearance */}
      <Card className="border-stone-200 dark:border-[#2C3B2F] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-serif text-stone-900 dark:text-stone-100">
            <Sun className="h-5 w-5 text-amber-700 dark:text-amber-500" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how MAI Legacy looks for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label className="text-sm">Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { value: "light", label: "Light", icon: Sun },
                  { value: "dark", label: "Dark", icon: Moon },
                  { value: "system", label: "System", icon: Monitor },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    theme === value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-accent"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      theme === value
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      theme === value ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl font-serif text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                toast.error(
                  "To delete your account, please contact support at support@usemai.com"
                );
              }}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#161B17] px-5 py-4 shadow-sm">
        <Shield className="h-5 w-5 text-stone-400 mt-0.5 shrink-0" />
        <p className="text-sm font-medium leading-relaxed text-stone-500 dark:text-stone-400 font-serif">
          Your data is encrypted and securely stored. MAI Legacy never shares
          your personal information with third parties.
        </p>
      </div>
    </div>
  );
}
