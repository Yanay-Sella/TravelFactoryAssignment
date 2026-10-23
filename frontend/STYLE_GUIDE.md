# Frontend style guide — alpine theme

Reference for anyone (human or AI assistant) adding UI to this frontend. Follow it so new
screens look like the ones that already exist.

**Stack:** Vue 3 `<script setup>` + TypeScript + Tailwind CSS v4 (CSS-first config) + Vue Router
+ Pinia. No UI kit, no CSS-in-JS, no extra styling dependency — do not add one.

**Single source of truth:** [src/style.css](src/style.css). All tokens and component classes are
defined there in `@theme` and `@layer components`. Read it before styling anything.

---

## 1. Design direction

Playful, premium "3D cartoon" ski theme: bright sky-blue gradients, icy whites, coral accents,
large rounded shapes, soft layered shadows, gentle floating motion. Professional first — this is
an internal booking/approval tool, so decoration must never get in the way of reading a form or a
table.

---

## 2. Tokens

Never hardcode a hex colour, radius, shadow or font in a component. Use these.

### Colour

| Scale | Meaning | Typical use |
| --- | --- | --- |
| `powder-50…900` | Brand sky blue | Backgrounds, hero gradients, links, active nav, focus rings |
| `frost-50…900` | Icy neutral | Text (`frost-900` headings, `frost-700` body, `frost-500` muted), borders (`frost-200`) |
| `coral-50…700` | Warm accent | Primary call-to-action only — keep it rare so it stays loud |

Use Tailwind's built-in `amber` / `emerald` / `rose` **only** for request status and errors.
Do **not** use `slate`, `gray`, `zinc` or `blue` — `frost` and `powder` replace them.

### Type

- `--font-sans` → Nunito (body, set on `body`).
- `--font-display` → Baloo 2 (`h1`–`h3` get it automatically; use `font-display` elsewhere).
- Both load from Google Fonts in [index.html](index.html).
- Page title `text-3xl`/`text-4xl`, section `text-2xl`, card `text-lg`. Headings carry weight on
  their own — do not add `font-semibold` to an `h1`.

### Shape, depth, motion

- Radii: `rounded-card` (1.5rem, panels/sections), `rounded-tile` (1.125rem, inputs/small tiles),
  `rounded-full` (buttons, pills, avatars). Avoid sharp corners.
- Shadows: `shadow-soft` (resting), `shadow-lift` (raised/hover), `shadow-glow` (coral buttons).
- Animations: `animate-float` (drifting decoration), `animate-sway` (hanging decoration),
  `animate-rise` (one-shot entrance for a page or card).
- Transitions are 200–300ms. A global `prefers-reduced-motion` rule in `style.css` disables all of
  it — never work around that.

---

## 3. Component classes

Prefer these over re-assembling utility chains, and extend them in `style.css` rather than
inventing a local variant.

| Class | Purpose |
| --- | --- |
| `.card` | Standard translucent white panel with border and soft shadow |
| `.card-hover` | Add to `.card` for the lift-on-hover interaction |
| `.icon-tile` | 48px gradient tile holding a 24px stroke icon |
| `.eyebrow` | Small uppercase tracked label above a heading |
| `.btn` | Base button: shape, weight, transition, focus ring, disabled state |
| `.btn-primary` | `.btn` + coral gradient. **One per screen** — the main action |
| `.btn-ghost` | `.btn` + outlined white. Secondary actions |
| `.field-label` / `.field-input` | Form label and input |
| `.pill` + `.pill-pending` / `.pill-approved` / `.pill-rejected` | Status badges, mapped 1:1 to `VacationStatus` |
| `.nav-link` / `.nav-link-active` | Header navigation (`active-class` on `RouterLink`) |

Buttons always combine: `class="btn btn-primary"`.

---

## 4. Shared components

In [src/components/](src/components/):

- **`AppBackdrop.vue`** — fixed, decorative, `aria-hidden`, `-z-10`. Rendered once in
  [App.vue](src/App.vue) and sits behind every route. Do not add a second one, and do not give
  views their own opaque background colour or they will cover it.
- **`PageHero.vue`** — blue gradient page header. Props `eyebrow`, `title`, `subtitle`; slots
  `#actions` and `#aside` (aside is desktop-only). Use it as the first element of a signed-in page.
- **`MountainMark.vue`** — logo mark. Prop `size` (px).

Add a component here only when a second screen needs it. Local, single-use markup stays in its
view.

---

## 5. Page layout

Signed-in pages follow this shape:

```vue
<section class="mx-auto max-w-6xl animate-rise space-y-6 px-4 py-8">
  <PageHero eyebrow="…" :title="…" :subtitle="…">
    <template #aside>…</template>
  </PageHero>

  <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
    <div class="card card-hover p-6 sm:p-8">…</div>
    <div class="card p-6 sm:p-8">…</div>
  </div>
</section>
```

- Container: `mx-auto max-w-6xl px-4` (the header uses the same width).
- Vertical rhythm with `space-y-6`; card padding `p-6 sm:p-8`.
- Mobile-first: single column by default, `sm:` / `lg:` to widen. Never produce horizontal scroll.

---

## 6. Illustrations

Inline SVG only — there are no raster assets and none should be added. Cartoon style: bold simple
shapes, white snow caps, gradient fills built from `powder` / `coral` token values, no outlines.
Mark every decorative SVG `aria-hidden="true"`. Icons are 24×24 stroke paths at
`stroke-width="2"`, `stroke-linecap="round"`, drawn with `currentColor`; keep the path data in a
small array in `<script setup>` and `v-for` over it instead of repeating markup.

---

## 7. Rules

1. Preserve behaviour. Restyling must not change auth, routing, API calls or business logic.
2. Never invent data. Placeholder screens stay honest — no fake counts, names or rows.
3. Keep accessibility: real `<label for>`, `role="alert"` on errors, visible focus rings (the
   `.btn` focus ring is deliberate), and text contrast of `frost-700`+ on light surfaces.
4. Mind layering: `AppBackdrop` is `-z-10`, the sticky header `z-30`.
5. Match existing code style — tabs, `<script setup lang="ts">`, typed props, arrow functions,
   and comments kept to one line.
6. After a UI change run `npm run build` (it type-checks with `vue-tsc` first).
