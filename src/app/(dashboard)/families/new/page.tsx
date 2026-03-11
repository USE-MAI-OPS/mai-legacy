"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFamily } from "@/app/(auth)/actions";
import Link from "next/link";

export default function AddFamilyPage() {
  const router = useRouter();
  const [familyName, setFamilyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const name = familyName.trim();
    if (!name) return;
    setLoading(true);
    setError(null);

    try {
      // createFamily with no lifeStory/profileFields will auto-inherit
      // profile data from the user's existing membership
      const result = await createFamily(name, "");
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        // Redirect to dashboard — the new family is now active (cookie set)
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-lg">
      <Button variant="ghost" size="sm" asChild className="mb-6 gap-1">
        <Link href="/dashboard">
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card>
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Add a New Family</CardTitle>
          <CardDescription>
            Create a separate family for another branch of your family tree.
            Your profile will be shared across all families.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="family-name">Family Name</Label>
            <Input
              id="family-name"
              placeholder="e.g., Mom's Side, The Johnsons"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && familyName.trim()) {
                  handleCreate();
                }
              }}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={handleCreate}
            disabled={!familyName.trim() || loading}
            className="w-full gap-1.5"
          >
            {loading ? (
              "Creating..."
            ) : (
              <>
                <Plus className="size-4" />
                Create Family
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
