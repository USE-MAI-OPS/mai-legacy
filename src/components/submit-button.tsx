"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/**
 * Drop-in replacement for <Button type="submit"> inside a <form>.
 * Shows a spinner + disables when the form's server action is pending.
 * Adds a subtle scale-down on click for tactile feedback.
 */
export function SubmitButton({
  children,
  loadingText,
  className,
  ...props
}: ComponentProps<typeof Button> & {
  /** Optional text to show while loading (e.g. "Signing in…") */
  loadingText?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className={cn(
        "active:scale-[0.97] transition-all duration-150",
        className
      )}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
