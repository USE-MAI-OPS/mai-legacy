import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="font-serif text-6xl font-bold text-primary mb-2">404</h1>
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
        Page not found
      </h2>
      <p className="text-muted-foreground text-base max-w-sm mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
