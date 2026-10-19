---
name: Dental VOI
description: A pine claim ticket on blotter green, with an amber review tick.
colors:
  ground: "#e7efe9"
  paper: "#f4f7f5"
  ink: "#1a1f1c"
  ink-soft: "#3d4a43"
  pine: "#16352b"
  pine-deep: "#0e241d"
  line: "#c5d4cb"
  rule: "#16352b"
  review: "#f6e2b8"
  review-ink: "#1a1f1c"
  amber: "#9a6410"
  danger: "#8c2f2a"
  danger-paper: "#f8ecea"
  focus: "#16352b"
  rail: "#f4f7f5"
typography:
  display:
    fontFamily: '"Public Sans", "Segoe UI", sans-serif'
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: '"Public Sans", "Segoe UI", sans-serif'
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: '"Public Sans", "Segoe UI", sans-serif'
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: '"Public Sans", "Segoe UI", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: '"Public Sans", "Segoe UI", sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 600
    letterSpacing: "0.01em"
  bar:
    fontFamily: '"Public Sans", "Segoe UI", sans-serif'
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.08em"
rounded:
  none: "0px"
spacing:
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "20": "20px"
  "24": "24px"
  "48": "48px"
components:
  button-primary:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.pine-deep}"
    textColor: "{colors.paper}"
  button-primary-disabled:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.none}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
  button-danger:
    backgroundColor: "{colors.danger-paper}"
    textColor: "{colors.danger}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
    height: "44px"
  input-extracted:
    backgroundColor: "{colors.review}"
    textColor: "{colors.review-ink}"
    rounded: "{rounded.none}"
    padding: "10px 12px"
    height: "44px"
  input-lead:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
    height: "80px"
  panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  panel-bar:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.paper}"
    typography: "{typography.bar}"
    padding: "12px 20px"
  rail-review:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.review}"
    typography: "{typography.display}"
    padding: "24px 12px"
    width: "4.75rem"
  table-header:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    padding: "12px"
---

# Design System: Dental VOI

## Overview

**Creative North Star: "Claim ticket"**

A verification is one ticket on a blotter-green desk. A pine rail names the ticket state, a paper header carries the title and the actions, and paper panels sit under a 1px rule. Public Sans does every job. Only two lines enlarge: the rail's review count and the subscriber name.

The ticket refuses the equal-card admin form and the spreadsheet costume. Depth is tonal. Blotter green is the ground, ticket paper is the panel, and pine is the structure: the rail, the panel bar, the rule, and the single primary action. Amber marks a field extract filled and a person has not yet edited. Corners are square. Nothing casts a shadow.

Light is the default theme. Dark mode reassigns the same custom properties: the blotter and the pine shell go near-black, paper becomes a deep green panel, and the rail's words turn light amber. The direction asked for one column across identity, money, and co-insurance. The shipped field grid is one column below 720px, two columns from 720px, and four from 1100px. This record follows that grid.

**Key Characteristics:**

- Blotter green ground, pine shell, and paper panels under a 1px rule
- Square corners and flat, shadowless surfaces
- An amber review tick on extracted fields still waiting for a person
- Public Sans, self-hosted, at 400, 600, and 700
- Large type only on the rail count and the subscriber value
- A sticky pine rail beside a single work column

## Colors

The palette is a green desk: blotter ground, pine structure, paper fields, and one amber tick for unconfirmed extract. Frontmatter values are the light theme on `:root`.

### Primary

- **Pine Shell** (`pine`, #16352b): The rail, the panel bar, the primary button, the caret, and the thin scrollbar. In light, the panel rule and the focus ring use this same pine.
- **Deep Pine** (`pine-deep`, #0e241d): Hover fill of the primary button in light.

### Secondary

- **Review Amber** (`review`, #f6e2b8): Fill of a field extract has written and nobody has edited yet. Also the text-selection fill. During review, the rail's words and count are this light amber on pine in both themes (`#f6e2b8` is set on the review rail directly; it matches `review` in light and `rail` in dark).
- **Amber Tick** (`amber`, #9a6410): The 1px border of that same unconfirmed field. Amber is the tick, never a button fill or a heading color.
- **Review Ink** (`review-ink`, #1a1f1c): Text on the review fill. In light it matches Pine Ink.

### Tertiary

- **Claim Red** (`danger`, #8c2f2a): Text and border of the reset action only.
- **Danger Paper** (`danger-paper`, #f8ecea): Rest fill behind that reset action.

### Neutral

- **Blotter Green** (`ground`, #e7efe9): Page ground, secondary-button hover, and the procedure header row.
- **Ticket Paper** (`paper`, #f4f7f5): Header, panels, fields, and secondary buttons. In light, rail words use this paper on the pine shell.
- **Pine Ink** (`ink`, #1a1f1c): Body, titles, table headers, and field values.
- **Soft Pine** (`ink-soft`, #3d4a43): Field labels, help, placeholders, and the disabled primary label. It is green-cast, on the same hue as the desk.
- **Field Line** (`line`, #c5d4cb): The inner stroke of a resting field, the rule between procedure rows, and the disabled primary fill.

`rule` is the panel and header stroke. In light it is Pine Shell. `focus` is the 2px focus ring. In light it is Pine Shell. `rail` is the rail's resting word color. In light it is Ticket Paper.

### Dark theme

`html.dark` keeps every token name and replaces the value. Blotter becomes `#0c1411`, paper `#15211c`, ink `#e7efe9`, soft ink `#b7c9bf`, pine `#0a1c16`, deep pine `#07140f`, field line `#2c463b`. The rule becomes sage `#8faf9e`. Review fill becomes `#6a4a12` with review ink `#f6e2b8`. The amber tick becomes `#f0c36a`. Claim red becomes `#ffb4ac` on danger paper `#3a1816`. Focus and rail words become `#f6e2b8`.

Print drops the theme: the page goes white with black text, panel bars stay Pine Shell with white type, and the review fill is cleared so an unconfirmed field prints as an ordinary pine-ruled box.

**The Amber Tick Rule.** Review amber fills a field only while it is still unconfirmed, and the amber tick strokes that field. Editing clears the mark. Amber does not fill buttons, bars, or headings. The review rail may wear the light amber as type.

**The Pine Structure Rule.** Pine is the shell: rail, panel bar, primary action, caret, scrollbar, and, in light, the 1px rule and the focus ring. Body copy stays Pine Ink on paper or blotter.

**The Browser Surface Rule.** Selection is review fill with review ink. The caret is pine. The scrollbar is a thin pine bar on the blotter. Focus is a 2px ring, 2px outside the control: pine in light, light amber in dark.

## Typography

**Display / headline / title / body / label font:** Public Sans, self-hosted (weights 400, 600, 700), with Segoe UI and a generic sans as the fallback stack only.

**Character:** One grotesque for the whole ticket. Large lines are tight (-0.03em). The panel bar and the rail's words are the only uppercase, and they are the headings and the state, not labels sitting above a heading. Controls and the procedure table use tabular numerals.

### Hierarchy

- **Display** (700, 2.25rem, line-height 1, -0.03em): The review count in the rail. Below 720px it steps to 1.75rem. It is not uppercase.
- **Headline** (700, 1.75rem, line-height 1.2, -0.03em): The subscriber value, inside an 80px-tall lead field with 16px 24px padding. No other field uses it.
- **Title** (700, 1.5rem, line-height 1.1, -0.03em): The ticket name, "Dental VOI". The office name under it is body size at weight 600, capped at 36ch, 8px below the title.
- **Body** (400, 1rem, line-height 1.45): The page, the field values, and the status line. Help and the session note drop to 0.9375rem in Soft Pine, measured to 68ch. Buttons are 0.875rem at weight 600, line-height 1.2.
- **Label** (600, 0.8125rem, 0.01em): The name of a field, in Soft Pine, 8px above its control. Sentence case.
- **Bar** (700, 0.75rem, line-height 1.3, 0.08em, uppercase): The panel heading, paper on pine, padding 12px 20px. The rail's words are the sibling: 0.75rem, weight 600, 0.12em, uppercase (0.08em when the rail is horizontal).

**The Two Large Lines Rule.** The rail count and the subscriber value are the only enlarged lines. The ticket title stays at 1.5rem. Section bars and the rail's words stay at 0.75rem.

**The One Face Rule.** Public Sans is the only face, at 400, 600, and 700. Numerals on fields and in the procedure table are tabular. Segoe UI is the fallback in the stack, never a second voice.

**The Bar Is the Heading Rule.** The uppercase line in the pine bar is the section heading. Nothing sits above it. The rail's uppercase line is the ticket state, not a caption for the title.

## Layout

The ticket is a two-track shell: a sticky pine rail, 4.75rem wide and full viewport height, beside one work column (`4.75rem` / `minmax(0, 1fr)`). The rail's words run vertical, rotated so they read upward. The header is a paper band, padding 20px 24px, gap 16px 24px, with a 1px rule along its bottom. Title and office sit at the start; the actions wrap at the end, aligned to the baseline, 8px between buttons.

The work stack is padding 16px 24px 48px, with 16px between the note, the paste panel, and each section. Inside a panel, the body padding is 16px 20px and the field grid gaps 20px by 24px. A field is a column with 8px between its label and its control. Notes span the full grid.

Below 720px the shell becomes one column. The rail turns into a sticky top bar, at least 64px tall, padding 12px 20px, words horizontal, count at 1.75rem. Header and work padding tighten to 16px on the sides. From 720px the field grid is two columns and the subscriber lead occupies one cell. From 1100px the grid is four columns and the lead spans two. The procedure table keeps a 760px minimum and scrolls sideways inside its panel.

**The Ticket Shell Rule.** One pine rail, one work column, one paper header. The primary action lives in that header with the other actions. Sections stack; they do not sit in a card mosaic.

**The Widening Field Rule.** Fields are one column below 720px, two from 720px, and four from 1100px. The subscriber lead spans two columns only at the four-column step. Notes always span the row.

## Elevation & Depth

The ticket is flat. No surface carries a box-shadow. Depth is the step from blotter ground, to paper panel, to pine bar. A 1px rule (`rule`) outlines each panel and closes the header. Resting fields use the lighter field line, so the inner stroke reads quieter than the panel edge. Hover replaces a fill (primary goes Deep Pine, secondary goes blotter) and does not lift.

The only motion is the review count. When the ticket enters review, and the person has not asked for reduced motion, the count blurs in from 8px over 420ms on `cubic-bezier(0.16, 1, 0.3, 1)`. Buttons do not animate.

### Named Rules

**The Flat Ticket Rule.** Surfaces are flat at rest and flat on hover. Separation is blotter, paper, and pine. A shadow is outside this world.

## Shapes

Every corner is square: buttons, fields, panels, the rail, the header. The field control states `border-radius: 0` so a browser default cannot round it. Strokes are 1px. The select's mark is two 6px triangles drawn in the field's own ink, sitting 12px and 18px off the right edge, with 36px of padding kept clear of the value.

**The Square Rule.** Radius stays 0 on controls, bars, panels, and buttons. The select mark is a pair of square triangles in the field, not a rounded chevron and not a glyph.

## Components

Controls share a square 1px stroke, Public Sans, and a 2px pine focus ring. One button is pine. Everything else is paper until extract turns a field amber.

### Buttons

- **Shape:** Square (0 radius). Minimum height 40px. Padding 8px 16px. Weight 600 at 0.875rem. Gap between actions is 8px.
- **Primary:** Pine fill, paper type, pine border. The ticket has one: Extract, in the header. Hover fills Deep Pine. Disabled, while there is nothing to extract, uses the field line as fill and border and Soft Pine as type.
- **Secondary:** Paper fill, Pine Ink type, rule border. Copy, print, blank table, theme, load sample, and clear text. Hover fills the blotter.
- **Danger:** Danger paper fill, Claim Red type, Claim Red border. Reset only.
- **Focus:** The global 2px ring, 2px offset. Hover color changes are instant.

### Ticket header

A paper band under the rail's top edge. "Dental VOI" at title size, the office name beneath it when the record has one, and the action row on the same band. Extract is the pine button. The band is hidden as a button row in print; the title remains.

### Section panel

- **Corner style:** Square.
- **Background:** Ticket paper, full 1px rule.
- **Shadow strategy:** None. See Elevation & Depth.
- **Bar:** Pine, with the section name in the bar style. The bar is the heading.
- **Body:** Padding 16px 20px. A wide panel (the procedure list) uses the same padding and does not become a second grid.

### Inputs / Fields

- **Style:** Full width, minimum height 44px, padding 10px 12px, field-line stroke, paper fill, Pine Ink, square. The caret is pine. Placeholder is Soft Pine at weight 400.
- **Label:** Soft Pine, 0.8125rem, 600, 8px above the control.
- **Lead:** Subscriber only. 1.75rem, weight 700, minimum height 80px, padding 16px 24px.
- **Select:** Same field, native appearance removed, two ink triangles as the mark, 36px of trailing padding.
- **Textarea:** Same field, at least 3.5rem tall, vertical resize. Notes use four rows.
- **Focus:** 2px ring, 2px offset.
- **Extracted:** Review fill, review ink, amber tick for the border. The mark clears when the value changes.
- **Money:** The same field. Display is the formatted amount; focus shows the raw number.
- **Disabled:** Specified on the primary button. Fields themselves are not given a separate disabled skin.

### Procedure table

A collapse table inside the wide panel, minimum width 760px, tabular numerals. Header cells are blotter, Pine Ink, 0.8125rem, weight 700, 0.04em, uppercase, left aligned, padding 12px. Body rows are 52px tall, with a field line along the top and 8px 12px cell padding. Controls in a cell drop to a 40px minimum height and otherwise stay the field style, including the amber tick when extracted.

### Review rail

The rail is the ticket state, sticky, pine, padding 24px 12px.

- **Paste:** "Paste a sheet", paper words, small uppercase.
- **Review:** "Needs review", the display count, then "field" or "fields". The whole line is light amber. The count blurs in once.
- **Ready:** "Ready to copy", back to paper words, when the last mark is cleared.

Below 720px the same three states read horizontally in the top bar.

## Do's and Don'ts

### Do:

- **Do** fill an unconfirmed extracted field with review amber and stroke it with the amber tick, then clear both when the person edits.
- **Do** keep a single pine primary button, square, 40px tall, padding 8px 16px, and place it in the header with the paper actions.
- **Do** draw focus as a 2px ring, 2px outside the control, pine in light and light amber in dark.
- **Do** set Public Sans tabular numerals on fields and the procedure table.
- **Do** keep help and the session note in Soft Pine at 0.9375rem, within 68ch.
- **Do** theme selection, caret, and scrollbar from the palette: review selection, pine caret, thin pine scrollbar on blotter.

### Don't:

- **Don't** round a control, a bar, a panel, or a button, and don't add a shadow.
- **Don't** introduce a second typeface, a system display face, or a weight outside 400, 600, and 700.
- **Don't** enlarge any line except the rail count and the subscriber value.
- **Don't** use review amber as a button fill, a heading color, or a hover.
- **Don't** build the page from equal cards, or dress it as a spreadsheet.
- **Don't** put a kicker or an eyebrow above a heading. The pine bar is the heading.
- **Don't** stand in for an icon with a unicode glyph or an emoji. The select mark is drawn in the field's ink.
