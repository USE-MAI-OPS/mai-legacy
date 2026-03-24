import { MessageCircle } from "lucide-react";
import { getConversations } from "./actions";
import { ConversationList } from "./components/conversation-list";
import { NewMessageDialog } from "./components/new-message-dialog";

export default async function MessagesPage() {
  const conversations = await getConversations();

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="size-8" />
            Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            Direct messages with your family members.
          </p>
        </div>
        <NewMessageDialog />
      </div>

      {/* Conversations list */}
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-6">
            <MessageCircle className="size-8" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            Start a conversation with a family member to share thoughts,
            coordinate plans, or just say hello.
          </p>
          <NewMessageDialog />
        </div>
      ) : (
        <ConversationList conversations={conversations} />
      )}
    </div>
  );
}
