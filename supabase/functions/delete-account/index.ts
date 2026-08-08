/**
 * delete-account — full account deletion (spec §7 GDPR: "implemented, not
 * stubbed").
 *
 * This is the one function that legitimately needs the service role: deleting
 * `auth.users` and removing storage objects both cross the boundary RLS draws.
 * It still authenticates the caller first and only ever deletes *their own*
 * account — the user id comes from the verified JWT, never from the body.
 *
 * Order matters. Storage objects are removed first, because they are the only
 * thing that does not cascade: if the auth row went first, the objects would be
 * orphaned in a private bucket with no owner left to authorise their deletion.
 */

import { authenticate, AuthError, serviceClient } from '../_shared/auth.ts';
import { preflight, json } from '../_shared/cors.ts';

/** Storage list() is paginated; a large wardrobe needs more than one page. */
const PAGE_SIZE = 100;

async function deleteUserImages(
  service: import('jsr:@supabase/supabase-js@2').SupabaseClient,
  userId: string,
): Promise<number> {
  const bucket = service.storage.from('garments');
  let removed = 0;

  // Objects are keyed `<uid>/<garment_id>/<variant>`, so the user's tree is two
  // levels deep and has to be walked rather than listed flat.
  const { data: garmentFolders, error: listError } = await bucket.list(userId, {
    limit: 1000,
  });
  if (listError) throw new Error(`could not list images: ${listError.message}`);

  for (const folder of garmentFolders ?? []) {
    let offset = 0;
    for (;;) {
      const { data: files, error } = await bucket.list(`${userId}/${folder.name}`, {
        limit: PAGE_SIZE,
        offset,
      });
      if (error) throw new Error(`could not list images: ${error.message}`);
      if (!files || files.length === 0) break;

      const paths = files.map((f) => `${userId}/${folder.name}/${f.name}`);
      const { error: removeError } = await bucket.remove(paths);
      if (removeError) throw new Error(`could not remove images: ${removeError.message}`);

      removed += paths.length;
      if (files.length < PAGE_SIZE) break;
      offset += files.length;
    }
  }

  return removed;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  const early = preflight(req);
  if (early) return early;

  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405, origin);
  }

  let userId: string | null = null;
  const service = serviceClient();

  try {
    const caller = await authenticate(req);
    userId = caller.userId;

    // Record the request first, so a failure part-way through leaves an audit
    // trail and something to retry against rather than a half-deleted account.
    const { error: requestError } = await caller.db
      .from('deletion_requests')
      .upsert({ user_id: userId }, { onConflict: 'user_id' });
    if (requestError) {
      return json({ error: `could not record request: ${requestError.message}` }, 500, origin);
    }

    const imagesRemoved = await deleteUserImages(service, userId);

    // Deleting the auth row cascades: auth.users → profiles → garments,
    // outfits, wears, watches, alerts, entitlements, and the deletion_requests
    // row itself. Nothing user-owned survives it.
    const { error: deleteError } = await service.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw new Error(`could not delete auth user: ${deleteError.message}`);
    }

    return json({ deleted: true, imagesRemoved }, 200, origin);
  } catch (error) {
    if (error instanceof AuthError) {
      return json({ error: error.message }, error.status, origin);
    }

    const message = error instanceof Error ? error.message : 'unknown error';
    console.error('delete-account failed', message);

    // Leave the reason on the request row so a retry, or a human, can see what
    // went wrong. Best-effort: if the account is already gone this is a no-op.
    if (userId) {
      await service
        .from('deletion_requests')
        .update({ error: message })
        .eq('user_id', userId);
    }

    return json({ error: 'deletion failed, please try again' }, 500, origin);
  }
});
