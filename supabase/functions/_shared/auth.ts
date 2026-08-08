/**
 * Caller identification for Edge Functions.
 *
 * Every function here resolves the user from their own JWT and then acts through
 * a client carrying that same JWT, so RLS still applies. The service-role key is
 * used only where a function legitimately needs to cross a user boundary —
 * currently just account deletion — and that is called out at each use.
 */

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export interface Caller {
  userId: string;
  /** Scoped to the caller by RLS. Use this for anything user-owned. */
  db: SupabaseClient;
  accessToken: string;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`missing environment variable: ${name}`);
  return value;
}

export async function authenticate(req: Request): Promise<Caller> {
  const header = req.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new AuthError('missing bearer token', 401);
  }
  const accessToken = header.slice('Bearer '.length);

  const db = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: header } },
    auth: { persistSession: false },
  });

  const { data, error } = await db.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new AuthError('invalid token', 401);
  }

  return { userId: data.user.id, db, accessToken };
}

/**
 * A client that bypasses RLS. Only for operations that are legitimately
 * cross-user or that the user must not be able to perform directly — never as a
 * shortcut around a policy that is merely inconvenient.
 */
export function serviceClient(): SupabaseClient {
  return createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });
}
