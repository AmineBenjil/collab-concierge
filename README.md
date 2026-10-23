# Collab Concierge landing page

Benable's landing page for Collab Concierge: one link for local businesses that get creator collab DMs on Instagram.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## What's on the page

- **Intro**: collab DMs arrive one by one as a notification stack with a running count, then fold into "All handled by Benable" while the hero fades in. Click, scroll or press any key to skip. Skipped automatically for visitors who prefer reduced motion.
- **Hero**: headline, one-line explanation, two CTAs, and a real iPhone 16 Pro frame. Inside it, Instagram's DM UI is built at true iOS size (402 by 874 points) and scaled to fit. The `foundcoffee` inbox gets a new DM from Mia, the thread opens, the café pastes the Benable reply, Mia fills it in, and a Mail notification from Benable says she's worth a yes. It loops every 16 seconds. The script lives in `src/components/Phone.tsx`.
- **Trust line**: "Trusted by 35,000+ brands and businesses" under the hero buttons, and again as the giant count-up stat.
- **Sections**: a problem bento (the four questions), an auto-advancing "How it works" tab panel, a sticky "What we check" section whose report card updates as you scroll, the 35,000+ stat, a moving wall of Benable creators with the bags photo, the FAQ, and a closing call to action with the form over a giant Benable wordmark.

## Design system

Inspired by zorcha.com, adapted to Benable. Only the hero headline uses Benable's National 2 Narrow. Every other heading and all body text use Inter (400, 500, 600, 700). Icons come from Remix Icon (`@remixicon/react`), except the Instagram and iOS screens inside the phone, which keep their own icons. Ink is deep indigo (`--ink`), and the page is cool off-white. Shared pieces live in `src/app/globals.css` (tokens, pill labels, buttons, cards, dot grid) and `src/components/ui.tsx`.

## Brand assets

- `public/fonts`: National 2 Narrow, pulled from benable.com (same files the main site serves).
- `public/img/bags.png`: the two creators with Benable bags, cut out from benable.com's "earn money" callout.
- `public/img/creators`: the featured-creator tiles from benable.com.
- Colors and the headline gradient match benable.com's CSS.

The form in "Get your link" is front-end only. Wire `src/components/ClaimLink.tsx` to a real endpoint before launch.

## Image credits

- iPhone 16 Pro frame: Apple Design Resources, via github.com/jamesjingyi/mockup-device-frames. Check Apple's terms before using it in paid ads.
- Instagram DM UI icons in `public/img/ig/ui`: exported from the Brands Collab Deck Figma file, Outreach assets page, "IG UI" frames (nodes 519:4568 and 516:2440). The thread layout follows those frames point for point.
- DM avatars in `public/img/ig`: Unsplash, free to use under the Unsplash License. Swap them for real Benable creators if Tony prefers.
