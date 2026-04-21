import { createClient } from '@supabase/supabase-js';

// Support both Astro/Vite frontend (import.meta.env) and Node.js backend (process.env)
const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.SUPABASE_URL : undefined) || 
  process.env.SUPABASE_URL;

const supabaseKey = 
  (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.SUPABASE_KEY : undefined) || 
  process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_KEY in .env.local'
  );
}

/**
 * Supabase client for real-time features and direct table access
 */
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Helper functions for common Supabase operations
 */

/**
 * Log an error to Supabase (for monitoring)
 */
export async function logError(error: any, context: string) {
  try {
    await supabase.from('error_logs').insert({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

/**
 * Get real-time subscription for messages
 */
export function subscribeToMessages(contactId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`messages:contact_id:eq.${contactId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `contact_id=eq.${contactId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Get real-time subscription for contact updates
 */
export function subscribeToContacts(callback: (payload: any) => void) {
  return supabase
    .channel('contacts_all')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'contacts',
      },
      callback
    )
    .subscribe();
}

/**
 * Get real-time subscription for new messages
 */
export function subscribeToNewMessages(callback: (payload: any) => void) {
  return supabase
    .channel('new_messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      callback
    )
    .subscribe();
}

export default supabase;
