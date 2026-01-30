-- Migration: Enable Row Level Security on all tables
-- This secures tables from direct anon key access while allowing service role operations

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_fields ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SERVICE ROLE POLICIES
-- These allow your Next.js API routes (using service role key) to work
-- Service role bypasses RLS by default, but explicit policies are clearer
-- ============================================================================

-- Documents: Service role has full access
CREATE POLICY "Service role full access to documents"
  ON documents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Document chunks: Service role has full access
CREATE POLICY "Service role full access to document_chunks"
  ON document_chunks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Conversations: Service role has full access
CREATE POLICY "Service role full access to conversations"
  ON conversations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Messages: Service role has full access
CREATE POLICY "Service role full access to messages"
  ON messages FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Answer records: Service role has full access
CREATE POLICY "Service role full access to answer_records"
  ON answer_records FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Pending fields: Service role has full access (system-wide table)
CREATE POLICY "Service role full access to pending_fields"
  ON pending_fields FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- ANON KEY POLICIES (BLOCKED BY DEFAULT)
-- The anon key should NOT have direct access to data
-- All access should go through your authenticated API routes
-- ============================================================================

-- No policies for 'anon' role = no access (secure by default)

-- ============================================================================
-- AUTHENTICATED USER POLICIES (FOR FUTURE USE WITH SUPABASE AUTH)
-- Uncomment these when you implement real authentication
-- ============================================================================

/*
-- Documents: Users can only access their own documents
CREATE POLICY "Users can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Document chunks: Users can access chunks of their documents
CREATE POLICY "Users can view chunks of own documents"
  ON document_chunks FOR SELECT
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documents WHERE user_id = auth.uid()::text
    )
  );

-- Conversations: Users can only access their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Messages: Users can access messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()::text
    )
  );

-- Answer records: Users can view records for their messages
CREATE POLICY "Users can view own answer records"
  ON answer_records FOR SELECT
  TO authenticated
  USING (
    message_id IN (
      SELECT m.id FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.user_id = auth.uid()::text
    )
  );
*/

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Service role full access to documents" ON documents IS
  'Allows Next.js API routes using service_role key to manage all documents';

COMMENT ON POLICY "Service role full access to document_chunks" ON document_chunks IS
  'Allows Next.js API routes using service_role key to manage all chunks';

COMMENT ON POLICY "Service role full access to conversations" ON conversations IS
  'Allows Next.js API routes using service_role key to manage all conversations';

COMMENT ON POLICY "Service role full access to messages" ON messages IS
  'Allows Next.js API routes using service_role key to manage all messages';
