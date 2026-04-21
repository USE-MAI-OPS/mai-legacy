import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function BlogCta() {
  return (
    <div className="mt-16 rounded-lg border border-stone-200 bg-stone-50 p-8 text-center">
      <h3 className="font-lora text-xl font-semibold text-stone-900">
        Start preserving your family stories
      </h3>
      <p className="mt-2 text-stone-600">
        Upload memories, ask Griot AI anything about your family, and export
        a Legacy Book you can hold in your hands.
      </p>
      <Link
        href="/auth/signup"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
      >
        Get started free <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
