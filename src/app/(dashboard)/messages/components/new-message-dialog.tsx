"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Search } from "lucide-react";
import {
  getFamilyMembers,
  startConversation,
  type FamilyMember,
} from "../actions";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface NewMessageDialogProps {
  onConversationCreated?: (conversationId: string, memberName: string) => void;
}

export function NewMessageDialog({
  onConversationCreated,
}: NewMessageDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      setLoading(true);
      getFamilyMembers().then((m) => {
        setMembers(m);
        setLoading(false);
      });
    } else {
      setSearch("");
    }
  }, [open]);

  const filtered = members.filter((m) =>
    m.displayName.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(member: FamilyMember) {
    startTransition(async () => {
      const result = await startConversation(member.userId);
      if (result.conversationId) {
        setOpen(false);
        if (onConversationCreated) {
          onConversationCreated(result.conversationId, member.displayName);
        } else {
          router.push(`/messages/${result.conversationId}`);
        }
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 w-full rounded-full">
          <Plus className="size-4" />
          New Message
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Choose a family member to start a conversation with.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search family members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {search
                  ? "No family members found."
                  : "No other family members to message."}
              </p>
            ) : (
              filtered.map((member) => (
                <button
                  key={member.userId}
                  onClick={() => handleSelect(member)}
                  disabled={isPending}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md hover:bg-accent transition-colors text-left disabled:opacity-50"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs">
                      {getInitials(member.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {member.displayName}
                  </span>
                  {isPending && (
                    <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
