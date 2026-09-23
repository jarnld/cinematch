# CineMatch Style Guide

**Status:** Documentation of the existing implementation, published in the CineMatch repository  
**Source:** [`jarnld/cinematch`](https://github.com/jarnld/cinematch), `main` at commit `6670135274f4e8929ed8220c31249d489129430c`  
**Primary implementation reviewed:** [`dist/index.html`](https://github.com/jarnld/cinematch/blob/main/dist/index.html), [`dist/styles.css`](https://github.com/jarnld/cinematch/blob/main/dist/styles.css), [`dist/app.js`](https://github.com/jarnld/cinematch/blob/main/dist/app.js)  
**Supporting references:** repository README, production-foundation document, adaptive-options implementation, and the four captured desktop screens in `artifacts/cinematch-screenshots/`

## 1. Product and visual character

CineMatch is a focused, game-like movie concierge. Its existing interface turns six quick decisions into one confident recommendation rather than exposing a catalog to browse.

The implemented visual language is:

- Cinematic: a pure-black canvas, poster and cast imagery, theatrical scale, and red light/glow details.
- Decisive: one question at a time, one primary action, short transitions, and one final recommendation.
- Editorial: oversized display type, compact uppercase labels, numbered choices, and restrained metadata.
- Minimal: square corners, hairline borders, few colors, sparse navigation, and generous negative space.
- Conversational: concise prompts and vivid, human subtitles instead of technical filter language.

The core design rule is **narrow the decision; do not recreate a streaming catalog**.

## 2. Color system

### Canonical tokens already defined

| Token | Exact value | Existing role | Standard use |
|---|---:|---|---|
| `--bg` | `#000000` (`#000`) | Page background | Global canvas and slider-thumb cutout |
| `--panel` | `#0B0B0B` | Cards | Default answer and refinement-card fill |
| `--line` | `#262626` | Dividers | Topbar/footer rules, card borders, progress track |
| `--ink` | `#F4F4F4` | Primary foreground | Headlines, brand, button labels, primary card labels |
| `--muted` | `#8D8D91` | Secondary foreground | Help text, metadata, quiet controls, loading notes |
| `--red` | `#E50914` | Brand/action accent | Primary buttons, eyebrow labels, selection, progress, score badge, glowing dots |

### Existing supporting colors

These values are present in the stylesheet but are not yet named as tokens.

| Exact value | Current use | Recommended semantic name |
|---:|---|---|
| `#FF101C` | Primary-button hover | `--red-hover` |
| `#120204` | Selected and refinement-hover card fill | `--red-tint` |
| `rgba(229, 9, 20, .55/.65/.75/.9)` | Red glows | `--red-glow-*` by intensity |
| `#111111` (`#111`) | Interactive card hover; poster fallback; image gradient edge | `--panel-hover` |
| `#0C0C0C` | Poster offset shadow | `--poster-shadow` |
| `#151515` / `#101010` | Landing orbit rings | Decorative near-black lines only |
| `#171717` | Loading track | Track surface |
| `#242424` | Loader ring | Loader outline |
| `#292929` | Runtime slider remainder | Slider inactive track |
| `#2C2C2C` | Landing orbit numerals | Decorative low-emphasis text |
| `#363636` / `#373737` | Secondary-button and result-tag borders | Elevated border |
| `#505054` | Landing footer | Lowest-emphasis copy |
| `#56565B` / `#57575B` / `#57575A` | Choice numbers, refine numbers, credits | Low-emphasis copy |
| `#5D5D5D` | Answer-card hover/focus border | Interactive border |
| `#666666` | Runtime scale and availability note | Tertiary copy |
| `#777777` | Secondary-button hover border, credit links, placeholder text | Strong tertiary copy/border |
| `#AAAAAA` (`#aaa`) | Landing supporting line, retake, actor-number overlay | Supporting copy |
| `#B8B8BB` | Result-tag text | Tag copy |
| `#D2D2D4` | Recommendation rationale | Long-form result copy |
| `#FFFFFF` (`#fff`) | Score-badge text | Text on red only |
| `rgba(255, 255, 255, .12)` | Poster inset keyline | Image edge definition |
| `rgba(0, 0, 0, .75)` | Actor number overlay | Text overlay backing |

### Color rules

1. Keep the page canvas pure black and reserve red for brand identity, progress, selection, and the primary action.
2. Use `--ink` for information that must be read first and `--muted` for context or guidance.
3. Use near-black surface changes and fine borders—rather than shadows or rounded containers—to create hierarchy.
4. Use red-tinted fills only for a selected choice or a clearly actionable hover state.
5. Do not add additional brand hues. Poster and cast imagery supply the broader color range.

## 3. Typography

### Families

- **Display/UI emphasis:** `Space Grotesk`, weights `500`, `600`, and `700`.
- **Body/UI default:** `DM Sans`, weights `400`, `500`, and `600`.
- **Fallback:** `system-ui, sans-serif` for body; `sans-serif` for Space Grotesk roles.
- **Source:** Google Fonts import in `dist/styles.css`.

### Existing type roles

| Role | Existing specification | Usage |
|---|---|---|
| Landing wordmark | `Space Grotesk`; `clamp(5rem, 15vw, 11rem)`; line-height `.76`; tracking `-.055em` | `CineMatch`; “Match” is red |
| Result title | `Space Grotesk`; `clamp(4rem, 8vw, 8.2rem)`; line-height `.82`; tracking `-.055em` | Movie title |
| Refinement title | `Space Grotesk`; `clamp(3rem, 7vw, 6.2rem)`; line-height `.92` | Bonus-round prompt |
| Question title | `Space Grotesk`; `clamp(2.65rem, 6vw, 5.2rem)`; line-height `.98`; max-width `820px` | Each quiz question |
| Loading title | `Space Grotesk`; `clamp(2.5rem, 5vw, 4.6rem)` | Matching transition |
| Runtime value | `Space Grotesk` `700`; `clamp(4rem, 10vw, 7rem)`; line-height `.8`; tracking `-.08em` | Minute readout |
| Brand | `Space Grotesk` `600`; `1.06rem/1`; tracking `-.03em` | Header brand |
| Eyebrow | `Space Grotesk` `600`; `.76rem/1`; tracking `.16em`; uppercase; red | Rounds and section state |
| Progress label | `Space Grotesk` `500`; `.78rem/1`; tracking `.11em` | `02 / 06` |
| Card title | `Space Grotesk` `600`; `1rem/1.2` | Answer titles |
| Refinement-card title | `Space Grotesk` `600`; `1.08rem/1.2` | Bonus choices |
| Body/help | `DM Sans` `400`; `1rem` | Question guidance and supporting copy |
| Recommendation rationale | `DM Sans` `400`; `1.08rem/1.65`; `#D2D2D4` | Explanation of the match |
| Metadata | `DM Sans` `400`; `.92rem`; muted | Year, runtime, genres |
| Card description | `DM Sans` `400`; `.85rem/1.3`; muted | Choice subtitles |
| Microcopy | `.69rem–.84rem` | Credits, scales, tags, footer prompts |

### Typography rules

1. Use Space Grotesk for headlines, labels, key values, and choice titles; use DM Sans for explanatory sentences and metadata.
2. Headlines use tight negative tracking and compact line height. Body copy uses normal tracking and more generous line height.
3. Eyebrows are always short, uppercase, red, and widely tracked. In the quiz they combine progress and context: `ROUND 02 · SET THE MOOD`.
4. Keep question titles phrased as direct questions. Keep descriptions to one brief sentence.
5. Retain fluid `clamp()` sizing for large type rather than fixed desktop/mobile sizes.

## 4. Spacing and sizing

The stylesheet does not define spacing tokens, but it consistently works from a compact set of values. Standardize the existing rhythm rather than introduce a new one.

### Recommended spacing scale derived from current values

| Step | Value | Existing examples |
|---|---:|---|
| `space-1` | `7–8px` | Card title-to-subtitle gap; result-tag gap |
| `space-2` | `10–12px` | Grid/action gaps; brand gap; runtime label gap |
| `space-3` | `14–18px` | Tag padding, help offsets, mobile card padding |
| `space-4` | `20–26px` | Desktop card padding, header/footer vertical padding, section details |
| `space-5` | `30–38px` | Question help-to-options, result tags/actions, runtime divisions |
| `space-6` | `42–54px` | Major section separation |
| `space-7` | `62–76px` | Large layout gaps and header height |

### Structural dimensions

- App shell: `min(1120px, calc(100% - 48px))`, centered.
- Mobile shell at `≤760px`: `min(calc(100% - 28px), 1120px)`.
- Header: `76px` desktop, `68px` mobile.
- Quiz content: max-width `900px`; vertical padding `48px 0 62px` desktop, `34px 0 46px` mobile.
- Result copy: max-width `580px`; rationale max-width `550px`.
- Landing copy: max-width `820px`.
- Default answer grid: three columns, `10px` gap; two columns on mobile.
- Actor grid: six columns desktop, two columns mobile; cards are `290px` minimum desktop and `238px` minimum mobile.
- Result layout: poster column `240–390px`, content column flexible, `76px` horizontal gap; one column below `760px`.

### Shape

The interface is intentionally rectilinear. Cards, buttons, tags, images, and progress tracks use square corners. Circles are reserved for the brand dot, orbit, loader, and slider thumb. Do not introduce rounded cards or pill buttons.

## 5. Buttons and controls

### Primary button

- Red fill `#E50914`.
- No visible border (`1px transparent` keeps sizing aligned).
- Minimum width `150px`; padding `14px 18px`; weight `600`.
- Hover fill `#FF101C`.
- Used for the next decisive action: `Get started`, `Lock it in →`, `Where to watch`, or broadening an empty search.

### Secondary button

- Transparent fill; `1px solid #363636`.
- Same dimensions and weight as the primary button.
- Hover border `#777777`.
- Used for the alternate result action: `Run it again`.

### Quiet text buttons

- Transparent, borderless, muted text with `10px 0` padding.
- Hover changes text to `--ink`.
- Used for `Restart`, `← Back`, `Keep this result`, and `Restart from the beginning ↗`.
- Disabled Back uses `opacity: .25` and the default cursor.

### Answer cards

- Default: `#0B0B0B` fill, `#262626` border, minimum height `104px`, `20px` padding.
- Hover/focus-visible: `#111111` fill, `#5D5D5D` border.
- Selected: `#120204` fill, `#E50914` border, red choice number.
- Title is primary; subtitle is muted; a two-digit index precedes both.
- Selecting a card visibly marks it, then advances after `180ms`.

### Refinement cards

- Same surface and border language as answer cards.
- Existing hover/focus: `translateY(-3px)`, red border, red-tinted fill.
- Taller (`156px`) to support three levels: number, command title, explanatory line.

### Runtime slider

- Range: `75–180` minutes in `5`-minute steps; initial value `115`.
- Track: `3px`; red before the thumb and `#292929` after it.
- Thumb: red circular control with a black cutout border and red glow.
- Large numeric readout pairs the value with a red uppercase `MINUTES` label.
- Confirmation is explicit (`Lock it in →`), unlike auto-advancing choice cards.

## 6. Cards, tags, and information containers

- Choice cards use border and subtle fill contrast rather than elevation.
- Result tags are compact square-cornered outlines: `7px 10px` padding, `#373737` border, `#B8B8BB` text, `.78rem`.
- Empty and loading states occupy the full grid width, use a `#262626` border, and center their message vertically.
- The poster is not a conventional card: it uses a `2:3` aspect ratio, clipped artwork, a one-pixel inset keyline, and an offset `#0C0C0C` block shadow (`22px` desktop, `10px` mobile).
- The match score is a red rectangular badge over the poster, not a circular gauge.

## 7. Inputs and states

The current application has one form input (the runtime range) and button-based choices. The reusable state model is:

- **Default:** dark surface, hairline border, primary title, muted support text.
- **Hover:** stronger border or red primary-button fill; actor portraits move from grayscale to color.
- **Keyboard focus:** answer and refinement cards share their hover treatment through `:focus-visible`.
- **Selected:** red border plus red-tinted background; actor portrait stays in color.
- **Disabled:** reduced opacity (`.25`) and non-interactive cursor.
- **Loading:** animated red ring and moving red progress segment, with short status copy.
- **Empty:** bordered centered explanation plus one red recovery action.
- **Error:** currently expressed as updated loading-note text, followed by an available Restart control.

Selection and navigation should never rely on color alone: retain card borders, text labels, numbering, and explicit progress.

## 8. Imagery and media

### Movie posters

- Source: catalog `posterUrl` values from TMDB records.
- Presentation: full-bleed, `object-fit: cover`, fixed `2:3` ratio.
- Alt text pattern: `{Movie title} movie poster`.
- Attribution appears below the result and must remain visible.

### Cast portraits

- Adaptive portraits come from verified catalog data; static fallback portraits use Wikimedia Commons.
- Presentation: cropped with `object-fit: cover`, `210px` high desktop and `170px` mobile.
- Default treatment: `grayscale(1) contrast(1.06)`.
- Hover/selected treatment: full color and `scale(1.025)` over `.3s`.
- Missing-image fallback: initials centered on a dark radial gradient.
- The two-digit option number sits over imagery on an `rgba(0,0,0,.75)` backing.

### Repository artwork

`dist/assets/cinematic-night.png` exists in the repository but is not referenced by the current HTML, CSS, or JavaScript. It is not part of the live visual language and should not become a standard unless it is deliberately integrated in a future change.

## 9. Iconography and marks

- The brand mark is a `10px` red dot with a soft red glow.
- The favicon is an inline SVG: black rounded-square field, red ring, and red play triangle.
- Navigation uses text arrows (`→`, `←`, `↗`) rather than an icon library.
- Loading uses CSS geometry: a circular outline, rotating red arc, and glowing red center.
- No general-purpose icon set exists. Continue using sparse text symbols for simple direction; add an icon library only when a larger, consistent icon vocabulary is actually needed.

## 10. Motion and interaction behavior

- Landing orbit: continuous `22s linear` rotation.
- Loading ring: `1s linear` spin.
- Loading bar: `1.25s ease-in-out` sweep.
- Answer-card state: `.16s ease` for border and background.
- Refinement-card state: `.18s ease` for transform, border, and background.
- Actor image: `.2s` filter and `.3s` transform.
- Quiz progress: `.35s ease` width transition.
- View changes scroll smoothly to the top.
- `prefers-reduced-motion: reduce` reduces all animation durations to `.01ms`, one iteration, and removes transitions.

Motion should indicate progress, selection, or a lightweight game feel. It should not add ambient movement beyond the existing landing orbit and loading state.

## 11. Layout conventions and key screens

### Global shell

Every view lives inside the same centered `1120px` shell. A persistent topbar contains the brand at left and a quiet Restart action at right. A single one-pixel divider anchors the header.

### Landing

- Centered hero inside a minimum `650px` field.
- Oversized `CineMatch` wordmark with `Match` in red.
- Three concentric, very-low-contrast orbit rings and one moving red point.
- One-line proposition, one red CTA, and tiny bottom microcopy.

### Quiz rounds

- Progress line and `NN / 06` counter above the content.
- Left-aligned eyebrow, large question, one-line help, then controls.
- Three-by-two option grid for standard rounds; six-across portraits for actors.
- Footer rule with Back at left and `Pick instinctively.` at right.
- Only one answer per round; choice cards auto-advance.

### Matching

- Vertically and horizontally centered.
- Loader mark, red eyebrow, large title, short progress bar, and one status sentence.
- A minimum `700ms` delay prevents the transition from flashing by too quickly.

### Recommendation result

- Two-column editorial composition: poster left, recommendation narrative right.
- Hierarchy: red eyebrow → oversized title → muted facts → rationale → match tags → actions → availability note → restart.
- Credits span the full shell below both columns.
- Mobile collapses to one column and limits the poster to `min(58vw, 240px)`.

### Bonus refinement

- Large left-aligned title and explanatory sentence.
- Three-by-two grid of six directional reroll options.
- One quiet escape route: `← Keep this result`.

## 12. Voice and copy

### Voice principles demonstrated in the repo

- **Direct:** `How much time do you have?`
- **Situational:** repeatedly anchors the interaction to “tonight” and “your night.”
- **Playful but controlled:** `Who has the remote?`, `CAST YOUR VOTE`, `Go off-script`.
- **Specific:** `Smart over silly`, `Atmosphere first`, `More momentum, less setup`.
- **Reassuring:** `Your original answers stay locked.`
- **Transparent:** clearly labels unavailable live integrations and fixture-backed behavior.

### Copy construction rules

1. Eyebrow: uppercase stage/context label, usually two short clauses joined by `·`.
2. Headline: a plain-language question or confident state, ideally under eight words.
3. Help line: one sentence that explains the decision without exposing ranking mechanics.
4. Choice title: two to four words, often a natural spoken answer.
5. Choice subtitle: a concise emotional or behavioral clarification.
6. CTA: verb-first and concrete (`Get started`, `Lock it in`, `Run it again`).
7. Recommendation reason: explain why the movie fits the user's signals; avoid generic praise.
8. System copy: be candid about missing data or integrations and always offer a recovery route.

Prefer “movie” in user-facing prose, reserving “film” for the landing tagline's editorial flavor. Prefer “match” over “result” when speaking to users.

## 13. Accessibility conventions already present

- Semantic `main`, `header`, `section`, `footer`, buttons, links, and a range input.
- Views use `hidden`; dynamic stages use `aria-live="polite"`.
- Decorative orbit and loader elements use `aria-hidden="true"`.
- Brand link has an explicit accessible label.
- Range input has an accessible label.
- Poster alt text is generated from the movie title.
- Keyboard focus is intentionally styled on answer and refinement cards.
- Reduced-motion support is implemented globally.
- Minimum supported viewport width is `320px`.

## 14. Current inconsistencies and selected standards

These recommendations consolidate patterns already present in the implementation; they do not introduce a new design direction.

| Inconsistency | Current evidence | Existing pattern to standardize |
|---|---|---|
| Too many near-identical grays | `#56565B`, `#57575B`, and `#57575A`; `#363636` and `#373737`; multiple low-contrast copy grays | Keep semantic tiers: `--ink`, `--muted`, one tertiary text value (`#666`), one low-emphasis value (`#57575B`), `--line`, interactive border `#5D5D5D`, and elevated border `#373737`. Replace neighboring duplicates with the selected tier. |
| Supporting colors are hard-coded | Only six root tokens exist; hover, selection, tag, and tertiary values are repeated inline | Extend the existing CSS-variable approach. Preserve current exact values while naming them semantically. |
| Focus coverage is incomplete | Answer/refinement cards have `:focus-visible`; primary, secondary, quiet buttons, links, slider, and `<summary>` do not | Make the answer-card focus treatment the standard: a clearly visible border/outline using existing red or `#5D5D5D`, with no layout shift. |
| Two card-hover models | Answer cards use gray border/no movement; refinement cards move up and turn red | Standard cards should use the calmer answer-card hover. Reserve the red border and `translateY(-3px)` treatment for refinement/reroll choices, where changing direction is the point. |
| Actor-card dimensions override only some base behavior | Actor cards inherit `min-height`, border, and selected state but replace padding and image behavior | Treat actor card as an explicit answer-card variant with the same border/state rules and its own image/layout dimensions. |
| Grid display is manipulated inline | Runtime and empty states switch `answerGrid.style.display` between `block` and `grid` | Keep `.answer-grid` for option collections and introduce existing-language layout variants/classes for single controls and empty states; avoid inline layout state. |
| Error state is visually indistinguishable from loading | Failure rewrites `.loading-note` while the animated loading UI remains visible | Reuse the existing `.adaptive-empty` bordered recovery pattern for recommendation failures, paired with Restart. |
| Link states are under-specified | Credit links have color but no consistent hover/focus treatment | Use the quiet-control convention: muted/tertiary by default, `--ink` on hover, and the standard visible focus treatment. |
| Primary button lacks active/disabled rules | Only default and hover are implemented | Derive active/disabled states from existing patterns: selected red-tint/stronger red for pressed feedback; `.25` opacity and default cursor for disabled. Do not introduce a new color family. |
| External-link arrows are inconsistent | `Restart from the beginning ↗` is internal, while actual external attribution links have no marker | Reserve `↗` for external destinations; use `↻` or plain `Restart from the beginning` for the internal restart action. |
| “Film” and “movie” alternate | Landing eyebrow says `ONE FILM`; most product text says `movie` | Use `movie` for product/UI clarity; retain `ONE FILM. ZERO SCROLLING.` as a brand tagline if desired. |
| Asset inventory includes an unused hero image | `dist/assets/cinematic-night.png` is committed but not referenced | The live no-photo landing composition is the standard. Remove/archive the unused asset later or deliberately document its role before use. |
| Remote font loading has no local fallback matching metrics | Google Fonts are imported; generic fallbacks can shift layout | Keep the current stacks as canonical, but self-host the same font files in production if reliability or privacy requires it. Do not substitute new families. |
| Desktop layout leaves large right-side whitespace at 1280px screenshots | Shell is capped at `1120px`, while primary content is intentionally narrower (`900px`) | Preserve this editorial left/center composition. Do not stretch cards to fill the viewport; use the existing max-width hierarchy consistently. |

## 15. Reusable implementation rules

1. Start every screen inside `.app-shell` and retain the persistent topbar.
2. Use one red eyebrow and one dominant Space Grotesk headline per screen.
3. Limit each screen to one visually primary action.
4. Use the three-column answer grid for six text choices and the six-column actor variant for portrait choices; collapse both to two columns at `760px`.
5. Use two-digit numbering for rounds and choices (`01`, `02`, …).
6. Keep cards square, flat, and separated by `10px` gaps.
7. Use red to indicate progress, selection, brand, or the primary action—not decoration everywhere.
8. Let imagery become colorful only when it is selected, hovered, or central to the result.
9. Keep secondary and legal information low-contrast but readable; preserve all required TMDB and JustWatch attribution.
10. Pair every waiting, empty, or error state with candid copy and a clear next action.
11. Respect reduced-motion preferences for every new transition.
12. New UI should first reuse the current tokens, typography roles, card states, and button hierarchy before adding a variant.

## 16. Canonical design decisions

For future implementation work, the following existing patterns should be treated as the source of truth:

- **Palette:** the six `:root` tokens in `dist/styles.css`, extended only with semantic names for existing hard-coded values.
- **Type:** Space Grotesk for display/emphasis; DM Sans for prose and support.
- **Geometry:** square cards and buttons; circles only for progress/brand controls.
- **Interaction:** gray hover for ordinary answers, red selected state, explicit red primary action.
- **Layout:** centered `1120px` shell, narrower editorial content widths, single `760px` responsive breakpoint.
- **Imagery:** grayscale cast choices that reveal color; full-color `2:3` result poster.
- **Voice:** short, situational, confident prompts tied to the user's immediate movie night.
- **Product behavior:** one question at a time, six rounds, one recommendation, optional focused refinement.

This is the CineMatch visual language already in the repository. The next step is consolidation—tokenizing it, filling state gaps, and applying it consistently—not redesigning it.
