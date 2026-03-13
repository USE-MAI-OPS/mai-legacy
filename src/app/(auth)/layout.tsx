import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block">
          <h1 className="font-serif text-3xl font-bold text-primary">
            MAI Legacy
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your family&apos;s knowledge, preserved forever
          </p>
        </Link>
      </div>
      {children}
    </div>
  );
}
