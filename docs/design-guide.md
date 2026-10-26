# Collab Concierge, design guide

How the Collab Concierge landing page and sign-up flow are designed and built, so new pages can feel like the same product. Everything here is taken from the live code (`src/app/globals.css` and `src/components/`).

Stack: Next.js (App Router), React, TypeScript, Tailwind CSS v4, `motion` for animation, Remix Icon for icons.

---

## 1. Design direction

**Calm, high-end, trustworthy.** The product takes a messy job (vetting creators who DM a business) and makes it feel handled. The design does the same: lots of air, few colours, soft depth, and motion that explains rather than decorates.

Principles we kept to:

1. **Show the product, don't describe it.** The hero is a real-feeling iPhone running the actual story: a creator DMs, the business pastes its link, the creator fills it in. Sections below use real UI pieces (DM threads, checklists, rule tiles, a dashboard card) instead of illustrations.
2. **One loud thing per screen.** The hero headline and the phone carry the first screen. Each later section has one focal element (a sticky report card, a carousel, a ranking card). Everything around it stays quiet.
3. **Real, faithful details.** The phone uses a real iPhone 16 Pro frame and an Instagram UI built from Figma. The notification is a real iOS banner. Fake-looking mockups break trust.
4. **Nothing jumps.** Panels have fixed sizes, slots are reserved before content arrives, and pop-ups float over the layout instead of pushing it. Motion never makes the page reflow.
5. **Smooth, paced motion.** Animations arrive in a calm order, at a readable pace, with one shared easing curve. No bouncing, no infinite bobbing, nothing that flickers.
6. **Short copy.** Headlines and subtexts are kept to one or two short, even lines. Copy speaks in outcomes ("You just say yes or no"), not features.

---

## 2. Colour

### Core tokens

| Token | Hex | Use |
|---|---|---|
| `ink` | `#161a35` | Primary text, icons, dark UI. A deep indigo instead of pure black. |
| `ink-2` | `#4a4e69` | Body copy inside cards and UI. |
| `muted` | `#8a8da3` | Secondary text, placeholders, meta (`@handle · Instagram`). |
| `bg` | `#fafafc` | Page background, a cool off-white. |
| `surface` | `#ffffff` | Cards, inputs, the nav bar. |
| `line` | `#e7e8ef` | Hairlines and card borders. |
| `lilac` | `#f3f0ff` | Soft highlight: active list rows, icon tiles, hover backgrounds. |
| `night` | `#0f1129` | Dark hero background (V1). |
| `violet` | `#6b4ef0` | Accent text and links ("Check 3 of 7", "Test your link"). |
| `mint` | `#22b07d` | Success: ticks, "That's me", the Live chip. |
| `rose` | `#e5536f` | Warnings and red flags. |

### Brand purple

| Colour | Hex | Use |
|---|---|---|
| Benable purple | `#5035e3` | The main sign-up arrow button, the activate button, the "Set any of your own rules" header, sent DM bubbles. |
| Purple at 20% | `#5035e3` / 20% | The same buttons while they're inactive (nothing typed yet). |
| Focus purple | `#8f7cf7` | The 2px stroke around an input pill while you type in it. |
| Focus ring | `#b9a8ff` | Keyboard focus ring on buttons and links (3px). |

### Section type colours (from the Figma frame)

| Colour | Hex | Use |
|---|---|---|
| Heading | `#1c1c1c` | Every section heading. |
| Subtext | `#484848` | Every section subtext. |

### Gradients

| Name | Value | Use |
|---|---|---|
| Accent gradient | `linear-gradient(95deg, #4d8dff 0%, #8f6cf7 48%, #f2869a 100%)` | Gradient words in headlines ("Concierge.", "small investigation", "live."). Applied as text fill (`.grad-text`). Use on one phrase per headline at most. |
| Brand gradient | `linear-gradient(130deg, #4daeff 0%, #749bff 25%, #cba0f6 50%, #e9a8b1 70%, #fbb647 100%)` | Benable's own gradient: avatar rings, the link card in the phone. |
| Soft glow | `radial-gradient(closest-side, rgba(143,108,247,.28), rgba(242,134,154,.12) 55%, transparent)` + `blur-2xl` | The violet-to-rose glow behind key sections. |

### Section backgrounds

Alternate backgrounds so neighbouring sections never blend into each other:

- Page default: `#fafafc`
- Plain white sections (What we check, FAQ): `#ffffff`
- Brand strip: `#f4f4f4`
- Ranking section: `#f3f2f9` (soft lavender-grey)
- Hero V1: `night` with three blurred colour glows (violet top-left, blue right, rose bottom), a light dot grid and film grain
- Hero V2: a soft pastel Figma wash (`/img/hero-v2-bg.png`) with a faint grid at 20% opacity

---

## 3. Typography

Two families, each with one job.

| Family | Where | Weights |
|---|---|---|
| **National 2 Narrow** (Klim, Benable's brand face) | The hero headline only | Bold 700 |
| **Inter** | Everything else: headings, body, UI, numbers | Regular 400, Medium 500, Semibold 600, Bold 700, ExtraBold 800 |

The phone mock uses the iOS system font so it reads as a real iPhone.

### Type scale

| Role | Size (phone / tablet / desktop) | Weight | Line height | Colour | Notes |
|---|---|---|---|---|---|
| Hero headline | 48 / 66 / up to 70px (scales with screen height) | National 2 Narrow Bold | 0.98 | white (V1) or ink (V2) | One gradient phrase ("Concierge."). |
| Moment title (setup, live) | 38 / 52px | Inter ExtraBold 800 | 1.04 | `#1c1c1c` | Centred, letter spacing −0.035em. |
| Section heading `.section-title` | 30 / 36 / 40px | Inter Bold 700 | normal | `#1c1c1c` | Max 636px wide, lines balanced. |
| Section subtext `.section-sub` | 17 / 18 / 20px | Inter Regular 400 | normal | `#484848` | Max 500px wide, 24px under the heading. |
| Hero subtext | 18 / 20px | Inter Regular | 1.625 | white 70% (V1) or `ink-2` (V2) | Max 520px. |
| Card title (h3) | 26–30px | Inter Bold | 1.15 | ink | Letter spacing −0.025em. |
| Body / UI | 14–16px | Inter Regular / Medium | 1.4–1.6 | `ink-2` | |
| Labels, meta | 13–14px | Inter Medium / Semibold | — | `muted` or `violet` | e.g. "Check 2 of 7". |
| Big stat numbers | 32px | Inter Black 900 | normal | `#4e1c7a` | Letter spacing −1.63px (stats strip). |

### Copy rules

- Headlines: one or two short, even lines. If a subtext runs to three lines, cut words rather than widen the column.
- Sentence case everywhere. No all-caps labels except where they imitate real UI (the iOS notification header).
- At most one gradient phrase per headline.
- Speak to the business owner in outcomes: "Send them one link. … You just say yes or no."

---

## 4. Layout and spacing

- **Containers:** content max width 1180px with 20px side padding on phones and 32px from 768px up. The hero uses a wider 1480px container.
- **Hero:** fills exactly one screen (`min-h-svh`). Copy on the left, phone on the right. The left edge to the text and the right edge to the phone are the same distance (64px on laptop screens), so the screen feels balanced.
- **Section rhythm:** 96px top and bottom padding on phones, 112–128px on desktop (`py-24 sm:py-28` / `sm:py-32`).
- **Spacing steps:** multiples of 4px. Common gaps: 8, 12, 16, 24, 32, 40px.
- **Heading block:** tag pill, then 24px, then the heading, then 24px, then the subtext. Centred.
- **Grids:** two columns on desktop (copy and visual), stacked on phones.
- **Phones:** every section is checked at 375px wide with no sideways scrolling and a 20px side gutter.

### Radius scale

| Element | Radius |
|---|---|
| Buttons, inputs, chips, tags | fully round (pill) |
| Small UI tiles, icon tiles | 10–16px |
| Nav bar | 18px |
| Cards | 24px (`.card`), 28px (setup and live cards) |
| Creator tiles | 33px |
| Ranking card | 32px |

### Depth

Soft, low shadows tinted indigo instead of grey:

- Card: `0 1px 0 rgba(22,26,53,.02), 0 24px 48px -32px rgba(40,30,110,.22)`
- Floating card (match card, nav when scrolled): `0 20px 32px -12px rgba(50,38,98,.22)` up to `0 24px 50px -22px rgba(40,30,110,.45)`
- Borders: 1px `line` (`#e7e8ef`) on most cards, so depth comes from border and shadow together.

### Texture

- **Dot grid** (`.dot-grid`): 1px dots every 18px at 13% ink, masked so it fades out towards the edges. On dark backgrounds, `.dot-grid-light` uses white dots every 22px.
- **Film grain** (`.noise`): a fractal-noise SVG overlay in soft-light at 50%, on the dark hero only.
- **Glows:** large blurred radial gradients behind focal elements.

---

## 5. Components

### Navigation bar
A floating glass bar, 58px tall, 18px radius.

- **Over the dark hero:** 1120px wide, 6% white, white text, white "Get your link" button.
- **After 40px of scrolling, or over a light hero:** it shrinks to 860px and turns 70% white with a backdrop blur, dark text and a flat black button.
- **Contents:** Benable logo, a 1px divider, "Collab Concierge", the section links (How it works, What we check, Creators, FAQ), then the button.
- **Logo:** built from the Figma parts (gradient tile, vector "B", vector wordmark). The wordmark takes the text colour, so it works on dark and light. It's laid out as a block, so it centres exactly in the bar.

### Buttons
| Type | Look | Where |
|---|---|---|
| Primary purple | Solid `#5035e3`, white text or arrow, fully round, flat. Faint at 20% until there's something to submit. | Hero/closing sign-up arrow, "Activate my Concierge link", "Customize". |
| Black | Flat `#111`, white text, turns pure black on hover. No gradient, no shadow. | "Get your link" (on light), "Yes, that's me", "Copy link", "Yes, book her". |
| Light | White with a faint top highlight and a hairline border. | "Get your link" over the dark hero. |
| Text link | Violet, semibold, with ↗ when it opens something. | "Test your link, see what creators see ↗". |

All buttons lift 1px on hover and scale to 98.5% on press, over 300ms.

### Sign-up input (the handle pill)
- White pill, 58px tall (64px from tablet up), with a muted "@", the input and a round purple arrow button.
- **Focus:** a 2px `#8f7cf7` stroke around the whole pill and a soft purple glow behind it. The text field itself has no outline.
- **Empty:** arrow button at 20% purple, not clickable. It turns solid as soon as something is typed.
- **Note underneath:** "Totally free. 30 seconds to create." in 14px muted text.
- **Autofill:** browsers paint autofilled fields blue, so we override that to keep pills white.

### Tag pill
White pill with a hairline border and a soft shadow, 15px semibold ink text ("How it works", "Our creators"). Sits above every section heading.

### Cards
White, 1px `line` border, 24–28px radius, soft indigo shadow, 24px padding. Lists inside cards use 1px dividers and 12–14px gaps.

### Status icons
- **Done:** 20px mint circle with a white tick.
- **Working:** 20px ring spinner (`violet` at 15% with a solid violet top arc).
- **Waiting:** an empty 20px ring in `line`.
- Icons swap with a 300ms fade and scale, in a fixed 20px slot, so rows never shift.

### Tabs
A segmented pill: a light grey track (`#eef0f3`) with a white thumb under the active option that slides between options (a `motion` layout animation). Used for Share / Dashboard in the header (these are real routes, so the thumb follows the URL) and for the Fit / Date sort. The dashboard's Requests / Moving forward / Declined filter is the same idea at full width with 10px corners, each label followed by its count. Lists below it use quiet section labels with a hairline running to the edge ("Strong fit 3 ———— Sort by date") instead of boxed headers.

### Toast
A dark ink pill at the bottom centre with white 14px text. It slides up and fades in, then disappears after 2.6 seconds. Used for "next on the build list" messages.

### Avatars
Round photo inside a 2px brand-gradient ring with a 2px white gap, like an Instagram story ring.

### Icons
Remix Icon line icons (`@remixicon/react`) at 16–20px, in ink, muted or violet. The phone keeps real Instagram and iOS icons from Figma.

---

## 6. Page sections

1. **Intro (first visit only):** creator DMs arrive one by one as an iOS-style notification stack with a counter ("7 new collab DMs"). They pile up, then fold into a single "All handled by Benable" pill while the hero fades in. It can be skipped with a click, a scroll or any key.
2. **Hero:** headline, subtext, sign-up pill, and the phone running the DM story on a loop. Creator faces with frosted message bubbles drift in and out beside the phone.
3. **Brand strip:** "Trusted by over 30k+ businesses and brands" over a looping row of brand logos, on `#f4f4f4`.
4. **Sound familiar? (Problem):** a bento grid of the four questions every collab DM raises.
5. **How it works:** a fixed-size stage that steps through You paste, They apply, We vet, You decide. Each step has a progress bar, and hovering pauses it.
6. **What we check:** the seven checks scroll on the left while a sticky report card on the right updates: a big stat, ticks for checks already passed, spinners for the rest.
7. **Our creators:** a looping carousel of creator tiles whose photos break out of the top of the tile, then a stats strip (2 million users, 31,500+ videos, 20,000+ partnerships).
8. **Ranking:** "Benable ranked #1" from The Information, with the top-five table and Benable's row floating out of it.
9. **FAQ:** an accordion.
10. **Get started and footer:** the same sign-up pill, a giant soft Benable wordmark, and the footer card.

**Sign-up flow:** handle, then "is this you?", then `/start` (setup checklist and email), then `/share` (the link and the reply to paste) and `/dashboard` (every creator who used the link, vetted, with a side panel per request). `/start`, `/share` and `/dashboard` share one layout, so the header stays put between them.

**Creator side:** `/c/<handle>` is what a creator sees after the business replies with its link: one question per screen (Socials, Collab, Audience, Details), a sticky purple button, the draft saved as they type. `?preview=1` adds a "This is what creators see" bar for the business testing its own link.

---

## 7. Motion and interaction

### One easing curve
Almost everything uses **`cubic-bezier(0.22, 1, 0.36, 1)`**, a fast start with a long, soft settle. Press and hover feedback uses `cubic-bezier(0.2, 0.8, 0.2, 1)`.

| Kind | Duration |
|---|---|
| Hover, press, colour changes | 200–300ms |
| Pop-ups, toasts, swaps | 250–450ms |
| Section and page entrances | 700–900ms |
| Hero phone transitions | about 450–650ms (iOS-like) |

### Entrances
- **Scroll reveal** (`Reveal`): content starts 22px lower, at 0 opacity, blurred 6px, and settles over 0.8s when it is 80px into view. It plays once.
- **Staggered groups:** items in a group follow each other 80–100ms apart (hero copy, onboarding cards).
- **Page swaps:** the setup step leaves upward with a blur (0.45s), and the live step rises in.

### The hero phone
- **A scripted timeline:** the inbox, a new DM, tapping into the thread, the keyboard rising, long-press then Paste, send, "Seen", typing dots, the reply, swiping back, the next DM, then the iOS notification. The full loop is about 21.6 seconds.
- **Real iOS motion:** pushing into a thread slides in from the right, going back swipes the other way, and the keyboard slides up from the bottom.
- **Live personalisation:** whatever handle is typed in the hero immediately becomes the phone's inbox name and the "Collab with …" link card.
- **No flicker:** no infinite bobbing, no drop-shadow filters on the frame (a static blurred layer sits behind it instead), position-only layout animation, and fixed-size slots for everything that appears.

### Floating creator DMs (hero)
A small scheduler adds one bubble every 3.1 seconds at a random height beside the phone, never above or below it. There are at most 3 on screen, and bubbles on the same side never overlap. Each one lives for 9 seconds: about 2s fading in, 5s drifting up slightly, 2s fading out. The right side is only used when there's at least 250px of room. Bubbles use a strong backdrop blur. The fade is applied to the face and the bubble separately, because fading their shared parent would switch the blur off.

### Loops
- Brand strip: logos scroll sideways in 38 seconds, with the edges faded out.
- Creator carousel: 60 seconds per loop, and it pauses while you hover.
- Both are seamless because the row is repeated twice and moves by exactly half its width.

### Feedback that explains what changed
- The sign-up arrow turns into a spinner while we look the account up. The "is this you?" card then floats in under the pill without moving anything else.
- "Yes, that's me" turns into a mint "✓ That's me" before the page changes.
- "Copy link" changes to "✓ Copied" for 1.8 seconds.
- The setup checklist runs one step at a time, about 1.3 seconds each. The subtitle then changes from "Setting it up for you now." to "Ready. One thing before it goes live."
- Creator tiles grow to about 111% on hover, with a 4px white border and a soft shadow.

### Accessibility
- Everything respects **reduced motion**: loops and spinners stop, the intro is skipped, and the floating bubbles are hidden.
- Keyboard focus shows a 3px `#b9a8ff` ring. Text fields show the pill stroke instead.
- Buttons have clear labels ("Find my account", "Copy link"), and decorative images are hidden from screen readers.

---

## 8. Recipes for new pages

To build a page that matches:

1. Start on `bg` (`#fafafc`). Add one soft violet-to-rose glow and a dot grid near the top.
2. Open with a tag pill, a `.section-title` (one gradient phrase at most) and a `.section-sub`, centred and kept to two lines each.
3. Put the main content in white cards (`.card`): 1px `line` border, 24–28px radius, soft indigo shadow.
4. Use one primary action. Make it purple `#5035e3` for sign-up actions or flat black `#111` otherwise. Make it faint at 20% until it can be used.
5. Wrap entrances in `Reveal`. Use the shared easing curve with 700–900ms entrances and 80ms staggers.
6. Reserve space for anything that appears later, so nothing jumps.
7. Alternate section backgrounds (`#fafafc`, `#ffffff`, `#f3f2f9`) so neighbouring sections stay distinct.
8. Check at 375px wide: no sideways scrolling, 20px gutters, buttons at least 40px tall.
