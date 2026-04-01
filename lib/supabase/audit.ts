import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BrowserSupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;

type UpdateAuditOptions = {
  modifiedAtField?: string;
  modifiedByField?: string;
  timestamp: string;
  userId: string;
};

type InsertAuditOptions = {
  createdAtField?: string;
  modifiedAtField?: string;
  createdByField?: string;
  modifiedByField?: string;
  timestamp: string;
  userId: string;
};

export async function getAuthenticatedUserId(
  supabase: BrowserSupabaseClient,
  errorMessage = "You need to sign in before saving changes."
) {
  const { data, error } = await supabase.auth.getUser();
  const userId = data.user?.id;

  if (error || !userId) {
    throw new Error(error?.message ?? errorMessage);
  }

  return userId;
}

export function applyUpdateAuditFields<T extends Record<string, unknown>>(
  payload: T,
  {
    modifiedAtField = "modified_datetime_utc",
    modifiedByField = "modified_by_user_id",
    timestamp,
    userId,
  }: UpdateAuditOptions
) {
  return {
    ...payload,
    [modifiedAtField]: timestamp,
    [modifiedByField]: userId,
  };
}

export function applyInsertAuditFields<T extends Record<string, unknown>>(
  payload: T,
  {
    createdAtField = "created_datetime_utc",
    modifiedAtField = "modified_datetime_utc",
    createdByField = "created_by_user_id",
    modifiedByField = "modified_by_user_id",
    timestamp,
    userId,
  }: InsertAuditOptions
) {
  return {
    ...payload,
    [createdAtField]: timestamp,
    [modifiedAtField]: timestamp,
    [createdByField]: userId,
    [modifiedByField]: userId,
  };
}
