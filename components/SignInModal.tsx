import AuthButtons from "@/components/AuthButtons";

export default function SignInModal() {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-[#15151b]/90 p-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_18px_50px_rgba(0,0,0,0.7)] ring-1 ring-white/10 backdrop-blur">
      <h1 className="mt-4 text-3xl font-semibold uppercase tracking-[0.18em] text-orange-200 [font-family:var(--font-heading)]">
        Sign In To Continue
      </h1>
      <p className="mt-4 text-sm text-zinc-300/80">
        Use your Google account to unlock the prompt-chain project.
      </p>
      <AuthButtons mode="sign-in" />
    </div>
  );
}
