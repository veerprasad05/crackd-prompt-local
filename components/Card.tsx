import * as React from "react";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

type CardImageProps = {
  src: string;
  alt?: string;
  className?: string;
};

type CaptionEntry = {
  id?: string | number;
  content?: string | null;
};

type CardCaptionProps = {
  captions: CaptionEntry[];
  className?: string;
};

const baseCardClasses = [
  "group relative flex h-full flex-col overflow-hidden rounded-2xl",
  "border border-[color:var(--pc-border)] bg-[var(--pc-surface)]",
  "shadow-[0_24px_50px_rgba(0,0,0,0.18)]",
  "transition-transform duration-300 ease-out",
  "hover:-translate-y-1",
  "focus-within:ring-2 focus-within:ring-[var(--pc-accent-ring)]",
  "before:pointer-events-none before:absolute before:-inset-[1px] before:rounded-[1.1rem]",
  "before:bg-[linear-gradient(140deg,rgba(255,255,255,0.18),rgba(255,255,255,0)_35%,rgba(255,110,0,0.3)_60%,rgba(255,255,255,0)_90%)]",
  "before:opacity-70 before:content-['']",
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl",
  "after:bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.08),transparent_55%)]",
  "after:opacity-80 after:content-['']",
].join(" ");

const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={[baseCardClasses, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  )
);

CardRoot.displayName = "Card";

function CardImage({ src, alt = "Card image", className }: CardImageProps) {
  return (
    <div
      className={[
        "relative z-10 w-full shrink-0 overflow-hidden",
        "aspect-[16/9] sm:aspect-[7/4]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full bg-[var(--pc-placeholder-surface)] object-contain"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/0 via-black/0 to-black/70" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/55 to-transparent" />
    </div>
  );
}

function CardCaption({ captions, className }: CardCaptionProps) {
  const safeCaptions = Array.isArray(captions) ? captions : [];
  const captionLines = safeCaptions
    .map((caption) => caption?.content)
    .filter(
      (content): content is string =>
        typeof content === "string" && content.trim().length > 0
    );
  const displayText =
    captionLines.length > 0
      ? captionLines.join("\n\n")
      : "No caption available.";

  return (
    <div
      className={[
        "relative z-10 w-full flex-1",
        "border-t border-[color:var(--pc-border)]",
        "bg-[var(--pc-surface-strong)]",
        "px-6 py-3 text-center text-[0.7rem] tracking-[0.14em] text-[var(--pc-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:px-7 sm:py-3.5 sm:text-xs",
        "[font-family:var(--font-body)]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className={[
          "min-h-[1.75rem] whitespace-pre-wrap break-words",
          captionLines.length > 0 ? "text-[var(--pc-text)]" : "text-[var(--pc-text-faint)]",
        ].join(" ")}
      >
        {displayText}
      </div>
    </div>
  );
}

const Card = Object.assign(CardRoot, {
  Image: CardImage,
  Caption: CardCaption,
});

export { Card, CardImage, CardCaption };
export type { CaptionEntry };
