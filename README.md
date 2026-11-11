# First Class Legal — homepage

A static rebuild of the First Class Legal homepage, following the supplied
reference design (image 1) and adopting the motion grammar from the
"Tana Camps / Elephant" brief.

Plain HTML, CSS and vanilla JS. No framework, no build step, no dependencies.

## Run it

```bash
cd site
python3 -m http.server 8000
# → http://localhost:8000
```

Any static host works. All assets are local and self-hosted (fonts included),
so it runs fully offline.

## Structure

```
site/
├─ index.html                  all 17 sections
└─ assets/
   ├─ css/site.css             design tokens, layout, motion primitives
   ├─ css/fonts.css            @font-face for the self-hosted woff2 files
   ├─ js/site.js               motion engine
   ├─ fonts/                   Poppins (display) + Inter (text), latin subsets
   └─ img/                     15 photographs
```

## Design tokens

| Token | Value | Use |
|---|---|---|
| `--ink` | `#10172A` | headings |
| `--body` | `#5B657F` | body copy |
| `--red` | `#EE3B25` | the single accent — CTAs, labels, live values |
| `--paper` | `#EBE8E3` | warm putty section ground |
| `--cool` | `#F2F1F6` | reserved flat ground (no longer used) |
| `--tan` | `#B2A384` | referral bar |
| `--bar` | `#2F363E` | utility bar |
| `--grain` | `.05` | SVG fractal-noise overlay, multiply |

Type: **Poppins** 600/700 for display, **Inter** 400–600 for text — both
self-hosted woff2, latin + latin-ext subsets.

The fixed-fee section uses `.gradient-bg` — a six-layer radial multi-glow
(`#f7f4f1` base with periwinkle, cool grey, cream and blush blooms) at
`min-height: 100vh`. The white fee cards carry a soft shadow so they sit on
the gradient rather than float flat against it.

## Motion system

Everything is driven by three primitives in `site.js`.

**1 · Letter-by-letter rise.** `splitAll()` walks every `[data-split]` /
`[data-split-title]` element, wrapping each word in an overflow-masked
`.word` and each character in a `.ch` span. Characters rise from below with
a blur and a slight alternating tilt, staggered by CSS `transition-delay`:

| Target | Delay | Rise | Blur |
|---|---|---|---|
| Hero title | 95 ms | `.18em` | 10 px |
| Statement ("Conveyancing for…") | 26 ms | `.55em` | — |
| Section titles | 30 ms | `.55em` | — |

**2 · The photo melts into the paper.** On scroll, `--melt` runs 0 → 1 over
the first 60% of a viewport. The hero stage drifts down at `.32×` the scroll,
the photo blurs up to 6px, a paper-coloured gradient grows from 34% → 100% of
the hero height, and the copy fades out with it. The gradient reaches full
opacity before its ramp ends, so the seam with the next section is invisible.

**3 · Wipes and parallax.** Portraits (`[data-portrait]`) reveal with
`clip-path: inset(100% 0 0 0) → inset(0)` over 1.2s while the image settles
from `scale(1.25)`; the image then drifts ±7% with scroll via the independent
`translate` property. Pills spring in from scale 0 with overshoot while their
photo zooms 1.5 → 1. The emblem turns in from −90°.

Other pieces: the credential marquee, a 48-tick play badge turning once every
16s, scroll-snap carousels with arrow controls, an FAQ accordion, the quote
form tabs, and a sticky call bar.

### Carousels

Both rows (property types, reviews) are scroll-snap rails with a bleed off the
right edge. The arrow pair under each row steps one card at a time, greys out
at each end, and hides itself entirely when the row already fits on screen —
so nothing dead is left sitting there.

Note the rails are padded to the shell's left edge (115px at 1440), not the
viewport edge. `scroll-snap-type` snaps against the container's content box,
so the padding needs a matching `scroll-padding-left` — without it the browser
snaps the first card back to x=0 and the grid alignment breaks.

The property cards carry a red outline pill as their call to action; it fills
solid with the accent on hover and nudges its arrow across.

### Recorder mode

Append `?rec=1` to the URL. The page is then driven by a 6.5s Web Animation
instead of real scrolling:

| Time | Action |
|---|---|
| 0 – 1.95s | hold on the hero |
| 1.95 – 3.35s | glide to the statement |
| 3.35 – 4.25s | hold |
| 4.25 – 5.55s | glide to the services |
| 5.55s + | hold |

Reveals fire at 0s, 2.65s and 4.85s. A rAF loop reads the animation's
current time and feeds the same scroll-linked effects, so a frame-by-frame
recorder is deterministic.

### Accessibility

`prefers-reduced-motion: reduce` disables the split animation, wipes, drift
and marquee, and shows all content immediately.

## Notes

- The accreditation strip renders partner names as plain monochrome
  wordmarks rather than copying trademarked logo artwork.
- Photography is illustrative. Nine images were generated for this build;
  six are Pexels stock (see `CREDITS.md`). Swap in the firm's own
  photography before production.
- The quote form is a front-end demonstration — it does not submit anywhere.
