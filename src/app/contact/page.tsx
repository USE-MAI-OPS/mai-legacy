import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare } from "lucide-react";
import Link from "next/link";

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              Send us a message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action="mailto:support@usemai.com"
              method="POST"
              encType="text/plain"
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Your name" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="How can we help?"
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>

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
