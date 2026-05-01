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
          className="rounded-xl bg-[var(--pc-accent-soft)] px-4 py-3 text-[0.7rem] uppercase tracking-[0.32em] text-[var(--pc-accent-text)] ring-2 ring-[var(--pc-accent-ring)] shadow-[0_0_24px_rgba(255,120,0,0.12)] transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? "Working..." : "Sign in with Google"}
        </button>
        {mode === "full" ? (
          <button
            className="rounded-xl border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] px-4 py-3 text-[0.7rem] uppercase tracking-[0.32em] text-[var(--pc-text-muted)] transition-colors hover:text-[var(--pc-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={handleSignOut}
            disabled={loading}
          >
            Sign out
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-[var(--pc-danger-text)]">{error}</p>
      ) : null}
    </div>
  );
}
