# Crackd Prompt Chain Project Setup + Supabase Domain Model

## Project Goal

Create a new app in `crackd-prompt-chain` that uses the **same visual system, front-end conventions, and Supabase project** as `cracked` and `crackd-admin`, while supporting a different product use case centered on prompt-chain workflows.

This project should be treated as a sibling app, not a redesign. The feature set can differ, but the styling language should remain aligned with the existing Crackd applications.

## Required Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React 19
- `@supabase/ssr`
- `@supabase/supabase-js`
- `lucide-react`
- `gsap` when motion is needed

Use the same dependency versions and overall package shape already present in `cracked/package.json` and `crackd-admin/package.json` unless there is a strong reason to change them across all three apps.

## Project Setup Instructions

Scaffold the app in `crackd-prompt-chain` with the same base structure used by the other apps:

- `app/`
- `components/`
- `lib/`
- `ui/` if shared display primitives are needed
- `app/layout.tsx`
- `app/globals.css`
- `tailwind.config.js`
- `postcss.config.js`
- `tsconfig.json`
- `next.config.js`
- `next-env.d.ts`
- `package.json`

Prefer matching the existing app conventions directly instead of inventing a new structure.

## Visual System Contract

The styling must stay aligned with `cracked` and `crackd-admin`.

### Fonts

- Headings: `Oxanium`
- Body/UI text: `Space Grotesk`

Use `next/font/google` and keep the same CSS variable names:

- `--font-heading`
- `--font-body`

### Base Layout

Mirror the same base body treatment used in the other two apps:

- `min-h-screen text-zinc-100 antialiased`
- `bg-[#0b0b10]`
- `bg-[radial-gradient(900px_circle_at_78%_-10%,rgba(123,60,255,0.28),transparent_55%),radial-gradient(700px_circle_at_8%_12%,rgba(255,100,0,0.12),transparent_60%),linear-gradient(180deg,rgba(12,12,18,1),rgba(8,8,12,1))]`
- `[font-family:var(--font-body)]`

Do not swap fonts, change the color system, or introduce a separate design language unless the change is made intentionally across the whole Crackd ecosystem.

### Tailwind

Use Tailwind CSS with content globs consistent with the current apps:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### Global CSS

Keep `app/globals.css` minimal and consistent:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

html,
body {
  min-height: 100%;
}
```

### Root Layout Reference

Use the same font setup and body classes as the current apps. The page chrome can differ depending on the prompt-chain use case, but the typography, background treatment, and baseline spacing language should remain shared.

```tsx
import type { Metadata } from "next";
import { Oxanium, Space_Grotesk } from "next/font/google";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={[
          bodyFont.variable,
          headingFont.variable,
          "min-h-screen text-zinc-100 antialiased",
          "bg-[#0b0b10]",
          "bg-[radial-gradient(900px_circle_at_78%_-10%,rgba(123,60,255,0.28),transparent_55%),radial-gradient(700px_circle_at_8%_12%,rgba(255,100,0,0.12),transparent_60%),linear-gradient(180deg,rgba(12,12,18,1),rgba(8,8,12,1))]",
          "[font-family:var(--font-body)]",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
```

## Supabase Integration Contract

This app should connect to the **same Supabase database/project** as `cracked` and `crackd-admin`.

- Reuse the same environment variable names:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Reuse the same `@supabase/ssr` client helper pattern already present in the other apps.
- Treat this app as another client of the same schema, not a new database or parallel schema.

Recommended helpers:

```ts
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createBrowserClient(url, anon);
}
```

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components can read cookies but cannot persist writes.
          // Route handlers are responsible for storing refreshed auth state.
        }
      },
    },
  });
}
```

## Crackd Supabase Domain Model (Student Reference)

## Non-Negotiable Rules

- **DO NOT change or edit any RLS (Row Level Security) policies.**
- Treat the database as authoritative.
- Treat the database as read-only unless the task is explicitly about flows this app is meant to own.
- Many tables are written by backend services (AI API, Matrix, Admin, etc.) and should be interpreted as **logs of behavior**, not data to be mutated casually.

## How To Use This Model

For `crackd-prompt-chain`, the main live objects are **profiles**, **humor_flavors**, **humor_flavor_steps**, **images**, **study_image_sets**, **caption_requests**, **llm_prompt_chains**, **llm_model_responses**, and **captions**. Follow those relationships outward. If you need execution lineage or moderation context, move through linked metadata instead of inventing new state.

## Required Tables For This Tool

These are the tables directly required by the product brief in `crackd-prompt-chain/instructions.md`. The details below were verified against Supabase MCP on April 1, 2026 for `Crackd Database - Staging` (`qihsgnfjqmkjmoowyfbn`).

### Feature-To-Table Map

- Admin access gating: `profiles`
- Humor flavor CRUD: `humor_flavors`
- Humor flavor step CRUD and reordering: `humor_flavor_steps`
- Step configuration lookups: `humor_flavor_step_types`, `llm_input_types`, `llm_output_types`, `llm_models`, `llm_providers`
- Image test-set selection: `study_image_sets`, `study_image_set_image_mappings`, `images`
- Generated caption lineage and result inspection: `caption_requests`, `llm_prompt_chains`, `llm_model_responses`, `captions`

### Access Control

- `profiles` is the gatekeeper table for this app.
- The UI should only allow entry when `profiles.is_superadmin = true` or `profiles.is_matrix_admin = true`.
- `profiles.id` is the primary key and also references `auth.users.id`.
- Important columns:
  - `id uuid`
  - `email text | null`
  - `is_superadmin boolean not null default false`
  - `is_matrix_admin boolean not null default false`
  - `is_in_study boolean not null default false`
  - `created_datetime_utc timestamptz not null default now()`
  - `modified_datetime_utc timestamptz not null default now()`
  - `created_by_user_id uuid not null default auth.uid()`
  - `modified_by_user_id uuid not null default auth.uid()`

### Humor Flavor CRUD

- `humor_flavors` is the top-level record for each prompt-chain strategy.
- `id bigint` is an identity column (`GENERATED BY DEFAULT AS IDENTITY`).
- `slug` is required and unique.
- Important columns:
  - `id bigint`
  - `slug varchar not null unique`
  - `description text | null`
  - `created_datetime_utc timestamptz not null default now()`
  - `modified_datetime_utc timestamptz not null default now()`
  - `created_by_user_id uuid not null default auth.uid()`
  - `modified_by_user_id uuid not null default auth.uid()`

### Humor Flavor Step CRUD And Ordering

- `humor_flavor_steps` stores the ordered step list for a flavor.
- `humor_flavor_id` points to the owning flavor.
- `order_by` is the column that controls execution order.
- The schema does **not** expose a unique constraint on `(humor_flavor_id, order_by)`, so the app must keep ordering consistent when reordering steps.
- Important columns:
  - `id bigint identity`
  - `humor_flavor_id bigint not null`
  - `order_by smallint not null`
  - `humor_flavor_step_type_id smallint not null`
  - `llm_input_type_id smallint not null`
  - `llm_output_type_id smallint not null`
  - `llm_model_id smallint not null`
  - `llm_temperature numeric | null`
  - `llm_system_prompt text | null`
  - `llm_user_prompt text | null`
  - `description varchar | null`
  - `created_datetime_utc timestamptz not null default now()`
  - `modified_datetime_utc timestamptz not null default now()`
  - `created_by_user_id uuid not null default auth.uid()`
  - `modified_by_user_id uuid not null default auth.uid()`

### Step Configuration Lookup Tables

- `humor_flavor_step_types` defines the kind of step being performed.
- `llm_input_types` defines what the model consumes.
- `llm_output_types` defines what the model should return.
- `llm_models` defines the concrete model to run.
- `llm_providers` defines the provider behind each model.

Current lookup values verified from staging:

- `humor_flavor_step_types`
  - `1`: `celebrity-recognition`
  - `2`: `image-description`
  - `3`: `general`
- `llm_input_types`
  - `1`: `image-and-text`
  - `2`: `text-only`
- `llm_output_types`
  - `1`: `string`
  - `2`: `array`

Model selection is driven by `llm_models.id`. Each row includes:

- `name`
- `llm_provider_id`
- `provider_model_id`
- `is_temperature_supported`

### Image Test Sets

- For named image test sets, prefer `study_image_sets` and `study_image_set_image_mappings`.
- This is an inference from the current schema: those tables explicitly model grouped image collections, which matches the "image test set" requirement better than ad hoc image queries.
- `study_image_sets` fields:
  - `id bigint identity`
  - `slug varchar not null`
  - `description text | null`
  - audit fields
- `study_image_set_image_mappings` fields:
  - `id bigint identity`
  - `study_image_set_id bigint not null`
  - `image_id uuid not null`
  - audit fields
- `images` is the actual asset table behind each test-set item.
- Important `images` fields:
  - `id uuid default gen_random_uuid()`
  - `url varchar | null`
  - `is_common_use boolean | null default false`
  - `is_public boolean | null default false`
  - `image_description text | null`
  - `celebrity_recognition text | null`
  - `additional_context varchar | null`
  - `profile_id uuid | null default auth.uid()`

### Caption Generation Lineage

- `caption_requests` is the top-level generation request for a given user and image.
- `llm_prompt_chains` groups the execution instance for that caption request.
- `llm_model_responses` stores per-step LLM call history.
- `captions` stores the output captions and links them back to image, profile, humor flavor, caption request, and prompt chain.

Important linkage:

- `caption_requests.profile_id -> profiles.id`
- `caption_requests.image_id -> images.id`
- `llm_prompt_chains.caption_request_id -> caption_requests.id`
- `llm_model_responses.caption_request_id -> caption_requests.id`
- `llm_model_responses.llm_prompt_chain_id -> llm_prompt_chains.id`
- `llm_model_responses.humor_flavor_id -> humor_flavors.id`
- `llm_model_responses.humor_flavor_step_id -> humor_flavor_steps.id`
- `captions.caption_request_id -> caption_requests.id`
- `captions.llm_prompt_chain_id -> llm_prompt_chains.id`
- `captions.humor_flavor_id -> humor_flavors.id`
- `captions.image_id -> images.id`

## Table Catalog

Each table below is part of the current `cracked-staging` public schema. These notes were synced against `Crackd Database - Staging` (`qihsgnfjqmkjmoowyfbn`) on April 1, 2026.

## Shared Audit Contract

- For the tables documented here, `created_by_user_id` and `modified_by_user_id` are now non-null UUID columns.
- Most mutable tables also have non-null `modified_datetime_utc` in addition to `created_datetime_utc`.
- Common defaults in staging: audit timestamps default to `now()` and audit actor IDs default to `auth.uid()`.
- Older assumptions that these audit columns are nullable are stale.

## Canonical Row Types

Use these concrete shapes when reasoning about the main tables this app is most likely to inspect or connect.

```ts
type UUID = string;
type TimestampTz = string; // ISO timestamp from timestamptz
type BigIntLike = number;
type SmallIntLike = number;
type NumericLike = number | string;
type VectorLike = string | number[]; // treat pgvector values as opaque unless explicitly needed

type AuditFields = {
  created_datetime_utc: TimestampTz;
  modified_datetime_utc: TimestampTz;
  created_by_user_id: UUID;
  modified_by_user_id: UUID;
};

type ProfileRow = AuditFields & {
  id: UUID;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  is_superadmin: boolean;
  is_in_study: boolean;
  is_matrix_admin: boolean;
};

type ImageRow = AuditFields & {
  id: UUID;
  url: string | null;
  is_common_use: boolean | null;
  profile_id: UUID | null;
  additional_context: string | null;
  is_public: boolean | null;
  image_description: string | null;
  celebrity_recognition: string | null;
  embedding: VectorLike | null;
};

type CaptionRow = AuditFields & {
  id: UUID;
  content: string | null;
  is_public: boolean;
  profile_id: UUID;
  image_id: UUID;
  humor_flavor_id: BigIntLike | null;
  is_featured: boolean;
  caption_request_id: BigIntLike | null;
  like_count: BigIntLike;
  llm_prompt_chain_id: BigIntLike | null;
};

type CaptionVoteRow = AuditFields & {
  id: BigIntLike;
  vote_value: 1 | -1;
  profile_id: UUID;
  caption_id: UUID;
  is_from_study: boolean;
};

type HumorFlavorRow = AuditFields & {
  id: BigIntLike;
  description: string | null;
  slug: string;
};

type HumorFlavorStepRow = AuditFields & {
  id: BigIntLike;
  humor_flavor_id: BigIntLike;
  llm_temperature: NumericLike | null;
  order_by: SmallIntLike;
  llm_input_type_id: SmallIntLike;
  llm_output_type_id: SmallIntLike;
  llm_model_id: SmallIntLike;
  humor_flavor_step_type_id: SmallIntLike;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
  description: string | null;
};

type HumorFlavorStepTypeRow = AuditFields & {
  id: SmallIntLike;
  slug: string;
  description: string;
};

type LlmInputTypeRow = AuditFields & {
  id: SmallIntLike;
  slug: string;
  description: string;
};

type LlmOutputTypeRow = AuditFields & {
  id: SmallIntLike;
  slug: string;
  description: string;
};

type HumorFlavorMixRow = AuditFields & {
  id: BigIntLike;
  humor_flavor_id: BigIntLike;
  caption_count: SmallIntLike;
};

type TermRow = AuditFields & {
  id: BigIntLike;
  term: string;
  definition: string;
  example: string;
  priority: SmallIntLike;
  term_type_id: SmallIntLike | null;
};

type WhitelistEmailAddressRow = AuditFields & {
  id: BigIntLike;
  email_address: string;
};

type CaptionRequestRow = AuditFields & {
  id: BigIntLike;
  profile_id: UUID;
  image_id: UUID;
};

type StudyImageSetRow = AuditFields & {
  id: BigIntLike;
  slug: string;
  description: string | null;
};

type StudyImageSetImageMappingRow = AuditFields & {
  id: BigIntLike;
  study_image_set_id: BigIntLike;
  image_id: UUID;
};

type CaptionExampleRow = AuditFields & {
  id: BigIntLike;
  image_description: string;
  caption: string;
  explanation: string;
  priority: SmallIntLike;
  image_id: UUID | null;
};

type LlmModelRow = AuditFields & {
  id: SmallIntLike;
  name: string;
  llm_provider_id: SmallIntLike;
  provider_model_id: string;
  is_temperature_supported: boolean;
};

type LlmProviderRow = AuditFields & {
  id: SmallIntLike;
  name: string;
};

type LlmPromptChainRow = AuditFields & {
  id: BigIntLike;
  caption_request_id: BigIntLike;
};

type LlmModelResponseRow = AuditFields & {
  id: UUID;
  llm_model_response: string | null;
  processing_time_seconds: SmallIntLike;
  llm_model_id: SmallIntLike;
  profile_id: UUID;
  caption_request_id: BigIntLike;
  llm_system_prompt: string;
  llm_user_prompt: string;
  llm_temperature: NumericLike | null;
  humor_flavor_id: BigIntLike;
  llm_prompt_chain_id: BigIntLike | null;
  humor_flavor_step_id: BigIntLike | null;
};

type AllowedSignupDomainRow = AuditFields & {
  id: BigIntLike;
  apex_domain: string;
};
```

### Core People & Identity

- `profiles`: Central Crackd user record (1:1 with `auth.users`) plus audit actor columns.
- `dorms`: Dorm reference records.
- `universities`: University reference records.
- `university_majors`: Major reference records.
- `university_major_mappings`: University-to-major join records.
- `profile_dorm_mappings`: Joins profiles to dorms.
- `profile_university_mappings`: Joins profiles to universities.
- `profile_university_major_mappings`: Joins profiles to university-major mappings.

### Images

- `images`: Hosted visual assets with ownership/visibility, cached semantic metadata, embeddings, and audit actor columns.
- `common_use_categories`: Curated image category definitions for consistent study pools.
- `common_use_category_image_mappings`: Links images into curated common-use categories.

### Captions

- `captions`: Generated captions tied to an image, owning profile, visibility flags, humor flavor, prompt-chain lineage, and audit actor columns.

### Caption Interactions (Behavioral Logs)

- `caption_likes`: Likes recorded via almostcrackd.ai.
- `caption_votes`: Up/down votes via slightlyhumorous.org; includes `is_from_study`.
- `caption_saved`: Personal bookmarking via almostcrackd.ai.
- `shares`: Share events.
- `share_to_destinations`: Target destinations for shares.
- `screenshots`: Screenshot events.

### Moderation

- `reported_captions`: User-flagged captions for review.
- `reported_images`: User-flagged images for review.

### Generation Requests & Lineage

- `caption_requests`: User-initiated generation entry point for an image; parent for AI activity.
- `caption_examples`: Curated example captions with explanations and optional linked image.
- `llm_prompt_chains`: Ordered LLM steps for a single caption request.
- `llm_model_responses`: Low-level log of each LLM call (prompts, model/provider, timing, temperature, humor-step context).

### Humor System (The Matrix)

- `humor_flavors`: Named, reusable generation strategies (slug + description).
- `humor_flavor_steps`: Ordered steps for each humor flavor with prompts, model, I/O types, temperature, and role.
- `humor_flavor_mix`: Mix recipe tying humor flavors to caption counts.
- `humor_flavor_step_types`: Classification of step types.
- `llm_models`: Normalized model metadata.
- `llm_providers`: Normalized provider metadata.
- `llm_input_types`: Normalized model input types.
- `llm_output_types`: Normalized model output types.
- `humor_flavor_theme_mappings`: Mappings between humor flavors and themes.
- `humor_themes`: Theme taxonomy for humor flavors.

### Community Context

- `communities`: Bounded social groups.
- `community_contexts`: Insider cultural knowledge and context, optionally with embeddings.
- `community_context_tags`: Tag definitions.
- `community_context_tag_mappings`: Tag-to-context mappings.
- `sidechat_posts`: Imported or mirrored sidechat-style post records.

### Studies & Research

- `studies`: Bounded experiment definitions with time windows.
- `study_caption_mappings`: Joins captions to studies.
- `study_caption_vote_events`: Granular study vote-event log with richer vote values and client metadata.
- `study_image_sets`: Grouped sets of images for studies.
- `study_image_set_image_mappings`: Joins images into study image sets.

### Gen-Z & Style References

- `terms`: Gen-Z vocabulary terms.
- `term_types`: Term classification.
- `news_snippets`: Real-world grounding snippets.
- `news_entities`: Entities linked to news snippets.
- `personalities`: Voice/style profiles.
- `transcripts`: Source text for styles/voices.
- `transcript_personality_mappings`: Links transcripts to personalities.

### Invitations, Access Control, and Safety

- `allowed_signup_domains`: Domains allowed to register.
- `whitelist_email_addresses`: Explicitly allowed email addresses for controlled access.
- `invitations`: Controlled onboarding.
- `bug_reports`: Operational feedback from users.
- `testflight_errors`: Testflight crash/error reports.

### Utility Relations

- `link_redirects`: Managed short-link / redirect records.
- `v_richest_image_dedup`: Read-only deduplicated image view, not a writable base table.
