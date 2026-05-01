import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import TextType from "@/ui/TextType";

export const dynamic = "force-dynamic";

export default async function HelloWorldPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/");
  }

  return (
    <h1 className="text-[2.75rem] leading-none uppercase tracking-[0.18em] text-[var(--pc-text)] [font-family:var(--font-heading)] sm:text-[3.25rem] lg:text-[3.75rem]">
      <TextType
        text={["Hello World!", "Crackd Prompt Chain"]}
        typingSpeed={75}
        pauseDuration={1500}
        showCursor
        cursorCharacter="_"
        deletingSpeed={50}
        variableSpeed={{ min: 60, max: 120 }}
        cursorBlinkDuration={0.5}
      />
    </h1>
  );
}
