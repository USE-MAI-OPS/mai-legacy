"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { X, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatureToggle } from "@/components/entry-forms/mature-toggle";
import type { ConnectionData } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ConnectionFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    type: "connection";
    tags: string[];
    structured_data: { type: "connection"; data: ConnectionData };
    is_mature?: boolean;
  }) => Promise<void>;
  saving?: boolean;
  mode?: "create" | "edit";
  cancelHref?: string;
  initialTitle?: string;
  initialTags?: string[];
  initialData?: Partial<ConnectionData>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const RELATIONSHIPS = [
  "Mother",
  "Father",
  "Sister",
  "Brother",
  "Aunt",
  "Uncle",
  "Cousin",
  "Grandparent",
  "Friend",
  "Neighbor",
  "Other",
] as const;

const SUGGESTED_CONNECTION_TAGS = [
  "Family",
  "Friend",
  "Mentor",
  "Colleague",
  "Childhood",
  "Neighbor",
  "Church",
  "School",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function flattenConnectionToContent(
  name: string,
  relationship: string,
  phone: string,
  email: string,
  address: string,
  birthday: string,
  notes: string
): string {
  const parts: string[] = [`Connection: ${name}`];

  if (relationship) parts.push(`Relationship: ${relationship}`);
  if (phone.trim()) parts.push(`Phone: ${phone.trim()}`);
  if (email.trim()) parts.push(`Email: ${email.trim()}`);
  if (address.trim()) parts.push(`Address: ${address.trim()}`);
  if (birthday) parts.push(`Birthday: ${birthday}`);
  if (notes.trim()) parts.push(`\nNotes:\n${notes.trim()}`);

  return parts.join("\n");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ConnectionForm({
  onSubmit,
  saving = false,
  mode = "create",
  cancelHref = "/entries",
  initialTitle,
  initialTags,
  initialData,
}: ConnectionFormProps) {
  // State
  const [fullName, setFullName] = useState(initialData?.name ?? "");
  const [relationship, setRelationship] = useState(initialData?.relationship ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [birthday, setBirthday] = useState(initialData?.birthday ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [isMature, setIsMature] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ---------------------------------------------------------------------------
  // Tag management
  // ---------------------------------------------------------------------------
  const addTagsFromInput = useCallback(() => {
    const newTags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));
    if (newTags.length > 0) setTags((prev) => [...prev, ...newTags]);
    setTagInput("");
  }, [tagInput, tags]);

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTagsFromInput();
    }
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((t) => t !== tag));

  const toggleSuggestedTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // ---------------------------------------------------------------------------
  // Validation + submit
  // ---------------------------------------------------------------------------
  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;

    const autoTitle = relationship
      ? `${fullName.trim()} (${relationship})`
      : fullName.trim();

    const structuredData: ConnectionData = {
      name: fullName.trim(),
      relationship,
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      notes: notes.trim(),
      birthday,
    };

    const content = flattenConnectionToContent(
      fullName.trim(),
      relationship,
      phone,
      email,
      address,
      birthday,
      notes
    );

    await onSubmit({
      title: autoTitle,
      content,
      type: "connection",
      tags,
      structured_data: { type: "connection", data: structuredData },
      is_mature: isMature,
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Card className="rounded-2xl border-primary/10 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-pink-100 p-4 text-pink-600">
            <Users className="size-6" />
          </div>
          <div>
            <CardTitle className="font-serif text-3xl text-primary">{mode === "edit" ? "Edit Connection" : "New Connection"}</CardTitle>
            <CardDescription className="text-base">
              {mode === "edit" ? "Update this connection's details." : "Keep track of the people who matter to your family."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Full Name */}
        <div className="space-y-3 bg-muted/30 p-6 rounded-2xl border border-border/50">
          <Label htmlFor="conn-name" className="text-lg">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="conn-name"
            placeholder="e.g., Aunt Dorothy Mae Johnson"
            className="text-lg py-6 rounded-xl border-accent-foreground/20 bg-background"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((p) => ({ ...p, fullName: "" }));
            }}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive font-medium">{errors.fullName}</p>
          )}
        </div>

        {/* Relationship */}
        <div className="space-y-3 bg-muted/20 p-6 rounded-2xl border border-border/40">
          <Label htmlFor="conn-relationship" className="text-lg">Relationship</Label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger id="conn-relationship" className="w-full text-base py-6 rounded-xl border-accent-foreground/20 bg-background">
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((rel) => (
                <SelectItem key={rel} value={rel} className="text-base py-3">
                  {rel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-2 gap-6 bg-muted/10 p-6 rounded-2xl border border-border/40">
          {/* Phone & Email */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="conn-phone" className="text-lg">Phone</Label>
              <Input
                id="conn-phone"
                type="tel"
                placeholder="(555) 123-4567"
                className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="conn-email" className="text-lg">Email</Label>
              <Input
                id="conn-email"
                type="email"
                placeholder="dorothy@email.com"
                className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {/* Address */}
            <div className="space-y-3">
              <Label htmlFor="conn-address" className="text-lg">Address</Label>
              <Input
                id="conn-address"
                placeholder="123 Oak Street, Atlanta, GA"
                className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Birthday */}
            <div className="space-y-3">
              <Label htmlFor="conn-birthday" className="text-lg">Birthday</Label>
              <Input
                id="conn-birthday"
                type="date"
                className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          <Label htmlFor="conn-notes" className="text-lg">Notes / Story</Label>
          <Textarea
            id="conn-notes"
            placeholder="How do you know this person? What makes them special to your family?"
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-y text-base p-6 rounded-2xl border-accent-foreground/30 leading-relaxed"
          />
        </div>

        {/* Tags */}
        <div className="space-y-3 bg-muted/20 p-6 rounded-2xl border border-border/40">
          <Label htmlFor="conn-tags" className="text-lg">Tags & Groups</Label>
          <p className="text-sm text-muted-foreground mb-4">Tap tags below, or type your own.</p>

          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_CONNECTION_TAGS.map((tag) => {
              const isActive = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleSuggestedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          <Input
            id="conn-tags"
            placeholder="Type extra tags and press Enter"
            className="text-base py-5 rounded-xl border-accent-foreground/20 bg-background"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTagsFromInput}
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm bg-secondary/60">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="size-3.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-4 p-6 bg-muted/10 rounded-b-2xl border-t border-border/50">
        <MatureToggle checked={isMature} onCheckedChange={setIsMature} />
        <Button variant="ghost" size="lg" className="rounded-xl text-muted-foreground hover:text-foreground hover:bg-black/5" asChild>
          <Link href={cancelHref}>Cancel</Link>
        </Button>
        <Button size="lg" className="rounded-xl px-8 shadow-md" onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-5 mr-2 animate-spin" />}
          {mode === "edit" ? "Save Changes" : "Save Connection"}
        </Button>
      </CardFooter>
    </Card>
  );
}
