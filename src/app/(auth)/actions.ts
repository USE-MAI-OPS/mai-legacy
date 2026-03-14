"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import type { LifeStory, MemberSpecialty } from "@/types/database";
import { setActiveFamilyCookie } from "@/lib/active-family-server";

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

  redirect(redirectTo || "/dashboard");
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

  if (password.length < 6) {
    redirect(`/signup?error=Password+must+be+at+least+6+characters${rp}`);
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
    // If there's an invite redirect, go there instead of onboarding
    redirect(redirectTo || "/onboarding");
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
  lifeStory?: LifeStory,
  profileFields?: {
    nickname?: string;
    phone?: string;
    email?: string;
    occupation?: string;
    country?: string;
    state?: string;
    specialty?: MemberSpecialty;
  },
  parentData?: {
    motherName: string;
    motherBirthYear?: number;
    motherIsDeceased?: boolean;
    fatherName: string;
    fatherBirthYear?: number;
    fatherIsDeceased?: boolean;
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

  // Check if user already has a membership (creating 2nd+ family)
  // If so, inherit profile data from the existing row
  let memberData: Record<string, unknown> = {
    family_id: family.id,
    user_id: user.id,
    role: "admin",
    display_name: displayName.trim(),
  };

  if (lifeStory || profileFields) {
    // Explicit data provided (first family during onboarding)
    memberData.life_story = lifeStory ?? {
      career: [],
      places: [],
      education: [],
      skills: [],
      hobbies: [],
      military: null,
      milestones: [],
    };
    if (profileFields) {
      Object.assign(memberData, profileFields);
    }
  } else {
    // No explicit data — try to inherit from an existing membership
    const { data: existingMember } = await admin
      .from("family_members")
      .select(
        "display_name, life_story, nickname, phone, email, occupation, country, state, specialty"
      )
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (existingMember) {
      memberData = {
        ...memberData,
        display_name: existingMember.display_name || displayName.trim(),
        life_story: existingMember.life_story ?? {
          career: [],
          places: [],
          education: [],
          skills: [],
          hobbies: [],
          military: null,
          milestones: [],
        },
        nickname: existingMember.nickname,
        phone: existingMember.phone,
        email: existingMember.email,
        occupation: existingMember.occupation,
        country: existingMember.country,
        state: existingMember.state,
        specialty: existingMember.specialty,
      };
    } else {
      memberData.life_story = {
        career: [],
        places: [],
        education: [],
        skills: [],
        hobbies: [],
        military: null,
        milestones: [],
      };
    }
  }

  // Add the current user as admin member
  const { error: memberError } = await (admin as any)
    .from("family_members")
    .insert(memberData);

  if (memberError) {
    return { error: memberError.message };
  }

  // Set this as the active family cookie (first created becomes active)
  try {
    await setActiveFamilyCookie(family.id);
  } catch {
    // Non-critical — cookie will be set on next page load
  }

  // Create tree nodes for the user and their parents (connection chain foundation)
  if (parentData?.motherName && parentData?.fatherName) {
    try {
      // Get the family_members row we just created (need its ID for linked_member_id)
      const { data: memberRow } = await (admin as any)
        .from("family_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("family_id", family.id)
        .single();

      if (memberRow) {
        // 1. Create mother tree node
        const { data: motherNode } = await (admin as any)
          .from("family_tree_members")
          .insert({
            family_id: family.id,
            display_name: parentData.motherName.trim(),
            relationship_label: "Mother",
            birth_year: parentData.motherBirthYear || null,
            is_deceased: parentData.motherIsDeceased ?? false,
          })
          .select("id")
          .single();

        // 2. Create father tree node
        const { data: fatherNode } = await (admin as any)
          .from("family_tree_members")
          .insert({
            family_id: family.id,
            display_name: parentData.fatherName.trim(),
            relationship_label: "Father",
            birth_year: parentData.fatherBirthYear || null,
            is_deceased: parentData.fatherIsDeceased ?? false,
            spouse_id: motherNode?.id ?? null,
          })
          .select("id")
          .single();

        // Set bidirectional spouse link on mother
        if (motherNode && fatherNode) {
          await (admin as any)
            .from("family_tree_members")
            .update({ spouse_id: fatherNode.id })
            .eq("id", motherNode.id);
        }

        // 3. Create user's own tree node linked to both parents
        await (admin as any)
          .from("family_tree_members")
          .insert({
            family_id: family.id,
            display_name: displayName.trim(),
            linked_member_id: memberRow.id,
            parent_id: motherNode?.id ?? null,
            parent2_id: fatherNode?.id ?? null,
          });
      }
    } catch (treeError) {
      // Non-critical — tree nodes can be added later
      console.error("Failed to create tree nodes during onboarding:", treeError);
    }
  }

  return { success: true };
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

  if (password.length < 6) {
    redirect("/reset-password?error=Password+must+be+at+least+6+characters");
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
