"use client";

import { useCallback, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthButtonsProps = {
  mode?: "sign-in" | "full";
};

export default function AuthButtons({ mode = "full" }: AuthButtonsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError(signInError.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        setError(signOutError.message);
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      <div className="flex gap-3">
        <button
          className="rounded-xl bg-orange-500/15 px-4 py-3 text-[0.7rem] uppercase tracking-[0.32em] text-orange-200 ring-2 ring-orange-400/50 shadow-[0_0_24px_rgba(255,120,0,0.25)] transition-colors hover:bg-orange-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? "Working..." : "Sign in with Google"}
        </button>
        {mode === "full" ? (
          <button
            className="rounded-xl bg-black/40 px-4 py-3 text-[0.7rem] uppercase tracking-[0.32em] text-zinc-300/80 ring-1 ring-white/10 transition-colors hover:bg-black/60 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleSignOut}
            disabled={loading}
          >
            Sign out
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
