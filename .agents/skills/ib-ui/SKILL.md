---
name: ib-ui
description: Build UI in an inBeat app with @inbeat/ui primitives and tokens. Use when creating or editing components, pages, dialogs, tables, forms, empty states, or when the user mentions ib-ui or @ib-ui.
---

# ib-ui

## Before writing any UI

Check the [Catalog](#catalog). Build pages and domain compositions only from catalog components
and tokens. Icons are always `lucide-react`.

**Allowed in the app**: page layouts and domain compositions (a `CreatorCard` from `Avatar` +
`Badge`) in `src/shared/components/blocks` or the feature's `components/`. Different apps may
compose different layouts.

**Not allowed**: new generic primitives or variants (a local button, modal, select, table or
toast), copying or restyling a toolkit component, faking a variant with override classes,
installing another UI library, running `shadcn add`.

**Missing component**: stop. Tell the user which component or variant is missing and why, and
propose adding it to ib-toolkit (`packages/ui` plus its story). Only with the user's explicit
agreement, use a workaround and mark it `// toolkit-gap: <what is missing>` so it is greppable.

## Rules

- Import `@inbeat/ui/components/<name>`; `cn` from `@inbeat/ui/lib/utils`.
- Tokens only: `bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`, radius
  scale `rounded-{sm..4xl}`, shadows `shadow-hairline|subtle|elevated`. No hex colors, no
  arbitrary spacing unless no token fits.
- Spacing: nothing touches a border, divider or container edge. A row with a `border-b` gets
  bottom padding at least as large as the gap between its items (`pb-3` minimum), and a bordered
  box pads every bordered side. Space siblings with `gap-*` on the parent, not margins. Use one
  step of the spacing scale per level: tighter inside a group (`gap-2`), looser between groups
  (`gap-4`/`gap-6`). Before finishing, check every bordered or separated region for flush
  content.
- App shells: `AppShell` + `AppNav`, never Sidebar primitives. Links come in via `renderLink`;
  app sidebar content goes in the `sidebar` slot. Products differ only through `AppShell` props
  (`variant`, `collapsible`, `sidebarWidth`, `headerVariant`), never classes or local shell markup.
- Variants are only the ones an app uses. `Button`: default, secondary, outline, ghost, link,
  dots; sizes xs, sm, default, lg, icon*; always `rounded-full`, no destructive variant.
  `Badge`: default, secondary, outline. `TabsList` is pills only.
- Tabs: `Tabs` + `TabsList tabs={[{ value, label, count? }]}` + `TabsContent`; drop
  `TabsContent` for a filter bar.
- Destructive flows open `DestructiveActionDialog` (owns the confirm step; `variant="typed"`
  makes the user type `DELETE <name>`). Confirm never closes it: call `onOpenChange(false)` on
  success, so a pending or failed action keeps it open.
- Action menus: `Button variant="dots"` + `DropdownMenu`. Inside an element with `data-row` it
  reveals on row hover; elsewhere it stays visible.
- Icon-only buttons are `IconButton` (required `label` = tooltip + `aria-label`), except `dots`.
  It works as a `DropdownMenuTrigger asChild` child; with `asChild` it renders a link. Show/hide
  toggles: `label="Show filters" pressedLabel="Hide filters" pressed={isOpen}`; `pressed` owns the
  look. Menu and popover triggers are not toggles: static label, no `pressed`.
- Labels are one to three words, no ids or emails.
- Lists: `DataTableShell` + `DataTable`. With no data render `EmptyState` instead of the table;
  DataTable's "No results." is only for an empty filter result.
- Forms (client leaf): `schema.safeParse(values)` with the schema shared with the action; on
  failure keep one message per field from `issues` (`issue.path[0]`). Per field:
  `<Field data-invalid={Boolean(errors.name)}><Label/><Input aria-invalid={Boolean(errors.name)}
  aria-describedby="name-error"/><FieldError id="name-error">{errors.name}</FieldError></Field>`.
  On success `const result = await action(parsed.data)`; `if (!result.ok) toast.error(result.error)`
  (`sonner`; `result.errorId` when present is the support reference).
- Animation: `motion/react` only, respecting `prefers-reduced-motion`.
- `page.tsx` stays a Server Component (title, layout, data loading); only the stateful leaf (a
  table with dialogs, a form) is `"use client"`.

## Catalog

Every module of `@inbeat/ui`, imported as `@inbeat/ui/<path>`.

### Actions
- `components/button`: Button with variants, sizes and `buttonVariants` for link styling.
- `components/icon-button`: icon-only Button with a required label, tooltip and toggle state.

### Forms
- `components/field`: Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldSet and friends for form layout.
- `components/label`: accessible form Label.
- `components/input`: text Input.
- `components/textarea`: multi-line Textarea.
- `components/checkbox`: Checkbox.
- `components/select`: single-choice Select.
- `components/combobox`: searchable Combobox with chips for multiple values.
- `components/multi-select-popover`: popover multi-select over a list of options; `disabled` on an option locks that row; `renderLabel(selectedOptions)` sets the trigger text; takes every `MultiSelectOptionList` prop (`searchable`, `isPending`, …).
- `components/toggle-pills`: pill buttons toggling a set of string options, for filters.
- `components/input-group`: Input or Textarea with inline addons, buttons and text.
- `components/search-input`: controlled search Input with a loading state.
- `components/calendar`: date Calendar (react-day-picker) in the toolkit style.

### Display
- `components/avatar`: Avatar, AvatarImage, AvatarFallback, AvatarGroup and AvatarGroupCount.
- `components/person-identity`: PersonAvatar, PersonName and PersonIdentity for a person's image and name.
- `components/member-avatar-stack`: overlapping avatars of up to three members plus a remainder count.
- `components/badge`: Badge chip.
- `components/number-dot`: small count pill, renders nothing at zero.
- `components/labeled-field`: read-only label and value pair.
- `components/empty-state`: EmptyState with icon, title, description and an optional labelled action.
- `components/separator`: horizontal or vertical Separator.
- `components/carousel`: Embla Carousel, CarouselContent and CarouselItem.
- `components/collapsible-section`: animated CollapsibleSection with trigger and content.

### Feedback
- `components/alert`: Alert, AlertTitle and AlertDescription (default, destructive).
- `components/sonner`: Toaster for `sonner` toasts; mount once in the root layout.
- `components/spinner`: Spinner and SectionSpinner for loading states.
- `components/skeleton`: Skeleton placeholder.
- `components/progress`: Progress bar.
- `components/platform-disclaimer`: dismissible notice whose dismissal is stored in a cookie.

### Navigation
- `components/app-nav`: sidebar navigation list driven by `items` and `renderLink`.
- `components/nav-user`: sidebar user menu with name, email, avatar and dropdown.
- `components/breadcrumb`: Breadcrumb from `links` + `page` (pass `renderLink` for the router Link); renderLink must return an element that forwards props and ref, which `next/link` does. It truncates the page title and collapses links into a … menu below `lg` and when there are more than 2 links.
- `components/tabs`: Tabs, TabsList (pills from a `tabs` array) and TabsContent.
- `components/sidebar`: Sidebar primitives that AppShell is built from; apps do not use them directly.

### Overlays
- `components/dialog`: modal Dialog.
- `components/alert-dialog`: AlertDialog for interrupting confirmations.
- `components/destructive-action-dialog`: confirm step for destructive actions, optionally typed.
- `components/sheet`: side Sheet panel.
- `components/popover`: Popover.
- `components/dropdown-menu`: DropdownMenu.
- `components/tooltip`: Tooltip and TooltipProvider.
- `components/portal-container`: PortalContainerProvider and usePortalContainer to portal overlays into a chosen element.

### Data
- `components/data-table`: DataTable driven by TanStack `columns` and `data`.
- `components/data-table-shell`: scrollable wrapper that holds a DataTable.
- `components/data-table-sortable-header`: sortable column header for DataTable columns.
- `components/table`: Table, TableHeader, TableBody, TableRow, TableHead and TableCell primitives.
- `components/load-more-sentinel`: invisible marker that triggers infinite loading.

### Layout
- `components/app-shell`: AppShell page frame with sidebar and header, and AppShellLogo.

### Hooks and lib
- `hooks/use-mobile`: `useIsMobile()` breakpoint hook.
- `lib/utils`: `cn()` class merging.
- `lib/easing`: `EASING_FUNCTION` curves shared with motion animations.
- `lib/initials`: `getInitials(name, fallback)`.

## Setup in an app

```css
/* src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@import "@inbeat/ui/theme.css";
```

`next.config.ts`: `transpilePackages: ["@inbeat/ui"]` (ui ships source; core and next ship compiled JS).
The template installs every peer the catalog needs.

## Adding or changing a component

Do it in `ib-toolkit/packages/ui/src/components`, add or update its story in `packages/ui/stories`
(`bun run storybook`; stories are grouped like the catalog, render every variant and size from a
declared list, and use the neutral data in `stories/lib/fixtures.ts`), add it to the Catalog
above (a test enforces this), then `bun run sync <app-dir>`. Domain compositions tied to one app's
data stay in the app; once a second app needs one, promote it here.
