-- Add missing DELETE RLS policy for griot_conversations
-- Users should be able to delete their own conversations
create policy "Users can delete their conversations"
  on public.griot_conversations for delete
  using (user_id = auth.uid());
