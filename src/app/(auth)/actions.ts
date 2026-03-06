"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { LifeStory, MemberSpecialty } from "@/types/database";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=Please+fill+in+all+fields");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const displayName = formData.get("displayName") as string;

  if (!email || !password || !confirmPassword || !displayName) {
    redirect("/signup?error=Please+fill+in+all+fields");
  }

  if (password !== confirmPassword) {
    redirect("/signup?error=Passwords+do+not+match");
  }

  if (password.length < 6) {
    redirect("/signup?error=Password+must+be+at+least+6+characters");
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
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // If session exists, user is auto-confirmed → go to onboarding
  if (data.session) {
    redirect("/onboarding");
  }

  // Fallback: email confirmation is still enabled
  redirect("/signup?message=Check+your+email+to+confirm+your+account");
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
  lifeStory?: LifeStory,
  profileFields?: {
    nickname?: string;
    phone?: string;
    email?: string;
    occupation?: string;
    country?: string;
    state?: string;
    specialty?: MemberSpecialty;
  }
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

  // Add the current user as admin member with life story data
  const { error: memberError } = await admin
    .from("family_members")
    .insert({
      family_id: family.id,
      user_id: user.id,
      role: "admin",
      display_name: displayName.trim(),
      life_story: lifeStory ?? {
        career: [],
        places: [],
        education: [],
        skills: [],
        hobbies: [],
        military: null,
        milestones: [],
      },
      ...profileFields,
    });

  if (memberError) {
    return { error: memberError.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
