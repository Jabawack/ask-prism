import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Document,
  DocumentChunk,
  Conversation,
  Message,
  DocumentStatus,
} from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. Document Q&A features will be unavailable.');
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

// Document operations

export async function createDocument(
  doc: Omit<Document, 'id' | 'created_at' | 'updated_at'>
): Promise<Document> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('documents')
    .insert(doc)
    .select()
    .single();

  if (error) throw new Error(`Failed to create document: ${error.message}`);
  return data;
}

export async function getDocument(id: string): Promise<Document | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('documents')
    .select()
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get document: ${error.message}`);
  }
  return data;
}

export async function listDocuments(userId: string): Promise<Document[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('documents')
    .select()
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to list documents: ${error.message}`);
  return data || [];
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  updates?: Partial<Document>
): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('documents')
    .update({ status, ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(`Failed to update document: ${error.message}`);
}

export async function deleteDocument(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('documents').delete().eq('id', id);
  if (error) throw new Error(`Failed to delete document: ${error.message}`);
}

// Chunk operations

export async function insertChunks(
  chunks: Omit<DocumentChunk, 'id' | 'created_at'>[]
): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('document_chunks').insert(chunks);
  if (error) throw new Error(`Failed to insert chunks: ${error.message}`);
}

export async function searchChunks(
  embedding: number[],
  documentIds: string[],
  limit: number = 20
): Promise<Array<{ chunk: DocumentChunk; document: Document; similarity: number }>> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('match_document_chunks', {
    query_embedding: embedding,
    filter_document_ids: documentIds,
    match_count: limit,
  });

  if (error) throw new Error(`Failed to search chunks: ${error.message}`);
  return data || [];
}

// Conversation operations

export async function createConversation(
  conv: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>
): Promise<Conversation> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('conversations')
    .insert(conv)
    .select()
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data;
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('conversations')
    .select()
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get conversation: ${error.message}`);
  }
  return data;
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('conversations')
    .select()
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`Failed to list conversations: ${error.message}`);
  return data || [];
}

// Message operations

export async function createMessage(
  msg: Omit<Message, 'id' | 'created_at'>
): Promise<Message> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('messages')
    .insert(msg)
    .select()
    .single();

  if (error) throw new Error(`Failed to create message: ${error.message}`);

  await client
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', msg.conversation_id);

  return data;
}

export async function getConversationMessages(
  conversationId: string,
  limit: number = 50
): Promise<Message[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('messages')
    .select()
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to get messages: ${error.message}`);
  return data || [];
}

export async function getDocumentsByIds(ids: string[]): Promise<Map<string, Document>> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('documents')
    .select()
    .in('id', ids);

  if (error) throw new Error(`Failed to get documents: ${error.message}`);

  const map = new Map<string, Document>();
  for (const doc of data || []) {
    map.set(doc.id, doc);
  }
  return map;
}
