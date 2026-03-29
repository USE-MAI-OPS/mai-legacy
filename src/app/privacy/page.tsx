import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how MAI Legacy collects, uses, and protects your family's data. Your stories stay private — always.",
  openGraph: {
    title: "Privacy Policy | MAI Legacy",
    description:
      "Learn how MAI Legacy collects, uses, and protects your family's data.",
    url: "/privacy",
  },
  robots: { index: true, follow: false },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-serif text-xl font-bold text-primary">
            MAI Legacy
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: March 12, 2026
        </p>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-8">
          <Section title="1. Information We Collect">
            <p>
              We collect information you provide directly when using MAI Legacy:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>Account information:</strong> Your name, email address,
                and password when you create an account.
              </li>
              <li>
                <strong>Family content:</strong> Stories, recipes, skills,
                lessons, photos, and other knowledge you and your family members
                contribute.
              </li>
              <li>
                <strong>Profile information:</strong> Optional details like your
                location, skills, and biographical information.
              </li>
              <li>
                <strong>Usage data:</strong> Basic analytics about how you
                interact with the Service, including pages visited and features
                used.
              </li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Provide, maintain, and improve the Service</li>
              <li>
                Power the Griot AI by generating embeddings from your family&apos;s
                content to enable search and question-answering within your family
              </li>
              <li>Send you important service-related communications</li>
              <li>Respond to your support requests</li>
              <li>Protect against fraud and abuse</li>
            </ul>
            <p>
              We do <strong>not</strong> use your family&apos;s content to train
              general-purpose AI models or for any purpose beyond providing the
              Service to your family.
            </p>
          </Section>

          <Section title="3. Data Storage and Security">
            <p>
              Your data is stored securely using Supabase, with
              industry-standard encryption in transit (TLS) and at rest. We
              implement row-level security (RLS) to ensure that each family&apos;s
              data is completely isolated — no family can access another
              family&apos;s content.
            </p>
            <p>
              While we take reasonable measures to protect your data, no method
              of transmission or storage is 100% secure. We cannot guarantee
              absolute security.
            </p>
          </Section>

          <Section title="4. Data Sharing">
            <p>
              <strong>We do not sell your data. Ever.</strong>
            </p>
            <p>
              We will never sell, rent, or share your family&apos;s content with
              advertisers, data brokers, or any third party for marketing
              purposes. Your family&apos;s stories, recipes, and wisdom are
              yours.
            </p>
            <p>We may share limited information only in these cases:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>Service providers:</strong> We use third-party services
                (hosting, AI embeddings) that process data on our behalf under
                strict confidentiality agreements.
              </li>
              <li>
                <strong>Legal requirements:</strong> We may disclose information
                if required by law, court order, or governmental request.
              </li>
              <li>
                <strong>Safety:</strong> We may share information to prevent
                fraud, protect safety, or enforce our terms.
              </li>
            </ul>
          </Section>

          <Section title="5. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>Access:</strong> View all data we hold about you and your
                family.
              </li>
              <li>
                <strong>Export:</strong> Download your family&apos;s content at
                any time.
              </li>
              <li>
                <strong>Delete:</strong> Request deletion of your account and all
                associated data. We will process deletion requests within 30
                days.
              </li>
              <li>
                <strong>Correct:</strong> Update or correct any inaccurate
                information.
              </li>
            </ul>
            <p>
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:support@mailegacy.com"
                className="text-primary hover:underline"
              >
                support@mailegacy.com
              </a>
              .
            </p>
          </Section>

          <Section title="6. Children's Privacy">
            <p>
              MAI Legacy is designed for family use, and we understand that
              families may include children. Users must be at least 13 years old
              to create an account. Family members under 13 may have content
              contributed on their behalf by a parent or guardian. We do not
              knowingly collect personal information from children under 13
              without parental consent.
            </p>
          </Section>

          <Section title="7. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify
              you of material changes by posting the updated policy on the
              Service and updating the &quot;Last updated&quot; date. Your
              continued use of the Service after changes are posted constitutes
              acceptance of the revised policy.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              If you have questions about this Privacy Policy or how we handle
              your data, please contact us at{" "}
              <a
                href="mailto:support@mailegacy.com"
                className="text-primary hover:underline"
              >
                support@mailegacy.com
              </a>
              .
            </p>
          </Section>
        </div>

        <Separator className="my-10" />
        <p className="text-center text-xs text-muted-foreground">
          &copy; 2026 MAI Legacy. All rights reserved.
        </p>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
        {children}
      </div>
    </div>
  );
}
