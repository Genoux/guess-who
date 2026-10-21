import { CircleHelpIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CloseButton } from "@/shared/components/game/close-button";
import { ClueCard } from "@/shared/components/game/clue-card";
import { CountChip } from "@/shared/components/game/count-chip";
import { GameAvatar } from "@/shared/components/game/game-avatar";
import { GameButton } from "@/shared/components/game/game-button";
import { GameField } from "@/shared/components/game/game-field";
import { GameShell } from "@/shared/components/game/game-shell";
import { GameTopNav } from "@/shared/components/game/game-top-nav";
import { IconButton } from "@/shared/components/game/icon-button";
import { PillTabs } from "@/shared/components/game/pill-tabs";
import { Stepper } from "@/shared/components/game/stepper";
import { Sticker } from "@/shared/components/game/sticker";
import type { StickerMode } from "@/shared/components/game/sticker-view";
import { env } from "@/shared/config/env";
import { isCatalogueEnabled } from "../_lib/catalogue-access";
import { ana, jonah, noor } from "../_lib/fixtures";
import { CatalogueSection } from "./_components/catalogue-section";
import { EffectsDemo } from "./_components/effects-demo";
import { Example } from "./_components/example";
import { ModalDemo } from "./_components/modal-demo";
import { PropTable } from "./_components/prop-table";
import { ToastDemo } from "./_components/toast-demo";

export const metadata: Metadata = {
  title: "Game components",
  robots: { index: false, follow: false },
};

const MODES: StickerMode[] = ["locked", "collected", "maybe", "ruled", "found"];
const HREF = "/dev/components";

/** Catalogue of the game UI kit, for local dev and previews only; 404 everywhere else. */
export default function GameComponentsPage() {
  if (!isCatalogueEnabled({ nodeEnv: env.NODE_ENV, vercelEnv: env.NEXT_PUBLIC_VERCEL_ENV })) {
    notFound();
  }

  return (
    <GameShell>
      <main className="mx-auto flex w-full max-w-340 flex-col px-4 pt-16 pb-24 md:px-12">
        <header className="flex flex-col gap-3 pb-10">
          <span className="font-game-mono text-caption text-game-muted uppercase">
            The Album · game UI kit
          </span>
          <h1 className="font-game-serif text-hero">Components</h1>
          <p className="max-w-140 text-game-muted">
            Every piece of the game screens, from <code>src/shared/components/game</code>. Each
            example shows the props that render it.
          </p>
        </header>

        <CatalogueSection
          number="01"
          title="Sticker"
          description="The person card. Same layout in every mode: art on top, name and number below."
        >
          <div className="flex flex-wrap items-start gap-x-6 gap-y-8">
            {MODES.map((mode) => (
              <Example key={mode} code={`mode="${mode}"`}>
                <Sticker person={noor} mode={mode} />
              </Example>
            ))}
          </div>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-8">
            <Example code={`size="lg" mode="locked"`}>
              <Sticker person={noor} size="lg" mode="locked" />
            </Example>
            <Example code={`size="lg" mode="collected"`}>
              <Sticker person={noor} size="lg" mode="collected" />
            </Example>
            <Example code={`size="lg" mode="found" (photo)`}>
              <Sticker person={ana} size="lg" mode="found" />
            </Example>
          </div>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-8">
            <Example code={`rot={-2} mode="maybe" (photo)`}>
              <Sticker person={ana} mode="maybe" rot={-2} />
            </Example>
            <Example code={`rot={1.5} mode="ruled" (photo)`}>
              <Sticker person={ana} mode="ruled" rot={1.5} />
            </Example>
            <Example code={`mode="collected" (white initials)`}>
              <Sticker person={jonah} mode="collected" />
            </Example>
            <Example code={`tilt={false}`}>
              <Sticker person={jonah} mode="locked" tilt={false} />
            </Example>
          </div>
          <PropTable
            rows={[
              {
                name: "person",
                values: "name, number, team, color, tint, ask, city?, fact?, photoUrl?",
                notes:
                  "One person record. Locked needs only the public fields; without a photo the initials sit on the team color.",
              },
              {
                name: "mode",
                values: "locked · collected · maybe · ruled · found",
                notes:
                  "Locked shows the ask-me-about line on the team tint. Unlocking flips it and throws confetti.",
              },
              {
                name: "size",
                values: "sm · lg",
                notes: "176 × 248 in the album, 300 × 424 in moments",
              },
              { name: "rot", values: "−6 to 6", notes: "Hand-stuck angle, only in the album" },
              { name: "tilt", values: "true · false", notes: "Hover tilt; off for reduced motion" },
              {
                name: "celebrateChanges",
                values: "true · false",
                notes: "Confetti on unlock and on found",
              },
              {
                name: "celebratePalette",
                values: "light · dark · found",
                notes: "Star colors for the background: game bg, ink or orange",
              },
            ]}
          />
        </CatalogueSection>

        <CatalogueSection
          number="02"
          title="Clue card"
          description="Face down until its day, yellow when new, white once read."
        >
          <div className="flex flex-wrap items-start gap-x-6 gap-y-8">
            <Example code={`state="down"`}>
              <ClueCard state="down" label="Clue 3" footer="In 3 days" />
            </Example>
            <Example code={`state="new"`}>
              <ClueCard
                state="new"
                label="Clue 2"
                text="Has never owned a car, and never plans to."
              />
            </Example>
            <Example code={`state="open"`}>
              <ClueCard state="open" label="Clue 1" text="Works in Creative." />
            </Example>
          </div>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-8">
            <Example code={`size="lg" state="new" footer`}>
              <ClueCard
                state="new"
                size="lg"
                label="Clue 2"
                text="Has never owned a car, and never plans to."
                footer="From your welcomer"
              />
            </Example>
            <Example code={`size="lg" state="down"`}>
              <ClueCard state="down" size="lg" label="Clue 4" />
            </Example>
          </div>
          <PropTable
            rows={[
              { name: "state", values: "down · new · open", notes: "What the player has seen" },
              {
                name: "size",
                values: "sm · lg",
                notes: "200 × 260 on the mission, 320 × 420 alone",
              },
              {
                name: "label",
                values: "string",
                notes: "“Clue 2”; never a day. Timing goes in footer as a countdown",
              },
              { name: "text", values: "string", notes: "The clue; never sent before its day" },
              { name: "footer", values: "node", notes: "Pinned to the bottom of a face-up card" },
              { name: "rot", values: "degrees", notes: "Hand-placed angle" },
            ]}
          />
        </CatalogueSection>

        <CatalogueSection
          number="03"
          title="Button"
          description="Pill, 52 high. One dark button per screen."
        >
          <div className="flex flex-wrap items-center gap-x-7 gap-y-8">
            <Example code={`variant="cta"`}>
              <GameButton>Stick it in</GameButton>
            </Example>
            <Example code={`variant="yellow"`}>
              <GameButton variant="yellow">Could be my welcomer</GameButton>
            </Example>
            <Example code={`variant="light"`}>
              <GameButton variant="light">Back to album</GameButton>
            </Example>
            <Example code={`size="sm"`}>
              <GameButton size="sm">Guess Ana</GameButton>
            </Example>
            <Example code={`variant="link"`}>
              <GameButton variant="link">Not yet</GameButton>
            </Example>
            <Example code="asChild + Link">
              <GameButton asChild variant="light" size="sm">
                <Link href={HREF}>Open my album</Link>
              </GameButton>
            </Example>
            <Example code={`CloseButton tone="light"`}>
              <CloseButton label="Back to album" />
            </Example>
            <Example code={`IconButton tone="subtle" size="sm"`}>
              <IconButton label="How it works" icon={<CircleHelpIcon />} tone="subtle" size="sm" />
            </Example>
          </div>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-8 rounded-stage bg-game-ink p-6">
            <Example code={`variant="on-dark"`} onDark>
              <GameButton variant="on-dark">Make my card</GameButton>
            </Example>
            <Example code={`variant="yellow"`} onDark>
              <GameButton variant="yellow">Write my clues</GameButton>
            </Example>
            <Example code={`CloseButton tone="dark"`} onDark>
              <CloseButton label="Close" tone="dark" />
            </Example>
          </div>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-8 rounded-stage bg-game-found p-6">
            <Example code={`CloseButton tone="on-color" asChild`}>
              <CloseButton label="Close" tone="on-color" asChild>
                <Link href={HREF} />
              </CloseButton>
            </Example>
          </div>
          <PropTable
            rows={[
              {
                name: "variant",
                values: "cta · yellow · light · on-dark · link",
                notes: "on-dark sits on ink screens",
              },
              { name: "size", values: "default · sm", notes: "52 or 44 high" },
              { name: "asChild", values: "boolean", notes: "Renders a Link with the same styles" },
              {
                name: "CloseButton",
                values: "label, tone: light · dark · on-color, asChild",
                notes: "Icon only; label is the accessible name and the tooltip",
              },
            ]}
          />
        </CatalogueSection>

        <CatalogueSection
          number="04"
          title="Top bar"
          description="Logo, up to two pill tabs, a count and the avatar. Nothing else."
        >
          <div className="overflow-hidden rounded-2xl border border-game-border">
            <GameTopNav
              className="border-b-0"
              logoHref={HREF}
              tabs={
                <PillTabs
                  tabs={[
                    { href: HREF, label: "Album", current: true },
                    { href: `${HREF}#mission`, label: "Mission", badge: "New clue" },
                  ]}
                />
              }
              end={
                <>
                  <CountChip>5 / 20</CountChip>
                  <GameAvatar name="Léa Martin" color="#FF97AB" />
                </>
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-8">
            <Example code="CountChip">
              <CountChip>5 / 20</CountChip>
            </Example>
            <Example code={`variant="yellow"`}>
              <CountChip variant="yellow">No. 21 · Talent</CountChip>
            </Example>
            <Example code={`variant="dark"`}>
              <CountChip variant="dark">8 days left</CountChip>
            </Example>
            <Example code={`size="sm" dotColor`}>
              <CountChip size="sm" dotColor="#157428">
                Jonah Park
              </CountChip>
            </Example>
            <Example code="GameAvatar">
              <GameAvatar name="Léa Martin" color="#FF97AB" />
            </Example>
          </div>
          <PropTable
            rows={[
              {
                name: "GameTopNav",
                values: "logoHref?, tabs?, end?",
                notes: "Tabs center, end holds the count and avatar",
              },
              {
                name: "PillTabs",
                values: "tabs: [{ href, label, current?, badge? }] (max 2)",
                notes: "badge shows the yellow dot and names it for screen readers",
              },
              {
                name: "CountChip",
                values: "variant: default · yellow · dark, size: default · sm, dotColor?",
                notes: "Counts and status",
              },
              { name: "GameAvatar", values: "name, color", notes: "Initial on the team color" },
            ]}
          />
        </CatalogueSection>

        <CatalogueSection
          number="05"
          title="Input"
          description="52 high, 14 radius. Label above, help below only when it matters."
        >
          <div className="flex max-w-105 flex-col gap-5">
            <GameField label="Location" defaultValue="Montréal" />
            <GameField
              multiline
              label="One thing you learned"
              defaultValue="Ranks croissants from every city. Lisbon is winning."
              help="Only you see this."
            />
            <GameField label="Ask me about" defaultValue="" error="Write a few words." />
          </div>
          <PropTable
            rows={[
              { name: "label", values: "string", notes: "Always visible" },
              { name: "multiline", values: "boolean", notes: "Textarea, 104 high, no resize" },
              { name: "help", values: "string", notes: "Muted line under the field" },
              {
                name: "error",
                values: "string",
                notes: "Sets aria-invalid and describes the field",
              },
            ]}
          />
        </CatalogueSection>

        <CatalogueSection number="06" title="Feedback" description="Stepper, toast, modal.">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-8">
            <Example code="count={4} current={1}">
              <Stepper count={4} current={1} />
            </Example>
            <Example code={`tone="dark" cumulative`}>
              <div className="rounded-stage bg-game-ink p-4">
                <Stepper count={4} current={2} tone="dark" cumulative label="2 of 4 clues" />
              </div>
            </Example>
            <Example code={`gameToast("+1 sticker")`}>
              <ToastDemo />
            </Example>
            <Example code="GameModal">
              <ModalDemo />
            </Example>
          </div>
          <PropTable
            rows={[
              {
                name: "Stepper",
                values: "count, current, tone: light · dark, cumulative?, label?",
                notes: "Step dots or clue progress",
              },
              {
                name: "gameToast",
                values: "message, { duration?, id? }",
                notes: "Ink pill at the bottom; GameShell mounts its toaster",
              },
              {
                name: "GameModal",
                values: "open, onOpenChange, title, description?, stage?, children",
                notes: "Radix Dialog; the stage holds a large sticker",
              },
            ]}
          />
        </CatalogueSection>

        <CatalogueSection
          number="07"
          title="Effects"
          description="From libraries, never hand-built. Try them."
        >
          <EffectsDemo />
          <PropTable
            rows={[
              {
                name: "celebrate",
                values: "origin, { kind?, palette? }",
                notes: "canvas-confetti, skipped for reduced motion",
              },
              { name: "Tilt", values: "disabled?", notes: "react-parallax-tilt, 10°, scale 1.03" },
              { name: "Pop", values: "delay?", notes: "motion pop-in for titles and actions" },
              {
                name: "PageTransition",
                values: "children",
                notes: "Fade up per screen, from a route template",
              },
            ]}
          />
        </CatalogueSection>

        <CatalogueSection
          number="08"
          title="Layout"
          description="The frame every player screen sits in."
        >
          <PropTable
            rows={[
              {
                name: "GameShell",
                values: "tone: default · ink · found",
                notes: "Fonts, background and the game toaster",
              },
              { name: "GameStage", values: "middle?, as?", notes: "The centered column" },
              { name: "GameBook", values: "as?", notes: "White page for the album and forms" },
            ]}
          />
        </CatalogueSection>
      </main>
    </GameShell>
  );
}
