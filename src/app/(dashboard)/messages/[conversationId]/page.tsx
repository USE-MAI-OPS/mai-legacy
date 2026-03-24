import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMessages, getConversationInfo, getCurrentUserId } from "../actions";
import { MessageThread } from "../components/message-thread";
import { redirect } from "next/navigation";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;

  const [messages, info, currentUserId] = await Promise.all([
    getMessages(conversationId),
    getConversationInfo(conversationId),
    getCurrentUserId(),
  ]);

  if (!info || !currentUserId) {
    redirect("/messages");
  }

  return (
    <div className="container mx-auto max-w-2xl">
      {/* Conversation header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/messages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold">{info.otherName}</h1>
          <p className="text-xs text-muted-foreground">Direct message</p>
        </div>
      </div>

      {/* Message thread */}
      <MessageThread
        conversationId={conversationId}
        initialMessages={messages}
        currentUserId={currentUserId}
        otherName={info.otherName}
      />
    </div>
  );
}
