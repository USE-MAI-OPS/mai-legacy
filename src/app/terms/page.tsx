import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: March 12, 2026
        </p>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-8">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using MAI Legacy (&quot;the Service&quot;), you
              agree to be bound by these Terms of Service. If you do not agree,
              please do not use the Service. We may update these terms from time
              to time, and your continued use of the Service constitutes
              acceptance of any changes.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              MAI Legacy is a family knowledge platform that allows families to
              document, organize, and retrieve stories, recipes, skills, and
              other knowledge. The Service includes AI-powered features (the
              &quot;Griot&quot;) that answer questions using family-contributed
              content.
            </p>
          </Section>

          <Section title="3. User Accounts">
            <p>
              You must create an account to use the Service. You are responsible
              for maintaining the confidentiality of your account credentials and
              for all activities that occur under your account. You must be at
              least 13 years old to use the Service.
            </p>
          </Section>

          <Section title="4. User Content">
            <p>
              You retain full ownership of all content you submit to the Service,
              including stories, recipes, skills, photos, and other materials
              (&quot;User Content&quot;). By submitting User Content, you grant
              MAI Legacy a limited license to store, process, and display your
              content solely for the purpose of providing the Service to you and
              your family members.
            </p>
            <p>
              You are solely responsible for the content you submit. You agree
              not to submit content that is unlawful, harmful, threatening,
              abusive, or otherwise objectionable.
            </p>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Upload malicious code, viruses, or harmful data</li>
              <li>Scrape, copy, or redistribute content from other families</li>
              <li>Use the Service to harass, abuse, or harm others</li>
            </ul>
          </Section>

          <Section title="6. Intellectual Property">
            <p>
              The Service, including its design, code, logos, and branding, is
              owned by MAI Legacy and protected by intellectual property laws.
              You may not copy, modify, or distribute any part of the Service
              without prior written permission. Your User Content remains yours
              as described in Section 4.
            </p>
          </Section>

          <Section title="7. Disclaimer of Warranties">
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, either express or
              implied. We do not guarantee that the Service will be
              uninterrupted, error-free, or completely secure. AI-generated
              responses from the Griot are based on user-contributed content and
              may not always be accurate.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the fullest extent permitted by law, MAI Legacy shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of the Service. Our total
              liability shall not exceed the amount you paid for the Service in
              the twelve months preceding the claim.
            </p>
          </Section>

          <Section title="9. Changes to Terms">
            <p>
              We may update these Terms of Service from time to time. We will
              notify you of material changes by posting the updated terms on the
              Service and updating the &quot;Last updated&quot; date. Your
              continued use of the Service after changes are posted constitutes
              acceptance of the revised terms.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              If you have questions about these Terms of Service, please contact
              us at{" "}
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
