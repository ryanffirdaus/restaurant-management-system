# Servio Ops — Design System

Palette and component rules for the Servio frontend (`apps/frontend`). Tokens live in
`tailwind.config.js` and `src/styles/global.css`; status mapping lives in `src/lib/status.ts`.

## 1. Who uses Servio

Inferred from the four roles in the app (`admin`, `waiter`, `kitchen`, `cashier`), the IDR pricing and
the screens each role sees.

| Persona | Device & setting | What they need from the UI |
|---|---|---|
| **Manager / owner** (`admin`) | Laptop in the back office, sometimes a phone on the floor. Long sessions reviewing revenue, menu, staff. | Numbers that scan fast, calm surfaces for long sessions, clear confirmation before destructive actions. |
| **Waiter** (`waiter`) | Android phone, one hand, walking between tables. Dim dining room at night, bright patio by day. | Big tap targets (≥ 44px), table status readable at a glance, an unmistakable "food is ready" signal. |
| **Kitchen** (`kitchen`) | Tablet mounted by the line, read from 1–2 m away. Bright overhead light, heat, wet or greasy hands. | Very high contrast, large type, three unmistakable ticket states (queued / cooking / ready), ticket-age warnings. |
| **Cashier** (`cashier`) | Counter tablet or POS, queue pressure, handling cash and QRIS. | Large totals, an obvious confirm action, payment method selection that can't be misread, loud errors. |

### What that means for colour

1. **Status is the core information.** Every persona's main job is reading a status: order, item or table. Status
   colours are distinct hues, and they mean the same thing on every screen and in every theme.
2. **Never colour alone.** About 1 in 12 men has red–green colour blindness. Status always comes with an icon and a
   label (`<StatusPill>`). The status hues stay distinguishable under deuteranopia and protanopia simulation.
3. **One action colour.** Staff under pressure should never hunt for the button. One colour marks the single action
   that moves work forward on each screen.
4. **Colour in the chrome, not just the accents.** A pure black/white UI felt cold for a restaurant, so the sidebar,
   app headers and welcome banner carry the brand blue.

## 2. Palette — Navy & Ice Blue

Deep navy chrome, a cool neutral page and an ice-blue accent. Chosen after a brighter cobalt + yellow version felt too
loud: navy is calm for long shifts, and keeping the accent to the chrome lets status colours and food photos stand out.

Tokens are CSS variables (RGB triplets) in `src/styles/global.css` (`:root`), consumed by Tailwind (`bg-surface`,
`text-ink-2`, `bg-ready/10`, …). Opacity modifiers work. To re-theme later, change the values there only, then restart
the dev server (Tailwind does not rebuild on config/token changes during HMR).

### Surfaces & text

| Token | Hex | Use |
|---|---|---|
| `canvas` / `bg-background` | `#f3f6fa` | Page background |
| `surface` | `#ffffff` | Cards, panels, modals, top navbar |
| `raised` / `surface-variant` | `#eaeff6` | Hover, inputs, secondary buttons, selected rows |
| `line` / `outline` | `#dce3ee` | Borders, dividers |
| `line-strong` | `#bcc7d8` | Input borders, outline buttons |
| `ink` / `text-main` | `#0f1a2e` | Primary text |
| `ink-2` / `text-muted` | `#47546b` | Secondary text (7.6:1) |
| `ink-3` | `#66728a` | Captions, placeholders (4.8:1) |

### Action

| Token | Hex | Use |
|---|---|---|
| `brand` | `#1f3b6e` navy | Primary button fill, one per screen (white text, 11:1) |
| `brand-hover` | `#172e57` | Primary hover |
| `brand-foreground` | `#ffffff` | Text on primary |
| `brand-ink` | `#1f4f96` | Links, selected tabs/borders, focus ring (8:1) |

### Chrome (admin sidebar, waiter/kitchen/cashier headers, welcome banner)

| Token | Hex | Use |
|---|---|---|
| `sidebar` | `#14203a` | Sidebar and app header background |
| `sidebar-raised` | `#1f2e4f` | Active / hover item, banner gradient start |
| `sidebar-line` | `#22314f` | Dividers on chrome |
| `sidebar-ink` / `sidebar-ink-2` | `#eef3fb` / `#98a8c4` | Text on chrome |
| `sidebar-accent` / `sidebar-accent-fg` | `#7cc4f5` ice blue / `#0c1a2e` | Logo "o", active marker, live badge, banner button |

The ice-blue accent only appears on navy chrome. Status chips that sit on chrome use a white (`bg-surface`) chip with
the status text colour.

### Status

| Token | Hex | Order | Item (kitchen) | Table |
|---|---|---|---|---|
| `pending` | `#1d6fd1` | pending | queued | — |
| `progress` | `#bf4f17` | preparing | cooking | occupied |
| `ready` | `#0b7f5b` | ready | ready | available |
| `reserved` | `#6a4bd6` | — | — | reserved |
| `danger` | `#c4213d` | cancelled | late ticket | — |
| neutral (`ink-3`) | `#64739a` | completed | — | cleaning |

Kitchen ticket age: fine → neutral, warning → `progress`, late → `danger`.

## 3. Component rules

- **Button**: `primary` (saffron, one per screen), `secondary` (raised fill), `outline`, `ghost`, `danger`.
  Default height 44px (`md`); use `lg` (56px) for the main action in waiter/kitchen/cashier.
- **StatusPill**: the only way to show a status. `soft` tinted fill, coloured border, icon and label.
- **Cards**: `bg-surface border border-line rounded-xl`. Status cards (tickets, tables) add a 3–4px top or left bar in
  the tone's `solid` colour instead of tinting the whole card.
- **Inputs**: `bg-raised` or `bg-background`, `border-line-strong`, 44px tall, saffron focus border.
- **Numbers**: money, counts and timers use `.num` (tabular figures) and `font-semibold`.
- **Type size floor**: 12px everywhere. In waiter / kitchen / cashier, body text is 14–16px and ticket or table
  numbers are 20px or larger.
- **Radius**: 6px controls, 12px cards, 16px modals.
- **Shadow**: none on the page. `shadow-pop` only for floating layers (dropdown, modal, toast).
- **Sidebar** uses its own `sidebar-*` tokens (`bg-sidebar`, `text-sidebar-ink`, `bg-sidebar-accent`), so it can be coloured differently from the page.
- **Motion**: 150 ms colour transitions. `status-pulse is-live` only for things that need attention now (ready food,
  new orders).

## 4. Logo

Wordmark "Plate": lowercase `servio` in Outfit ExtraBold, with the final "o" in the accent colour as a plate. The letters are
vector outlines, so no font needs to load. Outfit is licensed under the SIL Open Font License 1.1, which allows logo use.

| File (`apps/frontend/public/`) | Use |
|---|---|
| `logo-wordmark-dark.svg` | White + ice blue `#7cc4f5`, for navy chrome (sidebar, waiter/kitchen/cashier headers) |
| `logo-wordmark.svg` | Navy `#14203a` + blue `#2f7fc4`, for white or light backgrounds (login) |
| `logo.svg` | Square app icon / favicon: white "s" and an ice-blue dot on a navy tile |

Keep clear space of at least the height of the "o" around the wordmark. Minimum height is 20px on screen.

## 5. Menu imagery

Sample photos for the seeded menu live in `apps/frontend/public/menu/`, with credits and licences in
`public/menu/CREDITS.md`. Images render at 4:3 with `object-cover`; if an item has no image, show the category icon on
`bg-raised`.
