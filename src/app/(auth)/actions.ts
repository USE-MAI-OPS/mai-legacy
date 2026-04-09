"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { setActiveFamilyCookie } from "@/lib/active-family-server";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { sendDripWelcome, sendVerificationCodeEmail } from "@/lib/email";
import { createHash, randomInt } from "crypto";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  if (!email || !password) {
    const rp = redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : "";
    redirect(`/login?error=Please+fill+in+all+fields${rp}`);
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const rp = redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : "";
    redirect(`/login?error=${encodeURIComponent(error.message)}${rp}`);
  }

  redirect(getSafeRedirect(redirectTo, "/dashboard"));
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const displayName = formData.get("displayName") as string;
  const redirectTo = formData.get("redirect") as string | null;

  const rp = redirectTo ? `&redirect=${encodeURIComponent(redirectTo)}` : "";

  if (!email || !password || !confirmPassword || !displayName) {
    redirect(`/signup?error=Please+fill+in+all+fields${rp}`);
  }

  if (password !== confirmPassword) {
    redirect(`/signup?error=Passwords+do+not+match${rp}`);
  }

  if (password.length < 8) {
    redirect(`/signup?error=Password+must+be+at+least+8+characters${rp}`);
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    redirect(
      `/signup?error=Password+must+include+uppercase,+lowercase,+and+a+number${rp}`
    );
  }

  // Sign up — with email confirmation disabled in Supabase,
  // this auto-creates a session immediately.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}${rp}`);
  }

  // If session exists, user is auto-confirmed
  if (data.session) {
    // Fire Day 0 drip welcome email — non-blocking, failure is non-critical
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mailegacy.com";
    const admin = createAdminClient();
    sendDripWelcome({ to: email, displayName, appUrl })
      .then(() =>
        admin.from("drip_email_log").insert({ user_id: data.user!.id, step: "welcome" })
      )
      .catch((err) => console.error("[drip] Failed to send welcome email:", err));

    // Send email verification code
    try {
      await sendVerificationCode(email, data.user!.id);
    } catch (err) {
      console.error("[verify] Failed to send verification code:", err);
    }

    // Redirect to email verification page, preserving any invite redirect
    const verifyRedirect = redirectTo
      ? `/verify-email?redirect=${encodeURIComponent(redirectTo)}`
      : "/verify-email";
    redirect(verifyRedirect);
  }

  // Fallback: email confirmation is still enabled
  redirect(`/signup?message=Check+your+email+to+confirm+your+account${rp}`);
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function createFamily(
  familyName: string,
  displayName: string,
  nickname?: string,
  profileInfo?: { occupation?: string; birthday?: string; city?: string; state?: string }
) {
  // Use the normal client to verify the user is authenticated
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Use the admin client (service_role key) for DB writes
  // to bypass RLS — safe because we've already verified the user above
  const admin = createAdminClient();

  // Create the family
  const { data: family, error: familyError } = await admin
    .from("families")
    .insert({
      name: familyName.trim(),
      created_by: user.id,
    })
    .select("id")
    .single();

  if (familyError) {
    return { error: familyError.message };
  }

  // Add the current user as admin member
  const places = profileInfo?.city?.trim()
    ? [`${profileInfo.city.trim()}${profileInfo.state?.trim() ? `, ${profileInfo.state.trim()}` : ""}`]
    : [];

  const memberInsert: Record<string, unknown> = {
    family_id: family.id,
    user_id: user.id,
    role: "admin",
    display_name: displayName.trim(),
    life_story: {
      career: profileInfo?.occupation?.trim() ? [profileInfo.occupation.trim()] : [],
      places,
      education: [],
      skills: [],
      hobbies: [],
      military: null,
      milestones: [],
      ...(profileInfo?.birthday?.trim() ? { birthday: profileInfo.birthday.trim() } : {}),
    },
  };
  if (nickname?.trim()) memberInsert.nickname = nickname.trim();
  if (profileInfo?.occupation?.trim()) memberInsert.occupation = profileInfo.occupation.trim();

  const { error: memberError } = await admin
    .from("family_members")
    .insert(memberInsert as never);

  if (memberError) {
    return { error: memberError.message };
  }

  // Set this as the active family cookie (first created becomes active)
  try {
    await setActiveFamilyCookie(family.id);
    // Clear stale has-family cache so middleware doesn't redirect back to /onboarding
    const cookieStore = await cookies();
    cookieStore.delete("mai_has_family");
  } catch {
    // Non-critical — cookie will be set on next page load
  }

  // Create user's own root tree node (no parent links)
  try {
    const { data: memberRow } = await admin
      .from("family_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("family_id", family.id)
      .single();

    if (memberRow) {
      await admin
        .from("family_tree_members")
        .insert({
          family_id: family.id,
          display_name: displayName.trim(),
          linked_member_id: memberRow.id,
          parent_id: null,
          parent2_id: null,
        });
    }
  } catch (treeError) {
    // Non-critical — tree nodes can be added later
    console.error("Failed to create tree node during onboarding:", treeError);
  }

  return { success: true, familyId: family.id };
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const email = formData.get("email") as string;

  if (!email) {
    redirect("/forgot-password?error=Please+enter+your+email+address");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    redirect(`/forgot-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    "/forgot-password?message=Check+your+email+for+a+password+reset+link"
  );
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    redirect("/reset-password?error=Please+fill+in+all+fields");
  }

  if (password !== confirmPassword) {
    redirect("/reset-password?error=Passwords+do+not+match");
  }

  if (password.length < 8) {
    redirect("/reset-password?error=Password+must+be+at+least+8+characters");
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    redirect(
      "/reset-password?error=Password+must+include+uppercase,+lowercase,+and+a+number"
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=Password+updated+successfully.+Please+sign+in.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Non-redirecting signup (for inline flow)
// ---------------------------------------------------------------------------

export async function signupUser(fields: {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}) {
  const { email, password, confirmPassword, displayName } = fields;

  if (!email || !password || !confirmPassword || !displayName) {
    return { error: "Please fill in all fields." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { error: "Password must include uppercase, lowercase, and a number." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { error: "Check your email to confirm your account." };
  }

  // Fire Day 0 drip welcome — non-blocking
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mailegacy.com";
  const admin = createAdminClient();
  sendDripWelcome({ to: email, displayName, appUrl })
    .then(() =>
      admin.from("drip_email_log").insert({ user_id: data.user!.id, step: "welcome" })
    )
    .catch((err) => console.error("[drip] Failed to send welcome email:", err));

  // Send verification code
  try {
    console.log("[verify] Sending verification code to:", email, "userId:", data.user!.id);
    await sendVerificationCode(email, data.user!.id);
    console.log("[verify] Verification code sent successfully");
  } catch (err) {
    console.error("[verify] Failed to send verification code:", err);
    return { error: "Account created but failed to send verification email. Please try resending from the next screen." };
  }

  return { success: true, email };
}

// ---------------------------------------------------------------------------
// Email verification (6-digit OTP)
// ---------------------------------------------------------------------------

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function sendVerificationCode(email: string, userId: string) {
  console.log("[verify] sendVerificationCode called for:", email);
  const admin = createAdminClient();

  // Delete any existing codes for this user
  const { error: delError } = await admin.from("email_verifications").delete().eq("user_id", userId);
  if (delError) {
    console.error("[verify] Failed to delete old codes:", delError);
  }

  // Generate 6-digit code
  const code = String(randomInt(100000, 999999));
  console.log("[verify] Generated code, storing hash...");

  // Store hashed code with 10-minute expiry
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const { error } = await admin.from("email_verifications").insert({
    user_id: userId,
    email,
    code_hash: hashCode(code),
    expires_at: expiresAt,
  });

  if (error) {
    console.error("[verify] Failed to store verification code:", error);
    throw new Error("Failed to create verification code: " + error.message);
  }

  console.log("[verify] Code stored, sending email...");

  // Send branded email via Resend
  await sendVerificationCodeEmail({ to: email, code });
  console.log("[verify] Email sent successfully");

  return { success: true };
}

export async function verifyEmailCode(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const admin = createAdminClient();

  // Get latest non-expired verification record
  const { data: record, error: fetchError } = await admin
    .from("email_verifications")
    .select("*")
    .eq("user_id", user.id)
    .is("verified_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !record) {
    return { error: "Verification code expired. Please request a new one." };
  }

  // Rate limit: max 5 attempts
  if (record.attempts >= 5) {
    return { error: "Too many attempts. Please request a new code." };
  }

  // Increment attempts
  await admin
    .from("email_verifications")
    .update({ attempts: record.attempts + 1 })
    .eq("id", record.id);

  // Compare hashed code
  if (hashCode(code) !== record.code_hash) {
    return { error: "Incorrect code. Please try again." };
  }

  // Mark as verified
  await admin
    .from("email_verifications")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", record.id);

  // Set verification cache cookie
  try {
    const cookieStore = await cookies();
    cookieStore.set("mai_email_verified", `${user.id}:1`, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3600, // 1 hour cache
    });
  } catch {
    // Non-critical
  }

  return { success: true };
}

export async function resendVerificationCode() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "Not authenticated" };
  }

  const admin = createAdminClient();

  // Rate limit: check how many codes sent in last 10 minutes
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("email_verifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gt("created_at", tenMinAgo);

  if ((count ?? 0) >= 3) {
    return { error: "Too many requests. Please wait a few minutes." };
  }

  await sendVerificationCode(user.email, user.id);
  return { success: true };
}
