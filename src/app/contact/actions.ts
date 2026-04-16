"use server";

import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { sendContactEmail } from "@/lib/email";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim();
  const message = (input.message ?? "").trim();

  if (!name || !email || !message) {
    return { success: false, error: "Please fill in all fields." };
  }
  if (name.length > 100) {
    return { success: false, error: "Name is too long." };
  }
  if (!EMAIL_REGEX.test(email) || email.length > 200) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (message.length > 5000) {
    return { success: false, error: "Message is too long (max 5000 chars)." };
  }

  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";

  const { limited } = rateLimit(`contact:${ip}`, 5, 60_000);
  if (limited) {
    return {
      success: false,
      error: "Too many messages sent. Please try again in a minute.",
    };
  }

  try {
    const result = await sendContactEmail({
      fromName: name,
      fromEmail: email,
      message,
    });
    if (result.error) {
      return {
        success: false,
        error: "We couldn't send your message. Please try again later.",
      };
    }
    return { success: true };
  } catch (err) {
    console.error("sendContactMessage error:", err);
    return {
      success: false,
      error: "We couldn't send your message. Please try again later.",
    };
  }
}
