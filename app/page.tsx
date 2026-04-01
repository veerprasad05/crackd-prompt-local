import { redirect } from "next/navigation";
import AccessDeniedPanel from "@/components/AccessDeniedPanel";
import SignInModal from "@/components/SignInModal";
import { getPromptChainAccessState } from "@/lib/supabase/prompt-chain-access";

export default async function HomePage() {
  const { isAuthenticated, canAccessPromptChain } =
    await getPromptChainAccessState();

  if (canAccessPromptChain) {
    redirect("/humor-flavors");
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center">
      {isAuthenticated ? <AccessDeniedPanel /> : <SignInModal />}
    </div>
  );
}
