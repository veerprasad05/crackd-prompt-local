import type { Metadata } from "next";
import { Oxanium, Space_Grotesk } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const themeScript = `
(() => {
  const storageKey = "crackd-prompt-chain-theme";
  const root = document.documentElement;
  const stored = window.localStorage.getItem(storageKey);
  const mode = stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  root.dataset.themeSetting = mode;
  root.dataset.theme = resolved;
})();
`;

const headingFont = Oxanium({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const bodyFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crackd Prompt Chain",
  description: "Prompt-chain UI scaffolded from the shared Crackd visual system.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={[
          bodyFont.variable,
          headingFont.variable,
          "min-h-screen antialiased",
          "[font-family:var(--font-body)]",
        ].join(" ")}
      >
        <div className="min-h-screen w-full px-6 py-6">
          <div className="flex min-h-[calc(100vh-3rem)] gap-6">
            <aside className="sticky top-6 h-[95vh] w-72 shrink-0 self-start">
              <Sidebar />
            </aside>

            <main className="flex-1 pt-8 pb-12">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
