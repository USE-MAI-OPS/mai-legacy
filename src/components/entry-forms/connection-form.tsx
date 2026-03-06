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
  }) => Promise<void>;
  saving?: boolean;
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
}: ConnectionFormProps) {
  // State
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState("");
  const [notes, setNotes] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
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
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-pink-100 p-2 text-pink-500">
            <Users className="size-5" />
          </div>
          <div>
            <CardTitle className="text-2xl">New Connection</CardTitle>
            <CardDescription>
              Keep track of the people who matter to your family.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="conn-name">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="conn-name"
            placeholder="e.g., Aunt Dorothy Mae Johnson"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((p) => ({ ...p, fullName: "" }));
            }}
            aria-invalid={!!errors.fullName}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName}</p>
          )}
        </div>

        {/* Relationship */}
        <div className="space-y-2">
          <Label htmlFor="conn-relationship">Relationship</Label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger id="conn-relationship" className="w-full">
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((rel) => (
                <SelectItem key={rel} value={rel}>
                  {rel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phone & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="conn-phone">Phone</Label>
            <Input
              id="conn-phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conn-email">Email</Label>
            <Input
              id="conn-email"
              type="email"
              placeholder="dorothy@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="conn-address">Address</Label>
          <Input
            id="conn-address"
            placeholder="123 Oak Street, Atlanta, GA"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* Birthday */}
        <div className="space-y-2">
          <Label htmlFor="conn-birthday">Birthday</Label>
          <Input
            id="conn-birthday"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="conn-notes">Notes / Story</Label>
          <Textarea
            id="conn-notes"
            placeholder="How do you know this person? What makes them special to your family?"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="resize-y"
          />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="conn-tags">Tags</Label>
          <Input
            id="conn-tags"
            placeholder="Add tags separated by commas, then press Enter"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={addTagsFromInput}
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/entries">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
          Save Connection
        </Button>
      </CardFooter>
    </Card>
  );
}
