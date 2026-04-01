"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SidebarUserMenu() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    const loadSession = async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        supabaseRef.current = supabase;

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (sessionError) {
          setError(sessionError.message);
        }

        setSession(data.session ?? null);
        setAuthReady(true);

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession);
        });

        unsubscribe = () => subscription.unsubscribe();
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to initialize auth");
        setAuthReady(true);
      }
    };

    loadSession();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !containerRef.current) {
        return;
      }

      if (!containerRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  const handleAction = useCallback(async () => {
    if (!authReady || busy) {
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const supabase = supabaseRef.current ?? createSupabaseBrowserClient();
      supabaseRef.current = supabase;

      if (session) {
        const { error: signOutError } = await supabase.auth.signOut();

        if (signOutError) {
          setError(signOutError.message);
          return;
        }

        setSession(null);
        setMenuOpen(false);
        router.push("/");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signInError) {
        setError(signInError.message);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update auth state");
    } finally {
      setBusy(false);
    }
  }, [authReady, busy, router, session]);

  const signedIn = Boolean(session);
  const actionLabel = !authReady
    ? "Loading..."
    : signedIn
      ? "Sign out"
      : "Sign in with Google";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={[
          "flex h-12 w-12 items-center justify-center rounded-full",
          "border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] text-[var(--pc-text-muted)]",
          "transition hover:text-[var(--pc-text)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]",
        ].join(" ")}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="User menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <User className="h-5 w-5" />
      </button>

      {menuOpen ? (
        <div
          role="menu"
          className={[
            "absolute bottom-14 left-1/2 w-56 -translate-x-1/2",
            "rounded-2xl border border-[color:var(--pc-border)] bg-[var(--pc-surface-strong)] p-3",
            "shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur",
          ].join(" ")}
        >
          <button
            type="button"
            role="menuitem"
            className={[
              "w-full rounded-xl px-3 py-2 text-[0.65rem] uppercase tracking-[0.32em]",
              signedIn
                ? "border border-[color:var(--pc-border)] bg-[var(--pc-surface-soft)] text-[var(--pc-text)]"
                : "bg-[var(--pc-accent-soft)] text-[var(--pc-accent-text)] ring-2 ring-[var(--pc-accent-ring)]",
              "transition-colors hover:text-[var(--pc-text)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pc-accent-ring)]",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
            onClick={handleAction}
            disabled={!authReady || busy}
          >
            {busy ? "Working..." : actionLabel}
          </button>
          {error ? (
            <p className="mt-2 text-xs text-[var(--pc-danger-text)]">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
