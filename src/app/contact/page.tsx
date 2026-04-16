import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ContactForm } from "./contact-form";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the MAI Legacy team.",
  openGraph: {
    title: "Contact Us | MAI Legacy",
    description: "Get in touch with the MAI Legacy team.",
    url: "/contact",
  },
  twitter: {
    title: "Contact Us | MAI Legacy",
    description: "Get in touch with the MAI Legacy team.",
  },
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-3xl font-bold text-foreground">
            Contact Us
          </h1>
          <p className="text-muted-foreground text-sm">
            Have a question or feedback? We&apos;d love to hear from you.
          </p>
        </div>

        <ContactForm />

        <p className="text-center text-xs text-muted-foreground">
          Or email us directly at{" "}
          <a
            href="mailto:support@usemai.com"
            className="text-primary underline underline-offset-2"
          >
            support@usemai.com
          </a>
        </p>

        <div className="text-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
