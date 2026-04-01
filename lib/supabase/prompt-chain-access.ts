import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getPromptChainAccessState = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      isAuthenticated: false,
      isSuperadmin: false,
      isMatrixAdmin: false,
      canAccessPromptChain: false,
      user: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_superadmin, is_matrix_admin, email")
    .eq("id", user.id)
    .maybeSingle();

  const isSuperadmin = profile?.is_superadmin === true;
  const isMatrixAdmin = profile?.is_matrix_admin === true;

  return {
    isAuthenticated: true,
    isSuperadmin,
    isMatrixAdmin,
    canAccessPromptChain: isSuperadmin || isMatrixAdmin,
    user,
    profile: profile ?? null,
  };
});
