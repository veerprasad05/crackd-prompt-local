import { redirect } from "next/navigation";
import PromptChainTabs from "@/components/PromptChainTabs";
import { getPromptChainAccessState } from "@/lib/supabase/prompt-chain-access";

export default async function PromptChainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { canAccessPromptChain } = await getPromptChainAccessState();

  if (!canAccessPromptChain) {
    redirect("/");
  }

  return (
    <div className="mx-auto w-full max-w-[1400px]">

      <div className="mt-10">{children}</div>
    </div>
  );
}
